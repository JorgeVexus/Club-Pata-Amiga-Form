/**
 * ⚖️ Club Pata Amiga - Appeal & Update Widget for Webflow (REFACCIONADO)
 * 
 * Este script maneja el proceso de apelaciones y actualización de documentos.
 * Se activa ÚNICAMENTE cuando el usuario lo necesita (Rechazado o Acción Requerida).
 */

(function () {
    'use strict';

    const DEFAULT_CONFIG = {
        apiUrl: 'https://www.pataamiga.mx'
    };

    const CONFIG = {};
    const customConfig = window.PATA_AMIGA_CONFIG || {};
    Object.keys(DEFAULT_CONFIG).forEach(key => {
        CONFIG[key] = customConfig[key] !== undefined ? customConfig[key] : DEFAULT_CONFIG[key];
    });

    const STYLES = `
        .pata-appeal-container {
            font-family: 'Outfit', -apple-system, sans-serif;
            background: #fff;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            max-width: 600px;
            margin: 20px auto;
            border: 1px solid #f0f0f0;
            display: none; /* Oculto por defecto */
        }

        .pata-appeal-container.show {
            display: block;
            animation: fadeInPata 0.3s ease-out;
        }

        @keyframes fadeInPata {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .pata-appeal-header {
            text-align: center;
            margin-bottom: 25px;
        }

        .pata-appeal-header h2 {
            font-size: 1.5rem;
            color: #002346;
            margin-bottom: 10px;
            margin-top: 0;
        }

        .pata-status-banner {
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 600;
        }

        .status-rejected { background: #FFF0F0; color: #D32F2F; border: 1px solid #FFCDD2; }
        .status-appealed { background: #FFF8E1; color: #F57F17; border: 1px solid #FFECB3; }
        .status-action { background: #E3F2FD; color: #1976D2; border: 1px solid #BBDEFB; }

        .pata-form-group {
            margin-bottom: 20px;
        }

        .pata-form-group label {
            display: block;
            font-size: 0.9rem;
            font-weight: 700;
            color: #555;
            margin-bottom: 8px;
        }

        .pata-textarea {
            width: 100%;
            height: 120px;
            padding: 15px;
            border: 2px solid #eee;
            border-radius: 12px;
            font-family: inherit;
            resize: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }

        .pata-textarea:focus {
            border-color: #00BBB4;
            outline: none;
        }

        .pata-btn {
            width: 100%;
            padding: 15px;
            background: #00BBB4;
            color: white;
            border: none;
            border-radius: 50px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
        }

        .pata-btn:hover {
            background: #00a5a0;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,187,180,0.3);
        }

        .pata-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        .pet-status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #f5f5f5;
        }

        .pet-name-chip {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        }

        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .dot-pending { background: #FFC107; }
        .dot-approved { background: #4CAF50; }
        .dot-rejected { background: #F44336; }
        .dot-action_required { background: #2196F3; }

        .pata-loading-spinner {
            text-align: center;
            padding: 20px;
            color: #999;
            font-size: 0.9rem;
        }
    `;

    function injectStyles() {
        if (document.getElementById('pata-appeal-styles')) return;
        const style = document.createElement('style');
        style.id = 'pata-appeal-styles';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }

    class AppealWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
            this.loading = true;

            if (!this.container) {
                console.warn('⚠️ Widget de Apelaciones: No se encontró el contenedor #' + containerId);
                return;
            }

            console.log('🚀 Widget de Apelaciones: Inicializando...');
            this.init();
        }

        async init() {
            injectStyles();

            await this.waitForMemberstack();
            if (!this.member) {
                console.log('ℹ️ Widget de Apelaciones: No hay sesión activa de Memberstack.');
                return;
            }

            // Solo cargamos datos y mostramos si el estado es relevante para apelaciones
            const status = this.member.customFields['approval-status'] || 'pending';
            const relevantStatuses = ['rejected', 'appealed', 'action_required'];

            if (!relevantStatuses.includes(status)) {
                console.log('ℹ️ Widget de Apelaciones: Estado "' + status + '" no requiere módulo de apelación.');
                return;
            }

            this.container.classList.add('show');
            this.renderLoading();

            await this.loadPets();
            this.render();
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
                        }).catch(err => {
                            console.error('❌ Memberstack Error:', err);
                            resolve();
                        });
                    } else if (attempts > 50) { // 5 segundos
                        clearInterval(check);
                        console.warn('⚠️ Memberstack no se detectó a tiempo.');
                        resolve();
                    }
                }, 100);
            });
        }

        async loadPets() {
            try {
                const petsRes = await fetch(`${CONFIG.apiUrl}/api/user/pets?userId=${this.member.id}`);
                const petsData = await petsRes.json();
                if (petsData.success) {
                    this.pets = petsData.pets;
                }
            } catch (err) {
                console.error('❌ Error cargando mascotas:', err);
            } finally {
                this.loading = false;
            }
        }

        renderLoading() {
            this.container.innerHTML = `<div class="pata-loading-spinner">✨ Cargando módulo de apelación...</div>`;
        }

        render() {
            const status = this.member.customFields['approval-status'] || 'pending';

            let content = '';

            if (status === 'appealed') {
                content = this.renderAppealedState();
            } else if (status === 'rejected') {
                content = this.renderAppealForm();
            } else if (status === 'action_required') {
                content = this.renderActionRequiredState();
            }

            this.container.innerHTML = `
                <div class="pata-appeal-header">
                    <h2>Módulo de Apelación</h2>
                    <p>Gestiona tu solicitud dudosas o correcciones.</p>
                </div>
                ${content}
                ${this.renderPetsTable()}
            `;

            this.attachEvents();
        }

        renderAppealedState() {
            return `
                <div class="pata-status-banner status-appealed">
                    <span>⚖️</span>
                    <div>
                        <strong>Apelación en revisión</strong>
                        <p style="margin: 5px 0 0 0; font-size: 0.85rem; font-weight: 400; color: inherit;">
                            Nuestro equipo legal está revisando tu caso. Te notificaremos pronto.
                        </p>
                    </div>
                </div>
            `;
        }

        renderAppealForm() {
            return `
                <div class="pata-status-banner status-rejected">
                    <span>❌</span>
                    <div>
                        <strong>Solicitud Rechazada</strong>
                        <p style="margin: 5px 0 0 0; font-size: 0.85rem; font-weight: 400; color: inherit;">
                            Puedes enviar una apelación para que reconsideremos tu caso.
                        </p>
                    </div>
                </div>
                <div class="pata-form-group">
                    <label>Describe por qué deberíamos reconsiderar tu solicitud:</label>
                    <textarea id="pata-appeal-msg" class="pata-textarea" placeholder="Escribe tu mensaje de apelación aquí..."></textarea>
                </div>
                <button id="pata-submit-appeal" class="pata-btn">Enviar Apelación</button>
            `;
        }

        renderActionRequiredState() {
            return `
                <div class="pata-status-banner status-action">
                    <span>🛠️</span>
                    <div>
                        <strong>Acción Requerida</strong>
                        <p style="margin: 5px 0 0 0; font-size: 0.85rem; font-weight: 400; color: inherit;">
                            Por favor revisa el estado de tus mascotas abajo y corrige lo solicitado.
                        </p>
                    </div>
                </div>
            `;
        }

        renderPetsTable() {
            // Filtrar solo mascotas con problemas o mostrar todas si hay rechazo?
            // Mejor mostrar todas para que el usuario sepa cuáles están bien y cuáles mal.
            if (this.pets.length === 0) return '';

            return `
                <div style="margin-top: 30px;">
                    <h3 style="font-size: 1rem; color: #002346; margin-bottom: 15px;">Estado de tus Mascotas</h3>
                    ${this.pets.map(pet => `
                        <div class="pet-status-row" style="background: ${pet.status === 'action_required' ? '#f0f7ff' : 'transparent'}">
                            <div class="pet-name-chip">
                                <span class="status-dot dot-${pet.status}"></span>
                                ${pet.name}
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 600; color: #666; text-transform: uppercase;">
                                ${pet.status === 'action_required' ? 'Info Faltante' :
                    pet.status === 'approved' ? 'Aprobada' :
                        pet.status === 'rejected' ? 'Rechazada' : 'En Revisión'}
                            </span>
                        </div>
                        ${pet.admin_notes ? `
                            <div style="padding: 10px 12px 15px 32px; font-size: 0.85rem; color: #d32f2f; font-style: italic;">
                                <strong>Nota Admin:</strong> ${pet.admin_notes}
                            </div>
                        ` : ''}
                    `).join('')}
                </div>
            `;
        }

        attachEvents() {
            const btn = document.getElementById('pata-submit-appeal');
            if (btn) {
                btn.addEventListener('click', async () => {
                    const msg = document.getElementById('pata-appeal-msg').value;
                    if (!msg || msg.trim().length < 10) {
                        alert('Por favor describe tu situación (mínimo 10 caracteres).');
                        return;
                    }

                    btn.disabled = true;
                    btn.innerText = 'Enviando...';

                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                memberId: this.member.id,
                                appealMessage: msg
                            })
                        });
                        const data = await res.json();
                        if (data.success) {
                            alert('Apelación enviada con éxito.');
                            location.reload();
                        } else {
                            alert('Error: ' + data.error);
                            btn.disabled = false;
                            btn.innerText = 'Enviar Apelación';
                        }
                    } catch (err) {
                        alert('Error de conexión con el servidor.');
                        btn.disabled = false;
                        btn.innerText = 'Enviar Apelación';
                    }
                });
            }
        }
    }

    // Inicialización segura
    function startWidget() {
        new AppealWidget('pata-amiga-appeal-widget');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWidget);
    } else {
        startWidget();
    }

})();
