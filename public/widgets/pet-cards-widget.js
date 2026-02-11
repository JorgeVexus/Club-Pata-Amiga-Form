/**
 * 🐾 Club Pata Amiga - Pet Cards Widget (Simplified - Cards Only)
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        maxPets: 3,
        placeholderDog: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png',
        statusColors: {
            approved: { bg: '#E8F5E9', text: '#2E7D32', label: 'APROBADA', icon: '✅' },
            pending: { bg: '#FFF3E0', text: '#EF6C00', label: 'PENDIENTE', icon: '⏳' },
            rejected: { bg: '#FFEBEE', text: '#C62828', label: 'RECHAZADA', icon: '❌' },
            action_required: { bg: '#E3F2FD', text: '#1565C0', label: 'ACCION REQUERIDA', icon: '⚠️' },
            appealed: { bg: '#F3E5F5', text: '#7B1FA2', label: 'APELADA', icon: '⚖️' }
        }
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');

        /* Cards Grid - Horizontal Layout */
        .pata-cards-grid {
            display: flex;
            flex-direction: row;
            gap: 20px;
            justify-content: center;
            align-items: stretch;
            flex-wrap: nowrap;
            font-family: 'Outfit', sans-serif;
        }

        /* Pet Card */
        .pata-pet-card {
            background: #fff;
            border-radius: 20px;
            width: 220px;
            min-width: 220px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: transform 0.3s ease;
        }
        .pata-pet-card:hover { transform: translateY(-8px); }

        /* Photo Container */
        .pata-card-photo {
            width: 100%;
            height: 260px;
            background: #00BBB4;
            position: relative;
            overflow: hidden;
        }
        .pata-card-photo img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover;
            display: block;
        }

        /* Status Badge */
        .pata-status-badge {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 800;
            z-index: 5;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }

        /* Name Badge */
        .pata-name-badge {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 8px 22px;
            border-radius: 30px;
            font-weight: 800;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            z-index: 5;
            white-space: nowrap;
        }

        /* Buttons Area */
        .pata-card-actions {
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-btn {
            padding: 12px;
            border-radius: 30px;
            border: none;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
            transition: opacity 0.2s;
        }
        .pata-btn:hover { opacity: 0.85; }
        .pata-btn-outline { background: #fff; color: #1A1A1A; border: 2px solid #1A1A1A; }
        .pata-btn-primary { background: #9FD406; color: #1A1A1A; }
        .pata-btn:disabled { background: #F5F5F5; color: #AAA; border-color: #EEE; cursor: default; }

        /* Add Card */
        .pata-add-card {
            width: 220px;
            min-width: 220px;
            min-height: 360px;
            background: rgba(255,255,255,0.5);
            border: 2px dashed #999;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
            cursor: pointer;
            transition: 0.3s;
            box-sizing: border-box;
        }
        .pata-add-card:hover { border-color: #9FD406; background: #fff; }

        /* Modal */
        .pata-modal-overlay {
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.8); z-index: 100000; 
            display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .pata-modal-box {
            background: #fff; border-radius: 24px; padding: 35px; 
            position: relative; max-width: 550px; width: 100%;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }

        /* Responsive */
        @media (max-width: 750px) {
            .pata-cards-grid { flex-wrap: wrap; }
            .pata-pet-card, .pata-add-card { width: 100%; max-width: 280px; min-width: auto; }
        }

        /* Breed Autocomplete */
        .pata-breed-wrapper { position: relative; grid-column: 1 / -1; }
        .pata-breed-suggestions {
            position: absolute; top: 100%; left: 0; right: 0;
            background: #fff; border: 1px solid #ddd; border-top: none;
            border-radius: 0 0 8px 8px; max-height: 200px; overflow-y: auto;
            z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: none;
        }
        .pata-breed-suggestions.active { display: block; }
        .pata-breed-suggestion {
            padding: 10px 12px; cursor: pointer; font-size: 13px;
            border-bottom: 1px solid #f0f0f0; transition: background 0.15s;
        }
        .pata-breed-suggestion:hover { background: #f5f5f5; }
        .pata-breed-suggestion:last-child { border-bottom: none; }
        .pata-breed-suggestion.selected { background: #E8F5E9; }
        .pata-breed-warning {
            padding: 8px 12px; background: #FFF8E1; border-left: 3px solid #FF9800;
            margin-top: 8px; border-radius: 0 8px 8px 0; font-size: 11px; color: #666;
        }
    `;

    class ManadaWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
            this.msFields = {};
            if (!this.container) return;
            this.init();
        }

        async init() {
            this.injectStyles();
            this.container.innerHTML = `<div style="text-align:center; padding: 40px; color:#888; font-family:'Outfit',sans-serif;">🐾 Cargando...</div>`;

            try {
                await this.waitForMemberstack();
                if (!this.member) {
                    this.container.innerHTML = '<div style="text-align:center; padding: 40px; color:#888;">Inicia sesión para ver tus mascotas.</div>';
                    return;
                }
                await this.loadData();
                this.render();
            } catch (err) {
                console.error('Widget Error:', err);
            }
        }

        injectStyles() {
            if (document.getElementById('pata-cards-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-cards-styles';
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
                            this.msFields = data?.customFields || {};
                            resolve();
                        });
                    } else if (attempts > 100) { clearInterval(check); resolve(); }
                }, 100);
            });
        }

        async loadData() {
            const res = await fetch(`${CONFIG.apiUrl}/api/user/pets?userId=${this.member.id}`);
            const data = await res.json();
            if (data.success) {
                this.pets = data.pets || [];
            }
        }

        render() {
            const petCards = this.pets.map((pet, idx) => this.createPetCardHtml(pet, idx + 1)).join('');
            const addCard = this.pets.length < CONFIG.maxPets ? this.createAddCardHtml() : '';

            this.container.innerHTML = `
                <div class="pata-cards-grid">
                    ${petCards}
                    ${addCard}
                </div>
            `;
        }

        createPetCardHtml(pet, index) {
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;
            const msPhotoUrl = this.msFields[`pet-${index}-photo-1-url`];
            const imageUrl = pet.photo_url || msPhotoUrl || CONFIG.placeholderDog;

            let statusBtn = '';

            if (pet.status === 'approved') {
                // Mascota aprobada - mostrar carencia o botón de apoyo
                const regDate = new Date(pet.created_at);
                const diffDays = Math.ceil(Math.abs(new Date() - regDate) / (1000 * 60 * 60 * 24));
                const remaining = Math.max(0, 180 - diffDays);
                if (remaining > 0) {
                    statusBtn = `<button class="pata-btn pata-btn-primary" disabled>Carencia: ${remaining} d</button>`;
                } else {
                    statusBtn = `<button class="pata-btn pata-btn-primary">Solicitar Apoyo</button>`;
                }
            } else if (pet.status === 'rejected' || pet.status === 'action_required') {
                // Mascota rechazada o con acción requerida - mostrar botón de apelar
                const appealCount = pet.appeal_count || 0;
                const canAppeal = appealCount < 2;
                if (canAppeal) {
                    statusBtn = `<button class="pata-btn pata-btn-primary" style="background:#7B1FA2; color:#fff;" onclick="event.stopPropagation(); window.ManadaWidget.showAppealForm('${pet.id}')">⚖️ Apelar</button>`;
                } else {
                    statusBtn = `<button class="pata-btn pata-btn-primary" disabled>Sin más apelaciones</button>`;
                }
            } else if (pet.status === 'appealed') {
                // Mascota ya apelada - mostrar estado
                statusBtn = `<button class="pata-btn pata-btn-primary" disabled style="background:#F3E5F5; color:#7B1FA2;">Apelación en revisión</button>`;
            } else {
                // Pendiente u otro estado
                statusBtn = `<button class="pata-btn pata-btn-primary" disabled>Esperando revisión</button>`;
            }

            return `
                <div class="pata-pet-card">
                    <div class="pata-card-photo">
                        <div class="pata-status-badge" style="background:${status.bg}; color:${status.text}">
                            ${status.icon} ${status.label}
                        </div>
                        <img src="${imageUrl}" alt="${pet.name}" onerror="this.src='${CONFIG.placeholderDog}';">
                        <div class="pata-name-badge">${pet.name}</div>
                    </div>
                    <div class="pata-card-actions">
                        <button class="pata-btn pata-btn-outline" onclick="window.ManadaWidget.showDetails('${pet.id}')">Ver detalles</button>
                        ${statusBtn}
                    </div>
                </div>
            `;
        }

        createAddCardHtml() {
            return `
                <div class="pata-add-card" onclick="window.ManadaWidget.showAddForm()">
                    <div style="font-size:30px; margin-bottom:12px; background:#fff; width:55px; height:55px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color:#9FD406; font-weight:800;">＋</div>
                    <h3 style="font-size:18px; font-weight:800; margin:0 0 5px 0; color:#1A1A1A;">Sumar un peludo</h3>
                    <p style="font-size:12px; color:#777; margin:0; line-height:1.4;">Puedes tener hasta 3.<br>Quedan ${CONFIG.maxPets - this.pets.length} lugares.</p>
                </div>
            `;
        }

        showDetails(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;
            const idx = this.pets.indexOf(pet) + 1;

            // Get all available photos
            const photo1 = pet.photo_url || this.msFields[`pet-${idx}-photo-1-url`];
            const photo2 = pet.photo2_url || this.msFields[`pet-${idx}-photo-2-url`];

            const photos = [photo1, photo2].filter(p => p); // Filter out nulls/undefined/empty
            const mainPhoto = photos[0] || CONFIG.placeholderDog;

            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            // Generate photo gallery HTML
            let photoHtml = '';
            if (photos.length > 1) {
                photoHtml = `
                    <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:5px;">
                        ${photos.map(url => `
                            <img src="${url}" style="width:140px; height:200px; object-fit:cover; border-radius:12px; flex-shrink:0;">
                        `).join('')}
                    </div>
                `;
            } else {
                photoHtml = `
                    <img src="${mainPhoto}" style="width:100%; max-width:280px; height:320px; object-fit:cover; border-radius:18px; margin:0 auto; display:block;">
                `;
            }

            modal.innerHTML = `
                <div class="pata-modal-box">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <div style="display:flex; gap:30px; flex-wrap:wrap; align-items:start;">
                        <div style="flex:0 0 auto; width:100%; max-width:300px;">
                            ${photoHtml}
                        </div>
                        <div style="flex:1; min-width:240px;">
                            <div class="pata-status-badge" style="position:static; transform:none; display:inline-flex; margin-bottom:15px; background:${CONFIG.statusColors[pet.status]?.bg}; color:${CONFIG.statusColors[pet.status]?.text};">
                                ${CONFIG.statusColors[pet.status]?.icon} ${CONFIG.statusColors[pet.status]?.label}
                            </div>
                            <h2 style="font-size:36px; margin:0 0 5px 0; font-weight:800; line-height:1.2;">${pet.name}</h2>
                            <p style="color:#666; font-size:16px; margin-bottom:20px;">${pet.breed} • ${pet.breed_size}</p>
                            
                            <div style="background:#F9F9F9; padding:20px; border-radius:16px;">
                                <p style="margin:8px 0;"><strong>🐣 Edad:</strong> ${pet.age || 'No especificada'}</p>
                                <p style="margin:8px 0;"><strong>📅 Alta:</strong> ${new Date(pet.created_at).toLocaleDateString()}</p>
                                <p style="margin:8px 0;"><strong>🆔 RUAC:</strong> ${pet.ruac || 'No registrado'}</p>
                            </div>

                            ${pet.admin_notes ? `<div style="background:#FFFDE7; padding:15px; border-radius:12px; margin-top:20px; border-left:4px solid #FFC107; color:#5D4037;"><strong>📝 Nota del Admin:</strong><br>${pet.admin_notes}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        showAddForm() {
            // Estado para fotos
            this.newPetPhotos = { photo1: null, photo2: null };

            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="pata-modal-box" style="max-width:550px; max-height:90vh; overflow-y:auto;">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer; z-index:10;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h2 style="text-align:center; font-weight:800; font-size:26px; margin:0 0 20px 0;">Nuevo integrante 🐾</h2>
                    
                    <form id="pata-add-form" style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        <!-- Información básica -->
                        <div style="grid-column: 1 / -1;"><label style="font-weight:600; font-size:13px; color:#666;">Información básica</label></div>
                        
                        <input type="text" name="name" placeholder="Nombre *" required style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px;">
                        <input type="text" name="lastName" placeholder="Apellido (opcional)" style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px;">
                        
                        <select name="petType" required style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px;">
                            <option value="">Tipo de mascota *</option>
                            <option value="perro">🐕 Perro</option>
                            <option value="gato">🐈 Gato</option>
                        </select>
                        
                        <select name="age" id="pata-age-select" required style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px;">
                            <option value="">Edad *</option>
                            <option value="4-6-meses" data-numeric="0">4-6 meses</option>
                            <option value="6-12-meses" data-numeric="0">6-12 meses</option>
                            <option value="1-año" data-numeric="1">1 año</option>
                            <option value="2-años" data-numeric="2">2 años</option>
                            <option value="3-años" data-numeric="3">3 años</option>
                            <option value="4-años" data-numeric="4">4 años</option>
                            <option value="5-años" data-numeric="5">5 años</option>
                            <option value="6-años" data-numeric="6">6 años</option>
                            <option value="7-años" data-numeric="7">7 años</option>
                            <option value="8-años" data-numeric="8">8 años</option>
                            <option value="9-años" data-numeric="9">9 años</option>
                            <option value="10-años" data-numeric="10">10 años</option>
                            <option value="11-años" data-numeric="11">11 años</option>
                            <option value="12-años" data-numeric="12">12 años</option>
                            <option value="13-años" data-numeric="13">13 años</option>
                            <option value="14-años" data-numeric="14">14 años</option>
                            <option value="15+-años" data-numeric="15">15+ años</option>
                        </select>

                        <!-- Raza -->
                        <div style="grid-column: 1 / -1; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="pata-is-mixed" name="isMixed" style="width:18px; height:18px;">
                            <label for="pata-is-mixed" style="font-size:13px; color:#555;">Es mestizo/criollo</label>
                        </div>
                        
                        <div class="pata-breed-wrapper">
                            <input type="text" name="breed" id="pata-breed-input" placeholder="Escribe para buscar raza *" required autocomplete="off" style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px; width:100%; box-sizing:border-box;">
                            <div id="pata-breed-suggestions" class="pata-breed-suggestions"></div>
                            <div id="pata-breed-warning" class="pata-breed-warning" style="display:none;"></div>
                        </div>
                        
                        <select name="breedSize" id="pata-size-select" required style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px; grid-column: 1 / -1;">
                            <option value="">Tamaño * (selecciona tipo primero)</option>
                        </select>
                        
                        <!-- Certificado veterinario (para mascotas senior) -->
                        <div id="pata-vet-cert-section" style="grid-column: 1 / -1; display:none; background:#FEF3C7; padding:15px; border-radius:10px; border:1px solid #FCD34D;">
                            <p style="margin:0 0 10px 0; color:#92400E; font-weight:500;">⚠️ Tu peludo ya es senior para su talla, pero no te preocupes, aún lo puedes incluir en la manada.</p>
                            <p style="margin:0 0 10px 0; font-size:12px; color:#A16207;">Solo necesitamos que subas un documento de tu veterinario certificando que está saludable.</p>
                            <label style="font-weight:600; font-size:13px; color:#666; display:block; margin-bottom:5px;">📋 Certificado Veterinario *</label>
                            <input type="file" name="vetCertificate" id="pata-vet-cert" accept=".pdf,.jpg,.jpeg,.png" style="padding:10px; border:2px dashed #FCD34D; border-radius:8px; width:100%; box-sizing:border-box;">
                        </div>

                        <!-- Adopción -->
                        <div style="grid-column: 1 / -1; display:flex; align-items:center; gap:10px; margin-top:5px;">
                            <input type="checkbox" id="pata-is-adopted" name="isAdopted" style="width:18px; height:18px;">
                            <label for="pata-is-adopted" style="font-size:13px; color:#555;">Es adoptado/rescatado 🏠</label>
                        </div>
                        
                        <div id="pata-adoption-story-wrapper" style="grid-column: 1 / -1; display:none; margin-top:5px;">
                            <label style="font-weight:600; font-size:13px; color:#666; display:block; margin-bottom:5px;">📜 Cuéntanos su historia de adopción</label>
                            <textarea name="adoptionStory" placeholder="¿Cómo llegó a tu vida?..." style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px; height:80px; box-sizing:border-box; font-family:inherit;"></textarea>
                            <p style="margin:5px 0 0 0; font-size:11px; color:#888;">Al llenar la historia nos autorizas a compartirla en nuestras redes 🐾</p>
                        </div>

                        <!-- RUAC -->
                        <div style="grid-column: 1 / -1;">
                            <input type="text" name="ruac" placeholder="Código RUAC (opcional)" style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px; width:100%; box-sizing:border-box;">
                            <p style="margin:5px 0 0 0; font-size:11px; color:#888;">Si tu mascota tiene RUAC, esto reduce el período de carencia.</p>
                        </div>
                        
                        <!-- Código Embajador -->
                        <div style="grid-column: 1 / -1;">
                            <input type="text" name="ambassadorCode" id="pata-ambassador-code" placeholder="Código de Embajador (opcional)" style="padding:12px; border-radius:8px; border:1px solid #ddd; font-size:14px; width:100%; box-sizing:border-box;">
                            <p id="pata-ambassador-message" style="margin:5px 0 0 0; font-size:11px; color:#888;">Si un amigo embajador te compartió Club Pata Amiga, ingresa su código aquí</p>
                        </div>

                        <!-- Fotos -->
                        <div style="grid-column: 1 / -1; margin-top:10px;"><label style="font-weight:600; font-size:13px; color:#666;">📸 Fotos de tu mascota</label></div>
                        
                        <div style="grid-column: 1 / -1; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <div id="pata-add-photo-area-1" style="border:2px dashed #ddd; border-radius:10px; padding:20px; text-align:center; cursor:pointer; background:#fafafa; transition:all 0.2s;">
                                <input type="file" id="pata-add-photo-1" accept="image/*" style="display:none;">
                                <div id="pata-add-preview-1">
                                    <span style="font-size:32px;">📸</span>
                                    <p style="margin:8px 0 0 0; font-size:12px; color:#888;">Foto 1 *</p>
                                </div>
                            </div>
                            <div id="pata-add-photo-area-2" style="border:2px dashed #ddd; border-radius:10px; padding:20px; text-align:center; cursor:pointer; background:#fafafa; transition:all 0.2s;">
                                <input type="file" id="pata-add-photo-2" accept="image/*" style="display:none;">
                                <div id="pata-add-preview-2">
                                    <span style="font-size:32px;">📸</span>
                                    <p style="margin:8px 0 0 0; font-size:12px; color:#888;">Foto 2 (opcional)</p>
                                </div>
                            </div>
                        </div>
                        <p style="grid-column: 1 / -1; font-size:11px; color:#888; margin:0;">Sube fotos claras donde se vea bien a tu mascota.</p>

                        <button type="submit" class="pata-btn pata-btn-primary" style="grid-column: 1 / -1; height:55px; font-size:16px; margin-top:10px;" id="pata-save-btn">🐾 Dar de alta</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Configurar carga de fotos
            this.setupAddPetPhotoInput('pata-add-photo-area-1', 'pata-add-photo-1', 'pata-add-preview-1', 'photo1');
            this.setupAddPetPhotoInput('pata-add-photo-area-2', 'pata-add-photo-2', 'pata-add-preview-2', 'photo2');

            // Manejar checkbox de mestizo
            const mixedCheckbox = document.getElementById('pata-is-mixed');
            const breedInput = document.getElementById('pata-breed-input');
            mixedCheckbox.onchange = () => {
                if (mixedCheckbox.checked) {
                    breedInput.value = 'Mestizo';
                    breedInput.disabled = true;
                } else {
                    breedInput.value = '';
                    breedInput.disabled = false;
                }
            };

            // Manejar checkbox de adopción (historia)
            const adoptedCheckbox = document.getElementById('pata-is-adopted');
            const storyWrapper = document.getElementById('pata-adoption-story-wrapper');
            adoptedCheckbox.onchange = () => {
                storyWrapper.style.display = adoptedCheckbox.checked ? 'block' : 'none';
                const textarea = storyWrapper.querySelector('textarea');
                if (adoptedCheckbox.checked) textarea.setAttribute('required', 'true');
                else textarea.removeAttribute('required');
            };

            // 🆕 Configurar autocomplete de razas
            this.setupBreedAutocomplete(modal);

            // 🆕 Configurar opciones de tamaño dinámicas según tipo de mascota
            this.setupDynamicSizeOptions(modal);

            // 🆕 Configurar validación de edad senior
            this.setupSeniorAgeCheck(modal);

            // 🆕 Configurar validación de código embajador
            this.setupAmbassadorCodeValidation(modal);

            const form = document.getElementById('pata-add-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.getElementById('pata-save-btn');

                // Validar que al menos haya una foto
                if (!this.newPetPhotos.photo1) {
                    alert('Por favor sube al menos una foto de tu mascota.');
                    return;
                }

                btn.innerText = 'Guardando...';
                btn.disabled = true;

                try {
                    // Subir foto 1
                    btn.innerText = 'Subiendo foto 1...';
                    const photo1Url = await this.uploadNewPetPhoto(this.newPetPhotos.photo1);

                    // Subir foto 2 si existe
                    let photo2Url = null;
                    if (this.newPetPhotos.photo2) {
                        btn.innerText = 'Subiendo foto 2...';
                        photo2Url = await this.uploadNewPetPhoto(this.newPetPhotos.photo2);
                    }

                    btn.innerText = 'Registrando mascota...';

                    // Enviar datos al API
                    const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            memberstackId: this.member.id,
                            petData: {
                                name: form.name.value,
                                lastName: form.lastName.value || '',
                                petType: form.petType.value,
                                age: form.age.value,
                                isMixed: form.isMixed.checked,
                                breed: form.breed.value || 'Mestizo',
                                breedSize: form.breedSize.value,
                                isAdopted: form.isAdopted.checked,
                                adoptionStory: form.adoptionStory ? form.adoptionStory.value : '',
                                ruac: form.ruac.value || '',
                                photo1Url: photo1Url,
                                photo2Url: photo2Url
                            }
                        })
                    });

                    const data = await res.json();

                    if (data.success) {
                        alert('¡Mascota registrada exitosamente! 🐾 El equipo revisará tu solicitud pronto.');
                        modal.remove();
                        this.init();
                    } else {
                        alert('Error: ' + (data.error || 'No se pudo registrar la mascota.'));
                        btn.disabled = false;
                        btn.innerText = '🐾 Dar de alta';
                    }
                } catch (err) {
                    console.error('Error registrando mascota:', err);
                    alert('Error al guardar. Intenta nuevamente.');
                    btn.disabled = false;
                    btn.innerText = '🐾 Dar de alta';
                }
            };
        }

        // 🆕 Configurar input de foto para agregar mascota
        setupAddPetPhotoInput(areaId, inputId, previewId, photoKey) {
            const area = document.getElementById(areaId);
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);

            if (!area || !input) return;

            area.onclick = () => input.click();

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.newPetPhotos[photoKey] = file;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (preview) {
                            preview.innerHTML = `
                                <img src="${ev.target.result}" style="max-width:100%; max-height:70px; border-radius:6px; object-fit:cover;">
                                <p style="margin:5px 0 0 0; font-size:10px; color:#4CAF50;">✓ ${file.name.substring(0, 12)}...</p>
                            `;
                        }
                        area.style.borderColor = '#4CAF50';
                        area.style.background = '#f0fff0';
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        // 🆕 Subir foto de nueva mascota
        async uploadNewPetPhoto(file) {
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

        // 🆕 Configurar autocomplete de razas
        async setupBreedAutocomplete(modal) {
            const breedInput = document.getElementById('pata-breed-input');
            const suggestionsBox = document.getElementById('pata-breed-suggestions');
            const warningBox = document.getElementById('pata-breed-warning');
            const petTypeSelect = modal.querySelector('[name="petType"]');

            if (!breedInput || !suggestionsBox) return;

            // Cache de razas
            this.breedsCache = { perro: [], gato: [] };
            this.selectedBreedIndex = -1;

            // Cargar razas iniciales
            const loadBreeds = async (type) => {
                if (!type) return;
                if (this.breedsCache[type]?.length > 0) return;

                try {
                    console.log(`📡 Cargando razas para: ${type}...`);
                    const res = await fetch(`${CONFIG.apiUrl}/api/breeds?type=${type}`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);

                    const data = await res.json();
                    if (data.success && data.breeds) {
                        this.breedsCache[type] = data.breeds;
                        console.log(`✅ ${data.breeds.length} razas de ${type} cargadas.`);
                    }
                } catch (err) {
                    console.error('❌ Error cargando razas:', err);
                }
            };

            // Evento al cambiar tipo de mascota
            petTypeSelect.addEventListener('change', () => {
                const type = petTypeSelect.value;
                breedInput.value = ''; // Limpiar raza si cambia tipo
                warningBox.style.display = 'none';
                if (type) loadBreeds(type);
            });

            // Mostrar sugerencias filtradas
            const showSuggestions = (query) => {
                const petType = petTypeSelect.value;
                if (!petType) {
                    suggestionsBox.innerHTML = '<div class="pata-breed-suggestion" style="color:#888;">Primero selecciona tipo de mascota</div>';
                    suggestionsBox.classList.add('active');
                    return;
                }

                const breeds = this.breedsCache[petType] || [];
                const filtered = query.length > 0
                    ? breeds.filter(b => b.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
                    : breeds.slice(0, 8);

                if (filtered.length === 0) {
                    suggestionsBox.innerHTML = '<div class="pata-breed-suggestion" style="color:#888;">No se encontraron razas</div>';
                } else {
                    suggestionsBox.innerHTML = filtered.map((b, i) => `
                        <div class="pata-breed-suggestion" data-name="${b.name}" data-warning="${b.warning_message || ''}" data-has-issues="${b.has_genetic_issues}">
                            ${b.name}
                            ${b.has_genetic_issues ? '<span style="color:#FF9800; font-size:11px; margin-left:5px;">⚠️</span>' : ''}
                        </div>
                    `).join('');
                }

                suggestionsBox.classList.add('active');
                this.selectedBreedIndex = -1;
            };

            // Seleccionar raza
            const selectBreed = (name, warning) => {
                breedInput.value = name;
                suggestionsBox.classList.remove('active');

                if (warning && warning !== '') {
                    warningBox.innerHTML = warning;
                    warningBox.style.display = 'block';
                } else {
                    warningBox.style.display = 'none';
                }
            };

            // Eventos
            breedInput.addEventListener('focus', async () => {
                const petType = petTypeSelect.value;
                if (petType) {
                    await loadBreeds(petType);
                }
                showSuggestions(breedInput.value);
            });

            breedInput.addEventListener('input', (e) => {
                showSuggestions(e.target.value);
            });

            breedInput.addEventListener('blur', () => {
                setTimeout(() => suggestionsBox.classList.remove('active'), 200);
            });

            // Navegación con teclado
            breedInput.addEventListener('keydown', (e) => {
                const items = suggestionsBox.querySelectorAll('.pata-breed-suggestion[data-name]');
                if (items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectedBreedIndex = Math.min(this.selectedBreedIndex + 1, items.length - 1);
                    items.forEach((item, i) => item.classList.toggle('selected', i === this.selectedBreedIndex));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectedBreedIndex = Math.max(this.selectedBreedIndex - 1, 0);
                    items.forEach((item, i) => item.classList.toggle('selected', i === this.selectedBreedIndex));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.selectedBreedIndex >= 0 && items[this.selectedBreedIndex]) {
                        const item = items[this.selectedBreedIndex];
                        selectBreed(item.dataset.name, item.dataset.warning);
                    }
                }
            });

            // Click en sugerencia
            suggestionsBox.addEventListener('click', (e) => {
                const item = e.target.closest('.pata-breed-suggestion');
                if (item && item.dataset.name) {
                    selectBreed(item.dataset.name, item.dataset.warning);
                }
            });

            // Cuando cambia el tipo de mascota, recargar razas
            petTypeSelect.addEventListener('change', async (e) => {
                const type = e.target.value;
                if (type) {
                    await loadBreeds(type);
                    breedInput.value = '';
                    warningBox.style.display = 'none';
                    if (document.activeElement === breedInput) {
                        showSuggestions('');
                    }
                }
            });
        }

        // 🆕 Configurar opciones de tamaño dinámicas según tipo de mascota
        setupDynamicSizeOptions(modal) {
            const petTypeSelect = modal.querySelector('[name="petType"]');
            const sizeSelect = document.getElementById('pata-size-select');

            if (!petTypeSelect || !sizeSelect) return;

            // Definir opciones de tamaño por tipo con edad senior
            const DOG_SIZE_OPTIONS = [
                { value: 'chica', label: 'Chica (hasta 10kg)', seniorAge: 8 },
                { value: 'mediana', label: 'Mediana (11-25kg)', seniorAge: 7 },
                { value: 'grande', label: 'Grande (26-45kg)', seniorAge: 6 },
                { value: 'gigante', label: 'Gigante (46kg+)', seniorAge: 5 },
            ];

            const CAT_SIZE_OPTIONS = [
                { value: 'chica', label: 'Chica (hasta 4.5kg)', seniorAge: 7 },
                { value: 'mediana', label: 'Mediana (4.5-7kg)', seniorAge: 7 },
                { value: 'grande', label: 'Grande (7kg+)', seniorAge: 7 },
            ];

            // Store en el widget para uso posterior
            this.sizeOptions = { perro: DOG_SIZE_OPTIONS, gato: CAT_SIZE_OPTIONS };

            // Actualizar opciones cuando cambia el tipo de mascota
            petTypeSelect.addEventListener('change', () => {
                const petType = petTypeSelect.value;
                const options = this.sizeOptions[petType] || [];

                sizeSelect.innerHTML = '<option value="">Tamaño *</option>' +
                    options.map(opt => `<option value="${opt.value}" data-senior="${opt.seniorAge}">${opt.label}</option>`).join('');

                // Limpiar selección y ocultar certificado
                document.getElementById('pata-vet-cert-section').style.display = 'none';
            });
        }

        // 🆕 Configurar validación de edad senior para certificado veterinario
        setupSeniorAgeCheck(modal) {
            const petTypeSelect = modal.querySelector('[name="petType"]');
            const sizeSelect = document.getElementById('pata-size-select');
            const ageSelect = document.getElementById('pata-age-select');
            const vetCertSection = document.getElementById('pata-vet-cert-section');
            const vetCertInput = document.getElementById('pata-vet-cert');

            if (!petTypeSelect || !sizeSelect || !ageSelect || !vetCertSection) return;

            const checkSeniorAge = () => {
                const petType = petTypeSelect.value;
                const sizeValue = sizeSelect.value;
                const ageOption = ageSelect.options[ageSelect.selectedIndex];

                if (!petType || !sizeValue || !ageOption || !ageOption.dataset.numeric) {
                    vetCertSection.style.display = 'none';
                    if (vetCertInput) vetCertInput.removeAttribute('required');
                    return;
                }

                const numericAge = parseInt(ageOption.dataset.numeric) || 0;
                const sizeOption = sizeSelect.options[sizeSelect.selectedIndex];
                const seniorAge = parseInt(sizeOption?.dataset?.senior) || 10;

                if (numericAge >= seniorAge) {
                    vetCertSection.style.display = 'block';
                    if (vetCertInput) vetCertInput.setAttribute('required', 'true');
                } else {
                    vetCertSection.style.display = 'none';
                    if (vetCertInput) vetCertInput.removeAttribute('required');
                }
            };

            // Escuchar cambios en tipo, tamaño y edad
            petTypeSelect.addEventListener('change', checkSeniorAge);
            sizeSelect.addEventListener('change', checkSeniorAge);
            ageSelect.addEventListener('change', checkSeniorAge);
        }

        // 🆕 Configurar validación de código embajador
        setupAmbassadorCodeValidation(modal) {
            const codeInput = document.getElementById('pata-ambassador-code');
            const messageEl = document.getElementById('pata-ambassador-message');

            if (!codeInput || !messageEl) return;

            let debounceTimer = null;

            codeInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                const code = codeInput.value.trim();

                if (!code) {
                    messageEl.textContent = 'Si un amigo embajador te compartió Club Pata Amiga, ingresa su código aquí';
                    messageEl.style.color = '#888';
                    return;
                }

                messageEl.textContent = 'Verificando código...';
                messageEl.style.color = '#888';

                debounceTimer = setTimeout(async () => {
                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/referrals/validate-code?code=${encodeURIComponent(code)}`);
                        const data = await res.json();

                        if (data.valid) {
                            messageEl.textContent = `✅ Código válido - Embajador: ${data.ambassadorName}`;
                            messageEl.style.color = '#10b981';
                        } else {
                            messageEl.textContent = '❌ Código no válido';
                            messageEl.style.color = '#ef4444';
                        }
                    } catch (err) {
                        console.error('Error validando código:', err);
                        messageEl.textContent = 'Error al verificar código';
                        messageEl.style.color = '#ef4444';
                    }
                }, 500);
            });
        }

        showAppealForm(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;

            // Estado para fotos de apelación
            this.appealPhotos = { photo1: null, photo2: null };

            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="pata-modal-box">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h2 style="text-align:center; font-weight:800; font-size:26px; margin:0 0 15px 0;">⚖️ Apelar para ${pet.name}</h2>
                    ${pet.admin_notes ? `<div style="background:#FFEBEE; padding:12px; border-radius:10px; margin-bottom:20px; border-left:4px solid #C62828;"><strong>Motivo del rechazo:</strong><br>${pet.admin_notes}</div>` : ''}
                    <form id="pata-appeal-form">
                        <p style="margin-bottom:10px; color:#666;">Explica por qué crees que la decisión debería reconsiderarse.</p>
                        <textarea id="pata-appeal-msg" required placeholder="Escribe tu mensaje de apelación aquí..." style="width:100%; height:100px; padding:15px; border-radius:10px; border:1px solid #ddd; resize:none; font-family:inherit; font-size:14px;"></textarea>
                        
                        <!-- Sección de carga de fotos -->
                        <div style="margin-top:15px; padding:15px; background:#f8f9fa; border-radius:10px; border:1px dashed #ccc;">
                            <p style="margin:0 0 10px 0; font-size:13px; font-weight:600; color:#333;">📷 ¿Tienes nuevas fotos? (opcional)</p>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                <div class="pata-appeal-photo-area" id="pata-appeal-area-1" style="border:2px dashed #ddd; border-radius:8px; padding:15px; text-align:center; cursor:pointer; background:#fff;">
                                    <input type="file" id="pata-appeal-photo-1" accept="image/*" style="display:none;">
                                    <div id="pata-appeal-preview-1"><span style="font-size:28px;">📸</span><p style="margin:5px 0 0 0; font-size:11px; color:#888;">Foto 1</p></div>
                                </div>
                                <div class="pata-appeal-photo-area" id="pata-appeal-area-2" style="border:2px dashed #ddd; border-radius:8px; padding:15px; text-align:center; cursor:pointer; background:#fff;">
                                    <input type="file" id="pata-appeal-photo-2" accept="image/*" style="display:none;">
                                    <div id="pata-appeal-preview-2"><span style="font-size:28px;">📸</span><p style="margin:5px 0 0 0; font-size:11px; color:#888;">Foto 2</p></div>
                                </div>
                            </div>
                        </div>
                        
                        <p style="font-size:12px; color:#999; margin:15px 0 10px 0;">Intentos de apelación: ${pet.appeal_count || 0}/2</p>
                        <button type="submit" class="pata-btn pata-btn-primary" style="width:100%; height:55px; font-size:16px; background:#7B1FA2; color:#fff;" id="pata-appeal-btn">Enviar Apelación</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Configurar inputs de fotos
            this.setupAppealPhotoInput('pata-appeal-area-1', 'pata-appeal-photo-1', 'pata-appeal-preview-1', 'photo1');
            this.setupAppealPhotoInput('pata-appeal-area-2', 'pata-appeal-photo-2', 'pata-appeal-preview-2', 'photo2');

            const form = document.getElementById('pata-appeal-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.getElementById('pata-appeal-btn');
                const msg = document.getElementById('pata-appeal-msg').value.trim();

                if (!msg) {
                    alert('Por favor escribe un mensaje de apelación.');
                    return;
                }

                btn.innerText = 'Enviando...';
                btn.disabled = true;

                try {
                    // 1. Subir fotos si las hay
                    let photo1Url = null;
                    let photo2Url = null;

                    if (this.appealPhotos?.photo1) {
                        btn.innerText = 'Subiendo foto 1...';
                        photo1Url = await this.uploadAppealPhoto(this.appealPhotos.photo1);
                    }
                    if (this.appealPhotos?.photo2) {
                        btn.innerText = 'Subiendo foto 2...';
                        photo2Url = await this.uploadAppealPhoto(this.appealPhotos.photo2);
                    }

                    btn.innerText = 'Enviando apelación...';

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

                    if (!data.success) {
                        alert('Error: ' + (data.error || 'No se pudo enviar la apelación.'));
                        btn.disabled = false;
                        btn.innerText = 'Enviar Apelación';
                        return;
                    }

                    // 3. Si hay fotos nuevas, actualizar la mascota
                    if (photo1Url || photo2Url) {
                        btn.innerText = 'Actualizando fotos...';
                        await fetch(`${CONFIG.apiUrl}/api/user/pets/${petId}/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: this.member.id,
                                photo1Url: photo1Url,
                                photo2Url: photo2Url,
                                message: `Apelación con nuevas fotos`
                            })
                        });
                    }

                    alert(data.message || '¡Apelación enviada! El equipo la revisará pronto.');
                    modal.remove();
                    this.init(); // Recargar para mostrar nuevo estado

                } catch (err) {
                    console.error('Error en apelación:', err);
                    alert('Error de conexión. Intenta de nuevo.');
                    btn.disabled = false;
                    btn.innerText = 'Enviar Apelación';
                }
            };
        }

        // 🆕 Configurar input de foto para apelación
        setupAppealPhotoInput(areaId, inputId, previewId, photoKey) {
            const area = document.getElementById(areaId);
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);

            if (!area || !input) return;

            area.onclick = () => input.click();

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.appealPhotos[photoKey] = file;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (preview) {
                            preview.innerHTML = `
                                <img src="${ev.target.result}" style="max-width:100%; max-height:60px; border-radius:4px; object-fit:cover;">
                                <p style="margin:5px 0 0 0; font-size:10px; color:#4CAF50;">✓ Listo</p>
                            `;
                        }
                        area.style.borderColor = '#4CAF50';
                        area.style.background = '#f0fff0';
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        // 🆕 Subir foto a Supabase Storage
        async uploadAppealPhoto(file) {
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
    }

    if (!window.ManadaWidget) {
        window.ManadaWidget = new ManadaWidget('pata-amiga-manada-widget');
    }
})();
