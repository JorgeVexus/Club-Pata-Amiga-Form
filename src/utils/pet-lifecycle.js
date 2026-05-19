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

function buildLatestUnsubscriptionMap(unsubscriptions = []) {
    const byPetId = new Map();
    const bySlot = new Map();

    for (const item of unsubscriptions) {
        if (!item) continue;
        const slot = Number(item.pet_index);

        if (item.pet_id && !byPetId.has(item.pet_id)) {
            byPetId.set(item.pet_id, item);
        }

        if (Number.isInteger(slot) && slot > 0 && !bySlot.has(slot)) {
            bySlot.set(slot, item);
        }
    }

    return { byPetId, bySlot };
}

function enrichPetsWithLifecycle(pets = [], customFields = {}, unsubscriptions = []) {
    const { byPetId, bySlot } = buildLatestUnsubscriptionMap(unsubscriptions);

    return pets.map((pet, index) => {
        const slot = Number(pet.memberstack_slot) || index + 1;
        const unsubscription = byPetId.get(pet.id) || bySlot.get(slot) || null;
        const inactiveInDatabase = pet.is_active === false;
        const inactiveInMemberstack = isFalseLike(getSlotActiveValue(customFields, slot));
        const isActive = !(inactiveInDatabase || (inactiveInMemberstack && !pet.memberstack_slot));

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
    getAvailablePetSlot,
    isFalseLike,
};
