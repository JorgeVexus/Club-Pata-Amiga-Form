/**
 * Vet-Bot Centralized Integration v5.0
 * app.pataamiga.mx | Club Pata Amiga
 * 
 * Este script automatiza la inicialización del Vet-Bot,
 * asegurando que Memberstack y el token de sesión estén listos
 * antes de cargar el plugin. Esto soluciona problemas de saludo
 * automático en Mac/iOS y simplifica la integración en Webflow.
 */

(function () {
    'use strict';

    const CONFIG = {
        API_URL: 'https://app.pataamiga.mx/api',
        BOT_PLUGIN_URL: 'https://app.chatgptbuilder.io/webchat/plugin.js?v=6',
        BOT_ID: "K4THS5LyA99jKDKYNgD3",
        ACCOUNT_ID: "1146761",
        PRIMARY_COLOR: "#36D6B5",
        FIELDS: {
            SESSION_TOKEN: "673882",
            CLIENT_EMAIL: "515388",
            CLIENT_NAME: "620522"
        },
        RETRY_INTERVAL: 300,
        MAX_RETRIES: 30 // ~9 segundos
    };

    const log = (...args) => console.log('[VetBot-Central]', ...args);

    let retryCount = 0;

    async function generateToken(memberstackId, email) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/session-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberstackId, email })
            });
            const data = await response.json();
            return data.sessionToken || data.session_token || data.token;
        } catch (e) {
            console.error('[VetBot-Central] Error generating token:', e);
            return null;
        }
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function init() {
        // 1. Esperar a Memberstack
        if (!window.$memberstackDom) {
            if (retryCount < CONFIG.MAX_RETRIES) {
                retryCount++;
                setTimeout(init, CONFIG.RETRY_INTERVAL);
                return;
            }
            return log('❌ Error: Memberstack no cargó a tiempo.');
        }

        try {
            // 2. Obtener miembro actual
            const member = await window.$memberstackDom.getCurrentMember();
            if (!member || !member.data) {
                return log('ℹ️ Sesión no iniciada. El bot no se cargará automáticamente.');
            }

            const userEmail = member.data.auth?.email;
            const firstName = member.data.customFields?.['first-name'] || userEmail?.split('@')[0] || 'Cliente';
            
            log('🔑 Obteniendo token de sesión...');
            const token = await generateToken(member.data.id, userEmail);

            if (!token) {
                return log('❌ Error: No se pudo generar el token de sesión.');
            }

            // 3. Cargar el plugin del bot dinámicamente
            log('📦 Cargando plugin de ChatGPT Builder...');
            await loadScript(CONFIG.BOT_PLUGIN_URL);

            // 4. Configurar el bot (Polling para asegurar que ktt10 existe)
            const setupBot = () => {
                if (typeof ktt10 === 'undefined') {
                    setTimeout(setupBot, 200);
                    return;
                }

                log('🚀 Inicializando Bot...');
                ktt10.setup({
                    id: CONFIG.BOT_ID,
                    accountId: CONFIG.ACCOUNT_ID,
                    color: CONFIG.PRIMARY_COLOR,
                    setCustomFields: [
                        { id: CONFIG.FIELDS.SESSION_TOKEN, value: token },
                        { id: CONFIG.FIELDS.CLIENT_EMAIL, value: userEmail },
                        { id: CONFIG.FIELDS.CLIENT_NAME, value: firstName }
                    ],
                    email: userEmail,
                    first_name: firstName
                    // Nota: No incluimos 'ref' ya que el builder usa el token para el contexto
                });

                log('✅ Vet-Bot listo y configurado.');
            };

            setupBot();

        } catch (error) {
            console.error('[VetBot-Central] Fatal Error:', error);
        }
    }

    // Iniciar cuando el DOM esté listo o inmediatamente si ya lo está
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
