import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const layoutSource = readFileSync('src/app/layout.tsx', 'utf8');
const adminFetchSource = readFileSync('src/utils/admin-fetch.ts', 'utf8');
const adminLoginSource = readFileSync('src/components/Admin/AdminLoginPage.tsx', 'utf8');
const adminDashboardSource = readFileSync('src/components/Admin/AdminDashboard.tsx', 'utf8');

test('Memberstack public session is redirected to sessionStorage before the vendor script loads', () => {
  const guardIndex = layoutSource.indexOf('memberstack-session-storage-guard');
  const memberstackIndex = layoutSource.indexOf('memberstack-script');

  assert.ok(guardIndex > -1, 'layout should install the Memberstack sessionStorage guard');
  assert.ok(memberstackIndex > -1, 'layout should still load the Memberstack script');
  assert.ok(
    guardIndex < memberstackIndex,
    'the sessionStorage guard must run before Memberstack initializes'
  );
  assert.match(layoutSource, /sessionKeys\s*=\s*\[\s*'_ms-mid'\s*,\s*'_ms-mem'\s*\]/);
  assert.match(layoutSource, /sessionStorage\.setItem\(key, value\)/);
  assert.match(layoutSource, /localStorage\.removeItem\(key\)/);
});

test('Admin session helper no longer depends on localStorage persistence', () => {
  assert.match(adminFetchSource, /sessionStorage\.getItem\('admin_memberstack_id'\)/);
  assert.doesNotMatch(adminFetchSource, /localStorage\.getItem\('admin_memberstack_id'\)/);

  assert.match(adminLoginSource, /sessionStorage\.setItem\('admin_memberstack_id', memberstackId\)/);
  assert.doesNotMatch(adminLoginSource, /localStorage\.setItem\('admin_memberstack_id', memberstackId\)/);

  assert.match(adminDashboardSource, /sessionStorage\.setItem\('admin_memberstack_id', currentMemberId\)/);
  assert.doesNotMatch(adminDashboardSource, /localStorage\.setItem\('admin_memberstack_id', currentMemberId\)/);
});
