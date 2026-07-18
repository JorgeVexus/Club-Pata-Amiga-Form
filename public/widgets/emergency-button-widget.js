/**
 * 🚨 Club Pata Amiga - Emergency Button Widget
 * 
 * Botón de emergencia para miembros con membresía activa.
 * - Solo visible para miembros con membresía pagada (aprobados)
 * - Click → Pop-up confirmación → Abre llamada telefónica
 * - Registra log en base de datos
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        emergencyPhone: '+525****5068', // 56 3954 5068 con código México +52
        brandColor: '#7DD8D5',
        dangerColor: '#E53E3E',
        textColor: '#2D3748',
        textLight: '#718096',
        bgLight: '#F7FAFC'
    };

    const isActiveLocalPreview = Boolean(
        window.PATA_AMIGA_CONFIG?.emergencyPreviewActive &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    );

    const ICONS = {
        phone: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
        alert: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        x: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face {
            font-family: 'Fraiche';
            src: url('https://uploads-ssl.webflow.com/64b5687796068e860950337c/64b56b3e96068e860953a2a6_Fraiche.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }

        .emergency-widget {
            font-family: 'Outfit', sans-serif;
            position: fixed;
            bottom: 30px;
            right: 30px;
            left: auto;
            z-index: 80;
            display: none;
        }

        .emergency-widget.show {
            display: block;
            animation: slideUp 0.35s cubic-bezier(.16,1,.3,1);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .emergency-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 22px;
            background: #EE3434;
            color: #FFFFFF;
            border: none;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 12px 28px rgba(185, 36, 36, 0.24);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            white-space: nowrap;
        }

        .emergency-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(185, 36, 36, 0.3);
        }

        .emergency-btn:active {
            transform: translateY(0) scale(0.98);
        }

        @keyframes pulse {
            0% { box-shadow: 0 8px 24px rgba(229, 62, 62, 0.4), 0 0 0 0 rgba(229, 62, 62, 0.4); }
            70% { box-shadow: 0 8px 24px rgba(229, 62, 62, 0.4), 0 0 0 16px rgba(229, 62, 62, 0); }
            100% { box-shadow: 0 8px 24px rgba(229, 62, 62, 0.4), 0 0 0 0 rgba(229, 62, 62, 0); }
        }

        .emergency-btn-icon {
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .emergency-btn-text {
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Modal Overlay */
        .emergency-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(18, 58, 55, 0.42);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            padding: 20px;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.2s ease-out;
        }

        .emergency-modal-overlay.show {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* Modal Content */
        .emergency-modal {
            background: #FFFFFF;
            border-radius: 24px;
            padding: 34px;
            width: 100%;
            max-width: 440px;
            position: relative;
            box-shadow: 0 24px 70px rgba(18,58,55,.24);
            animation: modalSlideIn 0.3s ease-out;
            box-sizing: border-box;
            border: 1px solid #EADFDC;
        }

        @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .emergency-modal-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 20px;
            background: #FFF0EF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            color: #D92F2F;
        }

        .emergency-modal-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 28px;
            margin: 0 0 12px;
            color: #174F4C;
            text-align: center;
            line-height: 1.2;
        }

        .emergency-modal-message {
            font-size: 16px;
            color: #657774;
            text-align: center;
            margin-bottom: 28px;
            line-height: 1.5;
        }

        .emergency-modal-phone {
            display: flex;
            width: fit-content;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 20px;
            background: #FEF2F2;
            border: 1px solid #F2CDCA;
            border-radius: 16px;
            color: #C72C2C;
            font-weight: 700;
            font-size: 18px;
            font-family: 'Outfit', sans-serif;
            margin: 0 auto 28px;
            text-decoration: none;
        }

        .emergency-modal-actions {
            display: flex;
            gap: 12px;
        }

        .emergency-modal-btn {
            flex: 1;
            padding: 16px 24px;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
            text-align: center;
            text-decoration: none;
        }

        .emergency-modal-btn-cancel {
            background: #FFFFFF;
            color: #2D3748;
            border-color: #E2E8F0;
        }

        .emergency-modal-btn-cancel:hover {
            background: #F7FAFC;
            border-color: #CBD5E0;
        }

        .emergency-modal-btn-confirm {
            background: #EE3434;
            color: #FFFFFF;
        }

        .emergency-modal-btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(185,36,36,.2);
        }

        @media (max-width: 767px) {
            .emergency-btn {
                display: none;
            }
            
            .emergency-modal {
                padding: 24px 20px;
                max-width: 92vw;
                border-radius: 24px;
            }
            
            .emergency-modal-icon {
                width: 60px;
                height: 60px;
                margin: 0 auto 16px;
                border-width: 2px;
            }
            
            .emergency-modal-title { 
                font-size: 22px; 
                margin-bottom: 10px;
            }
            
            .emergency-modal-message { 
                font-size: 15px; 
                line-height: 1.5;
                margin-bottom: 20px;
            }
            
            .emergency-modal-phone { 
                font-size: 17px; 
                padding: 14px 18px;
                gap: 8px;
            }
            
            .emergency-modal-actions {
                flex-direction: column;
                gap: 10px;
            }
            
            .emergency-modal-btn {
                padding: 14px 20px;
                font-size: 16px;
                border-radius: 14px;
                min-height: 48px;
            }
        }
    `;

    class EmergencyButtonWidget {
        constructor() {
            this.container = null;
            this.member = null;
            this.paymentMethod = null;
            this.modalOverlay = null;
            this.init();
        }

        async init() {
            this.injectStyles();
            this.createContainer();
            await this.loadMember();
            if (this.member) {
                await this.loadPaymentMethod();
                this.render();
            }
        }

        injectStyles() {
            if (document.getElementById('emergency-styles')) return;
            const styleTag = document.createElement('style');
            styleTag.id = 'emergency-styles';
            styleTag.innerHTML = STYLES;
            document.head.appendChild(styleTag);
        }

        createContainer() {
            const div = document.createElement('div');
            div.className = 'emergency-widget';
            div.id = 'emergency-widget-inner';
            document.body.appendChild(div);
            this.container = div;
        }

        async loadMember() {
            return new Promise(function(resolve) {
                if (isActiveLocalPreview) {
                    this.member = {
                        id: 'local-preview-user',
                        auth: { email: 'preview@pataamiga.mx' },
                        planConnections: [{ status: 'ACTIVE' }]
                    };
                    resolve(this.member);
                    return;
                }
                if (window.$memberstackDom) {
                    window.$memberstackDom.getCurrentMember().then(function(result) {
                        var data = result.data;
                        if (data) {
                            this.member = data;
                            console.log('🚨 [EMERGENCY] Miembro cargado:', data.auth.email);
                        } else {
                            console.warn('⚠️ [EMERGENCY] No hay sesión de Memberstack');
                        }
                        resolve(data);
                    }.bind(this));
                } else {
                    console.error('❌ [EMERGENCY] Memberstack no está cargado');
                    resolve(null);
                }
            }.bind(this));
        }

        async loadPaymentMethod() {
            try {
                console.log('💳 [EMERGENCY] Cargando método de pago para verificar membresía...');
                var response = await fetch(CONFIG.apiUrl + '/api/user/payment-method?memberstackId=' + this.member.id);
                var data = await response.json();
                if (data.success && data.paymentMethod) {
                    this.paymentMethod = data.paymentMethod;
                    console.log('💳 [EMERGENCY] Método de pago cargado, is_cancelled:', data.paymentMethod.is_cancelled);
                }
            } catch (error) {
                console.error('❌ [EMERGENCY] Error cargando método de pago:', error);
            }
        }

        isEligible() {
            // Solo mostrar si tiene membresía activa (pagada)
            // Si canceló pero su cobertura aún no expira, seguir mostrando
            if (!this.member) return false;
            
            // Verificar en Memberstack
            var planConnections = this.member.planConnections || [];
            var hasActivePlan = false;
            for (var i = 0; i < planConnections.length; i++) {
                var p = planConnections[i];
                if (p.status === 'ACTIVE' || p.status === 'TRIALING') {
                    hasActivePlan = true;
                    break;
                }
            }
            
            if (!hasActivePlan) return false;

            // Verificar en nuestra API (más preciso - detecta cancelaciones Stripe)
            if (this.paymentMethod && this.paymentMethod.is_cancelled === true) {
                // Si canceló pero su periodo pagado aún no termina, seguir mostrando
                var endDate = this.paymentMethod.membership_end_date;
                if (endDate) {
                    var coverageEnd = new Date(endDate);
                    var now = new Date();
                    if (coverageEnd > now) {
                        console.log('🚨 [EMERGENCY] Membresía cancelada pero cobertura vigente hasta:', endDate);
                        return true;
                    }
                }
                // Cobertura expirada o sin fecha de fin → no mostrar
                return false;
            }

            return true;
        }

        render() {
            if (!this.container) return;

            if (!this.isEligible()) {
                this.container.style.display = 'none';
                this.container.classList.remove('show');
                return;
            }

            this.container.innerHTML = '\n                <button class="emergency-btn" id="emergency-btn" aria-label="Llamar a emergencias">\n                    <span class="emergency-btn-icon">' + ICONS.phone + '</span>\n                    <span class="emergency-btn-text">Emergencia</span>\n                </button>\n\n                <!-- Modal de confirmación -->\n                <div class="emergency-modal-overlay" id="emergency-modal-overlay">\n                    <div class="emergency-modal">\n                        <div class="emergency-modal-icon">' + ICONS.alert + '</div>\n                        <h3 class="emergency-modal-title">¿Llamar a emergencias?</h3>\n                        <p class="emergency-modal-message">\n                            Se realizará una llamada directa al número de emergencias. \n                            ¿Estás seguro de que deseas continuar?\n                        </p>\n                        <a href="tel:+525639545068" class="emergency-modal-phone" id="emergency-phone-link">\n                            ' + ICONS.phone + ' +52 56 3954 5068\n                        </a>\n                        <div class="emergency-modal-actions">\n                            <button class="emergency-modal-btn emergency-modal-btn-cancel" id="emergency-btn-cancel">Cancelar</button>\n                            <a href="tel:+525639545068" class="emergency-modal-btn emergency-modal-btn-confirm" id="emergency-btn-confirm">Sí, llamar</a>\n                        </div>\n                    </div>\n                </div>\n            ';

            this.container.classList.add('show');
            var dialog = this.container.querySelector('.emergency-modal');
            if (dialog) {
                dialog.setAttribute('role', 'dialog');
                dialog.setAttribute('aria-modal', 'true');
                dialog.setAttribute('aria-labelledby', 'emergency-modal-title');
            }
            var title = this.container.querySelector('.emergency-modal-title');
            if (title) title.id = 'emergency-modal-title';
            this.bindEvents();
        }

        openModal() {
            if (!this.isEligible() || !this.container) return false;
            var modal = this.container.querySelector('#emergency-modal-overlay');
            if (!modal) return false;
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            return true;
        }

        closeModal() {
            var modal = this.container && this.container.querySelector('#emergency-modal-overlay');
            if (modal) modal.classList.remove('show');
            document.body.style.overflow = '';
        }

        bindEvents() {
            var btn = this.container.querySelector('#emergency-btn');
            var modal = this.container.querySelector('#emergency-modal-overlay');
            var cancelBtn = this.container.querySelector('#emergency-btn-cancel');
            var confirmBtn = this.container.querySelector('#emergency-btn-confirm');
            var phoneLink = this.container.querySelector('#emergency-phone-link');
            var self = this;

            if (btn && modal) {
                btn.addEventListener('click', function() {
                    self.openModal();
                });
            }

            var closeModal = function() {
                self.closeModal();
            };

            if (cancelBtn) {
                cancelBtn.addEventListener('click', closeModal);
            }

            // Cerrar al hacer click fuera del modal
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) closeModal();
                });
            }

            // El botón de confirmar y el enlace de teléfono son enlaces normales (href="tel:")
            // Si se hace click, se registra la emergencia ANTES de abrir la app de teléfono
            var handleConfirm = function() {
                // No prevenir el default - dejar que el href="tel:" funcione
                self.logEmergency();
                closeModal();
            };

            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleConfirm);
            }

            if (phoneLink) {
                phoneLink.addEventListener('click', handleConfirm);
            }

            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape' && modal && modal.classList.contains('show')) closeModal();
            });
        }

        logEmergency() {
            fetch(CONFIG.apiUrl + '/api/user/emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberstackId: this.member.id,
                    phoneNumber: '+525639545068'
                })
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success) {
                    console.log('✅ [EMERGENCY] Log registrado correctamente');
                } else {
                    console.error('❌ [EMERGENCY] Error registrando:', data.error);
                }
            })
            .catch(function(error) {
                console.error('❌ [EMERGENCY] Error de conexión:', error);
            });
        }
    }

    // Auto-inicialización
    var createEmergencyWidget = function() {
        if (window.PataEmergencyWidget) return window.PataEmergencyWidget;
        window.PataEmergencyWidget = new EmergencyButtonWidget();
        return window.PataEmergencyWidget;
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createEmergencyWidget);
    } else {
        createEmergencyWidget();
    }

})();
