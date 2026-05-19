const MAX_PETS = 3;

function isFalseLike(value) {
    return value === false || value === 0 || value === 'false' || value === '0';
}

function getSlotActiveValue(customFields, slot) {
    return customFields?.[`pet-${slot}-is-active`];
}

function getAvailablePetSlot(customFields = {}, maxPets = MAX_PETS) {
    for (let slot = 1; slot <= maxPets; slot += 1) {
        const hasName = Boolean(customFields[`pet-${slot}-name`]);
        const isInactive = isFalseLike(getSlotActiveValue(customFields, slot));

        if (!hasName || isInactive) {
            return slot;
        }
    }

    return null;
}

function getActivePetCount(pets = []) {
    return pets.filter((pet) => pet?.is_active !== false).length;
}

function getActiveMemberstackSlotCount(customFields = {}, maxPets = MAX_PETS) {
    let count = 0;

    for (let slot = 1; slot <= maxPets; slot += 1) {
        const hasName = Boolean(customFields[`pet-${slot}-name`]);
        const isInactive = isFalseLike(getSlotActiveValue(customFields, slot));

        if (hasName && !isInactive) {
            count += 1;
        }
    }

    return count;
}

function hasAnyMemberstackPetSlot(customFields = {}, maxPets = MAX_PETS) {
    for (let slot = 1; slot <= maxPets; slot += 1) {
        if (customFields[`pet-${slot}-name`]) {
            return true;
        }
    }

    return false;
}

function getEffectiveActivePetCount(customFields = {}, pets = [], maxPets = MAX_PETS) {
    if (hasAnyMemberstackPetSlot(customFields, maxPets)) {
        return getActiveMemberstackSlotCount(customFields, maxPets);
    }

    return getActivePetCount(pets);
}

function getRegistrationActivePetCount(pets = [], legacyActiveSlotCount = null) {
    const supabaseActiveCount = getActivePetCount(pets);

    if (
        Number.isInteger(legacyActiveSlotCount) &&
        legacyActiveSlotCount >= 0 &&
        legacyActiveSlotCount < supabaseActiveCount
    ) {
        return legacyActiveSlotCount;
    }

    return supabaseActiveCount;
}

function buildLatestUnsubscriptionMap(unsubscriptions = []) {
    const byPetId = new Map();
    const bySlot = new Map();
    const bySlotAndName = new Map();

    for (const item of unsubscriptions) {
        if (!item) continue;
        const slot = Number(item.pet_index);
        const petName = typeof item.pet_name === 'string' ? item.pet_name.trim().toLowerCase() : '';

        if (item.pet_id && !byPetId.has(item.pet_id)) {
            byPetId.set(item.pet_id, item);
        }

        if (Number.isInteger(slot) && slot > 0 && petName && !bySlotAndName.has(`${slot}:${petName}`)) {
            bySlotAndName.set(`${slot}:${petName}`, item);
        }

        if (Number.isInteger(slot) && slot > 0 && !bySlot.has(slot)) {
            bySlot.set(slot, item);
        }
    }

    return { byPetId, bySlot, bySlotAndName };
}

function enrichPetsWithLifecycle(pets = [], customFields = {}, unsubscriptions = []) {
    const { byPetId, bySlot, bySlotAndName } = buildLatestUnsubscriptionMap(unsubscriptions);

    return pets.map((pet, index) => {
        const slot = Number(pet.memberstack_slot) || index + 1;
        const petName = typeof pet.name === 'string' ? pet.name.trim().toLowerCase() : '';
        const unsubscription =
            byPetId.get(pet.id) ||
            (petName ? bySlotAndName.get(`${slot}:${petName}`) : null) ||
            bySlot.get(slot) ||
            null;
        const inactiveByUnsubscription = Boolean(unsubscription && (
            unsubscription.pet_id === pet.id ||
            (petName && unsubscription.pet_name && unsubscription.pet_name.trim().toLowerCase() === petName) ||
            isFalseLike(getSlotActiveValue(customFields, slot))
        ));
        const inactiveInDatabase = pet.is_active === false;
        const inactiveInMemberstack = isFalseLike(getSlotActiveValue(customFields, slot));
        const isActive = !(inactiveByUnsubscription || inactiveInDatabase || (inactiveInMemberstack && !pet.memberstack_slot));

        return {
            ...pet,
            memberstack_slot: slot,
            is_active: isActive,
            unsubscribed_reason: pet.unsubscribed_reason || unsubscription?.reason || null,
            unsubscribed_description: pet.unsubscribed_description || unsubscription?.description || null,
            unsubscribed_at: pet.unsubscribed_at || unsubscription?.created_at || null,
        };
    });
}

module.exports = {
    MAX_PETS,
    enrichPetsWithLifecycle,
    getActivePetCount,
    getEffectiveActivePetCount,
    getRegistrationActivePetCount,
    getAvailablePetSlot,
    isFalseLike,
};
