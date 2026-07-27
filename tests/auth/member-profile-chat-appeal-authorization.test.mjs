import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const routePaths = [
  'src/app/api/user/update-profile/route.ts',
  'src/app/api/user/appeal/route.ts',
  'src/app/api/user/appeal-history/route.ts',
  'src/app/api/user/chat/send/route.ts',
];

test('profile, appeal and chat routes resolve member ownership before privileged data access', () => {
  for (const routePath of routePaths) {
    const source = fs.readFileSync(routePath, 'utf8');
    assert.match(source, /requireMemberActor\(/, routePath);
    assert.equal(
      source.indexOf('requireMemberActor(') < source.indexOf(".from('"),
      true,
      `${routePath} must authorize before its first database query`,
    );
  }
});

test('member-facing consumers send bearer auth to protected profile, appeal and chat routes', () => {
  const widgets = [
    'public/widgets/user-profile-widget.js',
    'public/widgets/complete-profile-widget.js',
    'public/widgets/appeal-widget.js',
    'public/widgets/pet-cards-widget.js',
    'public/widgets/unified-membership-widget.js',
  ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');

  for (const endpoint of ['update-profile', 'appeal', 'appeal-history', 'chat/send']) {
    const endpointIndex = widgets.indexOf(`/api/user/${endpoint}`);
    assert.notEqual(endpointIndex, -1, endpoint);
    const nearby = widgets.slice(endpointIndex, endpointIndex + 1400);
    assert.match(nearby, /Authorization:\s*`Bearer \$\{token\}`/, endpoint);
  }
});
