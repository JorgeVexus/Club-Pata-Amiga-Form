import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/app/embajadores/registro/page.tsx', import.meta.url),
  'utf8'
);

test('ambassador navbar logout depends on a confirmed active session', () => {
  assert.match(source, /const \[hasActiveSession, setHasActiveSession\] = useState\(false\)/);
  assert.match(source, /setHasActiveSession\(true\)/);
  assert.match(source, /showLogout=\{hasActiveSession\}/);
});
