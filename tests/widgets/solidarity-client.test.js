const test = require('node:test');
const assert = require('node:assert/strict');

const SolidarityClient = require('../../public/widgets/solidarity-client.js');

test('client builds API-first overview requests for the Memberstack member', async () => {
  const calls = [];
  const client = new SolidarityClient('https://app.example.test', async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ success: true }) };
  });

  await client.getOverview('mem_123');

  assert.equal(calls.length, 3);
  assert.match(calls[0], /\/api\/solidarity\/stats\?memberstackId=mem_123/);
  assert.match(calls[1], /\/api\/solidarity\/history\?memberstackId=mem_123/);
  assert.match(calls[2], /\/api\/solidarity\/balance\?memberstackId=mem_123/);
});

test('client submits requests and messages through existing endpoints', async () => {
  const calls = [];
  const client = new SolidarityClient('', async (url, options = {}) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ success: true }) };
  });

  await client.createRequest({ memberstackId: 'mem_1', petId: 'pet_1' });
  await client.sendMessage('req_1', { memberstackId: 'mem_1', message: 'Hola' });

  assert.equal(calls[0].url, '/api/solidarity/request');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[1].url, '/api/solidarity/requests/req_1/messages');
  assert.equal(calls[1].options.method, 'POST');
});
