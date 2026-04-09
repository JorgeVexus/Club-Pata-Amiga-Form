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
            margin-top: 8px; border-radius: 0 8px 8px 0; font-size: 11px; color: #666;
        }
        /* 🆕 Multi-step Form Styles */
        .pata-step-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 25px; justify-content: center; }
        .pata-step-dot { width: 10px; height: 10px; border-radius: 50%; background: #E0E0E0; transition: all 0.3s ease; }
        .pata-step-dot.active { background: #15BEB2; width: 30px; border-radius: 10px; }
        .pata-step-label { font-size: 12px; font-weight: 700; color: #A0A0A0; margin-left: 5px; text-transform: uppercase; }

        .pata-type-sel { display: flex; gap: 15px; margin-bottom: 20px; }
        .pata-type-btn {
            flex: 1; padding: 20px; border: 2px solid #F0F0F0; border-radius: 25px;
            background: #FFF; cursor: pointer; text-align: center; transition: all 0.3s;
            font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; color: #1A1A1A;
        }
        .pata-type-btn:hover { border-color: #15BEB2; transform: translateY(-2px); }
        .pata-type-btn.active { border-color: #15BEB2; background: #F0FEFE; box-shadow: 0 8px 20px rgba(21,190,178,0.1); }
        .pata-type-icon { font-size: 40px; display: block; margin-bottom: 10px; }

        .pata-age-row { display: flex; flex-direction: column; gap: 10px; }
        .pata-age-input { width: 100% !important; height: 55px; border-radius: 50px; border: 1px solid rgba(0,0,0,0.1); padding: 0 25px; font-size: 16px; box-sizing: border-box; }
        .pata-age-select { width: 100% !important; height: 55px; border-radius: 50px; border: 1px solid rgba(0,0,0,0.1); padding: 0 20px; font-size: 16px; background: #fff; cursor: pointer; box-sizing: border-box; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'currentColor'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 20px center; background-size: 16px; }
        
        /* 🚨 UI/UX PRO MAX: FORCED VERTICAL LAYOUT FOR MOBILE OPTIMIZATION */
        .pata-form-row { display: flex; flex-direction: column; gap: 15px; margin-bottom: 15px; }
        
        .pata-form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
        .pata-form-label { font-size: 13px; font-weight: 700; color: #4A4A4A; }
        .pata-form-input, .pata-form-select, .pata-form-textarea {
            width: 100%; padding: 14px 20px; border: 2px solid #F0F0F0; border-radius: 50px;
            font-family: inherit; font-size: 15px; outline: none; box-sizing: border-box; transition: border-color 0.3s;
        }
        .pata-form-textarea { border-radius: 20px; resize: none; height: 80px; }
        .pata-form-input:focus, .pata-form-select:focus, .pata-form-textarea:focus { border-color: #15BEB2; }

        /* Breed/Type Switch Premium */
        .pata-breed-type-switch {
            display: flex; background: #fff; border: 2px solid #F0F0F0;
            border-radius: 16px; padding: 6px; gap: 6px; margin-bottom: 15px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .pata-switch-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            gap: 8px; padding: 12px; border: none; border-radius: 12px;
            background: transparent; color: #718096; font-family: inherit;
            font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .pata-switch-btn.active { background: #15BEB2; color: #fff; box-shadow: 0 4px 12px rgba(21,190,178,0.2); }
        .pata-switch-icon { display: flex; align-items: center; justify-content: center; }

        /* Adoption Section Premium */
        .pata-adoption-section {
            background: linear-gradient(135deg, #E6FFFA 0%, #B2F5EA 100%);
            border: 2px solid #7DD8D5; border-radius: 20px; padding: 20px; margin: 10px 0 20px 0;
            animation: pataFadeIn 0.3s ease-out;
        }
        .pata-adoption-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
        .pata-adoption-icon {
            font-size: 24px; width: 44px; height: 44px; background: #fff;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 187, 180, 0.1);
        }
        .pata-adoption-title { font-weight: 800; font-size: 15px; color: #234E52; margin: 0; }
        .pata-adoption-subtitle { font-size: 12px; color: #4A7C7F; margin: 2px 0 0 0; }
        .pata-adoption-checkbox-wrapper {
            background: rgba(255, 255, 255, 0.6); border-radius: 12px; padding: 12px 15px;
            display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
        }
        .pata-adoption-checkbox-wrapper:hover { background: rgba(255, 255, 255, 0.8); }
        .pata-adoption-checkbox { width: 22px; height: 22px; accent-color: #15BEB2; cursor: pointer; }
        .pata-adoption-checkbox-text { font-size: 14px; font-weight: 700; color: #2D3748; }
        
        .pata-adoption-story-wrapper {
            background: rgba(255, 255, 255, 0.9); border-radius: 16px; padding: 15px;
            margin-top: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); animation: pataSlideDown 0.3s ease-out;
        }
        .pata-adoption-story-label {
            display: flex; align-items: center; gap: 8px; font-weight: 800;
            font-size: 14px; color: #1a365d; margin-bottom: 10px;
        }
        .pata-adoption-textarea {
            width: 100%; padding: 12px; border: 1.5px solid #E2E8F0; border-radius: 14px;
            font-family: inherit; font-size: 14px; resize: vertical; min-height: 100px;
            box-sizing: border-box; transition: all 0.2s;
        }
        .pata-adoption-textarea:focus { border-color: #7DD8D5; outline: none; background: #fff; }

        /* RUAC Section Premium */
        .pata-ruac-section {
            background: #F0F9F9; border-radius: 20px; padding: 20px;
            margin-bottom: 20px; border: 1.5px solid rgba(125, 216, 213, 0.3);
        }
        .pata-ruac-badge {
            display: inline-flex; align-items: center; gap: 5px; background: #E6FFFA;
            color: #008B8B; padding: 4px 10px; border-radius: 10px; font-size: 10px;
            font-weight: 800; text-transform: uppercase; margin-bottom: 10px;
        }
        .pata-ruac-input-wrapper { position: relative; }
        .pata-ruac-status {
            position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
            font-size: 18px; pointer-events: none;
        }
        .pata-ruac-help-link {
            display: inline-flex; align-items: center; gap: 5px; color: #00BBB4;
            font-size: 11px; font-weight: 700; text-decoration: underline; margin-top: 10px; cursor: pointer;
        }

        .pata-upload-box {
            border: 2px dashed #CBD5E0; border-radius: 25px; padding: 30px; text-align: center;
            cursor: pointer; transition: all 0.3s; background: #FAFAFA; position: relative; overflow: hidden;
            display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .pata-upload-box:hover { border-color: #7DD8D5; background: rgba(125, 216, 213, 0.05); }
        .pata-upload-box.has-file { border-style: solid; border-color: #9FD406; background: #F6FFF6; }
        .pata-upload-preview { width: 100%; max-height: 120px; object-fit: contain; border-radius: 12px; }
        .pata-upload-icon { font-size: 32px; }
        .pata-upload-text { font-size: 13px; font-weight: 700; color: #4A5568; margin: 0; }
        .pata-upload-subtext { font-size: 11px; color: #718096; margin: 0; }
        
        .pata-alert-box {
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            border: 2px solid #F59E0B; border-radius: 16px;
            padding: 15px; margin-bottom: 20px; display: flex; gap: 12px; align-items: flex-start;
        }
        .pata-alert-icon { font-size: 22px; flex-shrink: 0; }
        .pata-alert-text { font-size: 13px; color: #92400E; line-height: 1.4; }
        .pata-alert-text strong { display: block; color: #92400E; margin-bottom: 4px; font-size: 14px; font-weight: 800; }

        .pata-btn-row { display: flex; gap: 15px; margin-top: 25px; }
        .pata-btn {
            flex: 1; padding: 16px 20px; border: 2px solid #000; border-radius: 50px;
            font-family: inherit; font-weight: 800; font-size: 16px; cursor: pointer; transition: all 0.3s;
        }
        .pata-btn-primary { background: #FE8F15; color: #FFF; }
        .pata-btn-secondary { background: #00BBB4; color: #FFF; }
        .pata-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .pata-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        @keyframes pataFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pataSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* Referral Validation Colors */
        .pata-referral-msg { font-size: 11px; margin-top: 5px; font-weight: 600; min-height: 14px; }
        .pata-referral-msg.success { color: #38A169; }
        .pata-referral-msg.error { color: #E53E3E; }
        .pata-referral-msg.loading { color: #718096; font-style: italic; }
        .pata-form-input.valid { border-color: #38A169; background: #F0FFF4; }
        .pata-form-input.invalid { border-color: #E53E3E; background: #FFF5F5; }
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
            this.addStep = 1;
            this.addFormData = { 
                petType: '', name: '', lastName: '', ageValue: '', ageUnit: 'years', gender: '', 
                breedType: 'raza', breed: '', isMixed: false, breedSize: '',
                coatColor: '', noseColor: '', eyeColor: '', 
                isAdopted: false, adoptionStory: '', ruac: '',
                referralCode: '', referralName: '', isReferralValid: false
            };
            this.uploadedPhotoUrl = null;
            this.uploadedVetUrl = null;
            
            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.id = 'pata-add-modal';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `<div class="pata-modal-box" id="pata-add-content" style="max-width:550px; max-height:90vh; overflow-y:auto;"></div>`;
            document.body.appendChild(modal);
            
            this.renderAddStep();
        }

        renderAddStep() {
            const content = document.getElementById('pata-add-content');
            if (!content) return;
            
            if (this.addStep === 1) this.renderStep1(content);
            else this.renderStep2(content);
        }

        renderStep1(container) {
            const d = this.addFormData;
            container.innerHTML = `
                <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer; z-index:10;" onclick="this.closest('.pata-modal-overlay').remove()">&times;</button>
                <h2 style="text-align:center; font-weight:900; font-size:28px; margin:0 0 20px 0; color:#1A1A1A;">🐾 Nueva mascota</h2>
                
                <div class="pata-step-indicator">
                    <div class="pata-step-dot active"></div>
                    <div class="pata-step-dot"></div>
                    <span class="pata-step-label">Paso 1 de 2</span>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Tipo de mascota *</label>
                    <div class="pata-type-sel">
                        <button type="button" class="pata-type-btn ${d.petType==='perro'?'active':''}" data-type="perro"><span class="pata-type-icon">🐶</span>Perro</button>
                        <button type="button" class="pata-type-btn ${d.petType==='gato'?'active':''}" data-type="gato"><span class="pata-type-icon">🐱</span>Gato</button>
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label" id="name-label">${d.petType==='gato'?'¿Cómo se llama tu michi?':'¿Cómo se llama tu peludo?'} *</label>
                    <input class="pata-form-input" id="add-name" value="${d.name}" placeholder="Ej: Luna, Max, Pelusa...">
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Edad *</label>
                    <div class="pata-age-row">
                        <input class="pata-age-input" id="add-age-val" type="number" min="1" value="${d.ageValue}" placeholder="Ej: 3">
                        <select class="pata-age-select" id="add-age-unit">
                            <option value="years" ${d.ageUnit==='years'?'selected':''}>Años</option>
                            <option value="months" ${d.ageUnit==='months'?'selected':''}>Meses</option>
                        </select>
                    </div>
                </div>

                <div class="pata-btn-row">
                    <button class="pata-btn pata-btn-primary" id="add-next">Continuar →</button>
                </div>`;

            // Events
            container.querySelectorAll('.pata-type-btn').forEach(btn => {
                btn.onclick = () => {
                    d.petType = btn.dataset.type;
                    container.querySelectorAll('.pata-type-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('name-label').innerText = d.petType === 'gato' ? '¿Cómo se llama tu michi? *' : '¿Cómo se llama tu peludo? *';
                };
            });

            document.getElementById('add-next').onclick = () => {
                const name = document.getElementById('add-name').value.trim();
                const age = document.getElementById('add-age-val').value;
                if (!d.petType) return alert('Selecciona si es perro o gato');
                if (!name) return alert('El nombre es requerido');
                if (!age || age <= 0) return alert('Ingresa una edad válida');
                
                d.name = name;
                d.ageValue = age;
                d.ageUnit = document.getElementById('add-age-unit').value;

                this.addStep = 2;
                this.renderAddStep();
            };
        }

        renderStep2(container) {
            const d = this.addFormData;
            const isGato = d.petType === 'gato';
            const ageNum = d.ageUnit === 'years' ? parseInt(d.ageValue) : Math.floor(parseInt(d.ageValue)/12);
            
            // Nueva lógica granular de Senior según tipo y talla
            let isSenior = false;
            if (isGato) {
                isSenior = ageNum >= 10;
            } else {
                const isLarge = d.breedSize === 'grande' || d.breedSize === 'gigante';
                isSenior = isLarge ? ageNum >= 6 : ageNum >= 7;
            }

            container.innerHTML = `
                <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer; z-index:10;" onclick="this.closest('.pata-modal-overlay').remove()">&times;</button>
                <h2 style="text-align:center; font-weight:900; font-size:28px; margin:0 0 20px 0; color:#1A1A1A;">Datos de ${d.name}</h2>
                
                <div class="pata-step-indicator">
                    <div class="pata-step-dot"></div>
                    <div class="pata-step-dot active"></div>
                    <span class="pata-step-label">Paso 2 de 2</span>
                </div>

                <div class="pata-form-row">
                    <div class="pata-form-group">
                        <label class="pata-form-label">Sexo *</label>
                        <select class="pata-form-select" id="add-gender">
                            <option value="">Selecciona...</option>
                            <option value="macho" ${d.gender==='macho'?'selected':''}>Macho</option>
                            <option value="hembra" ${d.gender==='hembra'?'selected':''}>Hembra</option>
                        </select>
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Tipo *</label>
                    <div class="pata-breed-type-switch">
                        <button type="button" class="pata-switch-btn ${d.breedType==='mestizo'?'active':''}" data-bt="mestizo">
                            ${d.breedType==='mestizo' ? '<span class="pata-switch-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : ''}
                            Mestizo
                        </button>
                        <button type="button" class="pata-switch-btn ${d.breedType==='raza'?'active':''}" data-bt="raza">
                            ${d.breedType==='raza' ? '<span class="pata-switch-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : ''}
                            Raza
                        </button>
                    </div>
                    <p style="font-size:11px; color:#A0A0A0; margin-top:-5px;">Selecciona si es mestizo o de raza definida</p>
                </div>

                <div class="pata-form-group" id="breed-group" style="display:${d.breedType==='raza'?'block':'none'}">
                    <label class="pata-form-label">Raza *</label>
                    <div class="pata-breed-wrapper">
                        <input class="pata-form-input" id="pata-breed-input" value="${d.breed}" placeholder="Escribe para buscar..." autocomplete="off">
                        <div id="pata-breed-suggestions" class="pata-breed-suggestions"></div>
                        <div id="pata-breed-warning" class="pata-breed-warning" style="display:none;"></div>
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Talla *</label>
                    <select class="pata-form-select" id="add-size">
                        <option value="">Selecciona...</option>
                        <option value="pequeño" ${d.breedSize==='pequeño'?'selected':''}>Pequeño</option>
                        <option value="mediano" ${d.breedSize==='mediano'?'selected':''}>Mediano</option>
                        <option value="grande" ${d.breedSize==='grande'?'selected':''}>Grande</option>
                        ${!isGato ? `<option value="gigante" ${d.breedSize==='gigante'?'selected':''}>Gigante</option>` : ''}
                    </select>
                </div>

                <div class="pata-form-row">
                    <div class="pata-form-group">
                        <label class="pata-form-label">Color de pelo *</label>
                        <input class="pata-form-input" id="add-coat" value="${d.coatColor}" placeholder="Ej: Café, Negro...">
                    </div>
                    <div class="pata-form-group">
                        <label class="pata-form-label">Color de nariz</label>
                        <input class="pata-form-input" id="add-nose" value="${d.noseColor}" placeholder="Ej: Negro, Rosado...">
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Color de ojos</label>
                    <input class="pata-form-input" id="add-eyes" value="${d.eyeColor}" placeholder="Ej: Miel, Azules...">
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Fotografía</label>
                    <div class="pata-upload-box" id="photo-box">
                        <input type="file" accept="image/*" id="add-photo" style="position:absolute; inset:0; opacity:0; cursor:pointer;">
                        ${this.uploadedPhotoUrl ? `<img src="${this.uploadedPhotoUrl}" class="pata-upload-preview">` : '<span class="pata-upload-icon">📷</span>'}
                        <p class="pata-upload-text">${this.uploadedPhotoUrl ? '✓ Foto lista' : 'Haz clic para subir foto'}</p>
                        <p class="pata-upload-subtext">JPG/PNG, máx 5MB</p>
                    </div>
                </div>

                <div class="pata-adoption-section" style="display:${d.breedType==='mestizo'?'block':'none'}">
                    <div class="pata-adoption-header">
                        <div class="pata-adoption-icon">🏠</div>
                        <div>
                            <h4 class="pata-adoption-title">¿Tu mascota es adoptada?</h4>
                            <p class="pata-adoption-subtitle">Nos encantaría conocer su origen</p>
                        </div>
                    </div>

                    <div class="pata-adoption-checkbox-wrapper" id="adoption-toggle">
                        <input type="checkbox" class="pata-adoption-checkbox" id="add-adopted" ${d.isAdopted?'checked':''}>
                        <span class="pata-adoption-checkbox-text">¡Sí, es rescatada / adoptada!</span>
                    </div>

                    <div class="pata-adoption-story-wrapper" id="story-group" style="display:${d.isAdopted?'block':'none'}">
                        <label class="pata-adoption-story-label">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00BBB4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            Cuéntanos su historia
                        </label>
                        <textarea class="pata-adoption-textarea" id="add-story" placeholder="Ej: La encontramos en un refugio hace 2 años...">${d.adoptionStory}</textarea>
                        <p style="font-size:10px; color:#718096; margin-top:8px; line-height:1.3;">⚠️ <strong>AVISO:</strong> Al llenar la historia nos autorizas a publicarla en nuestras redes para inspirar a otros.</p>
                    </div>
                </div>

                <div class="pata-ruac-section">
                    <div class="pata-ruac-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        ¡Beneficio exclusivo!
                    </div>
                    <label class="pata-form-label" style="color:#234E52;">RUAC (Opcional)</label>
                    <div class="pata-ruac-input-wrapper">
                        <input class="pata-form-input" id="add-ruac" value="${d.ruac}" placeholder="Ej: A1B2C3D4E5" maxlength="10" style="text-transform: uppercase;">
                        <span id="ruac-status" class="pata-ruac-status" style="display:${d.ruac.length===10?'block':'none'}">✨</span>
                    </div>
                    <p style="font-size:11px; color:#4A7C7F; margin-top:10px;"><strong>🎁 Ventaja:</strong> Con el RUAC, el periodo de carencia se reduce a <strong>90 días</strong>.</p>
                    <a href="https://ruac.cdmx.gob.mx/" target="_blank" class="pata-ruac-help-link">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        ¿Qué es el RUAC y cómo obtenerlo?
                    </a>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Código de Embajador (Opcional)</label>
                    <input class="pata-form-input ${d.referralCode ? (d.isReferralValid ? 'valid' : 'invalid') : ''}" 
                           id="add-referral-code" 
                           value="${d.referralCode}" 
                           placeholder="Ej: MARCOS24" 
                           style="text-transform: uppercase;">
                    <div id="referral-msg" class="pata-referral-msg ${d.isReferralValid ? 'success' : 'error'}">
                        ${d.referralName ? `✓ Embajador: ${d.referralName}` : ''}
                    </div>
                </div>

                ${isSenior ? `
                <div class="pata-alert-box">
                    <span class="pata-alert-icon">⚕️</span>
                    <div class="pata-alert-text">
                        <strong>Certificado veterinario requerido</strong>
                        Como ${d.name} tiene ${ageNum} años, es necesario subir un certificado de salud para validar su membresía.
                    </div>
                </div>
                <div class="pata-form-group">
                    <div class="pata-upload-box" id="vet-box">
                        <input type="file" accept=".pdf,image/*" id="add-vet" style="position:absolute; inset:0; opacity:0; cursor:pointer;">
                        <div id="vet-preview-wrap">
                            ${this.uploadedVetUrl ? '<span class="pata-upload-icon">✅</span>' : '<span class="pata-upload-icon">📄</span>'}
                            <p class="pata-upload-text">${this.uploadedVetUrl ? '✓ Certificado listo' : 'Subir certificado'}</p>
                            <p class="pata-upload-subtext">PDF/Imagen, máx 5MB</p>
                        </div>
                    </div>
                </div>` : ''}

                <div class="pata-btn-row">
                    <button class="pata-btn pata-btn-secondary" id="add-back">← Atrás</button>
                    <button class="pata-btn pata-btn-primary" id="pata-save-btn">Registrar mascota ✓</button>
                </div>`;

            // Setup Events
            document.getElementById('add-back').onclick = () => { this.saveStep2Fields(); this.addStep = 1; this.renderAddStep(); };
            
            container.querySelectorAll('.pata-switch-btn').forEach(btn => {
                btn.onclick = () => {
                    d.breedType = btn.dataset.bt;
                    d.isMixed = (d.breedType === 'mestizo');
                    if (d.isMixed) d.breed = 'Mestizo';
                    this.saveStep2Fields();
                    this.renderStep2(container);
                };
            });

            document.getElementById('adoption-toggle').onclick = () => {
                const cb = document.getElementById('add-adopted');
                cb.checked = !cb.checked;
                d.isAdopted = cb.checked;
                document.getElementById('story-group').style.display = d.isAdopted ? 'block' : 'none';
            };

            // RUAC dynamic status
            document.getElementById('add-ruac').oninput = (e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                e.target.value = val;
                document.getElementById('ruac-status').style.display = val.length === 10 ? 'block' : 'none';
            };

            // Listener dinámico para Senior
            if (sizeEl) {
                sizeEl.onchange = () => {
                    d.breedSize = sizeEl.value;
                    this.renderStep2(container);
                };
            }

            this.setupBreedAutocomplete(container);
            this.setupFileUploads();
            this.setupReferralValidation();

            document.getElementById('pata-save-btn').onclick = (e) => {
                e.preventDefault();
                this.submitNewPet(isSenior);
            };
        }

        saveStep2Fields() {
            const d = this.addFormData;
            d.gender = document.getElementById('add-gender').value;
            d.breedSize = document.getElementById('add-size').value;
            d.coatColor = document.getElementById('add-coat').value;
            d.eyeColor = document.getElementById('add-eyes').value;
            d.noseColor = document.getElementById('add-nose').value;
            d.adoptionStory = document.getElementById('add-story') ? document.getElementById('add-story').value : '';
            d.ruac = document.getElementById('add-ruac').value;
            d.referralCode = document.getElementById('add-referral-code').value.toUpperCase();
            if (d.breedType === 'raza') d.breed = document.getElementById('pata-breed-input').value;
        }

        setupReferralValidation() {
            const input = document.getElementById('add-referral-code');
            const msg = document.getElementById('referral-msg');
            if (!input || !msg) return;

            let debounceTimer;
            input.addEventListener('input', (e) => {
                const code = e.target.value.toUpperCase();
                this.addFormData.referralCode = code;
                clearTimeout(debounceTimer);

                if (!code) {
                    msg.innerHTML = '';
                    input.classList.remove('valid', 'invalid');
                    this.addFormData.isReferralValid = false;
                    this.addFormData.referralName = '';
                    return;
                }

                msg.innerHTML = 'Validando...';
                msg.className = 'pata-referral-msg loading';
                
                debounceTimer = setTimeout(async () => {
                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/referrals/validate-code?code=${code}`);
                        const data = await res.json();
                        
                        if (data.success && data.valid) {
                            msg.innerHTML = `✓ Embajador: ${data.ambassador.name}`;
                            msg.className = 'pata-referral-msg success';
                            input.classList.add('valid');
                            input.classList.remove('invalid');
                            this.addFormData.isReferralValid = true;
                            this.addFormData.referralName = data.ambassador.name;
                        } else {
                            msg.innerHTML = '❌ Código no válido';
                            msg.className = 'pata-referral-msg error';
                            input.classList.add('invalid');
                            input.classList.remove('valid');
                            this.addFormData.isReferralValid = false;
                            this.addFormData.referralName = '';
                        }
                    } catch (err) {
                        msg.innerHTML = '⚠️ Error al validar';
                        msg.className = 'pata-referral-msg error';
                    }
                }, 600);
            });
        }

        setupFileUploads() {
            const photoInput = document.getElementById('add-photo');
            const vetInput = document.getElementById('add-vet');
            
            if (photoInput) {
                photoInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const box = document.getElementById('photo-box');
                    const originalContent = box.innerHTML;
                    box.innerHTML = '<div style="width:30px; height:30px; border:3px solid #eee; border-top-color:#15BEB2; border-radius:50%; animation:pataSpin 0.8s linear infinite; margin:20px auto;"></div>';
                    try {
                        const url = await this.uploadNewPetPhoto(file);
                        this.uploadedPhotoUrl = url;
                        box.classList.add('has-file');
                        box.innerHTML = `<input type="file" accept="image/*" id="add-photo" style="position:absolute; inset:0; opacity:0; cursor:pointer;" /><img src="${url}" class="pata-upload-preview" /><p class="pata-upload-text">✓ Foto lista</p><p class="pata-upload-subtext">Haz clic para cambiar</p>`;
                        this.setupFileUploads(); // Re-attach listener
                    } catch(err) { 
                        alert('Error subiendo foto'); 
                        box.innerHTML = originalContent;
                        this.setupFileUploads();
                    }
                };
            }

            if (vetInput) {
                vetInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const box = document.getElementById('vet-box');
                    const originalContent = box.innerHTML;
                    box.innerHTML = '<div style="width:30px; height:30px; border:3px solid #eee; border-top-color:#15BEB2; border-radius:50%; animation:pataSpin 0.8s linear infinite; margin:20px auto;"></div>';
                    try {
                        const url = await this.uploadNewPetPhoto(file);
                        this.uploadedVetUrl = url;
                        box.classList.add('has-file');
                        box.innerHTML = `<input type="file" accept=".pdf,image/*" id="add-vet" style="position:absolute; inset:0; opacity:0; cursor:pointer;" /><span class="pata-upload-icon">✅</span><p class="pata-upload-text">✓ Certificado listo</p><p class="pata-upload-subtext">Haz clic para cambiar</p>`;
                        this.setupFileUploads(); // Re-attach listener
                    } catch(err) { 
                        alert('Error subiendo certificado'); 
                        box.innerHTML = originalContent;
                        this.setupFileUploads();
                    }
                };
            }
        }
        async setupBreedAutocomplete(container) {
            const input = document.getElementById('pata-breed-input');
            const suggestions = document.getElementById('pata-breed-suggestions');
            const warning = document.getElementById('pata-breed-warning');
            if (!input || !suggestions) return;

            this.breedsCache = this.breedsCache || { perro: [], gato: [] };
            const type = this.addFormData.petType;

            const load = async () => {
                if (this.breedsCache[type].length) return;
                try {
                    const res = await fetch(`${CONFIG.apiUrl}/api/breeds?type=${type}`);
                    const data = await res.json();
                    if (data.success) this.breedsCache[type] = data.breeds;
                } catch(e) { console.error('Error loading breeds', e); }
            };

            input.onfocus = async () => {
                await load();
                show('');
            };

            input.oninput = (e) => show(e.target.value);

            const show = (q) => {
                const list = this.breedsCache[type] || [];
                const filtered = q ? list.filter(b => b.name.toLowerCase().includes(q.toLowerCase())).slice(0,10) : list.slice(0,8);
                suggestions.innerHTML = filtered.map(b => `<div class="pata-breed-suggestion" data-name="${b.name}" data-warning="${b.warning_message||''}">${b.name}</div>`).join('');
                suggestions.classList.add('active');
            };

            suggestions.onclick = (e) => {
                const item = e.target.closest('.pata-breed-suggestion');
                if (item) {
                    input.value = item.dataset.name;
                    this.addFormData.breed = item.dataset.name;
                    suggestions.classList.remove('active');
                    if (item.dataset.warning) {
                        warning.innerHTML = item.dataset.warning;
                        warning.style.display = 'block';
                    } else {
                        warning.style.display = 'none';
                    }
                }
            };

            document.addEventListener('click', (e) => { if (!input.contains(e.target)) suggestions.classList.remove('active'); });
        }

        async submitNewPet(isSenior) {
            const btn = document.getElementById('pata-save-btn');
            this.saveStep2Fields();
            const d = this.addFormData;

            if (!d.gender) return alert('Selecciona el sexo');
            if (!d.breedSize) return alert('Selecciona la talla');
            if (d.breedType === 'raza' && !d.breed) return alert('Selecciona una raza');
            if (!d.coatColor) return alert('Ingresa el color de pelo');
            if (!this.uploadedPhotoUrl) return alert('Sube la foto de tu mascota');
            if (isSenior && !this.uploadedVetUrl) return alert('El certificado veterinario es obligatorio por la edad');

            btn.disabled = true;
            btn.innerText = 'Guardando...';

            try {
                const payload = {
                    memberstackId: this.member.id,
                    petData: {
                        name: d.name,
                        lastName: d.lastName,
                        petType: d.petType,
                        ageValue: parseInt(d.ageValue),
                        ageUnit: d.ageUnit,
                        gender: d.gender,
                        breed: d.isMixed ? 'Mestizo' : d.breed,
                        breedSize: d.breedSize,
                        isMixed: d.isMixed,
                        coatColor: d.coatColor,
                        noseColor: d.noseColor,
                        eyeColor: d.eyeColor,
                        isAdopted: d.isAdopted,
                        adoptionStory: d.adoptionStory,
                        photo1Url: this.uploadedPhotoUrl,
                        isSenior: isSenior,
                        vetCertificateUrl: this.uploadedVetUrl,
                        ruac: d.ruac || '',
                        referralCode: d.isReferralValid ? d.referralCode : ''
                    }
                };

                const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.success) {
                    alert('¡Mascota registrada! Revisaremos la información pronto.');
                    document.getElementById('pata-add-modal').remove();
                    this.init();
                } else {
                    alert('Error: ' + (data.error || 'No se pudo guardar'));
                    btn.disabled = false;
                    btn.innerText = 'Registrar mascota ✓';
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Ocurrió un error al guardar');
                btn.disabled = false;
                btn.innerText = 'Registrar mascota ✓';
            }
        }

        async uploadNewPetPhoto(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', this.member.id);

            const res = await fetch(`${CONFIG.apiUrl}/api/user/upload-pet-photo`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success && data.url) return data.url;
            throw new Error(data.error || 'Error subiendo archivo');
        }

        showAppealForm(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;
            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="pata-modal-box">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer;" onclick="this.closest('.pata-modal-overlay').remove()">&times;</button>
                    <h2 style="text-align:center; font-weight:800; font-size:26px; margin:0 0 15px 0;">⚖️ Apelar para ${pet.name}</h2>
                    ${pet.admin_notes ? `<div style="background:#FFEBEE; padding:12px; border-radius:10px; margin-bottom:20px; border-left:4px solid #C62828;"><strong>Motivo del rechazo:</strong><br>${pet.admin_notes}</div>` : ''}
                    <form id="pata-appeal-form">
                        <p style="margin-bottom:10px; color:#666;">Explica por qué reconsiderar la decisión.</p>
                        <textarea id="pata-appeal-msg" required placeholder="Escribe tu mensaje..." style="width:100%; height:100px; padding:15px; border-radius:10px; border:1px solid #ddd; resize:none; font-family:inherit; font-size:14px;"></textarea>
                        <button type="submit" class="pata-btn pata-btn-primary" style="width:100%; height:55px; font-size:16px; background:#7B1FA2; margin-top:15px;" id="pata-appeal-btn">Enviar Apelación</button>
                    </form>
                </div>`;
            document.body.appendChild(modal);

            document.getElementById('pata-appeal-form').onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.getElementById('pata-appeal-btn');
                const msg = document.getElementById('pata-appeal-msg').value.trim();
                btn.disabled = true; btn.innerText = 'Enviando...';
                try {
                    const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberId: this.member.id, petId, appealMessage: msg })
                    });
                    const data = await res.json();
                    if (data.success) { alert('¡Apelación enviada!'); modal.remove(); this.init(); }
                    else { alert('Error: ' + data.error); btn.disabled = false; btn.innerText = 'Enviar Apelación'; }
                } catch (err) { alert('Error de conexión'); btn.disabled = false; }
            };
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
