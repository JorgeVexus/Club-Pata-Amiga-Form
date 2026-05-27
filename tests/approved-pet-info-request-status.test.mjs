import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFulfillRequestPetUpdate,
  buildInfoRequestPetUpdate,
  shouldPreserveApprovedPetStatusDuringInfoRequest,
} from '../src/utils/pet-info-request-status.js';

test('shouldPreserveApprovedPetStatusDuringInfoRequest preserves approved pets with active waiting period', () => {
  assert.equal(
    shouldPreserveApprovedPetStatusDuringInfoRequest({
      status: 'approved',
      waiting_period_start: '2026-05-01T00:00:00.000Z',
      waiting_period_end: '2026-09-01T00:00:00.000Z',
    }),
    true,
  );
});

test('buildInfoRequestPetUpdate does not move approved pets with waiting period to action_required', () => {
  assert.deepEqual(
    buildInfoRequestPetUpdate(
      {
        status: 'approved',
        waiting_period_start: '2026-05-01T00:00:00.000Z',
      },
      'Solicitamos una foto actualizada',
    ),
    {
      last_admin_response: 'Solicitamos una foto actualizada',
    },
  );
});

test('buildFulfillRequestPetUpdate does not move approved pets with waiting period back to pending', () => {
  assert.deepEqual(
    buildFulfillRequestPetUpdate(
      {
        status: 'approved',
        waiting_period_start: '2026-05-01T00:00:00.000Z',
      },
      'photo_url',
      'https://cdn.example.com/felipe.jpg',
    ),
    {
      photo_url: 'https://cdn.example.com/felipe.jpg',
    },
  );
});

test('buildFulfillRequestPetUpdate still moves non-approved pets to pending after response', () => {
  assert.deepEqual(
    buildFulfillRequestPetUpdate(
      {
        status: 'action_required',
        waiting_period_start: null,
      },
      'vet_certificate_url',
      'https://cdn.example.com/cert.pdf',
    ),
    {
      vet_certificate_url: 'https://cdn.example.com/cert.pdf',
      status: 'pending',
    },
  );
});

