import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const formSource = await readFile(
  new URL('../src/components/AmbassadorForm/AmbassadorForm.tsx', import.meta.url),
  'utf8'
);
const stepSource = await readFile(
  new URL('../src/components/AmbassadorForm/SimplifiedStep.tsx', import.meta.url),
  'utf8'
);

test('ambassador registration requires at least one social profile', () => {
  assert.match(
    formSource,
    /!formData\.facebook\.trim\(\)\s*&&\s*!formData\.instagram\.trim\(\)\s*&&\s*!formData\.tiktok\.trim\(\)/
  );
  assert.match(formSource, /nextErrors\.social_media\s*=/);
});

test('social section communicates and displays the requirement error', () => {
  assert.match(stepSource, /data-field="social_media"/);
  assert.match(stepSource, /Al menos una/);
  assert.match(stepSource, /errors\.social_media/);
});
