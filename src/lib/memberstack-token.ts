import { NextRequest } from 'next/server';

/**
 * Verifies the active Memberstack session token and returns its member ID.
 *
 * This is the only server-side boundary that depends on Memberstack identity.
 * Route authorization must consume the resolved ID instead of trusting IDs
 * supplied in request bodies, query parameters, or legacy headers.
 */
export async function verifyMemberstackRequest(request: NextRequest): Promise<string | null> {
    const authorization = request.headers.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();
    const secretKey =
        process.env.MEMBERSTACK_ADMIN_SECRET_KEY ||
        process.env.MEMBERSTACK_SECRET_KEY;

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
        console.error('[MemberstackToken] Token verification failed:', error);
        return null;
    }
}
