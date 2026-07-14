import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const userActions = readFileSync(new URL('../src/app/actions/user.actions.ts', import.meta.url), 'utf8');
const petsRoute = readFileSync(new URL('../src/app/api/user/pets/route.ts', import.meta.url), 'utf8');
const welcomeRoute = readFileSync(new URL('../src/app/api/user/welcome-shown/route.ts', import.meta.url), 'utf8');
const unifiedWidget = readFileSync(new URL('../public/widgets/unified-membership-widget.js', import.meta.url), 'utf8');

test('user pets API exposes member welcome_shown flag', () => {
  assert.match(userActions, /welcome_shown/);
  assert.match(petsRoute, /welcome_shown:\s*result\.welcome_shown/);
});

test('member welcome API persists welcome_shown by memberstack id', () => {
  assert.match(welcomeRoute, /memberstackId/);
  assert.match(welcomeRoute, /welcome_shown:\s*true/);
  assert.match(welcomeRoute, /\.eq\('memberstack_id',\s*memberstackId\)/);
});

test('unified widget shows member welcome once and persists it through API', () => {
  assert.match(unifiedWidget, /showMemberWelcomeModal/);
  assert.match(unifiedWidget, /maybeShowMemberWelcomeModal/);
  assert.match(unifiedWidget, /\/api\/user\/welcome-shown/);
  assert.match(unifiedWidget, /memberWelcomeShown/);
  assert.doesNotMatch(unifiedWidget, /localStorage\.setItem\(['"`]member.*welcome/i);
});
