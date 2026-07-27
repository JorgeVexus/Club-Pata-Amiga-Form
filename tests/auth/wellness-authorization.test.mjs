import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('wellness actor resolves an authenticated center and checks legacy ids', () => {
    assert.equal(existsSync('src/lib/wellness-auth.ts'), true);
    const source = readFileSync('src/lib/wellness-auth.ts', 'utf8');
    assert.match(source, /verifyMemberstackRequest\(request\)/);
    assert.match(source, /\.eq\('memberstack_id', memberstackId\)/);
    assert.match(source, /expectedMemberstackId && expectedMemberstackId !== memberstackId/);
});

test('wellness cancellation uses authenticated ownership', () => {
    const route = readFileSync('src/app/api/wellness/cancel/route.ts', 'utf8');
    assert.match(route, /requireWellnessActor\(request,\s*memberstack_id\)/);
    assert.match(route, /\.eq\('id', auth\.actor\.wellnessCenterId\)/);
});

test('wellness admin status mutation requires admin auth', () => {
    const route = readFileSync('src/app/api/admin/wellness/[id]/status/route.ts', 'utf8');
    assert.match(route, /getAdminUser\(request\)/);
    assert.ok(route.indexOf('getAdminUser') < route.indexOf(".from('wellness_centers')"));
});

test('wellness widget keeps the session token in memory and sends bearer auth', () => {
    const widget = readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
    assert.match(widget, /let currentMemberToken = ''/);
    assert.match(widget, /getMemberCookie/);
    assert.match(widget, /Authorization:\s*`Bearer \$\{currentMemberToken\}`/);
    assert.doesNotMatch(widget, /localStorage\.setItem\([^)]*currentMemberToken/);
});
