const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const route = fs.readFileSync(path.resolve(__dirname, '../../src/app/api/solidarity/request/route.ts'), 'utf8');

test('solidarity request API requires bank and validates CLABE checksum', () => {
  assert.match(route, /sanitizeClabe/);
  assert.match(route, /isValidClabe/);
  assert.match(route, /!bankName/);
  assert.match(route, /La CLABE no es válida/);
});
