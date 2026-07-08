import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MEMBERSTACK_SECRET_KEY = process.env.MEMBERSTACK_SECRET_KEY;
const MEMBERSTACK_API_URL = 'https://admin.memberstack.com/members';

function sanitizeClabe(clabe: unknown) {
    return String(clabe || '').replace(/\D/g, '').slice(0, 18);
}

function isValidClabe(clabe: string) {
    if (!/^\d{18}$/.test(clabe)) {
        return false;
    }

    const weights = [3, 7, 1] as const;
    const partialSum = clabe
        .slice(0, 17)
        .split('')
        .reduce((sum, digit, index) => {
            const product = Number(digit) * weights[index % weights.length];
            return sum + (product % 10);
        }, 0);

    const checkDigit = (10 - (partialSum % 10)) % 10;
    return checkDigit === Number(clabe[17]);
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Función para actualizar campos personalizados en Memberstack
async function updateMemberstackField(memberId: string, customFields: Record<string, string | boolean>) {
    if (!MEMBERSTACK_SECRET_KEY) {
        console.error('❌ MEMBERSTACK_SECRET_KEY no configurada');
        return false;
    }

    try {
        const response = await fetch(`${MEMBERSTACK_API_URL}/${memberId}`, {
            method: 'PATCH',
            headers: {
                'X-API-KEY': MEMBERSTACK_SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customFields })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error actualizando Memberstack:', response.status, errorText);
            return false;
        }

        console.log('✅ Memberstack actualizado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error en updateMemberstackField:', error);
        return false;
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET - Obtener un embajador por ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: ambassador, error } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Obtener referidos
        const { data: referrals, count: referralsCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact' })
            .eq('ambassador_id', id)
            .order('created_at', { ascending: false });

        // Contar referidos vigentes/activos (miembros aprobados con membresía activa)
        let activeReferralsCount = 0;
        if (referrals && referrals.length > 0) {
            const referredUserIds = referrals.map(r => r.referred_user_id);
            
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('memberstack_id, approval_status, membership_status')
                .in('memberstack_id', referredUserIds);

            if (!usersError && users) {
                activeReferralsCount = users.filter(u => 
                    u.approval_status === 'approved' && 
                    u.membership_status === 'active'
                ).length;
            }
        }

        // Obtener historial de pagos
        const { data: payouts } = await supabase
            .from('ambassador_payouts')
            .select('*')
            .eq('ambassador_id', id)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            success: true,
            data: {
                ...ambassador,
                referrals: referrals || [],
                referrals_count: referralsCount || 0,
                active_referrals_count: activeReferralsCount,
                payouts: payouts || []
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// PATCH - Actualizar embajador (aprobar/rechazar/suspender)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const normalizedPaymentMethod = typeof body.payment_method === 'string' ? body.payment_method.trim() : body.payment_method;
        const normalizedBankName = typeof body.bank_name === 'string' ? body.bank_name.trim() : body.bank_name;
        const normalizedClabe = sanitizeClabe(body.clabe);

        // Obtener embajador actual
        const { data: currentAmbassador, error: fetchError } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentAmbassador) {
            return NextResponse.json(
                { success: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Preparar datos de actualización
        const updateData: Record<string, unknown> = {};

        if (normalizedPaymentMethod === 'clabe' || normalizedClabe) {
            if (!normalizedBankName) {
                return NextResponse.json(
                    { success: false, error: 'Debes indicar el banco de la CLABE.' },
                    { status: 400, headers: corsHeaders() }
                );
            }

            if (!isValidClabe(normalizedClabe)) {
                return NextResponse.json(
                    { success: false, error: 'La CLABE no es válida.' },
                    { status: 400, headers: corsHeaders() }
                );
            }
        }

        if (normalizedPaymentMethod === 'pending') {
            body.payment_method = 'pending';
            body.bank_name = '';
            body.clabe = '';
        } else {
            if (body.payment_method !== undefined) {
                body.payment_method = normalizedPaymentMethod;
            }
            if (body.bank_name !== undefined) {
                body.bank_name = normalizedBankName;
            }
            if (body.clabe !== undefined) {
                body.clabe = normalizedClabe;
            }
        }

        // Cambio de status
        if (body.status) {
            updateData.status = body.status;

            if (body.status === 'approved') {
                updateData.approved_at = new Date().toISOString();
                updateData.approved_by = body.admin_id || 'admin';
            } else if (body.status === 'rejected') {
                updateData.rejection_reason = body.rejection_reason || 'Sin motivo especificado';
                updateData.rejected_at = new Date().toISOString();
                updateData.rejected_by = body.admin_id || 'admin';
            }
        }

        // Actualizar otros campos si se proporcionan
        const allowedFields = [
            'commission_percentage', 'payment_method', 'bank_name',
            'card_last_digits', 'clabe', 'rfc', 'phone', 'address',
            'instagram', 'facebook', 'tiktok', 'other_social',
            'motivation', 'profile_photo_url', 'birth_city', 'welcome_shown'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        // Ejecutar actualización
        const { data: updatedAmbassador, error: updateError } = await supabase
            .from('ambassadors')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating ambassador:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Si se aprobó, actualizar Memberstack y enviar notificación
        if (body.status === 'approved') {
            console.log(`✅ Embajador ${currentAmbassador.email} aprobado`);

            // 1. Generar token temporal para selección de código
            const selectionToken = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Válido por 7 días

            await supabase.from('ambassador_sessions').insert({
                ambassador_id: currentAmbassador.id,
                session_token: selectionToken,
                expires_at: expiresAt.toISOString()
            });

            // 2. Enviar email de bienvenida con link para elegir código
            try {
                const { notifyAmbassadorApproval } = await import('@/app/actions/ambassador-comm.actions');
                await notifyAmbassadorApproval({
                    userId: currentAmbassador.linked_memberstack_id || currentAmbassador.id,
                    email: currentAmbassador.email,
                    name: currentAmbassador.first_name,
                    selectionToken: selectionToken
                });
                console.log(`📧 Email de bienvenida enviado a ${currentAmbassador.email}`);
            } catch (emailError) {
                console.error('❌ Error enviando email de bienvenida:', emailError);
            }

            // 2. Actualizar el campo is-ambassador en Memberstack
            if (currentAmbassador.linked_memberstack_id) {
                const memberstackUpdated = await updateMemberstackField(
                    currentAmbassador.linked_memberstack_id,
                    { 'is-ambassador': 'true' }
                );

                if (memberstackUpdated) {
                    console.log(`✅ Campo is-ambassador actualizado en Memberstack para ${currentAmbassador.email}`);
                } else {
                    console.warn(`⚠️ No se pudo actualizar Memberstack para ${currentAmbassador.email}`);
                }
            } else {
                console.warn(`⚠️ Embajador ${currentAmbassador.email} no tiene linked_memberstack_id`);
            }
        }

        // Si se rechazó o suspendió, quitar el tag is-ambassador de Memberstack
        if (body.status === 'rejected' || body.status === 'suspended') {
            console.log(`❌ Embajador ${currentAmbassador.email} ${body.status === 'rejected' ? 'rechazado' : 'suspendido'}${body.rejection_reason ? ': ' + body.rejection_reason : ''}`);

            // Quitar el campo is-ambassador en Memberstack
            if (currentAmbassador.linked_memberstack_id) {
                const memberstackUpdated = await updateMemberstackField(
                    currentAmbassador.linked_memberstack_id,
                    { 'is-ambassador': 'false' }
                );

                if (memberstackUpdated) {
                    console.log(`✅ Campo is-ambassador removido en Memberstack para ${currentAmbassador.email}`);
                } else {
                    console.warn(`⚠️ No se pudo actualizar Memberstack para ${currentAmbassador.email}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: body.status === 'approved'
                ? 'Embajador aprobado correctamente'
                : body.status === 'rejected'
                    ? 'Solicitud rechazada'
                    : 'Embajador actualizado',
            data: updatedAmbassador
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador PATCH error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// DELETE - Eliminar embajador
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('ambassadors')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting ambassador:', error);
            return NextResponse.json(
                { success: false, error: 'Error al eliminar' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Embajador eliminado correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
