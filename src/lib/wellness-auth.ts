import { NextRequest } from 'next/server';
import { actorFailure, type ActorAuthResult } from '@/lib/actor-context';
import { verifyMemberstackRequest } from '@/lib/memberstack-token';
import { isSupabaseAdminConfigured, supabaseAdmin } from '@/lib/supabase';

export async function requireWellnessActor(
    request: NextRequest,
    expectedMemberstackId?: string,
): Promise<ActorAuthResult> {
    const memberstackId = await verifyMemberstackRequest(request);
    if (!memberstackId) return actorFailure(401, 'Sesión inválida o expirada');

    if (expectedMemberstackId && expectedMemberstackId !== memberstackId) {
        return actorFailure(403, 'No tienes acceso a este centro');
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
        return actorFailure(500, 'No se pudo validar el centro');
    }

    const { data: center, error } = await supabaseAdmin
        .from('wellness_centers')
        .select('id, memberstack_id, status')
        .eq('memberstack_id', memberstackId)
        .maybeSingle();

    if (error) {
        console.error('[WellnessAuth] Error resolving center:', error);
        return actorFailure(500, 'No se pudo validar el centro');
    }
    if (!center) return actorFailure(403, 'No tienes acceso a este centro');

    return {
        ok: true,
        actor: {
            role: 'wellness_center',
            memberstackId,
            wellnessCenterId: center.id,
            permissions: ['wellness:self'],
        },
    };
}
