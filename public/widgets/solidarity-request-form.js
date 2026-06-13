/**
* 🐾 Club Pata Amiga — Solidarity Request Form Widget (Progressive Disclosure)
* Single-page interactive form with progressive revealing of sections.
* Optimized: Frontend Design Refinement (Spacing, Layout, Rhythm).
*/

const MEXICAN_BANKS = {
    "002": "BANAMEX", "012": "BBVA", "014": "SANTANDER", "021": "HSBC", "030": "BAJIO",
    "036": "INBURSA", "042": "MIFEL", "044": "SCOTIABANK", "058": "BANREGIO", "059": "INVEX",
    "062": "AFIRME", "072": "BANORTE", "106": "ACTINVER", "110": "BASE", "112": "MONEX",
    "127": "BANCO AZTECA", "128": "AUTOFIN", "138": "ABC CAPITAL", "147": "COMPARTAMOS",
    "148": "BANCO MULTIVA", "166": "BANCO DEL BIENESTAR", "601": "COPPEL", "638": "STP"
};

class SolidarityRequestForm {
    constructor(containerId, options = {}) {
        this.containerId = containerId || 'pata-solidarity-form';
        this.container = document.getElementById(this.containerId);

        // Environment Config
        this.apiUrl = options.apiUrl || window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx';
        this.baseUrl = options.baseUrl || window.PATA_AMIGA_CONFIG?.baseUrl || 'https://app.pataamiga.mx';

        // Form State
        this.state = {
            loading: false,
            submitting: false,
            member: null,
            pets: [],
            alliedCenters: [],
            balances: null,
            selection: {
                petId: null,
                requestType: null, // 'reimbursement' | 'allied_center_appointment'
                benefitType: null, // 'medical_emergency' | 'annual_vaccination' | 'death'
            },
            ui: {
                showAllPets: true, // Controla si muestra todas las mascotas o solo la seleccionada
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
                receipt: null
            },
            previews: {
                evidencePhoto: null,
                prescription: null,
                receipt: null
            },
            error: null,
            success: false,
            successData: null
        };

        this.useMock = options.useMock || false;

        if (!this.container) {
            console.error('❌ SolidarityRequestForm: Container not found with ID:', this.containerId);
            return;
        }

        this.init();
    }

    async init() {
        this.renderStyles(); 
        this.renderLoading();
        try {
            if (!this.useMock) {
                await this.loadDependencies();
            }
            await this.fetchData();
            this.render();
        } catch (error) {
            console.error('❌ SolidarityRequestForm Init Error:', error);
            this.renderError(error.message);
        }
    }

