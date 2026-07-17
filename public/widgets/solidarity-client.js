(function (root, factory) {
    const Client = factory();
    if (typeof module === 'object' && module.exports) module.exports = Client;
    if (root) root.PataSolidarityClient = Client;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    class SolidarityClient {
        constructor(apiUrl = '', fetchImpl = fetch) {
            this.apiUrl = String(apiUrl).replace(/\/$/, '');
            this.fetch = fetchImpl;
        }

        async request(path, options) {
            const response = await this.fetch(`${this.apiUrl}${path}`, options);
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'No pudimos completar la solicitud.');
            return data;
        }

        async getOverview(memberstackId) {
            const id = encodeURIComponent(memberstackId);
            const [stats, history, balance] = await Promise.all([
                this.request(`/api/solidarity/stats?memberstackId=${id}`),
                this.request(`/api/solidarity/history?memberstackId=${id}`),
                this.request(`/api/solidarity/balance?memberstackId=${id}`),
            ]);
            return { stats, history, balance };
        }

        createRequest(payload) {
            return this.request('/api/solidarity/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }

        getDetail(requestId, memberstackId) {
            return this.request(`/api/solidarity/requests/${encodeURIComponent(requestId)}?memberstackId=${encodeURIComponent(memberstackId)}`);
        }

        getMessages(requestId, memberstackId) {
            return this.request(`/api/solidarity/requests/${encodeURIComponent(requestId)}/messages?memberstackId=${encodeURIComponent(memberstackId)}`);
        }

        sendMessage(requestId, payload) {
            return this.request(`/api/solidarity/requests/${encodeURIComponent(requestId)}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }

        async uploadDocument(file, memberstackId, docType) {
            const body = new FormData();
            body.append('file', file);
            body.append('memberstackId', memberstackId);
            body.append('docType', docType);
            return this.request('/api/upload/solidarity-document', { method: 'POST', body });
        }
    }
    return SolidarityClient;
});
