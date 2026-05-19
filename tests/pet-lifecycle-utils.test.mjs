import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enrichPetsWithLifecycle,
  getActivePetCount,
  getAvailablePetSlot,
  getEffectiveActivePetCount,
} from '../src/utils/pet-lifecycle.js';

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
