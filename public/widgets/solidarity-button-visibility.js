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
                return { daysRemaining, isWaiting: daysRemaining > 0 };
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

        return { daysRemaining, isWaiting: daysRemaining > 0 };
    }

    async function checkSolidarityAccess() {
        try {
            if (!window.$memberstackDom) return;
            
            const { data: member } = await window.$memberstackDom.getCurrentMember();
            if (!member || !member.id) {
                console.log('ℹ️ Visibilidad Fondo: Sin sesión activa en Memberstack.');
                return;
            }

            const memberstackId = member.id;
            const res = await fetch(`${CONFIG.apiUrl}/api/user/pets?userId=${memberstackId}&t=${Date.now()}`);
            const data = await res.json();

            if (!data.success || !data.pets || data.pets.length === 0) {
                console.log('ℹ️ Visibilidad Fondo: El miembro no tiene mascotas registradas.');
                return;
            }

            const hasEligiblePet = data.pets.some(pet => {
                // Debe estar aprobada y activa
                if (pet.status !== 'approved' || pet.is_active === false) {
                    return false;
                }

                // Evaluar si ya completó su tiempo de espera
                const carencia = calculateCarencia(pet, member.customFields || {});
                return !carencia.isWaiting;
            });

            if (hasEligiblePet) {
                console.log('✅ Visibilidad Fondo: Mascota con tiempo de espera cumplido detectada. Mostrando botón.');
                const button = document.getElementById('fondo');
                if (button) {
                    button.style.setProperty('display', 'block', 'important');
                } else {
                    console.warn('⚠️ Visibilidad Fondo: No se encontró el botón con ID "fondo".');
                }
            } else {
                console.log('ℹ️ Visibilidad Fondo: Ninguna mascota del usuario cumple el tiempo de espera.');
            }
        } catch (error) {
            console.error('❌ Error checking solidarity access:', error);
        }
    }

    // Espera activa a la carga de Memberstack en el navegador
    function initLoader() {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.$memberstackDom) {
                clearInterval(interval);
                checkSolidarityAccess();
            } else if (attempts > 50) {
                clearInterval(interval);
                console.warn('⚠️ Visibilidad Fondo: Memberstack no se detectó a tiempo.');
            }
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoader);
    } else {
        initLoader();
    }
})();
