/**
 * 🐾 Club Pata Amiga - Smart Pet Cards Widget (Figma Optimized)
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://club-pata-amiga-form.vercel.app',
        maxPets: 3,
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

        .pata-manada-section {
            padding: 100px 20px;
            background-color: #FFFDEE;
            font-family: 'Outfit', sans-serif;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 600px;
            overflow: hidden;
        }

        /* Brush Background from Figma */
        .pata-manada-bg-brush {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            transform: translateY(-50%);
            height: 450px;
            background-color: #9FD406;
            z-index: 1;
            mask-image: url('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6939f6880cc902377c8e9b67_Brush%20Stroke.svg');
            mask-size: 100% 100%;
            mask-repeat: no-repeat;
            -webkit-mask-image: url('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6939f6880cc902377c8e9b67_Brush%20Stroke.svg');
            -webkit-mask-size: 100% 100%;
        }

        .pata-manada-container {
            max-width: 1200px;
            width: 100%;
            margin: 0 auto;
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 40px;
        }

        .pata-manada-header {
            flex: 0 0 300px;
            text-align: left;
        }

        .pata-manada-title {
            font-size: 80px;
            font-weight: 900;
            color: #1A1A1A;
            line-height: 0.9;
            margin: 0;
            text-transform: none;
        }

        .pata-manada-grid {
            flex: 1;
            display: flex;
            gap: 20px;
            justify-content: flex-start;
            flex-wrap: wrap;
        }

        /* CARD STYLE - Vertical & Fixed */
        .pata-pet-card {
            background: #fff;
            border-radius: 24px;
            padding: 15px;
            width: 260px;
            height: 400px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease;
            border: 1px solid #EAEAEA;
        }

        .pata-pet-card:hover {
            transform: translateY(-10px);
        }

        .pata-card-photo-container {
            width: 100%;
            height: 240px;
            background: #00BBB4;
            border-radius: 18px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pata-card-photo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .pata-status-badge {
            position: absolute;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            padding: 6px 14px;
            border-radius: 30px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            z-index: 3;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }

        .pata-pet-name-label {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 8px 24px;
            border-radius: 30px;
            font-weight: 800;
            color: #1A1A1A;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 3;
        }

        /* Button Stack - Vertical */
        .pata-card-actions {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 15px 0 5px 0;
        }

        .pata-btn {
            padding: 12px;
            border-radius: 50px;
            border: none;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: 0.2s;
            text-align: center;
            text-decoration: none;
            width: 100%;
        }

        .pata-btn-primary { background: #9FD406; color: #1A1A1A; }
        .pata-btn-outline { background: #fff; color: #1A1A1A; border: 2px solid #1A1A1A; }
        .pata-btn:hover { opacity: 0.9; transform: scale(1.02); }
        .pata-btn:disabled { background: #F0F0F0; color: #AAA; border-color: #F0F0F0; cursor: not-allowed; transform: none; }

        /* ADD CARD */
        .pata-add-card {
            width: 260px;
            height: 400px;
            background: rgba(255,255,255,0.7);
            border: 2px dashed #AAA;
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 30px;
            cursor: pointer;
            transition: 0.3s;
        }
        .pata-add-card:hover { background: #fff; border-color: #9FD406; transform: translateY(-5px); }
        .pata-add-icon { 
            width: 60px; height: 60px; background: #fff; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; font-size: 30px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 20px;
        }

        /* MODAL */
        .pata-modal-overlay {
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
            z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px;
        }
        .pata-modal-content {
            background: #fff; border-radius: 32px; max-width: 700px; width:100%;
            padding: 40px; position: relative; max-height: 90vh; overflow-y: auto;
        }
        .pata-modal-close { position: absolute; top:20px; right:20px; font-size: 30px; cursor: pointer; border:none; background:none; }

        @media (max-width: 900px) {
            .pata-manada-container { flex-direction: column; text-align: center; }
            .pata-manada-header { flex: none; width: 100%; }
            .pata-manada-title { font-size: 60px; }
            .pata-manada-bg-brush { height: 100%; }
            .pata-manada-grid { justify-content: center; }
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
            this.container.innerHTML = `<div style="text-align:center; padding: 40px; color:#666;">Cargando manada... 🐾</div>`;

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
                this.container.innerHTML = '<div style="text-align:center; padding: 40px; color:red;">Error al cargar datos.</div>';
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
                    } else if (attempts > 60) { clearInterval(check); resolve(); }
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
            const petCards = this.pets.map(pet => this.createPetCardHtml(pet)).join('');
            const addCard = this.pets.length < CONFIG.maxPets ? this.createAddCardHtml() : '';

            this.container.innerHTML = `
                <section class="pata-manada-section">
                    <div class="pata-manada-bg-brush"></div>
                    <div class="pata-manada-container">
                        <div class="pata-manada-header">
                            <h2 class="pata-manada-title">Mi<br>manada</h2>
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
            const imageUrl = pet.photo_url || 'https://via.placeholder.com/400x600?text=Peludo';

            let carnyText = '';
            let isReady = pet.status === 'approved';

            if (pet.status === 'approved') {
                const regDate = new Date(pet.created_at);
                const diffDays = Math.ceil(Math.abs(new Date() - regDate) / (1000 * 60 * 60 * 24));
                const remaining = Math.max(0, 180 - diffDays);
                if (remaining > 0) {
                    isReady = false;
                    carnyText = `Carencia: ${remaining} d`;
                }
            }

            return `
                <div class="pata-pet-card">
                    <div class="pata-status-badge" style="background:${status.bg}; color:${status.text}">
                        ${status.icon} ${status.label}
                    </div>
                    <div class="pata-card-photo-container">
                        <img src="${imageUrl}" alt="${pet.name}" onerror="this.src='https://via.placeholder.com/400x600?text=${pet.name}'">
                        <div class="pata-pet-name-label">${pet.name}</div>
                    </div>
                    <div class="pata-card-actions">
                        <button class="pata-btn pata-btn-outline view-details-btn" data-id="${pet.id}">Ver detalles</button>
                        <button class="pata-btn pata-btn-primary" ${!isReady ? 'disabled' : ''}>
                            ${isReady ? 'Solicitar Apoyo' : (carnyText || 'Esperando')}
                        </button>
                    </div>
                </div>
            `;
        }

        createAddCardHtml() {
            return `
                <div class="pata-add-card" id="open-add-pet-btn">
                    <div class="pata-add-icon">＋</div>
                    <h3 style="font-size:20px; font-weight:800; margin-bottom:5px;">Sumar un peludo</h3>
                    <p style="font-size:13px; color:#666;">Puedes tener hasta 3 mascotas.<br>Te quedan ${CONFIG.maxPets - this.pets.length} lugares.</p>
                </div>
            `;
        }

        attachEvents() {
            this.container.querySelectorAll('.view-details-btn').forEach(btn => {
                btn.onclick = () => this.showDetails(btn.dataset.id);
            });

            const addBtn = document.getElementById('open-add-pet-btn');
            if (addBtn) addBtn.onclick = () => this.showAddForm();

            const modal = document.getElementById('pata-global-modal');
            modal.onclick = (e) => { if (e.target === modal) this.closeModal(); };
        }

        closeModal() { document.getElementById('pata-global-modal').style.display = 'none'; }

        showDetails(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;

            const modal = document.getElementById('pata-global-modal');
            const body = document.getElementById('pata-modal-body');

            body.innerHTML = `
                <button class="pata-modal-close">&times;</button>
                <div style="display:flex; gap:30px; flex-wrap:wrap;">
                    <img src="${pet.photo_url}" style="width:250px; height:350px; object-fit:cover; border-radius:20px;">
                    <div style="flex:1; min-width:300px;">
                        <h2 style="font-size:40px; margin:0 0 20px 0; font-weight:800;">${pet.name}</h2>
                        <ul style="list-style:none; padding:0; margin-bottom:20px; font-size:18px;">
                            <li style="margin-bottom:10px;"><strong>Raza:</strong> ${pet.breed}</li>
                            <li style="margin-bottom:10px;"><strong>Talla:</strong> ${pet.breed_size}</li>
                            <li style="margin-bottom:10px;"><strong>Estatus:</strong> ${pet.status.toUpperCase()}</li>
                        </ul>
                        ${pet.admin_notes ? `<div style="background:#FFFDEE; padding:15px; border-radius:15px; border-left:4px solid #9FD406;"><strong>Nota Administrador:</strong> <br>${pet.admin_notes}</div>` : ''}
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
                <h2 style="text-align:center; font-weight:800; font-size:32px; margin-bottom:30px;">Nuevo peludo 🐾</h2>
                <form id="pata-add-pet-form" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <input type="text" name="name" placeholder="Nombre" style="padding:12px; border-radius:10px; border:1px solid #ddd;" required>
                    <select name="petType" style="padding:12px; border-radius:10px; border:1px solid #ddd;" required>
                        <option value="PERRO">Perro</option>
                        <option value="GATO">Gato</option>
                    </select>
                    <input type="text" name="breed" placeholder="Raza" style="padding:12px; border-radius:10px; border:1px solid #ddd;" required>
                    <select name="breedSize" style="padding:12px; border-radius:10px; border:1px solid #ddd;" required>
                        <option value="CHICA">Chica</option>
                        <option value="MEDIANA">Mediana</option>
                        <option value="GRANDE">Grande</option>
                    </select>
                    <div style="grid-column: 1 / -1;">
                        <label style="display:block; margin-bottom:5px; font-weight:800;">Foto Principal:</label>
                        <input type="file" id="pata-photo-input" accept="image/*" required>
                    </div>
                    <button type="submit" class="pata-btn pata-btn-primary" style="grid-column: 1 / -1; height:50px;" id="pata-submit-btn">Dar de alta 🐾</button>
                </form>
            `;

            modal.style.display = 'flex';
            body.querySelector('.pata-modal-close').onclick = () => this.closeModal();

            const form = document.getElementById('pata-add-pet-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('pata-submit-btn');
                const fileInput = document.getElementById('pata-photo-input');

                if (this.isSubmitting) return;
                this.isSubmitting = true;
                submitBtn.innerText = 'Guardando...';

                try {
                    const uploadData = new FormData();
                    uploadData.append('file', fileInput.files[0]);
                    uploadData.append('userId', this.member.id);

                    const uploadRes = await fetch(`${CONFIG.apiUrl}/api/user/upload-pet-photo`, { method: 'POST', body: uploadData });
                    const uploadResult = await uploadRes.json();

                    const addRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            memberstackId: this.member.id,
                            petData: {
                                name: form.name.value,
                                petType: form.petType.value,
                                breed: form.breed.value,
                                breedSize: form.breedSize.value,
                                photo1Url: uploadResult.url
                            }
                        })
                    });

                    alert('Mascota registrada! 🐾');
                    this.closeModal();
                    await this.loadData();
                    this.render();
                } catch (err) {
                    alert('Error: ' + err.message);
                } finally {
                    this.isSubmitting = false;
                    submitBtn.innerText = 'Dar de alta 🐾';
                }
            };
        }
    }

    window.ManadaWidget = new ManadaWidget('pata-amiga-manada-widget');
})();
