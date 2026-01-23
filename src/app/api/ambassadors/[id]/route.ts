import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MEMBERSTACK_SECRET_KEY = process.env.MEMBERSTACK_SECRET_KEY;
const MEMBERSTACK_API_URL = 'https://admin.memberstack.com/members';

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

        // Cambio de status
        if (body.status) {
            updateData.status = body.status;

            if (body.status === 'approved') {
                updateData.approved_at = new Date().toISOString();
                updateData.approved_by = body.admin_id || 'admin';
            } else if (body.status === 'rejected') {
                updateData.rejection_reason = body.rejection_reason || 'Sin motivo especificado';
            }
        }

        // Actualizar otros campos si se proporcionan
        const allowedFields = [
            'commission_percentage', 'payment_method', 'bank_name',
            'card_last_digits', 'clabe', 'rfc', 'phone', 'address',
            'instagram', 'facebook', 'tiktok', 'other_social'
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

            // 1. Enviar email de bienvenida (Notificación)
            try {
                const { notifyAmbassadorApproval } = await import('@/app/actions/ambassador-comm.actions');
                await notifyAmbassadorApproval({
                    userId: currentAmbassador.linked_memberstack_id || currentAmbassador.id,
                    email: currentAmbassador.email,
                    name: currentAmbassador.first_name,
                    referralCode: currentAmbassador.referral_code
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
