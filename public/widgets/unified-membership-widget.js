/**
 * 🎡 Club Pata Amiga - Unified Membership Widget (Tabs + Carencia + Apelación)
 * 
 * Este widget unifica el panel de período de carencia y el sistema de apelaciones.
 * Se adapta dinámicamente al estado de cada mascota individualmente.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        brandColor: '#00BBB4',
        progressColor: '#9fd406',
        countdownBg: '#C8E600'
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');

        .pata-unified-panel {
            background-color: #FFFFFF;
            border-radius: 30px;
            padding: 40px;
            max-width: 920px;
            margin: 0 auto 20px auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            font-family: 'Outfit', sans-serif;
            color: #1A1A1A;
            display: none;
            position: relative;
            overflow: hidden;
        }

        .pata-unified-panel.show { display: block; animation: pataFadeIn 0.5s ease-out; }

        @keyframes pataFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Yellow Theme Support */
        .pata-theme-yellow .pata-external-greeting { color: #FFFFFF; }
        .pata-theme-yellow .pata-welcome-title { color: #FFFFFF; }
        .pata-theme-yellow .pata-welcome-subtitle { color: #FFFFFF; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }

        /* External Greeting */
        .pata-external-greeting {
            max-width: 920px;
            margin: 40px auto 20px auto;
            font-family: 'Outfit', sans-serif;
            color: #FFFFFF;
            text-align: left;
        }

        .pata-welcome-title {
            font-size: 100px;
            font-weight: 900;
            margin: 0;
            line-height: 0.9;
            letter-spacing: -2px;
        }

        .pata-welcome-subtitle {
            font-size: 20px;
            font-weight: 600;
            margin: 20px 0 0 0;
            line-height: 1.4;
            max-width: 700px;
            opacity: 0.9;
        }

        .pata-pet-tabs { 
            display: flex; 
            gap: 8px; 
            margin-bottom: 20px; 
            flex-wrap: wrap;
            background: #F0F2F5;
            padding: 8px;
            border-radius: 60px;
            width: fit-content;
        }

        .pata-tab-label {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #1A1A1A;
            display: block;
        }

        .pata-tab-btn {
            background: transparent;
            border: 1px solid #E0E0E0;
            border-radius: 50px;
            padding: 10px 24px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #A0A0A0;
            font-size: 16px;
        }

        .pata-tab-btn:hover { background: rgba(0, 0, 0, 0.05); }
        .pata-tab-btn.active { 
            background: #00BBB4; 
            color: #FFFFFF; 
            border-color: #00BBB4;
            box-shadow: 0 4px 15px rgba(0, 187, 180, 0.2);
        }

        /* Approved View Layout */
        .pata-approved-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 30px;
            align-items: flex-start;
        }

        @media (max-width: 850px) {
            .pata-approved-grid { grid-template-columns: 1fr; }
        }

        .pata-carencia-title {
            font-size: 44px;
            font-weight: 900;
            color: #00BBB4;
            margin: 0 0 10px 0;
            line-height: 1.1;
        }

        .pata-carencia-subtitle {
            font-size: 18px;
            font-weight: 700;
            color: #1A1A1A;
            margin-bottom: 25px;
        }

        .pata-carencia-remaining {
            font-size: 22px;
            font-weight: 700;
            color: #00BBB4;
            margin-bottom: 30px;
        }

        .pata-carencia-remaining strong {
            font-size: 28px;
            font-weight: 900;
        }

        /* Progress Bar Revamp */
        .pata-progress-container-v2 {
            margin: 40px 0;
        }

        .pata-progress-header {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        .pata-bar-v2 {
            height: 24px;
            background: #FFFFFF;
            border-radius: 50px;
            border: 2px solid #1A1A1A;
            padding: 3px;
            position: relative;
        }

        .pata-fill-v2 {
            height: 100%;
            background: #00BBB4;
            border-radius: 50px;
            transition: width 1s ease;
        }

        .pata-bar-labels {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 700;
            margin-top: 10px;
        }

        /* Pet Profile Cards */
        .pata-pet-profile {
            display: flex;
            gap: 15px;
        }

        .pata-pet-photo-box {
            width: 160px;
            height: 160px;
            background: #00BBB4;
            border-radius: 24px;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: center;
        }

        .pata-pet-photo-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .pata-pet-info-box {
            flex: 1;
            background: #00BBB4;
            border-radius: 24px;
            padding: 20px;
            color: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .pata-pet-info-box h3 {
            font-size: 20px;
            font-weight: 900;
            margin: 0 0 10px 0;
        }

        .pata-pet-info-box ul {
            list-style: none;
            padding: 0;
            margin: 0 0 15px 0;
            font-size: 14px;
            font-weight: 700;
        }

        .pata-pet-info-box li {
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .pata-pet-info-box li::before {
            content: "•";
            font-size: 18px;
        }

        /* Modal Styles */
        .pata-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        }

        .pata-modal-overlay.show { display: flex; }

        .pata-modal {
            background: #FFFFFF;
            width: 90%;
            max-width: 500px;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            animation: pataModalSlideUp 0.3s ease-out;
        }

        @keyframes pataModalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .pata-modal-header {
            padding: 25px;
            background: #F8FBFF;
            border-bottom: 1px solid #E0E0E0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .pata-modal-title { font-size: 20px; font-weight: 900; color: #1A1A1A; margin: 0; }
        .pata-modal-close { background: none; border: none; font-size: 28px; cursor: pointer; color: #A0A0A0; line-height: 1; }

        .pata-modal-body { padding: 30px; }
        .pata-modal-pet-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .pata-detail-item { margin-bottom: 15px; }
        .pata-detail-label { font-size: 13px; font-weight: 700; color: #A0A0A0; text-transform: uppercase; margin-bottom: 5px; }
        .pata-detail-value { font-size: 16px; font-weight: 900; color: #1A1A1A; }

        .pata-modal-footer {
            padding: 20px 30px;
            border-top: 1px solid #E0E0E0;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .pata-btn-ver-detalles {
            background: #FFBD12;
            color: #1A1A1A !important;
            border: none;
            border-radius: 50px;
            padding: 8px 15px;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
            display: inline-block;
            text-align: center;
        }

        /* Orange Banner Alert */
        .pata-orange-alert {
            background: #FFBD12;
            border-radius: 15px;
            padding: 15px 25px;
            display: flex;
            gap: 20px;
            align-items: center;
            margin-top: 30px;
            color: #1A1A1A;
        }

        .pata-orange-alert-icon { font-size: 32px; }
        .pata-orange-alert-text { font-size: 14px; font-weight: 700; line-height: 1.4; }
        .pata-orange-alert-text strong { font-size: 15px; }

        /* Contenido del Panel */
        .pata-panel-container { position: relative; }

        @media (max-width: 768px) { 
            .pata-pet-tabs { width: 100%; justify-content: center; }
            .pata-welcome-title { font-size: 60px; }
        }

        .pata-title { font-size: 50px; font-weight: 900; margin: 0 0 15px 0; color: #1A1A1A; line-height: 1.1; }
        .pata-subtitle { font-size: 18px; font-weight: 600; margin: 0 0 20px 0; color: #444; }

        /* Estado Activo - Circular Progress */
        .pata-active-container {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 40px;
            align-items: center;
        }

        @media (max-width: 768px) {
            .pata-active-container { grid-template-columns: 1fr; justify-items: center; }
        }

        .pata-circular-progress {
            width: 180px;
            height: 180px;
            position: relative;
        }

        .pata-circular-svg {
            transform: rotate(-90deg);
            width: 100%;
            height: 100%;
        }

        .pata-circular-bg {
            fill: none;
            stroke: #F0F2F5;
            stroke-width: 12;
        }

        .pata-circular-fill {
            fill: none;
            stroke: #9FD406;
            stroke-width: 12;
            stroke-linecap: round;
            transition: stroke-dasharray 1s ease;
        }

        .pata-circular-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }

        .pata-days-num { font-size: 48px; font-weight: 900; line-height: 1; color: #1A1A1A; }
        .pata-days-label { font-size: 14px; font-weight: 600; color: #888; text-transform: uppercase; }

        .pata-info-card {
            background: #F8FBFF;
            border-left: 6px solid #00BBB4;
            padding: 24px;
            border-radius: 20px;
        }

        .pata-info-title { font-size: 20px; font-weight: 700; color: #00BBB4; margin-bottom: 8px; }
        .pata-info-text { font-size: 15px; color: #555; line-height: 1.5; margin: 0; }

        /* Horizontal Progress Bar */
        .pata-horizontal-progress-container {
            margin: 30px 0;
        }

        .pata-progress-labels-top {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 12px;
        }

        .pata-progress-bar-horizontal {
            height: 22px;
            background: #FFFFFF;
            border-radius: 50px;
            overflow: hidden;
            border: 1px solid #E0E0E0;
            padding: 3px;
        }

        .pata-progress-fill-horizontal {
            height: 100%;
            background: #00BBB4;
            border-radius: 50px;
            transition: width 1s ease;
        }

        /* Checklist */
        .pata-checklist {
            margin-top: 30px;
        }

        .pata-checklist-title {
            font-size: 18px;
            font-weight: 900;
            color: #1A1A1A;
            margin-bottom: 20px;
            text-align: center;
        }

        .pata-checklist-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
            font-weight: 600;
            font-size: 16px;
            color: #1A1A1A;
        }

        .pata-checklist-icon {
            color: #9FD406;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pata-disclaimer {
            font-size: 12px;
            color: #666;
            margin-top: 30px;
            text-align: left;
        }

        /* Estado Rechazado */
        .pata-rejected-card {
            background: #FFF2F2;
            border: 2px solid #FFCDD2;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            width: 100%;
        }

        .pata-rejected-icon { font-size: 48px; margin-bottom: 20px; display: block; }
        .pata-rejected-title { font-size: 28px; font-weight: 900; color: #D32F2F; margin-bottom: 12px; }
        .pata-rejected-text { font-size: 16px; color: #777; margin-bottom: 24px; }

        /* Botones */
        .pata-btn {
            background: #1A1A1A;
            color: #fff;
            padding: 16px 36px;
            border-radius: 60px;
            border: none;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            text-decoration: none !important;
        }
        .pata-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
        .pata-btn-white { background: #fff; color: #1A1A1A; }
        .pata-btn-brand { background: #00BBB4; color: #FFFFFF; }
        .pata-btn-red { background: #D32F2F; }
        .pata-btn-outline { background: transparent; border: 2px solid #1A1A1A; color: #1A1A1A; }

        .pata-btn-conocer {
            background: #00BBB4;
            color: #000000 !important;
            padding: 18px 48px;
            font-weight: 900;
            text-transform: none;
        }

        /* Decoration */
        .pata-decoration-paws {
            position: absolute;
            bottom: -20px;
            right: -20px;
            width: 150px;
            opacity: 0.05;
            pointer-events: none;
        }
    `;


    class UnifiedWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
            this.membershipStatus = 'approved';
            this.userExtra = { lastAdminResponse: '', actionRequiredFields: [] };
            this.currentIndex = 0;
            this.showAppealForm = false;
            // 🆕 Estados para modal de actualización
            this.showUpdateModal = false;
            this.uploadFiles = { photo1: null, photo2: null };
            this.uploading = false;

            if (!this.container) return;
            this.init();
        }

        async init() {
            console.log('🚀 Unified Widget: Starting initialization...');
            this.injectStyles();

            try {
                console.log('⏳ Unified Widget: Waiting for Memberstack...');
                await this.waitForMemberstack();

                if (!this.member) {
                    console.warn('⚠️ Unified Widget: No member session found.');
                    this.container.innerHTML = '<!-- Pata Amiga: No member session -->';
                    return;
                }
                console.log('✅ Unified Widget: Member loaded:', this.member.id);

                console.log('⏳ Unified Widget: Loading pet data...');
                await this.loadData();

                console.log('📊 Unified Widget: Pets found:', this.pets.length);

                if (this.pets.length > 0 || this.membershipStatus === 'pending') {
                    console.log('✨ Unified Widget: Rendering panel...');
                    this.container.classList.add('show');
                    this.render();
                } else {
                    console.warn('⚠️ Unified Widget: No pets found for this user in Supabase.');
                    this.container.innerHTML = `
                        <div class="pata-unified-panel show" style="background: rgba(0,0,0,0.4);">
                            <div style="color:white; padding:20px; text-align:center; font-weight:600;">
                                👋 Hola ${this.member.customFields?.['first-name'] || 'Socio'}. <br>
                                <span style="font-size: 14px; font-weight: 400; opacity: 0.8;">No encontramos mascotas registradas o están pendientes de sincronización.</span>
                            </div>
                        </div>
                    `;
                    this.container.classList.add('show');
                }
            } catch (err) {
                console.error('❌ Unified Widget: Critical error during init:', err);
                this.container.innerHTML = `<div style="color:red; padding:10px; font-size:12px;">Widget Error: ${err.message}</div>`;
            }
        }

        injectStyles() {
            if (document.getElementById('pata-unified-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-unified-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        async waitForMemberstack() {
            return new Promise((resolve) => {
                let attempts = 0;
                const check = setInterval(() => {
                    attempts++;
                    if (window.$memberstackDom) {
                        clearInterval(check);
                        window.$memberstackDom.getCurrentMember().then(({ data }) => {
                            this.member = data;
                            resolve();
                        });
                    } else if (attempts > 50) { clearInterval(check); resolve(); }
                }, 100);
            });
        }

        async loadData() {
            try {
                const url = `${CONFIG.apiUrl}/api/user/pets?userId=${this.member.id}`;
                console.log('📡 Unified Widget: Fetching from:', url);
                const res = await fetch(url);
                const data = await res.json();
                console.log('📥 Unified Widget: Received data:', data);

                if (data.success) {
                    this.pets = data.pets || [];
                    this.membershipStatus = (data.membership_status || 'approved').toLowerCase();
                    console.log(`📊 Unified Widget: Status="${this.membershipStatus}", Pets=${this.pets.length}`);
                    this.userExtra = {
                        lastAdminResponse: data.last_admin_response || '',
                        actionRequiredFields: data.action_required_fields || []
                    };
                } else {
                    console.error('❌ Unified Widget: API error:', data.error);
                }
            } catch (err) {
                console.error('❌ Unified Widget: Fetch failed:', err);
            }
        }

        calculateCarencia(pet) {
            const now = new Date();
            const start = new Date(pet.created_at);

            // Lógica de carencia refinada:
            // 1. Adoptado o RUAC -> 90 días
            // 2. Mestizo -> 120 días
            // 3. Estándar -> 180 días

            let totalDays = 180;
            if (pet.is_adopted || pet.ruac) {
                totalDays = 90;
            } else if (pet.is_mixed) {
                totalDays = 120;
            }

            const diffTime = Math.abs(now - start);
            const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, totalDays - daysPassed);
            const percentage = Math.min(100, Math.round((daysPassed / totalDays) * 100));

            return { daysRemaining, percentage, totalDays };
        }

        render() {
            const firstName = this.member.customFields?.['first-name'] || 'Socio';

            // 🆕 Lógica de Estatus Global: Solo mostramos la vista global si:
            // 1. El estatus es 'pending' Y (no hay mascotas o todas están en 'pending')
            const allPetsPending = this.pets.length === 0 || this.pets.every(p => p.status === 'pending');
            const isPending = this.membershipStatus === 'pending' && allPetsPending;

            if (isPending) {
                console.log('⏳ Unified Widget: User status is pending. Rendering global pending view.');
                this.container.innerHTML = this.renderUserPendingView(firstName);
                this.container.classList.add('show');
                return;
            }

            const pet = this.pets[this.currentIndex];
            const isApproved = this.membershipStatus === 'active' || this.membershipStatus === 'approved';

            // Actualizar el tema del contenedor (opcional: inyectar clase al body o parent)
            if (isApproved) {
                this.container.parentElement?.classList.add('pata-theme-yellow');
                // Intentar poner fondo amarillo si el widget es el componente principal
                document.body.style.backgroundColor = '#FFBD12';
            } else {
                this.container.parentElement?.classList.remove('pata-theme-yellow');
                document.body.style.backgroundColor = ''; // Reset
            }

            if (!pet) {
                this.container.innerHTML = `<div class="pata-welcome-title" style="color:white; padding:40px;">Cargando mascotas...</div>`;
                return;
            }

            const activeGreeting = `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola, ${firstName}! bienvenida</h1>
                    <p class="pata-welcome-subtitle">
                        Tu membresía está activa, pero algunos beneficios estarán disponibles pronto.<br>
                        Nos encanta tenerte aquí. Mientras termina tu periodo de carencia, sigue explorando lo que Pata Amiga tiene para ti.
                    </p>
                </div>
            `;

            const pendingGreeting = `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola, ${firstName}!</h1>
                    <p class="pata-welcome-subtitle">
                        Gracias por tu paciencia<br>
                        En un máximo de 24 horas te notificaremos por correo o WhatsApp el resultado. Mientras tanto, puedes entrar aquí cuando quieras para ver tu estatus actualizado.
                    </p>
                </div>
            `;

            this.container.innerHTML = `
                ${isApproved ? activeGreeting : pendingGreeting}

                <div class="pata-unified-panel show">
                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-decoration-paws">
                    

                    <div class="pata-pet-tabs">
                        ${this.pets.map((p, i) => `
                            <button class="pata-tab-btn ${i === this.currentIndex ? 'active' : ''}" data-idx="${i}">
                                ${p.type === 'Gato' ? '🐱' : '🐕'} ${p.name}
                            </button>
                        `).join('')}
                    </div>
 
                    <div class="pata-panel-container">
                        ${this.renderPetContent(pet)}
                    </div>
                </div>
            `;

            this.attachEvents();
        }

        renderUserPendingView(firstName) {
            return `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola, ${firstName}!</h1>
                    <p class="pata-welcome-subtitle">
                        Gracias por unirte a la manada. <br>
                        Estamos verificando tu perfil para que tú y tus mascotas disfruten de todos los beneficios de Pata Amiga.
                    </p>
                </div>

                <div class="pata-unified-panel show">
                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-decoration-paws">
                    
                    <div class="pata-pending-view">
                        <h2 class="pata-title" style="margin-bottom: 8px;">tu membresía está en revisión</h2>
                        <p style="font-size: 16px; color: #444; line-height: 1.4; margin-bottom: 30px;">
                            Nuestro equipo está validando tus datos de registro. En menos de 24 horas recibirás una confirmación.
                        </p>

                        <div class="pata-horizontal-progress-container">
                            <div class="pata-progress-labels-top">
                                <span>Registro recibido</span>
                                <span>Validando perfil...</span>
                            </div>
                            <div class="pata-progress-bar-horizontal">
                                <div class="pata-progress-fill-horizontal" style="width: 60%;"></div>
                            </div>
                        </div>

                        <div class="pata-checklist">
                            <h3 class="pata-checklist-title">¿Qué estamos validando?</h3>
                            
                            <div class="pata-checklist-item">
                                <span class="pata-checklist-icon">✔</span>
                                <span>Tus datos de contacto</span>
                            </div>
                            <div class="pata-checklist-item">
                                <span class="pata-checklist-icon">✔</span>
                                <span>Información de facturación</span>
                            </div>
                            <div class="pata-checklist-item">
                                <span class="pata-checklist-icon">✔</span>
                                <span>Verificación de identidad</span>
                            </div>
                        </div>

                        <p class="pata-disclaimer">
                            Te notificaremos por correo una vez que tu cuenta sea activada.
                        </p>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://www.pataamiga.mx/beneficios" class="pata-btn pata-btn-conocer">
                                Conocer beneficios de socio
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        renderPetContent(pet) {
            if (pet.status === 'approved') {
                return this.renderApprovedContent(pet);
            } else if (pet.status === 'rejected') {
                return this.renderRejectedContent(pet);
            } else if (pet.status === 'action_required') {
                return this.renderActionRequiredContent(pet);
            } else if (pet.status === 'appealed') {
                return this.renderAppealedContent(pet);
            } else {
                return this.renderPendingContent(pet);
            }
        }

        renderPendingContent(pet) {
            return `
                <div class="pata-pending-view">
                    <h2 class="pata-title" style="margin-bottom: 8px;">tu solicitud está en revisión</h2>
                    <p style="font-size: 16px; color: #444; line-height: 1.4; margin-bottom: 30px;">
                        Nuestro equipo la está revisando con calma y cuidado (así como cuidamos a cada miembro de la manada).
                    </p>

                    <div class="pata-horizontal-progress-container">
                        <div class="pata-progress-labels-top">
                            <span>Solicitud enviada</span>
                            <span>En revisión...</span>
                        </div>
                        <div class="pata-progress-bar-horizontal">
                            <div class="pata-progress-fill-horizontal" style="width: 85%;"></div>
                        </div>
                    </div>

                    <div class="pata-checklist">
                        <h3 class="pata-checklist-title">¿Qué estamos revisando?</h3>
                        
                        <div class="pata-checklist-item">
                            <span class="pata-checklist-icon">✔</span>
                            <span>Información de tu mascota</span>
                        </div>
                        <div class="pata-checklist-item">
                            <span class="pata-checklist-icon">✔</span>
                            <span>Documentación enviada</span>
                        </div>
                        <div class="pata-checklist-item">
                            <span class="pata-checklist-icon">✔</span>
                            <span>Datos de contacto</span>
                        </div>
                    </div>

                    <p class="pata-disclaimer">
                        No se hará ningún cargo definitivo hasta que tu solicitud sea aprobada.
                    </p>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://www.pataamiga.mx/beneficios" class="pata-btn pata-btn-conocer">
                            Conocer más de pata amiga
                        </a>
                    </div>
                </div>
            `;
        }

        // 🆕 Renderizar contenido para mascotas con apelación en revisión
        renderAppealedContent(pet) {
            const appealMessage = pet.appeal_message || 'Sin mensaje registrado.';
            const appealCount = pet.appeal_count || 1;
            const appealDate = pet.appealed_at ? new Date(pet.appealed_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha no disponible';

            return `
                <div class="pata-alert-banner" style="background: #E8F5E9; border-left: 4px solid #7B1FA2; flex-direction: column; align-items: flex-start;">
                    <div style="display:flex; gap:12px; align-items:center; width:100%; margin-bottom:12px;">
                        <span style="font-size:24px;">⚖️</span>
                        <div>
                            <div class="pata-subtitle" style="margin:0; color:#4A148C;">Apelación en Revisión para ${pet.name}</div>
                            <p style="margin:4px 0 0 0; font-size:12px; color:#616161;">Enviada el ${appealDate} • Apelación ${appealCount} de 2</p>
                        </div>
                    </div>
                    
                    <div style="background:#fff; padding:12px 16px; border-radius:8px; width:100%; margin-bottom:12px;">
                        <p style="margin:0; font-size:13px; color:#424242; font-weight:600;">Tu mensaje:</p>
                        <p style="margin:8px 0 0 0; font-size:14px; color:#1A1A1A; font-style:italic;">"${appealMessage}"</p>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <p style="margin:0; font-size:13px; color:#616161;">
                            <span style="font-weight:600;">📋 Estado:</span> Nuestro equipo está revisando tu caso.
                        </p>
                        <button class="pata-btn-history" data-pet-id="${pet.id}" style="background:#7B1FA2; color:#fff; border:none; padding:8px 16px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; transition:0.2s;">
                            📜 Ver historial
                        </button>
                    </div>
                </div>
            `;
        }

        renderApprovedContent(pet) {
            const carencia = this.calculateCarencia(pet);
            const petImage = pet.photo_url || 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';

            // Lógica de mensaje de aliento
            let encouragement = "¡Sigue así!";
            if (carencia.percentage > 75) encouragement = "¡Ya casi lo logras!";
            else if (carencia.percentage > 50) encouragement = "¡Ya recorriste más de la mitad del camino!";
            else if (carencia.percentage > 25) encouragement = "¡Vas por excelente camino!";

            return `
                <div class="pata-approved-grid">
                    <div class="pata-approved-main">
                        <h2 class="pata-carencia-title">tu periodo de carencia</h2>
                        <p class="pata-carencia-subtitle">${encouragement}</p>
                        
                        <div class="pata-carencia-remaining">
                            Faltan <strong>${carencia.daysRemaining} días</strong> para activar tu fondo solidario completo
                        </div>

                        <div class="pata-progress-container-v2">
                            <div class="pata-progress-header">
                                <span>Inicio de membresía</span>
                                <span style="color: #00BBB4; font-weight: 900;">${carencia.percentage}% completado</span>
                            </div>
                            <div class="pata-bar-v2">
                                <div class="pata-fill-v2" style="width: ${carencia.percentage}%;"></div>
                            </div>
                            <div class="pata-bar-labels">
                                <span>Día 1</span>
                                <span>Día 180</span>
                            </div>
                        </div>
                    </div>

                    <div class="pata-approved-sidebar">
                        <div class="pata-pet-profile">
                            <div class="pata-pet-photo-box">
                                <img src="${petImage}" alt="${pet.name}">
                            </div>
                            <div class="pata-pet-info-box">
                                <h3>${pet.name}</h3>
                                <ul>
                                    <li>${pet.age || '1 año'}</li>
                                    <li>${pet.type || 'Lomito'}</li>
                                    <li>${pet.breed || 'Mestizo'}</li>
                                </ul>
                                <button class="pata-btn-ver-detalles" id="pata-btn-pet-details" data-pet-id="${pet.id}">Ver detalles</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pata-orange-alert">
                    <div class="pata-orange-alert-icon">🔔</div>
                    <div class="pata-orange-alert-text">
                        <strong>¿Adoptaste a alguno de tus compañeros o tienes RUAC?</strong><br>
                        Puedes acelerar tu acceso al fondo. Contáctanos para validar tus documentos.
                    </div>
                </div>
            `;
        }

        renderRejectedContent(pet) {
            const appealCount = pet.appeal_count || 0;
            const maxAppeals = 2;
            const canAppeal = appealCount < maxAppeals;
            const adminMsg = pet.last_admin_response || pet.admin_notes;

            return `
                <div class="pata-rejected-card">
                    <span class="pata-rejected-icon">❌</span>
                    <h2 class="pata-rejected-title">Solicitud rechazada</h2>
                    <p class="pata-rejected-text">Lamentablemente no pudimos aprobar la solicitud de <strong>${pet.name}</strong>.</p>
                    
                    ${adminMsg ? `
                        <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 24px; text-align: left; border: 1px solid #FFCDD2;">
                            <p style="margin: 0; font-size: 13px; color: #D32F2F; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Motivo del rechazo:</p>
                            <p style="margin: 10px 0 0 0; font-size: 15px; color: #333;">${adminMsg}</p>
                        </div>
                    ` : ''}

                    <div id="pata-appeal-section">
                        ${!canAppeal ? `
                            <p style="color: #666; font-size: 14px;">Has agotado el límite de apelaciones para esta mascota.</p>
                        ` : !this.showAppealForm ? `
                            <button class="pata-btn pata-btn-red" id="pata-btn-reveal-appeal" data-pet-id="${pet.id}">
                                ⚖️ Apelar mi solicitud
                            </button>
                            <p style="margin-top: 15px; font-size: 12px; color: #888;">Intentos restantes: ${maxAppeals - appealCount}</p>
                        ` : `
                            <div class="pata-appeal-form active" style="text-align: left;">
                                <p style="font-size:14px; margin-bottom:10px; font-weight: 600;">Explícanos por qué debemos reconsiderar el caso:</p>
                                <textarea id="pata-textarea-appeal" class="pata-textarea" placeholder="Escribe aquí los detalles de tu apelación..." data-pet-id="${pet.id}"></textarea>
                                
                                <div style="display:flex; gap:10px; margin-top:15px; justify-content: center;">
                                    <button class="pata-btn" id="pata-btn-submit-appeal" data-pet-id="${pet.id}">Enviar Apelación</button>
                                    <button class="pata-btn pata-btn-outline" id="pata-btn-cancel-appeal">Cancelar</button>
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        renderActionRequiredContent(pet) {
            // 🆕 Ahora lee el mensaje del admin directamente de la mascota
            const adminMsg = pet.last_admin_response;

            return `
                <div class="pata-alert-banner pata-alert-warning">
                    <span>🛠️</span>
                    <div>
                        <div class="pata-subtitle">Acción Requerida para ${pet.name}</div>
                        <p style="margin:0; font-size:14px; color:inherit;"><strong>Nota del Admin:</strong> ${pet.admin_notes || 'Por favor revisa tus documentos.'}</p>
                    </div>
                </div>

                ${adminMsg ? `
                    <div class="pata-alert-banner pata-alert-info" style="background: #E3F2FD; border-color: #1976D2; margin-top: 15px;">
                        <span>💬</span>
                        <div>
                            <div class="pata-subtitle" style="color: #1976D2; font-size: 14px; margin-bottom: 5px;">Mensaje del Equipo:</div>
                            <p style="margin:0; font-size:14px; color:#1A1A1A;">${adminMsg}</p>
                        </div>
                    </div>
                ` : ''}

                <p style="font-size:14px; color:#fff; margin-top:15px;">Sigue las instrucciones enviadas por el equipo para completar tu perfil.</p>

                ${adminMsg ? `
                    <div style="margin-top: 20px;">
                        <button class="pata-btn pata-btn-success" id="pata-btn-open-update" data-pet-id="${pet.id}">
                            📎 Actualizar Información de ${pet.name}
                        </button>
                    </div>
                ` : ''}
            `;
        }

        // 🆕 Renderizar el modal de actualización
        renderUpdateModal(pet) {
            const adminMsg = pet.last_admin_response || 'Por favor actualiza la información solicitada.';

            return `
                <div class="pata-modal-overlay" id="pata-update-modal">
                    <div class="pata-modal">
                        <div class="pata-modal-header">
                            <h3 class="pata-modal-title">📎 Actualizar información de ${pet.name}</h3>
                            <button class="pata-modal-close" id="pata-modal-close">&times;</button>
                        </div>
                        <div class="pata-modal-body">
                            <div class="pata-admin-request">
                                <div class="pata-admin-request-label">📩 El equipo te pidió:</div>
                                <p class="pata-admin-request-msg">${adminMsg}</p>
                            </div>

                            <div>
                                <label style="font-weight: 600; margin-bottom: 10px; display: block;">Foto 1:</label>
                                <div class="pata-upload-area" id="pata-upload-area-1">
                                    <input type="file" accept="image/*" class="pata-upload-input" id="pata-file-1">
                                    <div class="pata-upload-icon">📷</div>
                                    <div class="pata-upload-text">Haz clic para seleccionar foto</div>
                                </div>
                            </div>

                            <div style="margin-top: 15px;">
                                <label style="font-weight: 600; margin-bottom: 10px; display: block;">Foto 2 (opcional):</label>
                                <div class="pata-upload-area" id="pata-upload-area-2">
                                    <input type="file" accept="image/*" class="pata-upload-input" id="pata-file-2">
                                    <div class="pata-upload-icon">📷</div>
                                    <div class="pata-upload-text">Haz clic para seleccionar foto</div>
                                </div>
                            </div>

                            <div style="margin-top: 15px;">
                                <label style="font-weight: 600; margin-bottom: 10px; display: block;">Mensaje (opcional):</label>
                                <textarea id="pata-update-message" class="pata-textarea" placeholder="Añade un comentario sobre tu actualización..."></textarea>
                            </div>

                        </div>
                        <div class="pata-modal-footer">
                            <button class="pata-btn pata-btn-outline" id="pata-btn-cancel-update">Cancelar</button>
                            <button class="pata-btn pata-btn-success" id="pata-btn-submit-update" ${this.uploading ? 'disabled' : ''}>
                                ${this.uploading ? 'Enviando...' : 'Enviar Actualización'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderPetDetailsModal(pet) {
            const carencia = this.calculateCarencia(pet);
            const petImage = pet.photo_url || 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';

            return `
                <div class="pata-modal-overlay show" id="pata-pet-details-modal">
                    <div class="pata-modal">
                        <div class="pata-modal-header">
                            <h3 class="pata-modal-title">Detalles de ${pet.name}</h3>
                            <button class="pata-modal-close" id="pata-close-details">&times;</button>
                        </div>
                        <div class="pata-modal-body">
                            <div style="text-align:center; margin-bottom: 25px;">
                                <img src="${petImage}" style="width:120px; height:120px; border-radius:60px; object-fit:cover; border:3px solid #00BBB4;">
                            </div>
                            <div class="pata-modal-pet-details">
                                <div class="pata-detail-item">
                                    <div class="pata-detail-label">Tipo</div>
                                    <div class="pata-detail-value">${pet.type}</div>
                                </div>
                                <div class="pata-detail-item">
                                    <div class="pata-detail-label">Género</div>
                                    <div class="pata-detail-value">${pet.gender || 'Sin especificar'}</div>
                                </div>
                                <div class="pata-detail-item">
                                    <div class="pata-detail-label">Raza</div>
                                    <div class="pata-detail-value">${pet.breed}</div>
                                </div>
                                <div class="pata-detail-item">
                                    <div class="pata-detail-label">Edad</div>
                                    <div class="pata-detail-value">${pet.age}</div>
                                </div>
                                <div class="pata-detail-item">
                                    <div class="pata-detail-label">Peso</div>
                                    <div class="pata-detail-value">${pet.weight || 'Desconocido'}</div>
                                </div>
                                <div class="pata-detail-item">
                                    <div class="pata-detail-label">Carencia</div>
                                    <div class="pata-detail-value">${carencia.percentage}% (${carencia.daysRemaining} días restantes)</div>
                                </div>
                            </div>
                        </div>
                        <div class="pata-modal-footer">
                            <button class="pata-btn pata-btn-outline" id="pata-close-details-btn">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
        }

        attachEvents() {
            // Tab switch
            this.container.querySelectorAll('.pata-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    this.currentIndex = parseInt(btn.dataset.idx);
                    this.showAppealForm = false;
                    this.render();
                };
            });

            const detailsBtn = document.getElementById('pata-btn-pet-details');
            if (detailsBtn) {
                detailsBtn.onclick = () => {
                    const pet = this.pets[this.currentIndex];
                    const modalHtml = this.renderPetDetailsModal(pet);
                    const modalDiv = document.createElement('div');
                    modalDiv.id = 'pata-details-modal-wrapper';
                    modalDiv.innerHTML = modalHtml;
                    document.body.appendChild(modalDiv);

                    // Close events
                    const close = () => {
                        modalDiv.remove();
                    };
                    document.getElementById('pata-close-details').onclick = close;
                    document.getElementById('pata-close-details-btn').onclick = close;
                    document.getElementById('pata-pet-details-modal').onclick = (e) => {
                        if (e.target.id === 'pata-pet-details-modal') close();
                    };
                };
            }

            // Reveal appeal form
            const revealBtn = document.getElementById('pata-btn-reveal-appeal');
            if (revealBtn) {
                revealBtn.onclick = () => {
                    this.showAppealForm = true;
                    this.render();
                };
            }

            // Cancel appeal
            const cancelBtn = document.getElementById('pata-btn-cancel-appeal');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    this.showAppealForm = false;
                    this.appealFiles = { photo1: null, photo2: null }; // Limpiar archivos
                    this.render();
                };
            }

            // 🆕 Evento para ver historial de apelaciones
            const historyBtn = this.container.querySelector('.pata-btn-history');
            if (historyBtn) {
                historyBtn.onclick = async () => {
                    const petId = historyBtn.dataset.petId;
                    if (petId) {
                        await this.showAppealHistory(petId);
                    }
                };
            }

            // 🆕 Eventos para carga de fotos en apelación
            this.setupAppealPhotoUpload('pata-appeal-upload-1', 'pata-appeal-file-1', 'pata-appeal-preview-1', 'photo1');
            this.setupAppealPhotoUpload('pata-appeal-upload-2', 'pata-appeal-file-2', 'pata-appeal-preview-2', 'photo2');

            // Submit appeal (con fotos opcionales)
            const submitBtn = document.getElementById('pata-btn-submit-appeal');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const textarea = document.getElementById('pata-textarea-appeal');
                    const msg = textarea?.value || '';
                    if (msg.trim().length < 10) return alert('Por favor describe tu caso con más detalle (mínimo 10 caracteres).');

                    // Obtener petId del data-attribute o del índice actual
                    const petId = submitBtn.dataset.petId || this.pets[this.currentIndex]?.id;
                    if (!petId) return alert('Error: No se pudo identificar la mascota.');

                    submitBtn.innerText = 'Enviando...';
                    submitBtn.disabled = true;

                    try {
                        // 1. Subir fotos si las hay
                        let photo1Url = null;
                        let photo2Url = null;

                        if (this.appealFiles?.photo1) {
                            submitBtn.innerText = 'Subiendo foto 1...';
                            photo1Url = await this.uploadPhoto(this.appealFiles.photo1);
                        }
                        if (this.appealFiles?.photo2) {
                            submitBtn.innerText = 'Subiendo foto 2...';
                            photo2Url = await this.uploadPhoto(this.appealFiles.photo2);
                        }

                        submitBtn.innerText = 'Enviando apelación...';

                        // 2. Enviar apelación
                        let res, data;
                        try {
                            res = await fetch(`${CONFIG.apiUrl}/api/user/appeal`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    memberId: this.member.id,
                                    petId: petId,
                                    appealMessage: msg
                                })
                            });

                            const contentType = res.headers.get("content-type");
                            if (contentType && contentType.indexOf("application/json") !== -1) {
                                data = await res.json();
                            } else {
                                // Si no es JSON (ej: 500 HTML de Vercel), lanzar error
                                const text = await res.text();
                                console.error('Respuesta no JSON:', text.substring(0, 100)); // Loguear para debug
                                throw new Error(`Error del servidor (${res.status}). Por favor contacta soporte.`);
                            }

                            if (!res.ok) {
                                throw new Error(data.error || 'Error al enviar la apelación.');
                            }

                        } catch (networkError) {
                            console.error('Error de red/servidor:', networkError);
                            alert(`❌ ${networkError.message || 'Error de conexión. Verifica tu internet.'}`);
                            submitBtn.innerText = 'Enviar Apelación';
                            submitBtn.disabled = false;
                            return;
                        }

                        // 3. Si hay fotos nuevas, actualizar la mascota
                        if (photo1Url || photo2Url) {
                            submitBtn.innerText = 'Actualizando fotos...';

                            const updateRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/${petId}/update`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: this.member.id,
                                    photo1Url: photo1Url,
                                    photo2Url: photo2Url,
                                    message: `Apelación con nuevas fotos: ${msg.substring(0, 100)}...`
                                })
                            });

                            if (!updateRes.ok) {
                                console.warn('No se pudieron actualizar las fotos, pero la apelación fue enviada');
                            }
                        }

                        alert('✅ Apelación enviada correctamente. Nuestro equipo la revisará pronto.');
                        location.reload();

                    } catch (e) {
                        console.error('Error sending appeal:', e);
                        alert(`❌ ${e.message || 'Error de conexión. Verifica tu internet e intenta nuevamente.'}`);
                        submitBtn.innerText = 'Enviar Apelación';
                        submitBtn.disabled = false;
                    }
                };
            }

            // 🆕 Abrir modal de actualización
            const openUpdateBtn = document.getElementById('pata-btn-open-update');
            if (openUpdateBtn) {
                openUpdateBtn.onclick = () => {
                    this.showUpdateModal = true;
                    this.uploadFiles = { photo1: null, photo2: null };
                    const pet = this.pets[this.currentIndex];
                    document.body.insertAdjacentHTML('beforeend', this.renderUpdateModal(pet));
                    this.attachModalEvents();
                };
            }
        }

        // 🆕 Eventos específicos del modal
        attachModalEvents() {
            // Cerrar modal
            const closeBtn = document.getElementById('pata-modal-close');
            const cancelBtn = document.getElementById('pata-btn-cancel-update');
            const closeModal = () => {
                const modal = document.getElementById('pata-update-modal');
                if (modal) modal.remove();
                this.showUpdateModal = false;
            };
            if (closeBtn) closeBtn.onclick = closeModal;
            if (cancelBtn) cancelBtn.onclick = closeModal;

            // Click outside to close
            const overlay = document.getElementById('pata-update-modal');
            if (overlay) {
                overlay.onclick = (e) => {
                    if (e.target === overlay) closeModal();
                };
            }

            // Upload areas
            const setupUpload = (areaId, fileId, key) => {
                const area = document.getElementById(areaId);
                const input = document.getElementById(fileId);
                if (area && input) {
                    area.onclick = () => input.click();
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            this.uploadFiles[key] = file;
                            area.classList.add('has-file');
                            area.innerHTML = `
                                <img src="${URL.createObjectURL(file)}" class="pata-upload-preview">
                                <div class="pata-upload-filename">✓ ${file.name}</div>
                            `;
                        }
                    };
                }
            };
            setupUpload('pata-upload-area-1', 'pata-file-1', 'photo1');
            setupUpload('pata-upload-area-2', 'pata-file-2', 'photo2');

            // Submit update
            const submitBtn = document.getElementById('pata-btn-submit-update');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    if (!this.uploadFiles.photo1 && !this.uploadFiles.photo2) {
                        return alert('Por favor sube al menos una foto.');
                    }

                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Subiendo fotos...';
                    this.uploading = true;

                    try {
                        const pet = this.pets[this.currentIndex];
                        let photo1Url = null;
                        let photo2Url = null;

                        // Subir foto 1
                        if (this.uploadFiles.photo1) {
                            const formData = new FormData();
                            formData.append('file', this.uploadFiles.photo1);
                            formData.append('userId', this.member.id);
                            const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                                method: 'POST',
                                body: formData
                            });
                            const data = await res.json();
                            if (data.success) photo1Url = data.url;
                            else {
                                alert('Error al subir foto 1: ' + (data.error || 'Error desconocido'));
                                submitBtn.disabled = false;
                                submitBtn.innerText = 'Enviar Actualización';
                                this.uploading = false;
                                return;
                            }
                        }

                        // Subir foto 2
                        if (this.uploadFiles.photo2) {
                            const formData = new FormData();
                            formData.append('file', this.uploadFiles.photo2);
                            formData.append('userId', this.member.id);
                            const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                                method: 'POST',
                                body: formData
                            });
                            const data = await res.json();
                            if (data.success) photo2Url = data.url;
                            else {
                                alert('Error al subir foto 2: ' + (data.error || 'Error desconocido'));
                                submitBtn.disabled = false;
                                submitBtn.innerText = 'Enviar Actualización';
                                this.uploading = false;
                                return;
                            }
                        }

                        submitBtn.innerText = 'Guardando...';

                        // Actualizar mascota
                        const message = document.getElementById('pata-update-message')?.value || '';
                        const updateRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/${pet.id}/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: this.member.id,
                                photo1Url,
                                photo2Url,
                                message
                            })
                        });



                        const updateData = await updateRes.json();
                        if (updateData.success) {
                            alert('✅ ' + updateData.message);
                            location.reload();
                        } else {
                            alert('Error: ' + updateData.error);
                            submitBtn.disabled = false;
                            submitBtn.innerText = 'Enviar Actualización';
                        }
                    } catch (e) {
                        console.error('Error en update:', e);
                        alert('Error al enviar la actualización.');
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Enviar Actualización';
                    }
                    this.uploading = false;
                };
            }
        }

        // 🆕 Configurar carga de fotos en formulario de apelación
        setupAppealPhotoUpload(areaId, fileId, previewId, photoKey) {
            const area = document.getElementById(areaId);
            const fileInput = document.getElementById(fileId);
            const preview = document.getElementById(previewId);

            if (!area || !fileInput) return;

            // Inicializar objeto de archivos de apelación si no existe
            if (!this.appealFiles) {
                this.appealFiles = { photo1: null, photo2: null };
            }

            // Click en área activa el input
            area.onclick = () => fileInput.click();

            // Cambio de archivo
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Guardar referencia
                    this.appealFiles[photoKey] = file;

                    // Mostrar preview
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (preview) {
                            preview.innerHTML = `
                                <img src="${ev.target.result}" style="max-width:100%; max-height:80px; border-radius:4px; object-fit:cover;">
                                <p style="margin:5px 0 0 0; font-size:11px; color:#4CAF50;">✓ ${file.name.substring(0, 15)}...</p>
                            `;
                        }
                        area.style.borderColor = '#4CAF50';
                        area.style.background = '#f0fff0';
                    };
                    reader.readAsDataURL(file);
                }
            };

            // Drag and drop robustness
            const preventDefaults = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                area.addEventListener(eventName, preventDefaults, false);
            });

            // Highlight functionality
            area.ondragenter = () => {
                area.style.borderColor = CONFIG.brandColor;
                area.style.background = '#e0f7fa';
            };
            area.ondragover = () => {
                area.style.borderColor = CONFIG.brandColor;
                area.style.background = '#e0f7fa';
            };
            area.ondragleave = () => {
                area.style.borderColor = '#ddd';
                area.style.background = '#fff';
            };
            area.ondrop = (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            };
        }

        // 🆕 Subir foto a Supabase Storage
        async uploadPhoto(file) {
            // Validación Cliente: Formato y Tamaño
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                if (file.type === 'image/webp') {
                    throw new Error('Formato WebP no soportado. Por favor usa JPG o PNG.');
                }
                throw new Error(`Formato ${file.type} no soportado. Solo JPG o PNG.`);
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('La imagen excede 5MB. Por favor comprímela.');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', this.member.id);

            const res = await fetch(`${CONFIG.apiUrl}/api/user/upload-pet-photo`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success && data.url) {
                return data.url;
            } else {
                throw new Error(data.error || 'Error subiendo foto');
            }
        }

        // 🆕 Mostrar historial de apelaciones en un modal
        async showAppealHistory(petId) {
            const pet = this.pets.find(p => p.id === petId);
            const petName = pet?.name || 'Mascota';

            // Crear modal de carga
            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:100000; display:flex; align-items:center; justify-content:center; padding:20px;';
            modal.innerHTML = `
                <div style="background:#fff; border-radius:16px; padding:30px; max-width:500px; width:100%; max-height:80vh; overflow:auto; position:relative;">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:36px; height:36px; border-radius:50%; font-size:18px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h2 style="margin:0 0 20px 0; font-size:20px; font-weight:700;">📜 Historial de ${petName}</h2>
                    <div id="pata-history-content" style="color:#888; text-align:center; padding:30px;">Cargando historial...</div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            try {
                console.log(`📡 Historial: Consultando para petId=${petId}, memberId=${this.member?.id}`);
                const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal-history?memberId=${this.member.id}&petId=${petId}`);

                if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status}`);
                }

                const data = await res.json();
                console.log('📥 Historial recibido:', data);

                const contentDiv = document.getElementById('pata-history-content');
                if (!data.success || !data.logs || data.logs.length === 0) {
                    contentDiv.innerHTML = '<p style="color:#888;">No hay historial de apelaciones para esta mascota.</p>';
                    return;
                }

                // Renderizar logs
                contentDiv.innerHTML = data.logs.map(log => {
                    const logDate = log.date ? new Date(log.date) : new Date();
                    const dateStr = logDate.toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    const isFromAdmin = log.isFromAdmin;
                    const bgColor = isFromAdmin ? '#E3F2FD' : '#E8F5E9';
                    const borderColor = isFromAdmin ? '#1976D2' : '#4CAF50';
                    const label = isFromAdmin ? '👤 Equipo Pata Amiga' : '🐾 Tú';

                    return `
                        <div style="background:${bgColor}; border-left:3px solid ${borderColor}; padding:12px; border-radius:0 8px 8px 0; margin-bottom:12px; text-align:left;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-weight:600; font-size:12px; color:#424242;">${log.icon || '📋'} ${label}</span>
                                <span style="font-size:11px; color:#888;">${dateStr}</span>
                            </div>
                            <p style="margin:0; font-size:14px; color:#1A1A1A;">${log.message}</p>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error('❌ Error cargando historial:', err);
                const contentDiv = document.getElementById('pata-history-content');
                if (contentDiv) {
                    contentDiv.innerHTML = `
                        <p style="color:#C62828; margin-bottom:10px;">Error al cargar el historial.</p>
                        <p style="font-size:11px; color:#666;">Detalle: ${err.message}</p>
                        <button onclick="location.reload()" style="background:#888; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Reintentar</button>
                    `;
                }
            }
        }
    }

    // Auto init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new UnifiedWidget('pata-amiga-membership-widget'));
    } else {
        new UnifiedWidget('pata-amiga-membership-widget');
    }

})();
