import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    memberstackResponseContainsEmail,
} = require('../src/utils/memberstack-email-availability.js');

test('memberstackResponseContainsEmail ignores members with different emails', () => {
    const response = {
        data: [
            { auth: { email: 'otra.persona@example.com' } },
            { email: 'aliado@pataamiga.mx' },
        ],
    };

    assert.equal(memberstackResponseContainsEmail(response, 'nuevo@centro.mx'), false);
});

test('memberstackResponseContainsEmail detects an exact email match in auth.email', () => {
    const response = {
        data: [
            { auth: { email: 'Centro@PataAmiga.mx' } },
        ],
    };

    assert.equal(memberstackResponseContainsEmail(response, 'centro@pataamiga.mx'), true);
});

test('memberstackResponseContainsEmail supports single-member responses', () => {
    const response = {
        data: { email: 'clinica@example.com' },
    };

    assert.equal(memberstackResponseContainsEmail(response, 'clinica@example.com'), true);
});
