/**
 * 🐾 Club Pata Amiga — Solidarity Request Detail Widget
 * Dedicated interaction page for support requests.
 */

class SolidarityRequestDetail {
    constructor(containerId, options = {}) {
        this.containerId = containerId || 'pata-solidarity-detail';
        this.container = document.getElementById(this.containerId);
        
        // Environment Config
        this.apiUrl = options.apiUrl || window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx';
        this.baseUrl = options.baseUrl || 'https://app.pataamiga.mx';
        
        // Get ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.requestId = urlParams.get('id');
        
        this.state = {
            loading: true,
            error: null,
            request: null,
            pet: null,
            messages: [],
            member: null,
            newMessage: '',
            sending: false,
            files: { attachment: null },
            previews: { attachment: null }
        };

        if (!this.container) {
            console.error('❌ SolidarityRequestDetail: Container not found:', this.containerId);
            return;
        }

        if (!this.requestId) {
            this.renderError('ID de solicitud no encontrado en la URL.');
            return;
        }

        this.init();
    }

    async init() {
        this.renderLoading();
        try {
            await this.loadDependencies();
            await this.fetchData();
            this.render();
            this.attachEventListeners();
            this.scrollToBottom();
        } catch (error) {
            console.error('❌ Init Error:', error);
            this.renderError(error.message);
        }
    }

