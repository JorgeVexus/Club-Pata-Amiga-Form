const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const widget = read('public/widgets/ambassador-widget.js');

test('widget authenticates dashboard requests with the active Memberstack JWT', () => {
  assert.match(widget, /getMemberCookie\(\)/);
  assert.match(widget, /Authorization['"]?\s*:\s*`Bearer \$\{currentMemberToken\}`/);
  assert.match(widget, /\/api\/ambassadors\/dashboard/);
});

test('dashboard API verifies Memberstack and resolves ownership server-side', () => {
  const auth = read('src/lib/ambassador-auth.ts');
  const dashboard = read('src/app/api/ambassadors/dashboard/route.ts');
  assert.match(auth, /admin\.memberstack\.com\/members\/verify-token/);
  assert.match(auth, /linked_memberstack_id/);
  assert.match(dashboard, /getAuthenticatedAmbassador/);
  assert.doesNotMatch(dashboard, /searchParams\.get\(['"]memberstackId/);
});

test('referral response is an explicit privacy projection without record spreading', () => {
  const dashboard = read('src/app/api/ambassadors/dashboard/route.ts');
  assert.match(dashboard, /masked_name:\s*maskReferredName/);
  assert.doesNotMatch(dashboard, /recent_referrals:[\s\S]{0,300}\.\.\.r/);
  assert.doesNotMatch(dashboard, /referred_user_email/);
});

test('masked names reveal only initials followed by five stars', async () => {
  const privacy = await import(pathToFileURL(path.join(root, 'src/lib/ambassador-privacy.ts')).href);
  assert.equal(privacy.maskReferredName('María González'), 'M***** G*****');
  assert.equal(privacy.maskReferredName('Ana'), 'A*****');
  assert.equal(privacy.maskReferredName(''), 'R*****');
});

test('sensitive ambassador actions enforce authenticated ownership', () => {
  const routes = [
    'src/app/api/ambassadors/[id]/request-code-change/route.ts',
    'src/app/api/ambassadors/[id]/cancel/route.ts',
    'src/app/api/ambassadors/[id]/payouts/route.ts',
    'src/app/api/ambassadors/[id]/messages/route.ts',
    'src/app/api/upload/ambassador-photo/route.ts',
  ];
  routes.forEach((route) => assert.match(read(route), /getAuthenticatedAmbassador/));
});

test('code change route distinguishes admin request from enabled email flow', () => {
  const route = read('src/app/api/ambassadors/[id]/request-code-change/route.ts');
  assert.match(route, /pending_admin/);
  assert.match(route, /email_sent/);
  assert.match(route, /ambassador_code_change_request/);
});

test('payment history uses the existing ambassador payouts API', () => {
  assert.doesNotMatch(widget, /\/api\/payment-history/);
  assert.match(widget, /\/api\/ambassadors\/\$\{currentAmbassador\.id\}\/payouts/);
});
