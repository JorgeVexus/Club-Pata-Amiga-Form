import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const tokenSource = fs.readFileSync('src/utils/upload-token.ts', 'utf8');
const fulfillSource = fs.readFileSync('src/app/api/user/fulfill-request/route.ts', 'utf8');
const updateSource = fs.readFileSync('src/app/api/user/update-pet-docs/route.ts', 'utf8');
const pageSource = fs.readFileSync('src/app/completar-documentacion/page.tsx', 'utf8');

test('upload HMAC fails closed without a strong configured secret', () => {
  assert.doesNotMatch(tokenSource, /fallback-secret-dev/);
  assert.match(tokenSource, /if \(!secret \|\| secret\.length < 24\)/);
  assert.match(tokenSource, /throw new Error/);
});

test('fulfill-request requires either complete magic credentials or a verified member session', () => {
  assert.match(fulfillSource, /requireMemberActor\(/);
  assert.match(fulfillSource, /hasCompleteMagicCredentials/);
  assert.match(fulfillSource, /hasPartialMagicCredentials/);
  assert.match(fulfillSource, /targetPet\.owner_id !== authorizedUserId/);
});

test('document update binds a signed pet index to the canonical pet id and owner', () => {
  assert.match(updateSource, /requireMemberActor\(/);
  assert.match(updateSource, /canonicalPetId/);
  assert.match(updateSource, /targetPetId !== canonicalPetId/);
  assert.match(updateSource, /owner_id/);
});

test('magic-link page forwards its signed credentials to storage uploads', () => {
  assert.match(pageSource, /photoFormData\.append\('token', token\)/);
  assert.match(pageSource, /photoFormData\.append\('exp', exp\)/);
  assert.match(pageSource, /certFormData\.append\('token', token\)/);
  assert.match(pageSource, /certFormData\.append\('exp', exp\)/);
});
