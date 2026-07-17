/**
 * 🔄 API para solicitar cambio de código (desde el widget)
 * POST: /api/ambassadors/[id]/request-code-change
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ambassadorSupabaseAdmin as supabase, getAuthenticatedAmbassador } from '@/lib/ambassador-auth';

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

// POST - Solicitar cambio de código
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const auth = await getAuthenticatedAmbassador(request, id);
        if (!auth.ok) return auth.response;
        const ambassador = auth.ambassador;

        // Verificar que está aprobado
        if (ambassador.status !== 'approved') {
            return NextResponse.json(
                { success: false, error: 'El embajador debe estar aprobado' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar que tiene permiso para cambiar
        if (!ambassador.can_change_referral_code) {
            const { error: notificationError } = await supabase.from('notifications').insert({
                user_id: 'admin',
                type: 'ambassador_code_change_request',
                title: 'Solicitud de cambio de código',
                message: `${ambassador.first_name || 'Un embajador'} solicitó autorización para cambiar su código.`,
                metadata: { ambassador_id: ambassador.id, notification_kind: 'ambassador_code_change_request' },
                is_read: false,
            });
            if (notificationError) {
                console.error('[AmbassadorCodeChange] Error creating admin notification:', notificationError);
                return NextResponse.json(
                    { success: false, error: 'No se pudo enviar la solicitud a administración' },
                    { status: 500, headers: corsHeaders() }
                );
            }
            return NextResponse.json({
                success: true,
                status: 'pending_admin',
                message: 'Solicitud enviada a administración',
            }, { headers: corsHeaders() });
        }

        // Verificar que no ha cambiado antes
        if (ambassador.referral_code_changed_at) {
            return NextResponse.json(
                { success: false, error: 'Ya has cambiado tu código anteriormente' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Generar token para cambio de código
        const changeToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase.from('ambassador_sessions').insert({
            ambassador_id: ambassador.id,
            session_token: changeToken,
            expires_at: expiresAt.toISOString()
        });

        // Enviar email
        try {
            const { notifyAmbassadorCodeChangeEnabled } = await import('@/app/actions/ambassador-comm.actions');
            await notifyAmbassadorCodeChangeEnabled({
                userId: ambassador.linked_memberstack_id || ambassador.id,
                email: ambassador.email,
                name: ambassador.first_name,
                currentCode: ambassador.referral_code || 'N/A',
                changeToken: changeToken
            });
        } catch (emailError) {
            console.error('❌ Error enviando email:', emailError);
            return NextResponse.json(
                { success: false, error: 'Error enviando el email' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            status: 'email_sent',
            message: 'Email enviado correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error en request-code-change:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