    renderStyles() {
        if (document.getElementById('pata-solidarity-form-styles')) return;

        const style = document.createElement('style');
        style.id = 'pata-solidarity-form-styles';
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

            :root {
                --pata-turquoise: #15BEB2;
                --pata-turquoise-dark: #00BBB4;
                --pata-orange: #FE8F15;
                --pata-lime: #9FD406;
                --pata-white: #FFFFFF;
                --pata-black: #181C1C;
                --pata-bg-light: #F8FAFC;
                --pata-shadow: 0 20px 40px rgba(0,0,0,0.08);
                --pata-border: 2px solid var(--pata-black);
                --pata-radius: 50px;
                --pata-input-bg: #96E2DC;
                --pata-input-bg-alt: #FFD2A1;
            }

            #${this.containerId} { max-width: 900px; margin: 0 auto; width: 100%; position: relative; min-height: 400px; }
            @media (max-width: 768px) {
                #${this.containerId} { margin: 0; padding: 0; width: 100%; min-height: 100px; display: flex; flex-direction: column; align-items: center; }
                .pata-form-page { display: flex; flex-direction: column; align-items: center; padding: 10px; width: 100%; }
                .pata-section-header { text-align: center; }
                .pata-section-header h2 { font-size: 26px; }
                .pata-section-header p { font-size: 16px; margin: 0 auto; max-width: 90%; }
            }
            .pata-form-page { font-family: 'Outfit', sans-serif; color: var(--pata-black); width: 100%; position: relative; }
            .pata-form-page *, .pata-form-page *::before, .pata-form-page *::after { box-sizing: border-box; }

            .pata-section-header { margin: 60px 0 30px 0; width: 100%; }
            .pata-section-header h2 { font-family: 'Fraiche', sans-serif; font-size: 32px; margin: 0 0 8px 0; line-height: 1.1; }
            .pata-section-header p { font-size: 18px; color: #718096; margin: 0; font-weight: 500; }

            /* Progressive Sections */
            .pata-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0s 0.5s; pointer-events: none; height: 0; overflow: hidden; padding: 0 50px; width: 100%; }
            .pata-reveal.visible { opacity: 1; transform: translateY(0); pointer-events: auto; height: auto; margin-bottom: 40px; padding-bottom: 30px; transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0s; }

            @media (max-width: 768px) {
                .pata-reveal { padding: 0; display: flex; flex-direction: column; align-items: center; }
                .pata-section-header { margin: 40px 0 25px 0; }
            }

            /* Step 1: Pet Grid */
            .pata-pet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 25px; margin-top: 20px; width: 100%; }
            @media (max-width: 768px) {
                .pata-pet-grid { grid-template-columns: 1fr; gap: 20px; margin: 0; justify-items: center; }
                .pata-pet-card { padding: 15px; border-radius: 40px; width: 100%; max-width: 280px; }
                .pata-pet-card.selected { width: 100% !important; max-width: 300px; transform: scale(1.02); }
                .pata-pet-card h4 { font-size: 24px; text-align: center; margin-left: 0; }
                .pata-pet-badge-pill { padding: 8px 16px; font-size: 12px; width: 100%; justify-content: center; }
                .pata-pet-img-wrap { width: 100% !important; margin: 0 auto 15px auto !important; max-width: 220px; }
            }
            .pata-pet-card { position: relative; cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); padding: 15px; border-radius: 45px; border: 2px solid transparent; outline: none; }
            .pata-pet-card:focus-visible { border-color: var(--pata-black); box-shadow: 0 0 0 4px var(--pata-turquoise); }
            .pata-pet-card:hover { transform: translateY(-5px); }
            .pata-pet-card.selected { background: var(--pata-orange); border-color: var(--pata-black); transform: scale(1.05); z-index: 10; }
            .pata-pet-card.selected h4 { color: white; }

            .pata-pet-img-wrap { width: 100%; aspect-ratio: 1; border-radius: 35px; overflow: hidden; margin-bottom: 15px; border: 2.5px solid var(--pata-black); background: #E2E8F0; }
            .pata-pet-img-wrap img { width: 100%; height: 100%; object-fit: cover; }

            .pata-pet-card h4 { font-family: 'Fraiche', sans-serif; font-size: 28px; margin: 0 0 12px 10px; font-weight: 900; letter-spacing: -0.5px; }

            .pata-pet-badge-pill { display: inline-flex; align-items: center; gap: 10px; background: var(--pata-lime); color: var(--pata-black); padding: 10px 20px; border-radius: 35px; border: 2px solid var(--pata-black); font-size: 14px; font-weight: 800; box-shadow: 2px 2px 0px var(--pata-black); }
            .pata-pet-badge-pill.waiting { background: #CBD5E0; opacity: 0.7; box-shadow: none; }
            .pata-pet-badge-pill .check-icon { width: 20px; height: 20px; background: var(--pata-black); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .pata-pet-badge-pill .check-icon svg { width: 12px; height: 12px; color: var(--pata-lime); }

            /* Step 2: Request Type */
            .pata-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 20px; padding-bottom: 30px; width: 100%; }
            @media (max-width: 600px) {
                .pata-type-grid { grid-template-columns: 1fr; gap: 20px; width: 100%; max-width: 320px; }
                .pata-type-card { min-height: 140px; padding: 30px 25px; text-align: center; align-items: center; }
                .pata-type-card h3 { font-size: 24px; }
                .pata-type-card p { font-size: 15px; }
            }
            .pata-type-card { background: var(--pata-turquoise); border-radius: 40px; padding: 35px; color: white; cursor: pointer; position: relative; border: var(--pata-border); transition: all 0.3s; display: flex; flex-direction: column; min-height: 160px; box-shadow: 4px 4px 0px var(--pata-black); outline: none; }
            .pata-type-card:focus-visible { box-shadow: 0 0 0 4px var(--pata-orange); }
            .pata-type-card h3 { font-family: 'Fraiche', sans-serif; font-size: 28px; margin: 0 0 8px 0; line-height: 1; }
            .pata-type-card p { font-size: 16px; margin: 0; opacity: 0.95; line-height: 1.3; font-weight: 500; }
            .pata-type-icon { position: absolute; top: -15px; right: -15px; width: 65px; height: 65px; background: var(--pata-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: var(--pata-border); box-shadow: 4px 4px 0px var(--pata-black); transition: all 0.3s; padding: 12px; }
            @media (max-width: 600px) {
                .pata-type-icon { right: -10px; top: -15px; width: 55px; height: 55px; box-shadow: 2px 2px 0px var(--pata-black); }
                .pata-type-card { padding: 25px; box-shadow: 2px 2px 0px var(--pata-black); }
            }
            .pata-type-icon img { width: 100%; height: 100%; object-fit: contain; }
            .pata-type-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 8px 8px 0px var(--pata-black); }
            .pata-type-card.selected { background: var(--pata-lime); transform: scale(1.02); z-index: 5; animation: pata-pulse 2s ease-in-out infinite; }
            .pata-type-card.selected .pata-type-icon { background: var(--pata-turquoise); transform: rotate(10deg) scale(1.1); }

            /* Reimbursement Badge */
            .pata-reimbursement-badge { display: flex; align-items: flex-start; gap: 16px; margin-top: 20px; padding: 20px 24px; background: var(--pata-input-bg-alt); border: var(--pata-border); border-radius: 30px; box-shadow: 4px 4px 0px var(--pata-black); animation: pata-slide-in 0.4s ease-out; }
            @keyframes pata-slide-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            @media (max-width: 768px) {
                .pata-reimbursement-badge { padding: 16px 20px; gap: 12px; border-radius: 24px; }
            }
            .pata-badge-icon { width: 40px; height: 40px; background: var(--pata-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid var(--pata-black); box-shadow: 2px 2px 0px var(--pata-black); }
            .pata-badge-icon svg { width: 22px; height: 22px; color: white; }
            .pata-badge-text { flex: 1; min-width: 0; color: var(--pata-black); line-height: 1.5; }
            .pata-badge-text strong { display: block; font-family: 'Fraiche', sans-serif; font-size: 17px; margin-bottom: 6px; }
            .pata-badge-text span { font-size: 14px; font-weight: 500; opacity: 0.9; }

            /* Step 3: Benefit Cards */
            .pata-benefit-list { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; padding-bottom: 30px; width: 100%; }
            .pata-benefit-card { background: var(--pata-turquoise); border-radius: 50px; padding: 20px 40px; color: white; cursor: pointer; display: flex; flex-wrap: wrap; align-items: center; gap: 25px; border: var(--pata-border); transition: all 0.3s; box-shadow: 4px 4px 0px var(--pata-black); outline: none; }
            .pata-benefit-card:focus-visible { border-color: var(--pata-orange); }
            @media (max-width: 768px) {
                .pata-benefit-card { padding: 25px 20px; gap: 15px; border-radius: 35px; width: 100%; max-width: 350px; margin: 0 auto; justify-content: center; text-align: center; }
                .pata-benefit-icon { margin-bottom: 5px; }
                .pata-benefit-info { min-width: 100%; }
                .pata-benefit-info h3 { font-size: 22px; }
                .pata-benefit-amount { text-align: center; width: 100%; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px; }
            }
            .pata-benefit-card:hover { transform: translateX(8px); background: var(--pata-turquoise-dark); }
            .pata-benefit-card.selected { background: var(--pata-orange); transform: scale(1.01); }
            .pata-benefit-icon { width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid var(--pata-black); flex-shrink: 0; padding: 10px; }
            .pata-benefit-icon img { width: 100%; height: 100%; object-fit: contain; }
            .pata-benefit-info { flex: 1; min-width: 250px; }
            .pata-benefit-info h3 { font-family: 'Fraiche', sans-serif; font-size: 26px; margin: 0 0 4px 0; }
            .pata-benefit-info p { font-size: 14px; margin: 0; opacity: 0.9; line-height: 1.3; }
            .pata-benefit-amount { text-align: right; }
            .pata-benefit-amount .val { font-family: 'Fraiche', sans-serif; font-size: 24px; display: block; line-height: 1; }
            .pata-benefit-amount .sub { font-size: 13px; opacity: 0.8; font-weight: 700; }

            /* Expansion for Medical Emergency */
            .pata-benefit-expansion { width: 100%; margin-top: 30px; border-top: 1.5px solid rgba(255,255,255,0.25); padding-top: 30px; }
            .pata-exp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            @media (max-width: 768px) {
                .pata-exp-grid { grid-template-columns: 1fr; gap: 20px; }
                .pata-exp-input-wrap { padding: 0 20px; }
                .pata-exp-input-wrap input { font-size: 16px; text-align: center; }
                .pata-exp-field label { font-size: 14px; text-align: center; }
                .pata-exp-sub { text-align: center; }
            }
            .pata-exp-field label { display: block; font-size: 16px; font-weight: 800; margin-bottom: 12px; }
            .pata-exp-input-wrap { position: relative; background: var(--pata-input-bg-alt); border-radius: 35px; padding: 0 30px; display: flex; align-items: center; border: 2px solid transparent; transition: border 0.2s; }
            .pata-exp-input-wrap:focus-within { border-color: var(--pata-black); }
            .pata-exp-input-wrap input { background: transparent; border: none; width: 100%; padding: 18px 0; font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--pata-black); font-size: 18px; outline: none; }
            .pata-exp-input-wrap .suffix { font-weight: 800; opacity: 0.7; font-size: 14px; }
            .pata-exp-sub { font-size: 12px; font-weight: 800; margin-top: 8px; text-align: right; color: rgba(24,28,28,0.7); }

            /* Step 4: Form Container */
            .pata-form-container { background: var(--pata-turquoise); border-radius: 60px; padding: 50px; margin-top: 20px; border: var(--pata-border); box-shadow: 6px 6px 0px var(--pata-black); width: 100%; }
            .pata-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
            @media (max-width: 768px) {
                .pata-form-container { padding: 20px 15px; border-radius: 40px; }
                .pata-form-grid { grid-template-columns: 1fr; gap: 20px; }
                .pata-label { text-align: center; }
                .pata-input, .pata-textarea, .pata-select { text-align: center; padding: 18px 20px; }
            }
            .pata-field { margin-bottom: 25px; }
            .pata-field.full { grid-column: span 2; }
            @media (max-width: 768px) { .pata-field.full { grid-column: span 1; } }
            .pata-label { display: block; font-weight: 800; font-size: 17px; margin-bottom: 12px; color: white; text-shadow: 1px 1px 0px rgba(0,0,0,0.1); }
            .pata-input, .pata-textarea, .pata-select { width: 100%; padding: 18px 30px; border-radius: 35px; border: 2px solid transparent; background: var(--pata-input-bg); font-family: 'Outfit', sans-serif; font-size: 16px; color: var(--pata-black); font-weight: 600; transition: all 0.2s; outline: none; appearance: none; -webkit-appearance: none; }
            .pata-input:focus, .pata-textarea:focus, .pata-select:focus { border-color: var(--pata-black); background: white; }
            
            /* Custom Select Arrow */
            .pata-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23181C1C' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 25px center; background-size: 18px; padding-right: 60px; cursor: pointer; }
            
            /* Custom Date & Time Icons */
            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23181C1C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E");
                cursor: pointer;
                filter: invert(0);
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            input[type="time"]::-webkit-calendar-picker-indicator {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23181C1C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E");
            }
            input[type="date"]::-webkit-calendar-picker-indicator:hover,
            input[type="time"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }

            .pata-textarea { min-height: 140px; resize: none; border-radius: 25px; padding-top: 20px; }

            /* File Boxes */
            .pata-file-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; margin-bottom: 35px; width: 100%; }
            @media (max-width: 768px) {
                .pata-file-grid { grid-template-columns: 1fr; gap: 15px; }
                .pata-file-box { flex-direction: column; padding: 30px 20px; text-align: center; min-height: 180px; }
                .pata-file-box p { text-align: center; }
                .pata-file-box .icon-up { margin: 0 0 15px 0; }
            }
            .pata-file-box { background: var(--pata-input-bg); border-radius: 40px; padding: 25px; text-align: center; cursor: pointer; display: flex; align-items: center; gap: 20px; position: relative; overflow: hidden; border: 2.5px dashed rgba(255,255,255,0.4); min-height: 110px; transition: all 0.3s; outline: none; }
            .pata-file-box:focus-visible { border-style: solid; border-color: white; }
            .pata-benefit-expansion .pata-file-box { background: var(--pata-input-bg-alt); border-style: dashed; border-color: rgba(24,28,28,0.2); }
            .pata-file-box:hover, .pata-file-box.drag-over { border-color: var(--pata-white); transform: translateY(-3px) scale(1.02); border-style: solid; }
            .pata-file-box.has-file { background: white !important; border-style: solid; border-color: var(--pata-lime); }
            .pata-file-box .icon-up { width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid var(--pata-black); box-shadow: 3px 3px 0px var(--pata-black); z-index: 2; }
            .pata-file-box .icon-up img { width: 35px; height: 35px; }
            .pata-file-box p { font-size: 15px; font-weight: 700; text-align: left; margin: 0; line-height: 1.2; color: var(--pata-black); z-index: 2; }
            .pata-file-box span { font-size: 12px; opacity: 0.7; display: block; font-weight: 500; margin-top: 4px; }
            .pata-preview { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: 0.3; }

            .pata-form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 20px; width: 100%; }
            @media (max-width: 768px) {
                .pata-form-actions { flex-direction: column-reverse; gap: 20px; }
                .pata-btn-submit { width: 100%; padding: 18px 20px; font-size: 20px; }
            }
            .pata-cancel-link { font-family: 'Fraiche', sans-serif; font-size: 20px; color: var(--pata-black); text-decoration: none; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; outline: none; background: transparent; border: none; }
            .pata-cancel-link:focus-visible { text-decoration: underline; }
            .pata-cancel-link:hover { opacity: 1; }
            .pata-btn-submit { font-family: 'Fraiche', sans-serif; background: var(--pata-orange); border: var(--pata-border); color: white; padding: 18px 50px; border-radius: 50px; font-size: 24px; cursor: pointer; box-shadow: 5px 5px 0px var(--pata-black); transition: all 0.2s; outline: none; }
            .pata-btn-submit:focus-visible { transform: scale(1.05); }
            .pata-btn-submit:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 7px 7px 0px var(--pata-black); }
            .pata-btn-submit:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 2px 2px 0px var(--pata-black); }
            .pata-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }

            /* Modal Overlay */
            .pata-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 10000; padding: 15px; backdrop-filter: blur(10px); }
            .pata-modal-overlay.active { display: flex; }
            .pata-modal-content { background: white; width: 100%; max-width: 850px; border-radius: 50px; padding: 60px; position: relative; border: 3px solid var(--pata-black); text-align: left; box-shadow: 10px 10px 0px var(--pata-black); max-height: 90vh; overflow-y: auto; font-family: 'Outfit', sans-serif; }
            @media (max-width: 768px) {
                .pata-modal-content { padding: 40px 20px 30px 20px; border-radius: 40px; width: 95%; box-shadow: 5px 5px 0px var(--pata-black); }
                .pata-modal-close { top: 15px; right: 15px; width: 25px; height: 25px; }
                .pata-modal-check { width: 60px; height: 60px; margin-bottom: 20px; }
                .pata-modal-content h2 { font-size: 26px; margin-bottom: 10px; }
                .pata-modal-body { font-size: 16px; }
                .pata-modal-body p { margin-bottom: 15px; }
            }
            .pata-modal-close { position: absolute; top: 40px; right: 40px; cursor: pointer; width: 35px; height: 35px; transition: transform 0.2s; }
            .pata-modal-close:hover { transform: rotate(90deg); }
            .pata-modal-check { width: 120px; height: 120px; margin: 0 auto 40px auto; display: block; }
            .pata-modal-content h2 { font-family: 'Fraiche', sans-serif; font-size: 56px; text-align: center; margin-bottom: 12px; line-height: 0.9; }
            .pata-modal-content p.subtitle { font-size: 22px; text-align: center; color: #718096; margin-bottom: 50px; font-weight: 600; }
            .pata-modal-body { font-size: 19px; line-height: 1.6; color: var(--pata-black); }
            .pata-modal-body p { margin-bottom: 25px; font-weight: 500; }
            .pata-modal-footer { margin-top: 50px; text-align: center; font-weight: 900; font-family: 'Fraiche', sans-serif; font-size: 20px; }

            /* Utilities */
            .pata-spinner { border: 4px solid rgba(0,0,0,0.1); border-left-color: var(--pata-orange); border-radius: 50%; width: 40px; height: 40px; animation: pata-spin 1s linear infinite; margin: 0 auto; }
            @keyframes pata-spin { to { transform: rotate(360deg); } }

            /* Pulse animation for selected pet */
            @keyframes pata-pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(21, 190, 178, 0.6); }
                50% { box-shadow: 0 0 0 12px rgba(21, 190, 178, 0); }
            }
            .pata-pet-card.selected { position: relative; animation: pata-pulse 2s ease-in-out infinite; }
            
            .pata-btn { font-family: 'Fraiche', sans-serif; padding: 15px 30px; border-radius: 50px; border: 2px solid black; cursor: pointer; font-size: 18px; transition: all 0.2s; }
            .pata-btn-primary { background: var(--pata-orange); color: white; box-shadow: 4px 4px 0px black; }
            .pata-btn-primary:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px black; }
            .pata-btn-secondary { background: transparent; color: var(--pata-black); box-shadow: 4px 4px 0px var(--pata-black); }
            .pata-btn-secondary:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px var(--pata-black); background: var(--pata-lime); }

            .pata-form-loading, .pata-form-error { padding: 100px; text-align: center; font-family: 'Outfit', sans-serif; width: 100%; }
        `;
        document.head.appendChild(style);
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
            throw new Error('Debes iniciar sesión para realizar una solicitud.');
        }

        this.state.member = member;

        try {
            const statsRes = await fetch(`${this.apiUrl}/api/solidarity/stats?memberstackId=${member.id}`);
            const statsData = await statsRes.json();

            if (statsData.success) {
                this.state.pets = statsData.pets || [];
            } else {
                throw new Error(statsData.error || 'Error al cargar información de tus mascotas.');
            }

            const centersRes = await fetch(`${this.apiUrl}/api/solidarity/allied-centers`);
            const centersData = await centersRes.json();
            if (centersData.success) {
                this.state.alliedCenters = centersData.centers || [];
            }
        } catch (err) {
            console.error('FetchData Error:', err);
            throw err;
        }
    }

    loadMockData() {
        this.state.pets = [
            { id: 'p1', name: 'spike', breed: 'Schnauzer', primary_photo_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300', waiting_period_end: new Date(Date.now() - 86400000).toISOString() },
            { id: 'p2', name: 'Luna', breed: 'Siamés', primary_photo_url: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=300', waiting_period_end: new Date(Date.now() + 86400000 * 30).toISOString() },
            { id: 'p3', name: 'Coco', breed: 'Pug', primary_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', waiting_period_end: new Date(Date.now() - 86400000 * 10).toISOString() }
        ];
        this.state.alliedCenters = [
            { id: 'c1', name: 'Hospital Veterinario Pata Amiga Centro' },
            { id: 'c2', name: 'Clínica ProPet' }
        ];
    }

    renderLoading() {
        this.container.innerHTML = `<div class="pata-form-loading"><div class="pata-spinner"></div><p style="margin-top:20px; font-weight:600;">Cargando formulario...</p></div>`;
    }

    renderError(message) {
        this.container.innerHTML = `
            <div class="pata-form-error">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <h3 style="font-family: 'Fraiche', sans-serif; font-size: 32px; margin-bottom: 10px;">¡Ups! Algo salió mal</h3>
                <p style="color: #718096; margin-bottom: 30px;">${message}</p>
                <button onclick="location.reload()" class="pata-btn pata-btn-primary">REINTENTAR</button>
            </div>
        `;
    }

    calculateCarencia(pet) {
        const now = new Date();
        
        // Handle potentially invalid or missing dates
        let start = now;
        if (pet.waiting_period_start) {
            const parsed = new Date(pet.waiting_period_start);
            if (!isNaN(parsed.getTime())) start = parsed;
        } else if (pet.created_at) {
            const parsed = new Date(pet.created_at);
            if (!isNaN(parsed.getTime())) start = parsed;
        }
        
        let totalDays = 180;
        
        // Robust check for boolean-ish properties (Supabase, Memberstack, etc.)
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

    async fetchBalances(petId) {
        if (!petId || this.useMock) return;
        try {
            const res = await fetch(`${this.apiUrl}/api/solidarity/balance?petId=${petId}`);
            const data = await res.json();
            if (data.success) {
                this.state.balances = data.balances;
                this.render();
            }
        } catch (err) {
            console.error('❌ Error fetching balances:', err);
        }
    }

    validateForm() {
        const d = this.state.formData;
        const f = this.state.files;

        if (!this.state.selection.petId || !this.state.selection.requestType || !this.state.selection.benefitType) return false;
        if (!d.caseDescription) return false;
        if (!f.evidencePhoto) return false;

        if (this.state.selection.requestType === 'allied_center_appointment') {
            return !!(d.incidentDate && d.preferredAppointmentTime && d.caseTitle);
        } else {
            // Check balance limits
            if (this.state.balances && this.state.selection.benefitType) {
                const balance = this.state.balances[this.state.selection.benefitType];
                const requested = parseFloat(d.requestedAmount || 0);
                if (requested > balance.available || requested <= 0) return false;
            }

            if (this.state.selection.requestType === 'reimbursement') {
                if (!d.bankName || !d.bankClabe || !d.bankHolder) return false;
                if (d.bankClabe.length !== 18) return false;
            }

            if (this.state.selection.benefitType === 'medical_emergency') {
                return !!(d.totalPaidAmount && d.clinicName && d.clinicPostalCode && d.clinicAddress && d.vetName);
            }
            return true;
        }
    }

    render() {
        if (!this.container) return;

        // Toggle Scroll Lock
        if (this.state.success) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '0px'; 
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        this.container.innerHTML = `
            <div class="pata-form-page">
                <!-- Section 1: Pet Selection -->
                <div class="pata-section">
                    <div class="pata-section-header">
                        <h2>¿Para cuál de tus compañeros es la solicitud?</h2>
                        <p>Selecciona la mascota que necesite apoyo</p>
                    </div>
                    <div class="pata-pet-grid">
                        ${this.state.ui.showAllPets ? this.state.pets.map(pet => {
                            const isApproved = pet.status === 'approved';
                            const carencia = this.calculateCarencia(pet);
                            const hasFinishedWaiting = !carencia.isWaiting;
                            
                            // Only eligible if approved AND finished waiting period
                            const isEligible = isApproved && hasFinishedWaiting;
                            const isSelected = this.state.selection.petId === pet.id;
                            
                            // Photo logic from pet-cards-widget.js
                            const photoUrl = pet.photo_url || pet.primary_photo_url || 'https://app.pataamiga.mx/Assets/placeholder-pet.png';

                            // Determine status label and class
                            let statusLabel = 'Apoyo activo';
                            let statusClass = '';
                            if (!isApproved) {
                                statusLabel = 'Pendiente aprobación';
                                statusClass = 'waiting';
                            } else if (!hasFinishedWaiting) {
                                statusLabel = 'En espera';
                                statusClass = 'waiting';
                            }

                            return `
                                <div class="pata-pet-card ${isSelected ? 'selected' : ''} ${!isEligible ? 'disabled' : ''}" 
                                     data-id="${pet.id}" 
                                     role="button" 
                                     tabindex="${!isEligible ? '-1' : '0'}" 
                                     aria-pressed="${isSelected}"
                                     style="${!isEligible ? 'opacity: 0.7; cursor: not-allowed;' : ''}">
                                    <div class="pata-pet-img-wrap">
                                        <img src="${photoUrl}" alt="${pet.name}" onerror="this.src='https://app.pataamiga.mx/Assets/placeholder-pet.png'">
                                    </div>
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
                            const selectedPet = this.state.pets.find(p => p.id === this.state.selection.petId);
                            if (!selectedPet) return '';
                            const photoUrl = selectedPet.photo_url || selectedPet.primary_photo_url || 'https://app.pataamiga.mx/Assets/placeholder-pet.png';
                            return `
                                <div class="pata-pet-card selected" data-id="${selectedPet.id}" style="max-width: 250px;">
                                    <div class="pata-pet-img-wrap">
                                        <img src="${photoUrl}" alt="${selectedPet.name}" onerror="this.src='https://app.pataamiga.mx/Assets/placeholder-pet.png'">
                                    </div>
                                    <h4 style="text-align: center; margin-left: 0;">${selectedPet.name}</h4>
                                    <div class="pata-pet-badge-pill" style="background: var(--pata-lime);">
                                        <div class="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                                        Mascota seleccionada
                                    </div>
                                    <button type="button" class="pata-btn pata-btn-secondary pata-scroll-to-type-btn" style="margin-top: 15px; width: 100%; justify-content: center;">
                                        Cambiar de mascota
                                    </button>
                                </div>
                            `;
                        })()}
                    </div>
                </div>

                <!-- Section 2: Request Type -->
                <div class="pata-reveal ${this.state.selection.petId ? 'visible' : ''}">
                    <div class="pata-section-header">
                        <h2>Tipo de solicitud</h2>
                        <p>¿Cómo podemos apoyarte?</p>
                    </div>
                    <div class="pata-type-grid">
                        <div class="pata-type-card ${this.state.selection.requestType === 'allied_center_appointment' ? 'selected' : ''}" 
                             data-type="allied_center_appointment"
                             role="button" 
                             tabindex="0"
                             aria-pressed="${this.state.selection.requestType === 'allied_center_appointment'}">
                            <h3>cita en centro aliado</h3>
                            <p>Agenda una consulta directamente con nuestra red de veterinarias.</p>
                            <div class="pata-type-icon">
                                <img src="${this.baseUrl}/Icons/centro-white.png">
                            </div>
                        </div>
                        <div class="pata-type-card ${this.state.selection.requestType === 'reimbursement' ? 'selected' : ''}" 
                             data-type="reimbursement"
                             role="button" 
                             tabindex="0"
                             aria-pressed="${this.state.selection.requestType === 'reimbursement'}">
                            <h3>solicitud de reembolso</h3>
                            <p>si ya pagaste, sube tu comprobante y te reintegramos el monto.</p>
                            <div class="pata-type-icon">
                                <img src="${this.baseUrl}/Icons/reembolso-white.png">
                            </div>
                        </div>
                    </div>
                    ${this.state.selection.requestType === 'reimbursement' ? `
                        <div class="pata-reimbursement-badge" role="alert">
                            <div class="pata-badge-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </div>
                            <div class="pata-badge-text">
                                <strong>¡Importante para tu seguridad!</strong>
                                Recuerda que el titular de la cuenta bancaria debe ser el mismo que registraste en tu membresía. Hacemos esto por tu seguridad: si los datos no coinciden, el movimiento no podrá procesarse y el depósito no se realizará, incluso si la solicitud ya fue aprobada por nuestro equipo. ¡Ayúdanos a cuidar tu cuenta!
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Section 3: Benefit Type -->
                <div class="pata-reveal ${this.state.selection.petId && this.state.selection.requestType ? 'visible' : ''}">
                    <div class="pata-section-header">
                        <h2>Estamos contigo, ¿qué tipo de ayuda requiere tu mascota?</h2>
                        <p>Selecciona el tipo de solicitud</p>
                    </div>
                    <div class="pata-benefit-list">
                        ${this.renderBenefitCards()}
                    </div>
                </div>

                <!-- Section 4: The Form -->
                <div class="pata-reveal ${this.state.selection.benefitType ? 'visible' : ''}">
                    <div class="pata-section-header">
                        <h2>Cuéntanos qué pasó</h2>
                        <p>Descripción del evento o situación *</p>
                    </div>
                    ${this.renderForm()}
                </div>
            </div>

            <!-- Success Modal -->
            <div class="pata-modal-overlay ${this.state.success ? 'active' : ''}" id="pata-success-modal">
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
                            <div>
                                <strong style="font-size: 1.1em">Si la solicitud es aprobada</strong><br>
                                <span style="opacity: 0.9">Nosotros nos coordinamos directamente con el Centro de Bienestar para realizar el pago correspondiente según el tipo de apoyo.</span>
                            </div>
                        </div>

                        <div style="margin-top: 35px;">
                            <strong style="font-size: 1.1em">Si se requiere información adicional:</strong><br>
                            <span style="opacity: 0.9">Te contactaremos para completar los detalles y continuar el proceso sin contratiempos.</span>
                        </div>
                    </div>

                    <div class="pata-modal-footer">
                        Mientras tanto, si necesitas algo, aquí estamos para ti y tu compañero.
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderBenefitCards() {
        const benefits = [
            { id: 'medical_emergency', title: 'emergencia médica', desc: 'Para situaciones inesperadas que requieren atención veterinaria urgente.', icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-emergencias_pbfplq.svg', amount: 3000 },
            { id: 'annual_vaccination', title: 'vacunación anual', desc: 'Apoyo para cubrir la vacuna anual de una de tus mascotas.', icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/Icon-vacuna_ybuall.svg', amount: 300 },
            { id: 'death', title: 'Fallecimiento', desc: 'Te acompañamos en un momento difícil con un apoyo para gastos de despedida.', icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-fallecimiento_xwqe2g.png', amount: 2000 }
        ];

        return benefits.map(b => {
            const isSelected = this.state.selection.benefitType === b.id;
            const isEmergency = b.id === 'medical_emergency';
            
            const balance = this.state.balances ? this.state.balances[b.id] : null;
            const available = balance ? balance.available : b.amount;
            const isExhausted = balance && balance.available <= 0;
            const requested = parseFloat(this.state.formData.requestedAmount || 0);
            const isExceeding = balance && requested > balance.available;

            return `
                <div class="pata-benefit-card ${isSelected ? 'selected' : ''} ${isExhausted ? 'exhausted' : ''}" 
                     data-id="${b.id}" 
                     role="button" 
                     tabindex="${isExhausted ? '-1' : '0'}"
                     aria-pressed="${isSelected}"
                     style="${isExhausted ? 'opacity: 0.6; cursor: not-allowed; filter: grayscale(0.8);' : ''}">
                    <div class="pata-benefit-icon"><img src="${b.icon}"></div>
                    <div class="pata-benefit-info">
                        <h3>${b.title}</h3>
                        <p>${isExhausted ? '<span style="color:#FFD2A1; font-weight:800;">Límite anual alcanzado</span>' : b.desc}</p>
                    </div>
                    <div class="pata-benefit-amount">
                        <span class="val">$${available.toLocaleString()} MXN</span>
                        <span class="sub">${this.state.balances ? 'Disponible' : 'Por año'}</span>
                    </div>

                    ${(isSelected && isEmergency) ? `
                        <div class="pata-benefit-expansion" role="group" aria-label="Detalles de emergencia médica">
                            <div class="pata-exp-grid">
                                <div class="pata-exp-field">
                                    <label for="pata-total-paid">Monto total pagado a la clínica</label>
                                    <div class="pata-exp-input-wrap">
                                        <input type="number" id="pata-total-paid" placeholder="$0.00" value="${this.state.formData.totalPaidAmount}">
                                        <span class="suffix">MXN</span>
                                    </div>
                                </div>
                                <div class="pata-exp-field">
                                    <label for="pata-amount">Monto solicitado de apoyo económico</label>
                                    <div class="pata-exp-input-wrap">
                                        <input type="number" id="pata-amount" placeholder="$0.00" value="${this.state.formData.requestedAmount}">
                                        <span class="suffix">MXN</span>
                                    </div>
                                    <p class="pata-exp-sub" style="${isExceeding ? 'color:#FE8F15; font-weight:800;' : ''}">
                                        ${isExceeding ? `⚠️ Excede el disponible ($${available.toLocaleString()})` : `$${available.toLocaleString()} disponibles`}
                                    </p>
                                </div>
                            </div>
                            <div class="pata-exp-field" style="margin-top:30px">
                                <label>Comprobante de pago (ticket/factura)</label>
                                <div class="pata-file-box ${this.state.files.receipt ? 'has-file' : ''}" data-field="receipt" role="button" tabindex="0">
                                    ${this.state.previews.receipt ? (this.state.files.receipt.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.state.previews.receipt}" class="pata-preview">`) : ''}
                                    <div class="icon-up">
                                        <img src="${this.baseUrl}/Icons/upload.svg">
                                    </div>
                                    <div>
                                        <p>Arrastra y suelta archivos tus imagenes aquí o <u>explora</u></p>
                                        <span>PDF, JPG o PNG - Máx. 10MB</span>
                                    </div>
                                    <input type="file" hidden accept="image/*,application/pdf">
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderForm() {
        const selectedPet = this.state.pets.find(p => p.id === this.state.selection.petId);
        const isAppointment = this.state.selection.requestType === 'allied_center_appointment';
        const isEmergency = this.state.selection.benefitType === 'medical_emergency';

        return `
            <div class="pata-form-container">
                <div class="pata-field full">
                    <label class="pata-label" for="pata-case-title">¿Cómo te gustaría identificar este caso?</label>
                    <input type="text" class="pata-input" id="pata-case-title" placeholder="Ejem. Fractura de patita" value="${this.state.formData.caseTitle}">
                </div>
                <div class="pata-field full">
                    <label for="pata-case-desc" class="pata-label">Descripción del evento o situación *</label>
                    <textarea class="pata-textarea" id="pata-case-desc" placeholder="Cuéntanos qué le pasó a tu mascota, qué síntomas presenta o qué tipo de atención necesita...">${this.state.formData.caseDescription}</textarea>
                </div>

                <div class="pata-file-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="pata-file-box ${this.state.files.evidencePhoto ? 'has-file' : ''}" data-field="evidencePhoto" role="button" tabindex="0">
                        ${this.state.previews.evidencePhoto ? (this.state.files.evidencePhoto.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.state.previews.evidencePhoto}" class="pata-preview">`) : ''}
                        <div class="icon-up">
                            <img src="${this.baseUrl}/Icons/upload.svg">
                        </div>
                        <div>
                            <p>Evidencia (Foto)</p>
                            <span>PDF, JPG o PNG</span>
                        </div>
                        <input type="file" hidden accept="image/*,application/pdf">
                    </div>
                    <div class="pata-file-box ${this.state.files.prescription ? 'has-file' : ''}" data-field="prescription" role="button" tabindex="0">
                        ${this.state.previews.prescription ? (this.state.files.prescription.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.state.previews.prescription}" class="pata-preview">`) : ''}
                        <div class="icon-up">
                            <img src="${this.baseUrl}/Icons/upload.svg">
                        </div>
                        <div>
                            <p>Informe/Receta</p>
                            <span>PDF, JPG o PNG</span>
                        </div>
                        <input type="file" hidden accept="image/*,application/pdf">
                    </div>
                    ${!isAppointment ? `
                        <div class="pata-file-box ${this.state.files.receipt ? 'has-file' : ''}" data-field="receipt" role="button" tabindex="0">
                            ${this.state.previews.receipt ? (this.state.files.receipt.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.state.previews.receipt}" class="pata-preview">`) : ''}
                            <div class="icon-up">
                                <img src="${this.baseUrl}/Icons/upload.svg">
                            </div>
                            <div>
                                <p>Comprobante/Factura</p>
                                <span>PDF, JPG o PNG</span>
                            </div>
                            <input type="file" hidden accept="image/*,application/pdf">
                        </div>
                    ` : ''}
                    ${selectedPet?.needsSeniorCertificate ? `
                        <div class="pata-file-box ${this.state.files.seniorCertificate ? 'has-file' : ''}" data-field="seniorCertificate" role="button" tabindex="0" style="border-color: #FE8F15;">
                            ${this.state.previews.seniorCertificate ? (this.state.files.seniorCertificate.type === 'application/pdf' ? '<div style="font-size:30px;z-index:2">📄</div>' : `<img src="${this.state.previews.seniorCertificate}" class="pata-preview">`) : ''}
                            <div class="icon-up" style="background: #FE8F15;">
                                <img src="${this.baseUrl}/Icons/upload.svg">
                            </div>
                            <div>
                                <p>Certificado Senior *</p>
                                <span style="color: #FE8F15; font-weight: 800;">Requerido por edad</span>
                            </div>
                            <input type="file" hidden accept="image/*,application/pdf">
                        </div>
                    ` : ''}
                </div>

                <div class="pata-form-grid">
                    ${isAppointment ? `
                        <div class="pata-field">
                            <label class="pata-label" for="pata-incident-date">¿Cuándo ocurrió?</label>
                            <input type="date" class="pata-input" id="pata-incident-date" value="${this.state.formData.incidentDate}">
                        </div>
                        <div class="pata-field">
                            <label class="pata-label" for="pata-pref-time">Disponibilidad de horario</label>
                            <input type="time" class="pata-input" id="pata-pref-time" value="${this.state.formData.preferredAppointmentTime}">
                        </div>
                        <div class="pata-field">
                            <label class="pata-label" for="pata-center">Elige dónde quieres ser atendido</label>
                            <select class="pata-select" id="pata-center">
                                <option value="">Seleccione un centro veterinario</option>
                                ${this.state.alliedCenters.map(c => `<option value="${c.id}" ${this.state.formData.alliedCenterId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                    ` : `
                        ${!isEmergency ? `
                            <div class="pata-field">
                                <label class="pata-label" for="pata-amount">Monto solicitado de apoyo económico</label>
                                <input type="number" class="pata-input" id="pata-amount" inputmode="decimal" placeholder="$ 0.00" value="${this.state.formData.requestedAmount}">
                            </div>
                        ` : ''}
                        <div class="pata-field">
                            <label class="pata-label" for="pata-incident-date">¿Cuándo ocurrió?</label>
                            <input type="date" class="pata-input" id="pata-incident-date" value="${this.state.formData.incidentDate}">
                        </div>
                        ${isEmergency ? `
                            <div class="pata-field">
                                <label class="pata-label" for="pata-total-paid">Monto total pagado</label>
                                <input type="number" class="pata-input" id="pata-total-paid" inputmode="decimal" placeholder="$ 0.00" value="${this.state.formData.totalPaidAmount}">
                            </div>
                            <div class="pata-field">
                                <label class="pata-label" for="pata-amount">Monto solicitado de apoyo económico</label>
                                <input type="number" class="pata-input" id="pata-amount" inputmode="decimal" placeholder="$ 0.00" value="${this.state.formData.requestedAmount}">
                            </div>
                            <div class="pata-field full">
                                <label class="pata-label" for="pata-clinic-name">Escribe el nombre del consultorio o veterinaria</label>
                                <input type="text" class="pata-input" id="pata-clinic-name" placeholder="¿Dónde fue atendido tu peludo?" value="${this.state.formData.clinicName}">
                            </div>
                            <div class="pata-field">
                                <label class="pata-label" for="pata-cp">Código postal</label>
                                <input type="text" class="pata-input" id="pata-cp" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="5 dígitos" value="${this.state.formData.clinicPostalCode}">
                            </div>
                            <div class="pata-field"><label class="pata-label" for="pata-state">Estado</label><input type="text" class="pata-input" id="pata-state" value="${this.state.formData.clinicState}"></div>
                            <div class="pata-field full"><label class="pata-label" for="pata-address">Dirección</label><input type="text" class="pata-input" id="pata-address" value="${this.state.formData.clinicAddress}"></div>
                            <div class="pata-field"><label class="pata-label" for="pata-city">Ciudad</label><input type="text" class="pata-input" id="pata-city" value="${this.state.formData.clinicCity}"></div>
                            <div class="pata-field full">
                                <label class="pata-label">Sobre el veterinario que atendió a tu mascota</label>
                                <div style="display:flex;gap:20px">
                                    <input type="text" class="pata-input" id="pata-vet-name" aria-label="Nombre médico" placeholder="Nombre médico" value="${this.state.formData.vetName}">
                                    <input type="text" class="pata-input" id="pata-vet-license" aria-label="Cédula" placeholder="Cédula" value="${this.state.formData.vetLicense}">
                                </div>
                            </div>
                        ` : ''}

                        ${!isAppointment ? `
                            <div class="pata-field full" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 30px;">
                                <label class="pata-label" style="font-size: 20px; margin-bottom: 20px; color: var(--pata-black); background: var(--pata-white); display: inline-block; padding: 5px 20px; border-radius: 20px; border: 2px solid var(--pata-black);">Datos para tu reembolso</label>
                                <div class="pata-form-grid">
                                    <div class="pata-field">
                                        <label class="pata-label" for="pata-bank-name">Banco</label>
                                        <input type="text" class="pata-input" id="pata-bank-name" placeholder="Nombre del banco" value="${this.state.formData.bankName}">
                                    </div>
                                    <div class="pata-field">
                                        <label class="pata-label" for="pata-bank-holder">Titular de la cuenta</label>
                                        <input type="text" class="pata-input" id="pata-bank-holder" placeholder="Nombre completo" value="${this.state.formData.bankHolder}">
                                    </div>
                                    <div class="pata-field full">
                                        <label class="pata-label" for="pata-bank-clabe">CLABE Interbancaria (18 dígitos)</label>
                                        <input type="text" class="pata-input" id="pata-bank-clabe" inputmode="numeric" maxlength="18" placeholder="000000000000000000" value="${this.state.formData.bankClabe}">
                                        <p style="color: white; font-size: 12px; margin-top: 8px; font-weight: 700; opacity: 0.8;">Asegúrate de que los 18 dígitos sean correctos para evitar retrasos.</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    `}
                </div>

                <div class="pata-form-actions">
                    <button type="button" class="pata-cancel-link" id="pata-cancel-btn">Cancelar</button>
                    <button type="button" class="pata-btn-submit" id="pata-submit-btn" ${!this.validateForm() || this.state.submitting ? 'disabled' : ''}>
                        ${this.state.submitting ? '<div class="pata-spinner"></div>' : 'Enviar solicitud'}
                    </button>
                </div>
                <p style="text-align:center; color:white; font-size:13px; margin-top:25px; font-weight:700; opacity: 0.9;">Nuestro comité revisará tu caso con empatía y te responderá pronto ♡</p>
            </div>
        `;
    }

    attachEventListeners() {
        const handlePetSelection = (id) => { 
            this.state.selection.petId = id; 
            this.state.ui.showAllPets = false; // Ocultar otras mascotas
            this.state.balances = null; // Reset balances while loading
            this.fetchBalances(id);
            this.render(); 
            
            // Auto-scroll a la sección "Tipo de solicitud" después del render
            setTimeout(() => {
                const typeSection = this.container.querySelector('.pata-reveal.visible');
                if (typeSection) {
                    typeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        };
        const handleTypeSelection = (type) => { this.state.selection.requestType = type; this.render(); };
        const handleBenefitSelection = (id) => { 
            this.state.selection.benefitType = id; 
            // Set default amounts for fixed benefits
            if (id === 'annual_vaccination') this.state.formData.requestedAmount = '300';
            else if (id === 'death') this.state.formData.requestedAmount = '2000';
            else if (id === 'medical_emergency') this.state.formData.requestedAmount = '';
            this.render(); 
        };

        // Pet selection
        this.container.querySelectorAll('.pata-pet-card:not(.disabled)').forEach(card => {
            const select = () => handlePetSelection(card.dataset.id);
            card.onclick = select;
            card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } };
        });

        // Cambiar mascota button (deselecciona y muestra todas las mascotas de nuevo)
        this.container.querySelectorAll('.pata-scroll-to-type-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation(); // Evita que el click burbujee al pet-card y vuelva a seleccionar
                this.state.ui.showAllPets = true;
                this.state.selection.petId = null;
                this.state.selection.requestType = null;
                this.state.selection.benefitType = null;
                this.state.balances = null;
                this.render();
            };
            btn.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); btn.click(); } };
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
                    
                    // Specific numeric filters
                    if (id === 'cp' || id === 'bank-clabe') value = value.replace(/[^0-9]/g, '');
                    if (id === 'cp') value = value.substring(0, 5);
                    if (id === 'bank-clabe') {
                        value = value.substring(0, 18);
                        // Autocomplete Bank Name from CLABE (First 3 digits)
                        if (value.length >= 3) {
                            const bankCode = value.substring(0, 3);
                            const bankName = MEXICAN_BANKS[bankCode];
                            if (bankName) {
                                this.state.formData.bankName = bankName;
                                const bankInput = this.container.querySelector('#pata-bank-name');
                                if (bankInput) bankInput.value = bankName;
                            }
                        }
                    }
                    if (id === 'amount' || id === 'total-paid') value = value.replace(/[^0-9.]/g, '');

                    // Map UI IDs to state keys
                    const mapping = {
                        'case-desc': 'caseDescription',
                        'case-title': 'caseTitle',
                        'incident-date': 'incidentDate',
                        'pref-time': 'preferredAppointmentTime',
                        'amount': 'requestedAmount',
                        'total-paid': 'totalPaidAmount',
                        'clinic-name': 'clinicName',
                        'cp': 'clinicPostalCode',
                        'state': 'clinicState',
                        'city': 'clinicCity',
                        'address': 'clinicAddress',
                        'vet-name': 'vetName',
                        'vet-license': 'vetLicense',
                        'center': 'alliedCenterId',
                        'bank-name': 'bankName',
                        'bank-clabe': 'bankClabe',
                        'bank-holder': 'bankHolder'
                    };

                    const stateKey = mapping[id];
                    if (stateKey) {
                        this.state.formData[stateKey] = value;
                        if (id === 'cp' || id === 'bank-clabe') el.value = value; // Force clean value in UI
                    }
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

            // Drag & Drop
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                box.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                box.addEventListener(eventName, () => box.classList.add('drag-over'), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                box.addEventListener(eventName, () => box.classList.remove('drag-over'), false);
            });

            box.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const file = dt.files[0];
                this.handleFileChange(field, file);
            }, false);
        });

        // Actions
        const submitBtn = this.container.querySelector('#pata-submit-btn');
        if (submitBtn) submitBtn.onclick = () => this.handleSubmit();

        const cancelBtn = this.container.querySelector('#pata-cancel-btn');
        if (cancelBtn) cancelBtn.onclick = () => { if (confirm('¿Deseas cancelar la solicitud?')) location.reload(); };

        const closeSuccess = this.container.querySelector('#pata-close-success');
        if (closeSuccess) {
            closeSuccess.onclick = () => { 
                window.location.href = '/miembros/fondo-solidario';
            };
            closeSuccess.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSuccess.click(); } };
        }
    }

    handleFileChange(field, file) {
        if (!file) return;
        this.state.files[field] = file;
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => { this.state.previews[field] = e.target.result; this.render(); };
            reader.readAsDataURL(file);
        } else {
            this.state.previews[field] = '📄';
            this.render();
        }
    }

    updateSubmitStatus() {
        const btn = this.container.querySelector('#pata-submit-btn');
        if (btn) btn.disabled = !this.validateForm();
    }

    async handleSubmit() {
        if (this.state.submitting) return;
        this.state.submitting = true;
        this.render();

        try {
            const memberstackId = this.state.member.id;
            const documents = [];
            for (const [key, file] of Object.entries(this.state.files)) {
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('userId', memberstackId);
                    const mapping = {
                        evidencePhoto: 'evidence_photo',
                        seniorCertificate: 'senior_certificate'
                    };
                    formData.append('docType', mapping[key] || key);

                    const uploadRes = await fetch(`${this.apiUrl}/api/upload/solidarity-document`, {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) throw new Error(`Error al subir ${key}: ${uploadData.error}`);
                    
                    documents.push({
                        docType: mapping[key] || key,
                        path: uploadData.path,
                        fileName: uploadData.fileName,
                        fileSize: uploadData.fileSize,
                        mimeType: uploadData.mimeType
                    });
                }
            }

            const payload = {
                memberstackId,
                petId: this.state.selection.petId,
                requestType: this.state.selection.requestType,
                benefitType: this.state.selection.benefitType,
                ...this.state.formData,
                documents,
                requestedAmount: parseFloat(this.state.formData.requestedAmount) || 0,
                totalPaidAmount: parseFloat(this.state.formData.totalPaidAmount) || 0
            };

            const response = await fetch(`${this.apiUrl}/api/solidarity/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                this.state.successData = data.request;
                this.state.success = true;
                this.render();
            } else {
                throw new Error(data.error || 'No se pudo crear la solicitud.');
            }
        } catch (error) {
            console.error('Submission Error:', error);
            alert('❌ ' + error.message);
        } finally {
            this.state.submitting = false;
            this.render();
        }
    }
}

// Export for module systems if needed, but here we just keep it as a global class
window.SolidarityRequestForm = SolidarityRequestForm;
