/**
 * Vet-Bot Webflow Integration - Solo usuarios logueados
 * Versión: 2.0
 * Dominio: app.pataamiga.mx
 * 
 * Este script:
 * 1. Solo muestra el bot si el usuario está logueado en Memberstack
 * 2. Genera un token de sesión para identificación automática
 * 3. Pasa los datos al bot via userData
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
        error: (...args) => CONFIG.debug && console.error('[VetBot]', ...args)
    };

    // ============================================
    // GENERAR TOKEN DE SESIÓN
    // ============================================
    async function generateSessionToken(memberstackId, email) {
        try {
            logger.log('Generating session token...');
            
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
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success || !data.sessionToken) {
                throw new Error('Invalid response');
            }

            logger.log('Token generated successfully');
            return data.sessionToken;

        } catch (error) {
            logger.error('Failed to generate token:', error.message);
            return null;
        }
    }

    // ============================================
    // INICIALIZAR BOT
    // ============================================
    async function initBotWithAuth(member) {
        try {
            // Generar token de sesión
            const sessionToken = await generateSessionToken(
                member.id,
                member.auth?.email
            );

            // Preparar userData
            const firstName = member.customFields?.['first-name'] || 
                             member.auth?.email?.split('@')[0] || 
                             'Usuario';

            const userData = {
                session_token: sessionToken,
                user_email: member.auth?.email,
                first_name: firstName,
                memberstack_id: member.id
            };

            logger.log('Initializing bot with userData:', {
                ...userData,
                session_token: sessionToken ? '***' : null
            });

            // Configurar el bot
            if (typeof ktt10 !== 'undefined') {
                ktt10.setup({
                    id: "K4THS5LyA99jKDKYNgD3",
                    accountId: "1146761",
                    color: "#36D6B5",
                    userData: userData
                });
                
                logger.log('Bot initialized successfully');
            } else {
                logger.error('ktt10 not available');
            }

        } catch (error) {
            logger.error('Error initializing bot:', error);
            // Fallback: Cargar bot sin datos
            if (typeof ktt10 !== 'undefined') {
                ktt10.setup({
                    id: "K4THS5LyA99jKDKYNgD3",
                    accountId: "1146761",
                    color: "#36D6B5"
                });
            }
        }
    }

    // ============================================
    // LÓGICA PRINCIPAL - Solo usuarios logueados
    // ============================================
    function initVetBot() {
        // Verificar que Memberstack esté disponible
        if (!window.$memberstackDom) {
            logger.error('Memberstack not found');
            return;
        }

        // Obtener miembro actual (tu lógica original)
        window.$memberstackDom.getCurrentMember().then(function(member) {
            if (member && member.data) {
                logger.log('User logged in:', member.data.auth?.email);
                
                // Usuario logueado → Inicializar bot con token
                initBotWithAuth(member.data);
            } else {
                logger.log('User not logged in, bot will not load');
                // No hacer nada - el bot no se muestra
            }
        }).catch(function(error) {
            logger.error('Error getting current member:', error);
        });
    }

    // ============================================
    // INICIAR
    // ============================================
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVetBot);
    } else {
        initVetBot();
    }

})();
