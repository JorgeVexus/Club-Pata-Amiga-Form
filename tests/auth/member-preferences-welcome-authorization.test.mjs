import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const preferencesRoute = fs.readFileSync('src/app/api/user/preferences/route.ts', 'utf8');
const welcomeRoute = fs.readFileSync('src/app/api/user/welcome-shown/route.ts', 'utf8');
const settingsWidget = fs.readFileSync('public/widgets/user-settings-widget.js', 'utf8');
const membershipWidget = fs.readFileSync('public/widgets/unified-membership-widget.js', 'utf8');

test('preferences resolve the authenticated member before reading or writing data', () => {
  assert.match(preferencesRoute, /requireMemberActor\(request,\s*memberstackId\)/);
  assert.equal(
    preferencesRoute.indexOf('requireMemberActor(request, memberstackId)') <
      preferencesRoute.indexOf(".from('users')"),
    true,
  );
});

test('welcome persistence resolves the authenticated member before data access', () => {
  assert.match(welcomeRoute, /requireMemberActor\(request,\s*memberstackId\)/);
  assert.equal(
    welcomeRoute.indexOf('requireMemberActor(request, memberstackId)') <
      welcomeRoute.indexOf(".from('users')"),
    true,
  );
});

test('member widgets attach bearer auth for preferences and welcome persistence', () => {
  assert.match(
    settingsWidget,
    /\/api\/user\/preferences\?memberstackId=.*?Authorization:\s*`Bearer \$\{token\}`/s,
  );
  assert.match(
    settingsWidget,
    /\/api\/user\/preferences.*?method:\s*'POST'.*?Authorization:\s*`Bearer \$\{token\}`/s,
  );
  assert.match(
    membershipWidget,
    /\/api\/user\/welcome-shown.*?Authorization:\s*`Bearer \$\{token\}`/s,
  );
});
