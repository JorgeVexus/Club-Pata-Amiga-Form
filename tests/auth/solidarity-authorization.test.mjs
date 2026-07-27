import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('solidarity creation resolves the authenticated member before data access', () => {
    const route = readFileSync('src/app/api/solidarity/request/route.ts', 'utf8');
    assert.match(route, /requireMemberActor\(request,\s*memberstackId\)/);
    assert.ok(
        route.indexOf('requireMemberActor') < route.indexOf(".from('users')"),
        'authorization must happen before loading member data',
    );
    assert.match(route, /\.eq\('id', auth\.actor\.supabaseUserId\)/);
});

test('admin solidarity documents require admin auth before signed URLs', () => {
    const route = readFileSync(
        'src/app/api/admin/solidarity/requests/[id]/route.ts',
        'utf8',
    );
    assert.match(route, /getAdminUser\(request\)/);
    assert.ok(
        route.indexOf('getAdminUser') < route.indexOf('createSignedUrl'),
        'admin auth must happen before signed URL generation',
    );
});

test('solidarity clients attach a bearer token to API requests', () => {
    for (const path of [
        'public/widgets/solidarity-client.js',
        'public/widgets/unified-membership-widget.js',
    ]) {
        const source = readFileSync(path, 'utf8');
        assert.match(source, /getMemberCookie/);
        assert.match(source, /headers\.set\('Authorization', `Bearer \$\{token\}`\)/);
    }
});
