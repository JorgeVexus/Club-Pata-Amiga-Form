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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fraiche&display=swap');

        .pata-widget-container {
            font-family: 'Outfit', sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .pata-manada-title {
            font-size: 80px;
            font-weight: 900;
            color: #FFBD12;
            margin: 0 0 40px 0;
            line-height: 0.9;
            letter-spacing: -2px;
        }

        /* Cards Grid */
        .pata-cards-grid {
            display: flex;
            flex-direction: row;
            gap: 25px;
            justify-content: flex-start;
            align-items: flex-start;
            flex-wrap: wrap;
        }

        /* Pet Card - Square Premium */
        .pata-pet-card {
            background: #fff;
            border-radius: 40px;
            width: 260px;
            height: 260px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            box-sizing: border-box;
        }
        .pata-pet-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }

        /* Photo Container Wrapper - Teals background */
        .pata-card-photo-wrapper {
            width: 100%;
            height: 100%;
            background: #00BBB4;
            border-radius: 30px;
            overflow: hidden;
            position: relative;
        }
        
        .pata-card-photo-wrapper img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover;
            display: block;
        }

        /* Status & Info Overlays */
        .pata-card-overlay-status {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255,255,255,0.9);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 800;
            z-index: 5;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .pata-card-overlay-name {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 6px 20px;
            border-radius: 30px;
            font-weight: 800;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 5;
            white-space: nowrap;
        }

        /* Add Card - Dashed Square */
        .pata-add-card {
            width: 260px;
            height: 260px;
            background: #FFFFFF;
            border: 2px dashed #E0E0E0;
            border-radius: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-sizing: border-box;
            padding: 20px;
        }
        .pata-add-card:hover { border-color: #FFBD12; transform: translateY(-10px); background: #fdfdfd; }

        .pata-add-icon-circle {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 4px solid #FFBD12;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFBD12;
            font-size: 40px;
            font-weight: 400;
            margin-bottom: 20px;
        }

        .pata-add-text-title {
            font-size: 18px;
            font-weight: 700;
            color: #A0A0A0;
            margin: 0 0 8px 0;
        }

        .pata-add-text-subtitle {
            font-size: 11px;
            color: #C0C0C0;
            margin: 0;
            font-weight: 500;
        }

        /* Modal */
        .pata-modal-overlay {
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.8); z-index: 100000; 
            display: flex; align-items: center; justify-content: center; padding: 20px;
            backdrop-filter: blur(5px);
        }
        .pata-modal-box {
            background: #fff; border-radius: 40px; padding: 40px; 
            position: relative; max-width: 600px; width: 100%;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            font-family: 'Outfit', sans-serif;
        }

        /* Responsive */
        @media (max-width: 750px) {
            .pata-cards-grid { justify-content: center; }
            .pata-pet-card, .pata-add-card { width: 100%; max-width: 280px; height: 280px; }
            .pata-manada-title { font-size: 60px; text-align: center; }
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
                <div class="pata-widget-container">
                    <h1 class="pata-manada-title">mi manada</h1>
                    <div class="pata-cards-grid">
                        ${petCards}
                        ${addCard}
                    </div>
                </div>
            `;
        }

        createPetCardHtml(pet, index) {
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;
            const msPhotoUrl = this.msFields[`pet-${index}-photo-1-url`];
            const imageUrl = pet.primary_photo_url || pet.photo_url || msPhotoUrl || CONFIG.placeholderDog;

            return `
                <div class="pata-pet-card" onclick="window.ManadaWidget.showDetails('${pet.id}')">
                    <div class="pata-card-photo-wrapper">
                        <div class="pata-card-overlay-status">
                            ${status.label}
                        </div>
                        <img src="${imageUrl}" alt="${pet.name}" onerror="this.src='${CONFIG.placeholderDog}';">
                        <div class="pata-card-overlay-name">${pet.name}</div>
                    </div>
                </div>
            `;
        }

        createAddCardHtml() {
            return `
                <div class="pata-add-card" onclick="if(window.ManadaWidget) window.ManadaWidget.showAddForm()">
                    <div class="pata-add-icon-circle">+</div>
                    <h3 class="pata-add-text-title">Agregar otro peludo</h3>
                    <p class="pata-add-text-subtitle">Periodo de carencia de 6 meses</p>
                </div>
            `;
        }

        showDetails(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;
            const idx = this.pets.indexOf(pet) + 1;

            // Get all available photos
            const photo1 = pet.primary_photo_url || pet.photo_url || this.msFields[`pet-${idx}-photo-1-url`];
            const photo2 = pet.photo2_url || this.msFields[`pet-${idx}-photo-2-url`];
            const photos = [photo1, photo2].filter(p => p);
            const mainPhoto = photos[0] || CONFIG.placeholderDog;

            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            // Photo gallery HTML
            let photoHtml = '';
            if (photos.length > 1) {
                photoHtml = `
                    <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:5px;">
                        ${photos.map(url => `
                            <img src="${url}" style="width:140px; height:200px; object-fit:cover; border-radius:16px; flex-shrink:0; border:2px solid #f0f0f0;" onerror="this.src='${CONFIG.placeholderDog}';">
                        `).join('')}
                    </div>`;
            } else {
                photoHtml = `<img src="${mainPhoto}" style="width:100%; height:280px; object-fit:cover; border-radius:20px; display:block;" onerror="this.src='${CONFIG.placeholderDog}';">`;
            }

            // Format age
            const ageValue = pet.age_value || pet.age || '';
            const ageUnit = pet.age_unit === 'months' ? 'meses' : 'años';
            const ageDisplay = ageValue ? `${ageValue} ${ageUnit}` : 'No especificada';

            // Format gender
            const genderDisplay = pet.gender === 'macho' ? '♂ Macho' : pet.gender === 'hembra' ? '♀ Hembra' : 'No especificado';

            // Pet type
            const petTypeDisplay = pet.pet_type === 'cat' ? '🐱 Gato' : '🐶 Perro';

            // Breed info
            const breedDisplay = pet.is_mixed_breed ? '🔀 Mestizo' : (pet.breed || 'No especificada');
            const sizeDisplay = pet.breed_size || 'No especificado';

            // Status badge
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;

            // Build detail rows
            const detailRows = [
                { icon: '🐾', label: 'Tipo', value: petTypeDisplay },
                { icon: '🎂', label: 'Edad', value: ageDisplay },
                { icon: '⚧', label: 'Sexo', value: genderDisplay },
                { icon: '🏷️', label: 'Raza', value: breedDisplay },
                { icon: '📏', label: 'Talla', value: sizeDisplay },
            ];

            // Optional color fields
            if (pet.coat_color) detailRows.push({ icon: '🎨', label: 'Color de pelo', value: pet.coat_color });
            if (pet.nose_color) detailRows.push({ icon: '👃', label: 'Color de nariz', value: pet.nose_color });
            if (pet.eye_color) detailRows.push({ icon: '👁️', label: 'Color de ojos', value: pet.eye_color });
            if (pet.ruac) detailRows.push({ icon: '🆔', label: 'RUAC', value: pet.ruac });

            detailRows.push({ icon: '📅', label: 'Fecha de alta', value: new Date(pet.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) });

            const detailsHtml = detailRows.map(r => `
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f0f0f0;">
                    <span style="color:#888; font-weight:600; font-size:14px;">${r.icon} ${r.label}</span>
                    <span style="font-weight:700; font-size:14px; color:#1A1A1A; text-align:right; max-width:60%;">${r.value}</span>
                </div>
            `).join('');

            // Badges
            let badgesHtml = '';
            if (pet.is_adopted) badgesHtml += `<span style="background:#E8F5E9; color:#2E7D32; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;">🏠 Adoptado</span>`;
            if (pet.is_mixed_breed) badgesHtml += `<span style="background:#FFF3E0; color:#EF6C00; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;">🔀 Mestizo</span>`;
            if (pet.is_senior) badgesHtml += `<span style="background:#FCE4EC; color:#C62828; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;">👴 Senior</span>`;

            // Appeal button for rejected pets
            const appealBtnHtml = pet.status === 'rejected' ? `
                <button onclick="window.ManadaWidget.showAppealForm('${pet.id}'); this.closest('.pata-modal-overlay').remove();" style="width:100%; margin-top:15px; padding:14px; background:#7B1FA2; color:#fff; border:none; border-radius:50px; font-weight:700; font-size:15px; cursor:pointer;">⚖️ Apelar decisión</button>
            ` : '';

            modal.innerHTML = `
                <div class="pata-modal-box" style="max-width:580px; max-height:90vh; overflow-y:auto;">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer; z-index:10;" onclick="this.parentElement.parentElement.remove()">&times;</button>

                    ${photoHtml}

                    <div style="margin-top:20px;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                            <span style="background:${status.bg}; color:${status.text}; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:800;">${status.icon} ${status.label}</span>
                            ${badgesHtml ? `<div style="display:flex; gap:6px; flex-wrap:wrap;">${badgesHtml}</div>` : ''}
                        </div>

                        <h2 style="font-size:32px; margin:10px 0 0 0; font-weight:900; line-height:1.1;">${pet.name}</h2>
                        <p style="color:#888; font-size:15px; margin:5px 0 20px 0; font-weight:600;">${breedDisplay} • ${sizeDisplay}</p>

                        <div style="background:#F9FAFB; border-radius:16px; padding:5px 20px;">
                            ${detailsHtml}
                        </div>

                        ${pet.adoption_story ? `
                            <div style="margin-top:20px; background:#F0FFF4; border-left:4px solid #38A169; padding:15px 20px; border-radius:0 12px 12px 0;">
                                <p style="margin:0 0 5px 0; font-weight:700; color:#276749; font-size:14px;">📜 Historia de adopción</p>
                                <p style="margin:0; color:#555; font-size:14px; line-height:1.5;">${pet.adoption_story}</p>
                            </div>
                        ` : ''}

                        ${pet.admin_notes ? `
                            <div style="margin-top:15px; background:#FFFDE7; border-left:4px solid #FFC107; padding:15px 20px; border-radius:0 12px 12px 0;">
                                <p style="margin:0 0 5px 0; font-weight:700; color:#5D4037; font-size:14px;">📝 Nota del equipo</p>
                                <p style="margin:0; color:#555; font-size:14px; line-height:1.5;">${pet.admin_notes}</p>
                            </div>
                        ` : ''}

                        ${appealBtnHtml}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        showAddForm() {
            console.log('🐾 Intentando abrir formulario para agregar mascota...');
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
                        <!-- Información básica (= Step 2 registro-v2) -->
                        <div style="grid-column: 1 / -1;"><label style="font-weight:700; font-size:14px; color:#333;">📋 Información básica</label></div>
                        
                        <input type="text" name="name" placeholder="Nombre de tu mascota *" required style="padding:12px; border-radius:10px; border:1px solid #ddd; font-size:14px; grid-column: 1 / -1;">
                        
                        <select name="petType" required style="padding:12px; border-radius:10px; border:1px solid #ddd; font-size:14px;">
                            <option value="">Tipo de mascota *</option>
                            <option value="perro">🐕 Perro</option>
                            <option value="gato">🐈 Gato</option>
                        </select>
                        
                        <select name="gender" required style="padding:12px; border-radius:10px; border:1px solid #ddd; font-size:14px;">
                            <option value="">Sexo *</option>
                            <option value="macho">♂ Macho</option>
                            <option value="hembra">♀ Hembra</option>
                        </select>
                        
                        <select name="age" id="pata-age-select" required style="padding:12px; border-radius:10px; border:1px solid #ddd; font-size:14px; grid-column: 1 / -1;">
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

                        <!-- Raza (= Step 5 registro-v2) -->
                        <div style="grid-column: 1 / -1; margin-top:10px;"><label style="font-weight:700; font-size:14px; color:#333;">🏷️ Información complementaria</label></div>

                        <div style="grid-column: 1 / -1; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="pata-is-mixed" name="isMixed" style="width:18px; height:18px;">
                            <label for="pata-is-mixed" style="font-size:13px; color:#555;">Es mestizo/criollo</label>
                        </div>
                        
                        <div class="pata-breed-wrapper">
                            <input type="text" name="breed" id="pata-breed-input" placeholder="Escribe para buscar raza *" required autocomplete="off" style="padding:12px; border-radius:10px; border:1px solid #ddd; font-size:14px; width:100%; box-sizing:border-box;">
                            <div id="pata-breed-suggestions" class="pata-breed-suggestions"></div>
                            <div id="pata-breed-warning" class="pata-breed-warning" style="display:none;"></div>
                        </div>
                        
                        <select name="breedSize" id="pata-size-select" required style="padding:12px; border-radius:10px; border:1px solid #ddd; font-size:14px; grid-column: 1 / -1;">
                            <option value="">Tamaño * (selecciona tipo primero)</option>
                        </select>
                        
                        <!-- Certificado veterinario (para mascotas 10+ años - misma lógica registro-v2) -->
                        <div id="pata-vet-cert-section" style="grid-column: 1 / -1; display:none; background:#FEF3C7; padding:15px; border-radius:10px; border:1px solid #FCD34D;">
                            <p style="margin:0 0 10px 0; color:#92400E; font-weight:600;">⚕️ Certificado veterinario requerido</p>
                            <p style="margin:0 0 10px 0; font-size:12px; color:#A16207;">Como tu mascota tiene 10 años o más, necesitarás subir un certificado veterinario dentro de los próximos 15 días.</p>
                            <label style="font-weight:600; font-size:13px; color:#666; display:block; margin-bottom:5px;">📋 Certificado Veterinario (opcional ahora)</label>
                            <input type="file" name="vetCertificate" id="pata-vet-cert" accept=".pdf,.jpg,.jpeg,.png" style="padding:10px; border:2px dashed #FCD34D; border-radius:8px; width:100%; box-sizing:border-box;">
                        </div>

                        <!-- Fotos -->
                        <div style="grid-column: 1 / -1; margin-top:10px;"><label style="font-weight:700; font-size:14px; color:#333;">📸 Fotos de tu mascota</label></div>
                        
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
                        <p style="grid-column: 1 / -1; font-size:11px; color:#888; margin:0;">📅 Tienes 15 días para subir las fotos si no las tienes ahora.</p>

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

            // Configurar autocomplete de razas
            this.setupBreedAutocomplete(modal);

            // Configurar opciones de tamaño dinámicas según tipo de mascota
            this.setupDynamicSizeOptions(modal);

            // Configurar validación de edad senior (10+ años = certificado)
            this.setupSeniorAgeCheck(modal);

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

                    // Enviar datos al API (campos alineados con registro-v2)
                    const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            memberstackId: this.member.id,
                            petData: {
                                name: form.name.value,
                                petType: form.petType.value,
                                gender: form.gender.value,
                                age: form.age.value,
                                isMixed: form.isMixed.checked,
                                breed: form.breed.value || 'Mestizo',
                                breedSize: form.breedSize.value,
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

        // Configurar validación de edad senior (10+ años = certificado, misma lógica registro-v2)
        setupSeniorAgeCheck(modal) {
            const ageSelect = document.getElementById('pata-age-select');
            const vetCertSection = document.getElementById('pata-vet-cert-section');

            if (!ageSelect || !vetCertSection) return;

            const checkSeniorAge = () => {
                const ageOption = ageSelect.options[ageSelect.selectedIndex];
                if (!ageOption || !ageOption.dataset.numeric) {
                    vetCertSection.style.display = 'none';
                    return;
                }

                const numericAge = parseInt(ageOption.dataset.numeric) || 0;

                // Misma lógica que registro-v2: 10+ años = senior, sin importar talla
                if (numericAge >= 10) {
                    vetCertSection.style.display = 'block';
                } else {
                    vetCertSection.style.display = 'none';
                }
            };

            // Solo escuchar cambios en edad
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

    // Exponer al global con espera de DOM
    function initManadaWidget() {
        const container = document.getElementById('pata-amiga-manada-widget');
        if (container) {
            if (!window.ManadaWidget || !window.ManadaWidget.container) {
                console.log('🐾 Inicializando ManadaWidget...');
                window.ManadaWidget = new ManadaWidget('pata-amiga-manada-widget');
            } else {
                console.log('🐾 El widget ya estaba inicializado en el global.');
            }
        } else {
            console.log('🐾 Contenedor no encontrado aún, reintentando en 500ms...');
            setTimeout(initManadaWidget, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initManadaWidget);
    } else {
        initManadaWidget();
    }
})();
