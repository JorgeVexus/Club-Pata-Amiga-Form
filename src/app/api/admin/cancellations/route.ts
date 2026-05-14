import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request);
        if (!admin || (admin as any).isUnauthorized) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
        const start = (page - 1) * limit;
        const end = start + limit - 1;
        const reason = searchParams.get('reason');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query = supabaseAdmin
            .from('membership_cancellations')
            .select(`
                id,
                memberstack_id,
                cancellation_date,
                membership_end_date,
                days_remaining_at_cancellation,
                cancellation_reason,
                reason_other_text,
                comments,
                stripe_subscription_id,
                stripe_customer_id,
                subscription_interval,
                users:user_id (
                    first_name,
                    last_name,
                    mother_last_name,
                    email
                )
            `, { count: 'exact' })
            .order('cancellation_date', { ascending: false })
            .range(start, end);

        if (reason) {
            query = query.in('cancellation_reason', reason.split(',').map(item => item.trim()).filter(Boolean));
        }

        if (startDate) {
            query = query.gte('cancellation_date', `${startDate}T00:00:00.000Z`);
        }

        if (endDate) {
            query = query.lte('cancellation_date', `${endDate}T23:59:59.999Z`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[ADMIN-CANCELLATIONS] Error listando cancelaciones:', error);
            return NextResponse.json({ success: false, error: 'Error cargando cancelaciones' }, { status: 500 });
        }

        const cancellations = (data || []).map((item: any) => ({
            id: item.id,
            memberstack_id: item.memberstack_id,
            user: {
                first_name: item.users?.first_name || '',
                last_name: item.users?.last_name || item.users?.mother_last_name || '',
                email: item.users?.email || '',
            },
            cancellation_date: item.cancellation_date,
            membership_end_date: item.membership_end_date,
            cancellation_reason: item.cancellation_reason,
            reason_other_text: item.reason_other_text,
            comments: item.comments,
            days_remaining_at_cancellation: item.days_remaining_at_cancellation || 0,
            subscription_interval: item.subscription_interval,
        }));

        return NextResponse.json({
            success: true,
            cancellations,
            pagination: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('[ADMIN-CANCELLATIONS] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error procesando cancelaciones' }, { status: 500 });
    }
}
