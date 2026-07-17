const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const widgetPath = path.resolve(__dirname, '../../public/widgets/unified-membership-widget.js');
const source = fs.readFileSync(widgetPath, 'utf8');

test('dashboard V2 exposes the reference visual shell', () => {
  assert.match(source, /pata-v2-shell/);
  assert.match(source, /pata-v2-sidebar/);
  assert.match(source, /pata-v2-kpi-grid/);
  assert.match(source, /pata-v2-pet-grid/);
});

test('dashboard V2 renders every pet instead of only the selected pet', () => {
  assert.match(source, /renderV2PetCards\(\)/);
  assert.match(source, /this\.pets\.map\(\(pet, index\)/);
});

test('dashboard V2 keeps ambassador and logout navigation conditional', () => {
  assert.match(source, /this\.isAmbassador\s*\?/);
  assert.match(source, /this\.member\s*\?/);
  assert.match(source, /logoutV2\(\)/);
});

test('dashboard V2 does not create a browser Supabase client', () => {
  assert.doesNotMatch(source, /createClient\s*\(\s*CONFIG\.supabase/i);
  assert.doesNotMatch(source, /window\.supabase\.createClient/i);
});

test('dashboard V2 includes responsive navigation', () => {
  assert.match(source, /@media \(max-width: 900px\)[\s\S]*\.pata-v2-sidebar/);
  assert.match(source, /@media \(max-width: 600px\)[\s\S]*\.pata-v2-kpi-grid/);
});

test('local preview seeds a member before the no-session early return', () => {
  assert.match(source, /isLocalPreview\(\)/);
  const previewSeed = source.indexOf('if (!this.member && this.isLocalPreview())');
  const sessionGuard = source.indexOf('if (!this.member) {', previewSeed + 1);
  assert.ok(previewSeed >= 0, 'local preview seed must exist');
  assert.ok(sessionGuard > previewSeed, 'local preview seed must run before the session guard');
});

test('V2 CSS is isolated from the legacy stylesheet parser context', () => {
  assert.match(source, /style\.textContent = STYLES;/);
  assert.match(source, /v2Style\.id = 'pata-v2-styles'/);
  assert.match(source, /v2Style\.textContent = V2_STYLES/);
});

test('Mis peludos and Ver todos open the same cards-only internal view', () => {
  assert.match(source, /showPetsV2\(\)/);
  assert.match(source, /showHomeV2\(\)/);
  assert.match(source, /this\.v2View === 'pets'/);
  assert.match(source, /onclick="window\.pataWidget\.showPetsV2\(\)"[^>]*>Ver todos/);
  assert.match(source, /pata-v2-pets-page-head/);
});

test('Fondo Solidario is integrated as internal reimbursement views', () => {
  assert.match(source, /showReimbursementsV2\(\)/);
  assert.match(source, /showNewReimbursementV2\(\)/);
  assert.match(source, /showReimbursementDetailV2\(/);
  assert.match(source, /renderV2ReimbursementsView\(\)/);
  assert.match(source, /renderV2NewReimbursementView\(\)/);
  assert.match(source, /renderV2ReimbursementDetailView\(\)/);
  assert.match(source, /medical_emergency/);
  assert.match(source, /annual_vaccination/);
});

test('new reimbursement uses visual category, pet and document cards', () => {
  assert.match(source, /pata-v2-support-options/);
  assert.match(source, /key:'medical_emergency'/);
  assert.match(source, /key:'death'/);
  assert.match(source, /key:'annual_vaccination'/);
  assert.match(source, /data-benefit-type="\$\{item\.key\}"/);
  assert.match(source, /pata-v2-pet-options/);
  assert.match(source, /data-pet-id=/);
  assert.match(source, /pata-v2-document-grid/);
  assert.match(source, /data-document-type=/);
  assert.doesNotMatch(source, /<select name="benefitType"/);
  assert.doesNotMatch(source, /<select name="petId"/);
});

test('reimbursement bank is required, selectable and suggested from CLABE', () => {
  assert.match(source, /CLABE_BANK_CODES/);
  assert.match(source, /isValidClabeV2/);
  assert.match(source, /<select name="bankName" required>/);
  assert.match(source, /clabeInput\.oninput/);
  assert.match(source, /bankSelect\.value = detectedBank/);
  assert.doesNotMatch(source, /Banco <small>\(opcional\)<\/small>/);
});
