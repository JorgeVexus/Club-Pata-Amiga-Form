const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const widgetPath = path.resolve(__dirname, '../../public/widgets/ambassador-widget.js');
const source = fs.readFileSync(widgetPath, 'utf8');

test('ambassador dashboard V2 exposes the approved visual shell', () => {
  assert.match(source, /amb-v2-shell/);
  assert.match(source, /amb-v2-tabs/);
  assert.match(source, /amb-v2-code-card/);
  assert.match(source, /amb-v2-kpis/);
  assert.match(source, /amb-v2-referrals/);
});

test('ambassador dashboard V2 provides four internal views', () => {
  assert.match(source, /setAmbassadorV2View/);
  assert.match(source, /renderAmbassadorV2Summary/);
  assert.match(source, /renderAmbassadorV2Metrics/);
  assert.match(source, /renderAmbassadorV2Materials/);
  assert.match(source, /renderAmbassadorV2Account/);
  assert.match(source, /summary.*metrics.*materials.*account/s);
});

test('ambassador dashboard V2 keeps all backend contracts', () => {
  assert.match(source, /\/api\/ambassadors\/dashboard/);
  assert.match(source, /\/api\/ambassadors\/\$\{[^}]+\}\/payouts/);
  assert.match(source, /\/api\/ambassadors\/\$\{[^}]+\}\/messages/);
  assert.match(source, /\/api\/ambassador-materials/);
  assert.match(source, /\/api\/upload\/ambassador-photo/);
  assert.match(source, /\/request-code-change/);
  assert.match(source, /\/cancel/);
});

test('ambassador dashboard V2 keeps existing actions wired', () => {
  assert.match(source, /window\.shareCode/);
  assert.match(source, /window\.editAmbassadorProfile/);
  assert.match(source, /window\.addPaymentMethod/);
  assert.match(source, /window\.cancelAmbassadorRequest/);
  assert.match(source, /window\.filterAmbassadorMaterials/);
  assert.match(source, /window\.openAmbassadorChatModal/);
});

test('ambassador dashboard remains independent from the member dashboard', () => {
  assert.doesNotMatch(source, /pataWidget\.showAmbassador/);
  assert.doesNotMatch(source, /unified-membership-widget/);
});

test('ambassador V2 does not create a browser Supabase client', () => {
  assert.doesNotMatch(source, /supabase\.createClient/);
  assert.doesNotMatch(source, /window\.supabase\.createClient/);
});

test('ambassador V2 preserves administrative chat behavior through APIs', () => {
  assert.match(source, /senderRole:\s*'ambassador'/);
  assert.match(source, /markReadFor=ambassador/);
  assert.match(source, /unreadOnly=true&for=ambassador/);
});

test('ambassador V2 mobile navigation fits all four tabs without horizontal overflow', () => {
  assert.match(
    source,
    /@media\(max-width:760px\).*?\.amb-v2-tabs\{[^}]*display:grid[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*overflow:visible[^}]*\}/s,
  );
  assert.match(
    source,
    /@media\(max-width:760px\).*?\.amb-v2-tab\{[^}]*min-width:0[^}]*width:100%[^}]*padding:0 10px[^}]*\}/s,
  );
});
