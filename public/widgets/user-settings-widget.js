/**
 * ⚙️ Club Pata Amiga - User Settings Widget
 * 
 * Widget para la configuración de cuenta del usuario.
 * Sincroniza preferencias con Supabase y acciones con Memberstack.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        brandColor: '#7DD8D5',
        actionColor: '#FF0066', // Rosa/Rojo para desactivar cuenta
        textColor: '#2D3748',
        textLight: '#718096',
        bgLight: '#F7FAFC'
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        @font-face {
            font-family: 'Fraiche';
            src: url('https://uploads-ssl.webflow.com/64b5687796068e860950337c/64b56b3e96068e860953a2a6_Fraiche.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }

        .pata-settings-widget {
            font-family: 'Outfit', sans-serif;
            color: ${CONFIG.textColor};
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: transparent; /* Fondo transparente solicitado */
            display: none; 
        }

        .pata-settings-widget.show {
            display: block;
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .pata-settings-header {
            margin-bottom: 40px;
        }

        .pata-settings-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 48px;
            margin: 0 0 10px 0;
            line-height: 1.1;
            color: #000;
        }

        .pata-settings-subtitle {
            font-size: 18px;
            color: ${CONFIG.textLight};
            line-height: 1.4;
        }

        .pata-settings-container {
            max-width: 600px;
            margin: 0 auto;
            background: transparent;
            border-radius: 50px;
            padding: 40px;
            font-family: 'Outfit', sans-serif;
            color: ${CONFIG.textColor};
            position: relative;
        }

        .pata-settings-section {
            margin-bottom: 35px;
            background: #FFFFFF;
            border-radius: 30px;
            padding: 30px;
            border: 1px solid #EDF2F7;
        }

        .pata-section-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #1A202C;
        }

        .pata-section-subtitle {
            font-size: 14px;
            color: ${CONFIG.textLight};
            margin-bottom: 25px;
        }

        .pata-settings-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-settings-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: #FFFFFF;
            border-radius: 20px;
            transition: all 0.2s ease;
            cursor: pointer;
            border: 1px solid transparent;
        }

        .pata-settings-item:hover {
            background: ${CONFIG.bgLight};
            transform: translateX(5px);
        }

        .pata-item-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .pata-item-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${CONFIG.textColor};
        }

        .pata-item-label {
            font-size: 16px;
            font-weight: 500;
            color: #4A5568;
        }

        .pata-item-right {
            display: flex;
            align-items: center;
        }

        .pata-chevron {
            width: 20px;
            height: 20px;
            color: #CBD5E0;
        }

        /* Toggles */
        .pata-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }

        .pata-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .pata-slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #E2E8F0;
            transition: .4s;
            border-radius: 34px;
        }

        .pata-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }

        input:checked + .pata-slider {
            background-color: ${CONFIG.brandColor};
        }

        input:checked + .pata-slider:before {
            transform: translateX(20px);
        }

        /* Account Section */
        .pata-btn-deactivate {
            width: 100%;
            background: ${CONFIG.actionColor};
            color: #FFFFFF;
            padding: 18px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s ease;
        }

        .pata-btn-deactivate:hover {
            opacity: 0.9;
            transform: scale(0.98);
        }

        .pata-badge-soon {
            font-size: 10px;
            background: #EDF2F7;
            color: #718096;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 8px;
            text-transform: uppercase;
            font-weight: 800;
        }

        /* Modal Custom */
        .pata-custom-modal {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
        }
        .pata-custom-modal.show {
            display: flex;
            animation: fadeIn 0.2s ease-out;
        }
        .pata-modal-content {
            background: #FFFFFF;
            border-radius: 30px;
            padding: 40px;
            width: 90%;
            max-width: 400px;
            position: relative;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            animation: modalSlideIn 0.3s ease-out;
            box-sizing: border-box;
        }
        @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .pata-modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #A0AEC0;
            transition: color 0.2s;
        }
        .pata-modal-close:hover {
            color: #2D3748;
        }
        .pata-modal-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 28px;
            margin: 0 0 25px 0;
            color: #1A202C;
            line-height: 1.1;
        }
        .pata-form-group {
            margin-bottom: 20px;
        }
        .pata-label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #4A5568;
        }
        .pata-input {
            width: 100%;
            padding: 14px 20px;
            border-radius: 50px;
            border: 2px solid #EDF2F7;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            outline: none;
            transition: all 0.2s;
            box-sizing: border-box;
        }
        .pata-input:focus {
            border-color: #7DD8D5;
        }
        .pata-btn-submit {
            width: 100%;
            background: #FE8F15;
            color: #FFFFFF;
            padding: 16px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            border: 2px solid #000;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Fraiche', sans-serif;
            margin-top: 10px;
        }
        .pata-btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000;
        }
        .pata-btn-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        @media (max-width: 600px) {
            .pata-settings-title { font-size: 36px; }
            .pata-settings-subtitle { font-size: 16px; }
            .pata-modal-content { padding: 30px; }
        }
    `;

    const ICONS = {
        key: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>`,
        activity: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        devices: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
        mail: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
        whatsapp: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 4.5l-2.1 4.6Z"/><path d="M16 10l-2 2-2-2"/></svg>`,
        bell: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
        payment: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
        news: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
        shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        doc: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        house: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        image: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        chevron: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
        xCircle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    };

    class UserSettingsWidget {
        constructor() {
            this.container = null;
            this.member = null;
            this.preferences = {
                notif_email: true,
                notif_whatsapp: true,
                notif_alerts: true,
                notif_payments: true,
                notif_news: true
            };
            this.init();
        }

        async init() {
            this.injectStyles();
            this.createContainer();
            await this.loadMember();
            if (this.member) {
                await this.loadPreferences();
                this.render();
            } else {
                this.renderNoSession();
            }
        }

        injectStyles() {
            const styleTag = document.createElement('style');
            styleTag.innerHTML = STYLES;
            document.head.appendChild(styleTag);
        }

        createContainer() {
            const div = document.createElement('div');
            div.className = 'pata-settings-widget';
            div.id = 'pata-settings-widget-inner';
            
            // Intentar encontrar el contenedor por ID (más fiable en Webflow) o atributo
            const findTarget = () => {
                return document.getElementById('pata-settings') || 
                       document.querySelector('[data-pata-widget="settings"]');
            };

            let target = findTarget();

            if (target) {
                target.appendChild(div);
                this.container = div;
            } else {
                console.warn('⚠️ [SETTINGS] No se encontró contenedor (#pata-settings). Usando fallback al body.');
                // Intentar de nuevo tras un pequeño delay por si Webflow es lento cargando el DOM
                setTimeout(() => {
                    target = findTarget();
                    if (target) {
                        target.appendChild(div);
                        this.container = div;
                        if (this.member) this.render();
                    } else {
                        document.body.appendChild(div);
                        this.container = div;
                    }
                }, 1000);
            }
        }

        async loadMember() {
            return new Promise((resolve) => {
                if (window.$memberstackDom) {
                    window.$memberstackDom.getCurrentMember().then(({ data }) => {
                        if (data) {
                            this.member = data;
                            console.log('👤 [SETTINGS] Miembro cargado:', data.auth.email);
                        } else {
                            console.warn('⚠️ [SETTINGS] No hay sesión de Memberstack');
                        }
                        resolve(data);
                    });
                } else {
                    console.error('❌ [SETTINGS] Memberstack no está cargado');
                    resolve(null);
                }
            });
        }

        async loadPreferences() {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/user/preferences?memberstackId=${this.member.id}`);
                const data = await response.json();
                if (data.success) {
                    this.preferences = data.preferences;
                }
            } catch (error) {
                console.error('❌ [SETTINGS] Error cargando preferencias:', error);
            }
        }

        async savePreference(key, value) {
            this.preferences[key] = value;
            try {
                await fetch(`${CONFIG.apiUrl}/api/user/preferences`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberstackId: this.member.id,
                        preferences: this.preferences
                    })
                });
            } catch (error) {
                console.error('❌ [SETTINGS] Error guardando preferencia:', error);
            }
        }

        render() {
            this.container.innerHTML = `
                <div class="pata-settings-header">
                    <h1 class="pata-settings-title">Centro de configuración</h1>
                    <p class="pata-settings-subtitle">Personaliza datos, accesos y detalles de tu cuenta de manera sencilla y segura.</p>
                </div>

                <!-- Seguridad y acceso -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Seguridad y acceso</h2>
                    <p class="pata-section-subtitle">Mantén protegida tu cuenta administrando tus accesos</p>
                    <div class="pata-settings-list">
                        ${this.renderItem('Cambiar contraseña', 'key', () => this.handleSecurityChange())}
                        ${this.renderItem('Actividad de inicio de sesión', 'activity', null, true)}
                        ${this.renderItem('Cerrar sesión en otros dispositivos', 'devices', null, true)}
                    </div>
                </div>

                <!-- Notificaciones -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Notificaciones</h2>
                    <p class="pata-section-subtitle">Elige cómo quieres que te avisemos</p>
                    <div class="pata-settings-list">
                        ${this.renderToggle('Recibir correo electrónicos', 'mail', 'notif_email')}
                        ${this.renderToggle('Notificaciones por WhatsApp', 'whatsapp', 'notif_whatsapp')}
                        ${this.renderToggle('Alertas de tus solicitudes', 'bell', 'notif_alerts')}
                        ${this.renderToggle('Recordatorio de pagos', 'payment', 'notif_payments')}
                        ${this.renderToggle('Noticias del club', 'news', 'notif_news')}
                    </div>
                </div>

                <!-- Legal -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Legal</h2>
                    <p class="pata-section-subtitle">Última actualización visible en cada documento.</p>
                    <div class="pata-settings-list">
                        ${this.renderItem('Aviso de privacidad', 'shield', () => window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61adc0bfbb17c833501_AVISO%20DE%20PRIVACIDAD%20INTEGRAL.pdf', '_blank'))}
                        ${this.renderItem('Términos y condiciones', 'doc', () => window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b14873e67fb7f89b1_Terminosycondiciones%20girbaz.pdf', '_blank'))}
                        ${this.renderItem('Políticas del fondo solidario', 'house', () => window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b8bccea76df450705_REGLAMENTO%20DEL%20FONDO%20SOLIDARIO%20CLUB%20PATA%20AMIGA.zip', '_blank'))}
                        ${this.renderItem('Condiciones de membresía', 'image', () => window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b1b8d0a6dc9f79e5c_Conveio%20asociado%20.pdf', '_blank'))}
                    </div>
                </div>

                <!-- Cuenta -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Cuenta y suscripción</h2>
                    <p class="pata-section-subtitle">Administra tu suscripción o solicita la baja de la plataforma.</p>
                    <div class="pata-settings-list" style="margin-bottom: 20px;">
                        ${this.renderItem('Administrar suscripción', 'payment', null)}
                    </div>
                    <button class="pata-btn-deactivate" id="pata-btn-deactivate">
                        ${ICONS.xCircle}
                        Desactivar cuenta
                    </button>
                </div>

                <!-- Modal Custom para Contraseña -->
                <div class="pata-custom-modal" id="pata-password-modal">
                    <div class="pata-modal-content">
                        <button class="pata-modal-close" id="pata-close-password">×</button>
                        <h3 class="pata-modal-title">Cambiar contraseña</h3>
                        <form id="pata-password-form">
                            <div class="pata-form-group">
                                <label class="pata-label">Contraseña Actual</label>
                                <input type="password" id="pata-current-pwd" required class="pata-input" placeholder="••••••••">
                            </div>
                            <div class="pata-form-group">
                                <label class="pata-label">Nueva Contraseña</label>
                                <input type="password" id="pata-new-pwd" required class="pata-input" placeholder="••••••••">
                            </div>
                            <button type="submit" class="pata-btn-submit" id="pata-btn-pwd">Guardar Cambios</button>
                            <div id="pata-pwd-error" style="color: #E53E3E; margin-top: 15px; font-size: 14px; display: none; text-align: center;"></div>
                            <div id="pata-pwd-success" style="color: #38A169; margin-top: 15px; font-size: 14px; display: none; text-align: center; font-weight: bold;">¡Contraseña actualizada con éxito!</div>
                        </form>
                    </div>
                </div>
            `;

            this.container.classList.add('show');
            this.bindEvents();
        }

        renderNoSession() {
            this.container.innerHTML = `
                <div class="pata-settings-section" style="text-align: center; padding: 60px;">
                    <h2 class="pata-section-title">Inicia sesión</h2>
                    <p class="pata-section-subtitle">Debes estar conectado para ver tu configuración.</p>
                    <a href="/user/inicio-de-sesion" class="pata-btn-deactivate" style="background: ${CONFIG.brandColor}; text-decoration: none;">
                        Ir al Login
                    </a>
                </div>
            `;
            this.container.classList.add('show');
        }

        renderItem(label, iconKey, action, isSoon = false) {
            return `
                <div class="pata-settings-item" data-action="${iconKey}">
                    <div class="pata-item-left">
                        <div class="pata-item-icon">${ICONS[iconKey]}</div>
                        <span class="pata-item-label">${label} ${isSoon ? '<span class="pata-badge-soon">Muy pronto</span>' : ''}</span>
                    </div>
                    <div class="pata-item-right">
                        ${ICONS.chevron}
                    </div>
                </div>
            `;
        }

        renderToggle(label, iconKey, prefKey) {
            const isChecked = this.preferences[prefKey] ? 'checked' : '';
            return `
                <div class="pata-settings-item no-click">
                    <div class="pata-item-left">
                        <div class="pata-item-icon">${ICONS[iconKey]}</div>
                        <span class="pata-item-label">${label}</span>
                    </div>
                    <div class="pata-item-right">
                        <label class="pata-switch">
                            <input type="checkbox" data-pref="${prefKey}" ${isChecked}>
                            <span class="pata-slider"></span>
                        </label>
                    </div>
                </div>
            `;
        }

        bindEvents() {
            // Click en items normales
            this.container.querySelectorAll('.pata-settings-item:not(.no-click)').forEach(item => {
                item.addEventListener('click', () => {
                    const actionKey = item.getAttribute('data-action');
                    if (actionKey === 'key') this.handleSecurityChange();
                    if (actionKey === 'payment') this.handleManagePlan();
                    if (actionKey === 'shield') window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61adc0bfbb17c833501_AVISO%20DE%20PRIVACIDAD%20INTEGRAL.pdf', '_blank');
                    if (actionKey === 'doc') window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b14873e67fb7f89b1_Terminosycondiciones%20girbaz.pdf', '_blank');
                    if (actionKey === 'house') window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b8bccea76df450705_REGLAMENTO%20DEL%20FONDO%20SOLIDARIO%20CLUB%20PATA%20AMIGA.zip', '_blank');
                    if (actionKey === 'image') window.open('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b1b8d0a6dc9f79e5c_Conveio%20asociado%20.pdf', '_blank');
                });
            });

            // Cambios en toggles
            this.container.querySelectorAll('.pata-switch input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const prefKey = e.target.getAttribute('data-pref');
                    this.savePreference(prefKey, e.target.checked);
                });
            });

            // Desactivar cuenta
            const btnDeactivate = this.container.querySelector('#pata-btn-deactivate');
            if (btnDeactivate) {
                btnDeactivate.addEventListener('click', () => this.handleDeactivate());
            }

            // Password Modal Events
            const pwdModal = this.container.querySelector('#pata-password-modal');
            const closePwdBtn = this.container.querySelector('#pata-close-password');
            const pwdForm = this.container.querySelector('#pata-password-form');
            const pwdError = this.container.querySelector('#pata-pwd-error');
            const pwdSuccess = this.container.querySelector('#pata-pwd-success');
            const pwdBtn = this.container.querySelector('#pata-btn-pwd');

            if (closePwdBtn && pwdModal) {
                closePwdBtn.addEventListener('click', () => {
                    pwdModal.classList.remove('show');
                    if(pwdForm) pwdForm.reset();
                    if(pwdError) pwdError.style.display = 'none';
                    if(pwdSuccess) pwdSuccess.style.display = 'none';
                });
            }

            // Cerrar si hace clic fuera del modal
            if (pwdModal) {
                pwdModal.addEventListener('click', (e) => {
                    if (e.target === pwdModal) {
                        pwdModal.classList.remove('show');
                        if(pwdForm) pwdForm.reset();
                        if(pwdError) pwdError.style.display = 'none';
                        if(pwdSuccess) pwdSuccess.style.display = 'none';
                    }
                });
            }

            if (pwdForm) {
                pwdForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const currentPwd = this.container.querySelector('#pata-current-pwd').value;
                    const newPwd = this.container.querySelector('#pata-new-pwd').value;
                    
                    pwdBtn.textContent = 'Guardando...';
                    pwdBtn.disabled = true;
                    pwdError.style.display = 'none';
                    pwdSuccess.style.display = 'none';

                    try {
                        await window.$memberstackDom.updateMemberAuth({
                            oldPassword: currentPwd,
                            newPassword: newPwd
                        });
                        pwdSuccess.style.display = 'block';
                        pwdForm.reset();
                        setTimeout(() => {
                            pwdModal.classList.remove('show');
                            pwdSuccess.style.display = 'none';
                        }, 2000);
                    } catch (error) {
                        pwdError.textContent = error.message || 'Ocurrió un error al actualizar la contraseña.';
                        pwdError.style.display = 'block';
                    } finally {
                        pwdBtn.textContent = 'Guardar Cambios';
                        pwdBtn.disabled = false;
                    }
                });
            }
        }

        handleSecurityChange() {
            const pwdModal = this.container.querySelector('#pata-password-modal');
            if (pwdModal) {
                pwdModal.classList.add('show');
            }
        }

        handleManagePlan() {
            if (window.$memberstackDom) {
                window.$memberstackDom.launchStripeCustomerPortal().catch(err => {
                    console.error('❌ [SETTINGS] Error abriendo el portal de Stripe:', err);
                    alert('No pudimos abrir el portal de suscripción en este momento. Por favor, intenta de nuevo más tarde.');
                });
            } else {
                console.error('❌ [SETTINGS] Memberstack no está disponible');
            }
        }

        handleDeactivate() {
            if (confirm('¿Estás seguro de que deseas desactivar tu cuenta? Esta acción no se puede deshacer fácilmente.')) {
                alert('Tu solicitud ha sido enviada al equipo administrativo. Nos pondremos en contacto contigo pronto.');
                // Aquí se podría llamar a un API de baja
            }
        }
    }

    // Auto-inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new UserSettingsWidget());
    } else {
        new UserSettingsWidget();
    }

})();
