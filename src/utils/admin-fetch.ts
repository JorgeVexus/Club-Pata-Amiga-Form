/**
 * Utility for making authenticated requests to admin API endpoints.
 * Automatically injects the x-admin-memberstack-id header from sessionStorage.
 */

export const adminFetch = async (url: string, options: RequestInit = {}, overrideId?: string) => {
    let adminMemberstackId = overrideId;
    
    if (!adminMemberstackId && typeof window !== 'undefined') {
        adminMemberstackId = sessionStorage.getItem('admin_memberstack_id') || '';
    }

    const headers = {
        ...options.headers,
        'x-admin-memberstack-id': adminMemberstackId || ''
    };

    return fetch(url, { ...options, headers });
};
