const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const hub = read('src/components/Admin/Communications/CommunicationsHub.tsx');
const hubCss = read('src/components/Admin/Communications/CommunicationsHub.module.css');

test('communications hub preserves every functional view and contract', () => {
  for (const component of ['MessageSender', 'TemplateManager', 'CommHistory', 'AmbassadorMaterialsManager']) {
    assert.match(hub, new RegExp(component));
  }
  for (const prop of ['adminName', 'isSuperAdmin', 'prefill', 'audience']) {
    assert.match(hub, new RegExp(prop));
  }
});

test('communications hub uses accessible V2 tabs and safe icons', () => {
  assert.match(hub, /role="tablist"/);
  assert.match(hub, /aria-selected=/);
  assert.match(hub, /styles\.hubDescription/);
  assert.doesNotMatch(hub, /ðŸ|ComunicaciÃ/);
});

test('communications hub shell follows the Admin V2 visual language', () => {
  assert.match(hubCss, /font-family:\s*var\(--font-body,'Outfit'\)/);
  assert.match(hubCss, /\.tabsHeader[^}]*background:\s*#eee9df/s);
  assert.match(hubCss, /\.tabButton\.active[^}]*background:\s*#21bcaf/s);
  assert.match(hubCss, /focus-visible/);
  assert.match(hubCss, /@media\s*\(max-width:\s*768px\)/);
  assert.doesNotMatch(hubCss, /border:\s*2px solid #000|box-shadow:\s*\d+px \d+px 0/);
});

test('communication internal views avoid brutalist styling', () => {
  for (const file of [
    'MessageSender.module.css',
    'TemplateManager.module.css',
    'CommHistory.module.css',
  ]) {
    const css = read(`src/components/Admin/Communications/${file}`);
    assert.doesNotMatch(css, /border:\s*2px solid #000|box-shadow:\s*\d+px \d+px 0/);
    assert.match(css, /#174d49|#21bcaf/);
  }
});

test('ambassador materials is scoped for V2 styling and has no visible mojibake', () => {
  const materials = read('src/components/Admin/Communications/AmbassadorMaterialsManager.tsx');
  assert.match(materials, /AmbassadorMaterialsManager\.module\.css/);
  assert.match(materials, /styles\.materialsRoot/);
  assert.doesNotMatch(materials, /ðŸ|Ã|Â¿|âœ|â€”|â†|â/);
});

test('static admin preview can open the redesigned communications hub directly', () => {
  const preview = read('public/admin-v2-preview.html');
  assert.match(preview, /class="comm-tabs"/);
  assert.match(preview, /class="comm-compose"/);
  assert.match(preview, /URLSearchParams/);
  assert.match(preview, /showView\(initialView\)/);
});
