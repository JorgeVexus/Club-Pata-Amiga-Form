import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../public/widgets/complete-profile-widget.js', import.meta.url), 'utf8');

test('complete profile widget requires mother_last_name before marking member info complete', () => {
  const hasInfoExpression = source.match(/const hasInfo = ([^\n;]+);/)?.[1] || '';

  assert.match(hasInfoExpression, /u\.mother_last_name/, 'member info completeness must include mother_last_name');
  assert.match(
    source,
    /name="mother_last_name"[^>]*required/,
    'mother_last_name input must be required when member info is rendered',
  );
});

test('complete profile success button opens the member profile instead of reloading', () => {
  assert.doesNotMatch(
    source,
    /onclick="window\.location\.reload\(\)"[^>]*>ver mi perfil<\/button>/,
    'the success action must not reload the complete-profile page',
  );
  assert.match(
    source,
    /onclick="window\.location\.href = 'https:\/\/www\.pataamiga\.mx\/pets\/pet-waiting-period'"[^>]*>ver mi perfil<\/button>/,
    'the success action must open the member profile dashboard',
  );
});
