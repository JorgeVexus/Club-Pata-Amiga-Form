import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin auth verifies bearer token before resolving role', () => {
    const server = readFileSync('src/lib/admin-auth.ts', 'utf8');
    const client = readFileSync('src/utils/admin-fetch.ts', 'utf8');

    assert.match(server, /verifyMemberstackRequest\(req\)/);
    assert.doesNotMatch(
        server,
        /const memberstackId = req\.headers\.get\('x-admin-memberstack-id'\)/,
    );
    assert.match(client, /getMemberCookie/);
    assert.match(client, /headers\.set\('Authorization', `Bearer \$\{token\}`\)/);
});
