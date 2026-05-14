import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REASONS = ['no_longer_needed', 'price_too_high', 'found_alternative', 'service_issues', 'other'];

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request);
        if (!admin || (admin as any).isUnauthorized) return unauthorizedResponse();

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const [
            totalResult,
            sevenResult,
            thirtyResult,
            rowsResult,
        ] = await Promise.all([
            supabaseAdmin.from('membership_cancellations').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('membership_cancellations').select('*', { count: 'exact', head: true }).gte('cancellation_date', sevenDaysAgo.toISOString()),
            supabaseAdmin.from('membership_cancellations').select('*', { count: 'exact', head: true }).gte('cancellation_date', thirtyDaysAgo.toISOString()),
            supabaseAdmin.from('membership_cancellations').select('cancellation_reason, days_remaining_at_cancellation'),
        ]);

        const firstError = totalResult.error || sevenResult.error || thirtyResult.error || rowsResult.error;
        if (firstError) {
            console.error('[ADMIN-CANCELLATIONS-STATS] Error:', firstError);
            return NextResponse.json({ success: false, error: 'Error cargando estadisticas' }, { status: 500 });
        }

        const byReason = Object.fromEntries(REASONS.map(reason => [reason, 0]));
        let daysTotal = 0;
        let daysCount = 0;

        for (const row of rowsResult.data || []) {
            if (row.cancellation_reason in byReason) byReason[row.cancellation_reason] += 1;
            if (typeof row.days_remaining_at_cancellation === 'number') {
                daysTotal += row.days_remaining_at_cancellation;
                daysCount += 1;
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                total_cancellations: totalResult.count || 0,
                last_7_days: sevenResult.count || 0,
                last_30_days: thirtyResult.count || 0,
                by_reason: byReason,
                avg_days_remaining: daysCount > 0 ? Math.round(daysTotal / daysCount) : 0,
            },
        });
    } catch (error: any) {
        console.error('[ADMIN-CANCELLATIONS-STATS] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error procesando estadisticas' }, { status: 500 });
    }
}
