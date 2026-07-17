import { NextRequest, NextResponse } from 'next/server';
import {
    ambassadorCorsHeaders,
    ambassadorSupabaseAdmin as supabase,
    getAuthenticatedAmbassador,
} from '@/lib/ambassador-auth';
import { maskReferredName } from '@/lib/ambassador-privacy';

const PROFILE_FIELDS = [
    'phone', 'address', 'city', 'state', 'postal_code', 'neighborhood',
    'instagram', 'facebook', 'tiktok', 'motivation', 'profile_photo_url',
    'payment_method', 'bank_name', 'clabe', 'rfc', 'birth_city', 'welcome_shown',
] as const;

function sanitizeClabe(value: unknown): string {
    return String(value || '').replace(/\D/g, '').slice(0, 18);
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: ambassadorCorsHeaders });
}

export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedAmbassador(request);
    if (!auth.ok) return auth.response;
    const ambassador = auth.ambassador;

    const [recentResult, totalResult, approvedResult, reviewResult, rejectedResult] = await Promise.all([
        supabase.from('referrals')
            .select('id, referred_user_name, membership_plan, commission_amount, commission_status, created_at')
            .eq('ambassador_id', ambassador.id)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('ambassador_id', ambassador.id),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('ambassador_id', ambassador.id).in('commission_status', ['approved', 'paid']),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('ambassador_id', ambassador.id).eq('commission_status', 'pending'),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('ambassador_id', ambassador.id).eq('commission_status', 'cancelled'),
    ]);

    const recentReferrals = (recentResult.data || []).map((referral) => ({
        id: referral.id,
        masked_name: maskReferredName(referral.referred_user_name),
        plan: referral.membership_plan || null,
        commission_amount: referral.commission_amount ?? null,
        commission_status: referral.commission_status || 'pending',
        created_at: referral.created_at,
    }));

    const { data: referralOwners } = await supabase
        .from('referrals')
        .select('referred_user_id')
        .eq('ambassador_id', ambassador.id);
    const referredMemberIds = (referralOwners || []).map((item) => item.referred_user_id).filter(Boolean);
    let activeReferralsCount = 0;
    if (referredMemberIds.length > 0) {
        const { data: activeMembers } = await supabase
            .from('users')
            .select('memberstack_id, approval_status, membership_status')
            .in('memberstack_id', referredMemberIds);
        activeReferralsCount = (activeMembers || []).filter(
            (member) => member.approval_status === 'approved' && member.membership_status === 'active',
        ).length;
    }

    return NextResponse.json({
        success: true,
        data: {
            ...ambassador,
            recent_referrals: recentReferrals,
            total_referrals: totalResult.count || 0,
            referrals_count: totalResult.count || 0,
            approved_referrals: approvedResult.count || 0,
            active_referrals_count: activeReferralsCount,
            review_referrals: reviewResult.count || 0,
            rejected_referrals: rejectedResult.count || 0,
        },
    }, { headers: ambassadorCorsHeaders });
}

export async function PATCH(request: NextRequest) {
    const auth = await getAuthenticatedAmbassador(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    PROFILE_FIELDS.forEach((field) => {
        if (body[field] !== undefined) updateData[field] = body[field];
    });

    if (updateData.payment_method === 'pending') {
        updateData.bank_name = '';
        updateData.clabe = '';
    } else if (updateData.clabe !== undefined) {
        updateData.clabe = sanitizeClabe(updateData.clabe);
        if (!/^\d{18}$/.test(String(updateData.clabe))) {
            return NextResponse.json(
                { success: false, error: 'La CLABE debe contener exactamente 18 dígitos' },
                { status: 400, headers: ambassadorCorsHeaders },
            );
        }
        if (!String(updateData.bank_name || '').trim()) {
            return NextResponse.json(
                { success: false, error: 'Debes indicar el banco de la CLABE' },
                { status: 400, headers: ambassadorCorsHeaders },
            );
        }
    }

    const { data, error } = await supabase
        .from('ambassadors')
        .update(updateData)
        .eq('id', auth.ambassador.id)
        .select()
        .single();
    if (error) {
        console.error('[AmbassadorDashboard] Profile update failed:', error);
        return NextResponse.json(
            { success: false, error: 'No se pudieron guardar los cambios' },
            { status: 500, headers: ambassadorCorsHeaders },
        );
    }
    return NextResponse.json({ success: true, data }, { headers: ambassadorCorsHeaders });
}
