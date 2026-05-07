import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * GET /api/ambassadors/by-memberstack?memberstackId=mem_xxx
 * Busca si el usuario tiene un perfil de embajador vinculado a su memberstackId.
 * Usado por el User Profile Widget para mostrar la sección de embajador.
 * No requiere token de sesión — solo el memberstackId de Memberstack.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'memberstackId requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Buscar embajador por memberstack_id
        const { data: ambassador, error } = await supabase
            .from('ambassadors')
            .select('id, first_name, paternal_surname, email, referral_code, status, total_earnings, pending_payout, commission_percentage, created_at')
            .eq('linked_memberstack_id', memberstackId)
            .maybeSingle();

        if (error) {
            console.error('[ambassadors/by-memberstack] Supabase error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500, headers: corsHeaders() }
            );
        }

        if (!ambassador) {
            // No es embajador — respuesta normal (no es un error)
            return NextResponse.json(
                { success: true, ambassador: null },
                { headers: corsHeaders() }
            );
        }

        // Obtener estadísticas de referidos
        const { count: totalReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('ambassador_id', ambassador.id);

        const { count: activeReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('ambassador_id', ambassador.id)
            .eq('status', 'active');

        return NextResponse.json({
            success: true,
            ambassador: {
                ...ambassador,
                total_referrals: totalReferrals || 0,
                active_referrals: activeReferrals || 0,
            }
        }, { headers: corsHeaders() });

    } catch (e: any) {
        console.error('[ambassadors/by-memberstack] Error:', e);
        return NextResponse.json(
            { success: false, error: e.message },
            { status: 500, headers: corsHeaders() }
        );
    }
}
