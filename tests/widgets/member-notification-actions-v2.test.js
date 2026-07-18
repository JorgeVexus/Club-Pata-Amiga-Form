const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../../public/widgets/unified-membership-widget.js'), 'utf8');

test('unified widget loads and uses the shared notification action resolver', () => {
  assert.match(source, /notification-action-resolver\.js/);
  assert.match(source, /ensureNotificationActionResolverV2\(\)/);
  assert.match(source, /PataNotificationActions\.resolveNotificationAction/);
});

test('notification pet actions reuse the functional pet detail modal and can focus chat', () => {
  assert.match(source, /openPetDetailsV2\(petId, options = \{\}\)/);
  assert.match(source, /this\.renderPetDetailsModal\(pet\)/);
  assert.match(source, /this\.fetchAndRenderChat\(pet\.id\)/);
  assert.match(source, /document\.getElementById\('pata-chat-root'\)/);
  assert.match(source, /document\.getElementById\('pata-chat-input'\)/);
});

test('notification reimbursement action opens the existing internal detail view', () => {
  assert.match(source, /case 'open_reimbursement'/);
  assert.match(source, /await this\.showReimbursementDetailV2\(action\.requestId\)/);
});

test('notification action failures open an escaped V2 information modal', () => {
  assert.match(source, /showNotificationDetailV2\(item/);
  assert.match(source, /pata-v2-notification-detail-modal/);
  assert.match(source, /this\.escapeHtml\(item\?\.title/);
  assert.match(source, /this\.escapeHtml\(item\?\.message/);
  assert.match(source, /catch \(error\)[\s\S]*showNotificationDetailV2\(item/s);
});

test('marking a notification as read remains independent from its action', () => {
  const method = source.match(/async openNotificationV2\(notificationId\) \{([\s\S]*?)\n        \}/);
  assert.ok(method, 'openNotificationV2 method must exist');
  assert.match(method[1], /await this\.markNotificationReadV2\(notificationId\)/);
  assert.match(method[1], /await this\.executeNotificationActionV2\(item\)/);
});

test('local preview includes representative pet chat, reimbursement and detail actions', () => {
  assert.match(source, /metadata:\s*\{ action:'open_pet_chat', petId:'test-action'/);
  assert.match(source, /metadata:\s*\{ action:'open_reimbursement', requestId:'mock-1'/);
  assert.match(source, /metadata:\s*\{ action:'show_detail'/);
});

test('notification polling does not refresh the local preview or repaint unchanged data', () => {
  assert.match(source, /startNotificationPollingV2\(\)\s*\{[\s\S]*if \(this\.isLocalPreview\(\)\)[\s\S]*this\.loadNotificationsV2\(\);[\s\S]*return;/s);
  assert.match(source, /hasNotificationPayloadChangedV2\(nextItems\)/);
  assert.match(source, /if \(!this\.hasNotificationPayloadChangedV2\(nextItems\)\) return;/);
  assert.match(source, /notificationRefreshInterval = window\.setInterval\([\s\S]*15000\)/s);
});
