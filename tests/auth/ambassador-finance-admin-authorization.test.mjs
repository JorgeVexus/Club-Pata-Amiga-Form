import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routes = [
    'src/app/api/referrals/[id]/route.ts',
    'src/app/api/payouts/[id]/route.ts',
    'src/app/api/admin/ambassadors/[id]/enable-code-change/route.ts',
    'src/app/api/admin/ambassadors/sync-memberstack/route.ts',
];

for (const path of routes) {
    test(`${path} authenticates admin before data access`, () => {
        const source = readFileSync(path, 'utf8');
        assert.match(source, /getAdminUser\(request\)/);
        assert.match(source, /unauthorizedResponse\(\)/);
        const guardIndex = source.indexOf('getAdminUser(request)');
        const firstDataIndex = source.search(/\.(?:from|select|update|insert)\(/);
        assert.ok(guardIndex >= 0 && (firstDataIndex < 0 || guardIndex < firstDataIndex));
    });
}
