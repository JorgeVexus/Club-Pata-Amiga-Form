/**
 * Vet Bot Auth Bridge v1.0
 * 
 * Este script conecta la autenticación de Memberstack con el Vet-Bot,
 * permitiendo identificación automática de usuarios sin preguntar email.
 * 
 * INSTALACIÓN EN WEBFLOW:
 * 1. Subir este archivo a tu hosting/CDN
 * 2. Agregar en el <head> de Webflow:
 *    <script src="https://tudominio.com/widgets/vet-bot-auth-bridge.js"></script>
 * 
 * FUNCIONAMIENTO:
 * - Detecta cuando el usuario inicia sesión con Memberstack
 * - Genera un token de sesión llamando a nuestra API
 * - Guarda el token en una cookie accesible por el bot
 * - El bot lee esta cookie para identificar al usuario
 * 
 * CONFIGURACIÓN:
 * Modificar la variable CONFIG.apiUrl con tu dominio
 */

(function() {
    'use strict';

    // =============================================
    // CONFIGURACIÓN - Modificar según tu ambiente
    // =============================================
    const CONFIG = {
        // URL de tu API de Next.js
        apiUrl: 'https://club-pata-amiga.vercel.app/api',
        
        // Nombre de la cookie (debe coincidir con lo que espera el bot)
        cookieName: 'vet_session',
        
        // Duración de la sesión en segundos (2 horas)
        sessionDuration: 2 * 60 * 60,
        
        // Debug mode (muestra logs en consola)
        debug: true,
        
        // Retry config
        maxRetries: 3,
        retryDelay: 1000
    };

    // =============================================
    // UTILIDADES DE LOGGING
    // =============================================
    const logger = {
        log: (...args) => CONFIG.debug && console.log('[VetBotBridge]', ...args),
        warn: (...args) => CONFIG.debug && console.warn('[VetBotBridge]', ...args),
        error: (...args) => CONFIG.debug && console.error('[VetBotBridge]', ...args),
        info: (...args) => CONFIG.debug && console.info('[VetBotBridge]', ...args)
    };

    // =============================================
    // UTILIDADES DE COOKIES
    // =============================================
    const cookies = {
        /**
         * Establece una cookie
         */
        set(name, value, maxAgeSeconds) {
            const expires = new Date();
            expires.setSeconds(expires.getSeconds() + maxAgeSeconds);
            
            // SameSite=Lax permite que el bot en iframe/subdominio lea la cookie
            // si viene de la misma sesión de navegación
            const cookieString = `${name}=${encodeURIComponent(value)}; ` +
                `expires=${expires.toUTCString()}; ` +
                `path=/; ` +
                `SameSite=Lax`;
            
            document.cookie = cookieString;
            logger.log(`Cookie set: ${name}`);
        },

        /**
         * Obtiene el valor de una cookie
         */
        get(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                return decodeURIComponent(parts.pop().split(';').shift());
            }
            return null;
        },

        /**
         * Elimina una cookie
         */
        remove(name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            logger.log(`Cookie removed: ${name}`);
        },

        /**
         * Verifica si existe una cookie
         */
        exists(name) {
            return this.get(name) !== null;
        }
    };

    // =============================================
    // UTILIDADES DE API
    // =============================================
    const api = {
        /**
         * Genera un token de sesión en el backend
         */
        async generateSessionToken(memberstackId, email, retryCount = 0) {
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
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (!data.success || !data.sessionToken) {
                    throw new Error('Invalid response from server');
                }

                logger.log('Session token generated successfully');
                return {
                    success: true,
                    token: data.sessionToken,
                    expiresAt: data.expiresAt
                };

            } catch (error) {
                logger.error('Failed to generate session token:', error.message);
                
                // Retry logic
                if (retryCount < CONFIG.maxRetries) {
                    logger.log(`Retrying in ${CONFIG.retryDelay}ms... (attempt ${retryCount + 1})`);
                    await new Promise(r => setTimeout(r, CONFIG.retryDelay));
                    return this.generateSessionToken(memberstackId, email, retryCount + 1);
                }

                return { success: false, error: error.message };
            }
        },

        /**
         * Invalida el token de sesión (logout)
         */
        async invalidateSessionToken(token) {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/auth/session-token`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                return response.ok;
            } catch (error) {
                logger.error('Failed to invalidate session:', error.message);
                return false;
            }
        }
    };

    // =============================================
    // GESTIÓN DE SESIÓN
    // =============================================
    const sessionManager = {
        currentToken: null,

        /**
         * Inicializa una nueva sesión
         */
        async create(member) {
            try {
                const memberstackId = member.id || member.memberstackId;
                const email = member.auth?.email || member.email;

                if (!memberstackId || !email) {
                    logger.warn('Missing memberstackId or email');
                    return false;
                }

                // Generar token en el backend
                const result = await api.generateSessionToken(memberstackId, email);
                
                if (!result.success) {
                    logger.error('Failed to create session');
                    return false;
                }

                // Guardar en cookie
                cookies.set(CONFIG.cookieName, result.token, CONFIG.sessionDuration);
                this.currentToken = result.token;

                logger.info('Session created successfully');
                logger.log('Token expires at:', new Date(result.expiresAt).toLocaleString());
                
                return true;

            } catch (error) {
                logger.error('Error creating session:', error);
                return false;
            }
        },

        /**
         * Destruye la sesión actual
         */
        async destroy() {
            if (this.currentToken) {
                await api.invalidateSessionToken(this.currentToken);
            }
            cookies.remove(CONFIG.cookieName);
            this.currentToken = null;
            logger.info('Session destroyed');
        },

        /**
         * Verifica si existe una sesión activa
         */
        exists() {
            return cookies.exists(CONFIG.cookieName);
        },

        /**
         * Obtiene el token actual
         */
        getToken() {
            return this.currentToken || cookies.get(CONFIG.cookieName);
        }
    };

    // =============================================
    // INTEGRACIÓN CON MEMBERSTACK
    // =============================================
    const memberstackIntegration = {
        memberstack: null,

        /**
         * Espera a que Memberstack esté disponible
         */
        async waitForMemberstack() {
            return new Promise((resolve) => {
                // Si ya está cargado
                if (window.$memberstackDom) {
                    this.memberstack = window.$memberstackDom;
                    resolve(this.memberstack);
                    return;
                }

                // Intentar cada 500ms
                let attempts = 0;
                const maxAttempts = 20; // 10 segundos máximo

                const interval = setInterval(() => {
                    attempts++;
                    
                    if (window.$memberstackDom) {
                        clearInterval(interval);
                        this.memberstack = window.$memberstackDom;
                        resolve(this.memberstack);
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        logger.error('Memberstack did not load within timeout');
                        resolve(null);
                    }
                }, 500);
            });
        },

        /**
         * Configura los event listeners de Memberstack
         */
        async setupEventListeners() {
            if (!this.memberstack) {
                logger.error('Memberstack not available');
                return;
            }

            logger.log('Setting up Memberstack event listeners...');

            // Listener de cambios de autenticación
            try {
                this.memberstack.onAuthChange((event) => {
                    logger.log('Auth change event:', event.type);

                    switch (event.type) {
                        case 'login':
                        case 'signup':
                            this.handleLogin();
                            break;
                        case 'logout':
                            this.handleLogout();
                            break;
                        case 'profileUpdate':
                            // Opcional: Actualizar sesión si cambia el email
                            logger.log('Profile updated');
                            break;
                    }
                });
            } catch (error) {
                logger.error('Error setting up auth listener:', error);
            }

            // Verificar sesión existente al cargar
            await this.checkExistingSession();
        },

        /**
         * Maneja el evento de login
         */
        async handleLogin() {
            logger.log('Handling login event...');
            
            try {
                const member = await this.memberstack.getCurrentMember();
                
                if (member) {
                    logger.log('Member logged in:', member.auth?.email);
                    
                    // Si no hay sesión activa, crear una
                    if (!sessionManager.exists()) {
                        await sessionManager.create(member);
                    }
                }
            } catch (error) {
                logger.error('Error handling login:', error);
            }
        },

        /**
         * Maneja el evento de logout
         */
        async handleLogout() {
            logger.log('Handling logout event...');
            await sessionManager.destroy();
        },

        /**
         * Verifica si hay una sesión existente al cargar la página
         */
        async checkExistingSession() {
            try {
                const member = await this.memberstack.getCurrentMember();
                
                if (member) {
                    logger.log('Existing session found for:', member.auth?.email);
                    
                    // Si no hay cookie pero hay sesión de Memberstack, crear una
                    if (!sessionManager.exists()) {
                        logger.log('Creating new session cookie...');
                        await sessionManager.create(member);
                    } else {
                        logger.log('Session cookie already exists');
                    }
                } else {
                    logger.log('No active Memberstack session');
                    // Limpiar cookie huérfana si existe
                    if (sessionManager.exists()) {
                        await sessionManager.destroy();
                    }
                }
            } catch (error) {
                logger.error('Error checking existing session:', error);
            }
        }
    };

    // =============================================
    // INICIALIZACIÓN
    // =============================================
    async function init() {
        logger.info('Initializing Vet Bot Auth Bridge v1.0');
        logger.log('Config:', { 
            apiUrl: CONFIG.apiUrl, 
            cookieName: CONFIG.cookieName,
            debug: CONFIG.debug 
        });

        // Esperar a Memberstack
        const memberstack = await memberstackIntegration.waitForMemberstack();
        
        if (!memberstack) {
            logger.error('Failed to initialize - Memberstack not found');
            return;
        }

        logger.log('Memberstack found, setting up integration...');
        
        // Configurar event listeners
        await memberstackIntegration.setupEventListeners();
        
        logger.info('Vet Bot Auth Bridge initialized successfully');
        
        // Exponer API global para debugging (opcional)
        window.vetBotBridge = {
            session: sessionManager,
            config: CONFIG,
            version: '1.0.0'
        };
    }

    // =============================================
    // ARRANQUE
    // =============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
