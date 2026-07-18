const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const emergency = read('public/widgets/emergency-button-widget.js');
const dashboardPreview = read('public/widgets/dashboard-v2-preview.html');
const dashboard = read('public/widgets/unified-membership-widget.js');
const profile = read('public/widgets/user-profile-widget.js');
const settings = read('public/widgets/user-settings-widget.js');

test('emergency widget preserves eligibility and logging while exposing an external trigger', () => {
  assert.match(emergency, /isEligible\(\)/);
  assert.match(emergency, /\/api\/user\/payment-method/);
  assert.match(emergency, /\/api\/user\/emergency/);
  assert.match(emergency, /openModal\(\)/);
  assert.match(emergency, /window\.PataEmergencyWidget/);
});

test('dashboard loads one emergency widget and uses it from the mobile top bar', () => {
  assert.match(dashboard, /emergencyWidgetScriptPromise/);
  assert.match(dashboard, /loadEmergencyWidgetV2/);
  assert.match(dashboard, /pata-emergency-widget-script/);
  assert.match(dashboard, /openEmergencyV2/);
  assert.match(dashboard, /pata-v2-emergency-mobile/);
  assert.doesNotMatch(dashboard, /onclick="window\.pataWidget\.showVetV2\(\)" aria-label="Orientaci[^"\n]*">/);
});

test('emergency presentation follows V2 desktop and mobile placement', () => {
  assert.match(emergency, /right:\s*30px/);
  assert.match(emergency, /left:\s*auto/);
  assert.match(emergency, /@media\s*\(max-width:\s*767px\)[\s\S]*\.emergency-btn\s*\{\s*display:\s*none/);
  assert.match(emergency, /setAttribute\('role',\s*'dialog'\)/);
  assert.match(emergency, /setAttribute\('aria-modal',\s*'true'\)/);
  assert.match(emergency, /\.emergency-modal-phone\s*\{[\s\S]*?width:\s*fit-content[\s\S]*?margin:\s*0 auto 28px/);
});

test('local dashboard preview can simulate an active plan without bypassing production eligibility', () => {
  assert.match(dashboardPreview, /emergencyPreviewActive:\s*true/);
  assert.match(emergency, /emergencyPreviewActive/);
  assert.match(emergency, /(?:localhost|127\.0\.0\.1)/);
  assert.match(emergency, /planConnections:\s*\[\{\s*status:\s*'ACTIVE'\s*\}\]/);
});

test('profile and settings load the shared account navbar but not emergency', () => {
  for (const source of [profile, settings]) {
    assert.match(source, /member-account-navbar\.js/);
    assert.doesNotMatch(source, /emergency-button-widget\.js/);
  }
});
