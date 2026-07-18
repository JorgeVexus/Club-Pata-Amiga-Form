import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const admin = await getAdminUser(request);
    if (!admin || ('isUnauthorized' in admin && admin.isUnauthorized)) return unauthorizedResponse();

    const { data: requests, error } = await supabase
        .from('pet_unsubscriptions')
        .select('id, memberstack_id, pet_id, pet_index, pet_name, reason, description, requested_at, unsubscribed_by')
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const memberIds = [...new Set((requests || []).map(item => item.memberstack_id).filter(Boolean))];
    const { data: users } = memberIds.length
        ? await supabase.from('users').select('id, memberstack_id, first_name, last_name, email').in('memberstack_id', memberIds)
        : { data: [] };
    const usersByMemberstack = new Map((users || []).map(user => [user.memberstack_id, user]));

    return NextResponse.json({
        success: true,
        count: requests?.length || 0,
        requests: (requests || []).map(item => ({ ...item, user: usersByMemberstack.get(item.memberstack_id) || null })),
    });
}
