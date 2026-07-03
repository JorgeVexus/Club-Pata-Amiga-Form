import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    calculateSolidarityBalances,
    getSolidarityAvailableAmount,
} = require('../src/utils/solidarity-balance.js');

test('solidarity balances are shared globally across pets in the same membership', () => {
    const balances = calculateSolidarityBalances([
        {
            user_id: 'member-uuid-1',
            pet_id: 'pet-a',
            benefit_type: 'medical_emergency',
            requested_amount: 3000,
            approved_amount: 3000,
            status: 'approved',
        },
        {
            user_id: 'member-uuid-1',
            pet_id: 'pet-b',
            benefit_type: 'annual_vaccination',
            requested_amount: 300,
            approved_amount: null,
            status: 'new',
        },
    ]);

    assert.equal(balances.medical_emergency.used, 3000);
    assert.equal(balances.medical_emergency.available, 0);
    assert.equal(balances.annual_vaccination.used, 300);
    assert.equal(balances.annual_vaccination.available, 0);
    assert.equal(balances.death.available, 2000);
});

test('rejected and cancelled solidarity requests do not consume membership balance', () => {
    const balances = calculateSolidarityBalances([
        {
            benefit_type: 'medical_emergency',
            requested_amount: 3000,
            approved_amount: null,
            status: 'rejected',
        },
        {
            benefit_type: 'death',
            requested_amount: 2000,
            approved_amount: null,
            status: 'cancelled',
        },
    ]);

    assert.equal(balances.medical_emergency.available, 3000);
    assert.equal(balances.death.available, 2000);
});

test('getSolidarityAvailableAmount reads the remaining amount for a benefit type', () => {
    const available = getSolidarityAvailableAmount([
        {
            benefit_type: 'medical_emergency',
            requested_amount: 1200,
            approved_amount: null,
            status: 'in_review',
        },
    ], 'medical_emergency');

    assert.equal(available, 1800);
});
