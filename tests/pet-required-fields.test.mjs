import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMissingCompletePetFields,
  hasCompleteRequiredPetFields,
  hasValidBasicPetFields,
  normalizePetWriteInput,
} from '../src/utils/pet-required-fields.js';

test('hasValidBasicPetFields requires name, species, and age', () => {
  assert.equal(hasValidBasicPetFields({ name: 'Max', petType: 'perro', ageValue: 3, ageUnit: 'years' }), true);
  assert.equal(hasValidBasicPetFields({ name: 'Max', breed: 'Mestizo' }), false);
  assert.equal(hasValidBasicPetFields({ name: 'Max', petType: 'perro', ageValue: 0, ageUnit: 'years' }), false);
});

test('getMissingCompletePetFields detects Max-like incomplete row', () => {
  const missing = getMissingCompletePetFields({
    name: 'Max',
    breed: 'Mestizo',
    photo_url: 'https://example.com/max.jpg',
    pet_type: null,
    gender: null,
    age_value: null,
    age_unit: 'years',
    coat_color: null,
    is_mixed_breed: false,
  });

  assert.deepEqual(missing.sort(), ['age', 'coatColor', 'gender', 'petType'].sort());
});

test('complete public add payload passes required validation', () => {
  const input = normalizePetWriteInput({
    name: 'Paris',
    petType: 'perro',
    ageValue: 4,
    ageUnit: 'years',
    gender: 'hembra',
    breed: 'Border Collie',
    isMixed: false,
    coatColor: 'Blanco y negro',
  });

  assert.equal(hasCompleteRequiredPetFields(input), true);
  assert.deepEqual(getMissingCompletePetFields(input), []);
});

test('breed is required when pet is not mixed', () => {
  const missing = getMissingCompletePetFields({
    name: 'Paris',
    petType: 'perro',
    ageValue: 4,
    ageUnit: 'years',
    gender: 'hembra',
    isMixed: false,
    coatColor: 'Blanco y negro',
  });

  assert.equal(missing.includes('breed'), true);
});

test('mixed pets do not require explicit breed text', () => {
  const missing = getMissingCompletePetFields({
    name: 'Max',
    petType: 'perro',
    ageValue: 3,
    ageUnit: 'years',
    gender: 'macho',
    isMixed: true,
    coatColor: 'Cafe',
  });

  assert.deepEqual(missing, []);
});

test('legacy add-pet payload without age and coat color is incomplete', () => {
  const missing = getMissingCompletePetFields({
    memberstackId: 'mem_123',
    name: 'Max',
    petType: 'perro',
    gender: 'macho',
    breed: 'Mestizo',
    isMixed: true,
  });

  assert.deepEqual(missing.sort(), ['age', 'coatColor'].sort());
});

test('pets/add nested petData without petType is incomplete', () => {
  const missing = getMissingCompletePetFields({
    name: 'Paris',
    breed: 'Border Collie',
    photo1Url: 'https://example.com/paris.jpg',
  });

  assert.deepEqual(missing.sort(), ['age', 'coatColor', 'gender', 'petType'].sort());
});

test('merged existing pet plus partial photo update remains incomplete', () => {
  const existingPet = {
    name: 'Max',
    breed: 'Mestizo',
    photo_url: 'https://example.com/max.jpg',
    pet_type: null,
    gender: null,
    age_value: null,
    age_unit: 'years',
    coat_color: null,
    is_mixed_breed: false,
  };

  const submittedUpdate = {
    photo1Url: 'https://example.com/new-max.jpg',
  };

  const missing = getMissingCompletePetFields({
    ...existingPet,
    ...submittedUpdate,
  });

  assert.equal(missing.includes('petType'), true);
  assert.equal(missing.includes('age'), true);
  assert.equal(missing.includes('gender'), true);
  assert.equal(missing.includes('coatColor'), true);
});

test('preliminary Step 2 row can be basic but not complete', () => {
  const pet = {
    petName: 'Luna',
    petType: 'gato',
    petAge: 2,
    petAgeUnit: 'years',
  };

  assert.equal(hasValidBasicPetFields(pet), true);
  assert.equal(hasCompleteRequiredPetFields(pet), false);
});
