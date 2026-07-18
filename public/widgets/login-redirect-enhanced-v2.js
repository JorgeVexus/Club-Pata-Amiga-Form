// ============================================
// Script de Redirección Post-Login v4 - Versión Mejorada
// CORREGIDO: Manejo robusto de eventos Memberstack
// SOBRE: Agrega soporte para rol de Centro del Bienestar
// ============================================

(function () {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const GLOBAL_CONFIG = window.PATA_AMIGA_CONFIG || {};
    
    const CONFIG = {
        apiUrl: (GLOBAL_CONFIG.apiUrl || 'https://app.pataamiga.mx') + '/api',
        dashboards: GLOBAL_CONFIG.dashboards || {
            member: 'https://www.pataamiga.mx/pets/pet-waiting-period',
            ambassador: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar',
            admin: 'https://app.pataamiga.mx/admin/dashboard',
            wellness_center: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar'
        },
        debug: true
    };

    const logger = {
        log: (...args) => CONFIG.debug && console.log('[LoginRedirect-V4]', ...args),
        error: (...args) => CONFIG.debug && console.error('[LoginRedirect-V4]', ...args)
    };

    logger.log('Script de redirección v4 inicializado');

    // ============================================
    // VARIABLES DE ESTADO
    // ============================================
    let isProcessing = false;
    let lastMemberId = null;

    // ============================================
    // VERIFICAR ROL Y REDIRIGIR
    // ============================================
    async function checkRoleAndRedirect(member) {
        if (!member || !member.id) {
            logger.log('No hay sesión válida');
            hideLoadingMessage();
            return false;
        }

        // Evitar procesar el mismo miembro múltiples veces
        if (lastMemberId === member.id) {
            logger.log('Miembro ya procesado, ignorando');
            return false;
        }
        lastMemberId = member.id;

        logger.log('Verificando rol para:', member.auth?.email);
        logger.log('Memberstack ID completo:', member);
        showLoadingMessage('Verificando tu cuenta...');

        try {
            const response = await fetch(`${CONFIG.apiUrl}/auth/check-role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ memberstackId: member.id })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            logger.log('Respuesta de API:', data);

            if (!data.success) throw new Error('API error');

            logger.log('Rol detectado:', data.role);

            // Determinar URL con validación robusta
            let redirectUrl;
            const dashboards = CONFIG.dashboards;
            
            logger.log('Dashboards disponibles:', dashboards);

            // URLs por defecto si el objeto está corrupto
            const DEFAULT_URLS = {
                wellness_center: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar',
                member: 'https://www.pataamiga.mx/pets/pet-waiting-period',
                ambassador: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar',
                admin: 'https://app.pataamiga.mx/admin/dashboard'
            };

            switch (data.role) {
                case 'admin':
                    redirectUrl = dashboards?.admin || DEFAULT_URLS.admin;
                    break;
                case 'ambassador':
                    redirectUrl = dashboards?.ambassador || DEFAULT_URLS.ambassador;
                    break;
                case 'wellness_center':
                case 'wellness-center':
                    redirectUrl = dashboards?.wellness_center || DEFAULT_URLS.wellness_center;
                    logger.log('Usuario con rol de Centro del Bienestar, redirigiendo a dashboard específico');
                    break;
                case 'pending_payment':
                    redirectUrl = dashboards?.member || DEFAULT_URLS.member;
                    logger.log('Usuario sin plan activo, redirigiendo a dashboard (MODO PRUEBA)');
                    break;
                case 'payment_processing':
                    redirectUrl = 'https://app.pataamiga.mx/payment-processing';
                    logger.log('Pago en proceso, redirigiendo a página de espera');
                    break;
                case 'incomplete_profile':
                    redirectUrl = data.redirectUrl || 'https://www.pataamiga.mx/miembros/completar-perfil';
                    logger.log('Perfil incompleto, redirigiendo a completar registro');
                    break;
                case 'member':
                default:
                    redirectUrl = dashboards?.member || DEFAULT_URLS.member;
                    break;
            }

            // Validación final de URL
            if (!redirectUrl || typeof redirectUrl !== 'string' || redirectUrl.trim() === '') {
                logger.error('URL de redirección inválida:', redirectUrl);
                redirectUrl = DEFAULT_URLS.wellness_center; // Por defecto wellness center
            }

            // Limpiar la URL
            redirectUrl = redirectUrl.trim();
            
            logger.log('URL final de redirección:', redirectUrl);
            showLoadingMessage('¡Bienvenido! Redirigiendo...');

            // Redirigir
            setTimeout(() => {
                logger.log('Redirigiendo a:', redirectUrl);
                if (redirectUrl && redirectUrl !== 'undefined') {
                    window.location.href = redirectUrl;
                } else {
                    logger.error('URL de redirección es "undefined", usando fallback');
                    window.location.href = DEFAULT_URLS.wellness_center;
                }
            }, 500);

            return true;

        } catch (error) {
            logger.error('Error verificando rol:', error);
            hideLoadingMessage();
            return false;
        }
    }

    // ============================================
    // POLLING DE SESIÓN
    // ============================================
    async function pollForSession(maxAttempts = 30, interval = 500) {
        logger.log('Iniciando polling de sesión...');

        for (let i = 0; i < maxAttempts; i++) {
            if (isProcessing) {
                logger.log('Ya procesando, esperando...');
                await new Promise(r => setTimeout(r, interval));
                continue;
            }

            try {
                const member = await window.$memberstackDom.getCurrentMember();
                logger.log(`Intento ${i + 1}:`, member?.data?.id ? 'Sesión encontrada' : 'Sin sesión');

                if (member && member.data && member.data.id) {
                    isProcessing = true;
                    const success = await checkRoleAndRedirect(member.data);
                    if (success) return true;
                    isProcessing = false;
                }
            } catch (e) {
                logger.error('Error en polling:', e);
            }

            await new Promise(r => setTimeout(r, interval));
        }

        logger.log('Polling terminado sin encontrar sesión');
        hideLoadingMessage();
        return false;
    }

    // ============================================
    // MANEJAR EVENTO DE LOGIN
    // ============================================
    function handleLoginEvent(event) {
        logger.log('Evento recibido:', event);

        // El evento puede venir de diferentes formas
        const eventType = event?.type || event;

        logger.log('Tipo de evento:', eventType);

        if (eventType === 'login' || eventType === 'signup' || eventType === 'authenticated') {
            logger.log('Evento de autenticación detectado, iniciando polling...');
            showLoadingMessage('Iniciando sesión...');
            pollForSession(20, 400); // 20 intentos, 400ms = 8 segundos
        }
    }

    // ============================================
    // UI HELPERS
    // ============================================
    function showLoadingMessage(text) {
        let el = document.getElementById('login-redirect-message');

        if (!el) {
            el = document.createElement('div');
            el.id = 'login-redirect-message';
            el.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 40px 60px;
                border-radius: 15px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                z-index: 99999;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 300px;
            `;
            document.body.appendChild(el);
        }

        el.innerHTML = `
            <div style="
                width: 50px;
                height: 50px;
                border: 5px solid #e0e0e0;
                border-top-color: #00BBB4;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <p style="margin: 0; color: #333; font-size: 18px; font-weight: 500;">${text}</p>
            <style> @keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
        el.style.display = 'block';
    }

    function hideLoadingMessage() {
        const el = document.getElementById('login-redirect-message');
        if (el) el.style.display = 'none';
    }

    // ============================================
    // INICIALIZAR
    // ============================================
    function init() {
        logger.log('=== Inicializando Login Redirect v4 ===');

        if (!window.$memberstackDom) {
            logger.error('Memberstack no encontrado');
            return;
        }

        // ===== MÉTODO 1: Escuchar eventos =====
        logger.log('Configurando listener de auth...');

        window.$memberstackDom.onAuthChange(function (event) {
            logger.log('onAuthChange disparado:', JSON.stringify(event));
            handleLoginEvent(event);
        });

        // ===== MÉTODO 2: Detectar cambios en el DOM =====
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    logger.log('Cambio en DOM detectado, verificando sesión...');
                    setTimeout(() => {
                        window.$memberstackDom.getCurrentMember().then(member => {
                            if (member && member.data && !isProcessing) {
                                handleLoginEvent({ type: 'dom-change' });
                            }
                        });
                    }, 500);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // ===== MÉTODO 3: Verificar al cargar =====
        setTimeout(() => {
            window.$memberstackDom.getCurrentMember().then(member => {
                if (member && member.data) {
                    const currentPath = window.location.pathname;
                    const isLoginPage = currentPath.includes('inicio-de-sesion') ||
                        currentPath.includes('login');

                    if (isLoginPage) {
                        logger.log('Usuario logueado detectado al cargar, redirigiendo...');
                        checkRoleAndRedirect(member.data);
                    }
                }
            });
        }, 1000);

        logger.log('=== Inicialización completa ===');
    }

    // ============================================
    // ARRANCAR
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Script para manejar parámetros de URL
(function() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
        const banner = document.createElement('div');
        banner.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #2e7d32, #43a047);
                color: white;
                padding: 16px 32px;
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                z-index: 99999;
                font-family: 'Outfit', sans-serif;
                font-size: 1rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideDown 0.5s ease;
                max-width: 90vw;
            ">
                🎉 ¡Pago exitoso! Inicia sesión para acceder a tu cuenta.
                <button onclick="this.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: 8px;
                    opacity: 0.8;
                ">✕</button>
            </div>
            <style>
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            </style>
        `;
        document.body.appendChild(banner);
        // Auto-hide after 8 seconds
        setTimeout(() => banner.remove(), 8000);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }
})();
