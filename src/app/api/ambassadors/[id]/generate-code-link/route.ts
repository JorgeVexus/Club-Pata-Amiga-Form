/**
 * 🔗 API para generar link directo de selección de código (fallback)
 * POST: /api/ambassadors/[id]/generate-code-link
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

// POST - Generar link directo para selección de código
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

        // Verificar que no tenga código activo ya
        if (ambassador.referral_code && ambassador.referral_code_status === 'active') {
            return NextResponse.json(
                { success: false, error: 'Ya tienes un código activo' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Generar token temporal
        const selectionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // Válido por 1 día (más corto para seguridad)

        await supabase.from('ambassador_sessions').insert({
            ambassador_id: ambassador.id,
            session_token: selectionToken,
            expires_at: expiresAt.toISOString()
        });

        // URL de selección de código (usa la URL de Webflow o la de Next.js)
        const selectionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx'}/embajadores/seleccionar-codigo?token=${selectionToken}`;

        return NextResponse.json({
            success: true,
            message: 'Link generado correctamente',
            data: {
                selection_url: selectionUrl,
                expires_at: expiresAt.toISOString()
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error en generate-code-link:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