    async loadDependencies() {
        if (!window.$memberstackDom) {
            await this.loadScript('https://static.memberstack.com/scripts/v1/memberstack.js');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async fetchData() {
        const memberstack = window.$memberstackDom;
        const { data: member } = await memberstack.getCurrentMember();
        
        if (!member) {
            throw new Error('Debes iniciar sesión para ver esta solicitud.');
        }
        this.state.member = member;

        // Fetch Request + Messages
        // We use a specific endpoint that returns request + pet + messages in one go if possible
        // For now, let's fetch sequentially or from existing history if we had it, 
        // but it's better to fetch fresh.
        
        const [requestRes, messagesRes] = await Promise.all([
            fetch(`${this.apiUrl}/api/solidarity/requests/${this.requestId}?memberstackId=${member.id}`).then(r => r.json()),
            fetch(`${this.apiUrl}/api/solidarity/requests/${this.requestId}/messages?memberstackId=${member.id}`).then(r => r.json())
        ]);

        if (requestRes.error) throw new Error(requestRes.error);
        
        this.state.request = requestRes.request;
        this.state.pet = requestRes.pet;
        this.state.messages = Array.isArray(messagesRes) ? messagesRes : [];
        this.state.loading = false;
    }

    attachEventListeners() {
        if (this.state.loading || this.state.error) return;

        // Message input
        const textarea = this.container.querySelector('#pata-msg-input');
        if (textarea) {
            textarea.addEventListener('input', (e) => {
                this.state.newMessage = e.target.value;
                this.updateSubmitBtn();
            });
        }

        // Send button
        const sendBtn = this.container.querySelector('#pata-send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        // File box trigger
        const fileBox = this.container.querySelector('.pata-msg-file-trigger');
        if (fileBox) {
            fileBox.addEventListener('click', () => {
                this.container.querySelector('#pata-msg-file').click();
            });
        }

        // File input change
        const fileInput = this.container.querySelector('#pata-msg-file');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileChange(e));
        }
    }

    handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.state.files.attachment = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.previews.attachment = e.target.result;
            this.render();
            this.attachEventListeners();
        };
        reader.readAsDataURL(file);
    }

    updateSubmitBtn() {
        const btn = this.container.querySelector('#pata-send-btn');
        if (btn) {
            btn.disabled = !this.state.newMessage.trim() && !this.state.files.attachment;
        }
    }

    async handleSendMessage() {
        if (this.state.sending) return;
        this.state.sending = true;
        this.render();

        try {
            let attachments = [];
            
            // Upload file if exists
            if (this.state.files.attachment) {
                const formData = new FormData();
                formData.append('file', this.state.files.attachment);
                formData.append('userId', this.state.member.id);
                formData.append('docType', 'chat_attachment');

                const uploadRes = await fetch(`${this.apiUrl}/api/upload/solidarity-document`, {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    attachments.push({
                        name: uploadData.fileName,
                        url: uploadData.path,
                        type: uploadData.mimeType
                    });
                }
            }

            const payload = {
                message: this.state.newMessage,
                senderRole: 'user',
                senderId: this.state.member.id,
                attachments
            };

            const response = await fetch(`${this.apiUrl}/api/solidarity/requests/${this.requestId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Reset state
            this.state.messages.push(data);
            this.state.newMessage = '';
            this.state.files.attachment = null;
            this.state.previews.attachment = null;
            this.state.sending = false;
            
            this.render();
            this.attachEventListeners();
            this.scrollToBottom();

        } catch (error) {
            console.error('❌ Error sending message:', error);
            alert('No se pudo enviar el mensaje: ' + error.message);
            this.state.sending = false;
            this.render();
        }
    }

    scrollToBottom() {
        const chatContainer = this.container.querySelector('#pata-chat-history');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    getStatusUI(status) {
        const map = {
            new: { label: 'Enviada', color: '#9b9b9b', icon: '📩' },
            in_review: { label: 'En Revisión', color: '#FE8F15', icon: '⏳' },
            needs_info: { label: 'Acción Requerida', color: '#FF0066', icon: '⚠️' },
            approved: { label: 'Aprobada', color: '#10B981', icon: '✅' },
            rejected: { label: 'Rechazada', color: '#ff0063', icon: '❌' },
            completed: { label: 'Completada', color: '#00BBB4', icon: '✨' }
        };
        return map[status] || map.new;
    }

    render() {
        if (this.state.loading) return;
        
        const req = this.state.request;
        const pet = this.state.pet;
        const statusUI = this.getStatusUI(req.status);

        this.container.innerHTML = `
            <style>
                .pata-detail-wrapper {
                    font-family: 'Outfit', sans-serif;
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 40px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                    border: 2px solid #000;
                    display: grid;
                    grid-template-columns: 1fr;
                }

                .pata-detail-header {
                    background: var(--pata-turquoise, #00BBB4);
                    padding: 40px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #000;
                }

                .pata-detail-back {
                    color: white;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 700;
                    margin-bottom: 15px;
                }

                .pata-detail-title {
                    font-family: 'Fraiche', sans-serif;
                    font-size: 32px;
                    margin: 0;
                    text-transform: uppercase;
                }

                .pata-status-tag {
                    padding: 8px 16px;
                    border-radius: 50px;
                    background: white;
                    color: black;
                    font-weight: 800;
                    font-family: 'Fraiche', sans-serif;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 2px solid #000;
                }

                .pata-detail-body {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    min-height: 600px;
                }

                @media (max-width: 768px) {
                    .pata-detail-body { grid-template-columns: 1fr; }
                    .pata-detail-header { flex-direction: column; align-items: flex-start; gap: 20px; }
                }

                /* Sidebar Info */
                .pata-detail-sidebar {
                    padding: 30px;
                    background: #f8fbfb;
                    border-right: 2px solid #000;
                }

                .pata-pet-mini-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 30px;
                }

                .pata-pet-mini-photo {
                    width: 60px;
                    height: 60px;
                    border-radius: 15px;
                    object-fit: cover;
                    border: 2px solid #000;
                }

                .pata-info-item {
                    margin-bottom: 20px;
                }

                .pata-info-label {
                    font-size: 12px;
                    color: #718096;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }

                .pata-info-value {
                    font-weight: 600;
                    font-size: 16px;
                }

                /* Chat Area */
                .pata-chat-container {
                    display: flex;
                    flex-direction: column;
                    background: white;
                }

                .pata-chat-history {
                    flex: 1;
                    padding: 30px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    max-height: 500px;
                }

                .pata-chat-bubble {
                    max-width: 80%;
                    padding: 15px 20px;
                    border-radius: 25px;
                    font-size: 15px;
                    line-height: 1.5;
                    position: relative;
                    border: 2px solid #000;
                }

                .pata-chat-bubble.admin {
                    align-self: flex-start;
                    background: #F3F4F6;
                    border-bottom-left-radius: 4px;
                }

                .pata-chat-bubble.user {
                    align-self: flex-end;
                    background: var(--pata-turquoise);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .pata-chat-meta {
                    font-size: 10px;
                    margin-top: 8px;
                    opacity: 0.7;
                    display: block;
                }

                .pata-chat-attachment {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 10px;
                    padding: 8px;
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                    text-decoration: none;
                    color: inherit;
                    font-size: 13px;
                }

                .pata-chat-input-area {
                    padding: 20px 30px;
                    border-top: 2px solid #000;
                    background: #fff;
                }

                .pata-chat-input-box {
                    display: flex;
                    gap: 15px;
                    align-items: flex-end;
                }

                .pata-chat-textarea {
                    flex: 1;
                    border: 2px solid #000;
                    border-radius: 20px;
                    padding: 12px 18px;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    min-height: 50px;
                    max-height: 150px;
                }

                .pata-btn-icon {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: var(--pata-turquoise);
                    border: 2px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    box-shadow: 2px 2px 0px #000;
                }

                .pata-btn-icon:disabled { background: #ccc; cursor: not-allowed; box-shadow: none; }

                .pata-file-preview-mini {
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #F3F4F6;
                    padding: 8px 15px;
                    border-radius: 50px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid #000;
                }

                .pata-action-box {
                    background: #FFF5F7;
                    border: 2px solid var(--pata-red);
                    padding: 20px;
                    border-radius: 20px;
                    margin-bottom: 20px;
                }

                .pata-action-box h4 { margin: 0 0 10px 0; color: var(--pata-red); font-weight: 800; }
                .pata-action-box p { margin: 0; font-size: 14px; color: #4A5568; }
            </style>

            <div class="pata-detail-wrapper">
                <header class="pata-detail-header">
                    <div>
                        <a href="/miembros/fondo-solidario" class="pata-detail-back">
                            <img src="${this.baseUrl}/Icons/back-white.svg" style="width: 20px">
                            Volver al dashboard
                        </a>
                        <h1 class="pata-detail-title">${req.case_title || 'Detalle de Solicitud'}</h1>
                    </div>
                    <div class="pata-status-tag">
                        <span>${statusUI.icon}</span>
                        ${statusUI.label}
                    </div>
                </header>

                <div class="pata-detail-body">
                    <aside class="pata-detail-sidebar">
                        <div class="pata-pet-mini-card">
                            <img src="${pet.primary_photo_url || pet.photo_url || ''}" class="pata-pet-mini-photo" onerror="this.src='https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png'">
                            <div>
                                <div class="pata-info-value">${pet.name}</div>
                                <div class="pata-info-label">${pet.breed || 'Mestizo'}</div>
                            </div>
                        </div>

                        <div class="pata-info-item">
                            <div class="pata-info-label">Tipo de Apoyo</div>
                            <div class="pata-info-value">${req.benefit_type === 'medical_emergency' ? '🏥 Emergencia Médica' : req.benefit_type === 'annual_vaccination' ? '💉 Vacunación' : '🕊️ Fallecimiento'}</div>
                        </div>

                        <div class="pata-info-item">
                            <div class="pata-info-label">Monto Solicitado</div>
                            <div class="pata-info-value">$${req.requested_amount}</div>
                        </div>

                        <div class="pata-info-item">
                            <div class="pata-info-label">Fecha de Solicitud</div>
                            <div class="pata-info-value">${new Date(req.created_at).toLocaleDateString()}</div>
                        </div>
                        
                        ${req.clinic_name ? `
                            <div class="pata-info-item">
                                <div class="pata-info-label">Clínica</div>
                                <div class="pata-info-value">${req.clinic_name}</div>
                            </div>
                        ` : ''}
                    </aside>

                    <div class="pata-chat-container">
                        <div class="pata-chat-history" id="pata-chat-history">
                            <!-- Mensaje Original -->
                            <div class="pata-chat-bubble admin">
                                <strong>Pata Amiga:</strong><br>
                                Hola ${this.state.member.first_name}, hemos recibido tu solicitud. Un integrante de nuestro comité la revisará pronto.
                                <span class="pata-chat-meta">${new Date(req.created_at).toLocaleTimeString()}</span>
                            </div>

                            ${this.state.messages.map(m => `
                                <div class="pata-chat-bubble ${m.sender_role}">
                                    ${m.message}
                                    ${m.attachments && m.attachments.length > 0 ? m.attachments.map(a => `
                                        <a href="${a.url}" target="_blank" class="pata-chat-attachment">
                                            <span>📄</span> ${a.name}
                                        </a>
                                    `).join('') : ''}
                                    <span class="pata-chat-meta">${new Date(m.created_at).toLocaleTimeString()}</span>
                                </div>
                            `).join('')}
                        </div>

                        ${req.status === 'needs_info' ? `
                            <div class="pata-action-box" style="margin: 0 30px 10px 30px;">
                                <h4>⚠️ Acción Requerida</h4>
                                <p>Por favor, revisa los mensajes anteriores y adjunta la información solicitada para continuar.</p>
                            </div>
                        ` : ''}

                        <div class="pata-chat-input-area">
                            ${this.state.previews.attachment ? `
                                <div class="pata-file-preview-mini">
                                    <span>📄</span> ${this.state.files.attachment.name}
                                    <button onclick="window.PataSolidarityDetail.clearFile()" style="border:none; background:none; cursor:pointer; font-size:16px;">✕</button>
                                </div>
                            ` : ''}
                            <div class="pata-chat-input-box">
                                <button class="pata-btn-icon pata-msg-file-trigger" title="Adjuntar archivo">
                                    <img src="${this.baseUrl}/Icons/upload.svg" style="width: 20px; filter: invert(1);">
                                </button>
                                <textarea id="pata-msg-input" class="pata-chat-textarea" placeholder="Escribe un mensaje o sube un archivo...">${this.state.newMessage}</textarea>
                                <button id="pata-send-btn" class="pata-btn-icon" ${!this.state.newMessage.trim() && !this.state.files.attachment ? 'disabled' : ''}>
                                    ${this.state.sending ? '...' : '➤'}
                                </button>
                                <input type="file" id="pata-msg-file" hidden accept="image/*,application/pdf">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    clearFile() {
        this.state.files.attachment = null;
        this.state.previews.attachment = null;
        this.render();
        this.attachEventListeners();
    }

    renderLoading() {
        this.container.innerHTML = `<div style="padding: 100px; text-align: center;"><p>Cargando detalle de solicitud...</p></div>`;
    }

    renderError(msg) {
        this.container.innerHTML = `<div style="padding: 100px; text-align: center; color: var(--pata-red);">❌ Error: ${msg}</div>`;
    }
}

window.SolidarityRequestDetail = SolidarityRequestDetail;

// Auto init
const autoInitDetail = () => {
    const container = document.getElementById('pata-solidarity-detail');
    if (container && !window.PataSolidarityDetail) {
        window.PataSolidarityDetail = new SolidarityRequestDetail('pata-solidarity-detail');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitDetail);
} else {
    autoInitDetail();
}
