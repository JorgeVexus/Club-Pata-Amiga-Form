import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasValidPetBasic,
  normalizePetBasicList,
  clampRequestedRegistrationStep,
  getRegistrationIssue,
} from '../src/utils/registration-completeness.js';

test('hasValidPetBasic requires at least one complete pet', () => {
  assert.equal(hasValidPetBasic(undefined), false);
  assert.equal(hasValidPetBasic([]), false);
  assert.equal(hasValidPetBasic([{ petName: 'Luna' }]), false);
  assert.equal(hasValidPetBasic([{ petName: 'Luna', petType: 'perro', petAge: 2, petAgeUnit: 'years' }]), true);
});

test('normalizePetBasicList supports legacy single pet object', () => {
  const result = normalizePetBasicList({
    petName: 'Michi',
    petType: 'gato',
    petAge: '4',
    petAgeUnit: 'years',
  });

  assert.deepEqual(result, [
    {
      petName: 'Michi',
      petType: 'gato',
      petAge: 4,
      petAgeUnit: 'years',
    },
  ]);
});

test('clampRequestedRegistrationStep prevents jumping to payment without pet basics', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 3,
    computedStep: 2,
    hasValidPetBasic: false,
    hasPetsInDb: false,
    paymentCompleted: false,
    finishOnboarding: false,
  });

  assert.equal(result, 2);
});

test('clampRequestedRegistrationStep allows paid users to finish onboarding at profile step', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 5,
    computedStep: 4,
    hasValidPetBasic: false,
    hasPetsInDb: false,
    paymentCompleted: true,
    finishOnboarding: true,
  });

  assert.equal(result, 4);
});

test('clampRequestedRegistrationStep sends paid finish-onboarding users to profile even with low saved progress', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 0,
    computedStep: 2,
    hasValidPetBasic: false,
    hasPetsInDb: false,
    paymentCompleted: true,
    finishOnboarding: true,
  });

  assert.equal(result, 4);
});

test('clampRequestedRegistrationStep sends paid pet-recovery users without pet basics to step 2', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 0,
    computedStep: 4,
    hasValidPetBasic: false,
    hasPetsInDb: false,
    paymentCompleted: true,
    finishOnboarding: false,
    petRecovery: true,
  });

  assert.equal(result, 2);
});

test('clampRequestedRegistrationStep sends paid pet-recovery users with pet basics to step 5', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 0,
    computedStep: 4,
    hasValidPetBasic: true,
    hasPetsInDb: false,
    paymentCompleted: true,
    finishOnboarding: false,
    petRecovery: true,
  });

  assert.equal(result, 5);
});

test('clampRequestedRegistrationStep does not treat incomplete DB pet rows as valid pet recovery evidence', () => {
  const result = clampRequestedRegistrationStep({
    requestedStep: 0,
    computedStep: 4,
    hasValidPetBasic: false,
    hasPetsInDb: true,
    paymentCompleted: true,
    finishOnboarding: false,
    petRecovery: true,
  });

  assert.equal(result, 2);
});

test('getRegistrationIssue detects paid member without pets', () => {
  assert.equal(
    getRegistrationIssue({
      hasActivePlan: true,
      petCount: 0,
      hasValidPetBasic: false,
    }),
    'paid_without_pets',
  );
});
