import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enrichPetsWithLifecycle,
  getActivePetCount,
  getAvailablePetSlot,
  getEffectiveActivePetCount,
  getRegistrationActivePetCount,
  getSolidarityPetLifecycleSummary,
  isApprovedUnsubscription,
  isUnsubscribedPetWithHistory,
  isUnsubscribedPet,
} from '../src/utils/pet-lifecycle.js';

test('only approved or legacy unsubscription records are terminal', () => {
  assert.equal(isApprovedUnsubscription({ status: 'pending' }), false);
  assert.equal(isApprovedUnsubscription({ status: 'rejected' }), false);
  assert.equal(isApprovedUnsubscription({ status: 'approved' }), true);
  assert.equal(isApprovedUnsubscription({}), true);
});

test('pending unsubscription keeps the pet active and exposes request metadata', () => {
  const [pet] = enrichPetsWithLifecycle(
    [{ id: 'pet-1', name: 'Simba', memberstack_slot: 1, is_active: true, status: 'approved' }],
    { 'pet-1-name': 'Simba', 'pet-1-is-active': 'true' },
    [{ id: 'request-1', pet_id: 'pet-1', pet_index: 1, pet_name: 'Simba', status: 'pending' }],
  );

  assert.equal(pet.is_active, true);
  assert.equal(pet.status, 'approved');
  assert.equal(pet.unsubscription_request_status, 'pending');
  assert.equal(pet.unsubscription_request_id, 'request-1');
});

test('getAvailablePetSlot reuses an inactive Memberstack slot', () => {
  const customFields = {
    'pet-1-name': 'Luna',
    'pet-1-is-active': 'false',
    'pet-2-name': 'Milo',
    'pet-2-is-active': 'true',
    'pet-3-name': 'Nala',
  };

  assert.equal(getAvailablePetSlot(customFields), 1);
});

test('getActivePetCount ignores pets explicitly marked inactive', () => {
  const pets = [
    { name: 'Luna', is_active: false },
    { name: 'Milo', is_active: true },
    { name: 'Nala' },
    { name: 'Rocky', status: 'unsubscribed' },
  ];

  assert.equal(getActivePetCount(pets), 2);
});

test('enrichPetsWithLifecycle keeps an unsubscribed pet inactive even when its slot is reused', () => {
  const pets = [
    { id: 'old-pet', name: 'Luna', memberstack_slot: 1, is_active: false },
    { id: 'new-pet', name: 'Rocky', memberstack_slot: 1, is_active: true },
  ];
  const customFields = {
    'pet-1-name': 'Rocky',
    'pet-1-is-active': 'true',
  };
  const unsubscriptions = [
    {
      pet_id: 'old-pet',
      pet_index: 1,
      reason: 'Ya no vive conmigo',
      description: 'Cambio de hogar',
      created_at: '2026-05-18T18:00:00.000Z',
    },
  ];

  const result = enrichPetsWithLifecycle(pets, customFields, unsubscriptions);

  assert.equal(result[0].is_active, false);
  assert.equal(result[0].unsubscribed_reason, 'Ya no vive conmigo');
  assert.equal(result[0].unsubscribed_description, 'Cambio de hogar');
  assert.equal(result[1].is_active, true);
});

test('enrichPetsWithLifecycle treats a matching unsubscription log as inactive when the database flag was not updated', () => {
  const pets = [
    { id: 'old-pet', name: 'Luna', memberstack_slot: 1, is_active: true },
  ];
  const customFields = {
    'pet-1-name': 'Luna',
    'pet-1-is-active': 'false',
  };
  const unsubscriptions = [
    {
      pet_id: 'old-pet',
      pet_index: 1,
      reason: 'Ya no vive conmigo',
      created_at: '2026-05-18T18:00:00.000Z',
    },
  ];

  const result = enrichPetsWithLifecycle(pets, customFields, unsubscriptions);

  assert.equal(result[0].is_active, false);
});

test('getEffectiveActivePetCount trusts active Memberstack slots when Supabase still has historical rows', () => {
  const customFields = {
    'pet-1-name': 'Luna',
    'pet-1-is-active': 'false',
    'pet-2-name': 'Milo',
    'pet-2-is-active': 'true',
    'pet-3-name': 'Nala',
    'pet-3-is-active': 'true',
  };
  const pets = [
    { name: 'Luna', is_active: true },
    { name: 'Milo', is_active: true },
    { name: 'Nala', is_active: true },
  ];

  assert.equal(getEffectiveActivePetCount(customFields, pets), 2);
});

