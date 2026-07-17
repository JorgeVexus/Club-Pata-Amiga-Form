const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const dashboard = read('src/components/Admin/AdminDashboard.tsx');
const sidebar = read('src/components/Admin/Sidebar.tsx');

test('admin V2 preserves deep-link parameters', () => {
  for (const key of ['tab', 'member', 'requestId', 'ambassadorId', 'wellnessCenterId']) {
    assert.match(dashboard, new RegExp(`searchParams\\.get\\('${key}'\\)`));
  }
});

test('admin V2 preserves role restrictions and current module IDs', () => {
  assert.match(dashboard, /isAdminSuper/);
  for (const id of [
    'member',
    'ambassador',
    'wellness-center',
    'solidarity-fund',
    'communications-member',
    'reports-interactive',
  ]) {
    assert.match(sidebar, new RegExp(`id: '${id}'`));
  }
});

test('every current sidebar destination remains handled by the dashboard orchestrator', () => {
  for (const id of [
    'admins', 'settings', 'communications-member', 'communications-ambassador',
    'communications-wellness', 'communications-emails', 'ambassador',
    'wellness-center', 'registered-centers', 'newsletter', 'wellness-leads',
    'campaign-leads', 'legal-docs', 'cancellations', 'emergency-report',
    'solidarity-fund',
  ]) {
    assert.match(dashboard, new RegExp(`case '${id}'`));
  }
  assert.match(dashboard, /activeFilter\.startsWith\('finance-'\)/);
  assert.match(dashboard, /\['payment-records', 'billing', 'payment-status', 'auto-retries'\]/);
});

test('overview queues reuse current filter callbacks and pending counts', () => {
  const overview = read('src/components/Admin/V2/AdminOverview.tsx');
  assert.match(overview, /onNavigate\(queue\.filter\)/);
  for (const filter of ['member', 'solidarity-fund', 'ambassador', 'wellness-center', 'appeals']) {
    assert.match(overview, new RegExp(`['"]${filter}['"]`));
  }
});

test('legacy admin modules render inside a scoped V2 visual canvas', () => {
  const dashboardStyles = read('src/components/Admin/AdminDashboard.module.css');
  assert.match(dashboard, /styles\.moduleCanvas/);
  assert.match(dashboardStyles, /\.moduleCanvas/);
  assert.match(dashboardStyles, /\.moduleCanvas\s+:global\(table\)/);
  assert.match(dashboardStyles, /\.moduleCanvas\s+:global\(input\)/);
  assert.match(dashboardStyles, /\.moduleCanvas\s+:global\(button\)/);
});

test('production sidebar forces the readable body font on interactive labels', () => {
  const sidebarStyles = read('src/components/Admin/Sidebar.module.css');
  assert.match(sidebarStyles, /\.sidebar\s*\{[^}]*font-family:\s*var\(--font-body,'Outfit'\)/s);
  assert.match(sidebarStyles, /\.menuItem[^}]*font-family:\s*var\(--font-body,'Outfit'\)/s);
  assert.match(sidebarStyles, /\.menuTitle[^}]*font-family:\s*var\(--font-body,'Outfit'\)/s);
});

test('V2 canvas neutralizes brutalist borders and offset shadows from internal modules', () => {
  const dashboardStyles = read('src/components/Admin/AdminDashboard.module.css');
  assert.match(dashboardStyles, /\.moduleCanvas\s+:global\(\[class\*="statCard"\]\)/);
  assert.match(dashboardStyles, /border:\s*1px solid var\(--admin-v2-border\)\s*!important/);
  assert.match(dashboardStyles, /box-shadow:\s*0 8px 24px rgba\(45, 73, 69, \.05\)\s*!important/);
  assert.match(dashboardStyles, /\.moduleCanvas\s+:global\(button\)\s*\{[^}]*border-color:\s*transparent/s);
});

test('admin V2 mounts the new overview and loading shell', () => {
  assert.match(dashboard, /AdminOverview/);
  assert.match(dashboard, /AdminLoadingShell/);
});

test('admin metrics use approved reimbursements instead of a simulated fund', () => {
  const metricsRoute = read('src/app/api/admin/metrics/route.ts');
  assert.doesNotMatch(metricsRoute, /totalMembers \* 50/);
  assert.match(metricsRoute, /solidarity_requests/);
  assert.match(metricsRoute, /approved_amount/);
});

test('admin V2 keeps sensitive modules and modals mounted in the current orchestrator', () => {
  for (const component of [
    'MemberDetailModal',
    'RejectionModal',
    'AmbassadorDetailModal',
    'SolidarityRequestDetail',
    'WellnessCenterDetailModal',
  ]) {
    assert.match(dashboard, new RegExp(component));
  }
});

test('admin V2 preview is isolated from production APIs and supports mobile navigation', () => {
  const preview = read('public/admin-v2-preview.html');
  assert.match(preview, /class="app"/);
  assert.match(preview, /id="menu"/);
  assert.match(preview, /@media\(max-width:760px\)/);
  assert.doesNotMatch(preview, /fetch\s*\(/);
});

test('admin V2 preview navigation switches between representative module screens', () => {
  const preview = read('public/admin-v2-preview.html');
  for (const view of ['summary', 'members', 'pets', 'reimbursements', 'ambassadors', 'centers']) {
    assert.match(preview, new RegExp(`data-view="${view}"`));
    assert.match(preview, new RegExp(`data-screen="${view}"`));
  }
  assert.match(preview, /function showView\(/);
  assert.match(preview, /screen\.hidden=/);
});

test('admin V2 preview includes operation and administration screens', () => {
  const preview = read('public/admin-v2-preview.html');
  for (const view of ['payments', 'finance', 'communications', 'reports', 'leads', 'legal', 'settings']) {
    assert.match(preview, new RegExp(`data-view="${view}"`));
    assert.match(preview, new RegExp(`data-screen="${view}"`));
  }
});
