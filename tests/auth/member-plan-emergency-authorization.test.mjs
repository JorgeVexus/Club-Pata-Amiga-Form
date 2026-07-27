import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const planRoute = fs.readFileSync('src/app/api/user/change-plan/route.ts', 'utf8');
const emergencyRoute = fs.readFileSync('src/app/api/user/emergency/route.ts', 'utf8');

test('plan changes authorize ownership before Stripe, Memberstack or Supabase access', () => {
  assert.match(planRoute, /requireMemberActor\(request,\s*memberstackId\)/);
  const authIndex = planRoute.indexOf('requireMemberActor(request, memberstackId)');
  for (const marker of ['stripe.', 'memberstackAdmin.', ".from('"]) {
    const index = planRoute.indexOf(marker);
    if (index >= 0) assert.equal(authIndex < index, true, marker);
  }
});

test('emergency activation authorizes the member before data access', () => {
  assert.match(emergencyRoute, /requireMemberActor\(request,\s*memberstackId\)/);
  assert.equal(
    emergencyRoute.indexOf('requireMemberActor(request, memberstackId)') <
      emergencyRoute.indexOf(".from('"),
    true,
  );
});

test('plan and emergency widgets attach the active Memberstack bearer token', () => {
  const planWidgets = [
    fs.readFileSync('public/widgets/user-profile-widget.js', 'utf8'),
    fs.readFileSync('public/widgets/user-settings-widget.js', 'utf8'),
  ].join('\n');
  const emergencyWidget = fs.readFileSync('public/widgets/emergency-button-widget.js', 'utf8');

  assert.match(planWidgets, /\/api\/user\/change-plan[\s\S]{0,800}Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(emergencyWidget, /\/api\/user\/emergency[\s\S]{0,800}Authorization:\s*`Bearer \$\{token\}`/);
});
