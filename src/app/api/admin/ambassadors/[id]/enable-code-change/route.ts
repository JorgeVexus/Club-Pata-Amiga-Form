/**
 * 🔧 API Admin para habilitar cambio de código a un embajador
 * POST: /api/admin/ambassadors/[id]/enable-code-change
 * Body: { sendEmail: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// POST - Habilitar cambio de código para un embajador
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { sendEmail = true } = body;

        // Verificar que el embajador existe
        const { data: ambassador, error: ambassadorError } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('id', id)
            .single();

        if (ambassadorError || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Verificar que está aprobado
        if (ambassador.status !== 'approved') {
            return NextResponse.json(
                { success: false, error: 'El embajador debe estar aprobado' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar que no haya cambiado antes
        if (ambassador.referral_code_changed_at) {
            return NextResponse.json(
                { success: false, error: 'El embajador ya ha cambiado su código anteriormente' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Habilitar cambio de código
        const { data: updatedAmbassador, error: updateError } = await supabase
            .from('ambassadors')
            .update({
                can_change_referral_code: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error habilitando cambio de código:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al habilitar el cambio de código' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Generar token para cambio de código
        const changeToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Válido por 7 días

        await supabase.from('ambassador_sessions').insert({
            ambassador_id: ambassador.id,
            session_token: changeToken,
            expires_at: expiresAt.toISOString()
        });

        let emailSent = false;

        // Enviar email si se solicita
        if (sendEmail) {
            try {
                const { notifyAmbassadorCodeChangeEnabled } = await import('@/app/actions/ambassador-comm.actions');
                await notifyAmbassadorCodeChangeEnabled({
                    userId: ambassador.linked_memberstack_id || ambassador.id,
                    email: ambassador.email,
                    name: ambassador.first_name,
                    currentCode: ambassador.referral_code || 'No establecido',
                    changeToken: changeToken
                });
                emailSent = true;
            } catch (emailError) {
                console.error('❌ Error enviando email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Cambio de código habilitado correctamente',
            data: {
                ambassador_id: ambassador.id,
                can_change_referral_code: true,
                change_url: `https://clubpataamiga.com/embajadores/cambiar-codigo?token=${changeToken}`,
                email_sent: emailSent
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error en enable-code-change:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
