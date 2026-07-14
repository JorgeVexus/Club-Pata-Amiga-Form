const FIELD_DEFINITIONS = [
  { fields: [{ key: 'photo1Url', dbKey: 'photo_url' }, { key: 'photo2Url', dbKey: 'photo2_url' }, { key: 'photo3Url', dbKey: 'photo3_url' }, { key: 'photo4Url', dbKey: 'photo4_url' }, { key: 'photo5Url', dbKey: 'photo5_url' }], label: 'fotos', singlePhrase: 'las fotos' },
  { fields: [{ key: 'vetCertificateUrl', dbKey: 'vet_certificate_url' }], label: 'certificado veterinario', singlePhrase: 'el certificado veterinario' },
  { fields: [{ key: 'birthMonth', dbKey: 'birth_month' }, { key: 'birthYear', dbKey: 'birth_year' }], label: 'cumpleaños', singlePhrase: 'el cumpleaños' },
  { fields: [{ key: 'gender', dbKey: 'gender' }], label: 'género', singlePhrase: 'el género' },
  { fields: [{ key: 'coatColor', dbKey: 'coat_color' }], label: 'color de pelo', singlePhrase: 'el color de pelo' },
  { fields: [{ key: 'noseColor', dbKey: 'nose_color' }], label: 'color de nariz', singlePhrase: 'el color de nariz' },
  { fields: [{ key: 'eyeColor', dbKey: 'eye_color' }], label: 'color de ojos', singlePhrase: 'el color de ojos' },
  { fields: [{ key: 'breed', dbKey: 'breed' }, { key: 'isMixedBreed', dbKey: 'is_mixed_breed' }], label: 'raza', singlePhrase: 'la raza' },
  { fields: [{ key: 'isAdopted', dbKey: 'is_adopted' }], label: 'estado de adopción', singlePhrase: 'el estado de adopción' },
  { fields: [{ key: 'adoptionStory', dbKey: 'adoption_story' }], label: 'historia de adopción', singlePhrase: 'la historia de adopción' },
];

function normalizeComparableValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
}

function fieldWasUpdated(updateInput, currentPet, field) {
  if (updateInput[field.key] === undefined) return false;
  if (!currentPet) return true;

  return normalizeComparableValue(updateInput[field.key]) !== normalizeComparableValue(currentPet[field.dbKey]);
}

function getPetUpdateLabels(updateInput, currentPet) {
  return FIELD_DEFINITIONS
    .filter((definition) => definition.fields.some((field) => fieldWasUpdated(updateInput, currentPet, field)))
    .map((definition) => definition.label);
}

function getSingleFieldPhrase(label) {
  return FIELD_DEFINITIONS.find((definition) => definition.label === label)?.singlePhrase || label;
}

function formatList(items) {
  if (items.length === 0) return 'información';
  if (items.length === 1) return getSingleFieldPhrase(items[0]);
  if (items.length === 2) return `${items[0]} y ${items[1]}`;

  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function buildPetUpdateNotificationMessage({ ownerName, petName, updatedLabels }) {
  const updateSummary = formatList(updatedLabels);
  return `${ownerName} actualizó ${updateSummary} de ${petName}.`;
}

module.exports = {
  buildPetUpdateNotificationMessage,
  getPetUpdateLabels,
};
