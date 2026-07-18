import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const routeSource = readFileSync(
  new URL('../src/app/api/auth/check-role/route.ts', import.meta.url),
  'utf8',
);
const redirectSources = [
  '../public/widgets/login-redirect-enhanced.js',
  '../public/widgets/login-redirect-enhanced-v2.js',
].map((path) => ({
  path,
  source: readFileSync(new URL(path, import.meta.url), 'utf8'),
}));

test('check-role exposes the incomplete-profile contract for active members', () => {
  assert.match(routeSource, /getMemberCompletionIssue\(/);
  assert.match(routeSource, /role:\s*'incomplete_profile'/);
  assert.match(routeSource, /registrationIssue/);
  assert.match(routeSource, /https:\/\/www\.pataamiga\.mx\/miembros\/completar-perfil/);
});

for (const { path, source } of redirectSources) {
  test(`${path} prioritizes incomplete profiles before regular members`, () => {
    const incompleteCase = source.indexOf("case 'incomplete_profile':");
    const memberCase = source.indexOf("case 'member':");

    assert.notEqual(incompleteCase, -1, 'redirector must handle incomplete_profile');
    assert.ok(incompleteCase < memberCase, 'incomplete_profile must be handled before member');
    assert.match(source, /data\.redirectUrl\s*\|\|/);
    assert.match(source, /https:\/\/www\.pataamiga\.mx\/miembros\/completar-perfil/);
  });
}
