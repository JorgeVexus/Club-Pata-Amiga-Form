import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PATCH, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-memberstack-id',
};

type AuthenticatedAmbassador = {
    ok: true;
    memberstackId: string;
    ambassador: AmbassadorRecord;
};

export interface AmbassadorRecord {
    id: string;
    linked_memberstack_id?: string | null;
    status: string;
    first_name: string;
    paternal_surname?: string | null;
    maternal_surname?: string | null;
    email: string;
    referral_code?: string | null;
    referral_code_status?: string | null;
    referral_code_changed_at?: string | null;
    can_change_referral_code?: boolean | null;
    pending_payout?: number | null;
    [key: string]: unknown;
}

type AmbassadorAuthFailure = {
    ok: false;
    response: NextResponse;
};

export type AmbassadorAuthResult = AuthenticatedAmbassador | AmbassadorAuthFailure;

function failure(status: number, error: string): AmbassadorAuthFailure {
    return {
        ok: false,
        response: NextResponse.json({ success: false, error }, { status, headers: corsHeaders }),
    };
}

export async function verifyMemberstackRequest(request: NextRequest): Promise<string | null> {
    const authorization = request.headers.get('authorization') || '';
    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    const secretKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY || process.env.MEMBERSTACK_SECRET_KEY;
    if (!token || !secretKey) return null;

    try {
        const response = await fetch('https://admin.memberstack.com/members/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': secretKey,
            },
            body: JSON.stringify({ token }),
            cache: 'no-store',
        });
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.id || payload?.data?.id || payload?.member?.id || null;
    } catch (error) {
        console.error('[AmbassadorAuth] Memberstack token verification failed:', error);
        return null;
    }
}

export async function getAuthenticatedAmbassador(
    request: NextRequest,
    expectedAmbassadorId?: string,
): Promise<AmbassadorAuthResult> {
    const memberstackId = await verifyMemberstackRequest(request);
    if (!memberstackId) return failure(401, 'Sesión inválida o expirada');

    let query = supabaseAdmin
        .from('ambassadors')
        .select('*')
        .eq('linked_memberstack_id', memberstackId);
    if (expectedAmbassadorId) query = query.eq('id', expectedAmbassadorId);

    const { data: ambassador, error } = await query.maybeSingle();
    if (error) {
        console.error('[AmbassadorAuth] Error resolving ambassador:', error);
        return failure(500, 'No se pudo validar la cuenta de embajador');
    }
    if (!ambassador) return failure(403, 'No tienes acceso a esta cuenta de embajador');

    return { ok: true, memberstackId, ambassador };
}

export { corsHeaders as ambassadorCorsHeaders, supabaseAdmin as ambassadorSupabaseAdmin };
