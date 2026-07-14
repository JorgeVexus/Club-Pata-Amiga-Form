import test from 'node:test';
import assert from 'node:assert/strict';

import { mapPetDerivedStatusToUserStatuses } from '../src/utils/member-status-mapping.js';

test('mapPetDerivedStatusToUserStatuses keeps paid members active while pets are pending', () => {
  assert.deepEqual(mapPetDerivedStatusToUserStatuses('pending'), {
    membership_status: 'active',
    approval_status: 'approved',
  });
});

test('mapPetDerivedStatusToUserStatuses maps active members to approved approval_status', () => {
  assert.deepEqual(mapPetDerivedStatusToUserStatuses('active'), {
    membership_status: 'active',
    approval_status: 'approved',
  });
});

test('mapPetDerivedStatusToUserStatuses does not downgrade paid members for pet review states', () => {
  for (const status of ['appealed', 'rejected', 'action_required']) {
    assert.deepEqual(mapPetDerivedStatusToUserStatuses(status), {
      membership_status: 'active',
      approval_status: 'approved',
    });
  }
});
