/**
 * 🔔 Club Pata Amiga - Notification Widget for Webflow (Real-Time)
 * 
 * Este script crea una campanita de notificaciones que se puede
 * insertar en cualquier página de Webflow.
 * 
 * 🆕 AHORA CON SUPABASE REALTIME - Notificaciones instantáneas!
 * 
 * INSTRUCCIONES DE USO EN WEBFLOW:
 * 
 * 1. En Webflow, ve a Project Settings → Custom Code
 * 2. En "Head Code", pega los siguientes scripts:
 * 
 * <!-- Supabase para Realtime -->
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * 
 * <script>
 *   window.PATA_AMIGA_CONFIG = {
 *     apiUrl: 'https://app.pataamiga.mx',
 *     supabaseUrl: 'https://wkeaarptxpierpxzkkql.supabase.co',
 *     supabaseAnonKey: 'TU_ANON_KEY'
 *   };
 * </script>
 * <script src="https://app.pataamiga.mx/widgets/notification-bell.js"></script>
 * 
 * 3. En el navbar de Webflow, agrega un Embed element donde quieras la campanita:
 * 
 * <div id="realtime-bell"></div>
 * 
 * 4. El widget se inicializará automáticamente cuando el usuario esté logueado
 *    en Memberstack y tomará su ID de ahí.
 */

