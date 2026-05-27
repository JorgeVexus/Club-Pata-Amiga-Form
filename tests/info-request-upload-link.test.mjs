import test from 'node:test';
import assert from 'node:assert/strict';

import { buildInfoRequestUploadUrl } from '../src/utils/info-request-upload-link.js';

test('buildInfoRequestUploadUrl points admin info requests to the secure upload page', () => {
  const url = buildInfoRequestUploadUrl({
    baseUrl: 'https://app.pataamiga.mx',
    memberId: 'mem_123',
    petIndex: 2,
    petId: '391d9c28-aecd-42b4-8c1d-7fc2bf41b41c',
    requestTypes: ['PET_PHOTO_1', 'OTHER_DOC'],
    logId: 'log_abc',
    token: 'signed-token',
    exp: 1790433600,
  });

  assert.equal(url.startsWith('https://app.pataamiga.mx/completar-documentacion?'), true);
  assert.equal(url.includes('club.pataamiga.mx'), false);

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('m'), 'mem_123');
  assert.equal(parsed.searchParams.get('p'), '2');
  assert.equal(parsed.searchParams.get('petId'), '391d9c28-aecd-42b4-8c1d-7fc2bf41b41c');
  assert.equal(parsed.searchParams.get('rt'), 'PET_PHOTO_1,OTHER_DOC');
  assert.equal(parsed.searchParams.get('log'), 'log_abc');
  assert.equal(parsed.searchParams.get('t'), 'signed-token');
  assert.equal(parsed.searchParams.get('exp'), '1790433600');
});

