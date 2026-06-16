/**
 * 🐾 Club Pata Amiga — Solidarity Fund Dashboard Widget
 * Dashboard principal: stats, mascotas, historial + contenedor inline para formulario
 * Comunicación con solidarity-request-form.js via eventos globales
 * Usage: <div id="pata-solidarity-dashboard"></div><script src=".../solidarity-dashboard.js"></script>
 */

class SolidarityDashboard {
    constructor(containerId, options = {}) {
        this.containerId = containerId || 'pata-solidarity-dashboard';
        this.container = document.getElementById(this.containerId);

        // Environment Config
        this.apiUrl = options.apiUrl || window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx';
        this.baseUrl = options.baseUrl || window.PATA_AMIGA_CONFIG?.baseUrl || 'https://app.pataamiga.mx';

        // Dashboard Data
        this.data = {
            user: null,
            pets: [],
            requests: [],
            filteredRequests: [],
            stats: { active: 0, pending: 0, total: 0, processed: 0 },
            placeholders: {
                pet: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png'
            }
        };

        this.useMock = options.useMock || false;
        this.formWidget = null; // Referencia al widget del formulario

        if (!this.container) {
            console.error('❌ SolidarityDashboard: Container not found with ID:', this.containerId);
            return;
        }

        this.init();
    }

    async init() {
        this.renderLoading();
        try {
            await this.loadDependencies();
            await this.fetchData();
            this.data.filteredRequests = [...this.data.requests];
            this.render();
            this.attachEventListeners();
            this.initFormWidget();
            this.setupFormCommunication();
        } catch (error) {
            console.error('❌ SolidarityDashboard Init Error:', error);
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
            throw new Error('Debes iniciar sesión para ver tu manada.');
        }

        const memberstackId = member.id;

        const [statsRes, historyRes] = await Promise.all([
            fetch(`${this.apiUrl}/api/solidarity/stats?memberstackId=${memberstackId}`).then(r => r.json()),
            fetch(`${this.apiUrl}/api/solidarity/history?memberstackId=${memberstackId}`).then(r => r.json())
        ]);

        if (statsRes.success) {
            this.data.user = statsRes.user;
            this.data.pets = statsRes.pets || [];
            this.calculateStats();
            this.data.stats.total = statsRes.stats.total || 0;
            this.data.stats.processed = statsRes.stats.processed || 0;
        }

        if (historyRes.success) {
            this.data.requests = historyRes.requests || [];
        }

        // Las unsubscriptions ya vienen incluidas en el response de /api/solidarity/stats
        // (se consultan en el servidor y se marcan en lifecycleSummary.pets)
        // No necesitamos llamada adicional

        this.data.filteredRequests = [...this.data.requests];
    }

