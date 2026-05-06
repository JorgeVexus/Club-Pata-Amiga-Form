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

        @media (max-width: 600px) {
            .pata-settings-title { font-size: 36px; }
            .pata-settings-subtitle { font-size: 16px; }
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
            div.id = 'pata-settings-widget';
            
            // Buscar un contenedor específico o añadir al body
            const target = document.querySelector('[data-pata-widget="settings"]') || document.body;
            target.appendChild(div);
            this.container = div;
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
                        ${this.renderItem('Cambiar contraseña', 'key', () => this.openPasswordModal())}
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
                    <h2 class="pata-section-title">Cuenta</h2>
                    <p class="pata-section-subtitle">Esta acción afecta permanentemente tu acceso a la plataforma.</p>
                    <button class="pata-btn-deactivate" id="pata-btn-deactivate">
                        ${ICONS.xCircle}
                        Desactivar cuenta
                    </button>
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
                    if (actionKey === 'key') this.openPasswordModal();
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
        }

        openPasswordModal() {
            if (window.$memberstackDom) {
                window.$memberstackDom.openModal("profile");
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
