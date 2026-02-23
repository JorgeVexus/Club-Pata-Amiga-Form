/**
 * 📧 API para reenviar email de selección de código
 * POST: /api/ambassadors/[id]/resend-code-email
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

// POST - Reenviar email de selección de código
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Obtener embajador
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

        // Verificar que no tenga código activo
        if (ambassador.referral_code && ambassador.referral_code_status === 'active') {
            return NextResponse.json(
                { success: false, error: 'Ya tienes un código activo' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Generar nuevo token
        const selectionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase.from('ambassador_sessions').insert({
            ambassador_id: ambassador.id,
            session_token: selectionToken,
            expires_at: expiresAt.toISOString()
        });

        // Enviar email
        try {
            const { notifyAmbassadorApproval } = await import('@/app/actions/ambassador-comm.actions');
            await notifyAmbassadorApproval({
                userId: ambassador.linked_memberstack_id || ambassador.id,
                email: ambassador.email,
                name: ambassador.first_name,
                selectionToken: selectionToken
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
            message: 'Email enviado correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error en resend-code-email:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
