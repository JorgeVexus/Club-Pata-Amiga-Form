/**
 * Vet Bot embebido para Club Pata Amiga.
 * Se monta de forma explícita dentro del Dashboard V2 y nunca crea una burbuja flotante.
 */
(function () {
    'use strict';

    const CONFIG = {
        API_URL: (window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx').replace(/\/$/, '') + '/api',
        BOT_PLUGIN_URL: 'https://app.chatgptbuilder.io/webchat/plugin.js?v=6',
        BOT_ID: 'K4THS5LyA99jKDKYNgD3',
        ACCOUNT_ID: '1146761',
        PRIMARY_COLOR: '#21BCAF',
        FIELDS: {
            SESSION_TOKEN: '673882',
            CLIENT_EMAIL: '515388',
            CLIENT_NAME: '620522'
        },
        RETRY_INTERVAL: 250,
        MAX_RETRIES: 40
    };

    let pluginPromise = null;
    let mountedElement = null;

    function resolveElement(element) {
        if (typeof element === 'string') return document.querySelector(element);
        return element instanceof HTMLElement ? element : null;
    }

    function renderState(element, kind, title, message) {
        element.dataset.vetBotState = kind;
        element.innerHTML = `
            <div class="pata-vet-bot-state pata-vet-bot-state-${kind}" role="status">
                <span class="pata-vet-bot-state-icon" aria-hidden="true">${kind === 'loading' ? '🐾' : '💬'}</span>
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        `;
    }

    function loadPlugin() {
        if (typeof window.ktt10 !== 'undefined') return Promise.resolve();
        if (pluginPromise) return pluginPromise;
        pluginPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-pata-vet-plugin]');
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = CONFIG.BOT_PLUGIN_URL;
            script.dataset.pataVetPlugin = 'true';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return pluginPromise;
    }

    async function waitForMemberstack() {
        for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt += 1) {
            if (window.$memberstackDom) return window.$memberstackDom;
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_INTERVAL));
        }
        return null;
    }

    async function waitForPlugin() {
        for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt += 1) {
            if (typeof window.ktt10 !== 'undefined') return window.ktt10;
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_INTERVAL));
        }
        return null;
    }

    async function generateToken(memberstackId, email) {
        const response = await fetch(`${CONFIG.API_URL}/auth/session-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberstackId, email })
        });
        if (!response.ok) throw new Error('No se pudo generar la sesión del chat.');
        const data = await response.json();
        return data.sessionToken || data.session_token || data.token;
    }

    async function mount({ element } = {}) {
        const target = resolveElement(element);
        if (!target) return { ok: false, reason: 'missing-container' };
        if (mountedElement === target && target.dataset.vetBotState === 'ready') {
            return { ok: true, reused: true };
        }

        renderState(target, 'loading', 'Preparando tu orientación', 'Estamos conectando tu cuenta con la guía veterinaria.');
        try {
            const memberstack = await waitForMemberstack();
            if (!memberstack) throw new Error('Memberstack no está disponible.');
            const memberResult = await memberstack.getCurrentMember();
            const member = memberResult?.data;
            if (!member?.id) {
                renderState(target, 'session', 'Inicia sesión para continuar', 'La orientación veterinaria está disponible dentro de tu cuenta.');
                return { ok: false, reason: 'no-session' };
            }

            const planConnections = member.planConnections || [];
            const hasActivePlan = planConnections.some(plan => plan.status === 'ACTIVE');
            if (!hasActivePlan) {
                renderState(target, 'plan', 'Activa tu membresía', 'La orientación veterinaria 24/7 está incluida para miembros con un plan pagado activo.');
                return { ok: false, reason: 'inactive-plan' };
            }

            const email = member.auth?.email || '';
            const firstName = member.customFields?.['first-name'] || email.split('@')[0] || 'Cliente';
            const token = await generateToken(member.id, email);
            if (!token) throw new Error('No se recibió un token válido.');

            await loadPlugin();
            const plugin = await waitForPlugin();
            if (!plugin) throw new Error('El chat no respondió a tiempo.');

            target.innerHTML = '';
            plugin.setup({
                id: CONFIG.BOT_ID,
                accountId: CONFIG.ACCOUNT_ID,
                color: CONFIG.PRIMARY_COLOR,
                type: 'container',
                element: typeof element === 'string' ? element : target,
                hideHeader: true,
                loadMessages: true,
                setCustomFields: [
                    { id: CONFIG.FIELDS.SESSION_TOKEN, value: token },
                    { id: CONFIG.FIELDS.CLIENT_EMAIL, value: email },
                    { id: CONFIG.FIELDS.CLIENT_NAME, value: firstName }
                ],
                email,
                first_name: firstName
            });
            mountedElement = target;
            target.dataset.vetBotState = 'ready';
            return { ok: true };
        } catch (error) {
            console.error('[PataVetBot] No fue posible iniciar el chat:', error);
            renderState(target, 'error', 'No pudimos abrir el chat', 'Revisa tu conexión e inténtalo nuevamente en unos momentos.');
            return { ok: false, reason: 'error' };
        }
    }

    window.PataVetBot = { mount };
})();
