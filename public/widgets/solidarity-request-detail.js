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
        this.baseUrl = options.baseUrl || window.PATA_AMIGA_CONFIG?.baseUrl || 'https://app.pataamiga.mx';
        
        // Get ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.requestId = urlParams.get('id');
        
        this.useMock = options.useMock || (this.requestId === 'mock');

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

        window.PataSolidarityDetail = this;
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
            this.startPolling();
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
        if (this.useMock) {
            this.loadMockData();
            return;
        }

        const memberstack = window.$memberstackDom;
        const { data: member } = await memberstack.getCurrentMember();
        
        if (!member) {
            throw new Error('Debes iniciar sesión para ver esta solicitud.');
        }
        this.state.member = member;

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

    loadMockData() {
        this.state.member = { first_name: 'Jorge', last_name: 'Cerna', id: 'mock-user' };
        this.state.request = {
            id: 'mock-A345',
            request_number: 'A345',
            clinic_name: 'Clínica Salud Animal',
            created_at: '2025-06-20T10:00:00Z',
            status: 'new',
            benefit_type: 'medical_emergency',
            type: 'clinic',
            incident_date: '2025-06-18',
            case_title: 'Fractura de pata trasera',
            case_description: 'Spike tuvo un accidente mientras jugaba en el parque y presenta cojera en la pata trasera derecha. Se observa inflamación y no apoya la pata al caminar.',
            requested_amount: 3000,
            total_paid_amount: 4500,
            evidence: [
                { name: 'cartilla_vacunacion.pdf', url: '#', type: 'application/pdf', docType: 'prescription' },
                { name: 'spike_lastimado.jpg', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=300', type: 'image/jpeg', docType: 'evidence_photo' },
                { name: 'recibo_pago.jpg', url: '#', type: 'image/jpeg', docType: 'receipt' }
            ],
            history: [
                { status: 'new', created_at: '2025-06-20T10:00:00Z' }
            ]
        };
        this.state.pet = {
            name: 'Spike',
            breed: 'Mestizo',
            pet_type: 'dog',
            gender: 'macho',
            coat_color: 'Negro con blanco',
            registration_date: '2025-03-12',
            age: '1 año',
            primary_photo_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=300'
        };
        this.state.messages = [
            { sender_role: 'admin', message: 'Hola Jorge, hemos recibido tu solicitud. Un integrante de nuestro comité la revisará pronto.', created_at: '2025-06-20T10:05:00Z' }
        ];
        this.state.loading = false;
    }

    attachEventListeners() {
        if (this.state.loading || this.state.error) return;

        const textarea = this.container.querySelector('#pata-msg-input');
        if (textarea) {
            textarea.addEventListener('input', (e) => {
                this.state.newMessage = e.target.value;
                this.updateSubmitBtn();
            });
        }

        const sendBtn = this.container.querySelector('#pata-send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        const fileBox = this.container.querySelector('.pata-msg-file-trigger');
        if (fileBox) {
            fileBox.addEventListener('click', () => {
                this.container.querySelector('#pata-msg-file').click();
            });
        }

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
            if (this.useMock) {
                // Mock behavior
                const data = {
                    sender_role: 'user',
                    message: this.state.newMessage,
                    created_at: new Date().toISOString(),
                    attachments: []
                };
                this.state.messages.push(data);
                this.state.newMessage = '';
                this.state.files.attachment = null;
                this.state.previews.attachment = null;
                this.state.sending = false;
                this.render();
                this.attachEventListeners();
                this.scrollToBottom();
                return;
            }

            let attachments = [];
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

    getStatusConfig(status) {
        const configs = {
            new: {
                label: 'solicitud enviada',
                badge: 'solicitud enviada',
                icon: `${this.baseUrl}/Icons/enviada.png`,
                color: '#A3E635',
                msg: `Estamos revisando tu información con cariño y cuidado. \n\nEn un máximo de 24 horas te avisaremos por correo y WhatsApp en cuanto tengamos una respuesta.\n\nMientras tanto, puedes revisar el estatus en cualquier momento desde tu panel o en el centro de notificaciones.\n\nSi necesitas algo urgente, aquí seguimos contigo.`
            },
            in_review: {
                label: 'en revisión',
                badge: 'en revisión',
                icon: `${this.baseUrl}/Icons/confirmacion.svg`,
                color: '#FE8F15',
                msg: `Tu caso ya está siendo analizado por nuestro comité médico. \n\nEstamos validando los detalles para asegurarnos de brindarte el apoyo correcto. Te notificaremos en cuanto haya una actualización.\n\nGracias por tu paciencia, estamos trabajando para ti.`
            },
            approved: {
                label: 'solicitud aprobada',
                badge: 'aprobada',
                icon: `${this.baseUrl}/Icons/aprovada.png`,
                color: '#10B981',
                msg: `¡Tu solicitud ha sido aprobada! \n\nYa puedes acudir al centro aliado para la atención de tu mascota. Presenta tu identificación oficial y el folio de esta solicitud.\n\nEstamos felices de poder acompañarte en este proceso.`
            },
            rejected: {
                label: 'solicitud rechazada',
                badge: 'rechazada',
                icon: `${this.baseUrl}/Icons/rechazada.png`,
                color: '#FF0066',
                msg: `Lamentablemente, tu solicitud no cumple con todos los requisitos del fondo en esta ocasión.\n\nRevisa el historial de mensajes para conocer los detalles del rechazo. Si crees que hay un error, puedes iniciar un proceso de apelación.`
            },
            needs_info: {
                label: 'acción requerida',
                badge: 'necesita info',
                icon: `${this.baseUrl}/Icons/confirmacion.svg`,
                color: '#FF0066',
                msg: `Necesitamos un poco más de información para continuar con tu solicitud.\n\nPor favor, responde a los mensajes del administrador en la sección de historial y adjunta los documentos o aclaraciones solicitadas lo antes posible.`
            },
            paid: {
                label: 'reembolso pagado',
                badge: 'pagado',
                icon: `${this.baseUrl}/Icons/aprovada.png`,
                color: '#10B981',
                msg: `¡El pago ha sido realizado con éxito! \n\nEl monto solicitado ha sido transferido a tu cuenta. Deberías verlo reflejado en las próximas horas dependiendo de tu banco.\n\nGracias por confiar en Pata Amiga.`
            },
            completed: {
                label: 'proceso completado',
                badge: 'completado',
                icon: `${this.baseUrl}/Icons/aprovada.png`,
                color: '#00BBB4',
                msg: `Este proceso ha finalizado correctamente. \n\nEsperamos que tu mascota se encuentre mucho mejor. Recuerda que siempre puedes consultar el historial de este caso aquí mismo.`
            }
        };
        return configs[status] || configs.new;
    }

    getTypeConfig(type) {
        return type === 'clinic' 
            ? { label: 'solicitud en centro aliado', icon: `${this.baseUrl}/Icons/clinica.png` }
            : { label: 'reembolso', icon: `${this.baseUrl}/Icons/reembolso.svg` };
    }

    getBenefitConfig(benefit) {
        const map = {
            medical_emergency: { label: 'emergencia médica', icon: `${this.baseUrl}/Icons/emergencias.svg` },
            annual_vaccination: { label: 'vacunación anual', icon: `${this.baseUrl}/Icons/vacuna.svg` },
            death: { label: 'apoyo fallecimiento', icon: `${this.baseUrl}/Icons/fallecimiento.svg` }
        };
        return map[benefit] || map.medical_emergency;
    }

    render() {
        if (this.state.loading) return;
        
        const req = this.state.request;
        const pet = this.state.pet;
        const statusConfig = this.getStatusConfig(req.status);
        const typeConfig = this.getTypeConfig(req.type);
        const benefitConfig = this.getBenefitConfig(req.benefit_type);

        this.container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

                .pata-detail-container {
                    font-family: 'Outfit', sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    color: #1A1A1A;
                }

                /* Badges Top */
                .pata-top-badges {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }

                .pata-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    height: 34px;
                    padding: 0 14px 0 37px;
                    border-radius: 50px;
                    border: 2px solid #000;
                    font-family: 'Fraiche', sans-serif;
                    font-size: 14px;
                    position: relative;
                    background: white;
                    text-transform: uppercase;
                }

                .pata-badge-icon {
                    position: absolute;
                    left: -2px;
                    top: -2px;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    border: 2px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                }

                .pata-badge-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }

                /* Header Title */
                .pata-request-id {
                    font-family: 'Fraiche', sans-serif;
                    font-size: 32px;
                    margin: 0 0 40px 0;
                    text-transform: uppercase;
                }

                /* White Cards */
                .pata-card {
                    background: white;
                    border-radius: 40px;
                    border: 2px solid #000;
                    padding: 40px;
                    margin-bottom: 30px;
                    box-shadow: 6px 6px 0px rgba(0,0,0,1);
                }

                /* Card 1: Main Status */
                .pata-meta-info {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 25px;
                }

                .pata-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: rgba(155, 155, 155, 1);
                    font-size: 18px;
                    font-weight: 500;
                }

                .pata-meta-row img { width: 24px; }

                .pata-status-title {
                    font-family: 'Fraiche', sans-serif;
                    font-size: 35px;
                    margin: 15px 0;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .pata-status-title img { width: 40px; }

                .pata-status-msg {
                    color: rgba(155, 155, 155, 1);
                    font-size: 16px;
                    line-height: 1.6;
                    white-space: pre-line;
                }

                /* Card 2: Technical Details */
                .pata-section-title {
                    font-family: 'Fraiche', sans-serif;
                    font-size: 28px;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                }

                .pata-section-subtitle {
                    color: rgba(155, 155, 155, 1);
                    font-size: 14px;
                    margin-bottom: 30px;
                }

                .pata-details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }

                .pata-detail-item label {
                    display: block;
                    font-size: 14px;
                    color: rgba(155, 155, 155, 1);
                    margin-bottom: 10px;
                }

                .pata-detail-item .pata-badge { margin: 0; }

                .pata-incident-date {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: 'Fraiche', sans-serif;
                    font-size: 18px;
                }

                .pata-case-desc {
                    margin-top: 30px;
                }

                .pata-case-desc p {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #333;
                }

                .pata-evidence-gallery {
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                    overflow-x: auto;
                    padding-bottom: 10px;
                }

                .pata-evidence-card {
                    min-width: 150px;
                    height: 180px;
                    border-radius: 25px;
                    background: #FEFA15; /* Default yellow */
                    border: 2px solid #000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 15px;
                    text-align: center;
                    text-decoration: none;
                    color: black;
                }

                .pata-evidence-card img { width: 60px; height: 60px; margin-bottom: 15px; }
                .pata-evidence-card span { font-size: 10px; font-weight: 600; word-break: break-all; }

                /* Card 3: Pet Info */
                .pata-pet-card-content {
                    display: flex;
                    gap: 30px;
                    align-items: center;
                }

                .pata-pet-photo-wrapper {
                    flex-shrink: 0;
                }

                .pata-pet-big-photo {
                    width: 200px;
                    height: 200px;
                    border-radius: 40px;
                    border: 2px solid #000;
                    background-size: cover;
                    background-position: center;
                    background-color: #00BBB4;
                }

                .pata-pet-details-right { flex: 1; }
                .pata-pet-details-right h3 {
                    font-family: 'Fraiche', sans-serif;
                    font-size: 40px;
                    color: #FF0066;
                    margin: 0 0 20px 0;
                }

                .pata-pet-grid-mini {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                }

                .pata-pet-stat label { font-size: 12px; color: rgba(155, 155, 155, 1); display: block; }
                .pata-pet-stat span { font-family: 'Fraiche', sans-serif; font-size: 18px; }

                /* Card 4: History & Chat */
                .pata-history-list {
                    margin-top: 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .pata-history-entry {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }

                .pata-history-time {
                    font-size: 14px;
                    color: rgba(155, 155, 155, 1);
                    min-width: 80px;
                }

                .pata-history-badge-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .pata-history-line {
                    height: 1px;
                    border-top: 1px dashed rgba(155, 155, 155, 0.5);
                    flex: 1;
                }

                /* Chat Integration */
                .pata-chat-section {
                    margin-top: 40px;
                    border-top: 2px solid #000;
                    padding-top: 30px;
                }

                .pata-chat-messages {
                    max-height: 400px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    padding-right: 10px;
                }

                .pata-bubble {
                    max-width: 85%;
                    padding: 15px 20px;
                    border-radius: 25px;
                    border: 2px solid #000;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .pata-bubble.admin { align-self: flex-start; background: #F3F4F6; }
                .pata-bubble.user { align-self: flex-end; background: #00BBB4; color: white; }

                .pata-chat-input-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .pata-chat-input {
                    flex: 1;
                    border: 2px solid #000;
                    border-radius: 50px;
                    padding: 12px 25px;
                    outline: none;
                    font-family: inherit;
                }

                .pata-btn-circle {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: #00BBB4;
                    border: 2px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                }

                .pata-btn-cancel {
                    display: block;
                    width: 100%;
                    max-width: 300px;
                    margin: 40px auto 0 auto;
                    background: #00BBB4;
                    color: white;
                    border: 2px solid #000;
                    padding: 15px;
                    border-radius: 50px;
                    font-family: 'Fraiche', sans-serif;
                    font-size: 20px;
                    cursor: pointer;
                    text-align: center;
                    box-shadow: 4px 4px 0px #000;
                }

                @media (max-width: 600px) {
                    .pata-details-grid { grid-template-columns: 1fr; }
                    .pata-pet-card-content { flex-direction: column; }
                    .pata-pet-photo-wrapper { width: 100%; }
                    .pata-pet-big-photo { width: 100%; height: 250px; }
                    .pata-pet-grid-mini { grid-template-columns: 1fr 1fr; }
                }

                /* Modal Viewer Styles */
                .pata-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.85);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    padding: 20px;
                    backdrop-filter: blur(5px);
                }
                .pata-modal-overlay.active { display: flex; }
                .pata-modal-content {
                    background: white;
                    border-radius: 40px;
                    border: 3px solid #000;
                    max-width: 90%;
                    max-height: 90vh;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 10px 10px 0px #000;
                }
                .pata-modal-header {
                    padding: 20px 30px;
                    border-bottom: 2px solid #000;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #FEFA15;
                }
                .pata-modal-title {
                    font-family: 'Fraiche', sans-serif;
                    font-size: 24px;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 80%;
                }
                .pata-modal-close {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 20px;
                    font-weight: 900;
                    transition: all 0.2s;
                }
                .pata-modal-close:hover { transform: rotate(90deg); background: #FF0066; color: white; }
                .pata-modal-body {
                    padding: 0;
                    overflow: auto;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: #f9f9f9;
                    min-height: 300px;
                    min-width: 300px;
                    max-height: 70vh;
                }
                .pata-modal-body img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
                .pata-modal-body iframe {
                    width: 100%;
                    height: 70vh;
                    min-width: 600px;
                    border: none;
                }
                @media (max-width: 768px) {
                    .pata-modal-body iframe { min-width: 100%; }
                }
                .pata-modal-footer {
                    padding: 20px;
                    border-top: 2px solid #000;
                    display: flex;
                    justify-content: center;
                    background: white;
                }
            </style>

            <div class="pata-detail-container">
                <!-- Top Badges -->
                <div class="pata-top-badges">
                    <div class="pata-badge">
                        <div class="pata-badge-icon"><img src="${typeConfig.icon}"></div>
                        ${typeConfig.label}
                    </div>
                    <div class="pata-badge">
                        <div class="pata-badge-icon"><img src="${benefitConfig.icon}"></div>
                        ${benefitConfig.label}
                    </div>
                    <div class="pata-badge">
                        <div class="pata-badge-icon"><img src="${statusConfig.icon}"></div>
                        ${statusConfig.badge}
                    </div>
                </div>

                <h1 class="pata-request-id">${req.case_title || `Solicitud #${req.request_number || req.id.substring(0,6)}`}</h1>

                <!-- Card 1: Main Status -->
                <div class="pata-card">
                    <div class="pata-meta-info">
                        <div class="pata-meta-row">
                            <img src="${this.baseUrl}/Icons/solicitud-clinica.svg">
                            ${req.clinic_name || 'Centro Pata Amiga'}
                        </div>
                        <div class="pata-meta-row">
                            <img src="${this.baseUrl}/Icons/solicitud-fecha.svg">
                            ${new Date(req.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    <h2 class="pata-status-title">
                        <img src="${statusConfig.icon}">
                        ${statusConfig.label}
                    </h2>

                    <div class="pata-status-msg">
                        ${statusConfig.msg}
                    </div>
                </div>

                <!-- Card 2: Application Details -->
                <div class="pata-card">
                    <h3 class="pata-section-title">detalles de la solicitud</h3>
                    <p class="pata-section-subtitle">Motivo y contexto de la atención</p>

                    <div class="pata-details-grid">
                        <div class="pata-detail-item">
                            <label>Tipo de solicitud</label>
                            <div class="pata-badge">
                                <div class="pata-badge-icon"><img src="${typeConfig.icon}"></div>
                                ${typeConfig.label}
                            </div>
                        </div>
                        <div class="pata-detail-item">
                            <label>Tipo de gasto</label>
                            <div class="pata-badge">
                                <div class="pata-badge-icon"><img src="${benefitConfig.icon}"></div>
                                ${benefitConfig.label}
                            </div>
                        </div>
                        <div class="pata-detail-item">
                            <label>Fecha del incidente</label>
                            <div class="pata-incident-date">
                                <img src="${this.baseUrl}/Icons/calendario.svg" style="width: 24px; margin-right: 10px;">
                                ${new Date(req.incident_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <div class="pata-case-desc">
                        <label style="font-size: 14px; color: rgba(155, 155, 155, 1);">Descripción del caso</label>
                        <p>${req.case_description || 'Sin descripción'}</p>
                    </div>

                    ${req.requested_amount ? `
                    <div class="pata-financial-details" style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px dashed #eee; padding-top: 25px;">
                        <div class="pata-detail-item">
                            <label>Monto solicitado</label>
                            <span style="font-family: 'Fraiche', sans-serif; font-size: 24px;">$${Number(req.requested_amount).toLocaleString()} MXN</span>
                        </div>
                        ${req.total_paid_amount ? `
                        <div class="pata-detail-item">
                            <label>Monto total pagado</label>
                            <span style="font-family: 'Fraiche', sans-serif; font-size: 24px; color: #718096;">$${Number(req.total_paid_amount).toLocaleString()} MXN</span>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}

                    <div class="pata-evidence-section" style="margin-top: 40px;">
                        <label style="font-size: 14px; color: rgba(155, 155, 155, 1);">Evidencia y documentos</label>
                        <div class="pata-evidence-gallery">
                            ${(req.evidence || []).map(file => {
                                let color = '#FEFA15'; // Default yellow
                                if (file.name.endsWith('.pdf')) color = '#FEFA15';
                                if (file.name.match(/\.(jpg|jpeg|png)$/i)) color = '#FE8F15';
                                if (file.name.endsWith('.mp4')) color = '#A3E635';

                                const docLabels = {
                                    evidence_photo: 'Foto Evidencia',
                                    prescription: 'Informe / Receta',
                                    receipt: 'Comprobante / Ticket',
                                    senior_certificate: 'Certificado Senior',
                                    chat_attachment: 'Adjunto de Chat'
                                };
                                const label = docLabels[file.docType] || 'Documento';

                                return `
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <div onclick="window.PataSolidarityDetail.openDocument('${file.url}', '${file.name}')" class="pata-evidence-card" style="background: ${color}; cursor: pointer;">
                                            <img src="${file.name.match(/\.(jpg|jpeg|png|webp)$/i) ? file.url : 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-file_f6xv6l.svg'}">
                                            <span>${file.name}</span>
                                        </div>
                                        <span style="font-size: 11px; font-weight: 700; text-align: center; text-transform: uppercase;">${label}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Card 3: Pet Info -->
                <div class="pata-card">
                    <label style="font-size: 14px; color: rgba(155, 155, 155, 1); margin-bottom: 20px; display: block;">Información general</label>
                    <div class="pata-pet-card-content">
                        <div class="pata-pet-photo-wrapper">
                            <div class="pata-pet-big-photo" style="background-image: url('${pet.primary_photo_url || pet.photo_url || pet.photo1_url || 'https://app.pataamiga.mx/Icons/dog-placeholder.png'}')"></div>
                        </div>
                        <div class="pata-pet-details-right">
                            <h3>${pet.name}</h3>
                            <div class="pata-pet-grid-mini">
                                <div class="pata-pet-stat">
                                    <label>Raza</label>
                                    <span>${pet.breed}</span>
                                </div>
                                <div class="pata-pet-stat">
                                    <label>Especie</label>
                                    <span>${pet.pet_type === 'dog' ? 'Perro' : pet.pet_type === 'cat' ? 'Gato' : (pet.pet_type || 'Perro')}</span>
                                </div>
                                <div class="pata-pet-stat">
                                    <label>Sexo</label>
                                    <span>${pet.gender || 'No especificado'}</span>
                                </div>
                                <div class="pata-pet-stat">
                                    <label>Color</label>
                                    <span>${pet.coat_color || 'No especificado'}</span>
                                </div>
                                <div class="pata-pet-stat">
                                    <label>Edad</label>
                                    <span>${pet.age}</span>
                                </div>
                                <div class="pata-pet-stat">
                                    <label>Registro</label>
                                    <span>${new Date(pet.created_at || pet.registration_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 4: History & Chat -->
                <div class="pata-card">
                    <h3 class="pata-section-title">historial de la solicitud</h3>
                    <p class="pata-section-subtitle">Estamos revisando tu solicitud</p>

                    <div class="pata-history-list">
                        ${(req.history || []).map(h => `
                            <div class="pata-history-entry">
                                <div class="pata-history-time">${new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                <div class="pata-history-badge-wrapper">
                                    <div class="pata-history-line"></div>
                                    <div class="pata-badge">
                                        <div class="pata-badge-icon"><img src="${this.getStatusConfig(h.status).icon}"></div>
                                        ${this.getStatusConfig(h.status).badge}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Chat Section -->
                    <div class="pata-chat-section">
                        <div class="pata-chat-messages" id="pata-chat-history">
                            ${this.state.messages.map(m => `
                                <div class="pata-bubble ${m.sender_role}">
                                    ${m.message}
                                    ${m.attachments && m.attachments.length > 0 ? m.attachments.map(a => {
                                        const isImage = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(a.name) || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(a.url);
                                        return `
                                            <div onclick="window.PataSolidarityDetail.openDocument('${a.url}', '${a.name}')" style="margin-top: 10px; cursor: pointer; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px;">
                                                ${isImage ? `
                                                    <img src="${a.url}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #000;">
                                                ` : `
                                                    <div style="width: 40px; height: 40px; border-radius: 8px; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 1px solid #000;">${a.name.endsWith('.pdf') ? '📕' : '📄'}</div>
                                                `}
                                                <div style="flex: 1; min-width: 0;">
                                                    <div style="font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: inherit;">${a.name}</div>
                                                    <div style="font-size: 9px; opacity: 0.7; color: inherit;">Clic para ver</div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('') : ''}
                                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.6; text-align: right;">
                                        ${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="pata-chat-input-row">
                            <button class="pata-btn-circle pata-msg-file-trigger">
                                <img src="${this.baseUrl}/Icons/upload.svg" style="width: 20px; filter: invert(1);">
                            </button>
                            <input type="text" id="pata-msg-input" class="pata-chat-input" placeholder="Escribe un mensaje..." value="${this.state.newMessage}">
                            <button id="pata-send-btn" class="pata-btn-circle" ${!this.state.newMessage.trim() && !this.state.files.attachment ? 'disabled' : ''}>
                                ${this.state.sending ? '...' : '➤'}
                            </button>
                            <input type="file" id="pata-msg-file" hidden accept="image/*,application/pdf,video/*">
                        </div>
                        ${this.state.files.attachment ? `
                            <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; font-size: 13px; background: #f0f0f0; padding: 5px 15px; border-radius: 20px; border: 1px solid #ddd;">
                                <span style="font-size: 16px;">📎</span>
                                <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.state.files.attachment.name}</span>
                                <span onclick="window.PataSolidarityDetail.clearFile()" style="cursor: pointer; font-weight: 700; color: #FF0066; padding: 0 5px;">&times;</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <button class="pata-btn-cancel">Cancelar solicitud</button>
            </div>

            <!-- Modal Viewer -->
            <div id="pata-doc-modal" class="pata-modal-overlay">
                <div class="pata-modal-content">
                    <div class="pata-modal-header">
                        <h3 class="pata-modal-title" id="pata-modal-filename">Documento</h3>
                        <div class="pata-modal-close" onclick="window.PataSolidarityDetail.closeModal()">&times;</div>
                    </div>
                    <div class="pata-modal-body" id="pata-modal-body">
                        <!-- Content injected here -->
                    </div>
                    <div class="pata-modal-footer">
                        <a id="pata-modal-download" href="#" download class="pata-btn-cancel" style="margin: 0; max-width: 220px; font-size: 16px; padding: 12px 25px;">Descargar Archivo</a>
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
        this.container.innerHTML = `<div style="padding: 100px; text-align: center; color: #FF0066;">❌ Error: ${msg}</div>`;
    }

    startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(async () => {
            try {
                const member = this.state.member;
                if (!member) return;

                const messagesRes = await fetch(`${this.apiUrl}/api/solidarity/requests/${this.requestId}/messages?memberstackId=${member.id}`).then(r => r.json());
                
                if (Array.isArray(messagesRes) && messagesRes.length > this.state.messages.length) {
                    console.log('📬 Nuevos mensajes recibidos');
                    this.state.messages = messagesRes;
                    this.render();
                    this.attachEventListeners();
                    this.scrollToBottom();
                }
            } catch (error) {
                console.error('❌ Polling Error:', error);
            }
        }, 5000);
    }

    // Modal Methods
    openDocument(url, filename) {
        const modal = document.getElementById('pata-doc-modal');
        const body = document.getElementById('pata-modal-body');
        const title = document.getElementById('pata-modal-filename');
        const downloadBtn = document.getElementById('pata-modal-download');

        if (!modal || !body) return;

        title.textContent = filename;
        downloadBtn.href = url;
        downloadBtn.setAttribute('download', filename);

        const isImage = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(filename) || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
        const isPdf = /\.pdf(\?.*)?$/i.test(filename) || /\.pdf(\?.*)?$/i.test(url);
        const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(filename) || /\.(mp4|webm|mov)(\?.*)?$/i.test(url);

        if (isImage) {
            body.innerHTML = `<img src="${url}" alt="${filename}" style="max-width: 100%; height: auto;">`;
        } else if (isPdf) {
            body.innerHTML = `<iframe src="${url}#toolbar=0" type="application/pdf" style="width: 100%; height: 70vh; min-width: 600px;"></iframe>`;
        } else if (isVideo) {
            body.innerHTML = `
                <video controls autoplay style="max-width: 100%; max-height: 70vh;">
                    <source src="${url}" type="video/mp4">
                    Tu navegador no soporta la reproducción de video.
                </video>
            `;
        } else {
            body.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                    <p style="font-weight: 600;">Este tipo de archivo no puede previsualizarse.</p>
                    <p style="color: #666; font-size: 14px;">Usa el botón de abajo para descargarlo.</p>
                </div>
            `;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Block background scroll
        
        // Close on click outside content
        modal.onclick = (e) => {
            if (e.target === modal) this.closeModal();
        };
    }

    closeModal() {
        const modal = document.getElementById('pata-doc-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            document.getElementById('pata-modal-body').innerHTML = '';
        }
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
