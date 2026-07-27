import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('member cancellation and reactivation authorize ownership before Stripe or data access', () => {
    const deactivate = readFileSync('src/app/api/user/deactivate/route.ts', 'utf8');
    const reactivate = readFileSync('src/app/api/user/reactivate/route.ts', 'utf8');

    assert.match(deactivate, /requireMemberActor\(request,\s*memberstackId\)/);
    assert.ok(
        deactivate.indexOf('requireMemberActor') < deactivate.indexOf(".from('users')"),
        'deactivation must authorize before reading member data',
    );
    assert.match(reactivate, /requireMemberActor\(request,\s*memberstackId\)/);
    assert.ok(
        reactivate.indexOf('requireMemberActor') < reactivate.indexOf('stripe.subscriptions.list'),
        'reactivation must authorize before reading Stripe subscriptions',
    );
});

test('active member widgets attach the Memberstack bearer token', () => {
    const profile = readFileSync('public/widgets/user-profile-widget.js', 'utf8');
    const settings = readFileSync('public/widgets/user-settings-widget.js', 'utf8');

    assert.match(profile, /getMemberCookie/);
    assert.match(profile, /Authorization:\s*`Bearer \$\{token\}`/);
    assert.match(settings, /getMemberCookie/);
    assert.match(settings, /Authorization:\s*`Bearer \$\{token\}`/);
});
