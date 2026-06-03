const VALID_PET_TYPES = new Set(['perro', 'gato', 'dog', 'cat']);
const VALID_GENDERS = new Set(['macho', 'hembra']);
const MIXED_BREEDS = new Set(['mestizo', 'domestico', 'doméstico']);

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePetType(value) {
  const raw = cleanString(value).toLowerCase();
  if (raw === 'dog') return 'perro';
  if (raw === 'cat') return 'gato';
  return raw;
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function normalizePetWriteInput(input = {}) {
  const ageValue = Number(input.ageValue ?? input.petAge ?? input.age_value ?? input.age ?? 0);
  const petType = normalizePetType(input.petType ?? input.pet_type);
  const gender = cleanString(input.gender).toLowerCase();
  const breed = cleanString(input.breed);
  const isMixedValue = normalizeBoolean(input.isMixed ?? input.isMixedBreed ?? input.is_mixed_breed);
  const inferredMixed = MIXED_BREEDS.has(breed.toLowerCase());

  return {
    name: cleanString(input.name ?? input.petName),
    petType,
    ageValue,
    ageUnit: cleanString(input.ageUnit ?? input.petAgeUnit ?? input.age_unit) || 'years',
    gender,
    breed,
    isMixed: isMixedValue === undefined ? inferredMixed : isMixedValue,
    coatColor: cleanString(input.coatColor ?? input.coat_color),
  };
}

function hasValidBasicPetFields(input = {}) {
  const pet = normalizePetWriteInput(input);
  return Boolean(
    pet.name &&
      VALID_PET_TYPES.has(pet.petType) &&
      Number.isFinite(pet.ageValue) &&
      pet.ageValue > 0 &&
      (pet.ageUnit === 'years' || pet.ageUnit === 'months')
  );
}

function getMissingCompletePetFields(input = {}) {
  const pet = normalizePetWriteInput(input);
  const missing = [];

  if (!pet.name) missing.push('name');
  if (!VALID_PET_TYPES.has(pet.petType)) missing.push('petType');
  if (!Number.isFinite(pet.ageValue) || pet.ageValue <= 0) missing.push('age');
  if (!VALID_GENDERS.has(pet.gender)) missing.push('gender');
  if (pet.isMixed !== true && !pet.breed) missing.push('breed');
  if (!pet.coatColor) missing.push('coatColor');

  return missing;
}

function hasCompleteRequiredPetFields(input = {}) {
  return getMissingCompletePetFields(input).length === 0;
}

module.exports = {
  getMissingCompletePetFields,
  hasCompleteRequiredPetFields,
  hasValidBasicPetFields,
  normalizePetWriteInput,
};
