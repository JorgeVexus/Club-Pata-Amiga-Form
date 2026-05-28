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
    /this\.member = freshMember \|\| loginResult\.data;/,
    'successful login must prefer the fresh Memberstack session member',
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
