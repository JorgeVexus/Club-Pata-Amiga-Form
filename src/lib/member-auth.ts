import { NextRequest } from 'next/server';
import { actorFailure, type ActorAuthResult } from '@/lib/actor-context';
import { verifyMemberstackRequest } from '@/lib/memberstack-token';
import { isSupabaseAdminConfigured, supabaseAdmin } from '@/lib/supabase';

export async function requireMemberActor(
    request: NextRequest,
    expectedMemberstackId?: string,
): Promise<ActorAuthResult> {
    const memberstackId = await verifyMemberstackRequest(request);
    if (!memberstackId) {
        return actorFailure(401, 'Sesión inválida o expirada');
    }

    if (expectedMemberstackId && expectedMemberstackId !== memberstackId) {
        return actorFailure(403, 'No tienes acceso a esta cuenta');
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
        console.error('[MemberAuth] Supabase Service Role is not configured');
        return actorFailure(500, 'No se pudo validar la cuenta');
    }

    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, memberstack_id, role, approval_status, membership_status')
        .eq('memberstack_id', memberstackId)
        .maybeSingle();

    if (error) {
        console.error('[MemberAuth] Error resolving member:', error);
        return actorFailure(500, 'No se pudo validar la cuenta');
    }

    if (!user) {
        return actorFailure(403, 'No tienes acceso a esta cuenta');
    }

    return {
        ok: true,
        actor: {
            role: 'member',
            supabaseUserId: user.id,
            memberstackId: user.memberstack_id,
            permissions: ['member:self'],
        },
    };
}
