/**
 * Vet Bot Auth Bridge para Chatbot Builder AI
 * 
 * Este script conecta Memberstack con Chatbot Builder AI,
 * permitiendo identificación automática de usuarios.
 * 
 * INSTALACIÓN EN WEBFLOW:
 * 1. Incluir ESTE script ANTES del script de Chatbot Builder AI
 * 2. Configurar CONFIG.apiUrl con tu dominio
 * 3. El script modificará automáticamente ktt10.setup() para pasar userData
 * 
 * FUNCIONAMIENTO:
 * - Detecta cuando el usuario inicia sesión con Memberstack
 * - Genera un token de sesión en tu API
 * - Pasa el token a Chatbot Builder AI vía ktt10.setup({ userData: {...} })
 * - Chatbot Builder AI recibe el token en sus Custom User Fields
 */

(function() {
    'use strict';

    // =============================================
    // CONFIGURACIÓN - Modificar según tu ambiente
    // =============================================
    const CONFIG = {
        // URL de tu API de Next.js
        apiUrl: 'https://club-pata-amiga.vercel.app/api',
        
        // Debug mode
        debug: true
    };

    // =============================================
    // UTILIDADES DE LOGGING
    // =============================================
    const logger = {
        log: (...args) => CONFIG.debug && console.log('[VetBotCBB]', ...args),
        warn: (...args) => CONFIG.debug && console.warn('[VetBotCBB]', ...args),
        error: (...args) => CONFIG.debug && console.error('[VetBotCBB]', ...args),
        info: (...args) => CONFIG.debug && console.info('[VetBotCBB]', ...args)
    };

    // =============================================
    // API
    // =============================================
    const api = {
        async generateSessionToken(memberstackId, email) {
            try {
                logger.log('Generating session token...');
                
                const response = await fetch(`${CONFIG.apiUrl}/auth/session-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ memberstackId, email })
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.error || `HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (!data.success) {
                    throw new Error('API returned unsuccessful response');
                }

                logger.log('Session token generated:', data.sessionToken.substring(0, 8) + '...');
                return data.sessionToken;

            } catch (error) {
                logger.error('Failed to generate session token:', error.message);
                return null;
            }
        }
    };

    // =============================================
    // INTEGRACIÓN CON MEMBERSTACK
    // =============================================
    async function getMemberstackUser() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20;
            
            const check = setInterval(() => {
                attempts++;
                
                if (window.$memberstackDom) {
                    clearInterval(check);
                    window.$memberstackDom.getCurrentMember()
                        .then(member => resolve(member))
                        .catch(() => resolve(null));
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(check);
                    resolve(null);
                }
            }, 500);
        });
    }

    // =============================================
    // INTEGRACIÓN CON CHATBOT BUILDER AI
    // =============================================
    async function initChatbotBuilderIntegration() {
        logger.info('Initializing Chatbot Builder AI integration...');

        // 1. Obtener usuario de Memberstack
        const member = await getMemberstackUser();
        
        if (!member) {
            logger.warn('No Memberstack user found, bot will work without auto-identification');
            return;
        }

        logger.log('Member found:', member.auth?.email);

        // 2. Generar session token
        const token = await api.generateSessionToken(member.id, member.auth?.email);
        
        if (!token) {
            logger.warn('Could not generate session token');
            return;
        }

        // 3. Preparar userData para Chatbot Builder AI
        const userData = {
            session_token: token,
            user_email: member.auth?.email,
            memberstack_id: member.id
        };

        logger.log('Prepared userData for Chatbot Builder:', userData);

        // 4. Interceptar ktt10.setup para inyectar userData
        interceptChatbotBuilderSetup(userData);
    }

    function interceptChatbotBuilderSetup(userData) {
        // Esperar a que ktt10 esté disponible
        const checkInterval = setInterval(() => {
            if (typeof window.ktt10 !== 'undefined') {
                clearInterval(checkInterval);
                
                logger.log('Chatbot Builder AI detected, injecting userData...');
                
                // Guardar referencia original
                const originalSetup = window.ktt10.setup;
                
                // Sobrescribir setup para inyectar userData
                window.ktt10.setup = function(config) {
                    // Merge userData con la configuración existente
                    const enhancedConfig = {
                        ...config,
                        userData: {
                            ...(config.userData || {}),
                            ...userData
                        }
                    };
                    
                    logger.log('Calling ktt10.setup with enhanced config:', {
                        ...enhancedConfig,
                        userData: { ...enhancedConfig.userData, session_token: '***' }
                    });
                    
                    // Llamar al setup original
                    return originalSetup.call(window.ktt10, enhancedConfig);
                };
                
                logger.info('Successfully injected userData into Chatbot Builder AI');
                
                // Si el chatbot ya fue inicializado, intentar reiniciar con nuevos datos
                if (window.ktt10.initialized) {
                    logger.log('Chatbot was already initialized, attempting to refresh...');
                    // Algunas versiones de CBB soportan refresh
                    if (typeof window.ktt10.refresh === 'function') {
                        window.ktt10.refresh();
                    }
                }
            }
        }, 100);
        
        // Timeout después de 5 segundos
        setTimeout(() => clearInterval(checkInterval), 5000);
    }

    // =============================================
    // INICIALIZACIÓN
    // =============================================
    function init() {
        logger.info('Vet Bot Auth Bridge for Chatbot Builder AI v1.0');
        logger.log('Config:', { apiUrl: CONFIG.apiUrl });
        
        // Iniciar integración
        initChatbotBuilderIntegration();
        
        // Exponer API global para debugging
        window.vetBotCBB = {
            version: '1.0.0',
            config: CONFIG,
            refresh: initChatbotBuilderIntegration
        };
    }

    // Arrancar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
