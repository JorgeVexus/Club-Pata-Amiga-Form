/**
 * 🎡 Club Pata Amiga - Unified Membership Widget (Tabs + Carencia + Apelación)
 * 
 * Este widget unifica el panel de período de carencia y el sistema de apelaciones.
 * Se adapta dinámicamente al estado de cada mascota individualmente.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: 'https://club-pata-amiga-form.vercel.app',
        brandColor: '#00BBB4',
        progressColor: '#9fd406',
        countdownBg: '#C8E600'
    };

    const STYLES = `
        .pata-unified-panel {
            background-color: #00BBB4;
            border-radius: 16px;
            padding: 32px;
            max-width: 920px;
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            font-family: 'Outfit', 'Inter', sans-serif;
            color: #1A1A1A;
            display: none;
        }

        .pata-unified-panel.show { display: block; animation: pataFadeIn 0.5s ease-out; }

        @keyframes pataFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .pata-welcome-msg { color: #fff; font-size: 16px; margin-bottom: 24px; line-height: 1.5; }

        .pata-pet-tabs { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }

        .pata-tab-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid transparent;
            border-radius: 8px;
            padding: 10px 20px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #1A1A1A;
        }

        .pata-tab-btn:hover { background: rgba(255,255,255,0.4); }
        .pata-tab-btn.active { background: #fff; border-color: #9fd406; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

        /* Contenido del Panel */
        .pata-panel-content { display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; }

        @media (max-width: 768px) { .pata-panel-content { grid-template-columns: 1fr; } }

        .pata-title { font-size: 28px; font-weight: 700; margin: 0 0 8px 0; }
        .pata-subtitle { font-size: 18px; font-weight: 600; margin: 0 0 15px 0; }

        /* Barra de Progreso (Carencia) */
        .pata-progress-container { margin-bottom: 20px; }
        .pata-progress-labels { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
        .pata-progress-bar-bg { height: 32px; background: rgba(255,255,255,0.3); border-radius: 20px; position: relative; }
        .pata-progress-bar-fill { height: 100%; background: #9fd406; border-radius: 20px; transition: width 1s ease; width: 0%; position: relative; }
        .pata-progress-dog { position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 45px; }

        /* Caja de Cuenta Regresiva */
        .pata-countdown-box {
            background: #C8E600;
            border: 3px dashed #1A1A1A;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            min-width: 160px;
        }
        .pata-countdown-num { font-size: 60px; font-weight: 900; line-height: 1; }

        /* Estados de Apelación */
        .pata-alert-banner {
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 600;
            background: #fff;
        }
        .pata-alert-error { border: 2px solid #D32F2F; color: #D32F2F; }
        .pata-alert-info { border: 2px solid #1976D2; color: #1976D2; }
        .pata-alert-warning { border: 2px solid #F57F17; color: #F57F17; }

        .pata-appeal-form { margin-top: 15px; display: none; }
        .pata-appeal-form.active { display: block; animation: pataSlideDown 0.3s ease; }

        @keyframes pataSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        .pata-textarea {
            width: 100%; height: 100px; padding: 12px; border: 2px solid #eee;
            border-radius: 12px; margin-bottom: 12px; font-family: inherit; resize: none;
            box-sizing: border-box;
        }
        .pata-textarea:focus { border-color: #1A1A1A; outline: none; }

        .pata-btn {
            background: #1A1A1A; color: #fff; padding: 12px 24px; border-radius: 50px;
            border: none; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .pata-btn:hover { transform: scale(1.02); opacity: 0.9; }
        .pata-btn-outline { background: transparent; border: 2px solid #1A1A1A; color: #1A1A1A; }
    `;

    class UnifiedWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
            this.userExtra = { lastAdminResponse: '', actionRequiredFields: [] };
            this.currentIndex = 0;
            this.showAppealForm = false;

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

                if (this.pets.length > 0) {
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
            const start = new Date(pet.created_at); // O un campo específico de registro
            const totalDays = 180; // Estándar, se puede traer del pet data si existe

            const diffTime = Math.abs(now - start);
            const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, totalDays - daysPassed);
            const percentage = Math.min(100, Math.round((daysPassed / totalDays) * 100));

            return { daysRemaining, percentage, totalDays };
        }

        render() {
            const pet = this.pets[this.currentIndex];
            if (!pet) return;

            this.container.innerHTML = `
                <div class="pata-unified-panel show">
                    <p class="pata-welcome-msg">Nos encanta tenerte aquí. Administra la membresía de tus compañeros en un solo lugar.</p>
                    
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

        renderPetContent(pet) {
            if (pet.status === 'approved') {
                return this.renderApprovedContent(pet);
            } else if (pet.status === 'rejected') {
                return this.renderRejectedContent(pet);
            } else if (pet.status === 'action_required') {
                return this.renderActionRequiredContent(pet);
            } else {
                return `
                    <div class="pata-alert-banner pata-alert-info">
                        <span>⏳</span>
                        <div>
                            <div class="pata-subtitle">Solicitud en revisión para ${pet.name}</div>
                            <p style="margin:0; font-size:14px; color:inherit;">Estamos validando tus documentos. Recibirás una notificación pronto.</p>
                        </div>
                    </div>
                `;
            }
        }

        renderApprovedContent(pet) {
            const carencia = this.calculateCarencia(pet);
            return `
                <div class="pata-panel-content">
                    <div class="pata-period-info">
                        <h2 class="pata-title">Período de carencia para ${pet.name}</h2>
                        <p class="pata-subtitle">¡Vas por buen camino!</p>
                        <p class="pata-msg">Faltan <strong>${carencia.daysRemaining}</strong> días para activar el fondo completo.</p>
                        
                        <div class="pata-progress-container">
                            <div class="pata-progress-labels">
                                <span>Día 1</span>
                                <strong>${carencia.percentage}% completado</strong>
                                <span>Día ${carencia.totalDays}</span>
                            </div>
                            <div class="pata-progress-bar-bg">
                                <div class="pata-progress-bar-fill" style="width: ${carencia.percentage}%">
                                    <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png" class="pata-progress-dog">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="pata-countdown-box">
                        <div style="font-size:12px; font-weight:600;">Tiempo restante</div>
                        <div class="pata-countdown-num">${carencia.daysRemaining}</div>
                        <div style="font-weight:700;">Días</div>
                    </div>
                </div>
            `;
        }

        renderRejectedContent(pet) {
            const memberStatus = this.member.customFields?.['approval-status'];
            const appealMessage = this.member.customFields?.['appeal-message'];
            const adminMsg = this.userExtra?.lastAdminResponse;

            return `
                <div class="pata-alert-banner pata-alert-error">
                    <span>❌</span>
                    <div>
                        <div class="pata-subtitle">Solicitud rechazada para ${pet.name}</div>
                        <p style="margin:0; font-size:14px; color:inherit;">${pet.admin_notes || 'No se pudo aprobar la solicitud por inconsistencias en los datos.'}</p>
                    </div>
                </div>

                ${adminMsg ? `
                    <div class="pata-alert-banner pata-alert-warning" style="background: #FFF9C4; border-color: #FBC02D;">
                        <span>💡</span>
                        <div>
                            <div class="pata-subtitle" style="color: #616161; font-size: 14px; margin-bottom: 5px;">Requerimiento del Administrador:</div>
                            <p style="margin:0; font-size:14px; color:#1A1A1A; font-weight: 700;">${adminMsg}</p>
                        </div>
                    </div>
                ` : ''}

                <div id="pata-appeal-section">
                    ${memberStatus === 'appealed' ? `
                        <div class="pata-alert-banner pata-alert-info" style="flex-direction: column; align-items: flex-start;">
                            <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
                                <span>📩</span>
                                <div class="pata-subtitle" style="margin:0;">Apelación en Revisión</div>
                            </div>
                            <p style="margin:0; font-size:14px; color:inherit; font-style: italic;">"${appealMessage || 'Sin mensaje registrado.'}"</p>
                            <p style="margin:10px 0 0 0; font-size:12px; opacity:0.8;">Nuestro equipo está revisando tu caso. Te notificaremos pronto.</p>
                        </div>
                    ` : !this.showAppealForm ? `
                        <button class="pata-btn" id="pata-btn-reveal-appeal">Apelar decisión</button>
                    ` : `
                        <div class="pata-appeal-form active">
                            <p style="font-size:14px; margin-bottom:10px;">Cuéntanos por qué debemos reconsiderar el caso de ${pet.name}:</p>
                            <textarea id="pata-textarea-appeal" class="pata-textarea" placeholder="Describe tu situación..."></textarea>
                            <div style="display:flex; gap:10px;">
                                <button class="pata-btn" id="pata-btn-submit-appeal">Enviar Apelación</button>
                                <button class="pata-btn pata-btn-outline" id="pata-btn-cancel-appeal">Cancelar</button>
                            </div>
                        </div>
                    `}
                </div>
            `;
        }

        renderActionRequiredContent(pet) {
            const adminMsg = this.userExtra?.lastAdminResponse;

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
                    this.render();
                };
            }

            // Submit appeal
            const submitBtn = document.getElementById('pata-btn-submit-appeal');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const msg = document.getElementById('pata-textarea-appeal').value;
                    if (msg.trim().length < 10) return alert('Por favor describe tu caso.');

                    submitBtn.innerText = 'Enviando...';
                    submitBtn.disabled = true;

                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                memberId: this.member.id,
                                petId: this.pets[this.currentIndex].id, // En la API de appeal debemos soportar petId si queremos granularidad total
                                appealMessage: msg
                            })
                        });
                        if (res.ok) {
                            alert('Apelación enviada correctamente.');
                            location.reload();
                        }
                    } catch (e) { alert('Error al enviar.'); }
                };
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
