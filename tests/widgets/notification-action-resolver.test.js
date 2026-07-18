const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveNotificationAction, isSafePataAmigaUrl } = require('../../public/widgets/notification-action-resolver.js');

test('metadata action has priority over a legacy link', () => {
  assert.deepEqual(resolveNotificationAction({
    link: '/dashboard',
    metadata: { action: 'open_pet_chat', petId: 'pet-7' }
  }), { type: 'open_pet_chat', petId: 'pet-7' });
});

test('pet status metadata opens the pet record', () => {
  assert.deepEqual(resolveNotificationAction({
    metadata: { action: 'open_pet', petId: 12 }
  }), { type: 'open_pet', petId: '12' });
});

test('solidarity metadata opens the internal reimbursement request', () => {
  assert.deepEqual(resolveNotificationAction({
    metadata: { source: 'solidarity_message', requestId: 'request-9' }
  }), { type: 'open_reimbursement', requestId: 'request-9' });
});

test('legacy member chat link is translated to an internal chat action', () => {
  assert.deepEqual(resolveNotificationAction({
    link: '/mi-membresia?petId=pet-3&action=chat'
  }), { type: 'open_pet_chat', petId: 'pet-3' });
});

test('legacy reimbursement link is translated to an internal detail action', () => {
  assert.deepEqual(resolveNotificationAction({
    link: '/miembros/detalle-solicitud?id=req-4'
  }), { type: 'open_reimbursement', requestId: 'req-4' });
});

test('known informational routes fall back to a safe detail modal', () => {
  assert.deepEqual(resolveNotificationAction({ link: '/dashboard' }), { type: 'show_detail' });
  assert.deepEqual(resolveNotificationAction({ link: '/miembros/dashboard' }), { type: 'show_detail' });
});

test('only official Pata Amiga http URLs are allowed as external navigation', () => {
  assert.equal(isSafePataAmigaUrl('https://www.pataamiga.mx/miembros/perfil'), true);
  assert.equal(isSafePataAmigaUrl('https://app.pataamiga.mx/widgets/test'), true);
  assert.equal(isSafePataAmigaUrl('javascript:alert(1)'), false);
  assert.equal(isSafePataAmigaUrl('https://example.com/phishing'), false);
  assert.deepEqual(resolveNotificationAction({ link: 'https://example.com/phishing' }), { type: 'show_detail' });
});

test('a safe official absolute link remains navigable', () => {
  assert.deepEqual(resolveNotificationAction({
    link: 'https://www.pataamiga.mx/miembros/configuracion'
  }), { type: 'navigate', url: 'https://www.pataamiga.mx/miembros/configuracion' });
});