    loadMockData() {
        this.data.user = { id: 'mock-1', first_name: 'Usuario', last_name: 'Prueba' };
        this.data.pets = [
            { id: 'p1', name: 'Rex', breed: 'Golden Retriever', primary_photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300', waiting_period_end: new Date(Date.now() - 86400000 * 10).toISOString() },
            { id: 'p2', name: 'Luna', breed: 'Siamés', primary_photo_url: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&q=80&w=300', waiting_period_end: new Date(Date.now() + 86400000 * 45).toISOString() },
            { id: 'p3', name: 'Firulais', breed: 'Labrador', is_active: false, status: 'pending', primary_photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300' },
            { id: 'p4', name: 'Max', breed: 'Beagle', is_active: false, isInactive: true, status: 'approved', primary_photo_url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=300' }
        ];
        this.data.requests = [
            { id: 'r1', pet_id: 'p1', benefit_type: 'medical_emergency', reason: 'Consulta dermatológica', clinic_name: 'Animal Care', status: 'in_review', type: 'clinic', created_at: '2025-06-30T10:00:00Z' },
            { id: 'r2', pet_id: 'p1', benefit_type: 'annual_vaccination', reason: 'Refuerzo Quíntuple', clinic_name: 'Vet Home', status: 'paid', type: 'reimbursement', created_at: '2025-05-15T10:00:00Z' },
            { id: 'r3', pet_id: 'p2', benefit_type: 'medical_emergency', reason: 'Gastroenteritis', clinic_name: 'Hospital Pata Amiga', status: 'approved', type: 'clinic', created_at: '2025-07-01T10:00:00Z' },
            { id: 'r4', pet_id: 'p2', benefit_type: 'death', reason: 'Apoyo fallecimiento', clinic_name: 'Funeral Pet', status: 'new', type: 'reimbursement', created_at: '2025-07-05T10:00:00Z' }
        ];
        this.calculateStats();
    }

    calculateStats() {
        this.data.stats.active = this.data.pets.filter(p => {
            const isInactive = p.is_active === false || p.is_active === 'false' || p.is_active === 0 || p.is_active === '0' || (typeof p.is_active === 'string' && p.is_active.toLowerCase() === 'false');
            if (isInactive) return false;
            if (p.status !== 'approved') return false;
            const carencia = this.calculateCarencia(p);
            return !carencia.isWaiting;
        }).length;

        this.data.stats.pending = this.data.pets.filter(p => {
            const isInactive = p.is_active === false || p.is_active === 'false' || p.is_active === 0 || p.is_active === '0' || (typeof p.is_active === 'string' && p.is_active.toLowerCase() === 'false');
            if (isInactive) return false;
            if (p.status !== 'approved') return true;
            const carencia = this.calculateCarencia(p);
            return carencia.isWaiting;
        }).length;

        this.data.stats.processed = this.data.requests.filter(r => ['paid', 'completed'].includes(r.status)).length;
    }

    calculateCarencia(pet) {
        const now = new Date();
        let start = now;
        if (pet.waiting_period_start) {
            const parsed = new Date(pet.waiting_period_start);
            if (!isNaN(parsed.getTime())) start = parsed;
        } else if (pet.created_at) {
            const parsed = new Date(pet.created_at);
            if (!isNaN(parsed.getTime())) start = parsed;
        }

        let totalDays = 180;
        const isTrue = (val) => val === true || val === 'true' || val === 1 || val === '1';
        const isAdopted = isTrue(pet.is_adopted) || isTrue(pet['is-adopted']) || isTrue(pet.isAdopted);
        const isMixed = isTrue(pet.is_mixed_breed) || isTrue(pet['is-mixed-breed']) || isTrue(pet.is_mixed) || isTrue(pet.isMixed);

        if (pet.waiting_period_days) {
            const customDays = parseInt(pet.waiting_period_days);
            if (!isNaN(customDays)) totalDays = customDays;
        } else if (isAdopted) {
            totalDays = isMixed ? 120 : 150;
        }

        const diffTime = Math.max(0, now.getTime() - start.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, totalDays - daysPassed);
        const percentage = Math.min(100, Math.round((daysPassed / totalDays) * 100));
        const isWaiting = daysRemaining > 0;

        const endDate = new Date(start.getTime());
        endDate.setDate(endDate.getDate() + totalDays);

        return { daysRemaining, percentage, totalDays, isWaiting, endDate };
    }

    getPetStatusContext(pet) {
        const isInactive = pet.is_active === false || pet.is_active === 'false' || pet.is_active === 0 || pet.is_active === '0' || (typeof pet.is_active === 'string' && pet.is_active.toLowerCase() === 'false');
        if (isInactive) return { label: 'DADA DE BAJA', color: '#718096', icon: '🕊️', isInactive: true };
        const primaryPhotoUrl = pet.photo_url || pet.primary_photo_url;
        const hasPrimaryPhoto = primaryPhotoUrl && primaryPhotoUrl.startsWith('http');
        if (pet.status === 'rejected') return { label: 'RECHAZADA', color: '#FF0066', icon: '❌' };
        if (pet.status === 'pending') return { label: 'EN REVISIÓN', color: '#FE8F15', icon: '⏳' };
        if (!hasPrimaryPhoto) return { label: 'SIN FOTO', color: '#718096', icon: '📷' };
        return { label: 'APROBADA', color: '#10B981', icon: '✅' };
    }

    // ===== INIT FORM WIDGET (inline, hidden) =====
    initFormWidget() {
        // Crear explícitamente el form widget con el contenedor correcto y modo inline
        try {
            this.formWidget = new SolidarityRequestForm('pata-solidarity-form', {
                apiUrl: this.apiUrl,
                baseUrl: this.baseUrl,
                mode: 'inline'
            });
            // Registrar en global para evitar double-init por auto-init del form widget
            window.PataSolidarityForm = this.formWidget;
            console.log('✅ SolidarityDashboard: Form widget initialized in inline mode');
        } catch (error) {
            console.error('❌ Failed to initialize form widget:', error);
        }
    }

    setupFormCommunication() {
        // Escuchar eventos del form widget
        window.addEventListener('pata:form:success', (e) => this.onFormSuccess(e.detail));
        window.addEventListener('pata:form:cancel', () => this.onFormCancel());
        window.addEventListener('pata:form:ready', () => {
            // Form widget listo, ya podemos usarlo
            console.log('✅ Form widget ready for inline use');
        });
    }

    onFormSuccess(detail) {
        console.log('✅ Form submitted successfully:', detail);
        this.hideForm();
        // Refrescar datos después de éxito
        setTimeout(() => this.refreshData(), 500);
    }

    onFormCancel() {
        console.log('🚫 Form cancelled');
        this.hideForm();
    }

    showForm() {
        const formContainer = this.container.querySelector('#pata-solidarity-form');
        if (formContainer) {
            formContainer.style.display = 'block';
            // Scroll suave al formulario
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (this.formWidget && typeof this.formWidget.show === 'function') {
            this.formWidget.show();
        }
        // Disparar evento para que el form sepa que se mostró
        window.dispatchEvent(new CustomEvent('pata:dashboard:form-show'));
    }

    hideForm() {
        const formContainer = this.container.querySelector('#pata-solidarity-form');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
        if (this.formWidget && typeof this.formWidget.hide === 'function') {
            this.formWidget.hide();
        }
    }

    async refreshData() {
        try {
            // Re-fetch data silently
            const memberstack = window.$memberstackDom;
            const { data: member } = await memberstack.getCurrentMember();
            if (!member) return;

            const memberstackId = member.id;
            const [statsRes, historyRes] = await Promise.all([
                fetch(`${this.apiUrl}/api/solidarity/stats?memberstackId=${memberstackId}`).then(r => r.json()),
                fetch(`${this.apiUrl}/api/solidarity/history?memberstackId=${memberstackId}`).then(r => r.json())
            ]);

            if (statsRes.success) {
                this.data.user = statsRes.user;
                this.data.pets = statsRes.pets || [];
                this.calculateStats();
                this.data.stats.total = statsRes.stats.total || 0;
                this.data.stats.processed = statsRes.stats.processed || 0;
            }

            if (historyRes.success) {
                this.data.requests = historyRes.requests || [];
            }

            // Las unsubscriptions ya vienen incluidas en el response de /api/solidarity/stats
            // No necesitamos llamada adicional

            this.data.filteredRequests = [...this.data.requests];
            
            // Re-render solo las partes que cambian (pets list + history + stats)
            this.updateDashboardSections();
        } catch (error) {
            console.error('❌ Refresh data error:', error);
        }
    }

    updateDashboardSections() {
        // Actualizar stats
        const statsGrid = this.container.querySelector('.pata-stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.1s;">
                    <span class="pata-stat-number">${this.data.stats.active}</span>
                    <span class="pata-stat-label">Mascotas con acceso al Apoyo Económico.</span>
                </div>
                <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.2s;">
                    <span class="pata-stat-number">${this.data.stats.pending}</span>
                    <span class="pata-stat-label">En proceso de activar su apoyo.</span>
                </div>
                <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.3s;">
                    <span class="pata-stat-number">${this.data.stats.total || 0}</span>
                    <span class="pata-stat-label">Solicitudes realizadas.</span>
                </div>
                <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.4s;">
                    <span class="pata-stat-number">${this.data.stats.processed}</span>
                    <span class="pata-stat-label">Solicitudes en proceso.</span>
                </div>
            `;
        }

        // Actualizar título de estado
        const statusTitle = this.container.querySelector('.pata-status-title');
        if (statusTitle) {
            statusTitle.textContent = this.data.stats.active > 0 ? 'apoyo económico activo' : 'apoyo económico en espera';
        }

        // Actualizar lista de mascotas
        const petList = this.container.querySelector('.pata-pet-list');
        if (petList) {
            petList.innerHTML = this.renderPets();
            // Re-attach click listeners para botones "Utiliza tus beneficios"
            this.attachPetCardListeners();
        }

        // Actualizar historial
        this.updateHistoryList();
    }

    attachPetCardListeners() {
        // Botones "Utiliza tus beneficios" en tarjetas
        this.container.querySelectorAll('.pata-pet-info button[onclick*="fondo-solidario"]').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showForm();
            };
        });
        // Botón principal "SOLICITAR APOYO"
        const mainBtn = this.container.querySelector('#pata-show-form-btn, .pata-cta-row button');
        if (mainBtn) {
            mainBtn.onclick = (e) => {
                e.preventDefault();
                this.showForm();
            };
        }
    }

    attachEventListeners() {
        // Dashboard listeners (search, filter)
        const searchInput = this.container.querySelector('#pata-history-search');
        const filterSelect = this.container.querySelector('#pata-history-filter');

        if (searchInput) searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        if (filterSelect) filterSelect.addEventListener('change', (e) => this.handleFilter(e.target.value));

        // Botones principales
        this.attachPetCardListeners();
    }

    handleSearch(query) {
        const q = query.toLowerCase();
        this.data.filteredRequests = this.data.requests.filter(req => {
            const pet = this.data.pets.find(p => p.id === req.pet_id);
            const petName = pet ? pet.name.toLowerCase() : '';
            const reason = (req.reason || '').toLowerCase();
            const clinic = (req.clinic_name || '').toLowerCase();
            return petName.includes(q) || reason.includes(q) || clinic.includes(q);
        });
        this.updateHistoryList();
    }

    handleFilter(type) {
        if (type === 'all') this.data.filteredRequests = [...this.data.requests];
        else this.data.filteredRequests = this.data.requests.filter(req => req.benefit_type === type);
        this.updateHistoryList();
    }

    updateHistoryList() {
        const listContainer = this.container.querySelector('#pata-history-items-container');
        if (listContainer) {
            if (this.data.filteredRequests.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: white; opacity: 0.7;">No se encontraron resultados.</p>';
            } else {
                listContainer.innerHTML = this.data.filteredRequests.map((req, idx) => this.renderHistoryItem(req, idx)).join('');
            }
        }
    }

    render() {
        this.renderStyles();

        this.container.innerHTML = `
            <div class="pata-dashboard-wrapper">
                <header class="pata-header">
                    <h1>mi manada</h1>
                    <p>Administra a tus peludos y su acceso al Apoyo Económico</p>
                </header>

                <main>
                    <section class="pata-main-card">
                        <h2 class="pata-status-title pata-animate-entry" style="animation-delay: 0.1s;">
                            ${this.data.stats.active > 0 ? 'apoyo económico activo' : 'apoyo económico en espera'}
                        </h2>
                        <p class="pata-status-subtitle pata-animate-entry" style="animation-delay: 0.15s;">
                            La protección es para toda la manada. Consulta el estado del apoyo económico que acompaña a tus compañeros de cuatro patas.
                        </p>

                        <div class="pata-stats-grid">
                            <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.2s;">
                                <span class="pata-stat-number">${this.data.stats.active}</span>
                                <span class="pata-stat-label">Mascotas con acceso al Apoyo Económico.</span>
                            </div>
                            <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.3s;">
                                <span class="pata-stat-number">${this.data.stats.pending}</span>
                                <span class="pata-stat-label">En proceso de activar su apoyo.</span>
                            </div>
                            <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.4s;">
                                <span class="pata-stat-number">${this.data.stats.total || 0}</span>
                                <span class="pata-stat-label">Solicitudes realizadas.</span>
                            </div>
                            <div class="pata-stat-box pata-animate-entry" style="animation-delay: 0.5s;">
                                <span class="pata-stat-number">${this.data.stats.processed}</span>
                                <span class="pata-stat-label">Solicitudes en proceso.</span>
                            </div>
                        </div>

                        <div class="pata-benefits-summary">
                            <p style="font-weight: 600; font-size: 14px; margin-bottom: 20px;">Cantidades disponibles en tus apoyos</p>
                            <div class="pata-benefits-grid">
                                <div class="pata-benefit-item">
                                    <img src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-emergencias_pbfplq.svg" class="pata-benefit-icon">
                                    <div class="pata-benefit-info"><h4>Emergencia médica</h4><p>$3,000</p></div>
                                </div>
                                <div class="pata-benefit-item">
                                    <img src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/Icon-vacuna_ybuall.svg" class="pata-benefit-icon">
                                    <div class="pata-benefit-info"><h4>Vacunación</h4><p>$300</p></div>
                                </div>
                                <div class="pata-benefit-item">
                                    <img src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-fallecimiento_xwqe2g.png" class="pata-benefit-icon">
                                    <div class="pata-benefit-info"><h4>Fallecimiento</h4><p>$2,000</p></div>
                                </div>
                            </div>
                            <p style="margin: 30px 0; font-size: 16px; opacity: 0.9; line-height: 1.5; font-weight: 500; text-align: left;">
                                Elige entre pedir atención en un Centro de Bienestar o solicitar un reembolso si ya cubriste el gasto por tu cuenta. Estamos contigo en cada paso.
                            </p>
                            <div class="pata-cta-row pata-animate-entry" style="animation-delay: 0.6s;">
                                <button class="pata-btn pata-btn-orange" id="pata-show-form-btn">
                                    SOLICITAR APOYO
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- 🔥 CONTENEDOR INLINE PARA FORMULARIO (OCULTO POR DEFECTO) -->
                    <div id="pata-solidarity-form" style="display: none; width: 100%; max-width: 1400px; margin: 0 auto;"></div>

                    <div class="pata-content-layout">
                        <section>
                            <h2 class="pata-section-title pata-animate-entry" style="animation-delay: 0.2s;">Tus mascotas registradas</h2>
                            <div class="pata-pet-list">
                                ${this.renderPets()}
                            </div>
                        </section>

                        <section>
                            <div class="pata-history-panel">
                                <h2 class="pata-section-title pata-history-title pata-animate-entry" style="animation-delay: 0.3s; margin-top: 0; margin-bottom: 25px;">Historial de solicitudes</h2>
                                ${this.renderHistory()}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        `;

        // Re-attach listeners after render
        this.attachEventListeners();
    }

    renderStyles() {
        if (document.getElementById('pata-solidarity-dashboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'pata-solidarity-dashboard-styles';
        style.innerHTML = this.getStyles();
        document.head.appendChild(style);
    }

    getStyles() {
        const scope = `#${this.containerId} `;
        return `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Fraiche&display=swap');

            :root {
                --pata-turquoise: #00BBB4;
                --pata-turquoise-light: #15BEB2;
                --pata-red: #FF0066;
                --pata-white: #FFFFFF;
                --pata-black: #1A1A1A;
                --pata-gray: #718096;
                --pata-light-turquoise: #E6F7F6;
                --pata-yellow: #FEF08A;
                --pata-orange: #FE8F15;
                --pata-lime: #9FD406;
                --pata-border: 2px solid var(--pata-black);
            }

            ${scope} * { box-sizing: border-box; }

            ${scope} { width: 100%; max-width: 1400px; margin: 0 auto; position: relative; min-height: 400px; }
            ${scope} .pata-dashboard-wrapper { font-family: 'Outfit', sans-serif; color: var(--pata-black); width: 100%; display: flex; flex-direction: column; align-items: center; gap: 50px; }

            /* Header */
            ${scope} .pata-header { width: 100%; max-width: 1400px; padding: 60px 40px 120px 40px; border-radius: 0 0 50px 50px; text-align: left; margin-bottom: -80px; background: var(--pata-turquoise); }
            ${scope} .pata-header h1 { font-family: 'Fraiche', sans-serif; font-weight: 900; font-size: 64px; color: var(--pata-white); margin: 0; line-height: 1; }
            ${scope} .pata-header p { font-size: 20px; color: var(--pata-white); opacity: 0.9; margin-top: 10px; }

            /* Main Card (Stats + Benefits) */
            ${scope} .pata-main-card { background: var(--pata-white); border-radius: 50px; padding: 40px; margin: 20px auto; width: calc(100% - 40px); max-width: 1400px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); position: relative; z-index: 10; border: var(--pata-border); }
            ${scope} .pata-status-title { font-weight: 900; font-size: 40px; margin: 0; color: var(--pata-black); font-family: 'Fraiche', sans-serif; }
            ${scope} .pata-status-subtitle { font-size: 16px; color: var(--pata-gray); margin: 10px 0 30px 0; }
            ${scope} .pata-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
            ${scope} .pata-stat-box { background: var(--pata-red); border-radius: 30px; padding: 30px 20px; color: var(--pata-white); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; border: var(--pata-border); box-shadow: 4px 4px 0px var(--pata-black); }
            ${scope} .pata-stat-number { font-weight: 900; font-size: 64px; line-height: 1; margin-bottom: 5px; }
            ${scope} .pata-stat-label { font-size: 14px; font-weight: 600; line-height: 1.2; }
            ${scope} .pata-benefits-summary { border-top: 1px solid #edf2f7; padding-top: 30px; }
            ${scope} .pata-benefits-grid { display: flex; flex-wrap: wrap; gap: 40px; margin-top: 20px; justify-content: space-around; }
            ${scope} .pata-benefit-item { display: flex; align-items: center; gap: 15px; }
            ${scope} .pata-benefit-icon { width: 40px; height: 40px; }
            ${scope} .pata-benefit-info h4 { font-size: 14px; margin: 0; color: var(--pata-gray); }
            ${scope} .pata-benefit-info p { font-size: 24px; font-weight: 900; margin: 0; }
            ${scope} .pata-btn { padding: 12px 30px; border-radius: 50px; font-weight: 800; font-family: 'Fraiche', sans-serif; cursor: pointer; transition: all 0.2s; border: var(--pata-border); box-shadow: 4px 4px 0px var(--pata-black); text-decoration: none; display: inline-block; text-align: center; text-transform: uppercase; }
            ${scope} .pata-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px var(--pata-black); }
            ${scope} .pata-btn-primary { background: var(--pata-red); color: white; font-size: 18px; padding: 15px 40px; }
            ${scope} .pata-btn-orange { background: var(--pata-orange); color: var(--pata-black); font-size: 18px; padding: 15px 40px; }
            ${scope} .pata-btn-orange:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px var(--pata-black); }
            ${scope} .pata-btn-turquoise { background: var(--pata-turquoise); color: white; }
            ${scope} .pata-cta-row { text-align: center; margin-top: 20px; }

            /* Layout: Pets + History */
            ${scope} .pata-content-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; padding: 100px 35px; background-color: #eaeaea; width: 100%; box-sizing: border-box; }
            @media (max-width: 991px) { ${scope} .pata-content-layout { grid-template-columns: 1fr; } ${scope} .pata-header h1 { font-size: 48px; } }
            ${scope} .pata-section-title { font-family: 'Fraiche', sans-serif; font-weight: 900; font-size: 100px; color: var(--pata-red); margin-bottom: 30px; text-transform: uppercase; }
            ${scope} .pata-history-title { font-size: 50px; color: var(--pata-white) !important; }
            @media (max-width: 767px) { ${scope} .pata-history-title { font-size: 32px; } ${scope} .pata-section-title { font-size: 48px; } }
            @media (max-width: 480px) { ${scope} .pata-history-title { font-size: 20px !important; } ${scope} .pata-section-title { font-size: 36px; } }

            /* Pet Cards */
            ${scope} .pata-pet-list { display: flex; flex-direction: column; gap: 24px; width: 100%; }
            ${scope} .pata-pet-card { background: #FFFFFF; border-radius: 35px; padding: 24px; display: flex; gap: 28px; align-items: center; box-shadow: 0 8px 30px rgba(0,0,0,0.06); transition: transform 0.3s; position: relative; border: var(--pata-border); max-width: 100%; box-sizing: border-box; cursor: pointer; }
            ${scope} .pata-pet-card.pata-inactive-card { background: #F1F3F4 !important; }
            ${scope} .pata-pet-photo { width: 150px; height: 150px; border-radius: 30px; object-fit: cover; border: var(--pata-border); flex-shrink: 0; }
            ${scope} .pata-pet-photo.pata-grayscale { filter: grayscale(100%) !important; opacity: 0.7 !important; transition: all 0.5s ease; }
            ${scope} .pata-pet-name { font-weight: 900; font-size: 32px; color: var(--pata-turquoise); margin: 0; font-family: 'Fraiche', sans-serif; }
            ${scope} .pata-pet-badge-new { position: absolute; top: 20px; right: 20px; background: #FEE2E2; color: var(--pata-red); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid var(--pata-red); }
            ${scope} .pata-pet-info { flex: 1; }
            ${scope} .pata-pet-info p { font-size: 14px; margin: 5px 0; color: var(--pata-gray); font-weight: 600; }
            ${scope} .pata-pet-info button { margin-top: 10px; font-size: 12px; padding: 8px 15px; background: var(--pata-light-turquoise); border: var(--pata-border); border-radius: 50px; font-weight: 800; cursor: pointer; text-transform: uppercase; color: var(--pata-black); width: fit-content; }
            ${scope} .pata-pet-info button.pata-btn-orange { background: var(--pata-orange); color: var(--pata-black); }

            /* History Panel */
            ${scope} .pata-history-panel { background: var(--pata-turquoise); border-radius: 40px; padding: 35px; color: white; border: var(--pata-border); box-shadow: 6px 6px 0px var(--pata-black); }
            ${scope} .pata-history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 20px; flex-wrap: wrap; }
            ${scope} .pata-history-header input, ${scope} .pata-history-header select { background: white; border: var(--pata-border); padding: 12px 24px; border-radius: 50px; font-family: inherit; font-weight: 600; font-size: 16px; outline: none; box-shadow: 4px 4px 0px var(--pata-black); color: var(--pata-black) !important; min-width: 200px; }
            ${scope} .pata-history-header input { flex: 1; }
            ${scope} .pata-history-header select { min-width: 180px; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231A1A1A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 20px top 50%; background-size: 12px auto; }

            ${scope} .pata-history-item { background: white; border-radius: 25px; padding: 20px 25px; color: var(--pata-black); display: grid; grid-template-columns: 1.5fr 1.5fr 1fr; gap: 20px; align-items: center; border: var(--pata-border); margin-bottom: 15px; cursor: pointer; }
            ${scope} .pata-history-item:hover { transform: scale(1.02); }
            ${scope} .pata-history-id { font-family: 'Fraiche', sans-serif; font-size: 20px; color: var(--pata-black); margin: 0; text-transform: uppercase; }
            ${scope} .pata-history-pet { font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 20px; margin: 0; color: var(--pata-gray); }
            ${scope} .pata-badge-type { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 14px 0 37px; border-radius: 50px; border: var(--pata-border); font-family: 'Fraiche', sans-serif; font-size: 14px; position: relative; width: fit-content; }
            ${scope} .pata-badge-type-icon { position: absolute; left: -2px; top: -2px; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            ${scope} .pata-badge-type-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
            ${scope} .pata-history-row { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
            ${scope} .pata-row-icon { width: 28px; height: 28px; background: black; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            ${scope} .pata-row-icon img { width: 16px; height: 16px; }
            ${scope} .pata-row-text { font-family: 'Fraiche', sans-serif; font-size: 14px; color: black; }
            ${scope} .pata-status-badge { display: flex; align-items: center; gap: 10px; height: 28px; padding: 0 12px 0 35px; border-radius: 50px; font-family: 'Fraiche', sans-serif; font-size: 14px; position: relative; width: fit-content; color: black; }
            ${scope} .pata-status-badge-icon { position: absolute; left: 0; top: 0; width: 28px; height: 28px; border-radius: 50%; background: black; display: flex; align-items: center; justify-content: center; }
            ${scope} .pata-status-badge-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }

            /* Animations */
            ${scope} .pata-spinner { border: 4px solid rgba(0,0,0,0.1); border-left-color: var(--pata-orange); border-radius: 50%; width: 40px; height: 40px; animation: pata-spin 1s linear infinite; margin: 0 auto; }
            @keyframes pata-spin { to { transform: rotate(360deg); } }
            @keyframes pataFadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            ${scope} .pata-animate-entry { animation: pataFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
            ${scope} .pata-pet-card:hover, ${scope} .pata-history-item:hover { border-color: var(--pata-turquoise); transform: translateY(-4px) scale(1.01); box-shadow: 8px 8px 0px var(--pata-black); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            ${scope} .pata-status-badge { transition: transform 0.2s; }
            ${scope} .pata-status-badge:hover { transform: scale(1.05); }

            /* Responsive */
            @media (max-width: 768px) {
                ${scope} .pata-dashboard-wrapper { gap: 30px; }
                ${scope} .pata-header { padding: 40px 20px 80px 20px; text-align: center; margin-bottom: -60px; }
                ${scope} .pata-header h1 { font-size: 40px; }
                ${scope} .pata-main-card { padding: 25px 20px; border-radius: 30px; margin: 10px; }
                ${scope} .pata-status-title { font-size: 28px; }
                ${scope} .pata-stat-number { font-size: 48px; }
                ${scope} .pata-benefits-grid { flex-direction: column; gap: 20px; align-items: flex-start; }
                ${scope} .pata-benefit-item { width: 100%; }
                ${scope} .pata-pet-list { gap: 16px; }
                ${scope} .pata-pet-card { flex-direction: column; text-align: center; padding: 20px; gap: 15px; width: 100%; }
                ${scope} .pata-pet-photo { width: 120px; height: 120px; margin: 0 auto; flex-shrink: 0; }
                ${scope} .pata-pet-name { font-size: 24px; word-wrap: break-word; overflow-wrap: break-word; }
                ${scope} .pata-pet-info { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                ${scope} .pata-pet-info p { max-width: 100%; word-wrap: break-word; }
                ${scope} .pata-pet-info button { width: 100%; max-width: 280px; white-space: normal; word-wrap: break-word; }
                ${scope} .pata-pet-badge-new { position: static; display: inline-block; margin-bottom: 10px; }
                ${scope} .pata-history-panel { padding: 20px; border-radius: 30px; }
                ${scope} .pata-history-header { flex-direction: column; align-items: stretch; gap: 15px; }
                ${scope} .pata-history-header input { width: 100% !important; margin: 0 !important; }
                ${scope} .pata-history-header select { width: 100% !important; margin: 0 !important; }
                ${scope} .pata-history-item { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; padding: 20px; }
                ${scope} .pata-history-item > div { width: 100% !important; flex-shrink: 1 !important; padding: 0 !important; }
                ${scope} .pata-history-item > div:last-child { align-items: flex-start !important; border-top: 1px solid #eee; padding-top: 15px; }
            }
            @media (max-width: 480px) {
                ${scope} .pata-header { padding: 30px 15px 60px 15px; }
                ${scope} .pata-header h1 { font-size: 32px; }
                ${scope} .pata-main-card { padding: 20px 15px; border-radius: 20px; margin: 5px; }
                ${scope} .pata-pet-card { padding: 15px; border-radius: 25px; }
                ${scope} .pata-pet-photo { width: 100px; height: 100px; }
                ${scope} .pata-pet-name { font-size: 20px; }
                ${scope} .pata-pet-info button { font-size: 11px; padding: 8px 12px; max-width: 100%; }
                ${scope} .pata-section-title { font-size: 20px !important; }
            }
        `;
    }

    // ===== RENDER HELPERS =====

    renderPets() {
        if (this.data.pets.length === 0) return `
            <div style="padding: 30px; text-align: center; background: rgba(255,255,255,0.05); border-radius: 30px; border: 2px dashed rgba(255,255,255,0.2);">
                <p style="color: white; font-weight: 600;">No tienes mascotas registradas.</p>
            </div>
            <div class="pata-pet-card" style="border: 2px dashed var(--pata-gray); background: transparent; cursor: pointer; justify-content: center; margin-top: 20px;" id="add-pet-trigger" onclick="window.location.href='/registrar-mascotas'">
                <div style="text-align: center; padding: 20px;"><div style="font-size: 32px; color: var(--pata-red);">+</div><p style="font-weight: 800;">Añadir peludo</p></div>
            </div>
        `;

        const petCards = this.data.pets.map((pet, index) => {
            const carencia = this.calculateCarencia(pet);
            const statusContext = this.getPetStatusContext(pet);
            const imageUrl = pet.primary_photo_url || pet.photo_url || this.data.placeholders.pet;
            const isInactive = pet.is_active === false || pet.is_active === 'false' || pet.is_active === 0 || pet.is_active === '0' || (typeof pet.is_active === 'string' && pet.is_active.toLowerCase() === 'false');
            const isApproved = pet.status === 'approved' && !isInactive;
            const isEligible = isApproved && !carencia.isWaiting;

            return `
                <div class="pata-pet-card pata-animate-entry ${isInactive ? 'pata-inactive-card' : ''}" style="animation-delay: ${index * 0.1}s">
                    ${!isEligible ? `<div class="pata-pet-badge-new" style="background: ${isInactive ? '#F1F3F4' : (isApproved ? '#FEF9C3' : '#FEE2E2')}; color: ${isInactive ? '#3D494D' : (isApproved ? '#854D0E' : '#991B1B')}; border-color: ${isInactive ? '#3D494D' : (isApproved ? '#854D0E' : '#991B1B')};">${isInactive ? 'DADA DE BAJA' : (carencia.isWaiting ? 'En espera' : (pet.status === 'pending' ? 'EN REVISIÓN' : statusContext.label))}</div>` : ''}
                    <img src="${imageUrl}" class="pata-pet-photo ${isInactive ? 'pata-grayscale' : ''}" alt="Foto de ${pet.name}" onerror="this.src='${this.data.placeholders.pet}';">
                    <div class="pata-pet-info">
                        <h3 class="pata-pet-name">${pet.name}</h3>
                        <p style="font-size: 14px; margin: 5px 0; color: var(--pata-gray); font-weight: 600;">${pet.breed || 'Mestizo'}</p>
                        <div style="margin-top: 10px;">
                            ${isInactive ? `<p style="color: #6B7280; font-weight: 700; font-size: 13px;">🕊️ Mascota dada de baja</p>` : !isApproved ? `<p style="color: #6B7280; font-weight: 700; font-size: 13px;">${statusContext.icon} Esperando aprobación</p>` : carencia.isWaiting ? `
                                <p style="color: #EAB308; font-weight: 700; font-size: 13px;">⏳ Faltan ${carencia.daysRemaining} días de espera</p>
                                <div style="width: 100%; height: 6px; background: #E2E8F0; border-radius: 10px; margin-top: 8px; overflow: hidden;"><div style="width: ${carencia.percentage}%; height: 100%; background: #FE8F15; border-radius: 10px;"></div></div>
                            ` : `
                                <p style="color: #10B981; font-weight: 700; font-size: 13px;">✅ ${pet.name} ya puede acceder al apoyo económico</p>
                                <button class="pata-btn pata-btn-orange" style="margin-top: 10px; font-size: 12px; padding: 10px 20px; border: var(--pata-border); border-radius: 50px; font-weight: 800; cursor: pointer; text-transform: uppercase;" onclick="event.stopPropagation(); window.PataSolidarityDashboard?.showForm?.()">UTILIZA TUS BENEFICIOS</button>
                            `}
                        </div>
                        ${isInactive ? '' : `<button class="pata-btn" style="margin-top: 10px; font-size: 12px; padding: 8px 15px; background: var(--pata-light-turquoise);" onclick="event.stopPropagation(); window.location.href='/mi-mascota?id=${pet.id}'">Ver expediente</button>`}
                    </div>
                </div>
            `;
        }).join('');

        const activePetCount = this.data.pets.filter(p => p.is_active !== false && p.is_active !== 'false').length;
        const addCard = activePetCount < 3 ? `
            <div class="pata-pet-card" style="border: 2px dashed var(--pata-gray); background: transparent; cursor: pointer; justify-content: center;" id="add-pet-trigger" onclick="window.location.href='/registrar-mascotas'">
                <div style="text-align: center; padding: 20px;"><div style="font-size: 32px; color: var(--pata-red);">+</div><p style="font-weight: 800;">Añadir peludo</p></div>
            </div>
        ` : '';

        return petCards + addCard;
    }

    renderHistory() {
        return `
            <div class="pata-history-header">
                <input type="text" id="pata-history-search" placeholder="Buscar en historial..." style="background: white; border: var(--pata-border); padding: 12px 24px; border-radius: 50px; font-family: inherit; flex: 1; min-width: 200px; box-shadow: 4px 4px 0px var(--pata-black); color: var(--pata-black) !important; font-weight: 600; font-size: 16px; outline: none; transition: all 0.2s;">
                <select id="pata-history-filter" style="background: white; border: var(--pata-border); padding: 12px 24px; border-radius: 50px; font-family: inherit; min-width: 180px; cursor: pointer; box-shadow: 4px 4px 0px var(--pata-black); color: var(--pata-black) !important; font-weight: 700; font-size: 16px; outline: none; appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231A1A1A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 20px top 50%; background-size: 12px auto; transition: all 0.2s;">
                    <option value="all" style="color: black;">Filtro: Todos</option>
                    <option value="medical_emergency" style="color: black;">🏥 Emergencias</option>
                    <option value="annual_vaccination" style="color: black;">💉 Vacunación</option>
                    <option value="death" style="color: black;">🕊️ Fallecimiento</option>
                </select>
            </div>
            <ul class="pata-history-list" id="pata-history-items-container" style="list-style: none; padding: 0;">
                ${this.data.filteredRequests.length === 0 ? '<p style="text-align: center; padding: 40px; color: white;">Sin solicitudes.</p>' : this.data.filteredRequests.map((req, idx) => this.renderHistoryItem(req, idx)).join('')}
            </ul>
        `;
    }

    renderHistoryItem(req, idx = 0) {
        const pet = this.data.pets.find(p => p.id === req.pet_id);
        const types = { medical_emergency: { label: 'emergencia médica', color: '#ff0063', icon: `${this.baseUrl}/Icons/emergencias.svg` }, annual_vaccination: { label: 'vacunación', color: '#fe8f15', icon: `${this.baseUrl}/Icons/vacuna.svg` }, death: { label: 'fallecimiento', color: '#00BBB4', icon: `${this.baseUrl}/Icons/fallecimiento.svg` } };
        const type = types[req.benefit_type] || types.medical_emergency;
        const statuses = { new: { label: 'solicitud enviada', color: '#9b9b9b', icon: `${this.baseUrl}/Icons/enviada.png` }, in_review: { label: 'cita agendada', color: '#fefa15', icon: `${this.baseUrl}/Icons/calendario.svg` }, approved: { label: 'aprobada', color: '#10B981', icon: `${this.baseUrl}/Icons/aprovada.png` }, paid: { label: 'reembolso aprobado', color: '#FEF9C3', icon: `${this.baseUrl}/Icons/aprovada.png` }, rejected: { label: 'rechazada', color: '#ff0063', icon: `${this.baseUrl}/Icons/rechazada.png` } };
        const status = statuses[req.status] || statuses.new;

        return `
            <li class="pata-history-item pata-animate-entry" style="animation-delay: ${0.3 + (idx * 0.1)}s" role="button" tabindex="0" aria-label="Ver detalles de solicitud ${req.reason} para ${pet ? pet.name : 'mascota'}" onclick="window.location.href='/miembros/detalle-solicitud?id=${req.id}'" onkeydown="if(event.key==='Enter'||event.key===' ') window.location.href='/miembros/detalle-solicitud?id=${req.id}'">
                <div style="width: 220px; flex-shrink: 0;"><h4 class="pata-history-id">${req.reason || 'Solicitud'}</h4><p class="pata-history-pet">${pet ? pet.name : 'Mascota'}</p></div>
                <div style="flex: 1; padding: 0 20px;">
                    <div class="pata-badge-type" style="border: 2px solid ${type.color};">
                        <div class="pata-badge-type-icon" style="background: ${type.color}; border: 2px solid ${type.color};"><img src="${type.icon}" alt=""></div>
                        ${type.label}
                    </div>
                    <div class="pata-history-row"><div class="pata-row-icon"><img src="${this.baseUrl}/Icons/clinica.png" alt=""></div><span class="pata-row-text">${req.clinic_name || 'Clínica Aliada'}</span></div>
                    <div class="pata-history-row"><div class="pata-row-icon"><img src="${this.baseUrl}/Icons/calendario.svg" alt=""></div><span class="pata-row-text">${new Date(req.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end; width: 220px; flex-shrink: 0;">
                    <div class="pata-history-row" style="margin-top: 0;"><div class="pata-row-icon"><img src="${req.type === 'reimbursement' ? this.baseUrl + '/Icons/reembolso.svg' : this.baseUrl + '/Icons/centros.png'}" alt=""></div><span class="pata-row-text">${req.type === 'reimbursement' ? 'Solicitud de reembolso' : 'Solicitud en centro aliado'}</span></div>
                    <div class="pata-status-badge" style="background: ${status.color};">
                        <div class="pata-status-badge-icon"><img src="${status.icon}" alt=""></div>
                        ${status.label}
                    </div>
                </div>
            </li>
        `;
    }

    renderLoading() {
        if (!this.container) return;
        this.container.innerHTML = '<div style="padding: 100px; text-align: center;"><div class="pata-spinner"></div><p style="margin-top: 20px; font-family: sans-serif; color: #718096;">Cargando tu manada...</p></div>';
    }

    renderError(msg) {
        if (!this.container) return;
        console.error('❌ SolidarityDashboard Error:', msg);
        this.container.innerHTML = '<div style="padding: 40px; text-align: center; color: #FF0066; font-family: sans-serif; font-weight: 600;">Error: ' + msg + '</div>';
    }
}

// Global error boundary
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.indexOf('solidarity-dashboard.js') !== -1) {
        const container = document.getElementById('pata-solidarity-dashboard');
        if (container) container.innerHTML = '<div style="padding: 40px; text-align: center; color: #FF0066;">Error crítico al cargar el dashboard.</div>';
    }
});

window.SolidarityDashboard = SolidarityDashboard;

const autoInitSolidarity = () => {
    try {
        const container = document.getElementById('pata-solidarity-dashboard');
        if (container && !window.PataSolidarityDashboard) {
            window.PataSolidarityDashboard = new SolidarityDashboard('pata-solidarity-dashboard');
        }
    } catch (err) { console.error('❌ Error during SolidarityDashboard auto-init:', err); }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInitSolidarity);
else autoInitSolidarity();