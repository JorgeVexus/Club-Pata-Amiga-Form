import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');

const requiredFunctions = [
  'fetchCenterData',
  'updateAppointmentStatus',
  'cancelAccount',
  'submitAppeal',
  'renderPending',
  'renderRejected',
  'renderAppealed',
  'renderDashboard',
  'showPaymentsModal',
  'showAppointmentsModal',
  'showExitModal',
  'handleLogoUpload',
  'bindEditProfileForm',
  'showEditProfileModal'
];

for (const name of requiredFunctions) {
  assert.match(source, new RegExp(`function ${name}\\(`), `${name} must remain available`);
}

for (const endpoint of [
  '/api/wellness/me',
  '/api/wellness/update',
  '/api/wellness/cancel',
  '/api/wellness/appointments/',
  '/api/wellness/appointments/upload-evidence',
  '/api/upload/wellness-logo',
  '/api/upload/wellness-location-photo'
]) {
  assert.ok(source.includes(endpoint), `${endpoint} contract must remain available`);
}

for (const status of ['pending', 'approved', 'rejected', 'appealed', 'cancelled']) {
  assert.ok(source.includes(`'${status}'`), `${status} state must remain supported`);
}

assert.ok(source.includes('window.PATA_AMIGA_CONFIG'), 'widget must support dynamic external configuration');
assert.ok(!source.includes('createClient('), 'widget must not initialize Supabase in the browser');
assert.ok(!source.includes('@supabase/supabase-js'), 'widget must not ship the Supabase client');

for (const token of ['#F8F5EE', '#21BCAF', '#1E5D57', '#E5F5F2', '#FE8F15', '#153F3B', '#4E6865', '#8A9692', '#ECE7DD']) {
  assert.ok(source.toUpperCase().includes(token), `V2 token ${token} must be present`);
}

for (const className of ['wc-v2-shell', 'wc-v2-sidebar', 'wc-v2-main', 'wc-v2-mobile-nav']) {
  assert.ok(source.includes(className), `${className} must be rendered`);
}

for (const className of ['wc-v2-state-card', 'wc-v2-status', 'wc-v2-reason', 'wc-v2-appeal-form']) {
  assert.ok(source.includes(className), `${className} must exist`);
}

assert.ok(source.includes('submitAppeal(center.memberstack_id'), 'rejected state must retain appeal submission');
assert.ok(source.includes("status: 'appealed'"), 'appeal must retain status transition');
assert.ok(source.includes('renderEditProfileForm(center'), 'pending state must retain complementary profile editing');
assert.ok(source.includes('function escapeHtml('), 'API strings must be escaped before HTML insertion');

for (const id of ['btn-view-appointments', 'btn-view-payments', 'btn-edit-profile', 'wc-btn-exit']) {
  assert.ok(source.includes(`id="${id}"`), `${id} must remain available`);
  assert.ok(source.includes(`querySelector('#${id}')`), `${id} must remain bound`);
}

for (const className of ['wc-v2-kpi-grid', 'wc-v2-dashboard-grid', 'wc-v2-request-list', 'wc-v2-profile-summary']) {
  assert.ok(source.includes(className), `${className} must exist`);
}

assert.ok(source.includes('data-wc-view="${view}"'), 'sidebar items must expose their target view');
assert.ok(source.includes("['Citas', 'appointments']"), 'sidebar must expose appointments');
assert.ok(source.includes("['Reintegros', 'payments']"), 'sidebar must expose payments');
assert.ok(source.includes('function bindV2Navigation('), 'V2 sidebar actions must be bound');
assert.ok(source.includes("case 'appointments': showAppointmentsModal(container, center)"), 'appointments navigation must reuse its existing modal');
assert.ok(source.includes("case 'payments': showPaymentsModal(center)"), 'payments navigation must reuse its existing modal');
assert.ok(source.includes("case 'profile': showEditProfileModal(container, center)"), 'profile navigation must reuse its existing modal');

assert.ok(source.includes("SETTINGS_URL: runtimeConfig.settingsUrl || 'https://www.pataamiga.mx/miembros/configuracion'"), 'settings must use the shared configurable route');
assert.ok(source.includes("LOGOUT_REDIRECT_URL: runtimeConfig.logoutRedirectUrl || 'https://www.pataamiga.mx/'"), 'logout redirect must be configurable');
assert.ok(source.includes('data-wc-account-action="profile"'), 'desktop account menu must expose profile');
assert.ok(source.includes('data-wc-account-action="logout"'), 'desktop account menu must expose logout');
assert.ok(source.includes('wc-v2-hamburger'), 'mobile dashboard must expose an account hamburger');
assert.ok(source.includes('wc-v2-mobile-account-menu'), 'mobile account menu must be rendered');
assert.ok(source.includes('function logoutWellnessCenter('), 'wellness logout handler must exist');
assert.ok(source.includes('await window.$memberstackDom.logout()'), 'logout must use Memberstack');
assert.ok(source.includes('window.location.href = CONFIG.LOGOUT_REDIRECT_URL'), 'logout must redirect after success');

const sidebarRenderer = source.match(/function renderV2Sidebar[\s\S]*?function renderV2MobileNav/);
assert.ok(sidebarRenderer, 'V2 sidebar renderer must exist');
assert.ok(!sidebarRenderer[0].includes("${locked ? '' :"), 'account controls must not be hidden for locked approval states');

const mobileRenderer = source.match(/function renderV2MobileNav[\s\S]*?function renderV2Shell/);
assert.ok(mobileRenderer, 'V2 mobile renderer must exist');
assert.ok(mobileRenderer[0].includes('wc-v2-mobile-account'), 'mobile account menu must render for every approval state');
assert.ok(source.split('bindV2Navigation(container, center);').length - 1 >= 5, 'account actions must be bound in approved and non-approved states');

const preview = fs.readFileSync('public/widgets/wellness-center-widget-v2-preview.html', 'utf8');
assert.ok(preview.includes('wellness-center-widget.js'), 'preview must load the production widget');
assert.ok(preview.includes('PATA_AMIGA_CONFIG'), 'preview must exercise runtime configuration');
for (const status of ['approved', 'pending', 'rejected', 'appealed', 'cancelled']) {
  assert.ok(preview.includes(status), `preview must include ${status}`);
}
