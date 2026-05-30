/**
 * 💰 Club Pata Amiga — solidarity-button-visibility.js
 * 
 * Este script controla la visibilidad del botón de acceso al Fondo Solidario (#fondo)
 * en el menú de Webflow. El botón debe estar en "display: none" por defecto.
 * 
 * Se activará/mostrará (display: block/inline-block) solo si el miembro con sesión
 * activa tiene al menos una mascota aprobada que haya cumplido su tiempo de espera.
 */

(function () {
    'use strict';

    console.log('🐾 [Fondo Visibilidad] Script cargado e inicializado.');

    // Configuración por defecto y custom de la app
    const DEFAULT_CONFIG = {
        apiUrl: 'https://app.pataamiga.mx'
    };

    const CONFIG = {};
    const customConfig = window.PATA_AMIGA_CONFIG || {};
    Object.keys(DEFAULT_CONFIG).forEach(key => {
        CONFIG[key] = customConfig[key] !== undefined ? customConfig[key] : DEFAULT_CONFIG[key];
    });

    // Lógica para calcular el tiempo de espera (Carencia) idéntica a unified-membership-widget.js
    function calculateCarencia(pet, msFields = {}) {
        const now = new Date();
        
        let start = now;
        if (pet.waiting_period_start) {
            const parsed = new Date(pet.waiting_period_start);
            if (!isNaN(parsed.getTime())) start = parsed;
        } else if (pet.created_at) {
            const parsed = new Date(pet.created_at);
            if (!isNaN(parsed.getTime())) start = parsed;
        }

        // Si ya viene la fecha final del backend, respetarla directamente
        if (pet.waiting_period_end) {
            const endDate = new Date(pet.waiting_period_end);
            if (!isNaN(endDate.getTime())) {
                const diffTime = endDate.getTime() - now.getTime();
                const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                const isWaiting = daysRemaining > 0;
                console.log(`   └─> [Carencia pet:${pet.name}] Usando waiting_period_end. Días restantes: ${daysRemaining}. Espera activa: ${isWaiting}`);
                return { daysRemaining, isWaiting };
            }
        }

        let totalDays = 180;

        const isTrue = (val) => val === true || val === 'true' || val === 1 || val === '1';
        const isAdopted = isTrue(pet.is_adopted) || isTrue(pet['is-adopted']) || isTrue(pet.isAdopted);
        const isMixed = isTrue(pet.is_mixed_breed) || isTrue(pet['is-mixed-breed']) || isTrue(pet.is_mixed) || isTrue(pet.isMixed);
        const hasAmbassadorCode = !!(pet.referral_code || pet.ambassador_code || (msFields && (msFields['referral-code'] || msFields['ambassador-code'])));

        if (pet.waiting_period_days) {
            const customDays = parseInt(pet.waiting_period_days);
            if (!isNaN(customDays)) totalDays = customDays;
        } else if (hasAmbassadorCode) {
            totalDays = 90;
        } else if (isAdopted) {
            totalDays = isMixed ? 120 : 150;
        }

        const diffTime = Math.max(0, now.getTime() - start.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, totalDays - daysPassed);
        const isWaiting = daysRemaining > 0;

        console.log(`   └─> [Carencia pet:${pet.name}] Calculado. Inicio: ${start.toISOString().split('T')[0]}, Total días carencia: ${totalDays}, Pasaron: ${daysPassed}, Restan: ${daysRemaining}. Espera activa: ${isWaiting}`);

        return { daysRemaining, isWaiting };
    }

    async function checkSolidarityAccess() {
        console.log('🐾 [Fondo Visibilidad] Iniciando validación de sesión de miembro.');
        try {
            if (!window.$memberstackDom) {
                console.error('❌ [Fondo Visibilidad] Memberstack DOM no se encuentra disponible.');
                return;
            }
            
            const memberObj = await window.$memberstackDom.getCurrentMember();
            console.log('🐾 [Fondo Visibilidad] Respuesta de getCurrentMember:', memberObj);

            const member = memberObj?.data || memberObj;
            if (!member || !member.id) {
                console.log('ℹ️ [Fondo Visibilidad] Sin sesión activa en Memberstack (usuario no logueado).');
                return;
            }

            const memberstackId = member.id;
            const fetchUrl = `${CONFIG.apiUrl}/api/user/pets?userId=${memberstackId}&t=${Date.now()}`;
            console.log(`🐾 [Fondo Visibilidad] Consultando API de mascotas: ${fetchUrl}`);

            const res = await fetch(fetchUrl);
            console.log('🐾 [Fondo Visibilidad] Estado de respuesta HTTP:', res.status);

            const data = await res.json();
            console.log('🐾 [Fondo Visibilidad] Datos recibidos de API:', data);

            if (!data.success || !data.pets || data.pets.length === 0) {
                console.log('ℹ️ [Fondo Visibilidad] El miembro no tiene mascotas registradas o API reportó fallo.');
                return;
            }

            console.log(`🐾 [Fondo Visibilidad] Evaluando carencia para ${data.pets.length} mascotas.`);

            const hasEligiblePet = data.pets.some(pet => {
                console.log(` 🐾 Evaluando mascota: ${pet.name} (Status: ${pet.status}, Activa: ${pet.is_active})`);
                
                // Debe estar aprobada y activa
                if (pet.status !== 'approved') {
                    console.log(`   └─> Mascota rechazada/pendiente (Status: ${pet.status}). No elegible.`);
                    return false;
                }
                if (pet.is_active === false) {
                    console.log(`   └─> Mascota inactiva (dada de baja). No elegible.`);
                    return false;
                }

                // Evaluar si ya completó su tiempo de espera
                const carencia = calculateCarencia(pet, member.customFields || {});
                return !carencia.isWaiting;
            });

            console.log('🐾 [Fondo Visibilidad] Resultado de evaluación de elegibilidad:', hasEligiblePet);

            if (hasEligiblePet) {
                // Buscamos elementos por ID 'fondo', por clase '.fondo' y por IDs duplicados
                const buttons = document.querySelectorAll('#fondo, .fondo, [id="fondo"]');
                
                if (buttons.length > 0) {
                    console.log(`✅ [Fondo Visibilidad] Mascota elegible encontrada. Mostrando ${buttons.length} elemento(s).`);
                    buttons.forEach(btn => {
                        btn.style.setProperty('display', 'block', 'important');
                    });
                } else {
                    console.warn('⚠️ [Fondo Visibilidad] Mascota elegible pero NO se encontró ningún botón o menú con ID "fondo" o clase ".fondo" en el DOM.');
                    
                    // Escáner de depuración del DOM para encontrar el botón/menú
                    console.log('🔍 [Fondo Visibilidad] Escaneando DOM para buscar elementos relacionados con "fondo" o "solidario"...');
                    const allElements = document.querySelectorAll('*');
                    const found = [];
                    allElements.forEach(el => {
                        const id = el.id || '';
                        const classes = el.className || '';
                        const text = el.textContent || '';

                        const matchesId = id.toLowerCase().includes('fondo');
                        const matchesClass = typeof classes === 'string' && classes.toLowerCase().includes('fondo');
                        const matchesText = (text.toLowerCase().includes('solidario') || text.toLowerCase().includes('apoyo')) && text.trim().length < 60;

                        if (matchesId || matchesClass || matchesText) {
                            found.push({
                                tagName: el.tagName,
                                id: el.id || '(sin id)',
                                classes: el.className || '(sin clases)',
                                text: text.trim().substring(0, 40)
                            });
                        }
                    });
                    console.log('🔍 [Fondo Visibilidad] Resultados de escaneo de depuración:', found);
                }
            } else {
                console.log('ℹ️ [Fondo Visibilidad] Ninguna mascota cumple las condiciones de tiempo de espera (carencia cumplida).');
            }
        } catch (error) {
            console.error('❌ [Fondo Visibilidad] Error durante la ejecución:', error);
        }
    }

    // Espera activa a la carga de Memberstack en el navegador
    function initLoader() {
        console.log('🐾 [Fondo Visibilidad] Buscando $memberstackDom...');
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.$memberstackDom) {
                console.log(`🐾 [Fondo Visibilidad] $memberstackDom detectado en el intento #${attempts}.`);
                clearInterval(interval);
                checkSolidarityAccess();
            } else if (attempts > 50) {
                clearInterval(interval);
                console.warn('⚠️ [Fondo Visibilidad] Memberstack no se detectó después de 5 segundos.');
            }
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoader);
    } else {
        initLoader();
    }
})();
