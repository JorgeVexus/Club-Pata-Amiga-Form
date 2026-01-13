import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// POST - Login de embajador
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email y contraseña son requeridos' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Buscar embajador por email
        const { data: ambassador, error } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'Credenciales incorrectas' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, ambassador.password_hash);
        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, error: 'Credenciales incorrectas' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // Verificar estado
        if (ambassador.status === 'pending') {
            return NextResponse.json(
                { success: false, error: 'Tu solicitud aún está en revisión', status: 'pending' },
                { status: 403, headers: corsHeaders() }
            );
        }

        if (ambassador.status === 'rejected') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tu solicitud fue rechazada',
                    reason: ambassador.rejection_reason,
                    status: 'rejected'
                },
                { status: 403, headers: corsHeaders() }
            );
        }

        if (ambassador.status === 'suspended') {
            return NextResponse.json(
                { success: false, error: 'Tu cuenta está suspendida', status: 'suspended' },
                { status: 403, headers: corsHeaders() }
            );
        }

        // Generar token de sesión
        const sessionToken = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

        // Crear sesión
        await supabase.from('ambassador_sessions').insert({
            ambassador_id: ambassador.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString(),
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown'
        });

        // Actualizar último login
        await supabase
            .from('ambassadors')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', ambassador.id);

        // Obtener estadísticas
        const { count: referralsCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('ambassador_id', ambassador.id);

        // Remover password_hash de la respuesta
        const { password_hash, ...safeAmbassador } = ambassador;

        return NextResponse.json({
            success: true,
            token: sessionToken,
            ambassador: {
                ...safeAmbassador,
                referrals_count: referralsCount || 0
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador login error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
