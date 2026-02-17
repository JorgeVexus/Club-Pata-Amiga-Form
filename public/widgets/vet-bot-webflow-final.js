/**
 * Vet-Bot Webflow Integration Script v2.0
 * 
 * Integración completa entre Memberstack, Vercel API y Chatbot Builder AI
 * 
 * CONFIGURACIÓN REQUERIDA:
 * - Asegúrate de que el script de Memberstack esté cargado antes que este
 * 
 * USO:
 * <script src="https://app.pataamiga.mx/widgets/vet-bot-webflow-final.js"></script>
 * <script>
 *   window.initVetBot({
 *     id: "K4THS5LyA99jKDKYNgD3",
 *     accountId: "1146761",
 *     color: "#36D6B5"
 *   });
 * </script>
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        apiUrl: 'https://app.pataamiga.mx/api',
        debug: true
    };

    // ============================================
    // LOGGER
    // ============================================
    const logger = {
        log: (...args) => CONFIG.debug && console.log('[VetBot]', ...args),
        warn: (...args) => CONFIG.debug && console.warn('[VetBot]', ...args),
        error: (...args) => CONFIG.debug && console.error('[VetBot]', ...args)
    };

    // ============================================
    // UTILIDADES
    // ============================================
    
    /**
     * Espera a que Memberstack esté disponible
     */
    function waitForMemberstack() {
        return new Promise((resolve) => {
            // Si ya está disponible
            if (window.$memberstackDom) {
                resolve(window.$memberstackDom);
                return;
            }

            // Esperar con intervalo
            let attempts = 0;
            const maxAttempts = 40; // 20 segundos máximo
            
            const interval = setInterval(() => {
                attempts++;
                
                if (window.$memberstackDom) {
                    clearInterval(interval);
                    resolve(window.$memberstackDom);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    logger.error('Timeout waiting for Memberstack');
                    resolve(null);
                }
            }, 500);
        });
    }

    /**
     * Genera un session token en el backend
     */
    async function generateSessionToken(memberstackId, email) {
        try {
            logger.log('Requesting session token...');
            
            const response = await fetch(`${CONFIG.apiUrl}/auth/session-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    memberstackId: memberstackId, 
                    email: email 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success || !data.sessionToken) {
                throw new Error('Invalid API response');
            }

            logger.log('Session token received');
            return {
                token: data.sessionToken,
                expiresAt: data.expiresAt
            };

        } catch (error) {
            logger.error('Failed to get session token:', error.message);
            return null;
        }
    }

    /**
     * Obtiene datos adicionales del usuario desde Memberstack
     */
    function extractUserData(member) {
        const customFields = member.customFields || {};
        
        return {
            firstName: customFields['first-name'] || 
                      customFields['first_name'] || 
                      member.auth?.email?.split('@')[0] || 
                      'Usuario',
            lastName: customFields['last-name'] || 
                     customFields['last_name'] || 
                     '',
            email: member.auth?.email || '',
            phone: customFields['phone'] || ''
        };
    }

    // ============================================
    // INICIALIZACIÓN DEL BOT
    // ============================================
    
    /**
     * Inicializa el Vet-Bot con identificación automática
     * @param {Object} botConfig - Configuración de Chatbot Builder AI
     * @param {string} botConfig.id - Webchat ID
     * @param {string} botConfig.accountId - Account ID
     * @param {string} botConfig.color - Color del bot
     */
    async function initVetBot(botConfig) {
        logger.info('Initializing Vet-Bot v2.0...');
        
        // Validar configuración
        if (!botConfig || !botConfig.id || !botConfig.accountId) {
            logger.error('Invalid bot configuration. Required: id, accountId');
            return;
        }

        // Esperar a Memberstack
        const memberstack = await waitForMemberstack();
        
        if (!memberstack) {
            logger.error('Memberstack not available. Bot will not load.');
            return;
        }

        try {
            // Obtener usuario actual
            const member = await memberstack.getCurrentMember();
            
            if (!member || !member.data) {
                logger.log('User not authenticated. Bot will not load.');
                return;
            }

            const memberData = member.data;
            logger.log('User authenticated:', memberData.auth?.email);

            // Generar session token
            const sessionResult = await generateSessionToken(
                memberData.id,
                memberData.auth?.email
            );

            // Preparar userData para el bot
            const userInfo = extractUserData(memberData);
            
            const userData = {
                session_token: sessionResult?.token || null,
                user_email: userInfo.email,
                first_name: userInfo.firstName,
                last_name: userInfo.lastName,
                phone: userInfo.phone,
                memberstack_id: memberData.id
            };

            logger.log('UserData prepared for bot:', {
                ...userData,
                session_token: userData.session_token ? '***' : null
            });

            // Cargar Chatbot Builder AI
            loadChatbotBuilder(botConfig, userData);

        } catch (error) {
            logger.error('Error during initialization:', error);
            // Cargar bot sin identificación como fallback
            loadChatbotBuilder(botConfig, {});
        }
    }

    /**
     * Carga el script de Chatbot Builder AI
     */
    function loadChatbotBuilder(config, userData) {
        logger.log('Loading Chatbot Builder AI...');

        // Verificar si ya está cargado
        if (typeof window.ktt10 !== 'undefined') {
            setupChatbot(config, userData);
            return;
        }

        // Cargar script dinámicamente
        const script = document.createElement('script');
        script.src = 'https://app.chatgptbuilder.io/webchat/plugin.js?v=6';
        script.async = true;
        
        script.onload = function() {
            logger.log('Chatbot Builder AI loaded');
            setupChatbot(config, userData);
        };
        
        script.onerror = function() {
            logger.error('Failed to load Chatbot Builder AI script');
        };
        
        document.head.appendChild(script);
    }

    /**
     * Configura el chatbot con userData
     */
    function setupChatbot(config, userData) {
        if (typeof window.ktt10 === 'undefined') {
            logger.error('ktt10 not available');
            return;
        }

        try {
            const setupConfig = {
                id: config.id,
                accountId: config.accountId,
                color: config.color || '#36D6B5'
            };

            // Agregar userData si existe
            if (userData && Object.keys(userData).length > 0) {
                setupConfig.userData = userData;
            }

            window.ktt10.setup(setupConfig);
            logger.info('Chatbot initialized successfully');

        } catch (error) {
            logger.error('Error setting up chatbot:', error);
        }
    }

    // ============================================
    // API PÚBLICA
    // ============================================
    
    // Exponer función global
    window.initVetBot = initVetBot;

    // Auto-inicialización si hay configuración en data attributes
    document.addEventListener('DOMContentLoaded', function() {
        const scriptTag = document.querySelector('script[data-vet-bot-auto]');
        if (scriptTag) {
            const config = {
                id: scriptTag.getAttribute('data-bot-id'),
                accountId: scriptTag.getAttribute('data-account-id'),
                color: scriptTag.getAttribute('data-color')
            };
            
            if (config.id && config.accountId) {
                initVetBot(config);
            }
        }
    });

    logger.info('Vet-Bot Integration Script loaded. Use window.initVetBot({...}) to initialize.');

})();
