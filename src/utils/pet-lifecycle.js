const MAX_PETS = 3;

function isFalseLike(value) {
    return value === false || value === 0 || value === 'false' || value === '0';
}

function isTrueLike(value) {
    return value === true || value === 1 || value === 'true' || value === '1';
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
    return pets.filter((pet) => !isUnsubscribedPet(pet)).length;
}

function isUnsubscribedPet(pet = {}) {
    return pet?.is_active === false || pet?.status === 'unsubscribed';
}

function isUnsubscribedPetWithHistory(pet = {}, unsubscriptions = []) {
    if (isUnsubscribedPet(pet)) return true;

    const [petWithLifecycle] = enrichPetsWithLifecycle([pet], {}, unsubscriptions);
    return petWithLifecycle?.is_active === false || petWithLifecycle?.status === 'unsubscribed';
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
        const slotActiveValue = getSlotActiveValue(customFields, slot);
        const slotExplicitlyActive = isTrueLike(slotActiveValue);
        const unsubscription =
            byPetId.get(pet.id) ||
            (petName ? bySlotAndName.get(`${slot}:${petName}`) : null) ||
            bySlot.get(slot) ||
            null;
        const unsubscriptionMatchesPetId = Boolean(unsubscription?.pet_id && unsubscription.pet_id === pet.id);
        const unsubscriptionMatchesName = Boolean(
            petName &&
            unsubscription?.pet_name &&
            unsubscription.pet_name.trim().toLowerCase() === petName
        );
        const inactiveByUnsubscription = Boolean(unsubscription && (
            unsubscriptionMatchesPetId ||
            (!slotExplicitlyActive && unsubscriptionMatchesName) ||
            isFalseLike(slotActiveValue)
        ));
        const inactiveInDatabase = pet.is_active === false;
        const inactiveInMemberstack = isFalseLike(slotActiveValue);
        const isActive = !(inactiveByUnsubscription || inactiveInDatabase || pet.status === 'unsubscribed' || (inactiveInMemberstack && !pet.memberstack_slot));
        const appliedUnsubscription = inactiveByUnsubscription || inactiveInDatabase || pet.status === 'unsubscribed'
            ? unsubscription
            : null;

        return {
            ...pet,
            memberstack_slot: slot,
            is_active: isActive,
            unsubscribed_reason: pet.unsubscribed_reason || appliedUnsubscription?.reason || null,
            unsubscribed_description: pet.unsubscribed_description || appliedUnsubscription?.description || null,
            unsubscribed_at: pet.unsubscribed_at || appliedUnsubscription?.created_at || null,
        };
    });
}

function getSolidarityWaitingPeriodEnd(pet = {}) {
    const start = new Date(pet.waiting_period_start || pet.created_at || new Date());
    if (isNaN(start.getTime())) return new Date();

    const isAdopted = String(pet.is_adopted) === 'true' || pet.is_adopted === true;
    const isMixed = String(pet.is_mixed_breed) === 'true' || pet.is_mixed_breed === true;

    let days = 180;
    if (isAdopted) days = 90;
    else if (isMixed) days = 120;

    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return end;
}

function getSolidarityPetLifecycleSummary(pets = [], customFields = {}, unsubscriptions = [], now = new Date()) {
    let activePets = 0;
    let pendingPets = 0;

    const petsWithExtraData = enrichPetsWithLifecycle(pets, customFields, unsubscriptions).map((pet) => {
        const isInactive = isUnsubscribedPet(pet);
        const isApproved = pet.status === 'approved';
        const waitingPeriodEnd = getSolidarityWaitingPeriodEnd(pet);
        const hasFinishedWaiting = waitingPeriodEnd <= now;
        const isEligible = !isInactive && isApproved && hasFinishedWaiting;

        if (!isInactive) {
            if (isEligible) activePets += 1;
            else pendingPets += 1;
        }

        const isSenior = pet.is_senior || false;
        const hasCertificate = !!pet.vet_certificate_url;
        const needsSeniorCertificate = isSenior && !hasCertificate;

        return {
            ...pet,
            isEligible,
            needsSeniorCertificate,
        };
    });

    return {
        pets: petsWithExtraData,
        activePets,
        pendingPets,
    };
}

module.exports = {
    MAX_PETS,
    enrichPetsWithLifecycle,
    getActivePetCount,
    getEffectiveActivePetCount,
    getRegistrationActivePetCount,
    getAvailablePetSlot,
    getSolidarityPetLifecycleSummary,
    isFalseLike,
    isTrueLike,
    isUnsubscribedPet,
    isUnsubscribedPetWithHistory,
};