(function () {
    'use strict';

    // Configuración
    const DEFAULT_CONFIG = {
        apiUrl: 'https://app.pataamiga.mx',
        supabaseUrl: 'https://hjvhntxjkuuobgfslzlf.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTg5NTcsImV4cCI6MjA4MDQzNDk1N30.YnrJ_ECWnqcO_iDP5V-tBkgwd4LdBhJnJ5jdLsowjnA'
    };

    // ========== ICONOS ==========
    const ICONS = {
        bell: `<svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
            <g clip-path="url(#clip_bell_simple)">
                <path d="M25.0001 49.0909C38.3051 49.0909 49.091 38.305 49.091 25C49.091 11.695 38.3051 0.909088 25.0001 0.909088C11.695 0.909088 0.90918 11.695 0.90918 25C0.90918 38.305 11.695 49.0909 25.0001 49.0909Z" stroke="currentColor" stroke-width="2" stroke-miterlimit="10"/>
                <path d="M25 17.3364C24.5091 17.3364 24.1182 16.9364 24.1182 16.4545V14.3727C24.1182 13.8818 24.5182 13.4909 25 13.4909C25.4818 13.4909 25.8818 13.8909 25.8818 14.3727V16.4545C25.8818 16.9455 25.4818 17.3364 25 17.3364Z" fill="currentColor"/>
                <path d="M34.3727 34.0091H15.6181C15.1272 34.0091 14.7363 33.6091 14.7363 33.1273C14.7363 32.6455 15.1363 32.2455 15.6181 32.2455H34.3727C34.8636 32.2455 35.2545 32.6455 35.2545 33.1273C35.2545 33.6091 34.8545 34.0091 34.3727 34.0091Z" fill="currentColor"/>
                <path d="M25.0003 38.1727C22.7912 38.1727 20.9912 36.3727 20.9912 34.1636C20.9912 33.6727 21.3912 33.2818 21.873 33.2818C22.3548 33.2818 22.7548 33.6818 22.7548 34.1636C22.7548 35.4 23.7639 36.4 24.9912 36.4C26.2185 36.4 27.2276 35.3909 27.2276 34.1636C27.2276 33.6727 27.6276 33.2818 28.1094 33.2818C28.5912 33.2818 28.9912 33.6818 28.9912 34.1636C28.9912 36.3727 27.1912 38.1727 24.9821 38.1727H25.0003Z" fill="currentColor"/>
                <path d="M21.873 35.0454C21.3821 35.0454 20.9912 34.6455 20.9912 34.1636V33.1182C20.9912 32.6273 21.3912 32.2364 21.873 32.2364C22.3548 32.2364 22.7548 32.6364 22.7548 33.1182V34.1636C22.7548 34.6545 22.3548 35.0454 21.873 35.0454Z" fill="currentColor"/>
                <path d="M28.1279 35.0454C27.637 35.0454 27.2461 34.6455 27.2461 34.1636V33.1182C27.2461 32.6273 27.6461 32.2364 28.1279 32.2364C28.6097 32.2364 29.0097 32.6364 29.0097 33.1182V34.1636C29.0097 34.6545 28.6097 35.0454 28.1279 35.0454Z" fill="currentColor"/>
                <path d="M15.6279 34.0091C15.137 34.0091 14.7461 33.6091 14.7461 33.1273C14.7461 32.1546 15.1006 31.2546 15.5006 30.2C16.0915 28.6727 16.8279 26.7727 16.8279 23.7455C16.8279 23.2546 17.2279 22.8636 17.7097 22.8636C18.1915 22.8636 18.5915 23.2636 18.5915 23.7455C18.5915 27.1 17.7552 29.2636 17.1461 30.8364C16.7915 31.7546 16.5097 32.4818 16.5097 33.1182C16.5097 33.6091 16.1097 34 15.6279 34V34.0091Z" fill="currentColor"/>
                <path d="M34.3728 34.0091C33.8819 34.0091 33.491 33.6091 33.491 33.1273C33.491 32.4818 33.2092 31.7637 32.8546 30.8455C32.2455 29.2727 31.4092 27.1091 31.4092 23.7546C31.4092 23.2637 31.8092 22.8727 32.291 22.8727C32.7728 22.8727 33.1728 23.2727 33.1728 23.7546C33.1728 26.7818 33.9092 28.6818 34.5001 30.2091C34.9092 31.2546 35.2546 32.1637 35.2546 33.1364C35.2546 33.6273 34.8546 34.0182 34.3728 34.0182V34.0091Z" fill="currentColor"/>
                <path d="M32.2918 24.6364C31.8009 24.6364 31.4099 24.2364 31.4099 23.7545C31.4099 20.2182 28.5372 17.3455 25.0009 17.3455C21.4645 17.3455 18.5918 20.2182 18.5918 23.7545C18.5918 24.2455 18.1918 24.6364 17.7099 24.6364C17.2281 24.6364 16.8281 24.2364 16.8281 23.7545C16.8281 19.2455 20.5009 15.5727 25.0099 15.5727C29.519 15.5727 33.1918 19.2455 33.1918 23.7545C33.1918 24.2455 32.7918 24.6364 32.3099 24.6364H32.2918Z" fill="currentColor"/>
                <path d="M36.4554 24.6364C35.9645 24.6364 35.5736 24.2364 35.5736 23.7545C35.5736 20.3182 33.8918 17.0818 31.0827 15.1C30.6827 14.8182 30.5827 14.2636 30.8645 13.8636C31.1463 13.4636 31.7009 13.3636 32.1009 13.6455C35.3827 15.9546 37.3463 19.7364 37.3463 23.7455C37.3463 24.2364 36.9463 24.6273 36.4645 24.6273L36.4554 24.6364Z" fill="currentColor"/>
                <path d="M13.5459 24.6364C13.055 24.6364 12.6641 24.2364 12.6641 23.7546C12.6641 19.7455 14.6277 15.9636 17.9095 13.6546C18.3095 13.3727 18.8641 13.4727 19.1459 13.8727C19.4277 14.2727 19.3277 14.8273 18.9277 15.1091C16.1186 17.0909 14.4368 20.3273 14.4368 23.7636C14.4368 24.2546 14.0368 24.6455 13.555 24.6455L13.5459 24.6364Z" fill="currentColor"/>
            </g>
            <defs>
                <clipPath id="clip_bell_simple">
                    <rect width="50" height="50" fill="white"/>
                </clipPath>
            </defs>
        </svg>`
    };

    // Mezclar configuración personalizada con valores por defecto
    const CONFIG = {};
    const customConfig = window.PATA_AMIGA_CONFIG || {};

    // Asegurar que cada propiedad tenga un valor (prioridad: custom > default)
    Object.keys(DEFAULT_CONFIG).forEach(key => {
        CONFIG[key] = customConfig[key] !== undefined ? customConfig[key] : DEFAULT_CONFIG[key];
    });

    // Estilos del widget (inyectados dinámicamente)
    const STYLES = `
        .pata-notification-container {
            position: relative;
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #FFFFFF;
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

        .pata-notification-bell.shake {
            animation: pataShake 0.5s ease-in-out;
        }

        @keyframes pataShake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-15deg); }
            50% { transform: rotate(15deg); }
            75% { transform: rotate(-10deg); }
        }

        .pata-notification-bell .bell-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            transition: all 0.2s ease;
        }

        .pata-notification-bell:hover .bell-icon {
            color: #FFFFFF;
            filter: drop-shadow(0 0 5px rgba(255,255,255,0.3));
        }

        .pata-notification-badge {
            position: absolute;
            top: 0;
            right: 0;
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
            animation: pataPulse 2s infinite;
        }

        @keyframes pataPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
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

        /* 🆕 Toast de notificación en tiempo real */
        .pata-realtime-toast {
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #00BBB4, #00a09a);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 187, 180, 0.4);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10001;
            animation: pataToastIn 0.4s ease;
            max-width: 320px;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @keyframes pataToastIn {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
        }

        .pata-realtime-toast-icon {
            font-size: 24px;
            animation: pataRing 0.5s ease;
        }

        @keyframes pataRing {
            0%, 100% { transform: rotate(0deg); }
            20%, 60% { transform: rotate(-20deg); }
            40%, 80% { transform: rotate(20deg); }
        }

        .pata-realtime-toast-text {
            font-size: 14px;
            font-weight: 600;
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

            .pata-realtime-toast {
                left: 20px;
                right: 20px;
                max-width: none;
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
        constructor(containerId = 'pata-amiga-notifications', userId) {
            console.log('🔔 [NOTIFICATIONS] Inicializando widget...');
            this.container = document.getElementById(containerId) || document.getElementById('pata-amiga-notifications') || document.getElementById('realtime-bell');
            this.userId = userId;
            
            if (!this.container) {
                console.warn(`⚠️ [NOTIFICATIONS] No se encontró el contenedor con ID "${containerId}" o "pata-amiga-notifications". El widget no se cargará.`);
                return;
            }

            console.log('🔔 [NOTIFICATIONS] Contenedor encontrado. Esperando a Memberstack...');
            this.notifications = [];
            this.unreadCount = 0;
            this.isOpen = false;
            this.supabaseClient = null;
            this.realtimeChannel = null;
            this.toastTimeout = null;

            if (!this.container) {
                console.error('Pata Amiga: Container not found:', containerId);
                return;
            }

            this.render();
            this.loadNotifications();
            this.setupClickOutside();
            this.initRealtime(); // 🆕 Inicializar Realtime
        }

        // 🆕 Inicializar Supabase Realtime
        initRealtime() {
            // Verificar si Supabase está disponible
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                try {
                    this.supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
                    console.log('📡 Pata Amiga: Supabase Realtime inicializado');
                    this.subscribeToRealtime();
                } catch (e) {
                    console.warn('⚠️ Pata Amiga: Error inicializando Supabase:', e);
                    this.fallbackToPolling();
                }
            } else {
                console.log('⚠️ Pata Amiga: Supabase no disponible, usando polling');
                this.fallbackToPolling();
            }
        }

        // 🆕 Suscribirse a cambios en tiempo real
        subscribeToRealtime() {
            const self = this;

            this.realtimeChannel = this.supabaseClient
                .channel('user-notifications-' + this.userId)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: 'user_id=eq.' + this.userId
                    },
                    function (payload) {
                        console.log('🔔 Nueva notificación en tiempo real:', payload);
                        const newNotif = payload.new;

                        // Añadir al inicio
                        self.notifications.unshift(newNotif);
                        self.unreadCount++;

                        // Mostrar toast
                        self.showToast(newNotif.title || 'Nueva notificación');

                        // Reproducir sonido
                        self.playSound();

                        // Shake bell
                        self.shakeBell();

                        // Actualizar UI
                        self.updateUI();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: 'user_id=eq.' + this.userId
                    },
                    function (payload) {
                        const updated = payload.new;
                        self.notifications = self.notifications.map(function (n) {
                            return n.id === updated.id ? updated : n;
                        });
                        self.unreadCount = self.notifications.filter(function (n) { return !n.is_read; }).length;
                        self.updateUI();
                    }
                )
                .subscribe(function (status) {
                    console.log('📡 Pata Amiga Realtime status:', status);
                });
        }

        // 🆕 Fallback a polling si Realtime no está disponible
        fallbackToPolling() {
            const self = this;
            setInterval(function () {
                self.loadNotifications();
            }, 30000);
        }

        // 🆕 Mostrar toast de nueva notificación
        showToast(message) {
            // Remover toast anterior si existe
            const existingToast = document.querySelector('.pata-realtime-toast');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.className = 'pata-realtime-toast';
            toast.innerHTML = `<span class="pata-realtime-toast-icon">${ICONS.bell}</span>` +
                '<span class="pata-realtime-toast-text">' + message + '</span>';
            document.body.appendChild(toast);

            // Remover después de 4 segundos
            clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(function () {
                toast.remove();
            }, 4000);
        }

        // 🆕 Reproducir sonido de notificación
        playSound() {
            // Campanita con armónicos + eco (mismo sonido que usa la campanita del admin)
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const now = audioContext.currentTime;

                [1200, 1800, 2400].forEach(function (freq, i) {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    const volume = 0.15 / (i + 1);
                    gain.gain.setValueAtTime(volume, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                    osc.start(now);
                    osc.stop(now + 0.8);
                });

                setTimeout(function () {
                    try {
                        const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
                        const now2 = ctx2.currentTime;
                        [1200, 1600].forEach(function (freq, i) {
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
            } catch (e) {
                // Ignorar si no hay soporte de audio
            }
        }

        // 🆕 Animar campanita
        shakeBell() {
            const bell = this.container.querySelector('.pata-notification-bell');
            if (bell) {
                bell.classList.add('shake');
                setTimeout(function () {
                    bell.classList.remove('shake');
                }, 500);
            }
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
                '<span class="bell-icon">' + ICONS.bell + '</span>' +
                '<span class="pata-notification-badge" style="display: none;">0</span>' +
                '</button>' +
                '<div class="pata-notification-dropdown">' +
                '<div class="pata-notification-header">' +
                '<h3>Notificaciones</h3>' +
                '<button class="pata-mark-all-btn" style="display: none;">✓ Marcar todas</button>' +
                '</div>' +
                '<div class="pata-notification-list"></div>' +
                '<a href="' + (CONFIG.notificationsUrl || (CONFIG.apiUrl + '/miembros/notificaciones')) + '" class="pata-view-all" style="display: none;">' +
                'Ver todas las notificaciones →' +
                '</a>' +
                '</div>' +
                '</div>';

            // Event listeners
            var bell = this.container.querySelector('.pata-notification-bell');
            const handleToggle = function(e) {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                self.toggleDropdown();
            };

            bell.addEventListener('click', handleToggle);
            bell.addEventListener('touchstart', handleToggle, { passive: false });

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
                        '<div class="icon">' + (n.icon || '📢') + '</div>' +
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

        // 🆕 Limpiar al destruir
        destroy() {
            if (this.realtimeChannel) {
                this.supabaseClient.removeChannel(this.realtimeChannel);
            }
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
                    console.log('🔔 Pata Amiga: Memberstack session check:', member ? member.id : 'No user logged in');

                    if (member && member.id) {
                        // Buscar contenedor
                        var container = document.getElementById('pata-amiga-notifications');
                        if (container) {
                            new NotificationWidget('pata-amiga-notifications', member.id);
                            console.log('🔔 Pata Amiga: Notifications system initialized (Realtime) for:', member.id);
                        } else {
                            console.warn('🔔 Pata Amiga: Notifications container #pata-amiga-notifications not found in page');
                        }
                    } else {
                        console.log('🔔 Pata Amiga: Notifications disabled (User not logged in)');
                    }
                }).catch(function (err) {
                    console.error('🔔 Pata Amiga: Memberstack error:', err);
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

