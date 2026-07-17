const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../../src/app/actions/comm.actions.ts'), 'utf8');

test('use server communication actions do not re-export imported types as server references', () => {
  assert.doesNotMatch(source, /export type \{\s*MissingDocType,\s*FollowupDay\s*\}/);
  assert.match(source, /export type MissingDocType = 'photo' \| 'certificate' \| 'both';/);
  assert.match(source, /export type FollowupDay = 0 \| 10 \| 13 \| 14 \| 15;/);
});