test('enrichPetsWithLifecycle supports legacy Supabase unsubscription logs by slot and pet name', () => {
  const pets = [
    { id: 'old-pet', name: 'Luna', memberstack_slot: 1, is_active: true },
    { id: 'new-pet', name: 'Rocky', memberstack_slot: 1, is_active: true },
  ];
  const unsubscriptions = [
    {
      pet_index: 1,
      pet_name: 'Luna',
      reason: 'Ya no vive conmigo',
      created_at: '2026-05-18T18:00:00.000Z',
    },
  ];

  const result = enrichPetsWithLifecycle(pets, {}, unsubscriptions);

  assert.equal(result[0].is_active, false);
  assert.equal(result[1].is_active, true);
});

test('getRegistrationActivePetCount uses legacy active slots only to avoid blocking stale Supabase rows', () => {
  const pets = [
    { name: 'Luna', is_active: true },
    { name: 'Milo', is_active: true },
    { name: 'Nala', is_active: true },
  ];

  assert.equal(getRegistrationActivePetCount(pets, 1), 1);
});

test('isUnsubscribedPet treats inactive or unsubscribed pets as terminal records', () => {
  assert.equal(isUnsubscribedPet({ is_active: false, status: 'pending' }), true);
  assert.equal(isUnsubscribedPet({ is_active: true, status: 'unsubscribed' }), true);
  assert.equal(isUnsubscribedPet({ is_active: true, status: 'approved' }), false);
});

test('isUnsubscribedPetWithHistory detects stale active rows with unsubscription history', () => {
  const pet = { id: 'old-pet', name: 'Luna', memberstack_slot: 1, is_active: true, status: 'pending' };
  const unsubscriptions = [{ pet_index: 1, pet_name: 'Luna', reason: 'Ya no vive conmigo' }];

  assert.equal(isUnsubscribedPetWithHistory(pet, unsubscriptions), true);
});

test('getSolidarityPetLifecycleSummary excludes unsubscription history from active and pending counts', () => {
  const pets = [
    {
      id: 'legacy-pet',
      name: 'Luna',
      memberstack_slot: 1,
      is_active: true,
      status: 'pending',
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'ready-pet',
      name: 'Milo',
      memberstack_slot: 2,
      is_active: true,
      status: 'approved',
      waiting_period_start: '2025-01-01T00:00:00.000Z',
    },
  ];
  const unsubscriptions = [
    {
      pet_index: 1,
      pet_name: 'Luna',
      reason: 'Ya no vive conmigo',
      created_at: '2026-05-18T18:00:00.000Z',
    },
  ];

  const summary = getSolidarityPetLifecycleSummary(pets, {}, unsubscriptions, new Date('2026-05-19T00:00:00.000Z'));

  assert.equal(summary.pets[0].is_active, false);
  assert.equal(summary.pets[0].unsubscribed_reason, 'Ya no vive conmigo');
  assert.equal(summary.activePets, 1);
  assert.equal(summary.pendingPets, 0);
});

test('getSolidarityPetLifecycleSummary keeps a Supabase-active approved pet active despite same-name unsubscription history', () => {
  const pets = [
    {
      id: 'current-pet',
      name: 'Luna',
      memberstack_slot: 1,
      is_active: true,
      status: 'approved',
      waiting_period_start: '2025-01-01T00:00:00.000Z',
    },
  ];
  const unsubscriptions = [
    {
      pet_index: 1,
      pet_name: 'Luna',
      reason: 'Ya no vive conmigo',
      created_at: '2026-05-18T18:00:00.000Z',
    },
  ];

  const summary = getSolidarityPetLifecycleSummary(pets, {}, unsubscriptions, new Date('2026-05-19T00:00:00.000Z'));

  assert.equal(summary.pets[0].is_active, true);
  assert.equal(summary.pets[0].unsubscribed_reason, null);
  assert.equal(summary.activePets, 1);
  assert.equal(summary.pendingPets, 0);
});
