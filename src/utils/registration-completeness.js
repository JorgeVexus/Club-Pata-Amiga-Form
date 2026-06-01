const VALID_PET_TYPES = new Set(['perro', 'gato', 'dog', 'cat']);

function normalizePetBasicList(value) {
  const rawPets = Array.isArray(value) ? value : value ? [value] : [];

  return rawPets
    .map((pet) => {
      const petName = String(pet?.petName || pet?.name || '').trim();
      const rawType = String(pet?.petType || pet?.pet_type || '').trim().toLowerCase();
      const petType = rawType === 'dog' ? 'perro' : rawType === 'cat' ? 'gato' : rawType;
      const petAge = Number(pet?.petAge ?? pet?.age ?? pet?.age_value ?? 0);
      const rawAgeUnit = String(pet?.petAgeUnit || pet?.ageUnit || pet?.age_unit || 'years').trim();
      const petAgeUnit = rawAgeUnit === 'months' ? 'months' : 'years';

      return { petName, petType, petAge, petAgeUnit };
    })
    .filter((pet) => pet.petName || pet.petType || pet.petAge);
}

function hasValidPetBasic(value) {
  return normalizePetBasicList(value).some((pet) => (
    pet.petName.length > 0 &&
    VALID_PET_TYPES.has(pet.petType) &&
    Number.isFinite(pet.petAge) &&
    pet.petAge > 0 &&
    (pet.petAgeUnit === 'years' || pet.petAgeUnit === 'months')
  ));
}

function clampRequestedRegistrationStep({
  requestedStep,
  computedStep,
  hasValidPetBasic: validPetBasic,
  hasPetsInDb,
  paymentCompleted,
  finishOnboarding,
  petRecovery,
}) {
  const safeComputedStep = Number.isFinite(Number(computedStep)) ? Number(computedStep) : 1;
  const safeRequestedStep = Number.isFinite(Number(requestedStep)) ? Number(requestedStep) : 0;
  let finalStep = Math.max(safeComputedStep, 1);

  if (safeRequestedStep > 0 && safeRequestedStep <= 6) {
    finalStep = safeRequestedStep;
  }

  const hasAnyPetEvidence = Boolean(validPetBasic || hasPetsInDb);

  if (paymentCompleted && petRecovery) {
    return hasAnyPetEvidence ? 5 : 2;
  }

  if (!hasAnyPetEvidence && !paymentCompleted && finalStep >= 3) {
    return 2;
  }

  if (!hasAnyPetEvidence && paymentCompleted && finishOnboarding) {
    return 4;
  }

  return finalStep;
}

function getRegistrationIssue({ hasActivePlan, petCount, hasValidPetBasic: validPetBasic }) {
  if (hasActivePlan && Number(petCount || 0) === 0 && !validPetBasic) {
    return 'paid_without_pets';
  }

  if (hasActivePlan && Number(petCount || 0) === 0 && validPetBasic) {
    return 'paid_without_complete_pet_rows';
  }

  return null;
}

module.exports = {
  clampRequestedRegistrationStep,
  getRegistrationIssue,
  hasValidPetBasic,
  normalizePetBasicList,
};
