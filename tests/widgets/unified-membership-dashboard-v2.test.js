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

test('unified widget includes its own solidarity API client for Webflow', () => {
  assert.match(source, /class EmbeddedSolidarityClient/);
  assert.match(source, /new EmbeddedSolidarityClient\(CONFIG\.apiUrl\)/);
  assert.match(source, /\/api\/solidarity\/request/);
  assert.match(source, /\/api\/upload\/solidarity-document/);
});

test('embedded solidarity client binds native fetch to the browser global', () => {
  assert.match(source, /fetchImpl = globalThis\.fetch\.bind\(globalThis\)/);
});

test('reimbursement pet eligibility includes completed waiting period', () => {
  assert.match(source, /isPetEligibleForReimbursementV2\(pet\)/);
  assert.match(source, /!this\.calculateCarencia\(pet\)\.isWaiting/);
  assert.match(source, /Faltan \$\{carencia\.daysRemaining\} días/);
  assert.doesNotMatch(source, /status = `Faltan \$\{carencia\.daysRemaining\} d&iacute;as`/);
});

test('reimbursement submit is disabled when no pet is eligible', () => {
  assert.match(source, /eligible\.length \? '' : 'disabled'/);
  assert.match(source, /No tienes mascotas con el tiempo de espera completado/);
});

test('Centros aliados opens as an internal Dashboard V2 view', () => {
  assert.match(source, /async showCentersV2\(\)/);
  assert.match(source, /this\.v2View = 'centers'/);
  assert.match(source, /onclick="window\.pataWidget\.showCentersV2\(\)"/);
  assert.match(source, /this\.v2View === 'centers'/);
});

test('Centros aliados loads approved wellness locations through the API', () => {
  assert.match(source, /\/api\/wellness\/locations/);
  assert.match(source, /renderV2CentersView\(\)/);
  assert.match(source, /attachV2CentersEvents\(\)/);
});

test('Centros aliados matches the new repository directory interactions', () => {
  assert.match(source, /pata-v2-centers-search/);
  assert.match(source, /data-center-service/);
  assert.match(source, /promotion_details/);
  assert.match(source, /https:\/\/www\.pataamiga\.mx\/#wellness-partner-form-anchor/);
  assert.match(source, /No encontramos centros con esa búsqueda/);
});

test('Centros aliados does not loop API retries after an error', () => {
  assert.match(source, /!this\.centers\.error/);
  assert.match(source, /data-centers-retry/);
});

test('Centros aliados clears stale search state and exposes reset filters', () => {
  assert.match(source, /searchInput\.oninput/);
  assert.match(source, /if \(!this\.centers\.query\) this\.render\(\)/);
  assert.match(source, /data-centers-clear-filters/);
  assert.match(source, /this\.centers\.service = 'all'/);
});

test('Dashboard V2 keeps a fixed horizontal navigation visible on mobile', () => {
  assert.match(source, /pata-v2-mobile-tabbar/);
  assert.match(source, /position:fixed;[^}]*bottom:0/);
  assert.match(source, /env\(safe-area-inset-bottom\)/);
  assert.match(source, /pata-v2-mobile-tab/);
  assert.match(source, /this\.isAmbassador \? `<a class="pata-v2-mobile-tab/);
  assert.match(source, /padding-bottom:\s*calc\(/);
});
