import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../public/widgets/complete-profile-widget.js', import.meta.url), 'utf8');

test('complete profile widget uses custom login instead of Memberstack basic modal', () => {
  assert.doesNotMatch(
    source,
    /openModal\(['"]LOGIN['"]\)/,
    'login required state must not open the basic Memberstack modal',
  );
  assert.match(
    source,
    /id="ppa-login-form"/,
    'login required state must render a custom login form',
  );
  assert.match(
    source,
    /loginMemberEmailPassword\(\{/,
    'custom login form must authenticate with Memberstack email/password API',
  );
  assert.match(
    source,
    /this\.member = loginResult\.data;/,
    'successful login must store the authenticated member in the widget',
  );
  assert.match(
    source,
    /await this\.loadData\(\);/,
    'successful login must resume the widget data-loading flow',
  );
});
