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
        countdownBg: '#C8E600',
        statusColors: {
            approved: { bg: '#E8F5E9', text: '#2E7D32', label: 'APROBADA', icon: '✅' },
            pending: { bg: '#FFF3E0', text: '#EF6C00', label: 'PENDIENTE', icon: '⏳' },
            rejected: { bg: '#FFEBEE', text: '#C62828', label: 'RECHAZADA', icon: '❌' },
            action_required: { bg: '#E3F2FD', text: '#1565C0', label: 'ACCION REQUERIDA', icon: '⚠️' },
            appealed: { bg: '#F3E5F5', text: '#7B1FA2', label: 'APELADA', icon: '⚖️' }
        }
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');

        :root {
            --pata-primary: #00BBB4;
            --pata-primary-light: #7DD8D5;
            --pata-action: #FE8F15;
            --pata-accent: #FFBD12;
            --pata-glass-bg: rgba(255, 255, 255, 0.85);
            --pata-glass-border: rgba(255, 255, 255, 0.3);
            --pata-shadow-premium: 0 20px 40px rgba(0, 0, 0, 0.1);
            --pata-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
            --pata-border-thick: 4px solid #000;
            --pata-border-thin: 2px solid #000;
        }

        .pata-unified-panel {
            background: var(--pata-glass-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--pata-glass-border);
            border-radius: 35px;
            padding: 40px;
            width: 100%;
            margin: 0 auto 20px auto;
            box-shadow: var(--pata-shadow-premium);
            font-family: 'Outfit', sans-serif;
            color: #1A1A1A;
            display: none;
            position: relative;
            overflow: hidden;
            transition: all 0.4s var(--pata-spring);
        }

        .pata-unified-panel.show { 
            display: block; 
            animation: pataBounceIn 0.8s var(--pata-spring) forwards;
        }

        @keyframes pataBounceIn {
            0% { opacity: 0; transform: scale(0.9) translateY(40px); }
            70% { transform: scale(1.02) translateY(-5px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes pataSlideInFromRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .pata-slide-animate {
            animation: pataSlideInFromRight 0.5s var(--pata-spring) forwards;
        }

        /* External Greeting */
        .pata-external-greeting {
            width: 100%;
            margin: 40px auto 20px auto;
            font-family: 'Outfit', sans-serif;
            color: #FFFFFF;
            text-align: left;
        }

        .pata-welcome-title {
            font-size: clamp(48px, 10vw, 100px);
            font-weight: 900;
            margin: 0;
            line-height: 0.9;
            letter-spacing: -0.02em;
        }

        .pata-welcome-subtitle {
            font-size: clamp(16px, 2vw, 20px);
            font-weight: 600;
            margin: 20px 0 0 0;
            line-height: 1.4;
            max-width: 700px;
            opacity: 0.9;
        }

        /* Mobile Responsive Tabs */
        .pata-pet-tabs { 
            display: flex; 
            gap: 12px; 
            margin-bottom: 25px; 
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 10px 5px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }
        .pata-pet-tabs::-webkit-scrollbar { display: none; }

        .pata-tab-btn {
            background: #F0F2F5;
            border: var(--pata-border-thin);
            border-color: transparent;
            border-radius: 50px;
            padding: 12px 28px;
            cursor: pointer;
            transition: all 0.3s var(--pata-spring);
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #666;
            font-size: 16px;
            white-space: nowrap;
            flex-shrink: 0;
            min-height: 48px;
        }

        .pata-tab-btn:hover { transform: translateY(-2px); background: #E8EAED; }
        .pata-tab-btn.active { 
            background: var(--pata-primary); 
            color: #FFFFFF; 
            border-color: rgba(255,255,255,0.3);
            box-shadow: 0 8px 20px rgba(0, 187, 180, 0.3);
            transform: scale(1.05);
        }

        /* Approved View Layout */
        .pata-approved-grid {
            display: grid;
            grid-template-columns: 1fr minmax(300px, 340px);
            gap: 30px;
            align-items: flex-start;
        }

        @media (max-width: 900px) {
            .pata-approved-grid { grid-template-columns: 1fr; }
        }

        .pata-carencia-title {
            font-size: clamp(32px, 5vw, 44px);
            font-weight: 900;
            color: var(--pata-primary);
            margin: 0 0 10px 0;
            line-height: 1.1;
        }

        /* 💬 Chat Styles */
        .pata-chat-container {
            margin-top: 35px;
            background: #fff;
            border-radius: 30px;
            border: var(--pata-border-thick);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            height: clamp(400px, 50vh, 550px);
            box-shadow: 12px 12px 0 rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }

        .pata-chat-header {
            padding: 18px 25px;
            background: var(--pata-primary);
            color: #fff;
            font-weight: 950;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-bottom: var(--pata-border-thick);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .pata-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 25px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            background-image: radial-gradient(var(--pata-primary) 1px, transparent 1px);
            background-size: 24px 24px;
            background-color: #fafafa;
        }

        .pata-chat-bubble {
            max-width: 85%;
            padding: 16px 20px;
            border-radius: 24px;
            font-size: 14.5px;
            line-height: 1.6;
            position: relative;
            font-weight: 700;
            border: 3px solid #000;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.05);
            word-wrap: break-word;
        }

        .pata-chat-bubble.admin {
            align-self: flex-start;
            background: #fff;
            border-bottom-left-radius: 6px;
            color: #1A1A1A;
        }

        .pata-chat-bubble.user {
            align-self: flex-end;
            background: var(--pata-primary);
            color: #fff;
            border-bottom-right-radius: 6px;
        }

        .pata-chat-input-area {
            padding: 18px;
            background: #fff;
            border-top: var(--pata-border-thick);
            display: flex;
            gap: 12px;
            align-items: center;
        }

        /* Progress Bar */
        .pata-bar-v2 {
            height: 28px;
            background: #F0F2F5;
            border-radius: 50px;
            border: var(--pata-border-thin);
            padding: 4px;
            position: relative;
        }

        .pata-fill-v2 {
            height: 100%;
            background: linear-gradient(90deg, var(--pata-primary) 0%, var(--pata-primary-light) 100%);
            border-radius: 50px;
            transition: width 1.5s var(--pata-spring);
        }

        /* Pet Profile Cards */
        .pata-pet-photo-box {
            width: 140px;
            height: 140px;
            background: var(--pata-primary);
            border-radius: 24px;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            border: var(--pata-border-thin);
        }

        .pata-pet-info-box {
            flex: 1;
            background: var(--pata-primary);
            border-radius: 24px;
            padding: 20px;
            color: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: var(--pata-border-thin);
            box-shadow: 8px 8px 0 rgba(0,0,0,0.05);
        }

        /* Modal Base Styles */
        .pata-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        }

        .pata-modal-overlay.show { display: flex; }

        .pata-modal {
            background: #FFFFFF;
            width: 100%;
            max-width: 550px;
            border-radius: 40px;
            border: var(--pata-border-thick);
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0,0,0,0.25);
            animation: pataModalSlideUp 0.5s var(--pata-spring) forwards;
        }

        @keyframes pataModalSlideUp { 
            from { transform: translateY(40px) scale(0.95); opacity: 0; } 
            to { transform: translateY(0) scale(1); opacity: 1; } 
        }

        /* Editorial Modal Distribution */
        .pata-editorial-container {
            max-width: 1080px;
            width: 100%;
            max-height: 90vh;
            border-radius: 40px;
            border: var(--pata-border-thick);
            overflow: hidden;
            background: #fff;
            display: flex;
            flex-direction: column;
            animation: pataModalSlideUp 0.5s var(--pata-spring) forwards;
        }

        .pata-editorial-body {
            display: grid;
            grid-template-columns: minmax(320px, 440px) 1fr;
            height: 100%;
            overflow: hidden; /* Control internal scrolling */
        }

        .pata-editorial-left {
            background: var(--pata-primary-light);
            padding: 40px;
            display: flex;
            flex-direction: column;
            gap: 25px;
            border-right: var(--pata-border-thick);
            overflow-y: auto;
        }

        .pata-editorial-right {
            padding: 40px 50px;
            background: #fff;
            overflow-y: auto;
            position: relative;
        }

        .pata-editorial-name {
            font-size: clamp(48px, 6vw, 72px);
            font-weight: 950;
            line-height: 0.85;
            margin: 0 0 10px 0;
            letter-spacing: -0.04em;
            color: #000;
            text-transform: lowercase;
        }

        @media (max-width: 900px) {
            .pata-editorial-body {
                grid-template-columns: 1fr;
                overflow-y: auto;
            }
            .pata-editorial-left {
                border-right: none;
                border-bottom: var(--pata-border-thick);
                padding: 30px;
            }
            .pata-editorial-right {
                padding: 30px;
            }
        }

        /* ❌ REMOVED SIDE-STRIPE BAN 1 ❌ */
        .pata-benefits-review {
            margin-top: 40px;
            padding: 35px;
            background: #FFFFFF;
            border-radius: 40px;
            border: var(--pata-border-thin);
            text-align: left;
            box-shadow: 0 15px 45px rgba(0, 187, 180, 0.08);
            position: relative;
        }
        
        .pata-benefits-review::before { display: none; } /* Kill the side-stripe */
        
        /* Replace with a more distinctive header */
        .pata-benefits-title {
            font-size: 22px;
            font-weight: 950;
            color: var(--pata-primary);
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 12px;
            text-transform: lowercase;
            letter-spacing: -0.5px;
            padding-bottom: 12px;
            border-bottom: 2px dashed var(--pata-primary-light);
        }

        .pata-benefit-card {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            align-items: flex-start;
            padding: 20px;
            border-radius: 30px;
            background: #F8FBFF;
            border: 1px solid #F0F2F5;
            transition: all 0.4s var(--pata-spring);
        }

        .pata-benefit-icon-box {
            font-size: 28px;
            background: #FFFFFF;
            color: var(--pata-primary);
            width: 56px;
            height: 56px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: var(--pata-border-thin);
            box-shadow: 4px 4px 0 rgba(0, 187, 180, 0.1);
        }

        /* Utilities */
        .pata-btn {
            background: #1A1A1A;
            color: #fff;
            padding: 16px 36px;
            border-radius: 60px;
            border: var(--pata-border-thin);
            font-weight: 900;
            cursor: pointer;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            text-decoration: none !important;
            transition: all 0.2s var(--pata-spring);
        }
        .pata-btn:hover { transform: translateY(-3px); box-shadow: 6px 6px 0 rgba(0,0,0,0.1); }
        
        .pata-btn-ver-detalles {
            background: var(--pata-accent);
            color: #000 !important;
            border: var(--pata-border-thin);
            border-radius: 50px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
            transition: all 0.2s;
        }

        .pata-orange-alert {
            background: var(--pata-accent);
            border-radius: 30px;
            padding: 20px 30px;
            display: flex;
            gap: 20px;
            align-items: center;
            margin-top: 30px;
            color: #1A1A1A;
            border: var(--pata-border-thick);
            box-shadow: 8px 8px 0 rgba(0,0,0,0.05);
        }
    `;;


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
            this.uploadFiles = { photo1: null, photo2: null, photo3: null, photo4: null, photo5: null };
            this.uploading = false;
            this.missingPhotosFiles = { photo1: null, photo2: null, photo3: null, photo4: null, photo5: null };

            if (!this.container) return;
            this.init();
        }

        async init() {
            console.log('🚀 Unified Widget: Starting initialization...');
            this.injectStyles();

            // Asegurar que ocultamos cualquier loader si algo falla o tarda (Fail-safe)
            this.safetyTimeout = setTimeout(() => {
                console.log('🛡️ Unified Widget: Safety timeout reached, forcing hide loaders.');
                this.hideGlobalLoaders();
            }, 10000);

            try {
                console.log('⏳ Unified Widget: Waiting for Memberstack...');
                await this.waitForMemberstack();

                if (!this.member) {
                    console.warn('⚠️ Unified Widget: No member session found.');
                    this.container.innerHTML = '<!-- Pata Amiga: No member session -->';
                    this.hideGlobalLoaders();
                    return;
                }
                console.log('✅ Unified Widget: Member loaded:', this.member.id);

                console.log('⏳ Unified Widget: Loading pet data...');
                await this.loadData();

                console.log('📊 Unified Widget: Pets found:', this.pets.length);

                if (this.pets.length > 0 || ['pending', 'pending_payment', 'payment_processing'].includes(this.membershipStatus)) {
                    console.log('✨ Unified Widget: Rendering panel...');
                    this.container.classList.add('show');
                    this.render();
                    
                    // 🆕 Magic Link: Auto-open chat if URL has action=chat&petId=X
                    try {
                        const urlParams = new URLSearchParams(window.location.search);
                        const action = urlParams.get('action');
                        const magicPetId = urlParams.get('petId');
                        if (action === 'chat' && magicPetId) {
                            const targetPet = this.pets.find(p => p.id === magicPetId);
                            if (targetPet) {
                                console.log('🔗 Magic Link: Opening chat for pet', magicPetId);
                                setTimeout(() => {
                                    const modalHtml = this.renderPetDetailsModal(targetPet);
                                    const modalDiv = document.createElement('div');
                                    modalDiv.id = 'pata-details-modal-wrapper';
                                    modalDiv.innerHTML = modalHtml;
                                    document.body.appendChild(modalDiv);
                                    const close = () => modalDiv.remove();
                                    const closeBtn1 = document.getElementById('pata-close-details');
                                    const closeBtn2 = document.getElementById('pata-close-details-btn');
                                    if (closeBtn1) closeBtn1.onclick = close;
                                    if (closeBtn2) closeBtn2.onclick = close;
                                    this.fetchAndRenderChat(targetPet.id);
                                    const modalOverlay = document.getElementById('pata-pet-details-modal');
                                    if (modalOverlay) {
                                        modalOverlay.onclick = (ev) => {
                                            if (ev.target.id === 'pata-pet-details-modal') close();
                                        };
                                    }
                                }, 800);
                            }
                        }
                    } catch (e) { console.warn('Magic link handling error:', e); }
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
                    this.hideGlobalLoaders();
                }
            } catch (err) {
                console.error('❌ Unified Widget: Critical error during init:', err);
                this.container.innerHTML = `<div style="color:red; padding:10px; font-size:12px;">Widget Error: ${err.message}</div>`;
                this.hideGlobalLoaders();
            } finally {
                // Si llegamos aquí y no hay mascotas para renderizar de forma normal,
                // aseguramos que el loader se vaya de todos modos.
                if (this.pets.length === 0 && !['pending', 'pending_payment', 'payment_processing'].includes(this.membershipStatus)) {
                    this.hideGlobalLoaders();
                }
                if (this.safetyTimeout) clearTimeout(this.safetyTimeout);
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
                // 🔴 PRIMERO: Verificar si tiene plan activo
                console.log('📡 Unified Widget: Checking payment status...');
                const roleRes = await fetch(`${CONFIG.apiUrl}/api/auth/check-role`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberstackId: this.member.id })
                });
                const roleData = await roleRes.json();

                if (roleData.success) {
                    console.log('📊 Unified Widget: Role check result:', roleData.role);

                    // Cuando actives cobros, descomenta el bloque original
                    if (roleData.role === 'pending_payment') {
                        console.log('💳 Unified Widget: User has no active plan. Bloqueando panel y pidiendo pago.');
                        this.membershipStatus = 'pending_payment';
                        this.pets = [];
                        return; // No cargar mascotas, mostrar vista de pago
                    }

                    if (roleData.role === 'payment_processing') {
                        console.log('⏳ Unified Widget: Payment is processing');
                        this.membershipStatus = 'payment_processing';
                        this.pets = [];
                        return;
                    }
                }

                // ✅ Si tiene plan, cargar mascotas normalmente
                const url = `${CONFIG.apiUrl}/api/user/pets?userId=${this.member.id}`;
                console.log('📡 Unified Widget: Fetching pets from:', url);
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
            // 1. Mestizo + Adoptado -> 120 días
            // 2. Raza + Adoptado -> 150 días
            // 3. Estándar (No adoptado) -> 180 días
            
            let totalDays = 180;
            
            // Si el objeto ya trae el campo calculado del backend, usarlo
            if (pet.waiting_period_days) {
                totalDays = parseInt(pet.waiting_period_days);
            } else if (pet.is_adopted) {
                const isMixed = pet.is_mixed_breed || pet.is_mixed || false;
                totalDays = isMixed ? 120 : 150;
            }


            const diffTime = Math.abs(now - start);
            const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, totalDays - daysPassed);
            const percentage = Math.min(100, Math.round((daysPassed / totalDays) * 100));

            return { daysRemaining, percentage, totalDays };
        }

        isSenior(pet) {
            const age = parseInt(pet.age_value) || 0;
            const totalMonths = pet.age_unit === 'months' ? age : age * 12;
            return totalMonths >= 120; // 10+ years
        }

        checkMissingDocs(pet) {
            if (!pet) return [];
            const missing = [];
            if (!pet.photo_url && !pet.primary_photo_url) missing.push("Foto de tu mascota");
            // Certificado médico es opcional, no lo bloqueamos
            return missing;
        }

        getDeadlineInfo() {
            if (!this.member?.userMeta?.registrationDate && !this.member?.createdAt) return null;
            const regDateStr = this.member.customFields?.['registration-date'] || this.member.createdAt;
            const regDate = new Date(regDateStr);
            if (isNaN(regDate.getTime())) return null;

            const deadline = new Date(regDate.getTime() + (15 * 24 * 60 * 60 * 1000));
            const now = new Date();
            const diff = deadline - now;
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

            return {
                deadline: deadline.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }),
                daysLeft,
                isExpired: daysLeft < 0
            };
        }

        renderWarningBanner(pet) {
            const missing = this.checkMissingDocs(pet);
            if (missing.length === 0) return '';

            const deadlineInfo = this.getDeadlineInfo();
            if (!deadlineInfo) return '';

            return `
                <div class="pata-documentation-warning">
                    <div class="pata-warning-icon">⚠️</div>
                    <div class="pata-warning-content">
                        <strong>Documentación pendiente para ${pet.name}</strong>
                        <p>Falta: ${missing.join(', ')}</p>
                        <p class="pata-warning-deadline">
                            ${deadlineInfo.isExpired
                    ? '⚠️ Tu plazo de 15 días ha expirado. Sube estos documentos pronto para evitar problemas con tu cobertura.'
                    : `Tienes hasta el <strong>${deadlineInfo.deadline}</strong> (${deadlineInfo.daysLeft} días) para completar tu registro.`}
                        </p>
                    </div>
                </div>
            `;
        }

        render() {
            const firstName = this.member.customFields?.['first-name'] || 'Socio';

            // 🔴 NUEVO: Verificar primero si no ha pagado
            if (this.membershipStatus === 'pending_payment') {
                console.log('💳 Unified Widget: User has not paid. Rendering payment required view.');
                this.container.innerHTML = this.renderPaymentRequiredView(firstName);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
                return;
            }

            // ⏳ Si el pago está en proceso
            if (this.membershipStatus === 'payment_processing') {
                console.log('⏳ Unified Widget: Payment processing. Rendering processing view.');
                this.container.innerHTML = this.renderPaymentProcessingView(firstName);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
                return;
            }

            // 🆕 Lógica de Estatus Global: Solo mostramos la vista global si:
            // 1. El estatus es 'pending' Y (no hay mascotas o todas están en 'pending')
            const allPetsPending = this.pets.length === 0 || this.pets.every(p => p.status === 'pending');
            const isPending = this.membershipStatus === 'pending' && allPetsPending;

            // 📸 NUEVO: Verificar si falta subir fotos (cuando está en revisión)
            const petMissingPhotos = isPending && this.pets.find(p => !p.photo_url && !p.photo2_url);

            if (petMissingPhotos) {
                console.log('📸 Unified Widget: Pet missing photos. Rendering missing info view.');
                this.container.innerHTML = this.renderMissingPhotosView(firstName, petMissingPhotos);
                this.container.classList.add('show');
                this.attachMissingPhotosEvents(petMissingPhotos);
                return;
            }

            if (isPending) {
                console.log('⏳ Unified Widget: User status is pending. Rendering global pending view.');
                this.container.innerHTML = this.renderUserPendingView(firstName);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
                return;
            }

            this.hideGlobalLoaders(); // Safety hide for other states
            const pet = this.pets[this.currentIndex];
            const isApproved = this.membershipStatus === 'active' || this.membershipStatus === 'approved';
            const isRejected = pet?.status === 'rejected' || this.membershipStatus === 'rejected' || this.membershipStatus === 'denied';

            // Actualizar el tema del contenedor
            if (isApproved) {
                this.container.parentElement?.classList.add('pata-theme-yellow');
                this.container.parentElement?.classList.remove('pata-theme-orange');
                document.body.style.backgroundColor = '#FFBD12';
            } else if (isRejected) {
                this.container.parentElement?.classList.add('pata-theme-orange');
                this.container.parentElement?.classList.remove('pata-theme-yellow');
                document.body.style.backgroundColor = '#FFBD12'; // Usaremos el mismo naranja del mockup
            } else {
                this.container.parentElement?.classList.remove('pata-theme-yellow', 'pata-theme-orange');
                document.body.style.backgroundColor = ''; // Reset
            }

            if (!pet) {
                // 🔴 NUEVO: Si ya pagó pero no tiene mascotas, mostrar vista de completar registro
                if (isApproved) {
                    console.log('🏁 Unified Widget: User has paid but no pets found. Rendering finish registration view.');
                    this.container.innerHTML = this.renderCompleteRegistrationView(firstName);
                    this.container.classList.add('show');
                    this.hideGlobalLoaders();
                    return;
                }

                this.container.innerHTML = `<div class="pata-welcome-title" style="color:white; padding:40px;">Cargando mascotas...</div>`;
                this.hideGlobalLoaders();
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

            const rejectedGreeting = `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola, ${firstName}!</h1>
                    <p class="pata-welcome-subtitle">
                        En esta ocasión no fue posible aprobar tu solicitud para unirte a Club Pata Amiga.<br>
                        Tu pago ha sido devuelto íntegro. No se realizó ningún cargo a tu cuenta.
                    </p>
                </div>
            `;

            this.container.innerHTML = `
                ${isApproved ? activeGreeting : (isRejected ? rejectedGreeting : pendingGreeting)}

                <div class="pata-unified-panel show">
                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-decoration-paws">
                    

                    <div class="pata-pet-tabs" role="tablist">
                        ${this.pets.map((p, i) => `
                            <button 
                                class="pata-tab-btn ${i === this.currentIndex ? 'active' : ''}" 
                                data-idx="${i}"
                                role="tab"
                                aria-selected="${i === this.currentIndex}"
                                aria-label="Ver detalles de ${p.name}"
                            >
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

                        ${this.renderInReviewBenefits()}

                        <div style="text-align: center; margin-top: 25px;">
                            <a href="https://www.pataamiga.mx/pets/pet-waiting-period#beneficios" class="pata-btn pata-btn-conocer" style="display: inline-block; text-decoration: none; background: transparent; color: #00BBB4; border: 2px solid #00BBB4; padding: 18px 60px; font-size: 18px; font-weight: 900; border-radius: 50px; width: 100%; max-width: 400px; transition: all 0.3s ease;">
                                Conoce tus futuros beneficios
                            </a>
                        </div>

                        <div style="background: rgba(255,255,255,0.5); border: 2px dashed #00BBB4; padding: 15px; border-radius: 20px; margin-top: 30px; text-align: center;">
                            <p style="margin:0; font-size: 14px; font-weight: 900; color: #008884;">🛡️ Control total de tu cuenta</p>
                            <p style="margin:5px 0 0 0; font-size: 13px; color: #444;">Recuerda que puedes <strong>cancelar tu membresía en cualquier momento</strong> desde tu panel sin complicaciones.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // 🔴 NUEVO: Vista cuando no ha pagado
        renderPaymentRequiredView(firstName) {
            return `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola, ${firstName}!</h1>
                    <p class="pata-welcome-subtitle">
                        Estás a un paso de unirte a la manada. <br>
                        Completa tu membresía para activar todos los beneficios de Pata Amiga.
                    </p>
                </div>

                <div class="pata-unified-panel show" style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border: 2px solid #FF9800;">
                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-decoration-paws">
                    
                    <div class="pata-pending-view">
                        <div style="font-size: 60px; text-align: center; margin-bottom: 20px;">💳</div>
                        <h2 class="pata-title" style="margin-bottom: 8px; color: #E65100; text-align: center;">Completa tu membresía</h2>
                        <p style="font-size: 16px; color: #444; line-height: 1.4; margin-bottom: 30px; text-align: center;">
                            Vimos que aún no has completado el pago de tu membresía.<br>
                            Selecciona un plan para activar todos los beneficios de la manada.
                        </p>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://app.pataamiga.mx/registro?reason=complete_payment" class="pata-btn" style="background: #FE8F15; color: #fff; border: 2px solid #000; padding: 18px 40px; font-size: 18px; font-weight: 900; border-radius: 50px; text-decoration: none; display: inline-block;">
                                Seleccionar Plan
                            </a>
                        </div>

                        <div style="background: rgba(254, 143, 21, 0.1); border: 2px solid #FE8F15; padding: 15px; border-radius: 25px; margin-top: 25px; text-align: center;">
                            <p style="margin:0; font-size: 14px; font-weight: 900; color: #E65100;">✨ Suscríbete con confianza</p>
                            <p style="margin:5px 0 0 0; font-size: 13px; color: #444;">Sin plazos forzosos. <strong>Cancela cuando quieras</strong> con un solo clic.</p>
                        </div>

                        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
                            ¿Tienes problemas? Escríbenos a <a href="mailto:miembros@pataamiga.mx" style="color: #00BBB4;">miembros@pataamiga.mx</a>
                        </p>
                    </div>
                </div>
            `;
        }

        // ⏳ NUEVO: Vista cuando el pago está en proceso
        renderPaymentProcessingView(firstName) {
            return `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola, ${firstName}!</h1>
                    <p class="pata-welcome-subtitle">
                        Estamos confirmando tu pago. <br>
                        Esto puede tomar unos momentos...
                    </p>
                </div>

                <div class="pata-unified-panel show" style="background: linear-gradient(135deg, #E0F7F6 0%, #B8E8E6 100%); border: 2px solid #00BBB4;">
                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-decoration-paws">
                    
                    <div class="pata-pending-view">
                        <div style="font-size: 60px; text-align: center; margin-bottom: 20px;">⏳</div>
                        <h2 class="pata-title" style="margin-bottom: 8px; color: #00695C; text-align: center;">Confirmando tu pago</h2>
                        <p style="font-size: 16px; color: #444; line-height: 1.4; margin-bottom: 30px; text-align: center;">
                            Estamos procesando tu pago con Stripe.<br>
                            Por favor, no cierres esta ventana.
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <div style="width: 50px; height: 50px; border: 5px solid #E0F7F6; border-top-color: #00BBB4; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                        </div>

                        <p style="font-size: 14px; color: #666; text-align: center;">
                            Se verificará automáticamente en unos segundos...
                        </p>
                    </div>
                </div>
            `;
        }

        // 🏁 NUEVO: Vista cuando ya pagó pero no ha terminado su registro (0 mascotas)
        renderCompleteRegistrationView(firstName) {
            return `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola de nuevo, ${firstName}! 👋</h1>
                    <p class="pata-welcome-subtitle">
                        ¡Ya casi eres parte de la manada! 🎉 <br>
                        Vimos que ya realizaste tu pago, pero aún falta completar la información de tu perfil y de tus peludos.
                    </p>
                </div>

                <div class="pata-unified-panel show" style="background: linear-gradient(135deg, #E0F7F6 0%, #B8E8E6 100%); border: 2px solid #00BBB4;">
                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-decoration-paws">
                    
                    <div class="pata-pending-view">
                        <div style="font-size: 60px; text-align: center; margin-bottom: 20px;">🐶</div>
                        <h2 class="pata-title" style="margin-bottom: 8px; color: #00695C; text-align: center;">Termina tu registro</h2>
                        <p style="font-size: 16px; color: #444; line-height: 1.4; margin-bottom: 30px; text-align: center;">
                            Para activar todos tus beneficios y el respaldo veterinario, <br>
                            necesitamos conocer un poco más de ti y de tus amigos de cuatro patas.
                        </p>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://app.pataamiga.mx/registro?reason=finish_onboarding" class="pata-btn" style="background: #00BBB4; color: #fff; border: 2px solid #000; padding: 18px 40px; font-size: 18px; font-weight: 900; border-radius: 50px; text-decoration: none; display: inline-block;">
                                Completar mi registro →
                            </a>
                        </div>

                        <div style="background: rgba(0, 187, 180, 0.1); border: 2px solid #00BBB4; padding: 15px; border-radius: 25px; margin-top: 25px; text-align: center;">
                            <p style="margin:0; font-size: 14px; font-weight: 900; color: #008884;">🛡️ Membresía Flexible</p>
                            <p style="margin:5px 0 0 0; font-size: 13px; color: #444;">Recuerda que tienes el control total: <strong>cancela en cualquier momento</strong> si lo necesitas.</p>
                        </div>

                    </div>
                </div>
            `;
        }

        renderInReviewBenefits(title = "Mientras revisamos tu registro...") {
            return `
                <div class="pata-benefits-review">
                    <h3 class="pata-benefits-title">
                        <span>✨</span> ${title}
                    </h3>
                    
                    <div class="pata-benefit-card">
                        <div class="pata-benefit-icon-box">🩺</div>
                        <div class="pata-benefit-info">
                            <h4>Acceso inmediato al chat con la Dra. PATi</h4>
                            <p>¡No tienes que esperar! Aclara dudas sobre la salud de tus peludos ahora mismo.</p>
                            <div class="pata-pati-message">
                                "A partir de ahora cuentas con acceso al chat con la Dra. PATi para cualquier duda sobre su salud, comportamiento o cuidados del día a día."
                            </div>
                        </div>
                    </div>

                    <div class="pata-benefit-card">
                        <div class="pata-benefit-icon-box">🤝</div>
                        <div class="pata-benefit-info">
                            <h4>Donaciones a refugios/ONGs</h4>
                            <p>Por cada 1,000 miembros que se suman, la manada apoya a quienes más lo necesitan. Juntos protegemos más.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // 🛡️ NUEVO: Ocultar cualquier loader global de Webflow
        hideGlobalLoaders() {
            console.log('🛡️ Unified Widget: hideGlobalLoaders called');
            const loaders = document.querySelectorAll('.loading-screen, [data-loader], #pata-auth-overlay, #login-redirect-message');
            loaders.forEach(loader => {
                loader.style.opacity = '0';
                loader.style.pointerEvents = 'none'; // Desactivar interacción inmediatamente
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 400);
                
                // Fallback agresivo: display none después de 500ms sin transiciones if it's still there
                setTimeout(() => {
                    if (loader.style.display !== 'none') loader.style.display = 'none';
                }, 600);
            });
        }

        renderOptionalDocsBanner(pet) {
            if (this.isSenior(pet) && !pet.vet_certificate_url) {
                return `
                    <div class="pata-alert-banner pata-alert-info" style="background: #F3E5F5; border-color: #7B1FA2; margin-bottom: 20px;">
                        <span>🩺</span>
                        <div>
                            <div class="pata-subtitle" style="color: #7B1FA2; font-size: 14px; margin-bottom: 5px;">Certificado pendiente (Opcional)</div>
                            <p style="margin:0; font-size:14px; color:#1A1A1A;">Como es un peludito senior (10+ años), puedes subir su certificado médico para agilizar cualquier atención futura.</p>
                            <div style="margin-top: 15px;">
                                <button class="pata-btn" id="pata-btn-open-update-cert" data-pet-id="${pet.id}" style="background: #7B1FA2; color: white; padding: 8px 20px; font-size: 14px; font-weight: 900; border-radius: 50px; cursor: pointer; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    📎 Subir Certificado
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            return '';
        }

        renderPetContent(pet) {
            let content = '';
            
            // Si falta el certificado y no estamos ya en acción requerida prevemos banner
            if (pet.status !== 'action_required') {
                content += this.renderOptionalDocsBanner(pet);
            }

            if (pet.status === 'approved') {
                return content + this.renderApprovedContent(pet);
            } else if (pet.status === 'rejected') {
                return content + this.renderRejectedContent(pet);
            } else if (pet.status === 'action_required') {
                return content + this.renderActionRequiredContent(pet);
            } else if (pet.status === 'appealed') {
                return content + this.renderAppealedContent(pet);
            } else {
                return content + this.renderPendingContent(pet);
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

                    ${this.renderInReviewBenefits()}

                    <div style="text-align: center; margin-top: 25px;">
                        <a href="https://www.pataamiga.mx/pets/pet-waiting-period#beneficios" class="pata-btn pata-btn-conocer" style="display: inline-block; text-decoration: none; background: transparent; color: #00BBB4; border: 2px solid #00BBB4; padding: 18px 60px; font-size: 18px; font-weight: 900; border-radius: 50px; width: 100%; max-width: 400px; transition: all 0.3s ease;">
                            Conoce tus futuros beneficios
                        </a>
                    </div>

                    <div style="background: rgba(255,255,255,0.3); border: 2px dashed rgba(0,0,0,0.1); padding: 12px; border-radius: 15px; margin-top: 30px; text-align: center;">
                        <p style="margin:0; font-size: 12px; color: #666;">
                            🔒 Tienes control total: <strong>cancela en cualquier momento</strong> desde tu perfil.
                        </p>
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
                <div class="pata-alert-banner" style="background: rgba(123, 31, 162, 0.05); border: 2px solid #7B1FA2; flex-direction: column; align-items: flex-start; border-radius: 30px;">
                    <div style="display:flex; gap:12px; align-items:center; width:100%; margin-bottom:12px;">
                        <span style="font-size:24px;">⚖️</span>
                        <div>
                            <div class="pata-subtitle" style="margin:0; color:#4A148C;">Apelación en Revisión para ${pet.name}</div>
                            <p style="margin:4px 0 0 0; font-size:12px; color:#616161;">Enviada el ${appealDate} • Apelación ${appealCount} de 2</p>
                        </div>
                    </div>
                    
                    <div style="background:rgba(255,255,255,0.7); padding:12px 16px; border-radius:20px; width:100%; margin-bottom:12px; border: 1px solid rgba(123, 31, 162, 0.1);">
                        <p style="margin:0; font-size:13px; color:#424242; font-weight:600;">Tu mensaje:</p>
                        <p style="margin:8px 0 0 0; font-size:14px; color:#1A1A1A; font-style:italic;">"${appealMessage}"</p>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <p style="margin:0; font-size:13px; color:#616161;">
                            <span style="font-weight:600;">📋 Estado:</span> Nuestro equipo está revisando tu caso.
                        </p>
                        <button class="pata-btn-ver-detalles" data-pet-id="${pet.id}" aria-label="Abrir chat de apelación" style="background:#7B1FA2; color:#fff; border:2px solid #000; padding:12px 24px; border-radius:50px; font-size:12px; font-weight:900; cursor:pointer; transition:0.2s;">
                            📜 Ver historial y chat
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
                ${this.renderWarningBanner(pet)}
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
                                <span>Día ${carencia.totalDays}</span>
                            </div>
                        </div>
                    </div>

                    <div class="pata-approved-sidebar">
                        <div class="pata-pet-profile">
                            <div class="pata-pet-photo-box">
                                <img src="${petImage}" alt="${pet.name}">
                            </div>
                            <div class="pata-pet-info-box">
                                <h3>${pet.name}${this.isSenior(pet) ? '<span class="pata-senior-badge">Senior</span>' : ''}</h3>
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
                        <strong>¿Adoptaste a alguno de tus compañeros?</strong><br>
                        Puedes acelerar tu acceso al fondo. <a href="https://wa.me/525637545068?text=Hola!%20Tengo%20una%20duda%20sobre%20mi%20registro%20en%20Pata%20Amiga" target="_blank" style="color: inherit; font-weight: 900; text-decoration: underline;">Contáctanos aquí</a> para validar tus documentos.
                    </div>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.5); border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); text-align: center;">
                    <p style="margin:0; font-size: 13px; color: #666;">
                        Tienes control total sobre tu suscripción. Puedes <strong>cancelar en cualquier momento</strong> desde la configuración de tu cuenta.
                    </p>
                </div>
            `;
        }

        renderRejectedContent(pet) {
            const adminMsg = pet.last_admin_response || pet.admin_notes || 'Identificamos un requisito que no está alineado con las reglas de ingreso del club.';
            const dogImage = 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990d5dd0cf5c9243b55fa43_Recurso%2011%202.png';
            const appealCount = pet.appeal_count || 0;
            const maxAppeals = 2;
            const canAppeal = appealCount < maxAppeals;

            return `
                <div class="pata-rejected-wrapper">
                    <!-- Dog pop-out image -->
                    <img src="${dogImage}" class="pata-rejected-dog-popout" alt="Pata Amiga">
                    
                    <div class="pata-rejected-white-card">
                        <div class="pata-rejected-main-info">
                            <h2 class="pata-rejected-title-hero">tu solicitud no fue aprobada</h2>
                            <p class="pata-rejected-text-hero">
                                Sabemos que este no es el resultado que esperabas y queremos explicarte el motivo con toda transparencia.
                            </p>

                            <div class="pata-rejected-reason-box">
                                <div class="pata-reason-label">Motivo del rechazo:</div>
                                <p class="pata-reason-text">${adminMsg}</p>
                            </div>
                        </div>
                        
                        <!-- Empty space for the dog in desktop -->
                        <div class="pata-dog-placeholder"></div>
                    </div>

                    <div id="pata-appeal-section" style="text-align: center; margin-top: 40px; position: relative; z-index: 10;">
                        ${!canAppeal ? `
                            <p style="color: #FFFFFF; font-size: 14px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 20px; display: inline-block;">
                                Has agotado el límite de apelaciones para esta mascota.
                            </p>
                            <div style="margin-top: 15px;">
                                <button class="pata-btn pata-btn-ver-detalles" data-pet-id="${pet.id}" aria-label="Ver historial de rechazo" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid white; border-radius: 50px; padding: 12px 30px; font-weight: 900;">
                                    📜 Ver historial y chat
                                </button>
                            </div>
                        ` : `
                            <div style="display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap;">
                                <button class="pata-btn pata-btn-ver-detalles" data-pet-id="${pet.id}" aria-label="Abrir chat para apelar rechazo" style="background: #FE8F15; color: #000; border: 2px solid #000; padding: 18px 50px; font-weight: 900; font-size: 18px; border-radius: 50px; box-shadow: 8px 8px 0 rgba(0,0,0,0.1);">
                                    💬 Ver historial y Apelar
                                </button>
                            </div>
                            <p style="margin-top: 15px; font-size: 14px; color: #FFFFFF; opacity: 0.8; font-weight: 800;">
                                Puedes apelar tu solicitud directamente desde el chat ♡
                            </p>
                            <p style="margin-top: 5px; font-size: 12px; color: #FFFFFF; opacity: 0.6; font-weight: 600;">Intentos de apelación: ${appealCount} / ${maxAppeals}</p>
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
                    <div style="margin-top: 25px;">
                        <button class="pata-btn pata-btn-ver-detalles" data-pet-id="${pet.id}" aria-label="Abrir chat para subir información" style="background: #FE8F15; color: #000; border: 2px solid #000; width: 100%; padding: 22px; font-size: 20px; font-weight: 950; border-radius: 50px; box-shadow: 10px 10px 0 rgba(0,0,0,0.1);">
                            💬 Chat con Soporte y Actualizar
                        </button>
                        <p style="margin-top: 15px; font-size: 14px; color: #FFFFFF; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                            Usa el chat para enviar las fotos o información que solicitó el equipo.
                        </p>
                    </div>
                ` : ''}
            `;
        }

        // 🆕 Renderizar el modal de actualización
        renderUpdateModal(pet) {
            const adminMsg = pet.last_admin_response || 'Por favor actualiza la información solicitada.';
            const isSenior = pet.age_value >= 10;
            const hasPhoto1 = !!(pet.photo_url || pet.primary_photo_url);
            const hasCert = !!pet.vet_certificate_url;
            
            let uploadFields = '';
            
            if (!hasPhoto1) {
                uploadFields += `
                    <div style="margin-bottom: 20px;">
                        <p style="font-weight: 800; font-size: 16px; margin-bottom: 15px;">Sube la foto principal de su álbum:</p>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 15px; max-width: 200px;">
                            <div class="pata-form-group">
                                <div class="pata-upload-area" id="pata-upload-area-1" style="min-height: 120px; border-radius: 20px;">
                                    <input type="file" accept="image/*" class="pata-upload-input" id="pata-file-1" style="display:none;">
                                    <div class="pata-upload-icon" style="font-size: 24px;">📷</div>
                                    <div class="pata-upload-text" style="font-size: 12px;">Foto Principal</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            if (isSenior && !hasCert) {
                uploadFields += `
                    <div style="margin-top: 25px; padding: 20px; background: #F3E5F5; border: 2px solid #7B1FA2; border-radius: 20px;">
                        <label style="font-weight: 900; margin-bottom: 10px; display: block; color: #7B1FA2;">🩺 Sobre su salud (Senior 10+ años):</label>
                        <div class="pata-upload-area" id="pata-upload-area-cert" style="background: #fff; border-color: #7B1FA2;">
                            <input type="file" accept=".pdf,image/*" class="pata-upload-input" id="pata-file-cert" style="display:none;">
                            <div class="pata-upload-icon">📄</div>
                            <div class="pata-upload-text" style="color: #7B1FA2;">Seleccionar certificado de salud</div>
                        </div>
                    </div>
                `;
            }

            if (hasPhoto1 && (!isSenior || hasCert)) {
                uploadFields = `
                    <div style="padding: 20px; background: #E8F5E9; border: 2px solid #4CAF50; border-radius: 20px; text-align: center; margin-bottom: 25px;">
                        <div style="font-size: 30px; margin-bottom: 10px;">✅</div>
                        <p style="margin:0; font-size: 16px; font-weight: 800; color: #2E7D32;">¡Documentos completos!</p>
                        <p style="margin:5px 0 0 0; font-size: 14px; color: #4CAF50;">Ya recibimos la información necesaria para esta etapa.</p>
                    </div>
                `;
            }

            return `
                <div class="pata-modal-overlay" id="pata-update-modal">
                    <div class="pata-modal" style="max-width: 700px;">
                        <div class="pata-modal-header" style="background: #fff; border-bottom: 2px solid #000;">
                            <h3 class="pata-modal-title" style="font-size: 28px; letter-spacing: -1px;">📸 Actualizar Información de ${pet.name}</h3>
                            <button class="pata-modal-close" id="pata-modal-close">&times;</button>
                        </div>
                        <div class="pata-modal-body" style="padding: 30px;">
                            ${pet.status === 'action_required' ? `
                                <div class="pata-admin-request" style="background: #FFF9E6; border: 2px solid #FFBD12; padding: 20px; border-radius: 20px; margin-bottom: 25px;">
                                    <div style="font-weight: 900; margin-bottom: 8px; color: #744210;">📩 Nota del equipo:</div>
                                    <p style="margin:0; font-size: 15px; line-height: 1.5; color: #444;">${adminMsg}</p>
                                </div>
                            ` : ''}

                            ${uploadFields}

                            <div style="margin-top: 25px;">
                                <label style="font-weight: 800; margin-bottom: 10px; display: block;">Mensaje adicional:</label>
                                <textarea id="pata-update-message" class="pata-textarea" placeholder="¿Quieres decirnos algo más?" style="width: 100%; min-height: 100px; padding: 15px; border-radius: 20px; border: 2px solid #F0F0F0; font-family: inherit; font-size: 15px;"></textarea>
                            </div>

                        </div>
                        <div class="pata-modal-footer" style="background: #fff; border-top: 2px solid #000; padding: 25px 30px;">
                            <button class="pata-btn pata-btn-outline" id="pata-btn-cancel-update" style="border-radius: 50px; padding: 14px 30px;">Cancelar</button>
                            <button class="pata-btn" id="pata-btn-submit-update" style="background: #00BBB4; color: #fff; border: 2px solid #000; border-radius: 50px; padding: 14px 40px; font-weight: 900;" ${this.uploading || (hasPhoto1 && (!isSenior || hasCert)) ? 'disabled' : ''}>
                                ${this.uploading ? 'Enviando...' : 'Guardar Cambios →'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderChatInterface(logs, petId, status) {
            const canSend = ['action_required', 'rejected', 'appealed'].includes(status);
            
            const bubbles = logs.map(log => {
                let bubbleClass = 'system';
                const type = log.type || '';
                
                if (type === 'user_response' || type === 'user_appeal' || type === 'user_message' || type === 'user_fulfill') {
                    bubbleClass = 'user';
                } else if (type === 'admin_request' || type === 'admin_message') {
                    bubbleClass = 'admin';
                } else if (type === 'admin_info_request') {
                    bubbleClass = 'action';
                } else {
                    bubbleClass = 'system';
                }

                const dateStr = log.date || log.created_at;
                const date = dateStr ? new Date(dateStr).toLocaleString('es-MX', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                }) : '---';

                const icon = log.icon || '📋';

                // Action bubble for info requests
                if (bubbleClass === 'action') {
                    const meta = log.metadata || {};
                    const items = meta.items || [];
                    const requestTypes = meta.request_types || [];
                    const fulfilled = meta.fulfilled === true;
                    
                    // If items are not present but request_types are (fallback for older logs)
                    const displayItems = items.length > 0 ? items : requestTypes.map(rt => {
                        const typeLabels = {
                            'PET_PHOTO_1': { label: '📸 Foto Principal' },
                            'PET_VET_CERT': { label: '🏥 Certificado Médico' },
                            'OTHER_DOC': { label: '📄 Documento Adicional' }
                        };
                        return { type: rt, label: typeLabels[rt]?.label || rt, fulfilled: false };
                    });
                    
                    const actionButtons = displayItems.map(item => {
                        if (item.fulfilled || fulfilled) {
                            return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;background:#E8F5E9;border:2px solid #4CAF50;font-size:13px;font-weight:700;color:#2E7D32;margin-bottom:4px;">✅ ${item.label} — Completado</div>`;
                        }
                        return `<button class="pata-action-btn" data-request-type="${item.type}" data-log-id="${log.id}" data-pet-id="${petId}" style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;background:#FFF3E0;border:2px solid #FE8F15;font-size:13px;font-weight:700;color:#E65100;cursor:pointer;width:100%;text-align:left;transition:0.2s;margin-bottom:4px;box-shadow: 2px 2px 0 rgba(254, 143, 21, 0.2);">${item.label} — Subir/Actualizar</button>`;
                    }).join('');
                    
                    return `
                        <div class="pata-chat-bubble admin" style="background:linear-gradient(135deg,#FFF8E1,#FFF3E0);border:2px solid #FE8F15;">
                            <div style="font-weight:900;font-size:13px;margin-bottom:8px;color:#FE8F15;">📋 Solicitud de Información</div>
                            <div style="font-size:13px;margin-bottom:12px;">${log.message}</div>
                            <div style="display:flex;flex-direction:column;gap:8px;">
                                ${actionButtons}
                            </div>
                            <span class="pata-chat-meta">${date}</span>
                        </div>
                    `;
                }

                if (bubbleClass === 'system') {
                    return `
                        <div class="pata-chat-bubble system">
                            <span style="margin-right: 8px;">${icon}</span> ${log.message}
                            <span class="pata-chat-meta">${date}</span>
                        </div>
                    `;
                }

                let messageContent = log.message || '';
                
                // Detectar imágenes en formato [Imagen adjunta](url) o links [Archivo adjunto](url)
                const imageMatch = messageContent.match(/\[Imagen adjunta\]\((.*?)\)/);
                const fileMatch = messageContent.match(/\[Archivo adjunto\]\((.*?)\)/);
                const genericLinkMatch = messageContent.match(/\[(.*?)\]\((.*?)\)/);

                if (imageMatch) {
                    const url = imageMatch[1];
                    messageContent = `
                        <div style="margin-bottom: 8px; font-weight: 700; font-size: 12px; opacity: 0.8;">📸 Imagen adjunta:</div>
                        <a href="${url}" target="_blank">
                            <img src="${url}" style="max-width: 100%; border-radius: 12px; border: 2px solid #000; display: block; margin-bottom: 5px;">
                        </a>
                    `;
                } else if (fileMatch) {
                    const url = fileMatch[1];
                    messageContent = `
                        <a href="${url}" target="_blank" style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 10px; text-decoration: none; color: inherit; border: 1px solid rgba(0,0,0,0.1);">
                            <span style="font-size: 20px;">📄</span>
                            <div style="overflow: hidden;">
                                <div style="font-weight: 700; font-size: 12px;">Documento adjunto</div>
                                <div style="font-size: 10px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${url.split('/').pop()}</div>
                            </div>
                        </a>
                    `;
                } else if (genericLinkMatch) {
                    // Fallback para cualquier link [texto](url)
                    messageContent = messageContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #00BBB4; font-weight: 700;">$1</a>');
                }

                return `
                    <div class="pata-chat-bubble ${bubbleClass}">
                        ${messageContent}
                        <span class="pata-chat-meta">${date}</span>
                    </div>
                `;
            }).join('');

            return `
                <div class="pata-chat-container">
                    <div class="pata-chat-header">
                        Historial de Comunicación
                    </div>
                    <div class="pata-chat-messages" id="pata-chat-messages-container">
                        ${logs.length === 0 ? `
                            <div class="pata-chat-empty">
                                <div style="font-size: 40px; margin-bottom: 10px;">💬</div>
                                <p style="font-weight: 900; margin: 0; color: #000;">Sin mensajes aún</p>
                                <p style="font-size: 13px; margin: 5px 0 0 0;">Aquí verás las actualizaciones de tu solicitud.</p>
                            </div>
                        ` : bubbles}
                    </div>
                    
                    ${canSend ? `
                        <div class="pata-chat-input-area" style="display: flex; gap: 10px; align-items: flex-end; padding: 15px; background: #fff; border-top: 4px solid #000;">
                            <button id="pata-chat-attach" class="pata-chat-btn" style="background: #F0F2F5; border: 2px solid #000; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; transition: 0.2s;">
                                📎
                            </button>
                            <input type="file" id="pata-chat-file-input" style="display: none;" accept="image/*,application/pdf">
                            <textarea id="pata-chat-input" placeholder="Escribe un mensaje o adjunta archivos..." class="pata-chat-input" style="border-radius: 20px; min-height: 50px; resize: none; border: 2px solid #000; flex: 1; padding: 12px 15px; font-family: inherit;"></textarea>
                            <button id="pata-chat-send" class="pata-chat-send" data-pet-id="${petId}" style="background: #00BBB4; border: 2px solid #000; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; font-weight: 900;">
                                ➔
                            </button>
                        </div>
                    ` : `
                        <div style="padding: 20px; background: #F8F9FA; border-top: 4px solid #000; text-align: center; font-size: 13px; font-weight: 800; color: #666; line-height: 1.4;">
                            El canal de comunicación se activará si nuestro equipo requiere información adicional o si tu solicitud cambia de estado.
                        </div>
                    `}
                </div>
            `;
        }

        async fetchAndRenderChat(petId) {
            const root = document.getElementById('pata-chat-root');
            if (!root) return;

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal-history?memberId=${this.member.id}&petId=${petId}`);
                const data = await res.json();

                if (!data.success) throw new Error(data.error);

                const pet = this.pets.find(p => p.id === petId);
                root.innerHTML = this.renderChatInterface(data.logs || [], petId, pet?.status);

                // Scroll to bottom
                const container = document.getElementById('pata-chat-messages-container');
                if (container) container.scrollTop = container.scrollHeight;

                // Bind send event
                const sendBtn = document.getElementById('pata-chat-send');
                if (sendBtn) {
                    sendBtn.onclick = () => this.handleSendMessage(petId);
                }

                // Bind attach events
                const attachBtn = document.getElementById('pata-chat-attach');
                const fileInput = document.getElementById('pata-chat-file-input');
                if (attachBtn && fileInput) {
                    attachBtn.onclick = () => fileInput.click();
                    fileInput.onchange = () => this.handleChatUpload(petId);
                }

                // 🆕 Bind action buttons for info requests
                const actionBtns = root.querySelectorAll('.pata-action-btn');
                actionBtns.forEach(btn => {
                    btn.onclick = () => this.handleFulfillRequest(btn.dataset.petId, btn.dataset.requestType, btn.dataset.logId, btn);
                });
            } catch (err) {
                console.error('❌ Error fetching chat:', err);
                root.innerHTML = `<div style="color:red; padding:20px; text-align:center; font-weight:800; font-size:14px;">⚠️ No se pudo cargar el historial de mensajes.</div>`;
            }
        }

        async handleChatUpload(petId) {
            const fileInput = document.getElementById('pata-chat-file-input');
            const file = fileInput?.files[0];
            const sendBtn = document.getElementById('pata-chat-send');

            if (!file) return;

            // Mostrar estado de carga en el botón
            const originalText = sendBtn.innerText;
            sendBtn.disabled = true;
            sendBtn.innerText = '⌛';

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('userId', this.member.id);

                const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                const fileUrl = data.url;
                const isImage = file.type.startsWith('image/');
                const message = isImage ? `[Imagen adjunta](${fileUrl})` : `[Archivo adjunto](${fileUrl})`;

                // Enviar mensaje con el link
                const chatRes = await fetch(`${CONFIG.apiUrl}/api/user/chat/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.member.id,
                        petId: petId,
                        message: message
                    })
                });

                const chatData = await chatRes.json();
                if (!chatData.success) throw new Error(chatData.error);

                await this.fetchAndRenderChat(petId);
            } catch (err) {
                console.error('❌ Error en upload de chat:', err);
                alert('No se pudo subir el archivo. Intenta de nuevo.');
            } finally {
                sendBtn.disabled = false;
                sendBtn.innerText = originalText;
                fileInput.value = '';
            }
        }

        async handleSendMessage(petId) {
            const input = document.getElementById('pata-chat-input');
            const btn = document.getElementById('pata-chat-send');
            const msg = input?.value?.trim();

            if (!msg) return;
            if (msg.length < 3) return alert('El mensaje es muy corto.');

            btn.disabled = true;
            btn.innerText = '...';

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/chat/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.member.id,
                        petId: petId,
                        message: msg
                    })
                });

                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                input.value = '';
                await this.fetchAndRenderChat(petId);
            } catch (err) {
                console.error('❌ Error sending message:', err);
                alert('No se pudo enviar el mensaje. Intenta de nuevo.');
            } finally {
                btn.disabled = false;
                btn.innerText = '➔';
            }
        }

        // 🆕 Handle fulfill request from action buttons
        async handleFulfillRequest(petId, requestType, logId, btnElement) {
            // Create a hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            
            // Set accept type based on request
            if (requestType === 'PET_PHOTO_1') {
                fileInput.accept = 'image/*';
            } else if (requestType === 'PET_VET_CERT') {
                fileInput.accept = 'image/*,application/pdf';
            } else {
                fileInput.accept = 'image/*,application/pdf';
            }
            
            fileInput.onchange = async () => {
                const file = fileInput.files[0];
                if (!file) return;
                
                // 10MB limit
                if (file.size > 10 * 1024 * 1024) {
                    alert('El archivo es muy grande. Máximo 10MB.');
                    return;
                }
                
                // Show loading state
                const originalHTML = btnElement.innerHTML;
                btnElement.disabled = true;
                btnElement.innerHTML = '⏳ Subiendo...';
                btnElement.style.opacity = '0.6';
                
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('petId', petId);
                    formData.append('userId', this.member.id);
                    formData.append('requestType', requestType);
                    formData.append('logId', logId);
                    
                    const res = await fetch(`${CONFIG.apiUrl}/api/user/fulfill-request`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await res.json();
                    
                    if (data.success) {
                        // Replace button with success state
                        btnElement.innerHTML = '✅ ¡Completado!';
                        btnElement.style.background = '#E8F5E9';
                        btnElement.style.border = '2px solid #4CAF50';
                        btnElement.style.color = '#2E7D32';
                        
                        // 1. Refresh full data from server to get new URLs and status
                        await this.loadData();
                        
                        // 2. Find the updated pet
                        const updatedPet = this.pets.find(p => p.id === petId);
                        
                        // 3. Update the modal background and info without closing it
                        if (updatedPet) {
                            const modal = document.getElementById('pata-pet-details-modal');
                            if (modal) {
                                // Update main image if it was photo 1
                                if (requestType === 'PET_PHOTO_1') {
                                    const mainImg = document.getElementById('pata-main-gallery-img');
                                    if (mainImg) mainImg.src = data.url;
                                }
                                
                                // Update floating status badge
                                const statusBadge = modal.querySelector('.pata-status-badge-floating');
                                if (statusBadge) {
                                    statusBadge.innerHTML = '⏳ EN REVISIÓN';
                                    statusBadge.style.background = '#FE8F15';
                                    statusBadge.style.color = '#000';
                                }
                                
                                // Refresh benefits/info rows if status changed
                                const statusValue = modal.querySelector('.pata-editorial-status-value');
                                if (statusValue) {
                                    statusValue.innerHTML = '<span style="opacity: 0.4;">🛡️</span> En revisión';
                                    statusValue.style.color = '#FE8F15';
                                }
                                
                                // Update Fact Sheet top badge
                                const topBadge = modal.querySelector('.pata-editorial-status-badge');
                                if (topBadge) {
                                    topBadge.innerText = 'EN REVISIÓN';
                                    topBadge.style.background = '#FE8F15';
                                    topBadge.style.color = '#000';
                                }
                            }
                        }

                        // 4. Refresh chat after a short delay
                        setTimeout(() => {
                            this.fetchAndRenderChat(petId);
                            // Also re-render main list in background
                            this.render();
                        }, 1000);
                    } else {
                        throw new Error(data.error || 'Error al subir');
                    }
                } catch (err) {
                    console.error('❌ Error fulfilling request:', err);
                    alert('No se pudo completar la solicitud: ' + err.message);
                    btnElement.innerHTML = originalHTML;
                    btnElement.disabled = false;
                    btnElement.style.opacity = '1';
                }
            };
            
            fileInput.click();
        }

        renderPetDetailsModal(pet) {

            const carencia = this.calculateCarencia(pet);
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;

            const photos = [
                pet.photo_url || pet.primary_photo_url,
                pet.photo2_url,
                pet.photo3_url,
                pet.photo4_url,
                pet.photo5_url
            ].filter(p => p && p.startsWith('http'));

            if (photos.length === 0) photos.push('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png');

            const registrationDate = pet.created_at ? new Date(pet.created_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric'
            }) : 'No disponible';

            const activationDate = pet.waiting_period_end ? new Date(pet.waiting_period_end).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric'
            }) : '---';

            // Distinctive Editorial Layout
            return `
                <div class="pata-modal-overlay show" id="pata-pet-details-modal" role="dialog" aria-modal="true" aria-labelledby="pata-editorial-name">
                    <div class="pata-editorial-container">
                        <div class="pata-editorial-body">
                            
                            <!-- Left Section: Visual Identity -->
                            <div class="pata-editorial-left">
                                <div class="pata-editorial-main-img-box" style="width: 100%; height: 440px; background: #fff; border-radius: 35px; border: var(--pata-border-thick); overflow: hidden; position: relative; box-shadow: 12px 12px 0 rgba(0,0,0,0.05); transform: rotate(-1deg);">
                                    <img src="${photos[0]}" id="pata-main-gallery-img" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" loading="lazy">
                                    <div class="pata-status-badge-floating" style="position: absolute; top: 20px; left: 20px; background: ${status.bg}; color: ${status.text}; border: 3px solid #000; padding: 10px 24px; border-radius: 50px; font-weight: 950; font-size: 12px; text-transform: uppercase; box-shadow: 4px 4px 0 rgba(0,0,0,0.1);">
                                        ${status.icon} ${status.label}
                                    </div>
                                </div>
                                
                                <div style="display: flex; gap: 14px; overflow-x: auto; padding: 10px 5px; scrollbar-width: none;" class="pata-no-scrollbar">
                                    ${photos.map((url, i) => `
                                        <div onclick="document.getElementById('pata-main-gallery-img').src='${url}'" style="width: 75px; height: 75px; border-radius: 18px; border: var(--pata-border-thin); overflow: hidden; cursor: pointer; flex-shrink: 0; background: #fff; transition: all 0.2s; box-shadow: 4px 4px 0 rgba(0,0,0,0.05);">
                                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Foto ${i+1}">
                                        </div>
                                    `).join('')}
                                </div>

                                ${pet.status === 'approved' ? `
                                <div style="background: #FFF; border: var(--pata-border-thick); border-radius: 30px; padding: 25px; margin-top: auto; box-shadow: 8px 8px 0 rgba(0,0,0,0.05); transform: rotate(1deg);">
                                    <div style="font-size: 14px; font-weight: 950; color: var(--pata-primary); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Estatus de Cobertura</div>
                                    <div style="height: 20px; background: #F0F0F0; border-radius: 15px; border: var(--pata-border-thin); overflow: hidden; position: relative;">
                                        <div style="width: ${carencia.percentage}%; height: 100%; background: #9fd406; border-right: var(--pata-border-thin);"></div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin-top: 12px; color: #000;">
                                        <span>Día ${Math.floor((carencia.totalDays * carencia.percentage) / 100)}</span>
                                        <span style="color: var(--pata-primary);">Faltan ${carencia.daysRemaining} días</span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>

                            <!-- Right Section: Fact Sheet -->
                            <div class="pata-editorial-right">
                                <button class="pata-modal-close" id="pata-close-details" aria-label="Cerrar expediente" style="position: absolute; top: 30px; right: 30px; background: #000; border: none; width: 44px; height: 44px; border-radius: 50%; font-size: 24px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; transition: transform 0.3s; z-index: 10;">&times;</button>
                                
                                <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                                    <div class="pata-editorial-status-badge" style="background: ${status.bg}; color: ${status.text}; border: var(--pata-border-thin); padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 950; box-shadow: 3px 3px 0 rgba(0,0,0,0.05);">
                                         ${status.label.toUpperCase()}
                                    </div>
                                    ${pet.is_senior || this.isSenior(pet) ? `
                                        <div style="background: #F3E5F5; color: #7B1FA2; border: var(--pata-border-thin); padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 950; box-shadow: 3px 3px 0 rgba(123, 31, 162, 0.1);">
                                            👑 SENIOR
                                        </div>
                                    ` : ''}
                                    ${pet.is_adopted ? `
                                        <div style="background: #E0F7FA; color: #006064; border: var(--pata-border-thin); padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 950; box-shadow: 3px 3px 0 rgba(0,0,0,0.05);">
                                            🏠 ADOPTADO
                                        </div>
                                    ` : ''}
                                </div>

                                <h2 class="pata-editorial-name" id="pata-editorial-name">${pet.name}</h2>
                                <p style="font-size: 20px; font-weight: 800; color: var(--pata-primary); margin-bottom: 45px; display: flex; align-items: center; gap: 10px; border-bottom: var(--pata-border-thick); padding-bottom: 15px; width: fit-content;">
                                    ${pet.breed || pet.pet_breed || 'Mestizo de Corazón'}
                                </p>

                                <div class="pata-editorial-info-grid">
                                    ${[
                                        { label: 'Especie', value: pet.type || (pet.pet_type === 'dog' ? 'Perro' : pet.pet_type === 'cat' ? 'Gato' : pet.pet_type) || 'Perro', icon: '🐾' },
                                        { label: 'Edad', value: (pet.age || '').replace(/years?/i, m => m.toLowerCase().endsWith('s') ? 'años' : 'año').replace(/old/i, '').trim() || (pet.age_value ? `${pet.age_value} ${pet.age_unit === 'months' ? 'meses' : 'años'}` : '1 año'), icon: '🎂' },
                                        { label: 'Género', value: pet.gender || 'Hembra', icon: '⚧' },
                                        { label: 'Color Pelo', value: pet.coat_color || pet.color || pet.pet_color || 'Multicolor', icon: '🎨' },
                                        { label: 'Nariz', value: pet.nose_color || '---', icon: '👃' },
                                        { label: 'Ojos', value: pet.eye_color || '---', icon: '👁️' },
                                        { label: 'Ingreso', value: registrationDate, icon: '📅' },
                                        { label: 'Estatus', value: status.label, icon: '🛡️', isStatus: true },
                                        ...(pet.status === 'approved' ? [{ label: 'Activación', value: activationDate, icon: '🚀' }] : [])
                                    ].map(item => `
                                        <div style="border-left: var(--pata-border-thick); border-color: var(--pata-primary); padding-left: 20px;">
                                            <div style="font-size: 11px; font-weight: 950; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${item.label}</div>
                                            <div class="${item.isStatus ? 'pata-editorial-status-value' : ''}" style="font-size: 17px; font-weight: 900; color: ${item.isStatus ? status.bg : '#000'}; display: flex; align-items: center; gap: 8px;">
                                                <span style="opacity: 0.4;">${item.icon}</span> ${item.value}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                ${pet.adoption_story ? `
                                    <div style="margin-top: 30px; background: #F1F8E9; border: var(--pata-border-thin); padding: 25px; border-radius: 30px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                                        <div style="font-size: 11px; font-weight: 950; color: #2E7D32; text-transform: uppercase; margin-bottom: 8px;">📜 Historia de Adopción</div>
                                        <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0; font-weight: 600;">${pet.adoption_story}</p>
                                    </div>
                                ` : ''}

                                ${pet.admin_notes ? `
                                    <div style="margin-top: 20px; background: #FFF9C4; border: var(--pata-border-thin); padding: 25px; border-radius: 30px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                                        <div style="font-size: 11px; font-weight: 950; color: #F57F17; text-transform: uppercase; margin-bottom: 8px;">📝 Notas del Equipo</div>
                                        <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0; font-weight: 600;">${pet.admin_notes}</p>
                                    </div>
                                ` : ''}

                                ${this.isSenior(pet) ? `
                                    <div style="background: #E1F5FE; border: var(--pata-border-thin); padding: 25px; border-radius: 30px; margin-top: 20px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                                        <div style="font-size: 11px; font-weight: 950; color: #01579B; text-transform: uppercase; margin-bottom: 8px;">Expediente Salud Senior</div>
                                        ${pet.vet_certificate_url ? 
                                            `<a href="${pet.vet_certificate_url}" target="_blank" style="color: #000; font-weight: 950; text-decoration: none; font-size: 16px; display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 40px; height: 40px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">📄</div>
                                                Ver Certificado Médico →
                                            </a>` : 
                                            '<div style="color: #D32F2F; font-weight: 950; font-size: 15px; display: flex; align-items: center; gap: 10px;">⚠️ Información de salud pendiente</div>'}
                                    </div>
                                ` : ''}

                                <!-- 🆕 Chat Interface Container - Integrated properly into flow -->
                                <div id="pata-chat-root" style="margin-top: 40px;">
                                    <div class="pata-chat-loading">
                                        <span style="font-size: 24px; animation: pataSpin 1.5s linear infinite;">⏳</span>
                                        Cargando historial de comunicación...
                                    </div>
                                </div>

                                <div style="margin-top: 50px;">
                                    <button id="pata-close-details-btn" class="pata-btn" aria-label="Cerrar expediente y volver" style="background: #FE8F15; color: #000; border: var(--pata-border-thick); width: 100%; font-size: 18px; padding: 20px; border-radius: 50px; font-weight: 950;">
                                        Cerrar Expediente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
;
        }

        renderMissingPhotosView(firstName, pet) {
            const isSenior = pet.age_value >= 10;
            const hasPhoto1 = !!(pet.photo_url || pet.primary_photo_url);
            const hasCert = !!pet.vet_certificate_url;
            
            const needsPhoto1 = !hasPhoto1;
            const needsCert = isSenior && !hasCert;

            return `
                <div class="pata-external-greeting">
                    <h1 class="pata-welcome-title">¡hola, ${firstName}!</h1>
                    <p class="pata-welcome-subtitle">
                        Estamos revisando tu perfil, pero necesitamos un último detalle.
                    </p>
                </div>

                <div class="pata-unified-panel show" style="border: 2px solid #FE8F15;">
                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-decoration-paws">
                    
                    <div class="pata-pending-view">
                        <h2 class="pata-title" style="margin-bottom: 8px;">tu registro está en revisión</h2>
                        <p style="font-size: 16px; color: #444; line-height: 1.4; margin-bottom: 25px;">
                            Sin embargo, aún falta que nos envíes información sobre tu mascota <strong>${pet.name}</strong>. 
                            ${needsCert ? '<br><span style="color: #7B1FA2; font-weight: 900;">Como es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual para completar su registro. 🐾💙</span>' : ''}
                            Tendrás 15 días para enviarnos esta información y así evitar que tu membresía sea desactivada.
                        </p>
                        
                        <div class="pata-upload-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px;">
                            ${needsPhoto1 ? `
                                <div>
                                    <label style="font-weight: 700; font-size: 13px; margin-bottom: 8px; display: block;">Foto Principal *:</label>
                                    <div class="pata-upload-area" id="pata-missing-upload-1">
                                        <input type="file" accept="image/*" class="pata-upload-input" id="pata-missing-file-1" style="display:none;">
                                        <div class="pata-upload-icon">📷</div>
                                        <div class="pata-upload-text">Foto Principal</div>
                                    </div>
                                </div>
                            ` : ''}
                            ${needsCert ? `
                                <div>
                                    <label style="font-weight: 700; font-size: 14px; margin-bottom: 10px; display: block; color: #7B1FA2;">🩺 Sobre su salud (Senior 10+ años):</label>
                                    <div class="pata-upload-area" id="pata-missing-upload-cert" style="border-color: #7B1FA2; background: #F3E5F5;">
                                        <input type="file" accept=".pdf,image/*" class="pata-upload-input" id="pata-missing-file-cert" style="display:none;">
                                        <div class="pata-upload-icon">📄</div>
                                        <div class="pata-upload-text" style="color: #7B1FA2;">Sube el certificado aquí</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div style="text-align: center;">
                            ${(needsPhoto1 || needsCert) ? `
                            <button class="pata-btn" id="pata-btn-submit-missing" style="background: #00BBB4; color: white; padding: 18px 60px; font-size: 18px; width: 100%; max-width: 400px; font-weight: 900; border-radius: 50px; margin-bottom: 15px;">
                                Enviar información →
                            </button>
                            ` : ''}
                            <br>
                            <a href="https://www.pataamiga.mx/pets/pet-waiting-period#beneficios" class="pata-btn pata-btn-conocer" style="display: inline-block; text-decoration: none; background: transparent; color: #00BBB4; border: 2px solid #00BBB4; padding: 18px 60px; font-size: 18px; font-weight: 900; border-radius: 50px; width: 100%; max-width: 400px;">
                                Conoce tus beneficios
                            </a>
                        </div>

                        ${this.renderInReviewBenefits()}
                    </div>
                </div>
            `;
        }

        renderUploadSuccess() {
            return `
                <div class="pata-unified-panel show" style="text-align: center; padding: 60px 40px; border: 2px solid #4CAF50;">
                    <div style="font-size: 80px; margin-bottom: 20px;">✅</div>
                    <h2 class="pata-title" style="color: #4CAF50; margin-bottom: 15px;">¡Gracias!</h2>
                    <p style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-bottom: 10px;">
                        Hemos recibido tus fotos correctamente.
                    </p>
                    <p style="font-size: 16px; color: #666;">
                        Tu solicitud ahora está lista para ser revisada por nuestro equipo.<br>
                        En unos segundos serás redirigido a tu estatus actualizado.
                    </p>
                </div>
            `;
        }

        attachMissingPhotosEvents(pet) {
            this.setupMissingPhotoUpload('pata-missing-upload-1', 'pata-missing-file-1', 'photo1');
            this.setupMissingPhotoUpload('pata-missing-upload-cert', 'pata-missing-file-cert', 'cert');

            const submitBtn = document.getElementById('pata-btn-submit-missing');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const isSenior = pet.age_value >= 10;

                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Subiendo información...';

                    try {
                        let photo1Url = null;
                        let vetCertificateUrl = null;

                        if (this.missingPhotosFiles.photo1) {
                            photo1Url = await this.uploadPhoto(this.missingPhotosFiles.photo1);
                        }

                        if (this.missingPhotosFiles.cert) {
                            vetCertificateUrl = await this.uploadPhoto(this.missingPhotosFiles.cert);
                        }

                        submitBtn.innerText = 'Actualizando mascota...';

                        const updateRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/${pet.id}/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: this.member.id,
                                photo1Url: photo1Url,
                                vetCertificateUrl: vetCertificateUrl,
                                message: 'Fotos subidas post-registro' + (isSenior ? ' (incluye certificado senior)' : '')
                            })
                        });

                        const updateData = await updateRes.json();
                        if (updateData.success) {
                            // Mostrar pantalla de éxito
                            this.container.innerHTML = this.renderUploadSuccess();
                            setTimeout(() => {
                                location.reload();
                            }, 3500);
                        } else {
                            throw new Error(updateData.error);
                        }
                    } catch (e) {
                        console.error('Error uploading missing photos:', e);
                        alert('Error: ' + e.message);
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Enviar información →';
                    }
                };
            }
        }

        setupMissingPhotoUpload(areaId, fileId, key) {
            const area = document.getElementById(areaId);
            const input = document.getElementById(fileId);
            if (area && input) {
                area.onclick = () => input.click();
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.missingPhotosFiles[key] = file;
                        area.classList.add('has-file');
                        const isImage = file.type.startsWith('image/');
                        area.innerHTML = `
                            ${isImage ? `<img src="${URL.createObjectURL(file)}" class="pata-upload-preview">` : `<div class="pata-upload-preview" style="display:flex; align-items:center; justify-content:center; background:#f5f5f5; border-radius:10px;"><span style="font-size:30px;">📄</span></div>`}
                            <div class="pata-upload-filename">✓ ${file.name.substring(0, 15)}...</div>
                        `;
                    }
                };
            }
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

            // Delegación de eventos para el contenedor
            this.container.onclick = (e) => {
                const detailsBtn = e.target.closest('.pata-btn-ver-detalles');
                if (detailsBtn) {
                    const petId = detailsBtn.dataset.petId;
                    // Buscar la mascota por ID (más robusto para botones fuera del tab actual)
                    const pet = petId ? this.pets.find(p => p.id === petId) : this.pets[this.currentIndex];
                    if (!pet) return;

                    const modalHtml = this.renderPetDetailsModal(pet);
                    const modalDiv = document.createElement('div');
                    modalDiv.id = 'pata-details-modal-wrapper';
                    modalDiv.innerHTML = modalHtml;
                    document.body.appendChild(modalDiv);

                    // Close events
                    const close = () => modalDiv.remove();

                    const closeBtn1 = document.getElementById('pata-close-details');
                    const closeBtn2 = document.getElementById('pata-close-details-btn');
                    if (closeBtn1) closeBtn1.onclick = close;
                    if (closeBtn2) closeBtn2.onclick = close;

                    // 🆕 Initialize Chat
                    this.fetchAndRenderChat(pet.id);

                    const modalOverlay = document.getElementById('pata-pet-details-modal');
                    if (modalOverlay) {
                        modalOverlay.onclick = (ev) => {
                            if (ev.target.id === 'pata-pet-details-modal') close();
                        };
                    }
                }
            };



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


            // 🆕 Abrir modal desde banner opcional
            const openUpdateCertBtn = document.getElementById('pata-btn-open-update-cert');
            if (openUpdateCertBtn) {
                openUpdateCertBtn.onclick = () => {
                    this.showUpdateModal = true;
                    this.uploadFiles = { photo1: null, photo2: null, photo3: null, photo4: null, photo5: null, cert: null };
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

            // Upload areas (Dynamic for 5 photos)
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
                            const isImage = file.type.startsWith('image/');
                            area.innerHTML = `
                                ${isImage ? `<img src="${URL.createObjectURL(file)}" class="pata-upload-preview">` : `<div class="pata-upload-preview" style="display:flex; align-items:center; justify-content:center; background:#f5f5f5; border-radius:10px;"><span style="font-size:30px;">📄</span></div>`}
                                <div class="pata-upload-filename">✓ ${key === 'cert' ? 'Certificado' : 'Foto ' + key.replace('photo', '')}</div>
                            `;
                        }
                    };
                }
            };

            [1, 2, 3, 4, 5].forEach(num => {
                setupUpload(`pata-upload-area-${num}`, `pata-file-${num}`, `photo${num}`);
            });
            setupUpload('pata-upload-area-cert', 'pata-file-cert', 'cert');

            // Submit update
            const submitBtn = document.getElementById('pata-btn-submit-update');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const hasFiles = [1, 2, 3, 4, 5].some(num => this.uploadFiles[`photo${num}`]) || this.uploadFiles.cert;
                    if (!hasFiles) {
                        return alert('Por favor selecciona al menos un archivo para subir.');
                    }

                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Subiendo archivos...';
                    this.uploading = true;

                    try {
                        const pet = this.pets[this.currentIndex];
                        
                        let photoUrls = [null, null, null, null, null];
                        let vetCertificateUrl = null;

                        // Subir fotos
                        for (let i = 1; i <= 5; i++) {
                            if (this.uploadFiles[`photo${i}`]) {
                                submitBtn.innerText = `Subiendo foto ${i}...`;
                                const formData = new FormData();
                                formData.append('file', this.uploadFiles[`photo${i}`]);
                                formData.append('userId', this.member.id);
                                const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                                    method: 'POST',
                                    body: formData
                                });
                                const data = await res.json();
                                if (data.success) {
                                    photoUrls[i - 1] = data.url;
                                } else {
                                    throw new Error(`Error al subir foto ${i}: ` + (data.error || 'Error desconocido'));
                                }
                            }
                        }

                        // Subir certificado (si aplica)
                        if (this.uploadFiles.cert) {
                            submitBtn.innerText = 'Subiendo certificado...';
                            const formData = new FormData();
                            formData.append('file', this.uploadFiles.cert);
                            formData.append('userId', this.member.id);
                            const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                                method: 'POST',
                                body: formData
                            });
                            const data = await res.json();
                            if (data.success) {
                                vetCertificateUrl = data.url;
                            } else {
                                throw new Error('Error al subir certificado: ' + (data.error || 'Error desconocido'));
                            }
                        }

                        submitBtn.innerText = 'Guardando...';
                        const message = document.getElementById('pata-update-message')?.value || '';

                        // Actualizar mascota
                        const updateRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/${pet.id}/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: this.member.id,
                                photo1Url: photoUrls[0],
                                photo2Url: photoUrls[1],
                                photo3Url: photoUrls[2],
                                photo4Url: photoUrls[3],
                                photo5Url: photoUrls[4],
                                vetCertificateUrl,
                                message
                            })
                        });

                        const updateData = await updateRes.json();
                        console.log('📥 Respuesta API:', updateData);

                        if (updateData.success) {
                            alert('✅ ' + updateData.message);
                            location.reload();
                        } else {
                            throw new Error(updateData.error || 'Error desconocido en servidor');
                        }
                    } catch (e) {
                        console.error('❌ Error en proceso de actualización:', e);
                        alert('Error: ' + e.message);
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
                            const isImage = file.type.startsWith('image/');
                            preview.innerHTML = `
                                ${isImage ? `<img src="${ev.target.result}" style="max-width:100%; max-height:80px; border-radius:4px; object-fit:cover;">` : `<div style="width:100%; height:80px; background:#f5f5f5; border-radius:4px; display:flex; align-items:center; justify-content:center;"><span style="font-size:30px;">📄</span></div>`}
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
                if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            };
        }

        // 🆕 Subir foto a Supabase Storage
        async uploadPhoto(file) {
            // Validación Cliente: Formato y Tamaño
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                if (file.type === 'image/webp') {
                    throw new Error('Formato WebP no soportado. Por favor usa JPG o PNG.');
                }
                throw new Error(`Formato ${file.type} no soportado. Solo JPG, PNG o PDF.`);
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                throw new Error('El archivo excede 10MB. Por favor comprímelo o usa un archivo más pequeño.');
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
        document.addEventListener('DOMContentLoaded', () => {
            window.pataWidget = new UnifiedWidget('pata-amiga-membership-widget');
        });
    } else {
        window.pataWidget = new UnifiedWidget('pata-amiga-membership-widget');
    }

})();
