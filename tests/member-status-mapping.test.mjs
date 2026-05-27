import test from 'node:test';
import assert from 'node:assert/strict';

import { mapPetDerivedStatusToUserStatuses } from '../src/utils/member-status-mapping.js';

test('mapPetDerivedStatusToUserStatuses keeps pending approval_status inside database constraints', () => {
  assert.deepEqual(mapPetDerivedStatusToUserStatuses('pending'), {
    membership_status: 'pending',
    approval_status: 'pending',
  });
});

test('mapPetDerivedStatusToUserStatuses maps active members to approved approval_status', () => {
  assert.deepEqual(mapPetDerivedStatusToUserStatuses('active'), {
    membership_status: 'active',
    approval_status: 'approved',
  });
});

