const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
    return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function normalizeMemberstackSlot(value) {
    if (typeof value === 'string') {
        const petSlotMatch = value.match(/^pet-(\d+)$/i);
        const parsed = Number(petSlotMatch ? petSlotMatch[1] : value);
        return Number.isInteger(parsed) && parsed >= 1 && parsed <= 3 ? parsed : null;
    }

    return Number.isInteger(value) && value >= 1 && value <= 3 ? value : null;
}

function buildAdminPetLookupAttempts({ petId, memberstackSlot, petName } = {}) {
    const attempts = [];
    const normalizedPetId = typeof petId === 'string' ? petId.trim() : '';
    const normalizedSlot = normalizeMemberstackSlot(memberstackSlot) || normalizeMemberstackSlot(normalizedPetId);
    const normalizedName = typeof petName === 'string' ? petName.trim() : '';

    if (isUuid(normalizedPetId)) {
        attempts.push({ type: 'id', value: normalizedPetId });
    }

    if (normalizedSlot) {
        attempts.push({ type: 'slot', value: normalizedSlot });
    }

    if (normalizedName) {
        attempts.push({ type: 'name', value: normalizedName });
    }

    return attempts;
}

module.exports = {
    buildAdminPetLookupAttempts,
    isUuid,
    normalizeMemberstackSlot,
};
