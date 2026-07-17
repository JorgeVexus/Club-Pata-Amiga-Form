/**
 * 🎯 Club Pata Amiga — ambassador-menu-visibility.js
 *
 * Controla la visibilidad del enlace/dropdown de Embajadores (#embajadores)
 * en el menú de Webflow. El elemento debe estar en "display: none" por
 * defecto en el Designer.
 *
 * Se muestra solo si hay una sesión de Memberstack activa Y ese miembro
 * tiene un registro de embajador (sin importar su estado: pendiente,
 * aprobado o rechazado — en cualquier caso deben poder ver su dashboard,
 * que ya muestra la pantalla correspondiente a cada estado).
 *
 * USO EN WEBFLOW:
 * 1. En Project Settings → Custom Code → Footer Code, pega:
 *    <script src="https://app.pataamiga.mx/widgets/ambassador-menu-visibility.js"></script>
 * 2. En el Designer, selecciona el elemento con ID "embajadores" y ponle
 *    display: none por defecto.
 */

(function () {
    'use strict';

    console.log('🎯 [Embajadores Visibilidad] Script cargado e inicializado.');

    const DEFAULT_CONFIG = {
        apiUrl: 'https://app.pataamiga.mx'
    };

    const CONFIG = {};
    const customConfig = window.PATA_AMIGA_CONFIG || {};
    Object.keys(DEFAULT_CONFIG).forEach(function (key) {
        CONFIG[key] = customConfig[key] !== undefined ? customConfig[key] : DEFAULT_CONFIG[key];
    });

    async function checkAmbassadorMenuAccess() {
        console.log('🎯 [Embajadores Visibilidad] Iniciando validación de sesión de miembro.');
        try {
            if (!window.$memberstackDom) {
                console.error('❌ [Embajadores Visibilidad] Memberstack DOM no se encuentra disponible.');
                return;
            }

            const memberObj = await window.$memberstackDom.getCurrentMember();
            console.log('🎯 [Embajadores Visibilidad] Respuesta de getCurrentMember:', memberObj);

            const member = (memberObj && memberObj.data) || memberObj;
            if (!member || !member.id) {
                console.log('ℹ️ [Embajadores Visibilidad] Sin sesión activa en Memberstack (usuario no logueado).');
                return;
            }

            const fetchUrl = CONFIG.apiUrl + '/api/ambassadors/by-memberstack?memberstackId=' + encodeURIComponent(member.id);
            const memberToken = await Promise.resolve(window.$memberstackDom.getMemberCookie());
            console.log('🎯 [Embajadores Visibilidad] Consultando: ' + fetchUrl);

            const res = await fetch(fetchUrl, { headers: { Authorization: 'Bearer ' + memberToken } });
            const data = await res.json();
            console.log('🎯 [Embajadores Visibilidad] Datos recibidos:', data);

            const isAmbassador = !!(data && data.success && data.data);

            if (isAmbassador) {
                console.log('🎯 [Embajadores Visibilidad] El miembro SÍ tiene registro de embajador (status: ' + data.data.status + ').');
                const elements = document.querySelectorAll('#embajadores, .embajadores, [id="embajadores"]');

                if (elements.length > 0) {
                    console.log('✅ [Embajadores Visibilidad] Mostrando ' + elements.length + ' elemento(s).');
                    elements.forEach(function (el) {
                        el.style.setProperty('display', 'flex', 'important');
                    });
                } else {
                    console.warn('⚠️ [Embajadores Visibilidad] No se encontró ningún elemento con ID "embajadores" en el DOM.');
                }
            } else {
                console.log('ℹ️ [Embajadores Visibilidad] El miembro no tiene registro de embajador. Permanece oculto.');
            }
        } catch (error) {
            console.error('❌ [Embajadores Visibilidad] Error durante la ejecución:', error);
        }
    }

    // Espera activa a la carga de Memberstack en el navegador
    function initLoader() {
        console.log('🎯 [Embajadores Visibilidad] Buscando $memberstackDom...');
        let attempts = 0;
        const interval = setInterval(function () {
            attempts++;
            if (window.$memberstackDom) {
                console.log('🎯 [Embajadores Visibilidad] $memberstackDom detectado en el intento #' + attempts + '.');
                clearInterval(interval);
                checkAmbassadorMenuAccess();
            } else if (attempts > 50) {
                clearInterval(interval);
                console.warn('⚠️ [Embajadores Visibilidad] Memberstack no se detectó después de 5 segundos.');
            }
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoader);
    } else {
        initLoader();
    }
})();
