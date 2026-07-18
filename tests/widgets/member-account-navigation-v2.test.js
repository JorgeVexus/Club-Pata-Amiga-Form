const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const dashboard = fs.readFileSync(path.join(root, 'public/widgets/unified-membership-widget.js'), 'utf8');
const profile = fs.readFileSync(path.join(root, 'public/widgets/user-profile-widget.js'), 'utf8');
const settings = fs.readFileSync(path.join(root, 'public/widgets/user-settings-widget.js'), 'utf8');
const profilePreview = fs.readFileSync(path.join(root, 'public/widgets/profile-widget-preview.html'), 'utf8');

test('dashboard exposes exact account destinations and mobile account menu', () => {
  assert.match(dashboard, /https:\/\/www\.pataamiga\.mx\/miembros\/perfil/);
  assert.match(dashboard, /https:\/\/www\.pataamiga\.mx\/miembros\/configuracion/);
  assert.match(dashboard, /https:\/\/www\.pataamiga\.mx\//);
  assert.match(dashboard, /pata-v2-account-menu/);
  assert.match(dashboard, /pata-v2-hamburger/);
  assert.match(dashboard, /toggleMobileAccountMenuV2/);
  assert.doesNotMatch(dashboard, /aria-label="Cerrar sesi[^"\n]*">[^<]*👋/u);
});

test('desktop navigation includes profile and settings while logout remains functional', () => {
  assert.match(dashboard, />Perfil<\/a>/);
  assert.match(dashboard, />Ajustes<\/a>/);
  assert.match(dashboard, /logoutV2\(\)/);
  assert.match(dashboard, /window\.location\.href = CONFIG\.logoutRedirectUrl/);
});

test('profile and settings use the V2 visual surface without changing their API contracts', () => {
  assert.match(profile, /Perfil V2 visual standard/);
  assert.match(settings, /Settings V2 visual standard/);
  assert.match(profile, /\/api\/user\/profile/);
  assert.match(profile, /\/api\/upload\/profile-photo/);
  assert.match(settings, /\/api\/user\/preferences/);
  assert.match(settings, /\/api\/user\/change-plan/);
});

test('profile preview supplies every Memberstack method required during initial load', () => {
  assert.match(profilePreview, /getCurrentMember:\s*async/);
  assert.match(profilePreview, /getMemberCookie:\s*async/);
});

test('profile preview uses the warm beige V2 canvas instead of the legacy teal background', () => {
  assert.match(profilePreview, /body\s*\{[^}]*background:\s*#f7f4ee/i);
  assert.doesNotMatch(profilePreview, /body\s*\{[^}]*background:\s*#15BEB2/i);
});
