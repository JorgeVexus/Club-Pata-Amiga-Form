/**
 * 🔔 Club Pata Amiga - Neo-Brutalist Real-Time Notifications Widget
 * 
 * Widget de notificaciones en tiempo real con diseño Neo-Brutalista.
 * Utiliza polling optimizado contra la API segura para evitar problemas de RLS.
 * 
 * USO EN WEBFLOW:
 * 1. En el Head Code de Webflow, pega:
 * <script src="https://app.pataamiga.mx/widgets/realtime-notifications.js"></script>
 * 
 * 2. Añade un div donde quieras la campanita en el Nav Bar:
 * <div id="realtime-bell"></div>
 */

(function () {
    'use strict';

    // ========== CONFIGURACIÓN ==========
    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        // Mapeo de rutas de backend -> rutas de Webflow (Smart Linking)
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

    // ========== ICONOS ==========
    const ICONS = {
        bell: `<svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
            <g clip-path="url(#clip_bell_neo)">
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
                <clipPath id="clip_bell_neo">
                    <rect width="50" height="50" fill="white"/>
                </clipPath>
            </defs>
        </svg>`
    };

    // ========== ESTILOS NEO-BRUTALISTAS ==========
    const STYLES = `
        /* Importar fuente Outfit por si no está cargada */
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');

        /* Container - inline para el navbar */
        .realtime-bell-widget {
            position: relative;
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
            font-family: 'Outfit', -apple-system, sans-serif;
            color: #FFFFFF;
        }

        .rtbell-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: transparent;
            border: none;
            box-shadow: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.2s ease;
            outline: none;
            padding: 0;
        }

        .rtbell-button:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: scale(1.1);
        }

        .rtbell-button:active {
            transform: scale(0.95);
        }

        .rtbell-button.shake {
            animation: rtShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes rtShake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .rtbell-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            transition: all 0.2s ease;
        }

        .rtbell-button:hover .rtbell-icon {
            color: #FFFFFF;
            filter: drop-shadow(0 0 5px rgba(255,255,255,0.3));
        }

        .rtbell-badge {
            position: absolute;
            top: 0;
            right: 0;
            min-width: 22px;
            height: 22px;
            background: #FF4444;
            color: white;
            font-size: 11px;
            font-weight: 800;
            border-radius: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 6px;
            border: 2px solid #000000;
            box-shadow: 2px 2px 0px #000000;
            animation: rtPulse 2s infinite;
        }

        @keyframes rtPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .rtbell-dropdown {
            position: absolute;
            top: calc(100% + 15px);
            right: 0;
            width: 380px;
            max-height: 450px;
            background: #FFFFFF;
            border: 3px solid #000000;
            border-radius: 16px;
            box-shadow: 8px 8px 0px #000000;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateY(-10px);
            pointer-events: none;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 10000;
        }

        .rtbell-dropdown.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        .rtbell-header {
            padding: 16px 20px;
            background: #00BBB4; /* Turquesa */
            border-bottom: 3px solid #000000;
            border-radius: 13px 13px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .rtbell-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #000000;
            letter-spacing: -0.5px;
            font-family: 'Fraiche', 'Outfit', sans-serif;
        }

        .rtbell-mark-all {
            background: #FFFFFF;
            border: 2px solid #000000;
            color: #000000;
            font-family: 'Outfit', sans-serif;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 2px 2px 0px #000000;
            transition: all 0.1s;
        }

        .rtbell-mark-all:hover {
            background: #FE8F15;
            transform: translate(-1px, -1px);
            box-shadow: 3px 3px 0px #000000;
        }

        .rtbell-mark-all:active {
            transform: translate(2px, 2px);
            box-shadow: 0px 0px 0px #000000;
        }

        .rtbell-list {
            max-height: 350px;
            overflow-y: auto;
            background: #FFF9F2; /* Fondo cálido */
            border-radius: 0 0 13px 13px;
        }
        
        /* Custom Scrollbar */
        .rtbell-list::-webkit-scrollbar {
            width: 8px;
        }
        .rtbell-list::-webkit-scrollbar-track {
            background: #FFF9F2;
            border-left: 2px solid #000000;
        }
        .rtbell-list::-webkit-scrollbar-thumb {
            background: #00BBB4;
            border-left: 2px solid #000000;
        }

        .rtbell-empty {
            padding: 50px 20px;
            text-align: center;
            color: #000000;
        }

        .rtbell-empty-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: inline-block;
            transform: rotate(-10deg);
        }

        .rtbell-empty p {
            font-weight: 600;
            font-size: 15px;
            margin: 0;
        }

        .rtbell-item {
            display: flex;
            gap: 15px;
            padding: 16px 20px;
            border-bottom: 2px solid #000000;
            cursor: pointer;
            transition: background 0.2s;
            background: #FFFFFF;
        }

        .rtbell-item:last-child {
            border-bottom: none;
        }

        .rtbell-item:hover {
            background: #f0f0f0;
        }

        .rtbell-item.unread {
            background: #E6F8F7; /* Turquesa muy claro */
        }
        
        .rtbell-item.unread:hover {
            background: #CCF0EE;
        }

        .rtbell-item-icon {
            font-size: 28px;
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FFFFFF;
            border: 2px solid #000000;
            border-radius: 10px;
            box-shadow: 2px 2px 0px #000000;
        }

        .rtbell-item-content {
            flex: 1;
            min-width: 0;
        }

        .rtbell-item-title {
            font-size: 15px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .rtbell-unread-dot {
            width: 8px;
            height: 8px;
            background: #FF4444;
            border-radius: 50%;
            border: 1px solid #000000;
            display: inline-block;
        }

        .rtbell-item-message {
            font-size: 13px;
            color: #333333;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-weight: 500;
        }

        .rtbell-item-time {
            font-size: 11px;
            color: #666666;
            margin-top: 6px;
            font-weight: 700;
            text-transform: uppercase;
        }

        /* TOAST NEO-BRUTALISTA */
        .rtbell-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FE8F15;
            color: #000000;
            padding: 16px 20px;
            border-radius: 12px;
            border: 3px solid #000000;
            box-shadow: 6px 6px 0px #000000;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 100000;
            animation: rtToastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            max-width: 350px;
            font-family: 'Outfit', sans-serif;
            cursor: pointer;
        }

        @keyframes rtToastIn {
            from { opacity: 0; transform: translateX(120%); }
            to { opacity: 1; transform: translateX(0); }
        }

        .rtbell-toast.fade-out {
            animation: rtToastOut 0.4s ease forwards;
        }

        @keyframes rtToastOut {
            to { opacity: 0; transform: translateX(120%); }
        }

        .rtbell-toast-icon {
            font-size: 28px;
            animation: rtRing 0.5s ease;
            background: #FFFFFF;
            width: 40px;
            height: 40px;
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        @keyframes rtRing {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-25deg); }
            50% { transform: rotate(25deg); }
            75% { transform: rotate(-15deg); }
        }

        .rtbell-toast-text {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.3;
        }

        /* MODAL DE DETALLES NEO-BRUTALISTA */
        .rtbell-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 200000;
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
            background: #FFFFFF;
            width: 90%;
            max-width: 420px;
            border: 4px solid #000000;
            border-radius: 20px;
            padding: 35px 30px;
            box-shadow: 10px 10px 0px #000000;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            font-family: 'Outfit', sans-serif;
        }

        .rtbell-modal-overlay.open .rtbell-modal {
            transform: scale(1);
        }

        .rtbell-modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #FFFFFF;
            border: 2px solid #000000;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            color: #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 2px 2px 0px #000000;
            transition: all 0.1s;
        }

        .rtbell-modal-close:hover {
            background: #FF4444;
            color: white;
            transform: translate(-1px, -1px);
            box-shadow: 3px 3px 0px #000000;
        }
        
        .rtbell-modal-close:active {
            transform: translate(2px, 2px);
            box-shadow: 0px 0px 0px #000000;
        }

        .rtbell-modal-icon {
            font-size: 56px;
            margin-bottom: 20px;
            display: inline-block;
            filter: drop-shadow(3px 3px 0px #000000);
        }

        .rtbell-modal-title {
            font-size: 22px;
            font-weight: 800;
            color: #000000;
            margin-bottom: 15px;
            line-height: 1.2;
            font-family: 'Fraiche', 'Outfit', sans-serif;
        }

        .rtbell-modal-message {
            font-size: 16px;
            color: #333333;
            line-height: 1.6;
            margin-bottom: 30px;
            font-weight: 500;
        }

        .rtbell-modal-btn {
            background: #00BBB4;
            color: #FFFFFF;
            border: 3px solid #000000;
            padding: 14px 24px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 800;
            cursor: pointer;
            width: 100%;
            box-shadow: 4px 4px 0px #000000;
            transition: all 0.1s;
            font-family: 'Outfit', sans-serif;
        }

        .rtbell-modal-btn:hover {
            background: #00a09a;
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0px #000000;
        }
        
        .rtbell-modal-btn:active {
            transform: translate(4px, 4px);
            box-shadow: 0px 0px 0px #000000;
        }

        @media (max-width: 480px) {
            .rtbell-dropdown {
                position: fixed;
                bottom: 80px;
                right: 15px;
                left: 15px;
                width: auto;
                box-shadow: 0px -4px 20px rgba(0,0,0,0.2);
            }
        }
    `;

    // ========== WIDGET CLASS ==========
    class RealtimeNotifications {
        constructor() {
            this.userId = null;
            this.notifications = [];
            this.isOpen = false;
            this.pollingStarted = false;
            this.audioContext = null;
            this.audioUnlocked = false;
            this.initialLoadComplete = false; // Bandera para evitar sonidos en el primer load
        }

        async init() {
            console.log('🔔 [Neo-Brutalist] Notificaciones: Iniciando...');

            this.injectStyles();
            this.setupAudioContext();

            this.userId = await this.getMemberstackUser();
            if (!this.userId) {
                console.log('🔔 Usuario no logueado en Memberstack, widget deshabilitado');
                return;
            }

            this.render();
            await this.loadNotifications(true); // true = es la carga inicial
            this.startPolling();

            console.log('✅ Notificaciones listas para:', this.userId);
        }

        injectStyles() {
            if (document.getElementById('rtbell-neo-styles')) return;
            const style = document.createElement('style');
            style.id = 'rtbell-neo-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        // Habilitar audio solo después de interacción del usuario para cumplir con las políticas del navegador
        setupAudioContext() {
            const unlockAudio = () => {
                if (!this.audioUnlocked) {
                    try {
                        const AudioContext = window.AudioContext || window.webkitAudioContext;
                        this.audioContext = new AudioContext();
                        // Crear un oscilador silencioso para desbloquear el contexto en iOS/Chrome
                        const osc = this.audioContext.createOscillator();
                        osc.connect(this.audioContext.destination);
                        osc.start(0);
                        osc.stop(0);
                        
                        if (this.audioContext.state === 'suspended') {
                            this.audioContext.resume();
                        }
                        this.audioUnlocked = true;
                        
                        // Remover listeners una vez desbloqueado
                        document.removeEventListener('click', unlockAudio);
                        document.removeEventListener('touchstart', unlockAudio);
                    } catch (e) {
                        console.log('Audio API no soportada', e);
                    }
                }
            };

            document.addEventListener('click', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);
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
                    } catch (e) {}
                }
                await new Promise(r => setTimeout(r, 200));
                attempts++;
            }
            return null;
        }

        startPolling() {
            if (this.pollingStarted) return;
            this.pollingStarted = true;

            // Polling cada 12 segundos para ser amigables con el servidor
            setInterval(async () => {
                await this.loadNotifications(false);
            }, 12000);
        }

        async loadNotifications(isInitialLoad = false) {
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/notifications?userId=${this.userId}&limit=10`);
                const data = await res.json();
                
                if (data.success) {
                    const newNotifications = data.notifications || [];
                    
                    // Si no es la carga inicial, buscar si hay notificaciones "nuevas" comparando con el estado anterior
                    if (!isInitialLoad && this.initialLoadComplete) {
                        // Buscar si el ID más reciente es nuevo y no está leído
                        if (newNotifications.length > 0) {
                            const latestNew = newNotifications[0];
                            const latestOld = this.notifications[0];
                            
                            if (!latestOld || latestNew.id !== latestOld.id) {
                                // Es una notificación completamente nueva
                                if (!latestNew.is_read) {
                                    this.triggerAlert(latestNew);
                                }
                            }
                        }
                    }
                    
                    this.notifications = newNotifications;
                    this.updateUI();
                    
                    if (isInitialLoad) {
                        this.initialLoadComplete = true;
                    }
                }
            } catch (e) {
                console.error('Error cargando notificaciones:', e);
            }
        }

        triggerAlert(notif) {
            this.showToast(notif);
            this.playSound();
            this.shakeBell();
        }

        async markAsRead(id) {
            try {
                // Optimistic UI update
                this.notifications = this.notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                );
                this.updateUI();

                // Backend call
                await fetch(`${CONFIG.apiUrl}/api/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });
            } catch (e) {
                console.error('Error marcando leída:', e);
            }
        }

        async markAllAsRead() {
            try {
                this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
                this.updateUI();

                await fetch(`${CONFIG.apiUrl}/api/notifications/mark-all-read`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId })
                });
            } catch (e) {
                console.error('Error marcando todas leídas:', e);
            }
        }

        get unreadCount() {
            return this.notifications.filter(n => !n.is_read).length;
        }

        formatTime(dateStr) {
            const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
            if (diff < 1) return 'Ahora';
            if (diff < 60) return `${diff}m`;
            if (diff < 1440) return `${Math.floor(diff / 60)}h`;
            return `${Math.floor(diff / 1440)}d`;
        }

        showToast(notif) {
            const existing = document.querySelector('.rtbell-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'rtbell-toast';
            toast.innerHTML = `
                <span class="rtbell-toast-icon">${notif.icon || ICONS.bell}</span>
                <div class="rtbell-toast-content">
                    <div class="rtbell-toast-text">${notif.title || 'Nueva notificación'}</div>
                </div>
            `;
            
            // Clickeable para abrir
            toast.addEventListener('click', () => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 400);
                this.handleNotificationClick(notif);
            });

            document.body.appendChild(toast);

            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.classList.add('fade-out');
                    setTimeout(() => toast.remove(), 400);
                }
            }, 5000);
        }

        playSound() {
            if (!this.audioUnlocked || !this.audioContext) return;

            try {
                const ctx = this.audioContext;
                if (ctx.state === 'suspended') ctx.resume();
                
                const now = ctx.currentTime;

                // Sonido vibrante y claro (Acorde mayor)
                const frequencies = [880, 1108.73, 1318.51]; // A5, C#6, E6

                frequencies.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'triangle'; // Un sonido más retro/8-bit que sine
                    osc.frequency.value = freq;

                    const volume = 0.1 / (i + 1);
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

                    osc.start(now);
                    osc.stop(now + 0.6);
                });

                // Chime secundario para dar "brillo"
                setTimeout(() => {
                    try {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.type = 'sine';
                        osc.frequency.value = 1760; // A6
                        gain.gain.setValueAtTime(0, ctx.currentTime);
                        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                        osc.start(ctx.currentTime);
                        osc.stop(ctx.currentTime + 0.4);
                    } catch(e) {}
                }, 150);

            } catch (e) {
                console.error("Error al reproducir sonido", e);
            }
        }

        shakeBell() {
            const buttons = document.querySelectorAll('.rtbell-button');
            buttons.forEach(btn => {
                btn.classList.add('shake');
                setTimeout(() => btn.classList.remove('shake'), 600);
            });
        }

        // ================= LÓGICA DE CLICK INTELIGENTE =================
        handleNotificationClick(notif) {
            // 1. Marcar como leída inmediatamente
            if (!notif.is_read) {
                this.markAsRead(notif.id);
            }

            // 2. Resolver URL
            const incomingLink = notif.link;

            // Si coincide con ruta mapeada internamente
            if (incomingLink && CONFIG.urls[incomingLink]) {
                console.log(`🔀 Rutéo inteligente: ${incomingLink} -> ${CONFIG.urls[incomingLink]}`);
                window.location.href = CONFIG.urls[incomingLink];
                return;
            }

            // Si es absoluta
            if (incomingLink && (incomingLink.startsWith('http') || incomingLink.startsWith('https'))) {
                window.location.href = incomingLink;
                return;
            }

            // 3. Fallback: Modal
            this.showDetailModal(notif);
        }

        showDetailModal(notif) {
            const overlay = document.querySelector('.rtbell-modal-overlay');
            const icon = overlay.querySelector('.rtbell-modal-icon');
            const title = overlay.querySelector('.rtbell-modal-title');
            const message = overlay.querySelector('.rtbell-modal-message');

            icon.innerHTML = notif.icon || ICONS.bell;
            title.textContent = notif.title;
            message.textContent = notif.message;

            overlay.classList.add('open');
        }

        closeDetailModal() {
            const overlay = document.querySelector('.rtbell-modal-overlay');
            if(overlay) overlay.classList.remove('open');
        }

        render() {
            const containers = document.querySelectorAll('#realtime-bell, .realtime-bell-container, #pata-amiga-notifications');
            let targetContainers = Array.from(containers);

            if (targetContainers.length === 0) {
                const defaultContainer = document.createElement('div');
                defaultContainer.id = 'realtime-bell';
                document.body.appendChild(defaultContainer);
                targetContainers = [defaultContainer];
            }

            // 1. Renderizar el Modal solo una vez en el body
            if (!document.querySelector('.rtbell-modal-overlay')) {
                const modalHtml = `
                <!-- MODAL DE DETALLES NEO-BRUTALISTA -->
                <div class="rtbell-modal-overlay">
                    <div class="rtbell-modal">
                        <button class="rtbell-modal-close">&times;</button>
                        <span class="rtbell-modal-icon">${ICONS.bell}</span>
                        <div class="rtbell-modal-title">Título</div>
                        <div class="rtbell-modal-message">Mensaje</div>
                        <button class="rtbell-modal-btn">ENTENDIDO</button>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                const modalOverlay = document.querySelector('.rtbell-modal-overlay');
                const modalCloseBtn = document.querySelector('.rtbell-modal-close');
                const modalActionBtn = document.querySelector('.rtbell-modal-btn');

                modalCloseBtn.addEventListener('click', () => this.closeDetailModal());
                modalActionBtn.addEventListener('click', () => this.closeDetailModal());
                document.addEventListener('click', (e) => {
                    if (e.target === modalOverlay) this.closeDetailModal();
                });
            }

            // 2. Renderizar el Widget de campana en cada contenedor encontrado
            targetContainers.forEach(container => {
                container.innerHTML = `
                    <div class="realtime-bell-widget">
                        <button class="rtbell-button">
                            <span class="rtbell-icon">${ICONS.bell}</span>
                            <span class="rtbell-badge" style="display:none;">0</span>
                        </button>
                        <div class="rtbell-dropdown">
                            <div class="rtbell-header">
                                <h3>NOTIFICACIONES</h3>
                                <button class="rtbell-mark-all" style="display:none;">Marcar leídas</button>
                            </div>
                            <div class="rtbell-list">
                                <div class="rtbell-empty">
                                    <div class="rtbell-empty-icon">📭</div>
                                    <p>No hay notificaciones nuevas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // 3. Adjuntar eventos para este widget específico
                const btn = container.querySelector('.rtbell-button');
                const dropdown = container.querySelector('.rtbell-dropdown');
                const markAllBtn = container.querySelector('.rtbell-mark-all');

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isCurrentlyOpen = dropdown.classList.contains('open');
                    
                    // Cerrar todos los demás dropdowns primero (si hay varios en pantalla)
                    document.querySelectorAll('.rtbell-dropdown').forEach(d => d.classList.remove('open'));
                    
                    if (!isCurrentlyOpen) {
                        dropdown.classList.add('open');
                    }
                });

                markAllBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.markAllAsRead();
                });

                // Cerrar dropdown al hacer click afuera (una sola vez por contenedor)
                document.addEventListener('click', (e) => {
                    if (dropdown.classList.contains('open') && !e.target.closest('.realtime-bell-widget')) {
                        dropdown.classList.remove('open');
                    }
                });
            });
        }

        updateUI() {
            const count = this.unreadCount;
            const widgets = document.querySelectorAll('.realtime-bell-widget');

            widgets.forEach(widget => {
                const badge = widget.querySelector('.rtbell-badge');
                const markAllBtn = widget.querySelector('.rtbell-mark-all');
                const list = widget.querySelector('.rtbell-list');

                if (!badge || !list) return;

                // Badge Update
                if (count > 0) {
                    badge.textContent = count > 9 ? '9+' : count;
                    badge.style.display = 'flex';
                    badge.style.animation = 'none';
                    badge.offsetHeight; /* trigger reflow */
                    badge.style.animation = 'rtPulse 2s infinite';
                    if (markAllBtn) markAllBtn.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                    if (markAllBtn) markAllBtn.style.display = 'none';
                }

                // List Update
                if (this.notifications.length === 0) {
                    list.innerHTML = `
                        <div class="rtbell-empty">
                            <div class="rtbell-empty-icon">📭</div>
                            <p>Bandeja vacía</p>
                        </div>
                    `;
                    return;
                }

                list.innerHTML = this.notifications.slice(0, 15).map(n => `
                    <div class="rtbell-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
                        <div class="rtbell-item-icon">${n.icon || '📢'}</div>
                        <div class="rtbell-item-content">
                            <div class="rtbell-item-title">
                                ${n.title}
                                ${!n.is_read ? '<span class="rtbell-unread-dot"></span>' : ''}
                            </div>
                            <div class="rtbell-item-message">${n.message}</div>
                            <div class="rtbell-item-time">${this.formatTime(n.created_at)}</div>
                        </div>
                    </div>
                `).join('');

                // Re-attach click events
                list.querySelectorAll('.rtbell-item').forEach(item => {
                    item.addEventListener('click', () => {
                        document.querySelectorAll('.rtbell-dropdown').forEach(d => d.classList.remove('open'));
                        const id = item.dataset.id;
                        const notif = this.notifications.find(n => n.id === id);
                        if (notif) {
                            this.handleNotificationClick(notif);
                        }
                    });
                });
            });
        }
    }

    // Inicializar el widget cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new RealtimeNotifications().init());
    } else {
        new RealtimeNotifications().init();
    }
})();
