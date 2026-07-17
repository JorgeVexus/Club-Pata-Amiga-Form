import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMemberstackRequest } from '@/lib/ambassador-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enmascara el nombre del referido para mostrarlo al embajador sin exponer el dato completo.
// "Efrain Rabago" -> "E***in R***go"
function maskReferredName(fullName: string | null | undefined): string {
    if (!fullName || !fullName.trim()) return 'R*****';

    return fullName
        .trim()
        .split(/\s+/)
        .map((word) => `${Array.from(word)[0].toUpperCase()}*****`)
        .join(' ');
}

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

        const authenticatedMemberId = await verifyMemberstackRequest(request);
        if (!authenticatedMemberId) {
            return NextResponse.json(
                { success: false, error: 'Sesión inválida o expirada' },
                { status: 401, headers: corsHeaders() }
            );
        }
        if (authenticatedMemberId !== memberstackId) {
            return NextResponse.json(
                { success: false, error: 'No tienes acceso a esta cuenta' },
                { status: 403, headers: corsHeaders() }
            );
        }

        // Buscar embajador por memberstack_id
        const { data: ambassador, error } = await supabase
            .from('ambassadors')
            .select('id, first_name, paternal_surname, maternal_surname, birth_date, birth_city, gender, curp, phone, email, postal_code, state, city, neighborhood, address, referral_code, referral_code_status, referral_code_selected_at, status, total_earnings, pending_payout, commission_percentage, payment_method, bank_name, clabe, rfc, facebook, instagram, tiktok, motivation, profile_photo_url, rejection_reason, approved_at, created_at, welcome_shown')
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
                { success: true, data: null, ambassador: null },
                { headers: corsHeaders() }
            );
        }

        // Si está aprobado, obtener detalles adicionales (referidos, etc)
        let detailedData: any = { ...ambassador };
        
        if (ambassador.status === 'approved') {
            // Obtener referidos recientes (últimos 10)
            const { data: recentReferrals } = await supabase
                .from('referrals')
                .select('*')
                .eq('ambassador_id', ambassador.id)
                .order('created_at', { ascending: false })
                .limit(10);

            // Referidos aprobados (ya sea marcados como approved o ya pagados)
            const { count: approvedCount } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('ambassador_id', ambassador.id)
                .in('commission_status', ['approved', 'paid']);

            // Referidos en revisión (pendientes)
            const { count: reviewCount } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('ambassador_id', ambassador.id)
                .eq('commission_status', 'pending');

            // Referidos rechazados (cancelados)
            const { count: rejectedCount } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('ambassador_id', ambassador.id)
                .eq('commission_status', 'cancelled');

            // Obtener conteo total de referidos
            const { count: totalReferrals } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('ambassador_id', ambassador.id);

            // Vigentes/activos: el miembro referido debe estar aprobado Y con membresía activa
            // (mismo criterio que usa el panel admin en /api/ambassadors/[id]).
            // Se calcula sobre TODOS los referidos, no solo los últimos 10 que se muestran en la lista.
            let activeReferralsCount = 0;
            const { data: allReferrals } = await supabase
                .from('referrals')
                .select('referred_user_id')
                .eq('ambassador_id', ambassador.id);

            const allReferredIds = (allReferrals || []).map(r => r.referred_user_id);
            if (allReferredIds.length > 0) {
                const { data: referredUsers } = await supabase
                    .from('users')
                    .select('memberstack_id, approval_status, membership_status')
                    .in('memberstack_id', allReferredIds);

                activeReferralsCount = (referredUsers || []).filter(
                    u => u.approval_status === 'approved' && u.membership_status === 'active'
                ).length;
            }

            detailedData = {
                ...detailedData,
                // Nunca exponer nombre/correo completos del referido en este endpoint público (sin auth)
                recent_referrals: (recentReferrals || []).map(r => ({
                    id: r.id,
                    masked_name: maskReferredName(r.referred_user_name),
                    plan: r.membership_plan || null,
                    commission_amount: r.commission_amount ?? null,
                    commission_status: r.commission_status || 'pending',
                    created_at: r.created_at,
                })),
                total_referrals: totalReferrals || 0,
                referrals_count: totalReferrals || 0,
                approved_referrals: approvedCount || 0,
                review_referrals: reviewCount || 0,
                rejected_referrals: rejectedCount || 0,
                active_referrals_count: activeReferralsCount
            };
        }

        // Fallback de seguridad: si tiene código real pero el status no es 'active' en DB, lo forzamos a active para el widget
        if (detailedData.referral_code && !detailedData.referral_code.startsWith('TMP') && detailedData.referral_code_status !== 'active') {
            detailedData.referral_code_status = 'active';
        }

        return NextResponse.json({
            success: true,
            data: detailedData, // Para consistencia con lo que el widget espera
            ambassador: detailedData
        }, { headers: corsHeaders() });

    } catch (e: any) {
        console.error('[ambassadors/by-memberstack] Error:', e);
        return NextResponse.json(
            { success: false, error: e.message },
            { status: 500, headers: corsHeaders() }
        );
    }
}
