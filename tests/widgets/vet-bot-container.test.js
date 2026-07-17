const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const botPath = path.resolve(__dirname, '../../public/widgets/vet-bot.js');
const source = fs.readFileSync(botPath, 'utf8');

test('Vet Bot exposes an explicit container mount API', () => {
  assert.match(source, /window\.PataVetBot\s*=/);
  assert.match(source, /window\.PataVetBot\s*=\s*\{\s*mount\s*\}/);
  assert.match(source, /type:\s*['"]container['"]/);
  assert.match(source, /element:/);
  assert.match(source, /hideHeader:\s*true/);
  assert.match(source, /loadMessages:\s*true/);
});

test('Vet Bot keeps paid-plan and session-token protection', () => {
  assert.match(source, /planConnections\.some\([^)]*status\s*===\s*['"]ACTIVE['"]/);
  assert.match(source, /\/auth\/session-token/);
  assert.match(source, /SESSION_TOKEN/);
});

test('Vet Bot no longer auto-initializes a floating bubble', () => {
  assert.doesNotMatch(source, /DOMContentLoaded['"],\s*init/);
  assert.doesNotMatch(source, /else\s*\{\s*init\(\);\s*\}\s*\}\)\(\);/);
});
