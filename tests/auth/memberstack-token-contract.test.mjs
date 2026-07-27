import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const tokenPath = 'src/lib/memberstack-token.ts';
const ambassadorPath = 'src/lib/ambassador-auth.ts';

test('centralizes strict Memberstack bearer verification', () => {
    assert.equal(
        existsSync(tokenPath),
        true,
        'src/lib/memberstack-token.ts must centralize token verification',
    );

    const tokenSource = readFileSync(tokenPath, 'utf8');
    const ambassadorSource = readFileSync(ambassadorPath, 'utf8');

    assert.match(tokenSource, /export async function verifyMemberstackRequest/);
    assert.match(tokenSource, /authorization\.match\(\/\^Bearer\\s\+\(\.\+\)\$\/i\)/);
    assert.match(tokenSource, /cache:\s*'no-store'/);
    assert.match(tokenSource, /MEMBERSTACK_ADMIN_SECRET_KEY/);
    assert.match(tokenSource, /MEMBERSTACK_SECRET_KEY/);
    assert.match(
        ambassadorSource,
        /import \{ verifyMemberstackRequest \} from '@\/lib\/memberstack-token'/,
    );
    assert.doesNotMatch(ambassadorSource, /admin\.memberstack\.com\/members\/verify-token/);
});
