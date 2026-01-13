import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET - Verificar sesión y obtener datos del embajador
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, authenticated: false, error: 'Token no proporcionado' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // Buscar sesión
        const { data: session, error: sessionError } = await supabase
            .from('ambassador_sessions')
            .select('ambassador_id, expires_at')
            .eq('session_token', token)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { success: false, authenticated: false, error: 'Sesión no válida' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // Verificar expiración
        if (new Date(session.expires_at) < new Date()) {
            // Eliminar sesión expirada
            await supabase
                .from('ambassador_sessions')
                .delete()
                .eq('session_token', token);

            return NextResponse.json(
                { success: false, authenticated: false, error: 'Sesión expirada' },
                { status: 401, headers: corsHeaders() }
            );
        }

        // Obtener embajador
        const { data: ambassador, error: ambassadorError } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('id', session.ambassador_id)
            .single();

        if (ambassadorError || !ambassador) {
            return NextResponse.json(
                { success: false, authenticated: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Obtener estadísticas
        const { count: totalReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('ambassador_id', ambassador.id);

        // Referidos este mes
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: monthReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('ambassador_id', ambassador.id)
            .gte('created_at', startOfMonth.toISOString());

        // Remover password_hash
        const { password_hash, ...safeAmbassador } = ambassador;

        return NextResponse.json({
            success: true,
            authenticated: true,
            ambassador: safeAmbassador,
            stats: {
                total_referrals: totalReferrals || 0,
                referrals_this_month: monthReferrals || 0,
                total_earnings: ambassador.total_earnings || 0,
                pending_payout: ambassador.pending_payout || 0,
                commission_percentage: ambassador.commission_percentage || 10
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador me error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST - Cerrar sesión
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: true, message: 'Sesión cerrada' },
                { headers: corsHeaders() }
            );
        }

        // Eliminar sesión
        await supabase
            .from('ambassador_sessions')
            .delete()
            .eq('session_token', token);

        return NextResponse.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
