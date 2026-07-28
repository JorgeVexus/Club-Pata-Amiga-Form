import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REASONS = ['no_longer_needed', 'price_too_high', 'found_alternative', 'service_issues', 'other', 'stripe_direct'];

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request);
        if (!admin || (admin as any).isUnauthorized) return unauthorizedResponse();

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const { data: rows, error } = await supabaseAdmin
            .from('membership_cancellations')
            .select('user_id, memberstack_id, cancellation_date, cancellation_reason, days_remaining_at_cancellation')
            .order('cancellation_date', { ascending: false })
            .limit(2000);

        if (error) {
            console.error('[ADMIN-CANCELLATIONS-STATS] Error:', error);
            return NextResponse.json({ success: false, error: 'Error cargando estadisticas' }, { status: 500 });
        }

        // 🆕 Deduplicar por cliente (misma causa que en /api/admin/cancellations:
        // el flujo de cancelación puede insertar más de una fila por evento).
        const seen = new Set<string>();
        const deduped = (rows || []).filter((row: any) => {
            const key = row.user_id || row.memberstack_id;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const byReason = Object.fromEntries(REASONS.map((reason) => [reason, 0]));
        let daysTotal = 0;
        let daysCount = 0;
        let last7 = 0;
        let last30 = 0;

        for (const row of deduped) {
            if (row.cancellation_reason in byReason) byReason[row.cancellation_reason] += 1;
            if (typeof row.days_remaining_at_cancellation === 'number') {
                daysTotal += row.days_remaining_at_cancellation;
                daysCount += 1;
            }
            const date = row.cancellation_date ? new Date(row.cancellation_date) : null;
            if (date && date >= sevenDaysAgo) last7 += 1;
            if (date && date >= thirtyDaysAgo) last30 += 1;
        }

        return NextResponse.json({
            success: true,
            stats: {
                total_cancellations: deduped.length,
                last_7_days: last7,
                last_30_days: last30,
                by_reason: byReason,
                avg_days_remaining: daysCount > 0 ? Math.round(daysTotal / daysCount) : 0,
            },
        });
    } catch (error: any) {
        console.error('[ADMIN-CANCELLATIONS-STATS] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error procesando estadisticas' }, { status: 500 });
    }
}
