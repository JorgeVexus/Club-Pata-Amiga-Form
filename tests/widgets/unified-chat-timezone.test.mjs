import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('public/widgets/unified-membership-widget.js', 'utf8');
const renderChatStart = source.indexOf('renderChatInterface(logs, petId, status)');
const renderChatEnd = source.indexOf('async fetchAndRenderChat(petId)', renderChatStart);

assert.ok(renderChatStart > -1, 'renderChatInterface should exist');
assert.ok(renderChatEnd > renderChatStart, 'renderChatInterface block should be bounded');

const renderChatSource = source.slice(renderChatStart, renderChatEnd);

assert.match(
  renderChatSource,
  /dateStr[\s\S]*toLocaleString\('es-MX',\s*\{[\s\S]*timeZone:\s*'America\/Mexico_City'/,
  'pet communication history must format log timestamps in CDMX timezone'
);

console.log('unified chat timezone check passed');
