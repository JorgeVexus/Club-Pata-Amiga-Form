/**
 * API Endpoint: POST /api/auth/session-token
 * 
 * Genera un token de sesión temporal para el Vet-Bot.
 * Este token permite identificar automáticamente al usuario
 * sin necesidad de preguntar su email.
 * 
 * Uso:
 * 1. Usuario inicia sesión con Memberstack
 * 2. Frontend llama a este endpoint con memberstackId y email
 * 3. API retorna un token que se guarda en cookie/localStorage
 * 4. El bot lee este token y lo usa para identificar al usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Headers CORS para permitir peticiones desde Webflow/pataamiga.mx
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Cliente Supabase con Service Role (acceso completo)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Configuración
const SESSION_DURATION_HOURS = 2;
const TOKEN_LENGTH_BYTES = 32; // 64 caracteres hex

interface SessionTokenRequest {
    memberstackId: string;
    email: string;
}

interface SessionTokenResponse {
    success: boolean;
    sessionToken?: string;
    expiresAt?: string;
    error?: string;
}

/**
 * OPTIONS /api/auth/session-token
 * Maneja preflight requests CORS
 */
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * POST /api/auth/session-token
 * Genera un nuevo token de sesión para el Vet-Bot
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // 1. Parsear y validar el body
        const body: SessionTokenRequest = await request.json();
        const { memberstackId, email } = body;

        // Validaciones
        if (!memberstackId || typeof memberstackId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'memberstackId es requerido' } as SessionTokenResponse,
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!email || typeof email !== 'string' || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: 'email válido es requerido' } as SessionTokenResponse,
                { status: 400, headers: corsHeaders() }
            );
        }

        console.log(`🔑 [SessionToken] Generando token para: ${email}`);

        // 2. Generar token criptográficamente seguro
        const token = crypto.randomBytes(TOKEN_LENGTH_BYTES).toString('hex');

        // 3. Calcular fecha de expiración
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

        // 4. Obtener metadata de la request
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // 5. Inserción Directa (Permitimos múltiples sesiones activas temporales para evitar race conditions)
        // La limpieza se hará automáticamente por expiración o por la función cleanup_expired_vet_sessions

        // 6. Insertar nueva sesión en la base de datos
        const { data: sessionData, error: insertError } = await supabaseAdmin
            .from('vet_bot_sessions')
            .insert({
                memberstack_id: memberstackId,
                email: email.toLowerCase().trim(),
                token: token,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                is_active: true,
                ip_address: ipAddress,
                user_agent: userAgent
            })
            .select()
            .single();

        if (insertError) {
            console.error('❌ [SessionToken] Error insertando sesión:', insertError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Error al crear la sesión. Intente nuevamente.'
                } as SessionTokenResponse,
                { status: 500, headers: corsHeaders() }
            );
        }

        console.log(`✅ [SessionToken] Token generado exitosamente para: ${email}`);

        // 7. Retornar el token
        return NextResponse.json({
            success: true,
            sessionToken: token,
            expiresAt: expiresAt.toISOString()
        } as SessionTokenResponse, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('❌ [SessionToken] Error inesperado:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Error interno del servidor'
            } as SessionTokenResponse,
            { status: 500, headers: corsHeaders() }
        );
    }
}

/**
 * GET /api/auth/session-token
 * Verifica si un token es válido (para debugging)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token es requerido como query param' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validar el token usando la función de Supabase
        const { data, error } = await supabaseAdmin
            .rpc('get_valid_vet_session', { p_token: token });

        if (error || !data || data.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Token inválido o expirado',
                    isValid: false
                },
                { status: 401, headers: corsHeaders() }
            );
        }

        const session = data[0];

        return NextResponse.json({
            success: true,
            isValid: true,
            session: {
                memberstackId: session.memberstack_id,
                email: session.email,
                expiresAt: session.expires_at
            }
        }, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('❌ [SessionToken] Error validando token:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

/**
 * DELETE /api/auth/session-token
 * Invalida un token de sesión (logout)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token es requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const { error } = await supabaseAdmin
            .from('vet_bot_sessions')
            .update({ is_active: false })
            .eq('token', token);

        if (error) {
            console.error('❌ [SessionToken] Error invalidando token:', error);
            return NextResponse.json(
                { success: false, error: 'Error al cerrar sesión' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        }, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('❌ [SessionToken] Error en logout:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// =============================================
// Helpers
// =============================================

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
