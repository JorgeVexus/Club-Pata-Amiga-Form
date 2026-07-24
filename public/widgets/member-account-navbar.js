/** Shared primary V2 navigation for external Pata Amiga widgets. */
(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        dashboardUrl: window.PATA_AMIGA_CONFIG?.dashboardUrl || 'https://www.pataamiga.mx/miembros/dashboard',
        homeUrl: window.PATA_AMIGA_CONFIG?.homeUrl || 'https://www.pataamiga.mx/',
        myPackUrl: window.PATA_AMIGA_CONFIG?.myPackUrl || 'https://www.pataamiga.mx/pets/pet-waiting-period',
        profileUrl: window.PATA_AMIGA_CONFIG?.profileUrl || 'https://www.pataamiga.mx/miembros/perfil',
        settingsUrl: window.PATA_AMIGA_CONFIG?.settingsUrl || 'https://www.pataamiga.mx/miembros/configuracion',
        logoutUrl: window.PATA_AMIGA_CONFIG?.logoutRedirectUrl || 'https://www.pataamiga.mx/'
    };

    const ICONS = {
        back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
        gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M21 3v18h-6"/></svg>'
    };

    const STYLES = `
        .pata-account-navbar { width:min(1040px,calc(100% - 40px)); min-height:68px; margin:24px auto; padding:10px 12px 10px 16px; display:flex; align-items:center; justify-content:space-between; gap:18px; box-sizing:border-box; border:1px solid #e8e0d4; border-radius:20px; background:rgba(255,255,255,.94); box-shadow:0 8px 24px rgba(24,75,71,.06); color:#174f4c; font-family:'Outfit',sans-serif; position:relative; z-index:30; }
        .pata-account-navbar * { box-sizing:border-box; }
        .pata-account-logo img { width:92px; display:block; }
        .pata-account-nav-actions { display:flex; align-items:center; gap:8px; }
        .pata-account-my-pack-link { min-height:42px; display:flex; align-items:center; padding:0 16px; border-radius:999px; color:#174f4c; background:#e7f6f4; font-size:13px; font-weight:700; text-decoration:none; }
        .pata-account-icon-button { width:42px; height:42px; display:grid; place-items:center; border:0; border-radius:50%; background:#f3f0ea; color:#174f4c; cursor:pointer; position:relative; }
        .pata-account-icon-button svg { width:19px; height:19px; }
        .pata-account-icon-button:hover,.pata-account-my-pack-link:hover { background:#dff3f0; }
        .pata-account-notification-button { font-size:17px; line-height:1; }
        .pata-account-notifications,.pata-account-menu-wrap { position:relative; }
        .pata-account-badge { position:absolute; top:-3px; right:-3px; min-width:18px; height:18px; padding:0 4px; display:grid; place-items:center; border-radius:9px; background:#ee3434; color:#fff; font-size:10px; font-weight:800; }
        .pata-account-panel,.pata-account-menu { position:absolute; top:calc(100% + 10px); right:0; width:310px; overflow:hidden; border:1px solid #e8e0d4; border-radius:18px; background:#fff; box-shadow:0 18px 44px rgba(24,75,71,.16); }
        .pata-account-panel-head { padding:14px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #eee8df; }
        .pata-account-panel-head button { border:0; background:transparent; color:#168f89; font:700 12px 'Outfit',sans-serif; cursor:pointer; }
        .pata-account-notification { width:100%; display:block; padding:13px 16px; border:0; border-bottom:1px solid #f0ebe4; background:#fff; color:#315c59; text-align:left; cursor:pointer; }
        .pata-account-notification.is-unread { background:#eef9f7; }
        .pata-account-notification strong,.pata-account-notification span { display:block; }
        .pata-account-notification span,.pata-account-empty { color:#71817f; font-size:12px; line-height:1.4; }
        .pata-account-empty { padding:24px 16px; text-align:center; }
        .pata-account-menu { width:210px; padding:8px; }
        .pata-account-menu a,.pata-account-menu button { width:100%; min-height:42px; padding:10px 12px; display:flex; align-items:center; gap:10px; border:0; border-radius:12px; background:transparent; color:#315c59; font:700 14px 'Outfit',sans-serif; text-align:left; text-decoration:none; cursor:pointer; }
        .pata-account-menu svg { width:18px; height:18px; }
        .pata-account-menu a:hover,.pata-account-menu button:hover { background:#e7f6f4; }
        .pata-account-menu button { color:#b33838; }
        .pata-account-hamburger { width:18px; display:grid; gap:3px; }
        .pata-account-hamburger span { height:2px; border-radius:2px; background:currentColor; }
        @media (max-width:767px) {
            .pata-account-navbar { width:100%; min-height:62px; margin:0 0 18px; padding:10px 14px; border-width:0 0 1px; border-radius:0; box-shadow:none; }
            .pata-account-logo img { width:78px; }
            .pata-account-my-pack-link { display:none; }
            .pata-account-panel { position:fixed; top:64px; right:12px; width:min(310px,calc(100vw - 24px)); }
        }
    `;

    class MemberAccountNavbar {
        constructor() {
            this.member = null;
            this.role = null;
            this.items = [];
            this.notificationsOpen = false;
            this.menuOpen = false;
            this.loading = false;
            this.error = '';
            this.root = null;
        }

        async mount() {
            if (document.getElementById('pata-account-navbar')) return;
            const target = document.getElementById('pata-profile') || document.getElementById('pata-settings') || document.querySelector('[data-pata-widget="settings"]');
            if (!target) return;
            this.injectStyles();
            this.root = document.createElement('header');
            this.root.id = 'pata-account-navbar';
            target.parentNode.insertBefore(this.root, target);
            try { this.member = (await window.$memberstackDom?.getCurrentMember())?.data || null; } catch { this.member = null; }
            await this.loadRole();
            this.render();
            document.addEventListener('keydown', event => { if (event.key === 'Escape') this.closePopovers(); });
            document.addEventListener('click', event => { if (this.root && !this.root.contains(event.target)) this.closePopovers(); });
        }

        injectStyles() {
            if (document.getElementById('pata-account-navbar-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-account-navbar-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        escape(value) { const el = document.createElement('div'); el.textContent = String(value || ''); return el.innerHTML; }

        async loadRole() {
            if (!this.member?.id) {
                this.role = null;
                return null;
            }
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/auth/check-role`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberstackId: this.member.id })
                });
                const data = await response.json();
                this.role = response.ok && data.success ? data.role : null;
            } catch {
                this.role = null;
            }
            return this.role;
        }

        resolveDashboardUrl(role = this.role, roleData = {}) {
            const dashboards = window.PATA_AMIGA_CONFIG?.dashboards || {};
            const defaults = {
                member: CONFIG.myPackUrl,
                ambassador: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar',
                admin: 'https://app.pataamiga.mx/admin/dashboard',
                wellness_center: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar',
                incomplete_profile: 'https://www.pataamiga.mx/miembros/completar-perfil',
                payment_processing: 'https://app.pataamiga.mx/payment-processing'
            };

            switch (role) {
                case 'admin':
                    return dashboards.admin || defaults.admin;
                case 'ambassador':
                    return dashboards.ambassador || defaults.ambassador;
                case 'wellness_center':
                case 'wellness-center':
                    return dashboards.wellness_center || defaults.wellness_center;
                case 'incomplete_profile':
                    return roleData.redirectUrl || defaults.incomplete_profile;
                case 'payment_processing':
                    return defaults.payment_processing;
                case 'pending_payment':
                case 'member':
                default:
                    return dashboards.member || defaults.member;
            }
        }

        render() {
            if (!this.root) return;
            const unread = this.items.filter(item => !item.is_read).length;
            this.root.innerHTML = `<nav class="pata-account-navbar" aria-label="Navegación de cuenta">
                <a class="pata-account-logo" href="${CONFIG.homeUrl}" aria-label="Ir a Pata Amiga"><img src="${CONFIG.apiUrl}/widgets/home%20v2%20images/logo-light-bg.svg" alt="Pata Amiga"></a>
                <div class="pata-account-nav-actions">
                    ${this.role === 'member' ? `<a class="pata-account-my-pack-link" href="${CONFIG.myPackUrl}">Mi manada</a>` : ''}
                    <div class="pata-account-notifications">
                        <button class="pata-account-icon-button pata-account-notification-button" type="button" data-action="notifications" aria-label="Notificaciones" aria-expanded="${this.notificationsOpen}">🔔${unread ? `<span class="pata-account-badge">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
                        ${this.notificationsOpen ? this.renderNotifications() : ''}
                    </div>
                    <div class="pata-account-menu-wrap">
                        <button class="pata-account-icon-button" type="button" data-action="menu" aria-label="Abrir menú de cuenta" aria-expanded="${this.menuOpen}"><span class="pata-account-hamburger" aria-hidden="true"><span></span><span></span><span></span></span></button>
                        ${this.menuOpen ? `<div class="pata-account-menu" role="menu"><button type="button" data-action="silent-dashboard" role="menuitem">${ICONS.back}Volver al perfil</button><a href="${CONFIG.profileUrl}" role="menuitem">${ICONS.user}Perfil</a><a href="${CONFIG.settingsUrl}" role="menuitem">${ICONS.gear}Ajustes</a><button type="button" data-action="logout" role="menuitem">${ICONS.logout}Cerrar sesión</button></div>` : ''}
                    </div>
                </div>
            </nav>`;
            this.bind();
        }

        renderNotifications() {
            const list = this.loading ? '<div class="pata-account-empty">Cargando notificaciones...</div>' : this.error ? `<div class="pata-account-empty">${this.escape(this.error)}</div>` : this.items.length ? this.items.map(item => `<button class="pata-account-notification ${item.is_read ? '' : 'is-unread'}" type="button" data-notification-id="${this.escape(item.id)}"><strong>${this.escape(item.title || 'Actualización de tu cuenta')}</strong><span>${this.escape(item.message || '')}</span></button>`).join('') : '<div class="pata-account-empty">No tienes notificaciones nuevas.</div>';
            return `<div class="pata-account-panel" role="dialog" aria-label="Notificaciones"><div class="pata-account-panel-head"><strong>Notificaciones</strong>${this.items.some(item => !item.is_read) ? '<button type="button" data-action="read-all">Marcar leídas</button>' : ''}</div>${list}</div>`;
        }

        bind() {
            this.root.querySelector('[data-action="notifications"]')?.addEventListener('click', event => { event.stopPropagation(); this.notificationsOpen = !this.notificationsOpen; this.menuOpen = false; this.render(); if (this.notificationsOpen && !this.loading && !this.items.length) this.loadNotifications(); });
            this.root.querySelector('[data-action="menu"]')?.addEventListener('click', event => { event.stopPropagation(); this.menuOpen = !this.menuOpen; this.notificationsOpen = false; this.render(); });
            this.root.querySelector('[data-action="silent-dashboard"]')?.addEventListener('click', event => { event.preventDefault(); this.silentDashboardRedirect(); });
            this.root.querySelector('[data-action="logout"]')?.addEventListener('click', () => this.logout());
            this.root.querySelector('[data-action="read-all"]')?.addEventListener('click', event => { event.stopPropagation(); this.markAllRead(); });
            this.root.querySelectorAll('[data-notification-id]').forEach(button => button.addEventListener('click', () => this.openNotification(button.dataset.notificationId)));
        }

        async loadNotifications() {
            if (!this.member?.id) return;
            this.loading = true; this.error = ''; this.render();
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/notifications?userId=${encodeURIComponent(this.member.id)}&limit=10`);
                const data = await response.json();
                if (!response.ok || data.success === false) throw new Error('No pudimos cargar tus notificaciones.');
                this.items = data.notifications || [];
            } catch (error) { this.error = error.message || 'No pudimos cargar tus notificaciones.'; }
            this.loading = false; this.render();
        }

        async openNotification(id) {
            const item = this.items.find(entry => String(entry.id) === String(id));
            if (item && !item.is_read) {
                item.is_read = true; this.render();
                await fetch(`${CONFIG.apiUrl}/api/notifications/${encodeURIComponent(id)}/read`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:this.member.id }) });
            }
            if (item?.link) window.location.href = item.link;
        }

        async markAllRead() {
            this.items = this.items.map(item => ({ ...item, is_read:true })); this.render();
            await fetch(`${CONFIG.apiUrl}/api/notifications/mark-all-read`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:this.member.id }) });
        }

        closePopovers() { if (!this.menuOpen && !this.notificationsOpen) return; this.menuOpen = false; this.notificationsOpen = false; this.render(); }

        async silentDashboardRedirect() {
            let roleData = {};
            if (this.member?.id) {
                try {
                    const response = await fetch(`${CONFIG.apiUrl}/api/auth/check-role`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberstackId: this.member.id })
                    });
                    roleData = await response.json();
                    if (response.ok && roleData.success) this.role = roleData.role;
                } catch {
                    roleData = {};
                }
            }
            window.location.href = this.resolveDashboardUrl(this.role, roleData);
        }

        async logout() { await window.$memberstackDom?.logout(); window.location.href = CONFIG.logoutUrl; }
    }

    const navbar = new MemberAccountNavbar();
    window.PataAccountNavbar = navbar;
    window.PataPrimaryNavigation = navbar;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => navbar.mount());
    else navbar.mount();
})();
