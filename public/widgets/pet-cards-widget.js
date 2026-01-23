/**
 * 🐾 Club Pata Amiga - Smart Pet Cards Widget
 * Administra la visualización de la manada, estatus y límite de registros.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://club-pata-amiga-form.vercel.app',
        maxPets: 3,
        statusColors: {
            approved: { bg: '#E8F5E9', text: '#2E7D32', label: 'Aprobada', icon: '✅' },
            pending: { bg: '#FFF3E0', text: '#EF6C00', label: 'Pendiente', icon: '⏳' },
            rejected: { bg: '#FFEBEE', text: '#C62828', label: 'Rechazada', icon: '❌' },
            action_required: { bg: '#E3F2FD', text: '#1565C0', label: 'Acción Requerida', icon: '⚠️' },
            appealed: { bg: '#F3E5F5', text: '#7B1FA2', label: 'Apelada', icon: '⚖️' }
        }
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');

        .pata-manada-section {
            padding: 80px 20px;
            background-color: #FFFDEE;
            font-family: 'Outfit', sans-serif;
            position: relative;
            overflow: hidden;
        }

        .pata-manada-bg-brush {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 400px;
            background-color: #9FD406;
            z-index: 1;
            mask-image: url('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6939f6880cc902377c8e9b67_Brush%20Stroke.svg');
            mask-size: cover;
            -webkit-mask-image: url('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6939f6880cc902377c8e9b67_Brush%20Stroke.svg');
            -webkit-mask-size: cover;
        }

        .pata-manada-container {
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
            z-index: 2;
        }

        .pata-manada-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 60px;
            text-align: center;
        }

        .pata-manada-title {
            font-size: clamp(40px, 8vw, 72px);
            font-weight: 800;
            color: #1A1A1A;
            margin: 0;
            line-height: 1;
        }

        .pata-manada-grid {
            display: flex;
            gap: 30px;
            justify-content: center;
            flex-wrap: wrap;
        }

        /* CARD STYLE */
        .pata-pet-card {
            background: #fff;
            border-radius: 24px;
            border: 20px solid transparent;
            border-image: url('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6939eeaac4c62495a60899c2_Card%20background%20(Stroke).svg') 40 round;
            width: 300px;
            height: 420px;
            position: relative;
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            box-shadow: 0 15px 35px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        .pata-pet-card:hover {
            width: 580px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }

        .pata-card-inner {
            display: flex;
            width: 100%;
            height: 100%;
            border-radius: 12px;
            overflow: hidden;
        }

        /* Foto del lado izquierdo */
        .pata-card-photo-side {
            width: 260px;
            height: 100%;
            position: relative;
            flex-shrink: 0;
            background: #f5f5f5;
        }

        .pata-card-photo-side img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.8s ease;
        }

        .pata-pet-card:hover .pata-card-photo-side img {
            transform: scale(1.05);
        }

        .pata-status-badge {
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 8px 14px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 3;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .pata-pet-name-plate {
            position: absolute;
            bottom: 25px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 10px 24px;
            border-radius: 40px;
            font-weight: 800;
            color: #1A1A1A;
            font-size: 20px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.12);
            white-space: nowrap;
            z-index: 3;
        }

        /* Panel de Información que se revela */
        .pata-card-info-side {
            flex: 1;
            padding: 40px;
            opacity: 0;
            transform: translateX(-30px);
            transition: all 0.4s ease 0.1s;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #fff;
        }

        .pata-pet-card:hover .pata-card-info-side {
            opacity: 1;
            transform: translateX(0);
        }

        .pata-info-title { 
            font-size: 32px; 
            font-weight: 800; 
            margin: 0 0 25px 0; 
            color: #1A1A1A;
        }

        .pata-info-list {
            list-style: none;
            padding: 0;
            margin: 0 0 30px 0;
        }

        .pata-info-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
            color: #555;
            font-size: 16px;
        }

        .pata-info-icon { font-size: 20px; width: 24px; text-align: center; }

        .pata-card-actions {
            display: flex;
            gap: 12px;
        }

        .pata-btn {
            padding: 14px 24px;
            border-radius: 50px;
            border: none;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-align: center;
            text-decoration: none;
            display: inline-block;
        }

        .pata-btn-primary { background: #9FD406; color: #1A1A1A; border: 2px solid #9FD406; }
        .pata-btn-primary:hover { background: #8bc105; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(159, 212, 6, 0.3); }

        .pata-btn-outline { background: transparent; color: #1A1A1A; border: 2px solid #EAEAEA; }
        .pata-btn-outline:hover { background: #f9f9f9; border-color: #9FD406; }

        .pata-btn:disabled { 
            background: #F0F0F0 !important; 
            color: #AAA !important; 
            border-color: #F0F0F0 !important;
            cursor: not-allowed; 
            transform: none !important;
            box-shadow: none !important;
        }

        /* ADD PET CARD */
        .pata-add-card {
            width: 300px;
            height: 420px;
            background: rgba(255, 255, 255, 0.5);
            border: 3px dashed #CCC;
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #777;
        }

        .pata-add-card:hover {
            background: #fff;
            border-color: #9FD406;
            color: #1A1A1A;
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.05);
        }

        .pata-add-icon { 
            width: 80px; height: 80px; 
            background: #fff; 
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            font-size: 40px; margin-bottom: 25px; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
        }

        .pata-add-card:hover .pata-add-icon {
            background: #9FD406;
            color: #fff;
            transform: rotate(90deg);
        }

        .pata-add-title { font-size: 22px; font-weight: 700; margin: 0 0 10px 0; }
        .pata-add-subtitle { font-size: 14px; opacity: 0.8; }

        /* MODAL SYSTEM */
        .pata-modal-overlay {
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px;
        }

        .pata-modal-content {
            background: #fff; border-radius: 32px; max-width: 800px; width:100%;
            max-height: 90vh; overflow-y: auto;
            padding: 50px; position: relative; 
            animation: pataModalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
        }

        @keyframes pataModalPop { from { opacity:0; transform: scale(0.9) translateY(30px); } to { opacity:1; transform: scale(1) translateY(0); } }

        .pata-modal-close { 
            position: absolute; top:25px; right:25px; 
            width: 40px; height: 40px; border-radius: 50%;
            background: #f5f5f5; border: none; font-size: 24px; 
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; color: #333;
        }
        .pata-modal-close:hover { background: #eee; transform: rotate(90deg); }

        /* FORM STYLES */
        .pata-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
        .pata-form-group { display: flex; flex-direction: column; gap: 8px; }
        .pata-form-label { font-size: 14px; font-weight: 700; color: #333; }
        .pata-form-input { 
            padding: 14px 18px; border-radius: 12px; border: 2px solid #EEE; 
            font-family: inherit; font-size: 16px; transition: 0.2s;
        }
        .pata-form-input:focus { border-color: #9FD406; outline: none; background: #FFF; }
        .pata-form-full { grid-column: 1 / -1; }

        .pata-upload-box {
            border: 2px dashed #DDD; border-radius: 15px; padding: 30px;
            text-align: center; cursor: pointer; transition: 0.2s;
            background: #FAFAFA;
        }
        .pata-upload-box:hover { border-color: #9FD406; background: #F5FAF0; }
        .pata-upload-preview { 
            width: 120px; height: 120px; object-fit: cover; border-radius: 12px; 
            margin: 15px auto; display: none;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
            .pata-pet-card:hover { width: 300px; height: auto; }
            .pata-card-inner { flex-direction: column; }
            .pata-card-photo-side { width: 100%; height: 260px; }
            .pata-card-info-side { opacity: 1; transform: none; display: flex; padding: 30px; }
            .pata-form-grid { grid-template-columns: 1fr; }
        }
    `;

    class ManadaWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
            this.isSubmitting = false;

            if (!this.container) return;
            this.init();
        }

        async init() {
            this.injectStyles();
            this.renderLoading();

            try {
                await this.waitForMemberstack();
                if (!this.member) {
                    this.container.innerHTML = '<div style="text-align:center; padding: 40px; color:#666;">Inicia sesión para ver tu manada 🐾</div>';
                    return;
                }

                await this.loadData();
                this.render();
            } catch (err) {
                console.error('Manada Error:', err);
                this.renderError();
            }
        }

        injectStyles() {
            if (document.getElementById('pata-manada-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-manada-styles';
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
                const res = await fetch(`${CONFIG.apiUrl}/api/user/pets?userId=${this.member.id}`);
                const data = await res.json();
                if (data.success) {
                    this.pets = data.pets || [];
                }
            } catch (e) {
                console.error('Error fetching pets:', e);
            }
        }

        renderLoading() {
            this.container.innerHTML = `<div style="text-align:center; padding: 120px; color:#666; font-size: 20px;">🐾 Preparando tu manada...</div>`;
        }

        renderError() {
            this.container.innerHTML = `<div style="text-align:center; padding: 60px; color:#C62828;">No pudimos cargar tu manada. Recarga la página por favor.</div>`;
        }

        render() {
            const petCards = this.pets.map(pet => this.createPetCardHtml(pet)).join('');
            const addCard = this.pets.length < CONFIG.maxPets ? this.createAddCardHtml() : '';

            this.container.innerHTML = `
                <section class="pata-manada-section">
                    <div class="pata-manada-bg-brush"></div>
                    <div class="pata-manada-container">
                        <div class="pata-manada-header">
                            <h2 class="pata-manada-title">Mi manada</h2>
                            <span style="font-size: min(10vw, 60px);">🐶</span>
                        </div>
                        <div class="pata-manada-grid">
                            ${petCards}
                            ${addCard}
                        </div>
                    </div>
                </section>
                <div class="pata-modal-overlay" id="pata-global-modal">
                    <div class="pata-modal-content" id="pata-modal-body"></div>
                </div>
            `;

            this.attachEvents();
        }

        createPetCardHtml(pet) {
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;
            const imageUrl = pet.photo_url || 'https://via.placeholder.com/400x600?text=Cargando...';

            // Lógica de carencia simplificada para visual
            let carnyText = '';
            let isReady = pet.status === 'approved';

            if (pet.status === 'approved') {
                const regDate = new Date(pet.created_at);
                const today = new Date();
                const diffTime = Math.abs(today - regDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const remaining = Math.max(0, 180 - diffDays);

                if (remaining > 0) {
                    isReady = false;
                    carnyText = `Carencia: ${remaining} d`;
                }
            }

            return `
                <div class="pata-pet-card" data-pet-id="${pet.id}">
                    <div class="pata-status-badge" style="background:${status.bg}; color:${status.text}">
                        <span>${status.icon}</span> ${status.label}
                    </div>
                    <div class="pata-card-inner">
                        <div class="pata-card-photo-side">
                            <img src="${imageUrl}" alt="${pet.name}" loading="lazy">
                            <div class="pata-pet-name-plate">${pet.name}</div>
                        </div>
                        <div class="pata-card-info-side">
                            <h3 class="pata-info-title">${pet.name}</h3>
                            <ul class="pata-info-list">
                                <li class="pata-info-item"><span class="pata-info-icon">🐩</span> ${pet.breed || 'Mestizo'}</li>
                                <li class="pata-info-item"><span class="pata-info-icon">📏</span> Talla ${pet.breed_size || 'M'}</li>
                                <li class="pata-info-item"><span class="pata-info-icon">📅</span> Registrado: ${new Date(pet.created_at).toLocaleDateString()}</li>
                            </ul>
                            <div class="pata-card-actions">
                                <button class="pata-btn pata-btn-outline view-details-btn" data-id="${pet.id}">Detalles</button>
                                <button class="pata-btn pata-btn-primary" ${!isReady ? 'disabled' : ''}>
                                    ${isReady ? 'Solicitar Apoyo' : (carnyText || 'Pendiente')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        createAddCardHtml() {
            return `
                <div class="pata-add-card" id="open-add-pet-btn">
                    <div class="pata-add-icon">＋</div>
                    <h3 class="pata-add-title">Sumar un peludo</h3>
                    <p class="pata-add-subtitle">Puedes tener hasta ${CONFIG.maxPets} mascotas. <br> Te quedan <strong>${CONFIG.maxPets - this.pets.length}</strong> lugares.</p>
                </div>
            `;
        }

        attachEvents() {
            // Ver detalles
            this.container.querySelectorAll('.view-details-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.showDetails(btn.dataset.id);
                };
            });

            // Abrir formulario para agregar
            const addBtn = document.getElementById('open-add-pet-btn');
            if (addBtn) {
                addBtn.onclick = () => this.showAddForm();
            }

            // Cerrar modal al hacer clic fuera
            const modal = document.getElementById('pata-global-modal');
            modal.onclick = (e) => {
                if (e.target === modal) this.closeModal();
            };
        }

        closeModal() {
            document.getElementById('pata-global-modal').style.display = 'none';
        }

        showDetails(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;

            const modal = document.getElementById('pata-global-modal');
            const body = document.getElementById('pata-modal-body');
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;

            body.innerHTML = `
                <button class="pata-modal-close">&times;</button>
                <div style="display:flex; gap:40px; flex-wrap: wrap;">
                    <div style="flex: 0 0 280px;">
                        <img src="${pet.photo_url}" style="width:100%; height:400px; object-fit:cover; border-radius:24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    </div>
                    <div style="flex: 1; min-width: 300px;">
                        <h2 style="font-size:48px; margin:0 0 10px 0; font-weight: 800;">${pet.name}</h2>
                        
                        <div style="background:${status.bg}; color:${status.text}; display:inline-flex; align-items:center; gap:8px; padding:8px 20px; border-radius:30px; font-weight:700; margin-bottom:30px;">
                            ${status.icon} ${status.label}
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:30px;">
                            <div style="background:#F9F9F9; padding:15px; border-radius:15px;">
                                <small style="color:#888; text-transform:uppercase; font-size:10px; font-weight:800;">Raza</small>
                                <div style="font-weight:700; font-size:18px;">${pet.breed}</div>
                            </div>
                            <div style="background:#F9F9F9; padding:15px; border-radius:15px;">
                                <small style="color:#888; text-transform:uppercase; font-size:10px; font-weight:800;">Talla</small>
                                <div style="font-weight:700; font-size:18px;">${pet.breed_size}</div>
                            </div>
                            <div style="background:#F9F9F9; padding:15px; border-radius:15px;">
                                <small style="color:#888; text-transform:uppercase; font-size:10px; font-weight:800;">ID Registro</small>
                                <div style="font-weight:700; font-size:14px; color:#666;">#${pet.id.substring(0, 8)}</div>
                            </div>
                            <div style="background:#F9F9F9; padding:15px; border-radius:15px;">
                                <small style="color:#888; text-transform:uppercase; font-size:10px; font-weight:800;">Fecha de Alta</small>
                                <div style="font-weight:700; font-size:18px;">${new Date(pet.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>

                        ${pet.admin_notes ? `
                            <div style="border-left: 4px solid #9FD406; padding: 20px; background: #FFFDEE; border-radius: 0 15px 15px 0; margin-bottom: 25px;">
                                <h4 style="margin:0 0 8px 0; font-size:16px;">Nota de revisión:</h4>
                                <p style="margin:0; color:#555; line-height:1.6;">${pet.admin_notes}</p>
                            </div>
                        ` : ''}

                        <button class="pata-btn pata-btn-primary" style="width:100%; padding:18px;" onclick="window.location.href='/contacto'">
                            Obtener Certificado Digital 🐾
                        </button>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';
            body.querySelector('.pata-modal-close').onclick = () => this.closeModal();
        }

        showAddForm() {
            const modal = document.getElementById('pata-global-modal');
            const body = document.getElementById('pata-modal-body');

            body.innerHTML = `
                <button class="pata-modal-close">&times;</button>
                <h2 style="font-size:36px; font-weight: 800; margin-bottom:10px; text-align:center;">Un nuevo integrante 🐾</h2>
                <p style="text-align:center; color:#666; margin-bottom:30px;">Completa los datos para dar de alta a tu nueva mascota.</p>
                
                <form id="pata-add-pet-form">
                    <div class="pata-form-grid">
                        <div class="pata-form-group">
                            <label class="pata-form-label">Nombre del peludo</label>
                            <input type="text" name="name" class="pata-form-input" placeholder="Ej: Max" required>
                        </div>
                        <div class="pata-form-group">
                            <label class="pata-form-label">Tipo de mascota</label>
                            <select name="petType" class="pata-form-input" required>
                                <option value="PERRO">Perro</option>
                                <option value="GATO">Gato</option>
                            </select>
                        </div>
                        <div class="pata-form-group">
                            <label class="pata-form-label">Raza</label>
                            <input type="text" name="breed" class="pata-form-input" placeholder="Ej: Golden Retriever" required>
                        </div>
                        <div class="pata-form-group">
                            <label class="pata-form-label">Talla</label>
                            <select name="breedSize" class="pata-form-input" required>
                                <option value="CHICA">Chica</option>
                                <option value="MEDIANA">Mediana</option>
                                <option value="GRANDE">Grande</option>
                            </select>
                        </div>
                        <div class="pata-form-group">
                            <label class="pata-form-label">Edad (años)</label>
                            <input type="number" name="age" class="pata-form-input" min="0" max="25" placeholder="0" required>
                        </div>
                        <div class="pata-form-group">
                            <label class="pata-form-label">¿Es adoptado?</label>
                            <select name="isAdopted" class="pata-form-input" required>
                                <option value="true">Sí, lo adoptamos</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        
                        <div class="pata-form-full pata-form-group">
                            <label class="pata-form-label">Foto principal</label>
                            <div class="pata-upload-box" id="photo-upload-container">
                                <div id="upload-instruction">
                                    <span style="font-size:30px;">📸</span><br>
                                    Hacer clic para subir foto
                                </div>
                                <img id="photo-preview" class="pata-upload-preview">
                                <input type="file" id="pata-photo-input" accept="image/*" style="display:none">
                            </div>
                        </div>

                        <div class="pata-form-full" style="margin-top:20px;">
                            <button type="submit" class="pata-btn pata-btn-primary" style="width:100%; height:60px; font-size:18px;" id="pata-submit-btn">
                                Dar de alta mascota 🐾
                            </button>
                        </div>
                    </div>
                </form>
            `;

            modal.style.display = 'flex';
            body.querySelector('.pata-modal-close').onclick = () => this.closeModal();

            // Lógica de carga de archivo
            const uploadBox = document.getElementById('photo-upload-container');
            const fileInput = document.getElementById('pata-photo-input');
            const preview = document.getElementById('photo-preview');
            const instruction = document.getElementById('upload-instruction');

            uploadBox.onclick = () => fileInput.click();

            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        preview.src = re.target.result;
                        preview.style.display = 'block';
                        instruction.style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            };

            // Envío del formulario
            const form = document.getElementById('pata-add-pet-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                if (this.isSubmitting) return;

                const submitBtn = document.getElementById('pata-submit-btn');
                const formData = new FormData(form);
                const file = fileInput.files[0];

                if (!file) {
                    alert('Por favor selecciona una foto de tu mascota');
                    return;
                }

                this.isSubmitting = true;
                submitBtn.innerText = 'Guardando... ⏳';
                submitBtn.disabled = true;

                try {
                    // 1. Subir Foto
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    uploadData.append('userId', this.member.id);

                    const uploadRes = await fetch(`${CONFIG.apiUrl}/api/user/upload-pet-photo`, {
                        method: 'POST',
                        body: uploadData
                    });
                    const uploadResult = await uploadRes.json();

                    if (!uploadResult.success) throw new Error(uploadResult.error || 'Error al subir foto');

                    // 2. Crear Mascota
                    const petData = {
                        name: formData.get('name'),
                        petType: formData.get('petType'),
                        breed: formData.get('breed'),
                        breedSize: formData.get('breedSize'),
                        age: formData.get('age'),
                        isAdopted: formData.get('isAdopted') === 'true',
                        photo1Url: uploadResult.url
                    };

                    const addRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            memberstackId: this.member.id,
                            petData: petData
                        })
                    });

                    const addResult = await addRes.json();
                    if (!addResult.success) throw new Error(addResult.error || 'Error al registrar');

                    // 3. Éxito
                    alert('¡Mascota registrada con éxito! 🐶');
                    this.closeModal();
                    await this.loadData();
                    this.render();

                } catch (err) {
                    console.error('Add Pet Error:', err);
                    alert('Error: ' + err.message);
                } finally {
                    this.isSubmitting = false;
                    submitBtn.innerText = 'Dar de alta mascota 🐾';
                    submitBtn.disabled = false;
                }
            };
        }
    }

    // Iniciar
    window.ManadaWidget = new ManadaWidget('pata-amiga-manada-widget');

})();
