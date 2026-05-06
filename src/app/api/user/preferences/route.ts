import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'memberstackId is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .select('notif_email, notif_whatsapp, notif_alerts, notif_payments, notif_news')
            .eq('memberstack_id', memberstackId)
            .single();

        if (error) {
            console.error('❌ [PREFERENCES] Error fetching:', error);
            return NextResponse.json({ success: false, error: 'User not found or error fetching' }, { status: 404 });
        }

        return NextResponse.json({ success: true, preferences: data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { memberstackId, preferences } = await request.json();

        if (!memberstackId || !preferences) {
            return NextResponse.json({ success: false, error: 'memberstackId and preferences are required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('users')
            .update({
                notif_email: preferences.notif_email,
                notif_whatsapp: preferences.notif_whatsapp,
                notif_alerts: preferences.notif_alerts,
                notif_payments: preferences.notif_payments,
                notif_news: preferences.notif_news
            })
            .eq('memberstack_id', memberstackId);

        if (error) {
            console.error('❌ [PREFERENCES] Error updating:', error);
            return NextResponse.json({ success: false, error: 'Error updating preferences' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Preferences updated' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
