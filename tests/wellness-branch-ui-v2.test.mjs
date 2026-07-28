import assert from 'node:assert/strict';
import fs from 'node:fs';

const widget = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const reactForm = fs.readFileSync(
  'src/components/WellnessForm/WellnessComplementaryForm.tsx',
  'utf8'
);
const reactCss = fs.readFileSync(
  'src/components/WellnessForm/WellnessForm.module.css',
  'utf8'
);

for (const brokenText of ['Â¿Esta sucursal', 'SÃ­', 'ClÃ­nica veterinaria']) {
  assert.ok(!widget.includes(brokenText), `widget should not contain ${brokenText}`);
}

for (const brokenText of ['recepciÃ³n', 'Ã¡reas', 'imÃ¡genes', 'RazÃ³n social', 'dÃ­gitos']) {
  assert.ok(!reactForm.includes(brokenText), `React form should not contain ${brokenText}`);
}

for (const token of [
  'wc-v2-branch-section',
  'wc-v2-choice-group',
  'wc-v2-choice',
  'wc-v2-branch-help'
]) {
  assert.ok(widget.includes(token), `widget should expose ${token}`);
}

for (const token of [
  'branchDetailsSection',
  'branchDetailsHeader',
  'choiceGroup',
  'choiceOption',
  'branchHelp'
]) {
  assert.ok(reactForm.includes(`styles.${token}`), `React form should use ${token}`);
  assert.ok(reactCss.includes(`.${token}`), `CSS Module should define ${token}`);
}
