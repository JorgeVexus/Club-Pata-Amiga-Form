/**
 * 📣 Club Pata Amiga - Referral Tracker
 * 
 * Este script captura códigos de referido de la URL y los guarda en localStorage.
 * También se integra con Memberstack para registrar el referido cuando un usuario se registra.
 * 
 * USO EN WEBFLOW:
 * 1. Agregar este script en el <head> de las páginas donde se usan códigos de referido
 * 2. El código se captura automáticamente de URLs como: /registro?ref=PATA123
 * 
 * <script src="https://app.pataamiga.mx/widgets/referral-tracker.js"></script>
 */

(function () {
    'use strict';

    const CONFIG = {
        API_BASE_URL: 'https://app.pataamiga.mx',
        STORAGE_KEY: 'pata_referral_code',
        EXPIRY_DAYS: 30, // Cuántos días mantener el código guardado
        URL_PARAMS: ['ref', 'referral', 'code', 'embajador'] // Parámetros de URL que buscamos
    };

    // ============================================
    // FUNCIONES DE ALMACENAMIENTO
    // ============================================

    function saveReferralCode(code) {
        if (!code) return;

        const data = {
            code: code.toUpperCase(),
            savedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        console.log('🐾 Código de referido guardado:', code);
    }

    function getReferralCode() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!stored) return null;

            const data = JSON.parse(stored);

            // Verificar si expiró
            if (new Date(data.expiresAt) < new Date()) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                console.log('🐾 Código de referido expirado, eliminado');
                return null;
            }

            return data.code;
        } catch (e) {
            console.error('Error leyendo código de referido:', e);
            return null;
        }
    }

    function clearReferralCode() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        console.log('🐾 Código de referido eliminado');
    }

    // ============================================
    // CAPTURA DE CÓDIGO DE URL
    // ============================================

    function captureReferralFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        for (const param of CONFIG.URL_PARAMS) {
            const code = urlParams.get(param);
            if (code) {
                saveReferralCode(code);
                return code;
            }
        }

        return null;
    }

    // ============================================
    // VALIDACIÓN DE CÓDIGO
    // ============================================

    async function validateReferralCode(code) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/referrals/validate-code?code=${encodeURIComponent(code)}`);
            const data = await response.json();
            return data.success && data.valid;
        } catch (error) {
            console.error('Error validando código:', error);
            return false;
        }
    }

    // ============================================
    // REGISTRO DE REFERIDO
    // ============================================

    async function registerReferral(memberData) {
        const referralCode = getReferralCode();

        if (!referralCode) {
            console.log('🐾 No hay código de referido guardado');
            return null;
        }

        if (!memberData.id) {
            console.error('🐾 Falta el ID del miembro');
            return null;
        }

        try {
            console.log('🐾 Registrando referido con código:', referralCode);

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/referrals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    referral_code: referralCode,
                    referred_user_id: memberData.id,
                    referred_user_name: memberData.name || `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim(),
                    referred_user_email: memberData.email,
                    membership_plan: memberData.planName || 'pending',
                    membership_amount: memberData.planAmount || 0
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('🐾 ✅ Referido registrado exitosamente');
                clearReferralCode(); // Limpiar después de usar
                return data;
            } else {
                console.log('🐾 ⚠️ Error registrando referido:', data.error);
                return null;
            }
        } catch (error) {
            console.error('🐾 ❌ Error en registerReferral:', error);
            return null;
        }
    }

    // ============================================
    // INTEGRACIÓN CON MEMBERSTACK
    // ============================================

    function setupMemberstackIntegration() {
        // Esperar a que Memberstack esté disponible
        const checkMemberstack = setInterval(() => {
            if (window.$memberstackDom) {
                clearInterval(checkMemberstack);
                initMemberstackHooks();
            }
        }, 100);

        // Timeout después de 10 segundos
        setTimeout(() => clearInterval(checkMemberstack), 10000);
    }

    function initMemberstackHooks() {
        console.log('🐾 Memberstack detectado, configurando hooks...');

        // Hook para cuando un usuario se registra
        window.$memberstackDom.onAuthChange((auth) => {
            if (auth?.member) {
                const member = auth.member;

                // Solo registrar si tiene un código de referido guardado
                const referralCode = getReferralCode();
                if (referralCode) {
                    // Pequeño delay para asegurar que el registro esté completo
                    setTimeout(() => {
                        registerReferral({
                            id: member.id,
                            email: member.auth?.email,
                            firstName: member.customFields?.['first-name'],
                            lastName: member.customFields?.['paternal-last-name'],
                            name: `${member.customFields?.['first-name'] || ''} ${member.customFields?.['paternal-last-name'] || ''}`.trim()
                        });
                    }, 2000);
                }
            }
        });
    }

    // ============================================
    // EXPONER API GLOBAL
    // ============================================

    window.PataReferral = {
        getCode: getReferralCode,
        setCode: saveReferralCode,
        clearCode: clearReferralCode,
        validateCode: validateReferralCode,
        registerReferral: registerReferral,

        // Mostrar badge si hay código activo
        showBadge: function (containerId) {
            const code = getReferralCode();
            if (!code) return;

            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #15BEB2, #00A89D);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 15px rgba(21, 190, 178, 0.3);
                ">
                    <span>🎁</span>
                    <span>Código aplicado: <strong>${code}</strong></span>
                </div>
            `;
        }
    };

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    function init() {
        console.log('🐾 Referral Tracker iniciado');

        // 1. Capturar código de la URL si existe
        const urlCode = captureReferralFromURL();

        // 2. Mostrar código guardado (si existe)
        const savedCode = getReferralCode();
        if (savedCode) {
            console.log('🐾 Código de referido activo:', savedCode);
        }

        // 3. Configurar integración con Memberstack
        setupMemberstackIntegration();
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
