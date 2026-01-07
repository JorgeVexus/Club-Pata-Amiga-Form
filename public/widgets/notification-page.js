/**
 * 📄 Club Pata Amiga - Full Notifications Page Widget for Webflow
 * 
 * Este script genera una lista completa de notificaciones diseñada para
 * ser incrustada en una página dedicada de Webflow (ej: /notificaciones).
 * 
 * INSTRUCCIONES DE USO EN WEBFLOW:
 * 
 * 1. Crea una página nueva en Webflow (ej: /notificaciones).
 * 2. En la configuración de esa página (Custom Code → Head Code), pega esto:
 * 
 * <script src="https://club-pata-amiga-form.vercel.app/widgets/notification-page.js"></script>
 * 
 * 3. En el cuerpo de la página, agrega un "Embed" con este ID:
 * 
 * <div id="pata-amiga-full-notifications"></div>
 */

(function () {
    'use strict';

    const CONFIG = window.PATA_AMIGA_CONFIG || {
        apiUrl: 'https://club-pata-amiga-form.vercel.app'
    };

    const STYLES = `
        .pata-full-notifications {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: 'Outfit', sans-serif;
            color: #333;
        }

        .pata-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .pata-title {
            font-size: 2rem;
            font-weight: 800;
            margin: 0;
            color: #1a1a1a;
        }

        .pata-controls {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .pata-filter {
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid #ddd;
            font-size: 0.9rem;
            background: white;
            cursor: pointer;
        }

        .pata-mark-all-link {
            color: #00BBB4;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.9rem;
            text-decoration: underline;
            background: none;
            border: none;
        }

        .pata-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .pata-item {
            background: white;
            padding: 20px;
            border-radius: 16px;
            border: 1px solid #eee;
            display: flex;
            gap: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            text-decoration: none;
            color: inherit;
        }

        .pata-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
            border-color: #00BBB4;
        }

        .pata-item.unread {
            background: #f0fdfc;
            border-left: 5px solid #00BBB4;
        }

        .pata-item-icon {
            width: 50px;
            height: 50px;
            background: #f8f9fa;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .pata-item-content {
            flex: 1;
        }

        .pata-item-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 5px;
        }

        .pata-item-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin: 0;
            color: #333;
        }

        .pata-item-time {
            font-size: 0.8rem;
            color: #999;
        }

        .pata-item-message {
            color: #666;
            line-height: 1.5;
            margin-bottom: 10px;
            font-size: 0.95rem;
        }

        .pata-unread-dot {
            width: 10px;
            height: 10px;
            background: #00BBB4;
            border-radius: 50%;
            position: absolute;
            top: 20px;
            right: 20px;
        }

        .pata-empty {
            text-align: center;
            padding: 60px 20px;
            background: #f8f9fa;
            border-radius: 20px;
            border: 2px dashed #ddd;
        }

        .pata-empty-icon {
            font-size: 3rem;
            display: block;
            margin-bottom: 15px;
        }

        @media (max-width: 600px) {
            .pata-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
            .pata-controls {
                width: 100%;
                justify-content: space-between;
            }
        }
    `;

    function injectStyles() {
        if (document.getElementById('pata-full-notif-styles')) return;
        const style = document.createElement('style');
        style.id = 'pata-full-notif-styles';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }

    class FullNotificationList {
        constructor(containerId, userId) {
            this.container = document.getElementById(containerId);
            this.userId = userId;
            this.notifications = [];
            this.filter = 'all';

            if (!this.container) return;

            this.init();
        }

        async init() {
            injectStyles();
            await this.loadNotifications();
            this.render();
        }

        async loadNotifications() {
            try {
                const url = `${CONFIG.apiUrl}/api/notifications?userId=${this.userId}&limit=50`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.success) {
                    this.notifications = data.notifications;
                }
            } catch (err) {
                console.error('Pata Amiga: Error loading page notifications:', err);
            }
        }

        async markAsRead(id) {
            try {
                await fetch(`${CONFIG.apiUrl}/api/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });
                const n = this.notifications.find(notif => notif.id === id);
                if (n) n.is_read = true;
                this.render();
            } catch (err) {
                console.error('Pata Amiga: Error marking read:', err);
            }
        }

        async markAllAsRead() {
            try {
                await fetch(`${CONFIG.apiUrl}/api/notifications/mark-all-read`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });
                this.notifications.forEach(n => n.is_read = true);
                this.render();
            } catch (err) {
                console.error('Pata Amiga: Error marking all read:', err);
            }
        }

        formatTime(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        render() {
            const filtered = this.notifications.filter(n =>
                this.filter === 'all' ? true : !n.is_read
            );

            this.container.innerHTML = `
                <div class="pata-full-notifications">
                    <div class="pata-header">
                        <h1 class="pata-title">Buzón de Notificaciones</h1>
                        <div class="pata-controls">
                            <select class="pata-filter" id="pata-filter-select">
                                <option value="all" ${this.filter === 'all' ? 'selected' : ''}>Todas</option>
                                <option value="unread" ${this.filter === 'unread' ? 'selected' : ''}>No leídas</option>
                            </select>
                            <button class="pata-mark-all-link" id="pata-mark-all-btn">Marcar todas leídas</button>
                        </div>
                    </div>
                    <div class="pata-list" id="pata-notif-list">
                        ${filtered.length === 0 ? this.renderEmpty() : filtered.map(n => this.renderItem(n)).join('')}
                    </div>
                </div>
            `;

            // Listeners
            document.getElementById('pata-filter-select').onchange = (e) => {
                this.filter = e.target.value;
                this.render();
            };

            document.getElementById('pata-mark-all-btn').onclick = () => this.markAllAsRead();

            this.container.querySelectorAll('.pata-item').forEach(item => {
                item.onclick = (e) => {
                    const id = item.dataset.id;
                    const n = this.notifications.find(notif => notif.id === id);
                    if (n && !n.is_read) this.markAsRead(id);
                };
            });
        }

        renderItem(n) {
            return `
                <a href="${n.link || '#'}" class="pata-item ${!n.is_read ? 'unread' : ''}" data-id="${n.id}">
                    <div class="pata-item-icon">${n.icon || '🔔'}</div>
                    <div class="pata-item-content">
                        <div class="pata-item-top">
                            <h3 class="pata-item-title">${n.title}</h3>
                            <span class="pata-item-time">${this.formatTime(n.created_at)}</span>
                        </div>
                        <p class="pata-item-message">${n.message}</p>
                    </div>
                    ${!n.is_read ? '<div class="pata-unread-dot"></div>' : ''}
                </a>
            `;
        }

        renderEmpty() {
            return `
                <div class="pata-empty">
                    <span class="pata-empty-icon">📭</span>
                    <p>${this.filter === 'unread' ? 'No tienes mensajes sin leer' : 'Aún no tienes notificaciones'}</p>
                </div>
            `;
        }
    }

    // Inicialización similar al bell original
    function start() {
        const checkMS = setInterval(() => {
            if (window.$memberstackDom) {
                clearInterval(checkMS);
                window.$memberstackDom.getCurrentMember().then(({ data }) => {
                    if (data && data.id) {
                        const container = document.getElementById('pata-amiga-full-notifications');
                        if (container) {
                            new FullNotificationList('pata-amiga-full-notifications', data.id);
                        }
                    }
                });
            }
        }, 100);
        setTimeout(() => clearInterval(checkMS), 10000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
