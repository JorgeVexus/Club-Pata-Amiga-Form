/**
 * 🐾 Club Pata Amiga — Solidarity Fund Dashboard Widget (Unified)
 * Consolidated widget for Manada management, Solidarity Fund access, AND inline request form.
 * Replaces both solidarity-dashboard.js and solidarity-request-form.js
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
            alliedCenters: [],
            placeholders: {
                pet: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png'
            }
        };

        // Form State (integrated from solidarity-request-form.js)
        this.formState = {
            view: 'dashboard', // 'dashboard' | 'form'
            loading: false,
            submitting: false,
            member: null,
            selection: {
                petId: null,
                requestType: null, // 'reimbursement' | 'allied_center_appointment'
                benefitType: null, // 'medical_emergency' | 'annual_vaccination' | 'death'
            },
            ui: {
                showAllPets: true,
            },
            formData: {
                caseTitle: '',
                caseDescription: '',
                incidentDate: new Date().toISOString().substring(0, 10),
                requestedAmount: '',
                totalPaidAmount: '',
                alliedCenterId: '',
                preferredAppointmentTime: '',
                clinicName: '',
                clinicPostalCode: '',
                clinicState: '',
                clinicCity: '',
                clinicAddress: '',
                vetName: '',
                vetLicense: '',
                bankName: '',
                bankClabe: '',
                bankHolder: ''
            },
            files: {
                evidencePhoto: null,
                prescription: null,
                receipt: null,
                seniorCertificate: null
            },
            previews: {
                evidencePhoto: null,
                prescription: null,
                receipt: null,
                seniorCertificate: null
            },
            error: null,
            success: false,
            successData: null
        };

        this.useMock = options.useMock || false;

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

        this.formState.member = member;
        const memberstackId = member.id;

        // Fetch everything from our API
        const [statsRes, historyRes, centersRes] = await Promise.all([
            fetch(`${this.apiUrl}/api/solidarity/stats?memberstackId=${memberstackId}`).then(r => r.json()),
            fetch(`${this.apiUrl}/api/solidarity/history?memberstackId=${memberstackId}`).then(r => r.json()),
            fetch(`${this.apiUrl}/api/solidarity/allied-centers`).then(r => r.json())
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

        if (centersRes.success) {
            this.data.alliedCenters = centersRes.centers || [];
        }

        // Fetch pet unsubscriptions
        try {
            const unsubRes = await fetch(`${this.apiUrl}/api/pet-unsubscriptions?memberstackId=${memberstackId}`);
            const unsubData = await unsubRes.json();

            if (unsubData.success && unsubData.unsubscriptions) {
                const unsubMap = new Map();
                unsubData.unsubscriptions.forEach(unsub => unsubMap.set(unsub.pet_id, unsub));

                this.data.pets = this.data.pets.map(pet => {
                    if (unsubMap.has(pet.id)) {
                        return { ...pet, is_active: false, isInactive: true };
                    }
                    return pet;
                });

                this.calculateStats();
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch pet unsubscriptions:', error.message);
        }

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
        this.data.alliedCenters = [
            { id: 'c1', name: 'Hospital Veterinario Pata Amiga Centro' },
            { id: 'c2', name: 'Clínica ProPet' }
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

    // ===== FORM METHODS (adapted from solidarity-request-form.js) =====

    showForm() {
        this.formState.view = 'form';
        this.formState.selection = { petId: null, requestType: null, benefitType: null };
        this.formState.ui.showAllPets = true;
        this.formState.formData = {
            caseTitle: '', caseDescription: '', incidentDate: new Date().toISOString().substring(0, 10),
            requestedAmount: '', totalPaidAmount: '', alliedCenterId: '', preferredAppointmentTime: '',
            clinicName: '', clinicPostalCode: '', clinicState: '', clinicCity: '', clinicAddress: '',
            vetName: '', vetLicense: '', bankName: '', bankClabe: '', bankHolder: ''
        };
        this.formState.files = { evidencePhoto: null, prescription: null, receipt: null, seniorCertificate: null };
        this.formState.previews = { evidencePhoto: null, prescription: null, receipt: null, seniorCertificate: null };
        this.formState.error = null;
        this.formState.success = false;
        this.formState.successData = null;
        this.formState.submitting = false;
        this.render();
    }

    hideForm() {
        this.formState.view = 'dashboard';
        this.formState.submitting = false;
        this.render();
    }

    async fetchBalances(petId) {
        if (!petId || this.useMock) return;
        try {
            const res = await fetch(`${this.apiUrl}/api/solidarity/balance?petId=${petId}`);
            const data = await res.json();
            if (data.success) {
                this.formState.balances = data.balances;
                this.render();
            }
        } catch (err) {
            console.error('❌ Error fetching balances:', err);
        }
    }

    validateForm() {
        const d = this.formState.formData;
        const f = this.formState.files;

        if (!this.formState.selection.petId || !this.formState.selection.requestType || !this.formState.selection.benefitType) return false;
        if (!d.caseDescription) return false;
        if (!f.evidencePhoto) return false;

        const isAppointment = this.formState.selection.requestType === 'allied_center_appointment';
        const isEmergency = this.formState.selection.benefitType === 'medical_emergency';

        if (isAppointment) {
            return !!(d.incidentDate && d.preferredAppointmentTime && d.caseTitle);
        } else {
            if (this.formState.balances && this.formState.selection.benefitType) {
                const balance = this.formState.balances[this.formState.selection.benefitType];
                const requested = parseFloat(d.requestedAmount || 0);
                if (requested > balance.available || requested <= 0) return false;
            }
            if (this.formState.selection.requestType === 'reimbursement') {
                if (!d.bankName || !d.bankClabe || !d.bankHolder) return false;
                if (d.bankClabe.length !== 18) return false;
            }
            if (isEmergency) {
                return !!(d.totalPaidAmount && d.clinicName && d.clinicPostalCode && d.clinicAddress && d.vetName);
            }
            return true;
        }
    }

    updateSubmitStatus() {
        const btn = this.container.querySelector('#pata-submit-btn');
        if (btn) btn.disabled = !this.validateForm() || this.formState.submitting;
    }

    // File handling
    handleFileChange(field, file) {
        if (!file) return;
        this.formState.files[field] = file;
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => { this.formState.previews[field] = e.target.result; this.render(); };
            reader.readAsDataURL(file);
        } else {
            this.formState.previews[field] = '📄';
            this.render();
        }
    }

    // ===== EVENT LISTENERS =====

    attachEventListeners() {
        // Dashboard listeners
        const searchInput = this.container.querySelector('#pata-history-search');
        const filterSelect = this.container.querySelector('#pata-history-filter');

        if (searchInput) searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        if (filterSelect) filterSelect.addEventListener('change', (e) => this.handleFilter(e.target.value));

        // Form listeners (only attach if in form view)
        if (this.formState.view === 'form') {
            this.attachFormEventListeners();
        }

        // Global buttons
        const showFormBtn = this.container.querySelector('#pata-show-form-btn, .pata-cta-row button');
        if (showFormBtn) {
            showFormBtn.onclick = (e) => {
                e.preventDefault();
                this.showForm();
            };
        }

        // Pet card "Utiliza tus beneficios" buttons
        this.container.querySelectorAll('.pata-pet-info button[onclick*="fondo-solidario"]').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showForm();
            };
        });
    }

    attachFormEventListeners() {
        const handlePetSelection = (id, e) => {
            if (e) e.stopPropagation();
            this.formState.selection.petId = id;
            this.formState.ui.showAllPets = false;
            this.formState.balances = null;
            this.fetchBalances(id);
            this.render();

            setTimeout(() => {
                const typeSection = this.container.querySelector('.pata-reveal.visible');
                if (typeSection) typeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        };

        const handleTypeSelection = (type) => { this.formState.selection.requestType = type; this.render(); };
        const handleBenefitSelection = (id) => {
            this.formState.selection.benefitType = id;
            if (id === 'annual_vaccination') this.formState.formData.requestedAmount = '300';
            else if (id === 'death') this.formState.formData.requestedAmount = '2000';
            else if (id === 'medical_emergency') this.formState.formData.requestedAmount = '';
            this.render();
        };

        // Pet selection
        this.container.querySelectorAll('.pata-pet-card:not(.disabled)').forEach(card => {
            const select = (e) => handlePetSelection(card.dataset.id, e);
            card.onclick = select;
            card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e); } };
        });

        // Cambiar mascota button
        this.container.querySelectorAll('.pata-scroll-to-type-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.formState.ui.showAllPets = true;
                this.formState.selection.petId = null;
                this.formState.selection.requestType = null;
                this.formState.selection.benefitType = null;
                this.formState.balances = null;
                this.render();
            };
        });

        // Request type
        this.container.querySelectorAll('.pata-type-card').forEach(card => {
            const select = () => handleTypeSelection(card.dataset.type);
            card.onclick = select;
            card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } };
        });

        // Benefit type
        this.container.querySelectorAll('.pata-benefit-card').forEach(card => {
            const select = (e) => {
                if (e.target.closest('.pata-benefit-expansion')) return;
                if (card.classList.contains('exhausted')) return;
                handleBenefitSelection(card.dataset.id);
            };
            card.onclick = select;
            card.onkeydown = (e) => {
                if (e.target.closest('.pata-benefit-expansion')) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e); }
            };
        });

        // Form fields
        const inputIds = ['case-desc', 'case-title', 'incident-date', 'pref-time', 'amount', 'total-paid', 'clinic-name', 'cp', 'state', 'city', 'address', 'vet-name', 'vet-license', 'center', 'bank-name', 'bank-clabe', 'bank-holder'];
        inputIds.forEach(id => {
            const el = this.container.querySelector(`#pata-${id}`);
            if (el) {
                el.oninput = () => {
                    let value = el.value;
                    if (id === 'cp' || id === 'bank-clabe') value = value.replace(/[^0-9]/g, '');
                    if (id === 'cp') value = value.substring(0, 5);
                    if (id === 'bank-clabe') {
                        value = value.substring(0, 18);
                        if (value.length >= 3) {
                            const bankCode = value.substring(0, 3);
                            const MEXICAN_BANKS = { "002": "BANAMEX", "012": "BBVA", "014": "SANTANDER", "021": "HSBC", "030": "BAJIO", "036": "INBURSA", "042": "MIFEL", "044": "SCOTIABANK", "058": "BANREGIO", "059": "INVEX", "062": "AFIRME", "072": "BANORTE", "106": "ACTINVER", "110": "BASE", "112": "MONEX", "127": "BANCO AZTECA", "128": "AUTOFIN", "138": "ABC CAPITAL", "147": "COMPARTAMOS", "148": "BANCO MULTIVA", "166": "BANCO DEL BIENESTAR", "601": "COPPEL", "638": "STP" };
                            const bankName = MEXICAN_BANKS[bankCode];
                            if (bankName) {
                                this.formState.formData.bankName = bankName;
                                const bankInput = this.container.querySelector('#pata-bank-name');
                                if (bankInput) bankInput.value = bankName;
                            }
                        }
                    }
                    if (id === 'amount' || id === 'total-paid') value = value.replace(/[^0-9.]/g, '');

                    const mapping = { 'case-desc': 'caseDescription', 'case-title': 'caseTitle', 'incident-date': 'incidentDate', 'pref-time': 'preferredAppointmentTime', 'amount': 'requestedAmount', 'total-paid': 'totalPaidAmount', 'clinic-name': 'clinicName', 'cp': 'clinicPostalCode', 'state': 'clinicState', 'city': 'clinicCity', 'address': 'clinicAddress', 'vet-name': 'vetName', 'vet-license': 'vetLicense', 'center': 'alliedCenterId', 'bank-name': 'bankName', 'bank-clabe': 'bankClabe', 'bank-holder': 'bankHolder' };
                    const stateKey = mapping[id];
                    if (stateKey) { this.formState.formData[stateKey] = value; if (id === 'cp' || id === 'bank-clabe') el.value = value; }
                    this.updateSubmitStatus();
                };
            }
        });

        // File uploads
        this.container.querySelectorAll('.pata-file-box').forEach(box => {
            const input = box.querySelector('input');
            const field = box.dataset.field;
            box.onclick = () => input.click();
            box.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
            input.onchange = (e) => this.handleFileChange(field, e.target.files[0]);
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => box.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false));
            ['dragenter', 'dragover'].forEach(eventName => box.addEventListener(eventName, () => box.classList.add('drag-over'), false));
            ['dragleave', 'drop'].forEach(eventName => box.addEventListener(eventName, () => box.classList.remove('drag-over'), false));
            box.addEventListener('drop', (e) => { this.handleFileChange(field, e.dataTransfer.files[0]); }, false);
        });

        // Actions
        const submitBtn = this.container.querySelector('#pata-submit-btn');
        if (submitBtn) submitBtn.onclick = () => this.handleSubmit();

        const cancelBtn = this.container.querySelector('#pata-cancel-btn');
        if (cancelBtn) cancelBtn.onclick = () => { if (confirm('¿Deseas cancelar la solicitud?')) this.hideForm(); };

        const closeSuccess = this.container.querySelector('#pata-close-success');
        if (closeSuccess) {
            closeSuccess.onclick = () => { window.location.href = '/miembros/fondo-solidario'; };
            closeSuccess.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSuccess.click(); } };
        }
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

    async handleSubmit() {
        if (this.formState.submitting) return;
        this.formState.submitting = true;
        this.updateSubmitStatus();

        try {
            const memberstackId = this.formState.member.id;
            const documents = [];

            for (const [key, file] of Object.entries(this.formState.files)) {
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('userId', memberstackId);
                    const mapping = { evidencePhoto: 'evidence_photo', seniorCertificate: 'senior_certificate' };
                    formData.append('docType', mapping[key] || key);

                    const uploadRes = await fetch(`${this.apiUrl}/api/upload/solidarity-document`, { method: 'POST', body: formData });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) throw new Error(`Error al subir ${key}: ${uploadData.error}`);

                    documents.push({ docType: mapping[key] || key, path: uploadData.path, fileName: uploadData.fileName, fileSize: uploadData.fileSize, mimeType: uploadData.mimeType });
                }
            }

            const payload = {
                memberstackId,
                petId: this.formState.selection.petId,
                requestType: this.formState.selection.requestType,
                benefitType: this.formState.selection.benefitType,
                ...this.formState.formData,
                documents,
                requestedAmount: parseFloat(this.formState.formData.requestedAmount) || 0,
                totalPaidAmount: parseFloat(this.formState.formData.totalPaidAmount) || 0
            };

            const response = await fetch(`${this.apiUrl}/api/solidarity/request`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                this.formState.successData = data.request;
                this.formState.success = true;
                this.render();
            } else throw new Error(data.error || 'No se pudo crear la solicitud.');
        } catch (error) {
            console.error('Submission Error:', error);
            alert('❌ ' + error.message);
        } finally {
            this.formState.submitting = false;
            this.updateSubmitStatus();
        }
    }

    // ===== RENDER METHODS =====

    renderStyles() {
        if (document.getElementById('pata-solidarity-dashboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'pata-solidarity-dashboard-styles';
        style.innerHTML = this.getStyles();
        document.head.appendChild(style);
    }

    getStyles() {
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
                --pata-input-bg: #96E2DC;
                --pata-input-bg-alt: #FFD2A1;
            }

            * { box-sizing: border-box; }

            #${this.containerId} { width: 100%; max-width: 1400px; margin: 0 auto; position: relative; min-height: 400px; }
            .pata-dashboard-wrapper { font-family: 'Outfit', sans-serif; color: var(--pata-black); width: 100%; display: flex; flex-direction: column; align-items: center; gap: 50px; }

            /* Header */
            .pata-header { width: 100%; max-width: 1400px; padding: 60px 40px 120px 40px; border-radius: 0 0 50px 50px; text-align: left; margin-bottom: -80px; background: var(--pata-turquoise); }
            .pata-header h1 { font-family: 'Fraiche', sans-serif; font-weight: 900; font-size: 64px; color: var(--pata-white); margin: 0; line-height: 1; }
            .pata-header p { font-size: 20px; color: var(--pata-white); opacity: 0.9; margin-top: 10px; }

            /* Main Card (Stats + Benefits) */
            .pata-main-card { background: var(--pata-white); border-radius: 50px; padding: 40px; margin: 20px auto; width: calc(100% - 40px); max-width: 1400px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); position: relative; z-index: 10; border: var(--pata-border); }
            .pata-status-title { font-weight: 900; font-size: 40px; margin: 0; color: var(--pata-black); font-family: 'Fraiche', sans-serif; }
            .pata-status-subtitle { font-size: 16px; color: var(--pata-gray); margin: 10px 0 30px 0; }
            .pata-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .pata-stat-box { background: var(--pata-red); border-radius: 30px; padding: 30px 20px; color: var(--pata-white); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; border: var(--pata-border); box-shadow: 4px 4px 0px var(--pata-black); }
            .pata-stat-number { font-weight: 900; font-size: 64px; line-height: 1; margin-bottom: 5px; }
            .pata-stat-label { font-size: 14px; font-weight: 600; line-height: 1.2; }
            .pata-benefits-summary { border-top: 1px solid #edf2f7; padding-top: 30px; }
            .pata-benefits-grid { display: flex; flex-wrap: wrap; gap: 40px; margin-top: 20px; justify-content: space-around; }
            .pata-benefit-item { display: flex; align-items: center; gap: 15px; }
            .pata-benefit-icon { width: 40px; height: 40px; }
            .pata-benefit-info h4 { font-size: 14px; margin: 0; color: var(--pata-gray); }
            .pata-benefit-info p { font-size: 24px; font-weight: 900; margin: 0; }
            .pata-btn { padding: 12px 30px; border-radius: 50px; font-weight: 800; font-family: 'Fraiche', sans-serif; cursor: pointer; transition: all 0.2s; border: var(--pata-border); box-shadow: 4px 4px 0px var(--pata-black); text-decoration: none; display: inline-block; text-align: center; text-transform: uppercase; }
            .pata-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px var(--pata-black); }
            .pata-btn-primary { background: var(--pata-red); color: white; font-size: 18px; padding: 15px 40px; }
            .pata-btn-orange { background: var(--pata-orange); color: var(--pata-black); font-size: 18px; padding: 15px 40px; }
            .pata-btn-orange:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px var(--pata-black); }
            .pata-btn-turquoise { background: var(--pata-turquoise); color: white; }
            .pata-cta-row { text-align: center; margin-top: 20px; }

            /* Layout: Pets + History */
            .pata-content-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; padding: 100px 35px; background-color: #eaeaea; width: 100%; box-sizing: border-box; }
            @media (max-width: 991px) { .pata-content-layout { grid-template-columns: 1fr; } .pata-header h1 { font-size: 48px; } }
            .pata-section-title { font-family: 'Fraiche', sans-serif; font-weight: 900; font-size: 100px; color: var(--pata-red); margin-bottom: 30px; text-transform: uppercase; }
            .pata-history-title { font-size: 50px; color: var(--pata-white) !important; }
            @media (max-width: 767px) { .pata-history-title { font-size: 32px; } .pata-section-title { font-size: 48px; } }
            @media (max-width: 480px) { .pata-history-title { font-size: 20px !important; } .pata-section-title { font-size: 36px; } }

            /* Pet Cards */
            .pata-pet-list { display: flex; flex-direction: column; gap: 24px; width: 100%; }
            .pata-pet-card { background: #FFFFFF; border-radius: 35px; padding: 24px; display: flex; gap: 28px; align-items: center; box-shadow: 0 8px 30px rgba(0,0,0,0.06); transition: transform 0.3s; position: relative; border: var(--pata-border); max-width: 100%; box-sizing: border-box; cursor: pointer; }
            .pata-pet-card.pata-inactive-card { background: #F1F3F4 !important; }
            .pata-pet-photo { width: 150px; height: 150px; border-radius: 30px; object-fit: cover; border: var(--pata-border); flex-shrink: 0; }
            .pata-pet-photo.pata-grayscale { filter: grayscale(100%) !important; opacity: 0.7 !important; transition: all 0.5s ease; }
            .pata-pet-name { font-weight: 900; font-size: 32px; color: var(--pata-turquoise); margin: 0; font-family: 'Fraiche', sans-serif; }
            .pata-pet-badge-new { position: absolute; top: 20px; right: 20px; background: #FEE2E2; color: var(--pata-red); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid var(--pata-red); }
            .pata-pet-info { flex: 1; }
            .pata-pet-info p { font-size: 14px; margin: 5px 0; color: var(--pata-gray); font-weight: 600; }
            .pata-pet-info button { margin-top: 10px; font-size: 12px; padding: 8px 15px; background: var(--pata-light-turquoise); border: var(--pata-border); border-radius: 50px; font-weight: 800; cursor: pointer; text-transform: uppercase; color: var(--pata-black); width: fit-content; }
            .pata-pet-info button.pata-btn-orange { background: var(--pata-orange); color: var(--pata-black); }

            /* History Panel */
            .pata-history-panel { background: var(--pata-turquoise); border-radius: 40px; padding: 35px; color: white; border: var(--pata-border); box-shadow: 6px 6px 0px var(--pata-black); }
            .pata-history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 20px; flex-wrap: wrap; }
            .pata-history-header input, .pata-history-header select { background: white; border: var(--pata-border); padding: 12px 24px; border-radius: 50px; font-family: inherit; font-weight: 600; font-size: 16px; outline: none; box-shadow: 4px 4px 0px var(--pata-black); color: var(--pata-black) !important; min-width: 200px; }
            .pata-history-header input { flex: 1; }
            .pata-history-header select { min-width: 180px; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231A1A1A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 20px top 50%; background-size: 12px auto; }

            .pata-history-item { background: white; border-radius: 25px; padding: 20px 25px; color: var(--pata-black); display: grid; grid-template-columns: 1.5fr 1.5fr 1fr; gap: 20px; align-items: center; border: var(--pata-border); margin-bottom: 15px; cursor: pointer; }
            .pata-history-item:hover { transform: scale(1.02); }
            .pata-history-id { font-family: 'Fraiche', sans-serif; font-size: 20px; color: var(--pata-black); margin: 0; text-transform: uppercase; }
            .pata-history-pet { font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 20px; margin: 0; color: var(--pata-gray); }
            .pata-badge-type { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 14px 0 37px; border-radius: 50px; border: var(--pata-border); font-family: 'Fraiche', sans-serif; font-size: 14px; position: relative; width: fit-content; }
            .pata-badge-type-icon { position: absolute; left: -2px; top: -2px; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .pata-badge-type-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
            .pata-history-row { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
            .pata-row-icon { width: 28px; height: 28px; background: black; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .pata-row-icon img { width: 16px; height: 16px; }
            .pata-row-text { font-family: 'Fraiche', sans-serif; font-size: 14px; color: black; }
            .pata-status-badge { display: flex; align-items: center; gap: 10px; height: 28px; padding: 0 12px 0 35px; border-radius: 50px; font-family: 'Fraiche', sans-serif; font-size: 14px; position: relative; width: fit-content; color: black; }
            .pata-status-badge-icon { position: absolute; left: 0; top: 0; width: 28px; height: 28px; border-radius: 50%; background: black; display: flex; align-items: center; justify-content: center; }
            .pata-status-badge-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }

            /* Form Styles */
            .pata-form-page { font-family: 'Outfit', sans-serif; color: var(--pata-black); width: 100%; position: relative; animation: pataFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            @media (max-width: 768px) { .pata-form-page { padding: 0 10px; } }
            .pata-section-header { margin: 40px 0 30px 0; width: 100%; text-align: left; }
            @media (max-width: 768px) { .pata-section-header { text-align: center; margin: 30px 0 25px 0; } }
            .pata-section-header h2 { font-family: 'Fraiche', sans-serif; font-size: 32px; margin: 0 0 8px 0; line-height: 1.1; color: var(--pata-black); }
            .pata-section-header p { font-size: 18px; color: #718096; margin: 0; font-weight: 500; }

            .pata-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0s 0.5s; pointer-events: none; height: 0; overflow: hidden; padding: 0 50px; width: 100%; }
            .pata-reveal.visible { opacity: 1; transform: translateY(0); pointer-events: auto; height: auto; margin-bottom: 40px; padding-bottom: 30px; transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0s; }
            @media (max-width: 768px) { .pata-reveal { padding: 0; } }

            /* Pet Grid (Step 1) */
            .pata-pet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 25px; margin-top: 20px; width: 100%; }
            @media (max-width: 768px) { .pata-pet-grid { grid-template-columns: 1fr; gap: 20px; justify-items: center; } }
            .pata-pet-card.form-pet-card { cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); padding: 15px; border-radius: 45px; border: 2px solid transparent; outline: none; background: white; }
            .pata-pet-card.form-pet-card:focus-visible { border-color: var(--pata-black); box-shadow: 0 0 0 4px var(--pata-turquoise); }
            .pata-pet-card.form-pet-card:hover { transform: translateY(-5px); }
            .pata-pet-card.form-pet-card.selected { background: var(--pata-orange); border-color: var(--pata-black); transform: scale(1.05); z-index: 10; animation: pata-pulse 2s ease-in-out infinite; }
            .pata-pet-card.form-pet-card.selected h4 { color: white; }
            .pata-pet-card.form-pet-card.disabled { opacity: 0.6; cursor: not-allowed; }
            .pata-pet-img-wrap { width: 100%; aspect-ratio: 1; border-radius: 35px; overflow: hidden; margin-bottom: 15px; border: 2.5px solid var(--pata-black); background: #E2E8F0; }
            @media (max-width: 768px) { .pata-pet-img-wrap { max-width: 220px; margin: 0 auto 15px auto !important; } }
            .pata-pet-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
            .pata-pet-card.form-pet-card h4 { font-family: 'Fraiche', sans-serif; font-size: 28px; margin: 0 0 12px 10px; font-weight: 900; letter-spacing: -0.5px; }
            @media (max-width: 768px) { .pata-pet-card.form-pet-card h4 { font-size: 24px; text-align: center; margin-left: 0; } }
            .pata-pet-badge-pill { display: inline-flex; align-items: center; gap: 10px; background: var(--pata-lime); color: var(--pata-black); padding: 10px 20px; border-radius: 35px; border: var(--pata-border); font-size: 14px; font-weight: 800; box-shadow: 2px 2px 0px var(--pata-black); }
            .pata-pet-badge-pill.waiting { background: #CBD5E0; opacity: 0.7; box-shadow: none; }
            .pata-pet-badge-pill .check-icon { width: 20px; height: 20px; background: var(--pata-black); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .pata-pet-badge-pill .check-icon svg { width: 12px; height: 12px; color: var(--pata-lime); }
            @media (max-width: 768px) { .pata-pet-badge-pill { width: 100%; justify-content: center; } }

            /* Request Type (Step 2) */
            .pata-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 20px; padding-bottom: 30px; width: 100%; }
            @media (max-width: 600px) { .pata-type-grid { grid-template-columns: 1fr; gap: 20px; max-width: 320px; margin: 20px auto 30px; } }
            .pata-type-card { background: var(--pata-turquoise); border-radius: 40px; padding: 35px; color: white; cursor: pointer; position: relative; border: var(--pata-border); transition: all 0.3s; display: flex; flex-direction: column; min-height: 160px; box-shadow: 4px 4px 0px var(--pata-black); outline: none; }
            @media (max-width: 600px) { .pata-type-card { min-height: 140px; padding: 30px 25px; text-align: center; align-items: center; box-shadow: 2px 2px 0px var(--pata-black); } }
            .pata-type-card:focus-visible { box-shadow: 0 0 0 4px var(--pata-orange); }
            .pata-type-card h3 { font-family: 'Fraiche', sans-serif; font-size: 28px; margin: 0 0 8px 0; line-height: 1; }
            @media (max-width: 600px) { .pata-type-card h3 { font-size: 24px; } }
            .pata-type-card p { font-size: 16px; margin: 0; opacity: 0.95; line-height: 1.3; font-weight: 500; }
            @media (max-width: 600px) { .pata-type-card p { font-size: 15px; } }
            .pata-type-icon { position: absolute; top: -15px; right: -15px; width: 65px; height: 65px; background: var(--pata-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: var(--pata-border); box-shadow: 4px 4px 0px var(--pata-black); transition: all 0.3s; padding: 12px; }
            @media (max-width: 600px) { .pata-type-icon { right: -10px; width: 55px; height: 55px; } }
            .pata-type-icon img { width: 100%; height: 100%; object-fit: contain; }
            .pata-type-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 8px 8px 0px var(--pata-black); }
            .pata-type-card.selected { background: var(--pata-lime); transform: scale(1.02); z-index: 5; animation: pata-pulse 2s ease-in-out infinite; }
            .pata-type-card.selected .pata-type-icon { background: var(--pata-turquoise); transform: rotate(10deg) scale(1.1); }

            .pata-reimbursement-badge { display: flex; align-items: flex-start; gap: 16px; margin-top: 20px; padding: 20px 24px; background: var(--pata-input-bg-alt); border: var(--pata-border); border-radius: 30px; box-shadow: 4px 4px 0px var(--pata-black); animation: pata-slide-in 0.4s ease-out; }
            @keyframes pata-slide-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            @media (max-width: 768px) { .pata-reimbursement-badge { padding: 16px 20px; gap: 12px; border-radius: 24px; } }
            .pata-badge-icon { width: 40px; height: 40px; background: var(--pata-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: var(--pata-border); box-shadow: 2px 2px 0px var(--pata-black); }
            .pata-badge-icon svg { width: 22px; height: 22px; color: white; }
            .pata-badge-text { flex: 1; min-width: 0; color: var(--pata-black); line-height: 1.5; }
            .pata-badge-text strong { display: block; font-family: 'Fraiche', sans-serif; font-size: 17px; margin-bottom: 6px; }
            .pata-badge-text span { font-size: 14px; font-weight: 500; opacity: 0.9; }

            /* Benefit Cards (Step 3) */
            .pata-benefit-list { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; padding-bottom: 30px; width: 100%; }
            .pata-benefit-card { background: var(--pata-turquoise); border-radius: 50px; padding: 20px 40px; color: white; cursor: pointer; display: flex; flex-wrap: wrap; align-items: center; gap: 25px; border: var(--pata-border); transition: all 0.3s; box-shadow: 4px 4px 0px var(--pata-black); outline: none; width: 100%; }
            @media (max-width: 768px) { .pata-benefit-card { padding: 25px 20px; gap: 15px; border-radius: 35px; max-width: 350px; margin: 0 auto; justify-content: center; text-align: center; } }
            .pata-benefit-card:focus-visible { border-color: var(--pata-orange); }
            .pata-benefit-card:hover { transform: translateX(8px); background: var(--pata-turquoise-light); }
            .pata-benefit-card.selected { background: var(--pata-orange); transform: scale(1.01); }
            .pata-benefit-card.exhausted { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.8); }
            .pata-benefit-icon { width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid var(--pata-black); flex-shrink: 0; padding: 10px; }
            @media (max-width: 768px) { .pata-benefit-icon { margin-bottom: 5px; } }
            .pata-benefit-icon img { width: 100%; height: 100%; object-fit: contain; }
            .pata-benefit-info { flex: 1; min-width: 250px; }
            @media (max-width: 768px) { .pata-benefit-info { min-width: 100%; } }
            .pata-benefit-info h3 { font-family: 'Fraiche', sans-serif; font-size: 26px; margin: 0 0 4px 0; }
            @media (max-width: 768x) { .pata-benefit-info h3 { font-size: 22px; } }
            .pata-benefit-info p { font-size: 14px; margin: 0; opacity: 0.9; line-height: 1.3; }
            .pata-benefit-amount { text-align: right; }
            @media (max-width: 768px) { .pata-benefit-amount { text-align: center; width: 100%; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px; } }
            .pata-benefit-amount .val { font-family: 'Fraiche', sans-serif; font-size: 24px; display: block; line-height: 1; }
            .pata-benefit-amount .sub { font-size: 13px; opacity: 0.8; font-weight: 700; }

            /* Expansion for Medical Emergency */
            .pata-benefit-expansion { width: 100%; margin-top: 30px; border-top: 1.5px solid rgba(255,255,255,0.25); padding-top: 30px; }
            .pata-exp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            @media (max-width: 768px) { .pata-exp-grid { grid-template-columns: 1fr; gap: 20px; } .pata-exp-input-wrap { padding: 0 20px; } }
            .pata-exp-field label { display: block; font-size: 16px; font-weight: 800; margin-bottom: 12px; }
            @media (max-width: 768px) { .pata-exp-field label { font-size: 14px; text-align: center; } }
            .pata-exp-input-wrap { position: relative; background: var(--pata-input-bg-alt); border-radius: 35px; padding: 0 30px; display: flex; align-items: center; border: 2px solid transparent; transition: border 0.2s; }
            .pata-exp-input-wrap:focus-within { border-color: var(--pata-black); }
            .pata-exp-input-wrap input { background: transparent; border: none; width: 100%; padding: 18px 0; font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--pata-black); font-size: 18px; outline: none; }
            @media (max-width: 768px) { .pata-exp-input-wrap input { text-align: center; font-size: 16px; } }
            .pata-exp-input-wrap .suffix { font-weight: 800; opacity: 0.7; font-size: 14px; }
            .pata-exp-sub { font-size: 12px; font-weight: 800; margin-top: 8px; text-align: right; color: rgba(24,28,28,0.7); }
            @media (max-width: 768px) { .pata-exp-sub { text-align: center; } }

            /* Form Container (Step 4) */
            .pata-form-container { background: var(--pata-turquoise); border-radius: 60px; padding: 50px; margin-top: 20px; border: var(--pata-border); box-shadow: 6px 6px 0px var(--pata-black); width: 100%; }
            @media (max-width: 768px) { .pata-form-container { padding: 20px 15px; border-radius: 40px; } }
            .pata-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
            @media (max-width: 768px) { .pata-form-grid { grid-template-columns: 1fr; gap: 20px; } }
            .pata-field { margin-bottom: 25px; }
            .pata-field.full { grid-column: span 2; }
            @media (max-width: 768px) { .pata-field.full { grid-column: span 1; } }
            .pata-label { display: block; font-weight: 800; font-size: 17px; margin-bottom: 12px; color: white; text-shadow: 1px 1px 0px rgba(0,0,0,0.1); }
            @media (max-width: 768px) { .pata-label { text-align: center; margin-bottom: 8px; } }
            .pata-input, .pata-textarea, .pata-select { width: 100%; padding: 18px 30px; border-radius: 35px; border: 2px solid transparent; background: var(--pata-input-bg); font-family: 'Outfit', sans-serif; font-size: 16px; color: var(--pata-black); font-weight: 600; transition: all 0.2s; outline: none; appearance: none; -webkit-appearance: none; }
            @media (max-width: 768px) { .pata-input, .pata-textarea, .pata-select { text-align: center; padding: 18px 20px; } }
            .pata-input:focus, .pata-textarea:focus, .pata-select:focus { border-color: var(--pata-black); background: white; }
            .pata-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23181C1C' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 25px center; background-size: 18px; padding-right: 60px; cursor: pointer; }
            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23181C1C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E"); cursor: pointer; opacity: 0.8; transition: opacity 0.2s; }
            input[type="time"]::-webkit-calendar-picker-indicator { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23181C1C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E"); }
            input[type="date"]::-webkit-calendar-picker-indicator:hover, input[type="time"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
            .pata-textarea { min-height: 140px; resize: none; border-radius: 25px; padding-top: 20px; }

            /* File Boxes */
            .pata-file-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; margin-bottom: 35px; width: 100%; }
            @media (max-width: 768px) { .pata-file-grid { grid-template-columns: 1fr; gap: 15px; } .pata-file-box { flex-direction: column; padding: 30px 20px; text-align: center; min-height: 180px; } .pata-file-box p { text-align: center; } .pata-file-box .icon-up { margin: 0 0 15px 0; } }
            .pata-file-box { background: var(--pata-input-bg); border-radius: 40px; padding: 25px; text-align: center; cursor: pointer; display: flex; align-items: center; gap: 20px; position: relative; overflow: hidden; border: 2.5px dashed rgba(255,255,255,0.4); min-height: 110px; transition: all 0.3s; outline: none; }
            .pata-benefit-expansion .pata-file-box { background: var(--pata-input-bg-alt); border-style: dashed; border-color: rgba(24,28,28,0.2); }
            .pata-file-box:focus-visible { border-style: solid; border-color: white; }
            .pata-file-box:hover, .pata-file-box.drag-over { border-color: var(--pata-white); transform: translateY(-3px) scale(1.02); border-style: solid; }
            .pata-file-box.has-file { background: white !important; border-style: solid; border-color: var(--pata-lime); }
            .pata-file-box .icon-up { width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: var(--pata-border); box-shadow: 3px 3px 0px var(--pata-black); z-index: 2; }
            .pata-file-box .icon-up img { width: 35px; height: 35px; }
            .pata-file-box p { font-size: 15px; font-weight: 700; text-align: left; margin: 0; line-height: 1.2; color: var(--pata-black); z-index: 2; }
            @media (max-width: 768px) { .pata-file-box p { text-align: center; } }
            .pata-file-box span { font-size: 12px; opacity: 0.7; display: block; font-weight: 500; margin-top: 4px; }
            .pata-preview { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: 0.3; }

            .pata-form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 20px; width: 100%; }
            @media (max-width: 768px) { .pata-form-actions { flex-direction: column-reverse; gap: 20px; } }
            .pata-cancel-link { font-family: 'Fraiche', sans-serif; font-size: 20px; color: var(--pata-black); text-decoration: none; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; outline: none; background: transparent; border: none; }
            .pata-cancel-link:hover { opacity: 1; }
            .pata-cancel-link:focus-visible { text-decoration: underline; }
            .pata-btn-submit { font-family: 'Fraiche', sans-serif; background: var(--pata-orange); border: var(--pata-border); color: white; padding: 18px 50px; border-radius: 50px; font-size: 24px; cursor: pointer; box-shadow: 5px 5px 0px var(--pata-black); transition: all 0.2s; outline: none; }
            @media (max-width: 768px) { .pata-btn-submit { width: 100%; padding: 18px 20px; font-size: 20px; } }
            .pata-btn-submit:focus-visible { transform: scale(1.05); }
            .pata-btn-submit:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 7px 7px 0px var(--pata-black); }
            .pata-btn-submit:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 2px 2px 0px var(--pata-black); }
            .pata-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }

            /* Success Modal */
            .pata-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 10000; padding: 15px; backdrop-filter: blur(10px); }
            .pata-modal-overlay.active { display: flex; }
            .pata-modal-content { background: white; width: 100%; max-width: 850px; border-radius: 50px; padding: 60px; position: relative; border: 3px solid var(--pata-black); text-align: left; box-shadow: 10px 10px 0px var(--pata-black); max-height: 90vh; overflow-y: auto; font-family: 'Outfit', sans-serif; }
            @media (max-width: 768px) { .pata-modal-content { padding: 40px 20px 30px 20px; border-radius: 40px; width: 95%; box-shadow: 5px 5px 0px var(--pata-black); } .pata-modal-close { top: 15px; right: 15px; width: 25px; height: 25px; } .pata-modal-check { width: 60px; height: 60px; margin-bottom: 20px; } .pata-modal-content h2 { font-size: 26px; margin-bottom: 10px; } .pata-modal-body { font-size: 16px; } .pata-modal-body p { margin-bottom: 15px; } }
            .pata-modal-close { position: absolute; top: 40px; right: 40px; cursor: pointer; width: 35px; height: 35px; transition: transform 0.2s; }
            .pata-modal-close:hover { transform: rotate(90deg); }
            .pata-modal-check { width: 120px; height: 120px; margin: 0 auto 40px auto; display: block; }
            .pata-modal-content h2 { font-family: 'Fraiche', sans-serif; font-size: 56px; text-align: center; margin-bottom: 12px; line-height: 0.9; }
            .pata-modal-content p.subtitle { font-size: 22px; text-align: center; color: #718096; margin-bottom: 50px; font-weight: 600; }
            .pata-modal-body { font-size: 19px; line-height: 1.6; color: var(--pata-black); }
            .pata-modal-body p { margin-bottom: 25px; font-weight: 500; }
            .pata-modal-footer { margin-top: 50px; text-align: center; font-weight: 900; font-family: 'Fraiche', sans-serif; font-size: 20px; }

            /* Animations */
            .pata-spinner { border: 4px solid rgba(0,0,0,0.1); border-left-color: var(--pata-orange); border-radius: 50%; width: 40px; height: 40px; animation: pata-spin 1s linear infinite; margin: 0 auto; }
            @keyframes pata-spin { to { transform: rotate(360deg); } }
            @keyframes pataFadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pata-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(21, 190, 178, 0.6); } 50% { box-shadow: 0 0 0 12px rgba(21, 190, 178, 0); } }
            .pata-animate-entry { animation: pataFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
            .pata-pet-card:hover, .pata-history-item:hover, .pata-pet-card.form-pet-card:hover { border-color: var(--pata-turquoise); transform: translateY(-4px) scale(1.01); box-shadow: 8px 8px 0px var(--pata-black); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .pata-status-badge { transition: transform 0.2s; }
            .pata-status-badge:hover { transform: scale(1.05); }

            /* Responsive: Mobile adjustments for dashboard view */
            @media (max-width: 768px) {
                .pata-dashboard-wrapper { gap: 30px; }
                .pata-header { padding: 40px 20px 80px 20px; text-align: center; margin-bottom: -60px; }
                .pata-header h1 { font-size: 40px; }
                .pata-main-card { padding: 25px 20px; border-radius: 30px; margin: 10px; }
                .pata-status-title { font-size: 28px; }
                .pata-stat-number { font-size: 48px; }
                .pata-benefits-grid { flex-direction: column; gap: 20px; align-items: flex-start; }
                .pata-benefit-item { width: 100%; }
                .pata-pet-list { gap: 16px; }
                .pata-pet-card { flex-direction: column; text-align: center; padding: 20px; gap: 15px; width: 100%; }
                .pata-pet-photo { width: 120px; height: 120px; margin: 0 auto; flex-shrink: 0; }
                .pata-pet-name { font-size: 24px; word-wrap: break-word; overflow-wrap: break-word; }
                .pata-pet-info { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .pata-pet-info p { max-width: 100%; word-wrap: break-word; }
                .pata-pet-info button { width: 100%; max-width: 280px; white-space: normal; word-wrap: break-word; }
                .pata-pet-badge-new { position: static; display: inline-block; margin-bottom: 10px; }
                .pata-history-panel { padding: 20px; border-radius: 30px; }
                .pata-history-header { flex-direction: column; align-items: stretch; gap: 15px; }
                .pata-history-header input { width: 100% !important; margin: 0 !important; }
                .pata-history-header select { width: 100% !important; margin: 0 !important; }
                .pata-history-item { display: flex; flex-direction: column; align-items: flex-start; gap: 15px; padding: 20px; }
                .pata-history-item > div { width: 100% !important; flex-shrink: 1 !important; padding: 0 !important; }
                .pata-history-item > div:last-child { align-items: flex-start !important; border-top: 1px solid #eee; padding-top: 15px; }
            }
            @media (max-width: 480px) {
                .pata-header { padding: 30px 15px 60px 15px; }
                .pata-header h1 { font-size: 32px; }
                .pata-main-card { padding: 20px 15px; border-radius: 20px; margin: 5px; }
                .pata-pet-card { padding: 15px; border-radius: 25px; }
                .pata-pet-photo { width: 100px; height: 100px; }
                .pata-pet-name { font-size: 20px; }
                .pata-pet-info button { font-size: 11px; padding: 8px 12px; max-width: 100%; }
                .pata-section-title { font-size: 20px !important; }
            }
        `;
    }

    render() {
        this.renderStyles();

        if (this.formState.view === 'form') {
            this.renderFormView();
        } else {
            this.renderDashboardView();
        }
    }

    renderDashboardView() {
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

                <!-- Success Modal (shared) -->
                ${this.renderSuccessModal()}
            </div>
        `;
        this.attachEventListeners();
    }

    renderFormView() {
        this.container.innerHTML = `
            <div class="pata-dashboard-wrapper">
                <header class="pata-header" style="padding-bottom: 80px; margin-bottom: 0;">
                    <h1>solicitar apoyo</h1>
                    <p>Completa el formulario para crear una nueva solicitud de apoyo económico</p>
                </header>

                <main style="width: 100%; max-width: 1400px;">
                    <div class="pata-form-page">
                        ${this.renderFormStep1()}
                        ${this.renderFormStep2()}
                        ${this.renderFormStep3()}
                        ${this.renderFormStep4()}
                    </div>

                    ${this.renderSuccessModal()}
                </main>
            </div>
        `;
        this.attachEventListeners();
    }

    renderFormStep1() {
        return `
            <div class="pata-section">
                <div class="pata-section-header pata-animate-entry" style="animation-delay: 0.1s;">
                    <h2>¿Para cuál de tus compañeros es la solicitud?</h2>
                    <p>Selecciona la mascota que necesite apoyo</p>
                </div>
                <div class="pata-reveal visible">
                    <div class="pata-pet-grid">
                        ${this.formState.ui.showAllPets ? this.data.pets.map(pet => {
                            const isApproved = pet.status === 'approved';
                            const carencia = this.calculateCarencia(pet);
                            const hasFinishedWaiting = !carencia.isWaiting;
                            const isEligible = isApproved && hasFinishedWaiting;
                            const isSelected = this.formState.selection.petId === pet.id;
                            const photoUrl = pet.photo_url || pet.primary_photo_url || 'https://app.pataamiga.mx/Assets/placeholder-pet.png';
                            let statusLabel = 'Apoyo activo';
                            let statusClass = '';
                            if (!isApproved) { statusLabel = 'Pendiente aprobación'; statusClass = 'waiting'; }
                            else if (!hasFinishedWaiting) { statusLabel = 'En espera'; statusClass = 'waiting'; }
                            return `
                                <div class="pata-pet-card form-pet-card ${isSelected ? 'selected' : ''} ${!isEligible ? 'disabled' : ''}"
                                     data-id="${pet.id}" role="button" tabindex="${!isEligible ? '-1' : '0'}" aria-pressed="${isSelected}"
                                     style="${!isEligible ? 'opacity: 0.7; cursor: not-allowed;' : ''}">
                                    <div class="pata-pet-img-wrap"><img src="${photoUrl}" alt="${pet.name}" onerror="this.src='https://app.pataamiga.mx/Assets/placeholder-pet.png'"></div>
                                    <h4>${pet.name}</h4>
                                    <div class="pata-pet-badge-pill ${statusClass}">
                                        <div class="check-icon" style="${!isEligible ? 'background: #718096;' : ''}">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        ${statusLabel}
                                    </div>
                                </div>
                            `;
                        }).join('') : (() => {
                            const selectedPet = this.data.pets.find(p => p.id === this.formState.selection.petId);
                            if (!selectedPet) return '';
                            const photoUrl = selectedPet.photo_url || selectedPet.primary_photo_url || 'https://app.pataamiga.mx/Assets/placeholder-pet.png';
                            return `
                                <div class="pata-pet-card form-pet-card selected" data-id="${selectedPet.id}" style="max-width: 250px;">
                                    <div class="pata-pet-img-wrap"><img src="${photoUrl}" alt="${selectedPet.name}" onerror="this.src='https://app.pataamiga.mx/Assets/placeholder-pet.png'"></div>
                                    <h4 style="text-align: center; margin-left: 0;">${selectedPet.name}</h4>
                                    <div class="pata-pet-badge-pill" style="background: var(--pata-lime);">
                                        <div class="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                                        Mascota seleccionada
                                    </div>
                                    <button type="button" class="pata-btn pata-btn-secondary pata-scroll-to-type-btn" style="margin-top: 15px; width: 100%; justify-content: center;">Cambiar de mascota</button>
                                </div>
                            `;
                        })()}
                    </div>
                </div>
            </div>
        `;
    }

    renderFormStep2() {
        return `
            <div class="pata-reveal ${this.formState.selection.petId ? 'visible' : ''}">
                <div class="pata-section-header pata-animate-entry" style="animation-delay: 0.2s;">
                    <h2>Tipo de solicitud</h2>
                    <p>¿Cómo podemos apoyarte?</p>
                </div>
                <div class="pata-type-grid">
                    <div class="pata-type-card ${this.formState.selection.requestType === 'allied_center_appointment' ? 'selected' : ''}"
                         data-type="allied_center_appointment" role="button" tabindex="0"
                         aria-pressed="${this.formState.selection.requestType === 'allied_center_appointment'}">
                        <h3>cita en centro aliado</h3>
                        <p>Agenda una consulta directamente con nuestra red de veterinarias.</p>
                        <div class="pata-type-icon"><img src="${this.baseUrl}/Icons/centro-white.png"></div>
                    </div>
                    <div class="pata-type-card ${this.formState.selection.requestType === 'reimbursement' ? 'selected' : ''}"
                         data-type="reimbursement" role="button" tabindex="0"
                         aria-pressed="${this.formState.selection.requestType === 'reimbursement'}">
                        <h3>solicitud de reembolso</h3>
                        <p>si ya pagaste, sube tu comprobante y te reintegramos el monto.</p>
                        <div class="pata-type-icon"><img src="${this.baseUrl}/Icons/reembolso-white.png"></div>
                    </div>
                </div>
                ${this.formState.selection.requestType === 'reimbursement' ? `
                    <div class="pata-reimbursement-badge pata-animate-entry" style="animation-delay: 0.3s;" role="alert">
                        <div class="pata-badge-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
                        <div class="pata-badge-text">
                            <strong>¡Importante para tu seguridad!</strong>
                            Recuerda que el titular de la cuenta bancaria debe ser el mismo que registraste en tu membresía. Hacemos esto por tu seguridad: si los datos no coinciden, el movimiento no podrá procesarse y el depósito no se realizará, incluso si la solicitud ya fue aprobada por nuestro equipo. ¡Ayúdanos a cuidar tu cuenta!
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderFormStep3() {
        const benefits = [
            { id: 'medical_emergency', title: 'emergencia médica', desc: 'Para situaciones inesperadas que requieren atención veterinaria urgente.', icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-emergencias_pbfplq.svg', amount: 3000 },
            { id: 'annual_vaccination', title: 'vacunación anual', desc: 'Apoyo para cubrir la vacuna anual de una de tus mascotas.', icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/Icon-vacuna_ybuall.svg', amount: 300 },
            { id: 'death', title: 'fallecimiento', desc: 'Te acompañamos en un momento difícil con un apoyo para gastos de despedida.', icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-fallecimiento_xwqe2g.png', amount: 2000 }
        ];

        return `
            <div class="pata-reveal ${this.formState.selection.petId && this.formState.selection.requestType ? 'visible' : ''}">
                <div class="pata-section-header pata-animate-entry" style="animation-delay: 0.3s;">
                    <h2>Estamos contigo, ¿qué tipo de ayuda requiere tu mascota?</h2>
                    <p>Selecciona el tipo de solicitud</p>
                </div>
                <div class="pata-benefit-list">
                    ${benefits.map(b => {
                        const isSelected = this.formState.selection.benefitType === b.id;
                        const isEmergency = b.id === 'medical_emergency';
                        const balance = this.formState.balances ? this.formState.balances[b.id] : null;
                        const available = balance ? balance.available : b.amount;
                        const isExhausted = balance && balance.available <= 0;
                        const requested = parseFloat(this.formState.formData.requestedAmount || 0);
                        const isExceeding = balance && requested > balance.available;
                        return `
                            <div class="pata-benefit-card ${isSelected ? 'selected' : ''} ${isExhausted ? 'exhausted' : ''}"
                                 data-id="${b.id}" role="button" tabindex="${isExhausted ? '-1' : '0'}"
                                 aria-pressed="${isSelected}" style="${isExhausted ? 'opacity: 0.6; cursor: not-allowed; filter: grayscale(0.8);' : ''}">
                                <div class="pata-benefit-icon"><img src="${b.icon}"></div>
                                <div class="pata-benefit-info">
                                    <h3>${b.title}</h3>
                                    <p>${isExhausted ? '<span style="color:#FFD2A1; font-weight:800;">Límite anual alcanzado</span>' : b.desc}</p>
                                </div>
                                <div class="pata-benefit-amount">
                                    <span class="val">$${available.toLocaleString()} MXN</span>
                                    <span class="sub">${this.formState.balances ? 'Disponible' : 'Por año'}</span>
                                </div>
                                ${isSelected && isEmergency ? `
                                    <div class="pata-benefit-expansion" role="group" aria-label="Detalles de emergencia médica">
                                        <div class="pata-exp-grid">
                                            <div class="pata-exp-field">
                                                <label for="pata-total-paid">Monto total pagado a la clínica</label>
                                                <div class="pata-exp-input-wrap">
                                                    <input type="number" id="pata-total-paid" placeholder="$0.00" value="${this.formState.formData.totalPaidAmount}">
                                                    <span class="suffix">MXN</span>
                                                </div>
                                            </div>
                                            <div class="pata-exp-field">
                                                <label for="pata-amount">Monto solicitado de apoyo económico</label>
                                                <div class="pata-exp-input-wrap">
                                                    <input type="number" id="pata-amount" placeholder="$0.00" value="${this.formState.formData.requestedAmount}">
                                                    <span class="suffix">MXN</span>
                                                </div>
                                                <p class="pata-exp-sub" style="${isExceeding ? 'color:#FE8F15; font-weight:800;' : ''}">
                                                    ${isExceeding ? `⚠️ Excede el disponible ($${available.toLocaleString()})` : `$${available.toLocaleString()} disponibles`}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="pata-exp-field" style="margin-top:30px">
                                            <label>Comprobante de pago (ticket/factura)</label>
                                            <div class="pata-file-box ${this.formState.files.receipt ? 'has-file' : ''}" data-field="receipt" role="button" tabindex="0">
                                                ${this.formState.previews.receipt ? (this.formState.files.receipt.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.formState.previews.receipt}" class="pata-preview">`) : ''}
                                                <div class="icon-up"><img src="${this.baseUrl}/Icons/upload.svg"></div>
                                                <div><p>Arrastra y suelta archivos tus imagenes aquí o <u>explora</u></p><span>PDF, JPG o PNG - Máx. 10MB</span></div>
                                                <input type="file" hidden accept="image/*,application/pdf">
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderFormStep4() {
        const selectedPet = this.data.pets.find(p => p.id === this.formState.selection.petId);
        const isAppointment = this.formState.selection.requestType === 'allied_center_appointment';
        const isEmergency = this.formState.selection.benefitType === 'medical_emergency';

        return `
            <div class="pata-reveal ${this.formState.selection.benefitType ? 'visible' : ''}">
                <div class="pata-section-header pata-animate-entry" style="animation-delay: 0.4s;">
                    <h2>Cuéntanos qué pasó</h2>
                    <p>Descripción del evento o situación *</p>
                </div>
                <div class="pata-form-container">
                    <div class="pata-form-grid">
                        <div class="pata-field full">
                            <label class="pata-label" for="pata-case-title">¿Cómo te gustaría identificar este caso?</label>
                            <input type="text" class="pata-input" id="pata-case-title" placeholder="Ejem. Fractura de patita" value="${this.formState.formData.caseTitle}">
                        </div>
                        <div class="pata-field full">
                            <label for="pata-case-desc" class="pata-label">Descripción del evento o situación *</label>
                            <textarea class="pata-textarea" id="pata-case-desc" placeholder="Cuéntanos qué le pasó a tu mascota, qué síntomas presenta o qué tipo de atención necesita...">${this.formState.formData.caseDescription}</textarea>
                        </div>

                        <div class="pata-file-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                            <div class="pata-file-box ${this.formState.files.evidencePhoto ? 'has-file' : ''}" data-field="evidencePhoto" role="button" tabindex="0">
                                ${this.formState.previews.evidencePhoto ? (this.formState.files.evidencePhoto.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.formState.previews.evidencePhoto}" class="pata-preview">`) : ''}
                                <div class="icon-up"><img src="${this.baseUrl}/Icons/upload.svg"></div>
                                <div><p>Evidencia (Foto)</p><span>PDF, JPG o PNG</span></div>
                                <input type="file" hidden accept="image/*,application/pdf">
                            </div>
                            <div class="pata-file-box ${this.formState.files.prescription ? 'has-file' : ''}" data-field="prescription" role="button" tabindex="0">
                                ${this.formState.previews.prescription ? (this.formState.files.prescription.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.formState.previews.prescription}" class="pata-preview">`) : ''}
                                <div class="icon-up"><img src="${this.baseUrl}/Icons/upload.svg"></div>
                                <div><p>Informe/Receta</p><span>PDF, JPG o PNG</span></div>
                                <input type="file" hidden accept="image/*,application/pdf">
                            </div>
                            ${!isAppointment ? `
                                <div class="pata-file-box ${this.formState.files.receipt ? 'has-file' : ''}" data-field="receipt" role="button" tabindex="0">
                                    ${this.formState.previews.receipt ? (this.formState.files.receipt.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.formState.previews.receipt}" class="pata-preview">`) : ''}
                                    <div class="icon-up"><img src="${this.baseUrl}/Icons/upload.svg"></div>
                                    <div><p>Comprobante/Factura</p><span>PDF, JPG o PNG</span></div>
                                    <input type="file" hidden accept="image/*,application/pdf">
                                </div>
                            ` : ''}
                            ${selectedPet?.needsSeniorCertificate ? `
                                <div class="pata-file-box ${this.formState.files.seniorCertificate ? 'has-file' : ''}" data-field="seniorCertificate" role="button" tabindex="0" style="border-color: #FE8F15;">
                                    ${this.formState.previews.seniorCertificate ? (this.formState.files.seniorCertificate.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.formState.previews.seniorCertificate}" class="pata-preview">`) : ''}
                                    <div class="icon-up" style="background: #FE8F15;"><img src="${this.baseUrl}/Icons/upload.svg"></div>
                                    <div><p>Certificado Senior *</p><span style="color: #FE8F15; font-weight: 800;">Requerido por edad</span></div>
                                    <input type="file" hidden accept="image/*,application/pdf">
                                </div>
                            ` : ''}
                        </div>

                        ${isAppointment ? `
                            <div class="pata-field"><label class="pata-label" for="pata-incident-date">¿Cuándo ocurrió?</label><input type="date" class="pata-input" id="pata-incident-date" value="${this.formState.formData.incidentDate}"></div>
                            <div class="pata-field"><label class="pata-label" for="pata-pref-time">Disponibilidad de horario</label><input type="time" class="pata-input" id="pata-pref-time" value="${this.formState.formData.preferredAppointmentTime}"></div>
                            <div class="pata-field"><label class="pata-label" for="pata-center">Elige dónde quieres ser atendido</label><select class="pata-select" id="pata-center"><option value="">Seleccione un centro veterinario</option>${this.data.alliedCenters.map(c => `<option value="${c.id}" ${this.formState.formData.alliedCenterId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
                        ` : `
                            ${!isEmergency ? `<div class="pata-field"><label class="pata-label" for="pata-amount">Monto solicitado de apoyo económico</label><input type="number" class="pata-input" id="pata-amount" inputmode="decimal" placeholder="$ 0.00" value="${this.formState.formData.requestedAmount}"></div>` : ''}
                            <div class="pata-field"><label class="pata-label" for="pata-incident-date">¿Cuándo ocurrió?</label><input type="date" class="pata-input" id="pata-incident-date" value="${this.formState.formData.incidentDate}"></div>
                            ${isEmergency ? `
                                <div class="pata-field"><label class="pata-label" for="pata-total-paid">Monto total pagado</label><input type="number" class="pata-input" id="pata-total-paid" inputmode="decimal" placeholder="$ 0.00" value="${this.formState.formData.totalPaidAmount}"></div>
                                <div class="pata-field"><label class="pata-label" for="pata-amount">Monto solicitado de apoyo económico</label><input type="number" class="pata-input" id="pata-amount" inputmode="decimal" placeholder="$ 0.00" value="${this.formState.formData.requestedAmount}"></div>
                                <div class="pata-field full"><label class="pata-label" for="pata-clinic-name">Escribe el nombre del consultorio o veterinaria</label><input type="text" class="pata-input" id="pata-clinic-name" placeholder="¿Dónde fue atendido tu peludo?" value="${this.formState.formData.clinicName}"></div>
                                <div class="pata-field"><label class="pata-label" for="pata-cp">Código postal</label><input type="text" class="pata-input" id="pata-cp" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="5 dígitos" value="${this.formState.formData.clinicPostalCode}"></div>
                                <div class="pata-field"><label class="pata-label" for="pata-state">Estado</label><input type="text" class="pata-input" id="pata-state" value="${this.formState.formData.clinicState}"></div>
                                <div class="pata-field full"><label class="pata-label" for="pata-address">Dirección</label><input type="text" class="pata-input" id="pata-address" value="${this.formState.formData.clinicAddress}"></div>
                                <div class="pata-field"><label class="pata-label" for="pata-city">Ciudad</label><input type="text" class="pata-input" id="pata-city" value="${this.formState.formData.clinicCity}"></div>
                                <div class="pata-field full"><label class="pata-label">Sobre el veterinario que atendió a tu mascota</label><div style="display:flex;gap:20px"><input type="text" class="pata-input" id="pata-vet-name" aria-label="Nombre médico" placeholder="Nombre médico" value="${this.formState.formData.vetName}"><input type="text" class="pata-input" id="pata-vet-license" aria-label="Cédula" placeholder="Cédula" value="${this.formState.formData.vetLicense}"></div></div>
                            ` : ''}
                            ${!isAppointment ? `
                                <div class="pata-field full" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 30px;">
                                    <label class="pata-label" style="font-size: 20px; margin-bottom: 20px; color: var(--pata-black); background: var(--pata-white); display: inline-block; padding: 5px 20px; border-radius: 20px; border: 2px solid var(--pata-black);">Datos para tu reembolso</label>
                                    <div class="pata-form-grid">
                                        <div class="pata-field"><label class="pata-label" for="pata-bank-name">Banco</label><input type="text" class="pata-input" id="pata-bank-name" placeholder="Nombre del banco" value="${this.formState.formData.bankName}"></div>
                                        <div class="pata-field"><label class="pata-label" for="pata-bank-holder">Titular de la cuenta</label><input type="text" class="pata-input" id="pata-bank-holder" placeholder="Nombre completo" value="${this.formState.formData.bankHolder}"></div>
                                        <div class="pata-field full"><label class="pata-label" for="pata-bank-clabe">CLABE Interbancaria (18 dígitos)</label><input type="text" class="pata-input" id="pata-bank-clabe" inputmode="numeric" maxlength="18" placeholder="000000000000000000" value="${this.formState.formData.bankClabe}"><p style="color: white; font-size: 12px; margin-top: 8px; font-weight: 700; opacity: 0.8;">Asegúrate de que los 18 dígitos sean correctos para evitar retrasos.</p></div>
                                    </div>
                                </div>
                            ` : ''}
                        `}
                    </div>

                    <div class="pata-form-actions">
                        <button type="button" class="pata-cancel-link" id="pata-cancel-btn">Cancelar</button>
                        <button type="button" class="pata-btn-submit" id="pata-submit-btn" ${!this.validateForm() || this.formState.submitting ? 'disabled' : ''}>
                            ${this.formState.submitting ? '<div class="pata-spinner"></div>' : 'Enviar solicitud'}
                        </button>
                    </div>
                    <p style="text-align:center; color:white; font-size:13px; margin-top:25px; font-weight:700; opacity: 0.9;">Nuestro comité revisará tu caso con empatía y te responderá pronto ♡</p>
                </div>
            </div>
        `;
    }

    renderSuccessModal() {
        if (!this.formState.success) return '';
        return `
            <div class="pata-modal-overlay active" id="pata-success-modal">
                <div class="pata-modal-content">
                    <img src="${this.baseUrl}/Icons/cerrar.svg" class="pata-modal-close" id="pata-close-success" role="button" tabindex="0">
                    <img src="${this.baseUrl}/Icons/confirmacion.svg" class="pata-modal-check">
                    <h2>Tu solicitud fue enviada</h2>
                    <p class="subtitle">Queremos que todo sea claro, justo y con amor por la comunidad.</p>
                    <div class="pata-modal-body">
                        <p>Gracias por confiar en nosotros. Tu solicitud fue enviada y ahora nuestro Comité la revisará con empatía y cuidado.</p>
                        <p>En un plazo de 24 a 48 horas recibirás una respuesta en tu correo o WhatsApp, y podrás consultar el estatus también desde tu panel.</p>
                        <div style="display: flex; gap: 15px; align-items: flex-start; margin-top: 30px;">
                            <img src="${this.baseUrl}/Icons/confirmacion.svg" style="width: 28px; margin-top: 4px;">
                            <div><strong style="font-size: 1.1em">Si la solicitud es aprobada</strong><br><span style="opacity: 0.9">Nosotros nos coordinamos directamente con el Centro de Bienestar para realizar el pago correspondiente según el tipo de apoyo.</span></div>
                        </div>
                        <div style="margin-top: 35px;"><strong style="font-size: 1.1em">Si se requiere información adicional:</strong><br><span style="opacity: 0.9">Te contactaremos para completar los detalles y continuar el proceso sin contratiempos.</span></div>
                    </div>
                    <div class="pata-modal-footer">Mientras tanto, si necesitas algo, aquí estamos para ti y tu compañero.</div>
                </div>
            </div>
        `;
    }

    // ===== DASHBOARD RENDER HELPERS (existing) =====

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
                                <button class="pata-btn pata-btn-orange" style="margin-top: 10px; font-size: 12px; padding: 10px 20px; border: var(--pata-border); border-radius: 50px; font-weight: 800; cursor: pointer; text-transform: uppercase;" onclick="event.stopPropagation(); window.PataSolidarityDashboard?.showForm ? window.PataSolidarityDashboard.showForm() : (window.location.href='https://www.pataamiga.mx/miembros/fondo-solidario')">UTILIZA TUS BENEFICIOS</button>
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