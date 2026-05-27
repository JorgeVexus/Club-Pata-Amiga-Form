import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAdminPetLookupAttempts,
  isUuid,
  normalizeMemberstackSlot,
} from '../src/utils/admin-pet-lookup.js';

test('isUuid only accepts canonical UUID values', () => {
  assert.equal(isUuid('8076f4df-4197-4e77-8661-33654da202a8'), true);
  assert.equal(isUuid('pet-1'), false);
  assert.equal(isUuid('1'), false);
  assert.equal(isUuid(''), false);
});

test('normalizeMemberstackSlot accepts only valid pet slots', () => {
  assert.equal(normalizeMemberstackSlot(1), 1);
  assert.equal(normalizeMemberstackSlot('2'), 2);
  assert.equal(normalizeMemberstackSlot('pet-3'), 3);
  assert.equal(normalizeMemberstackSlot(4), null);
  assert.equal(normalizeMemberstackSlot('pet-main'), null);
});

test('buildAdminPetLookupAttempts falls back to slot and name when pet id is not a UUID', () => {
  const attempts = buildAdminPetLookupAttempts({
    petId: 'pet-1',
    memberstackSlot: '1',
    petName: 'Luna',
  });

  assert.deepEqual(attempts, [
    { type: 'slot', value: 1 },
    { type: 'name', value: 'Luna' },
  ]);
});

test('buildAdminPetLookupAttempts keeps UUID lookup first and adds slot fallback for stale ids', () => {
  const attempts = buildAdminPetLookupAttempts({
    petId: '8076f4df-4197-4e77-8661-33654da202a8',
    memberstackSlot: 2,
    petName: 'Milo',
  });

  assert.deepEqual(attempts, [
    { type: 'id', value: '8076f4df-4197-4e77-8661-33654da202a8' },
    { type: 'slot', value: 2 },
    { type: 'name', value: 'Milo' },
  ]);
});
