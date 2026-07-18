const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const navbarPath = path.resolve(__dirname, '../../public/widgets/member-account-navbar.js');

test('shared navbar exists with account destinations and API-first notifications', () => {
  assert.equal(fs.existsSync(navbarPath), true);
  const source = fs.readFileSync(navbarPath, 'utf8');
  assert.match(source, /https:\/\/www\.pataamiga\.mx\/pets\/pet-waiting-period/);
  assert.match(source, /https:\/\/www\.pataamiga\.mx\/miembros\/perfil/);
  assert.match(source, /https:\/\/www\.pataamiga\.mx\/miembros\/configuracion/);
  assert.match(source, /\/api\/notifications/);
  assert.match(source, /\/api\/notifications\/mark-all-read/);
  assert.doesNotMatch(source, /createClient\(|supabase/i);
});

test('Mi manada is rendered only for the backend member role', () => {
  const source = fs.readFileSync(navbarPath, 'utf8');
  assert.match(source, /\/api\/auth\/check-role/);
  assert.match(source, /method:\s*'POST'/);
  assert.match(source, /memberstackId:\s*this\.member\.id/);
  assert.match(source, /this\.role\s*===\s*'member'/);
  assert.match(source, />Mi manada</);
  assert.doesNotMatch(source, /Volver al dashboard/);
  assert.doesNotMatch(source, /section=vet/);
  assert.doesNotMatch(source, /Orientación veterinaria 24\/7/);
});

test('notification bell matches the unified dashboard visual language', () => {
  const source = fs.readFileSync(navbarPath, 'utf8');
  assert.match(source, /pata-account-notification-button/);
  assert.match(source, />🔔/u);
  assert.match(source, /unread > 9 \? '9\+' : unread/);
});

test('shared navbar is responsive and supports logout through Memberstack', () => {
  const source = fs.readFileSync(navbarPath, 'utf8');
  assert.match(source, /pata-account-navbar/);
  assert.match(source, /pata-account-menu/);
  assert.match(source, /@media\s*\(max-width:\s*767px\)/);
  assert.match(source, /\$memberstackDom\?\.logout\(\)/);
  assert.match(source, /https:\/\/www\.pataamiga\.mx\//);
  assert.match(source, /aria-expanded/);
  assert.match(source, /window\.PataPrimaryNavigation\s*=\s*navbar/);
});
