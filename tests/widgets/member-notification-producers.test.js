const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = relative => fs.readFileSync(path.resolve(__dirname, '../..', relative), 'utf8');

test('admin information requests and appeal responses open the related pet chat', () => {
  const requestInfo = read('src/app/api/admin/members/[id]/request-info/route.ts');
  const appeal = read('src/app/api/admin/members/[id]/appeal-response/route.ts');
  assert.match(requestInfo, /action:\s*'open_pet_chat'/);
  assert.match(requestInfo, /petId:\s*resolvedPetId/);
  assert.match(appeal, /action:\s*'open_pet_chat'/);
  assert.match(appeal, /petId:\s*petId/);
});

test('all pet status notifications open the resolved pet record', () => {
  const status = read('src/app/api/admin/members/[id]/pets/[petId]/status/route.ts');
  const actions = status.match(/action:\s*'open_pet'/g) || [];
  const ids = status.match(/petId:\s*resolvedPetId/g) || [];
  assert.equal(actions.length, 3);
  assert.equal(ids.length, 3);
});

test('solidarity status and member-facing messages open the internal reimbursement detail', () => {
  const update = read('src/app/api/admin/solidarity/update/route.ts');
  const messages = read('src/app/api/solidarity/requests/[id]/messages/route.ts');
  assert.match(update, /metadata:\s*\{\s*action:\s*'open_reimbursement',\s*requestId/s);
  assert.match(messages, /action:\s*isFromAdmin\s*\?\s*'open_reimbursement'/);
  assert.match(messages, /requestId:\s*id/);
});

test('member approval and rejection notifications use explicit safe detail actions', () => {
  const approve = read('src/app/api/admin/members/[id]/approve/route.ts');
  const reject = read('src/app/api/admin/members/[id]/reject/route.ts');
  assert.match(approve, /metadata:\s*\{\s*action:\s*'show_detail'/);
  assert.match(reject, /metadata:\s*\{\s*action:\s*'show_detail'/);
});
