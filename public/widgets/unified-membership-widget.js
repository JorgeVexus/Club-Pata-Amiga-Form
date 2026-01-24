/**
 * 🎡 Club Pata Amiga - Unified Membership Widget (Tabs + Carencia + Apelación)
 * 
 * Este widget unifica el panel de período de carencia y el sistema de apelaciones.
 * Se adapta dinámicamente al estado de cada mascota individualmente.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://club-pata-amiga-form.vercel.app',
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
        .pata-btn-success { background: #4CAF50; }
        .pata-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Modal de Actualización */
        .pata-modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            padding: 20px; box-sizing: border-box;
        }
        .pata-modal {
            background: #fff; border-radius: 16px; max-width: 500px; width: 100%;
            max-height: 90vh; overflow-y: auto; animation: pataFadeIn 0.3s ease;
        }
        .pata-modal-header {
            padding: 20px; border-bottom: 1px solid #eee;
            display: flex; justify-content: space-between; align-items: center;
        }
        .pata-modal-title { font-size: 18px; font-weight: 700; margin: 0; }
        .pata-modal-close { background: none; border: none; font-size: 24px; cursor: pointer; padding: 0; }
        .pata-modal-body { padding: 20px; }
        .pata-modal-footer { padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end; }

        .pata-admin-request {
            background: #FFF3E0; border-radius: 8px; padding: 15px; margin-bottom: 20px;
            border-left: 4px solid #FF9800;
        }
        .pata-admin-request-label { font-size: 12px; color: #E65100; font-weight: 600; margin-bottom: 5px; }
        .pata-admin-request-msg { margin: 0; font-size: 14px; color: #333; }

        .pata-upload-area {
            border: 2px dashed #ddd; border-radius: 12px; padding: 30px;
            text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 15px;
        }
        .pata-upload-area:hover { border-color: #00BBB4; background: #f9f9f9; }
        .pata-upload-area.has-file { border-color: #4CAF50; background: #E8F5E9; }
        .pata-upload-icon { font-size: 40px; margin-bottom: 10px; }
        .pata-upload-text { font-size: 14px; color: #666; }
        .pata-upload-input { display: none; }
        .pata-upload-preview { max-width: 100%; max-height: 150px; border-radius: 8px; margin-top: 10px; }
        .pata-upload-filename { font-size: 12px; color: #4CAF50; margin-top: 5px; font-weight: 600; }
    `;


    class UnifiedWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
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
            } else if (pet.status === 'appealed') {
                return this.renderAppealedContent(pet);
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
            // 🆕 Ahora usa el estado y contador de apelaciones de la mascota individual
            const appealCount = pet.appeal_count || 0;
            const maxAppeals = 2;
            const canAppeal = appealCount < maxAppeals;
            const adminMsg = pet.last_admin_response;

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
                    ${!canAppeal ? `
                        <div class="pata-alert-banner" style="background: #ECEFF1; border-left: 4px solid #90A4AE;">
                            <span>⚠️</span>
                            <div>
                                <div class="pata-subtitle" style="color:#455A64;">Límite de apelaciones alcanzado</div>
                                <p style="margin:4px 0 0 0; font-size:13px; color:#616161;">Has utilizado las ${maxAppeals} apelaciones disponibles para ${pet.name}. Contacta soporte si necesitas ayuda adicional.</p>
                            </div>
                        </div>
                    ` : !this.showAppealForm ? `
                        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                            <button class="pata-btn" id="pata-btn-reveal-appeal" data-pet-id="${pet.id}">⚖️ Apelar decisión</button>
                            <span style="font-size:12px; color:#666;">Intentos restantes: ${maxAppeals - appealCount}</span>
                        </div>
                    ` : `
                        <div class="pata-appeal-form active">
                            <p style="font-size:14px; margin-bottom:10px;">Cuéntanos por qué debemos reconsiderar el caso de ${pet.name}:</p>
                            <textarea id="pata-textarea-appeal" class="pata-textarea" placeholder="Describe tu situación..." data-pet-id="${pet.id}"></textarea>
                            
                            <!-- 🆕 Sección de carga de fotos -->
                            <div style="margin-top:15px; padding:15px; background:#f8f9fa; border-radius:8px; border:1px dashed #ccc;">
                                <p style="margin:0 0 10px 0; font-size:13px; font-weight:600; color:#333;">📷 ¿Tienes nuevas fotos? (opcional)</p>
                                <p style="margin:0 0 12px 0; font-size:12px; color:#666;">Si las fotos anteriores tenían problemas, puedes subir nuevas aquí.</p>
                                
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                    <div class="pata-upload-area" id="pata-appeal-upload-1" style="border:2px dashed #ddd; border-radius:8px; padding:15px; text-align:center; cursor:pointer; background:#fff; transition:all 0.2s;">
                                        <input type="file" id="pata-appeal-file-1" accept="image/*" style="display:none;">
                                        <div id="pata-appeal-preview-1">
                                            <span style="font-size:28px;">📸</span>
                                            <p style="margin:5px 0 0 0; font-size:12px; color:#888;">Foto 1</p>
                                        </div>
                                    </div>
                                    <div class="pata-upload-area" id="pata-appeal-upload-2" style="border:2px dashed #ddd; border-radius:8px; padding:15px; text-align:center; cursor:pointer; background:#fff; transition:all 0.2s;">
                                        <input type="file" id="pata-appeal-file-2" accept="image/*" style="display:none;">
                                        <div id="pata-appeal-preview-2">
                                            <span style="font-size:28px;">📸</span>
                                            <p style="margin:5px 0 0 0; font-size:12px; color:#888;">Foto 2</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display:flex; gap:10px; margin-top:15px;">
                                <button class="pata-btn" id="pata-btn-submit-appeal" data-pet-id="${pet.id}">Enviar Apelación</button>
                                <button class="pata-btn pata-btn-outline" id="pata-btn-cancel-appeal">Cancelar</button>
                            </div>
                            <p style="font-size:11px; color:#888; margin-top:8px;">Apelación ${appealCount + 1} de ${maxAppeals}</p>
                        </div>
                    `}
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
                        const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                memberId: this.member.id,
                                petId: petId,
                                appealMessage: msg
                            })
                        });

                        const data = await res.json();

                        if (!res.ok) {
                            alert(`❌ ${data.error || 'Error al enviar la apelación. Intenta nuevamente.'}`);
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
                        alert('❌ Error de conexión. Verifica tu internet e intenta nuevamente.');
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

            // Drag and drop
            area.ondragover = (e) => {
                e.preventDefault();
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
