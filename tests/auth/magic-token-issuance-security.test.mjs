import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routeSource = fs.readFileSync('src/app/api/auth/magic-token/route.ts', 'utf8');
const widgetSource = fs.readFileSync('public/widgets/unified-membership-widget.js', 'utf8');

test('magic-token issuance authorizes the requested member before generating or inserting', () => {
  assert.match(routeSource, /import\s+\{\s*requireMemberActor\s*\}\s+from\s+'@\/lib\/member-auth'/);
  assert.match(routeSource, /requireMemberActor\(request,\s*memberstackId\)/);

  const authorizationIndex = routeSource.indexOf('requireMemberActor(request, memberstackId)');
  const tokenIndex = routeSource.indexOf('crypto.randomBytes(32)');
  const insertIndex = routeSource.indexOf(".from('magic_tokens')");

  assert.ok(authorizationIndex >= 0);
  assert.ok(authorizationIndex < tokenIndex);
  assert.ok(authorizationIndex < insertIndex);
});

test('magic-token CORS accepts the bearer authorization header', () => {
  assert.match(routeSource, /'Access-Control-Allow-Headers':\s*'Content-Type,\s*Authorization'/);
});

test('membership widget forwards the active Memberstack JWT when requesting a magic token', () => {
  assert.match(widgetSource, /getMemberCookie\(\)/);
  assert.match(widgetSource, /Authorization:\s*'Bearer '\s*\+\s*token/);
  assert.match(widgetSource, /if\s*\(!token\)\s*\{\s*fallback\(email\)/);
});
