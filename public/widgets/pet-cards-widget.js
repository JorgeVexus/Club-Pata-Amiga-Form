/**
 * 🐾 Club Pata Amiga - Smart Pet Cards Widget (Definitive Figma & Photos Fix)
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://club-pata-amiga-form.vercel.app',
        maxPets: 3,
        brushUrl: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6939f6880cc902377c8e9b67_Brush%20Stroke.svg',
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

        .pata-manada-section {
            padding: 100px 0;
            background-color: #FFFDEE;
            font-family: 'Outfit', sans-serif;
            position: relative;
            width: 100%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            min-height: 550px;
        }

        /* Full Width Brush Background - Corrected for Visibility */
        .pata-manada-bg-band {
            position: absolute;
            top: 50%;
            left: 0;
            width: 105%;
            height: 480px;
            transform: translateY(-50%) translateX(-2.5%);
            background-color: #9FD406;
            z-index: 1;
            /* Using a combination of background and clip-path/mask for better support */
            -webkit-mask-image: url('${CONFIG.brushUrl}');
            -webkit-mask-size: 100% 100%;
            -webkit-mask-repeat: no-repeat;
            mask-image: url('${CONFIG.brushUrl}');
            mask-size: 100% 100%;
            mask-repeat: no-repeat;
        }

        .pata-manada-container {
            max-width: 1200px;
            width: 100%;
            margin: 0 auto;
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 50px;
            padding: 0 50px;
        }

        .pata-manada-header {
            flex: 0 0 240px;
        }

        .pata-manada-title {
            font-size: 84px;
            font-weight: 900;
            color: #1A1A1A;
            line-height: 0.8;
            margin: 0;
            text-shadow: 2px 2px 0px rgba(255,255,255,0.2);
        }

        .pata-manada-grid {
            flex: 1;
            display: flex;
            gap: 24px;
            justify-content: flex-start;
            flex-wrap: wrap;
        }

        /* CARDS - Figma proportions */
        .pata-pet-card {
            background: #fff;
            border-radius: 20px;
            padding: 14px;
            width: 255px;
            height: 405px;
            box-shadow: 0 12px 30px rgba(0,0,0,0.07);
            display: flex;
            flex-direction: column;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid rgba(0,0,0,0.05);
        }
        .pata-pet-card:hover { transform: translateY(-10px); }

        .pata-card-photo-box {
            width: 100%;
            height: 240px;
            background: #00BBB4;
            border-radius: 16px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Ensure photo is visible */
        .pata-card-photo-box img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover;
            display: block; 
            z-index: 2;
        }

        .pata-status-badge {
            position: absolute;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 800;
            z-index: 10;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 5px;
            white-space: nowrap;
        }

        .pata-name-badge {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 8px 24px;
            border-radius: 40px;
            font-weight: 800;
            font-size: 19px;
            box-shadow: 0 8px 15px rgba(0,0,0,0.12);
            z-index: 10;
        }

        .pata-card-actions {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px 0 4px 0;
        }

        .pata-btn {
            padding: 13px;
            border-radius: 50px;
            border: none;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: 0.2s;
            text-align: center;
            width: 100%;
        }
        .pata-btn-primary { background: #9FD406; color: #1A1A1A; box-shadow: 0 4px 6px rgba(159, 212, 6, 0.2); }
        .pata-btn-outline { background: #fff; color: #1A1A1A; border: 2px solid #1A1A1A; }
        .pata-btn:disabled { background: #F8F8F8; color: #BBB; border: 2px solid #EEE; cursor: not-allowed; }

        /* ADD CARD */
        .pata-add-card {
            width: 255px;
            height: 405px;
            background: rgba(255,255,255,0.6);
            border: 2px dashed #AAA;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 25px;
            cursor: pointer;
            transition: 0.3s;
        }
        .pata-add-card:hover { border-color: #9FD406; background: #fff; transform: translateY(-5px); }

        /* MODAL (Dynamic) */
        .pata-modal-dynamic {
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.85); z-index: 100000; 
            display: flex; align-items: center; justify-content: center; padding: 20px;
            backdrop-filter: blur(5px);
        }
        .pata-modal-inner {
            background: #fff; border-radius: 30px; padding: 45px; 
            position: relative; max-width: 650px; width: 100%;
            box-shadow: 0 25px 60px rgba(0,0,0,0.4);
        }

        @media (max-width: 1000px) {
            .pata-manada-container { flex-direction: column; padding: 0 20px; }
            .pata-manada-header { text-align: center; margin-bottom: 40px; }
            .pata-manada-title { font-size: 60px; }
            .pata-manada-grid { justify-content: center; }
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
            this.container.innerHTML = `<div style="text-align:center; padding: 80px; color:#666; font-size:18px;">🐾 Preparando tu manada...</div>`;

            try {
                await this.waitForMemberstack();
                if (!this.member) {
                    this.container.innerHTML = '<div style="text-align:center; padding: 60px; color:#666;">Inicia sesión para ver tus beneficios 🐾</div>';
                    return;
                }
                await this.loadData();
                this.render();
            } catch (err) {
                console.error('Manada Init Error:', err);
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
                <section class="pata-manada-section">
                    <div class="pata-manada-bg-band"></div>
                    <div class="pata-manada-container">
                        <div class="pata-manada-header">
                            <h2 class="pata-manada-title">Mi\nmanada</h2>
                        </div>
                        <div class="pata-manada-grid">
                            ${petCards}
                            ${addCard}
                        </div>
                    </div>
                </section>
            `;
        }

        createPetCardHtml(pet, index) {
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;

            // Logic imported from Admin Dashboard for Reliability
            // 1. Check Supabase 'photo_url'
            // 2. Check Memberstack Fallback (pet-X-photo-1-url)
            const msPhotoUrl = this.msFields[`pet-${index}-photo-1-url`];
            const imageUrl = pet.photo_url || msPhotoUrl || CONFIG.placeholderDog;

            let carnyText = '';
            let isReady = pet.status === 'approved';

            if (pet.status === 'approved') {
                const regDate = new Date(pet.created_at);
                const diffDays = Math.ceil(Math.abs(new Date() - regDate) / (1000 * 60 * 60 * 24));
                const remaining = Math.max(0, 180 - diffDays);
                if (remaining > 0) { isReady = false; carnyText = `Carencia: ${remaining} d`; }
            }

            return `
                <div class="pata-pet-card">
                    <div class="pata-card-photo">
                        <div class="pata-status-badge" style="background:${status.bg}; color:${status.text}">
                            ${status.icon} ${status.label}
                        </div>
                        <img src="${imageUrl}" alt="${pet.name}" 
                             onload="this.style.opacity='1'"
                             onerror="this.src='${CONFIG.placeholderDog}'; this.style.opacity='0.6';">
                        <div class="pata-name-badge">${pet.name}</div>
                    </div>
                    <div class="pata-card-actions">
                        <button class="pata-btn pata-btn-outline" onclick="window.ManadaWidget.showDetails('${pet.id}')">Ver detalles</button>
                        <button class="pata-btn pata-btn-primary" ${!isReady ? 'disabled' : ''}>
                            ${isReady ? 'Solicitar Apoyo' : (carnyText || 'Verificando')}
                        </button>
                    </div>
                </div>
            `;
        }

        createAddCardHtml() {
            return `
                <div class="pata-add-card" onclick="window.ManadaWidget.showAddForm()">
                    <div style="font-size:35px; margin-bottom:15px; background:white; width:65px; height:65px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 5px 12px rgba(0,0,0,0.1); color:#9FD406; font-weight:800;">＋</div>
                    <h3 style="font-size:22px; font-weight:900; margin:0 0 8px 0; color:#1A1A1A;">Sumar un peludo</h3>
                    <p style="font-size:14px; color:#666; margin:0; line-height:1.4;">Registra hasta 3 mascotas.<br>Quedan ${CONFIG.maxPets - this.pets.length} lugares.</p>
                </div>
            `;
        }

        showDetails(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;

            // Same logic as card for detail photo
            const idx = this.pets.indexOf(pet) + 1;
            const imageUrl = pet.photo_url || this.msFields[`pet-${idx}-photo-1-url`] || CONFIG.placeholderDog;

            const modal = document.createElement('div');
            modal.className = 'pata-modal-dynamic';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="pata-modal-inner">
                    <button style="position:absolute; top:25px; right:25px; border:none; background:#F5F5F5; width:45px; height:45px; border-radius:50%; font-size:26px; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <div style="display:flex; gap:35px; flex-wrap:wrap;">
                        <img src="${imageUrl}" style="width:230px; height:320px; object-fit:cover; border-radius:24px; box-shadow:0 10px 25px rgba(0,0,0,0.15);">
                        <div style="flex:1; min-width:300px;">
                            <h2 style="font-size:42px; margin:0 0 10px 0; font-weight:900;">${pet.name}</h2>
                            <div style="margin-bottom:25px; font-size:19px; color:#444; line-height:1.6;">
                                <p style="margin:5px 0;"><strong>🐩 Raza:</strong> ${pet.breed}</p>
                                <p style="margin:5px 0;"><strong>📏 Talla:</strong> ${pet.breed_size}</p>
                                <p style="margin:5px 0;"><strong>📅 Alta:</strong> ${new Date(pet.created_at).toLocaleDateString()}</p>
                            </div>
                            ${pet.admin_notes ? `
                                <div style="background:#FFFDEE; padding:20px; border-radius:18px; border-left:5px solid #9FD406; font-size:15px;">
                                    <strong>🛡️ Nota del Administrador:</strong><br>
                                    <p style="margin:8px 0 0 0; color:#555;">${pet.admin_notes}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        showAddForm() {
            const modal = document.createElement('div');
            modal.className = 'pata-modal-dynamic';
            modal.innerHTML = `
                <div class="pata-modal-inner">
                    <button style="position:absolute; top:25px; right:25px; border:none; background:#F5F5F5; width:45px; height:45px; border-radius:50%; font-size:26px; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h2 style="text-align:center; font-weight:900; font-size:36px; margin:0 0 30px 0;">Nuevo integrante 🐾</h2>
                    <form id="pata-add-pet-form" style="display:grid; grid-template-columns: 1fr 1fr; gap:18px;">
                        <input type="text" name="name" placeholder="Nombre (Ej: Max)" required style="padding:15px; border-radius:12px; border:2px solid #EEE; font-family:inherit;">
                        <select name="petType" required style="padding:15px; border-radius:12px; border:2px solid #EEE; font-family:inherit;">
                            <option value="PERRO">Perro</option>
                            <option value="GATO">Gato</option>
                        </select>
                        <input type="text" name="breed" placeholder="Raza" required style="padding:15px; border-radius:12px; border:2px solid #EEE; font-family:inherit;">
                        <select name="breedSize" required style="padding:15px; border-radius:12px; border:2px solid #EEE; font-family:inherit;">
                            <option value="CHICA">Chica</option>
                            <option value="MEDIANA" selected>Mediana</option>
                            <option value="GRANDE">Grande</option>
                        </select>
                        <div style="grid-column: 1 / -1; background:#FAFAFA; padding:20px; border-radius:15px; border:2px dashed #DDD; text-align:center;">
                            <label style="display:block; margin-bottom:10px; font-weight:800; color:#666;">📸 Sube la foto más guapa:</label>
                            <input type="file" id="pata-f-input" accept="image/*" required style="font-size:14px;">
                        </div>
                        <button type="submit" class="pata-btn pata-btn-primary" style="grid-column: 1 / -1; height:60px; font-size:18px;" id="pata-save-btn">¡Dar de alta! 🐶</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            const form = document.getElementById('pata-add-pet-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.getElementById('pata-save-btn');
                const file = document.getElementById('pata-f-input').files[0];
                btn.innerText = 'Cargando peludo... ⏳';
                btn.disabled = true;

                try {
                    const upData = new FormData();
                    upData.append('file', file);
                    upData.append('userId', this.member.id);
                    const upRes = await fetch(`${CONFIG.apiUrl}/api/user/upload-pet-photo`, { method: 'POST', body: upData });
                    const upJson = await upRes.json();

                    await fetch(`${CONFIG.apiUrl}/api/user/pets/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            memberstackId: this.member.id,
                            petData: {
                                name: form.name.value,
                                petType: form.petType.value,
                                breed: form.breed.value,
                                breedSize: form.breedSize.value,
                                photo1Url: upJson.url
                            }
                        })
                    });

                    alert('¡Mascota registrada con éxito! 🐾');
                    modal.remove();
                    this.init();
                } catch (err) { alert('Híjole, algo falló al guardar. Intenta de nuevo.'); btn.disabled = false; btn.innerText = '¡Dar de alta! 🐶'; }
            };
        }
    }

    if (!window.ManadaWidget) {
        window.ManadaWidget = new ManadaWidget('pata-amiga-manada-widget');
    }
})();
