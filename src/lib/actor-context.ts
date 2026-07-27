import { NextResponse } from 'next/server';

export type ActorRole = 'member' | 'ambassador' | 'wellness_center' | 'admin';

export interface ActorContext {
    role: ActorRole;
    supabaseUserId?: string;
    memberstackId?: string;
    ambassadorId?: string;
    wellnessCenterId?: string;
    permissions: string[];
}

export type ActorAuthSuccess = {
    ok: true;
    actor: ActorContext;
};

export type ActorAuthFailure = {
    ok: false;
    response: NextResponse;
};

export type ActorAuthResult = ActorAuthSuccess | ActorAuthFailure;

export function actorFailure(status: number, error: string): ActorAuthFailure {
    return {
        ok: false,
        response: NextResponse.json(
            { success: false, error },
            { status },
        ),
    };
}
