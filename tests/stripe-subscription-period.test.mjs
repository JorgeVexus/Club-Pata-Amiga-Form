import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveSubscriptionPeriodEnd,
  toStripeTimestampIso,
} from '../src/utils/stripe-subscription-period.js';

test('resolveSubscriptionPeriodEnd reads current period end from the first subscription item', () => {
  const periodEnd = resolveSubscriptionPeriodEnd({
    current_period_end: null,
    trial_end: null,
    cancel_at: null,
    items: {
      data: [
        {
          current_period_end: 1780704000,
          price: {
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
        },
      ],
    },
  });

  assert.equal(periodEnd, 1780704000);
});

test('resolveSubscriptionPeriodEnd falls back to the next billing anchor cycle', () => {
  const anchor = Date.parse('2024-06-01T02:00:00.000Z') / 1000;
  const periodEnd = resolveSubscriptionPeriodEnd(
    {
      current_period_end: null,
      trial_end: null,
      cancel_at: null,
      billing_cycle_anchor: anchor,
      items: {
        data: [
          {
            price: {
              recurring: {
                interval: 'month',
                interval_count: 1,
              },
            },
          },
        ],
      },
    },
    new Date('2026-05-15T00:00:00.000Z'),
  );

  assert.equal(toStripeTimestampIso(periodEnd), '2026-06-01T02:00:00.000Z');
});

test('toStripeTimestampIso returns null for missing timestamps', () => {
  assert.equal(toStripeTimestampIso(null), null);
});
