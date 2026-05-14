import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeCancellationRequest,
  calculateDaysRemaining,
  formatDateForStorage,
} from '../src/utils/membership-cancellation.js';

test('normalizeCancellationRequest accepts a valid reason and trims optional text', () => {
  const result = normalizeCancellationRequest({
    reason: 'other',
    reasonOtherText: '  Me mude de ciudad  ',
    comments: '  Gracias por todo  ',
  });

  assert.deepEqual(result, {
    reason: 'other',
    reasonOtherText: 'Me mude de ciudad',
    comments: 'Gracias por todo',
  });
});

test('normalizeCancellationRequest rejects an invalid reason', () => {
  assert.throws(
    () => normalizeCancellationRequest({ reason: 'delete_my_user' }),
    /Motivo de cancelacion invalido/,
  );
});

test('calculateDaysRemaining rounds up partial remaining days', () => {
  const now = new Date('2026-05-14T12:00:00.000Z');
  const periodEnd = new Date('2026-05-16T00:00:00.000Z');

  assert.equal(calculateDaysRemaining(periodEnd, now), 2);
});

test('formatDateForStorage returns YYYY-MM-DD in UTC', () => {
  assert.equal(formatDateForStorage(new Date('2026-08-14T23:59:59.000Z')), '2026-08-14');
});
