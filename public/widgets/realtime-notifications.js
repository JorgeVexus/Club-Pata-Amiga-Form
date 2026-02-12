/**
 * 🔔 Club Pata Amiga - Real-Time Notifications Widget
 * 
 * Widget simple y enfocado solo en notificaciones en tiempo real.
 * Usa Supabase Realtime para recibir notificaciones instantáneamente.
 * 
 * USO EN WEBFLOW:
 * 
 * 1. En el Head Code de Webflow, pega:
 * 
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * <script src="https://app.pataamiga.mx/widgets/realtime-notifications.js"></script>
 * 
 * 2. Añade un div donde quieras la campanita:
 * 
 * <div id="realtime-bell"></div>
 * 
 * El widget detecta automáticamente el usuario de Memberstack.
 */

(function () {
    'use strict';

    // ========== CONFIGURACIÓN ==========
    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        supabaseUrl: 'https://wkeaarptxpierpxzkkql.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZWFhcnB0eHBpZXJweHpra3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NTE2ODUsImV4cCI6MjA0ODIyNzY4NX0.pPMXvwkSnpD-cRMVWpqX_4aEI6i8eqcAMh3_FJ0WQ4Q',
        // Mapeo de rutas de backend -> rutas de Webflow
        urls: {
            // Dashboard y Home de usuario
            '/miembros/dashboard': window.PATA_AMIGA_CONFIG?.dashboardUrl || '/pets/pet-waiting-period',
            '/dashboard': window.PATA_AMIGA_CONFIG?.dashboardUrl || '/pets/pet-waiting-period',
            '/mi-membresia': window.PATA_AMIGA_CONFIG?.dashboardUrl || '/pets/pet-waiting-period',

            // Perfil y Edición
            '/perfil': window.PATA_AMIGA_CONFIG?.profileUrl || '/perfil',
            '/completar-perfil': window.PATA_AMIGA_CONFIG?.profileUrl || '/perfil',
        }
    };

    // ========== ESTILOS ==========
    const STYLES = `
        /* Container - ahora es inline para el navbar */
        #realtime-bell-widget {
            position: relative;
            display: inline-block;
            font-family: 'Outfit', -apple-system, sans-serif;
        }

        .rtbell-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.2s ease;
        }

        .rtbell-button:hover {
            background: rgba(0, 187, 180, 0.1);
            transform: scale(1.05);
        }

        .rtbell-button.shake {
            animation: rtShake 0.6s ease-in-out;
        }

        @keyframes rtShake {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-20deg); }
            40% { transform: rotate(20deg); }
            60% { transform: rotate(-15deg); }
            80% { transform: rotate(15deg); }
        }

        .rtbell-icon {
            font-size: 24px;
        }

        .rtbell-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            min-width: 18px;
            height: 18px;
            background: #FF4444;
            color: white;
            font-size: 10px;
            font-weight: 700;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 5px;
            border: 2px solid white;
            animation: rtPulse 2s infinite;
        }

        @keyframes rtPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }

        .rtbell-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 350px;
            max-height: 400px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 50px rgba(0,0,0,0.2);
            overflow: hidden;
            opacity: 0;
            transform: translateY(-10px);
            pointer-events: none;
            transition: all 0.2s ease;
            z-index: 10000;
        }

        .rtbell-dropdown.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }


        .rtbell-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #00BBB4, #00a09a);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .rtbell-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .rtbell-mark-all {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 11px;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
        }

        .rtbell-mark-all:hover {
            background: rgba(255,255,255,0.3);
        }

        .rtbell-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .rtbell-empty {
            padding: 40px;
            text-align: center;
            color: #999;
        }

        .rtbell-empty-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .rtbell-item {
            display: flex;
            gap: 12px;
            padding: 14px 20px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background 0.2s;
        }

        .rtbell-item:hover {
            background: #f9f9f9;
        }

        .rtbell-item.unread {
            background: #f0fffe;
            border-left: 3px solid #00BBB4;
        }

        .rtbell-item-icon {
            font-size: 24px;
            flex-shrink: 0;
        }

        .rtbell-item-content {
            flex: 1;
            min-width: 0;
        }

        .rtbell-item-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }

        .rtbell-item-message {
            font-size: 12px;
            color: #666;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .rtbell-item-time {
            font-size: 11px;
            color: #999;
            margin-top: 4px;
        }

        /* Toast */
        .rtbell-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00BBB4, #00a09a);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 187, 180, 0.5);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 100000;
            animation: rtToastIn 0.4s ease;
            max-width: 320px;
        }

        @keyframes rtToastIn {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
        }

        .rtbell-toast-icon {
            font-size: 28px;
            animation: rtRing 0.5s ease;
        }

        @keyframes rtRing {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-25deg); }
            50% { transform: rotate(25deg); }
            75% { transform: rotate(-15deg); }
        }

        .rtbell-toast-text {
            font-size: 14px;
            font-weight: 600;
        }

        /* MODAL DE DETALLES */
        .rtbell-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 20000;
            display: none;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .rtbell-modal-overlay.open {
            display: flex;
            opacity: 1;
        }

        .rtbell-modal {
            background: white;
            width: 90%;
            max-width: 400px;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }

        .rtbell-modal-overlay.open .rtbell-modal {
            transform: scale(1);
        }

        .rtbell-modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #f0f0f0;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .rtbell-modal-close:hover {
            background: #e0e0e0;
        }

        .rtbell-modal-icon {
            font-size: 48px;
            margin-bottom: 20px;
            display: block;
        }

        .rtbell-modal-title {
            font-size: 20px;
            font-weight: 700;
            color: #333;
            margin-bottom: 12px;
            line-height: 1.3;
        }

        .rtbell-modal-message {
            font-size: 15px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 25px;
        }

        .rtbell-modal-btn {
            background: #00BBB4;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s;
        }

        .rtbell-modal-btn:hover {
            background: #00a09a;
        }

        /* Status indicator - oculto para navbar */
        .rtbell-status {
            display: none;
        }

        @media (max-width: 480px) {
            .rtbell-dropdown {
                position: fixed;
                bottom: 80px;
                right: 10px;
                left: 10px;
                width: auto;
            }
        }
    `;

    // ========== WIDGET CLASS ==========
    class RealtimeNotifications {
        constructor() {
            this.userId = null;
            this.supabase = null;
            this.channel = null;
            this.notifications = [];
            this.isOpen = false;
        }

        async init() {
            console.log('🔔 Notificaciones: Iniciando...');

            // Inyectar estilos
            this.injectStyles();

            // Esperar Memberstack
            this.userId = await this.getMemberstackUser();
            if (!this.userId) {
                console.log('🔔 Usuario no logueado, widget deshabilitado');
                return;
            }

            // Renderizar
            this.render();

            // Cargar notificaciones
            await this.loadNotifications();

            // Iniciar polling
            this.startPolling();

            console.log('✅ Notificaciones listo para:', this.userId);
        }

        injectStyles() {
            if (document.getElementById('rtbell-styles')) return;
            const style = document.createElement('style');
            style.id = 'rtbell-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        async getMemberstackUser() {
            let attempts = 0;
            while (attempts < 50) {
                if (window.$memberstackDom) {
                    try {
                        const result = await window.$memberstackDom.getCurrentMember();
                        if (result?.data?.id) {
                            return result.data.id;
                        }
                    } catch (e) { }
                }
                await new Promise(r => setTimeout(r, 200));
                attempts++;
            }
            return null;
        }

        startPolling() {
            if (this.pollingStarted) return;
            this.pollingStarted = true;

            // Polling cada 10 segundos
            setInterval(async () => {
                const prevFirstId = this.notifications[0]?.id;

                await this.loadNotifications();

                // Detectar si hay nuevas notificaciones
                if (this.notifications.length > 0 &&
                    this.notifications[0]?.id !== prevFirstId &&
                    prevFirstId !== undefined) {
                    // Nueva notificación detectada!
                    const newNotif = this.notifications[0];
                    if (!newNotif.is_read) {
                        this.showToast(newNotif.title || 'Nueva notificación');
                        this.playSound();
                        this.shakeBell();
                    }
                }
            }, 10000);
        }


        handleNewNotification(notif) {
            // Añadir al inicio
            this.notifications.unshift(notif);

            // Toast
            this.showToast(notif.title || 'Nueva notificación');

            // Sonido
            this.playSound();

            // Shake
            this.shakeBell();

            // Actualizar UI
            this.updateUI();
        }

        handleUpdateNotification(notif) {
            this.notifications = this.notifications.map(n =>
                n.id === notif.id ? notif : n
            );
            this.updateUI();
        }

        async loadNotifications() {
            try {
                const res = await fetch(CONFIG.apiUrl + '/api/notifications?userId=' + this.userId + '&limit=10');
                const data = await res.json();
                if (data.success) {
                    this.notifications = data.notifications || [];
                    this.updateUI();
                }
            } catch (e) {
                console.error('Error cargando notificaciones:', e);
            }
        }

        async markAsRead(id) {
            try {
                await fetch(CONFIG.apiUrl + '/api/notifications/' + id + '/read', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });
                this.notifications = this.notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                );
                this.updateUI();
            } catch (e) { }
        }

        async markAllAsRead() {
            try {
                await fetch(CONFIG.apiUrl + '/api/notifications/mark-all-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });
                this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
                this.updateUI();
            } catch (e) { }
        }

        get unreadCount() {
            return this.notifications.filter(n => !n.is_read).length;
        }

        formatTime(dateStr) {
            const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
            if (diff < 1) return 'Ahora';
            if (diff < 60) return diff + 'm';
            if (diff < 1440) return Math.floor(diff / 60) + 'h';
            return Math.floor(diff / 1440) + 'd';
        }

        showToast(message) {
            const existing = document.querySelector('.rtbell-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'rtbell-toast';
            toast.innerHTML = `
                <span class="rtbell-toast-icon">🔔</span>
                <span class="rtbell-toast-text">${message}</span>
            `;
            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), 4000);
        }

        playSound() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const now = ctx.currentTime;

                // Crear sonido de campanita con múltiples armónicos
                const frequencies = [1200, 1800, 2400]; // Tonos de campana

                frequencies.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'sine';
                    osc.frequency.value = freq;

                    // Volumen con decay (fade out natural)
                    const volume = 0.15 / (i + 1);
                    gain.gain.setValueAtTime(volume, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

                    osc.start(now);
                    osc.stop(now + 0.8);
                });

                // Segundo toque de campana (eco)
                setTimeout(() => {
                    try {
                        const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
                        const now2 = ctx2.currentTime;

                        [1200, 1600].forEach((freq, i) => {
                            const osc = ctx2.createOscillator();
                            const gain = ctx2.createGain();
                            osc.connect(gain);
                            gain.connect(ctx2.destination);
                            osc.type = 'sine';
                            osc.frequency.value = freq;
                            gain.gain.setValueAtTime(0.08 / (i + 1), now2);
                            gain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.5);
                            osc.start(now2);
                            osc.stop(now2 + 0.5);
                        });
                    } catch (e) { }
                }, 200);

            } catch (e) { }
        }


        shakeBell() {
            const btn = document.querySelector('.rtbell-button');
            if (btn) {
                btn.classList.add('shake');
                setTimeout(() => btn.classList.remove('shake'), 600);
            }
        }

        updateStatus() {
            const status = document.querySelector('.rtbell-status');
            if (status) {
                status.textContent = this.connected ? '● En vivo' : '○ Conectando...';
                status.className = 'rtbell-status' + (this.connected ? ' connected' : '');
            }
        }

        // ================= NUEVA LÓGICA DE CLICK INTELIGENTE =================
        handleNotificationClick(notif) {
            // 1. Marcar como leída
            if (!notif.is_read) {
                this.markAsRead(notif.id);
            }

            // 2. Revisar si hay Link Configurado
            const incomingLink = notif.link;

            // Si el link coincide con una ruta mapeada en CONFIG.urls, redirigir allí
            if (incomingLink && CONFIG.urls[incomingLink]) {
                console.log(`🔀 Redirigiendo URL interna: ${incomingLink} -> ${CONFIG.urls[incomingLink]}`);
                window.location.href = CONFIG.urls[incomingLink];
                return;
            }

            // Si es un link externo absoluto (http...), abrirlo
            if (incomingLink && (incomingLink.startsWith('http') || incomingLink.startsWith('https'))) {
                window.location.href = incomingLink;
                return;
            }

            // 3. Fallback: Mostrar Modal de Detalles (Evita 404)
            this.showDetailModal(notif);
        }

        showDetailModal(notif) {
            const overlay = document.querySelector('.rtbell-modal-overlay');
            const icon = overlay.querySelector('.rtbell-modal-icon');
            const title = overlay.querySelector('.rtbell-modal-title');
            const message = overlay.querySelector('.rtbell-modal-message');

            icon.textContent = notif.icon || '🔔';
            title.textContent = notif.title;
            message.textContent = notif.message;

            overlay.classList.add('open');
        }

        closeDetailModal() {
            const overlay = document.querySelector('.rtbell-modal-overlay');
            overlay.classList.remove('open');
        }

        render() {
            let container = document.getElementById('realtime-bell');
            if (!container) {
                container = document.createElement('div');
                container.id = 'realtime-bell';
                document.body.appendChild(container);
            }

            container.innerHTML = `
                <div id="realtime-bell-widget">
                    <button class="rtbell-button">
                        <span class="rtbell-icon">🔔</span>
                        <span class="rtbell-badge" style="display:none;">0</span>
                    </button>
                    <div class="rtbell-dropdown">
                        <div class="rtbell-header">
                            <h3>🔔 Notificaciones</h3>
                            <button class="rtbell-mark-all" style="display:none;">Marcar leídas</button>
                        </div>
                        <div class="rtbell-list">
                            <div class="rtbell-empty">
                                <div class="rtbell-empty-icon">📭</div>
                                <p>No hay notificaciones</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL DE DETALLES -->
                <div class="rtbell-modal-overlay">
                    <div class="rtbell-modal">
                        <button class="rtbell-modal-close">&times;</button>
                        <span class="rtbell-modal-icon">🔔</span>
                        <div class="rtbell-modal-title">Título</div>
                        <div class="rtbell-modal-message">Mensaje</div>
                        <button class="rtbell-modal-btn">Entendido</button>
                    </div>
                </div>
            `;

            this.attachEvents();
        }

        attachEvents() {
            const btn = document.querySelector('.rtbell-button');
            const dropdown = document.querySelector('.rtbell-dropdown');
            const markAllBtn = document.querySelector('.rtbell-mark-all');

            // Eventos del Modal
            const modalOverlay = document.querySelector('.rtbell-modal-overlay');
            const modalCloseBtn = document.querySelector('.rtbell-modal-close');
            const modalActionBtn = document.querySelector('.rtbell-modal-btn');

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.isOpen = !this.isOpen;
                dropdown.classList.toggle('open', this.isOpen);
            });

            markAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllAsRead();
            });

            document.addEventListener('click', (e) => {
                // Cerrar dropdown si click fuera
                if (this.isOpen && !e.target.closest('#realtime-bell-widget')) {
                    this.isOpen = false;
                    dropdown.classList.remove('open');
                }

                // Cerrar modal si click fuera (overlay)
                if (e.target === modalOverlay) {
                    this.closeDetailModal();
                }
            });

            // Cerrar modal
            modalCloseBtn.addEventListener('click', () => this.closeDetailModal());
            modalActionBtn.addEventListener('click', () => this.closeDetailModal());
        }

        updateUI() {
            const badge = document.querySelector('.rtbell-badge');
            const markAllBtn = document.querySelector('.rtbell-mark-all');
            const list = document.querySelector('.rtbell-list');

            // Badge
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }

            // Mark all button
            markAllBtn.style.display = this.unreadCount > 0 ? 'block' : 'none';

            // List
            if (this.notifications.length === 0) {
                list.innerHTML = `
                    <div class="rtbell-empty">
                        <div class="rtbell-empty-icon">📭</div>
                        <p>No hay notificaciones</p>
                    </div>
                `;
            } else {
                list.innerHTML = this.notifications.slice(0, 10).map(n => `
                    <div class="rtbell-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
                        <span class="rtbell-item-icon">${n.icon || '📢'}</span>
                        <div class="rtbell-item-content">
                            <div class="rtbell-item-title">${n.title}</div>
                            <div class="rtbell-item-message">${n.message}</div>
                            <div class="rtbell-item-time">${this.formatTime(n.created_at)}</div>
                        </div>
                    </div>
                `).join('');

                // Click events con nueva lógica
                list.querySelectorAll('.rtbell-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = item.dataset.id;
                        const notif = this.notifications.find(n => n.id === id);

                        if (notif) {
                            this.handleNotificationClick(notif);
                        }
                    });
                });
            }
        }
    }

    // ========== INICIALIZAR ==========
    function init() {
        const widget = new RealtimeNotifications();
        widget.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
