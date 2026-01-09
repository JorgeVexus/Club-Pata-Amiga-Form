/**
 * API Route: /api/admin/notifications/[id]/read
 * Marca una notificación de admin como leída
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification as read:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in mark read API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
