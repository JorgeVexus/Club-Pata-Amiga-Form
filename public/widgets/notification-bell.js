/**
 * 🔔 Club Pata Amiga - Notification Widget for Webflow
 * 
 * Este script crea una campanita de notificaciones que se puede
 * insertar en cualquier página de Webflow.
 * 
 * INSTRUCCIONES DE USO EN WEBFLOW:
 * 
 * 1. En Webflow, ve a Project Settings → Custom Code
 * 2. En "Head Code", pega el siguiente script:
 * 
 * <script>
 *   window.PATA_AMIGA_CONFIG = {
 *     apiUrl: 'https://club-pata-amiga-form.vercel.app',
 *     supabaseUrl: 'TU_SUPABASE_URL',
 *     supabaseAnonKey: 'TU_SUPABASE_ANON_KEY'
 *   };
 * </script>
 * <script src="https://club-pata-amiga-form.vercel.app/widgets/notification-bell.js"></script>
 * 
 * 3. En el navbar de Webflow, agrega un Embed element donde quieras la campanita:
 * 
 * <div id="pata-amiga-notifications"></div>
 * 
 * 4. El widget se inicializará automáticamente cuando el usuario esté logueado
 *    en Memberstack y tomará su ID de ahí.
 */

(function () {
    'use strict';

    // Configuración
    const CONFIG = window.PATA_AMIGA_CONFIG || {
        apiUrl: 'https://club-pata-amiga-form.vercel.app',
        supabaseUrl: '',
        supabaseAnonKey: ''
    };

    // Estilos del widget (inyectados dinámicamente)
    const STYLES = `
        .pata-notification-container {
            position: relative;
            display: inline-block;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .pata-notification-bell {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            background: transparent;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .pata-notification-bell:hover {
            background: rgba(0, 187, 180, 0.1);
            transform: scale(1.05);
        }

        .pata-notification-bell .bell-icon {
            font-size: 1.5rem;
        }

        .pata-notification-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            background: #FF4444;
            color: white;
            font-size: 0.7rem;
            font-weight: 700;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .pata-notification-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 360px;
            max-height: 450px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            overflow: hidden;
            display: none;
        }

        .pata-notification-dropdown.open {
            display: block;
            animation: pataSlideDown 0.2s ease;
        }

        @keyframes pataSlideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .pata-notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #f0f0f0;
            background: #fafafa;
        }

        .pata-notification-header h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
        }

        .pata-mark-all-btn {
            background: none;
            border: none;
            color: #00BBB4;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 6px;
        }

        .pata-mark-all-btn:hover {
            background: rgba(0, 187, 180, 0.1);
        }

        .pata-notification-list {
            max-height: 350px;
            overflow-y: auto;
        }

        .pata-notification-item {
            display: flex;
            gap: 12px;
            padding: 14px 20px;
            border-bottom: 1px solid #f5f5f5;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }

        .pata-notification-item:hover {
            background: #f9f9f9;
        }

        .pata-notification-item.unread {
            background: linear-gradient(135deg, #f0fffe 0%, #e8faf9 100%);
        }

        .pata-notification-item .icon {
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            background: #f5f5f5;
            border-radius: 10px;
        }

        .pata-notification-item.unread .icon {
            background: rgba(0, 187, 180, 0.15);
        }

        .pata-notification-item .content {
            flex: 1;
            min-width: 0;
        }

        .pata-notification-item .title {
            margin: 0 0 4px 0;
            font-size: 0.9rem;
            font-weight: 600;
            color: #333;
        }

        .pata-notification-item .message {
            margin: 0 0 4px 0;
            font-size: 0.8rem;
            color: #666;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .pata-notification-item .time {
            font-size: 0.7rem;
            color: #999;
        }

        .pata-notification-item .unread-dot {
            position: absolute;
            top: 16px;
            right: 14px;
            width: 8px;
            height: 8px;
            background: #00BBB4;
            border-radius: 50%;
        }

        .pata-notification-empty {
            padding: 40px 20px;
            text-align: center;
            color: #999;
        }

        .pata-notification-empty .empty-icon {
            font-size: 2.5rem;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        .pata-view-all {
            display: block;
            padding: 12px 20px;
            text-align: center;
            color: #00BBB4;
            font-size: 0.85rem;
            font-weight: 500;
            text-decoration: none;
            border-top: 1px solid #f0f0f0;
            background: #fafafa;
        }

        .pata-view-all:hover {
            background: #f0f0f0;
        }

        @media (max-width: 480px) {
            .pata-notification-dropdown {
                position: fixed;
                top: auto;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                border-radius: 20px 20px 0 0;
            }
        }
    `;

    // Inyectar estilos
    function injectStyles() {
        if (document.getElementById('pata-notification-styles')) return;
        const style = document.createElement('style');
        style.id = 'pata-notification-styles';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }

    // Formatear tiempo relativo
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return 'Hace ' + diffMins + ' min';
        if (diffHours < 24) return 'Hace ' + diffHours + 'h';
        if (diffDays < 7) return 'Hace ' + diffDays + 'd';

        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }

    // Clase principal del widget
    class NotificationWidget {
        constructor(containerId, userId) {
            this.container = document.getElementById(containerId);
            this.userId = userId;
            this.notifications = [];
            this.unreadCount = 0;
            this.isOpen = false;

            if (!this.container) {
                console.error('Pata Amiga: Container not found:', containerId);
                return;
            }

            this.render();
            this.loadNotifications();
            this.setupClickOutside();
        }

        async loadNotifications() {
            try {
                const response = await fetch(
                    CONFIG.apiUrl + '/api/notifications?userId=' + this.userId + '&limit=10'
                );
                const data = await response.json();

                if (data.success) {
                    this.notifications = data.notifications;
                    this.unreadCount = this.notifications.filter(function (n) { return !n.is_read; }).length;
                    this.updateUI();
                }
            } catch (error) {
                console.error('Pata Amiga: Error loading notifications:', error);
            }
        }

        async markAsRead(notificationId) {
            try {
                await fetch(CONFIG.apiUrl + '/api/notifications/' + notificationId + '/read', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });

                var notification = this.notifications.find(function (n) { return n.id === notificationId; });
                if (notification && !notification.is_read) {
                    notification.is_read = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.updateUI();
                }
            } catch (error) {
                console.error('Pata Amiga: Error marking as read:', error);
            }
        }

        async markAllAsRead() {
            try {
                await fetch(CONFIG.apiUrl + '/api/notifications/mark-all-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });

                this.notifications.forEach(function (n) { n.is_read = true; });
                this.unreadCount = 0;
                this.updateUI();
            } catch (error) {
                console.error('Pata Amiga: Error marking all as read:', error);
            }
        }

        render() {
            var self = this;
            this.container.innerHTML =
                '<div class="pata-notification-container">' +
                '<button class="pata-notification-bell" aria-label="Notificaciones">' +
                '<span class="bell-icon">🔔</span>' +
                '<span class="pata-notification-badge" style="display: none;">0</span>' +
                '</button>' +
                '<div class="pata-notification-dropdown">' +
                '<div class="pata-notification-header">' +
                '<h3>Notificaciones</h3>' +
                '<button class="pata-mark-all-btn" style="display: none;">✓ Marcar todas</button>' +
                '</div>' +
                '<div class="pata-notification-list"></div>' +
                '<a href="' + CONFIG.apiUrl + '/notifications" class="pata-view-all" style="display: none;">' +
                'Ver todas las notificaciones →' +
                '</a>' +
                '</div>' +
                '</div>';

            // Event listeners
            var bell = this.container.querySelector('.pata-notification-bell');
            bell.addEventListener('click', function () { self.toggleDropdown(); });

            var markAllBtn = this.container.querySelector('.pata-mark-all-btn');
            markAllBtn.addEventListener('click', function () { self.markAllAsRead(); });
        }

        updateUI() {
            var self = this;

            // Actualizar badge
            var badge = this.container.querySelector('.pata-notification-badge');
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';

            // Actualizar botón "Marcar todas"
            var markAllBtn = this.container.querySelector('.pata-mark-all-btn');
            markAllBtn.style.display = this.unreadCount > 0 ? 'block' : 'none';

            // Actualizar lista
            var list = this.container.querySelector('.pata-notification-list');

            if (this.notifications.length === 0) {
                list.innerHTML =
                    '<div class="pata-notification-empty">' +
                    '<div class="empty-icon">📭</div>' +
                    '<p>No tienes notificaciones</p>' +
                    '</div>';
            } else {
                list.innerHTML = this.notifications.map(function (n) {
                    return '<div class="pata-notification-item ' + (n.is_read ? '' : 'unread') + '" data-id="' + n.id + '">' +
                        '<div class="icon">' + n.icon + '</div>' +
                        '<div class="content">' +
                        '<h4 class="title">' + n.title + '</h4>' +
                        '<p class="message">' + n.message + '</p>' +
                        '<span class="time">' + formatTimeAgo(n.created_at) + '</span>' +
                        '</div>' +
                        (n.is_read ? '' : '<div class="unread-dot"></div>') +
                        '</div>';
                }).join('');

                // Click en notificación
                list.querySelectorAll('.pata-notification-item').forEach(function (item) {
                    item.addEventListener('click', function () {
                        var id = item.dataset.id;
                        var notification = self.notifications.find(function (n) { return n.id === id; });

                        if (notification && !notification.is_read) {
                            self.markAsRead(id);
                        }

                        if (notification && notification.link) {
                            window.location.href = notification.link;
                        }

                        self.closeDropdown();
                    });
                });
            }

            // Mostrar/ocultar "Ver todas"
            var viewAll = this.container.querySelector('.pata-view-all');
            viewAll.style.display = this.notifications.length > 0 ? 'block' : 'none';
        }

        toggleDropdown() {
            this.isOpen = !this.isOpen;
            var dropdown = this.container.querySelector('.pata-notification-dropdown');
            if (this.isOpen) {
                dropdown.classList.add('open');
            } else {
                dropdown.classList.remove('open');
            }
        }

        closeDropdown() {
            this.isOpen = false;
            var dropdown = this.container.querySelector('.pata-notification-dropdown');
            dropdown.classList.remove('open');
        }

        setupClickOutside() {
            var self = this;
            document.addEventListener('click', function (e) {
                if (!self.container.contains(e.target)) {
                    self.closeDropdown();
                }
            });
        }
    }

    // Inicializar cuando el DOM esté listo
    function init() {
        injectStyles();

        // Esperar a Memberstack
        var checkMemberstack = setInterval(function () {
            if (window.$memberstackDom) {
                clearInterval(checkMemberstack);

                window.$memberstackDom.getCurrentMember().then(function (result) {
                    var member = result.data;
                    if (member && member.id) {
                        // Buscar contenedor
                        var container = document.getElementById('pata-amiga-notifications');
                        if (container) {
                            new NotificationWidget('pata-amiga-notifications', member.id);
                            console.log('🔔 Pata Amiga Notifications initialized for:', member.id);
                        }
                    }
                });
            }
        }, 100);

        // Timeout después de 10 segundos
        setTimeout(function () { clearInterval(checkMemberstack); }, 10000);
    }

    // Ejecutar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exportar para uso manual
    window.PataAmigaNotifications = {
        init: function (containerId, userId) {
            injectStyles();
            return new NotificationWidget(containerId, userId);
        }
    };

})();
