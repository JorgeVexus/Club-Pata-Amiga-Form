/**
 * API Route: /api/admin/notifications/mark-all-read
 * Marca todas las notificaciones de admin como leídas
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST() {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', 'admin')
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all as read:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in mark all read API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
