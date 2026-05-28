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
    /getCurrentMember\(\)/,
    'successful login must refresh the current member before loading profile data',
  );
  assert.match(
    source,
    /waitForAuthenticatedMember\(loginResult\.data\)/,
    'successful login must wait until Memberstack exposes a complete current member',
  );
  assert.doesNotMatch(
    source,
    /freshMember \|\| loginResult\.data/,
    'successful login must not immediately fall back to the incomplete login payload',
  );
  assert.match(
    source,
    /hasCompleteMemberSession\(member\)/,
    'widget must detect whether a member has both id and email before loading data',
  );
  assert.match(
    source,
    /await this\.delay\(300\)/,
    'post-login session refresh must retry briefly before showing an error',
  );
  assert.match(
    source,
    /this\.member = authenticatedMember;/,
    'successful login must store the fully authenticated member in the widget',
  );
  assert.match(
    source,
    /No pudimos confirmar tu sesi[oó]n/,
    'login must show a session-specific message instead of the database error when Memberstack is still not ready',
  );
  assert.match(
    source,
    /throw new Error\('missing_member_session_data'\);/,
    'loadData must keep guarding against incomplete member data',
  );
  assert.match(
    source,
    /No pudimos confirmar tu sesi[oó]n/,
    'missing member session data must not be reported as a database connectivity problem',
  );
  assert.match(
    source,
    /No pudimos cargar tu informaci[oó]n/,
    'real data loading failures should use a profile loading message, not a misleading database connection message',
  );
  assert.match(
    source,
    /getMemberEmail\(member = this\.member\)/,
    'widget must read member email through a shape-tolerant helper',
  );
  assert.match(
    source,
    /getMemberId\(member = this\.member\)/,
    'widget must read member id through a shape-tolerant helper',
  );
  assert.doesNotMatch(
    source,
    /this\.member\.auth\.email/,
    'loadData must not assume login result always contains auth.email directly',
  );
  assert.match(
    source,
    /memberEmail = this\.getMemberEmail\(\)/,
    'loadData must use the normalized member email',
  );
  assert.match(
    source,
    /memberId = this\.getMemberId\(\)/,
    'loadData must use the normalized member id',
  );
  assert.match(
    source,
    /await this\.loadData\(\);/,
    'successful login must resume the widget data-loading flow',
  );
});
