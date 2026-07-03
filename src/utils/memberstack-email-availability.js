function normalizeEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function collectMemberstackMembers(payload) {
    if (!payload) return [];

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === 'object') return [payload.data];
    if (Array.isArray(payload.members)) return payload.members;
    if (payload.member && typeof payload.member === 'object') return [payload.member];

    return [payload];
}

function getMemberEmail(member) {
    return normalizeEmail(
        member?.auth?.email ||
        member?.email ||
        member?.profile?.email ||
        member?.customFields?.email
    );
}

function memberstackResponseContainsEmail(payload, email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return false;

    return collectMemberstackMembers(payload).some((member) => getMemberEmail(member) === normalizedEmail);
}

module.exports = {
    memberstackResponseContainsEmail,
    normalizeEmail,
};
