/**
 * API Endpoint: /api/auth/magic-token
 *
 * POST → Genera un token de un solo uso (10 min) para redirigir al usuario
 *        desde Webflow a app.pataamiga.mx sin necesidad de re-autenticarse.
 *
 * GET ?token=TOKEN → Valida y consume el token. Retorna datos del member
 *        para pre-cargar el flujo de registro sin fricción.
 *
 * Usado por: unified-membership-widget.js (botón "Seleccionar Plan")
 * Consumido por: NewRegistrationFlow.tsx (al cargar con ?mt=TOKEN)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ─── CORS (peticiones desde Webflow / pataamiga.mx) ──────────────────────────
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// ─── Supabase Admin (service role — bypasa RLS) ───────────────────────────────
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const TOKEN_EXPIRY_MINUTES = 10;

// ─── OPTIONS (preflight CORS) ─────────────────────────────────────────────────
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// ─── POST /api/auth/magic-token ───────────────────────────────────────────────
// Genera el token y lo almacena en Supabase.
// Body: { memberstackId: string, email: string, customFields?: object }
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { memberstackId, email, customFields } = body;

        if (!memberstackId || typeof memberstackId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'memberstackId es requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, error: 'email válido es requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        console.log(`🔮 [MagicToken] Generando token para: ${email} (${memberstackId})`);

        // Token: 32 bytes aleatorios → 64 chars hex (criptográficamente seguro)
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

        const { error: insertError } = await supabaseAdmin
            .from('magic_tokens')
            .insert({
                token,
                memberstack_id: memberstackId,
                email: email.toLowerCase().trim(),
                custom_fields: customFields || {},
                intent: 'complete_payment',
                expires_at: expiresAt.toISOString(),
                used: false,
            });

        if (insertError) {
            console.error('❌ [MagicToken] Error al insertar token:', insertError);
            return NextResponse.json(
                { success: false, error: 'Error interno al generar el token' },
                { status: 500, headers: corsHeaders() }
            );
        }

        console.log(`✅ [MagicToken] Token generado exitosamente`);
        return NextResponse.json({ success: true, token }, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('❌ [MagicToken] Error inesperado en POST:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// ─── GET /api/auth/magic-token?token=TOKEN ────────────────────────────────────
// Valida el token (no expirado, no usado) y lo marca como consumido (single-use).
// Retorna los datos del member asociados al token.
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Token requerido como query param ?token=' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Buscar token válido: no usado y no expirado
        const { data, error } = await supabaseAdmin
            .from('magic_tokens')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            console.warn(`⚠️ [MagicToken] Token inválido o expirado: ${token.slice(0, 16)}...`);
            return NextResponse.json(
                { success: false, error: 'Token inválido o expirado' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // Marcar como usado (single-use — previene ataques de replay)
        await supabaseAdmin
            .from('magic_tokens')
            .update({ used: true })
            .eq('id', data.id);

        console.log(`✅ [MagicToken] Token consumido para: ${data.email}`);

        return NextResponse.json({
            success: true,
            memberstackId: data.memberstack_id,
            email: data.email,
            customFields: data.custom_fields || {},
            intent: data.intent || 'complete_payment',
        }, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('❌ [MagicToken] Error inesperado en GET:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
