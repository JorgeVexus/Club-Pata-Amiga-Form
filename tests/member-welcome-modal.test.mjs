import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const userActions = readFileSync(new URL('../src/app/actions/user.actions.ts', import.meta.url), 'utf8');
const petsRoute = readFileSync(new URL('../src/app/api/user/pets/route.ts', import.meta.url), 'utf8');
const welcomeRoute = readFileSync(new URL('../src/app/api/user/welcome-shown/route.ts', import.meta.url), 'utf8');
const unifiedWidget = readFileSync(new URL('../public/widgets/unified-membership-widget.js', import.meta.url), 'utf8');
const migrationUrl = new URL('../supabase/migrations/20260717_add_welcome_shown_users.sql', import.meta.url);
const migration = existsSync(migrationUrl) ? readFileSync(migrationUrl, 'utf8') : '';

test('users table has an idempotent account-level welcome flag migration', () => {
  assert.ok(existsSync(migrationUrl), 'welcome_shown users migration must exist');
  assert.match(migration, /ALTER TABLE public\.users/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN NOT NULL DEFAULT FALSE/i);
});

test('user pets API exposes member welcome_shown flag', () => {
  assert.match(userActions, /welcome_shown/);
  assert.match(petsRoute, /welcome_shown:\s*result\.welcome_shown/);
});

test('member welcome API persists welcome_shown by memberstack id', () => {
  assert.match(welcomeRoute, /memberstackId/);
  assert.match(welcomeRoute, /welcome_shown:\s*true/);
  assert.match(welcomeRoute, /\.eq\('memberstack_id',\s*memberstackId\)/);
});

test('member welcome API confirms the updated account row', () => {
  assert.match(welcomeRoute, /\.select\('memberstack_id, welcome_shown'\)/);
  assert.match(welcomeRoute, /\.single\(\)/);
  assert.match(welcomeRoute, /if \(error \|\| !updatedUser\)/);
  assert.match(welcomeRoute, /status: 404/);
});

test('unified widget shows member welcome once and persists it through API', () => {
  assert.match(unifiedWidget, /showMemberWelcomeModal/);
  assert.match(unifiedWidget, /maybeShowMemberWelcomeModal/);
  assert.match(unifiedWidget, /\/api\/user\/welcome-shown/);
  assert.match(unifiedWidget, /memberWelcomeShown/);
  assert.doesNotMatch(unifiedWidget, /localStorage\.setItem\(['"`]member.*welcome/i);
  assert.match(unifiedWidget, /data\.welcome_shown !== true/);
});

test('member welcome uses the new repository visual tokens', () => {
  assert.match(unifiedWidget, /max-width:\s*420px/);
  assert.match(unifiedWidget, /border-radius:\s*24px/);
  assert.match(unifiedWidget, /0 24px 60px rgba\(30,\s*83,\s*80,\s*0\.25\)/);
  assert.match(unifiedWidget, /background:\s*#1cbcad/i);
  assert.doesNotMatch(unifiedWidget, /pata-member-welcome-list/);
});

test('member welcome visible block has no mojibake markers', () => {
  const start = unifiedWidget.indexOf('showMemberWelcomeModal()');
  const end = unifiedWidget.indexOf('escapeHtml(value)', start);
  const welcomeBlock = unifiedWidget.slice(start, end);
  assert.ok(start >= 0 && end > start, 'welcome modal block must be found');
  assert.doesNotMatch(welcomeBlock, /\u00C3|\u00C2|\u00F0\u0178|\u00E2\u20AC|\u00EF\u00B8/);
});
