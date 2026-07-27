import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('member actor derives identity from verified token and checks supplied ids', () => {
    assert.equal(existsSync('src/lib/actor-context.ts'), true);
    assert.equal(existsSync('src/lib/member-auth.ts'), true);

    const actor = readFileSync('src/lib/actor-context.ts', 'utf8');
    const member = readFileSync('src/lib/member-auth.ts', 'utf8');

    assert.match(
        actor,
        /export type ActorRole = 'member' \| 'ambassador' \| 'wellness_center' \| 'admin'/,
    );
    assert.match(member, /verifyMemberstackRequest\(request\)/);
    assert.match(member, /\.eq\('memberstack_id', memberstackId\)/);
    assert.match(
        member,
        /expectedMemberstackId && expectedMemberstackId !== memberstackId/,
    );
    assert.match(member, /actorFailure\(401,/);
    assert.match(member, /actorFailure\(403,/);
    assert.match(member, /permissions:\s*\['member:self'\]/);
});
