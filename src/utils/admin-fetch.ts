/**
 * Utility for making authenticated requests to admin API endpoints.
 * Injects the active Memberstack JWT. The legacy ID header remains during the
 * transition for diagnostics, but the server never trusts it as identity.
 */

export const adminFetch = async (url: string, options: RequestInit = {}, overrideId?: string) => {
    let adminMemberstackId = overrideId;
    let token = '';

    if (!adminMemberstackId && typeof window !== 'undefined') {
        adminMemberstackId = localStorage.getItem('admin_memberstack_id') || '';
    }

    if (
        typeof window !== 'undefined' &&
        (window as any).$memberstackDom?.getMemberCookie
    ) {
        token = await Promise.resolve((window as any).$memberstackDom.getMemberCookie()) || '';
    }

    const headers = new Headers(options.headers);
    headers.set('x-admin-memberstack-id', adminMemberstackId || '');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, { ...options, headers });
};
