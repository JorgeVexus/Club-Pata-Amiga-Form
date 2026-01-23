/**
 * 🐾 Club Pata Amiga - Pet Cards Widget (Simplified - Cards Only)
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://club-pata-amiga-form.vercel.app',
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
            const imageUrl = pet.photo_url || this.msFields[`pet-${idx}-photo-1-url`] || CONFIG.placeholderDog;

            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="pata-modal-box">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <div style="display:flex; gap:25px; flex-wrap:wrap;">
                        <img src="${imageUrl}" style="width:180px; height:240px; object-fit:cover; border-radius:18px;">
                        <div style="flex:1; min-width:200px;">
                            <h2 style="font-size:32px; margin:0 0 15px 0; font-weight:800;">${pet.name}</h2>
                            <p style="margin:5px 0;"><strong>Raza:</strong> ${pet.breed}</p>
                            <p style="margin:5px 0;"><strong>Talla:</strong> ${pet.breed_size}</p>
                            <p style="margin:5px 0;"><strong>Alta:</strong> ${new Date(pet.created_at).toLocaleDateString()}</p>
                            ${pet.admin_notes ? `<div style="background:#FFFDE7; padding:12px; border-radius:10px; margin-top:15px; border-left:4px solid #FFC107;"><strong>Nota:</strong> ${pet.admin_notes}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        showAddForm() {
            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.innerHTML = `
                <div class="pata-modal-box">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h2 style="text-align:center; font-weight:800; font-size:28px; margin:0 0 25px 0;">Nuevo integrante 🐾</h2>
                    <form id="pata-add-form" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <input type="text" name="name" placeholder="Nombre" required style="padding:14px; border-radius:10px; border:1px solid #ddd;">
                        <select name="petType" required style="padding:14px; border-radius:10px; border:1px solid #ddd;">
                            <option value="PERRO">Perro</option>
                            <option value="GATO">Gato</option>
                        </select>
                        <input type="text" name="breed" placeholder="Raza" required style="padding:14px; border-radius:10px; border:1px solid #ddd;">
                        <select name="breedSize" required style="padding:14px; border-radius:10px; border:1px solid #ddd;">
                            <option value="CHICA">Chica</option>
                            <option value="MEDIANA" selected>Mediana</option>
                            <option value="GRANDE">Grande</option>
                        </select>
                        <div style="grid-column: 1 / -1; background:#fafafa; padding:15px; border-radius:10px; border:1px dashed #ccc; text-align:center;">
                            <label style="font-weight:700; color:#666;">📸 Foto del peludo:</label><br>
                            <input type="file" id="pata-file" accept="image/*" required style="margin-top:8px;">
                        </div>
                        <button type="submit" class="pata-btn pata-btn-primary" style="grid-column: 1 / -1; height:55px; font-size:16px;" id="pata-save-btn">Dar de alta</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            const form = document.getElementById('pata-add-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.getElementById('pata-save-btn');
                const file = document.getElementById('pata-file').files[0];
                btn.innerText = 'Guardando...';
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

                    alert('¡Mascota registrada! 🐾');
                    modal.remove();
                    this.init();
                } catch (err) { alert('Error al guardar.'); btn.disabled = false; btn.innerText = 'Dar de alta'; }
            };
        }

        showAppealForm(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;

            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="pata-modal-box">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h2 style="text-align:center; font-weight:800; font-size:26px; margin:0 0 15px 0;">⚖️ Apelar para ${pet.name}</h2>
                    ${pet.admin_notes ? `<div style="background:#FFEBEE; padding:12px; border-radius:10px; margin-bottom:20px; border-left:4px solid #C62828;"><strong>Motivo del rechazo:</strong><br>${pet.admin_notes}</div>` : ''}
                    <form id="pata-appeal-form">
                        <p style="margin-bottom:10px; color:#666;">Explica por qué crees que la decisión debería reconsiderarse. Puedes mencionar si ya corregiste el problema o si hay información adicional que no fue considerada.</p>
                        <textarea id="pata-appeal-msg" required placeholder="Escribe tu mensaje de apelación aquí..." style="width:100%; height:120px; padding:15px; border-radius:10px; border:1px solid #ddd; resize:none; font-family:inherit; font-size:14px;"></textarea>
                        <p style="font-size:12px; color:#999; margin:10px 0;">Intentos de apelación: ${pet.appeal_count || 0}/2</p>
                        <button type="submit" class="pata-btn pata-btn-primary" style="width:100%; height:55px; font-size:16px; margin-top:10px; background:#7B1FA2; color:#fff;" id="pata-appeal-btn">Enviar Apelación</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

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

                    if (data.success) {
                        alert(data.message || '¡Apelación enviada! El equipo la revisará pronto.');
                        modal.remove();
                        this.init(); // Recargar para mostrar nuevo estado
                    } else {
                        alert('Error: ' + (data.error || 'No se pudo enviar la apelación.'));
                        btn.disabled = false;
                        btn.innerText = 'Enviar Apelación';
                    }
                } catch (err) {
                    alert('Error de conexión. Intenta de nuevo.');
                    btn.disabled = false;
                    btn.innerText = 'Enviar Apelación';
                }
            };
        }
    }

    if (!window.ManadaWidget) {
        window.ManadaWidget = new ManadaWidget('pata-amiga-manada-widget');
    }
})();
