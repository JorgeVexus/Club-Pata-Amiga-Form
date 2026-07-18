(function initNotificationActionResolver(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PataNotificationActions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createNotificationActionResolver() {
  const OFFICIAL_HOSTS = new Set(['pataamiga.mx', 'www.pataamiga.mx', 'app.pataamiga.mx']);
  const ACTIONS = new Set(['open_pet_chat', 'open_pet', 'open_reimbursement', 'show_detail']);

  function stringId(value) {
    if (value === undefined || value === null || value === '') return '';
    return String(value);
  }

  function isSafePataAmigaUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' && OFFICIAL_HOSTS.has(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  function parseLink(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      return new URL(value, 'https://www.pataamiga.mx');
    } catch {
      return null;
    }
  }

  function resolveNotificationAction(notification) {
    const item = notification && typeof notification === 'object' ? notification : {};
    const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
    const action = ACTIONS.has(metadata.action) ? metadata.action : '';
    const petId = stringId(metadata.petId || metadata.pet_id);
    const requestId = stringId(metadata.requestId || metadata.request_id);

    if (action === 'open_pet_chat' && petId) return { type: action, petId };
    if (action === 'open_pet' && petId) return { type: action, petId };
    if (action === 'open_reimbursement' && requestId) return { type: action, requestId };
    if (action === 'show_detail') return { type: action };

    const source = String(metadata.source || '').toLowerCase();
    if (petId && ['info_request', 'request_info', 'appeal_response'].includes(source)) {
      return { type: 'open_pet_chat', petId };
    }
    if (requestId && (source.includes('solidarity') || source.includes('reimbursement'))) {
      return { type: 'open_reimbursement', requestId };
    }
    if (petId) return { type: 'open_pet', petId };

    const parsed = parseLink(item.link);
    if (parsed) {
      const path = parsed.pathname.toLowerCase();
      const linkedPetId = stringId(parsed.searchParams.get('petId') || parsed.searchParams.get('pet_id'));
      const linkedRequestId = stringId(parsed.searchParams.get('requestId') || parsed.searchParams.get('request_id') || parsed.searchParams.get('id'));
      if (linkedPetId && parsed.searchParams.get('action') === 'chat') return { type: 'open_pet_chat', petId: linkedPetId };
      if (linkedPetId && path.includes('mi-membresia')) return { type: 'open_pet', petId: linkedPetId };
      if (linkedRequestId && path.includes('detalle-solicitud')) return { type: 'open_reimbursement', requestId: linkedRequestId };
      if (item.link.startsWith('http') && isSafePataAmigaUrl(item.link)) return { type: 'navigate', url: item.link };
    }

    return { type: 'show_detail' };
  }

  return { resolveNotificationAction, isSafePataAmigaUrl };
});
