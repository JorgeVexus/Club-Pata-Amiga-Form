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

  const hasAnyPetEvidence = Boolean(validPetBasic);

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

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isActivePet(pet) {
  return pet?.is_active !== false && pet?.status !== 'unsubscribed';
}

function isCompletePet(pet) {
  const petType = String(pet?.pet_type || pet?.petType || '').trim().toLowerCase();
  const hasValidType = VALID_PET_TYPES.has(petType);
  const hasValidAge = Number(pet?.age_value ?? pet?.ageValue ?? 0) > 0;
  const hasValidGender = pet?.gender === 'macho' || pet?.gender === 'hembra';
  const hasBreedType = typeof pet?.is_mixed_breed === 'boolean';
  const breed = String(pet?.breed || '').trim();
  const hasBreed = pet?.is_mixed_breed === true || (
    pet?.is_mixed_breed === false &&
    breed.length > 0 &&
    breed !== 'Mestizo' &&
    breed !== 'Doméstico'
  );
  const hasPhoto = hasText(pet?.primary_photo_url) || hasText(pet?.photo_url);
  const hasVetCertificate = !pet?.is_senior || hasText(pet?.vet_certificate_url);

  return hasValidType &&
    hasValidAge &&
    hasValidGender &&
    hasBreedType &&
    hasBreed &&
    hasText(pet?.coat_color) &&
    hasPhoto &&
    hasVetCertificate;
}

function getMemberCompletionIssue(user, pets) {
  const hasMemberInfo = user && [
    user.first_name,
    user.last_name,
    user.mother_last_name,
    user.curp,
    user.phone,
    user.postal_code,
    user.colony,
    user.city,
  ].every(hasText);

  if (!hasMemberInfo) {
    return 'missing_member_info';
  }

  const activePets = (Array.isArray(pets) ? pets : []).filter(isActivePet);
  if (activePets.length === 0) {
    return 'missing_pet';
  }

  if (activePets.some((pet) => !isCompletePet(pet))) {
    return 'incomplete_pet';
  }

  return null;
}

module.exports = {
  clampRequestedRegistrationStep,
  getMemberCompletionIssue,
  getRegistrationIssue,
  hasValidPetBasic,
  normalizePetBasicList,
};
