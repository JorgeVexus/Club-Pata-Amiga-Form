/**
 * Club Pata Amiga - Complete Profile Widget v1.0
 * Embebe en Webflow con: <div id="pata-complete-profile"></div>
 */
(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        placeholderDog: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png'
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @font-face { font-family:'Fraiche'; src:url('https://uploads-ssl.webflow.com/64b5687796068e860950337c/64b56b3e96068e860953a2a6_Fraiche.otf') format('opentype'); }

        .ppa-complete-widget { font-family:'Outfit',sans-serif; max-width:600px; margin:0 auto; color:#181C1C; }
        .ppa-complete-card { background:#fff; border-radius:40px; padding:40px; border:2px solid #000; box-shadow:12px 12px 0 rgba(0,0,0,.06); position:relative; overflow:hidden; }
        
        .ppa-complete-header { text-align:center; margin-bottom:32px; }
        .ppa-complete-title { font-family:'Fraiche',sans-serif; font-size:42px; color:#000; margin:0 0 8px; line-height:1; text-transform:lowercase; }
        .ppa-complete-subtitle { font-size:16px; color:#718096; margin:0; font-weight:400; }

        .ppa-step-indicator { display:flex; gap:8px; justify-content:center; margin-bottom:32px; }
        .ppa-step-dot { width:12px; height:12px; border-radius:50%; background:#E2E8F0; border:1px solid #000; transition:all .3s; }
        .ppa-step-dot.active { background:#FE8F15; transform:scale(1.2); }
        .ppa-step-dot.done { background:#15BEB2; }

        .ppa-form-group { margin-bottom:20px; }
        .ppa-label { display:block; font-size:14px; font-weight:700; color:#4A5568; margin-bottom:8px; }
        .ppa-input { width:100%; padding:14px 20px; border:2px solid #E2E8F0; border-radius:50px; font-family:'Outfit',sans-serif; font-size:16px; outline:none; transition:all .2s; background:#fff; color:#000; box-sizing:border-box; }
        .ppa-input:focus { border-color:#15BEB2; box-shadow:0 0 0 3px rgba(21,190,178,.15); }
        .ppa-input.error { border-color:#E53E3E; }
        
        .ppa-row { display:flex; gap:16px; }
        .ppa-row > div { flex:1; }

        .ppa-upload-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:10px; }
        .ppa-upload-box { border:2px dashed #CBD5E0; border-radius:24px; padding:20px; text-align:center; cursor:pointer; transition:all .2s; background:#F8FAFC; position:relative; min-height:140px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ppa-upload-box:hover { border-color:#15BEB2; background:#F0FFFD; }
        .ppa-upload-box.done { border-color:#15BEB2; background:#E6FFFA; border-style:solid; }
        .ppa-upload-icon { font-size:24px; margin-bottom:8px; }
        .ppa-upload-text { font-size:12px; font-weight:700; color:#4A5568; }
        .ppa-upload-preview { position:absolute; inset:8px; border-radius:16px; overflow:hidden; border:1px solid #000; display:none; }
        .ppa-upload-preview img { width:100%; height:100%; object-fit:cover; }
        .ppa-upload-box.done .ppa-upload-preview { display:block; }

        .ppa-btn-next { width:100%; background:#FE8F15; color:#000; border:2px solid #000; border-radius:50px; padding:16px; font-family:'Fraiche',sans-serif; font-size:24px; cursor:pointer; transition:all .2s; margin-top:12px; text-transform:lowercase; }
        .ppa-btn-next:hover { transform:translateY(-2px); box-shadow:6px 6px 0 rgba(0,0,0,.1); }
        .ppa-btn-next:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
        .ppa-btn-secondary { width:100%; background:#00BBB4; color:#000; border:2px solid #000; border-radius:50px; padding:16px; font-family:'Fraiche',sans-serif; font-size:24px; cursor:pointer; transition:all .2s; margin-top:8px; text-transform:lowercase; }
        .ppa-btn-secondary:hover { transform:translateY(-2px); box-shadow:6px 6px 0 rgba(0,0,0,.1); }

        .ppa-btn-back { background:none; border:none; color:#718096; font-size:14px; font-weight:700; cursor:pointer; margin-top:16px; text-decoration:underline; width:100%; text-align:center; }
        
        .ppa-success-view { text-align:center; padding:20px 0; }
        .ppa-success-icon { font-size:64px; margin-bottom:20px; }
        
        .ppa-loading-overlay { position:absolute; inset:0; background:rgba(255,255,255,.8); z-index:10; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); display:none; }
        .ppa-spinner { width:40px; height:40px; border:4px solid #f3f3f3; border-top:4px solid #15BEB2; border-radius:50%; animation:ppaSpin 1s linear infinite; }
        @keyframes ppaSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .ppa-error-msg { background:#FFF5F5; color:#C53030; padding:12px 20px; border-radius:12px; font-size:14px; font-weight:600; margin-bottom:20px; border:1px solid #FEB2B2; display:none; }

        .ppa-login-shell { text-align:left; max-width:430px; margin:0 auto; }
        .ppa-login-brand { width:70px; height:auto; display:block; margin:0 auto 18px; }
        .ppa-login-kicker { font-size:12px; font-weight:900; letter-spacing:.14em; text-transform:uppercase; color:#00BBB4; text-align:center; margin:0 0 10px; }
        .ppa-login-title { font-family:'Fraiche',sans-serif; font-size:38px; line-height:1; text-align:center; color:#181C1C; margin:0 0 10px; text-transform:lowercase; }
        .ppa-login-copy { color:#5B6675; font-size:15px; line-height:1.55; text-align:center; margin:0 auto 28px; max-width:34ch; }
        .ppa-login-form { display:flex; flex-direction:column; gap:18px; }
        .ppa-login-field { display:flex; flex-direction:column; gap:8px; }
        .ppa-login-label { font-size:12px; font-weight:900; color:#2D3748; letter-spacing:.08em; text-transform:uppercase; }
        .ppa-login-input { width:100%; min-height:56px; padding:15px 20px; border:2px solid #E2E8F0; border-radius:18px; font-family:'Outfit',sans-serif; font-size:16px; outline:none; background:#fff; color:#181C1C; box-sizing:border-box; transition:border-color .2s ease, box-shadow .2s ease, transform .2s ease; }
        .ppa-login-input:focus { border-color:#00BBB4; box-shadow:0 0 0 4px rgba(0,187,180,.13); }
        .ppa-login-submit { width:100%; min-height:58px; background:#FE8F15; color:#181C1C; border:2px solid #181C1C; border-radius:50px; font-family:'Fraiche',sans-serif; font-size:24px; cursor:pointer; transition:transform .2s ease, box-shadow .2s ease, opacity .2s ease; text-transform:lowercase; box-shadow:6px 6px 0 rgba(24,28,28,.10); }
        .ppa-login-submit:hover { transform:translateY(-2px); box-shadow:8px 8px 0 rgba(24,28,28,.12); }
        .ppa-login-submit:active { transform:translateY(0); box-shadow:4px 4px 0 rgba(24,28,28,.10); }
        .ppa-login-submit:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }
        .ppa-login-footer { text-align:center; font-size:14px; color:#718096; margin:22px 0 0; }
        .ppa-login-footer a { color:#00BBB4; font-weight:900; text-decoration:none; }
        .ppa-login-support { text-align:center; font-size:13px; color:#718096; margin:12px 0 0; }

        .ppa-breed-switch { display:flex; gap:0; border:2px solid #E2E8F0; border-radius:50px; overflow:hidden; margin-bottom:20px; }
        .ppa-breed-switch-btn { flex:1; padding:12px 16px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:700; border:none; cursor:pointer; background:#fff; color:#718096; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:6px; }
        .ppa-breed-switch-btn.active { background:#15BEB2; color:#000; }
        .ppa-breed-switch-btn:first-child { border-right:1px solid #E2E8F0; }

        .ppa-section-title { font-family:'Fraiche',sans-serif; font-size:18px; color:#000; margin:24px 0 16px; padding-bottom:8px; border-bottom:1px solid #E2E8F0; text-transform:lowercase; }
        .ppa-section-title:first-of-type { margin-top:0; }

        .ppa-adoption-box { background:#F7FAFC; border-radius:20px; padding:20px; margin-bottom:20px; border:1px solid #E2E8F0; }
        .ppa-adoption-notice { font-size:12px; color:#718096; margin:8px 0 0; }

        .ppa-autocomplete-wrapper { position:relative; }
        .ppa-autocomplete-list { position:absolute; top:100%; left:0; right:0; background:#fff; border:2px solid #E2E8F0; border-top:none; border-radius:0 0 20px 20px; max-height:200px; overflow-y:auto; z-index:20; display:none; }
        .ppa-autocomplete-list.show { display:block; }
        .ppa-autocomplete-item { padding:10px 20px; cursor:pointer; font-size:14px; transition:background .15s; }
        .ppa-autocomplete-item:hover { background:#F0FFFD; }

        .ppa-info-box { background:#E6FFFA; border:1px solid #15BEB2; border-radius:16px; padding:12px 16px; font-size:13px; color:#2D3748; margin-bottom:16px; display:flex; align-items:flex-start; gap:8px; }
        .ppa-info-box.warning { background:#FFFBEB; border-color:#F6AD55; }
        .ppa-info-box.error { background:#FFF5F5; border-color:#FC8181; }

        @media(max-width:480px) {
            .ppa-complete-card { padding:30px 20px; }
            .ppa-row { flex-direction:column; gap:0; }
            .ppa-upload-grid { grid-template-columns:1fr; }
        }
    `;

    class CompleteProfileWidget {
        constructor() {
            this.member = null;
            this.user = null;
            this.pets = [];
            this.currentStep = 0;
            this.steps = []; 
            this.formData = {};
            this.isLoading = false;
        }

        async init() {
            const container = document.getElementById('pata-complete-profile');
            if (!container) return;
            this.injectStyles();
            this.renderLoading();
            await this.waitForMemberstack();
        }

        getMemberEmail(member = this.member) {
            return member?.auth?.email || member?.email || member?.data?.auth?.email || member?.data?.email || '';
        }

        getMemberId(member = this.member) {
            return member?.id || member?.memberId || member?.data?.id || member?.data?.memberId || '';
        }

        hasCompleteMemberSession(member) {
            return Boolean(this.getMemberId(member) && this.getMemberEmail(member));
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async waitForAuthenticatedMember(fallbackMember) {
            if (this.hasCompleteMemberSession(fallbackMember)) {
                return fallbackMember;
            }

            for (let attempt = 0; attempt < 12; attempt++) {
                try {
                    const { data: currentMember } = await window.$memberstackDom.getCurrentMember();
                    if (this.hasCompleteMemberSession(currentMember)) {
                        return currentMember;
                    }
                } catch (error) {
                    console.warn('Memberstack session refresh pending:', error);
                }

                await this.delay(300);
            }

            return null;
        }

        injectStyles() {
            if (document.getElementById('ppa-complete-styles')) return;
            const s = document.createElement('style');
            s.id = 'ppa-complete-styles';
            s.textContent = STYLES;
            document.head.appendChild(s);
        }

        async waitForMemberstack() {
            console.log('⏳ Esperando a Memberstack...');
            let tries = 0;
            const attempt = async () => {
                try {
                    if (window.$memberstackDom) {
                        const res = await window.$memberstackDom.getCurrentMember();
                        if (res?.data) {
                            console.log('✅ Miembro detectado:', res.data.id);
                            this.member = res.data;
                            await this.loadData();
                        } else if (tries < 15) {
                            tries++;
                            setTimeout(attempt, 500);
                        } else {
                            console.log('👤 No hay sesión activa.');
                            this.renderLoginRequired();
                        }
                    } else if (tries < 15) {
                        tries++;
                        setTimeout(attempt, 500);
                    } else {
                        this.renderError('No se pudo cargar el sistema de autenticación.');
                    }
                } catch(e) {
                    console.error('Memberstack wait error:', e);
                    this.renderError('Error al conectar con el servidor.');
                }
            };
            attempt();
        }

        async loadData() {
            try {
                const memberId = this.getMemberId();
                const memberEmail = this.getMemberEmail();

                if (!memberId || !memberEmail) {
                    throw new Error('missing_member_session_data');
                }

                console.log('🔍 [DEBUG] Cargando datos para member:', memberEmail);
                this.renderLoading();
                
                // Enviamos tanto ID como Email para asegurar que lo encuentre
                const profileRes = await fetch(`${CONFIG.apiUrl}/api/user/profile?memberstackId=${encodeURIComponent(memberId)}&email=${encodeURIComponent(memberEmail)}`).then(r => r.json());
                
                let petsRes = { success: false, pets: [] };
                if (profileRes.success && profileRes.user) {
                    this.user = profileRes.user;
                    console.log('✅ [DEBUG] Usuario cargado desde Supabase:', this.user);
                    this.formData = { ...this.user };
                    
                    // Si encontramos al usuario, buscamos sus mascotas por su ID interno de Supabase
                    petsRes = await fetch(`${CONFIG.apiUrl}/api/user/pets?userId=${this.user.id}`).then(r => r.json());
                } else {
                    console.warn('⚠️ [DEBUG] Usuario no encontrado en Supabase por ID o Email.');
                }

                console.log('📦 [DEBUG] Respuesta Perfil:', profileRes);
                console.log('🐾 [DEBUG] Respuesta Mascotas:', petsRes);
                
                if (petsRes.success) {
                    this.pets = petsRes.pets || [];
                    console.log('✅ [DEBUG] Mascotas cargadas:', this.pets.length);
                }

                this.determineSteps();
                this.startFlow();
            } catch (e) {
                console.error('❌ [DEBUG] Error cargando datos:', e);
                if (e?.message === 'missing_member_session_data') {
                    this.renderError('No pudimos confirmar tu sesion. Recarga la pagina e intenta de nuevo.');
                    return;
                }

                this.renderError('No pudimos cargar tu informacion. Recarga la pagina e intenta de nuevo.');
            }
        }

        determineSteps() {
            this.steps = [];
            const u = this.user || {};
            
            console.log('🛠️ [DEBUG] Evaluando campos para determinar pasos:');
            console.log('- first_name:', u.first_name);
            console.log('- last_name:', u.last_name);
            console.log('- mother_last_name:', u.mother_last_name);
            console.log('- curp:', u.curp);
            console.log('- phone:', u.phone);
            console.log('- postal_code:', u.postal_code);
            console.log('- city:', u.city);
            console.log('- colony:', u.colony);

            // Step 1: Personal Info
            // Aseguramos que los campos existan y no sean solo espacios
            const hasInfo = u.first_name && u.last_name && u.mother_last_name && u.curp && u.phone && u.postal_code && u.colony && u.city;
            if (!hasInfo) {
                console.log('🚩 [DEBUG] Paso "member_info" REQUERIDO');
                this.steps.push('member_info');
            } else {
                console.log('✅ [DEBUG] Paso "member_info" SALTADO (datos completos)');
            }

            // Step 2: Pets — determine missing fields per pet or need new pet
            // Filter out pets that were unsubscribed/deactivated
            const activePets = this.pets.filter(p => p.is_active !== false && p.status !== 'unsubscribed');
            console.log('🐾 [DEBUG] Mascotas activas:', activePets.length, 'de', this.pets.length, 'totales');

            if (activePets.length === 0) {
                console.log('🚩 [DEBUG] Paso "add_pet" REQUERIDO (0 mascotas activas)');
                this.steps.push('add_pet');
            } else {
                // Check each ACTIVE pet for missing fields and collect them
                const incompletePet = activePets.find(p => {
                    const missing = this.getMissingFields(p);
                    return missing.length > 0;
                });
                if (incompletePet) {
                    const missing = this.getMissingFields(incompletePet);
                    console.log('🚩 [DEBUG] Paso "complete_pet" REQUERIDO para:', incompletePet.name, '| Campos faltantes:', missing);
                    this.steps.push('complete_pet');
                    this.incompletePetId = incompletePet.id;
                    this.incompletePetMissingFields = missing;
                } else {
                    console.log('✅ [DEBUG] Paso "pets" SALTADO (todas completas)');
                }
            }

            console.log('📋 [DEBUG] Lista final de pasos:', this.steps);

            if (this.steps.length === 0) {
                this.currentStep = 4;
            } else {
                this.currentStep = 1;
            }
        }

        startFlow() {
            this.render();
        }

        render() {
            const container = document.getElementById('pata-complete-profile');
            if (!container) return;

            if (this.currentStep === 4) {
                container.innerHTML = this.renderSuccess();
                return;
            }

            const stepType = this.steps[this.currentStep - 1];
            let content = '';

            switch (stepType) {
                case 'member_info': content = this.renderMemberInfoForm(); break;
                case 'add_pet': content = this.renderAddPetForm(); break;
                case 'complete_pet': content = this.renderCompletePetForm(); break;
            }

            container.innerHTML = `
                <div class="ppa-complete-widget">
                    <div class="ppa-complete-card">
                        <div class="ppa-loading-overlay" id="ppa-loader"><div class="ppa-spinner"></div></div>
                        <div class="ppa-complete-header">
                            <h1 class="ppa-complete-title">completar perfil</h1>
                            <p class="ppa-complete-subtitle">${this.getStepSubtitle(stepType)}</p>
                        </div>
                        <div class="ppa-step-indicator">
                            ${this.steps.map((_, i) => `<div class="ppa-step-dot ${i + 1 === this.currentStep ? 'active' : i + 1 < this.currentStep ? 'done' : ''}"></div>`).join('')}
                        </div>
                        <div class="ppa-error-msg" id="ppa-error"></div>
                        <div id="ppa-step-content">${content}</div>
                    </div>
                </div>
            `;

            this.bindEvents();
        }

        getStepSubtitle(type) {
            const map = {
                'member_info': 'Tus datos básicos para la membresía.',
                'add_pet': 'Registra a tu primer peludo.',
                'complete_pet': 'Termina de subir los datos de tu mascota.'
            };
            return map[type] || 'Casi terminamos.';
        }

        renderMemberInfoForm() {
            const u = this.user || {};
            return `
                <form id="ppa-member-form">
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Nombre(s)</label>
                            <input type="text" name="first_name" class="ppa-input" value="${u.first_name || ''}" placeholder="Tu nombre" required>
                        </div>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Apellido Paterno</label>
                            <input type="text" name="last_name" class="ppa-input" value="${u.last_name || ''}" placeholder="Primer apellido" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Apellido Materno</label>
                            <input type="text" name="mother_last_name" class="ppa-input" value="${u.mother_last_name || ''}" placeholder="Segundo apellido" required>
                        </div>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">CURP</label>
                            <input type="text" name="curp" class="ppa-input" value="${u.curp || ''}" placeholder="18 caracteres" maxlength="18" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Teléfono</label>
                            <input type="tel" name="phone" class="ppa-input" value="${u.phone || ''}" placeholder="10 dígitos" maxlength="10" required>
                        </div>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Código Postal</label>
                            <input type="text" name="postal_code" id="ppa-cp" class="ppa-input" value="${u.postal_code || ''}" placeholder="00000" maxlength="5" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Estado</label>
                            <input type="text" name="state" id="ppa-state" class="ppa-input" value="${u.state || ''}" readonly>
                        </div>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Municipio/Alcaldía</label>
                            <input type="text" name="city" id="ppa-city" class="ppa-input" value="${u.city || ''}" placeholder="Tu municipio o alcaldía" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Colonia</label>
                            <select name="colony" id="ppa-colony" class="ppa-input" required>
                                ${u.colony ? `<option value="${u.colony}">${u.colony}</option>` : '<option value="">Ingresa tu CP primero</option>'}
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="ppa-btn-next">guardar y continuar</button>
                </form>
            `;
        }



        getMissingFields(pet) {
            const missing = [];
            if (!pet.gender || (pet.gender !== 'macho' && pet.gender !== 'hembra')) missing.push('gender');
            const hasBreed = pet.is_mixed_breed || (pet.breed && pet.breed.trim() !== '' && pet.breed !== 'Mestizo' && pet.breed !== 'Doméstico');
            if (!pet.is_mixed_breed && !hasBreed) missing.push('breed');
            if (pet.is_mixed_breed === undefined || pet.is_mixed_breed === null) missing.push('breedType');
            if (!pet.coat_color || pet.coat_color.trim() === '') missing.push('coatColor');
            if (!pet.nose_color || pet.nose_color.trim() === '') missing.push('noseColor');
            if (!pet.eye_color || pet.eye_color.trim() === '') missing.push('eyeColor');
            if (!(pet.primary_photo_url || pet.photo_url)) missing.push('photo');
            if (pet.is_senior && !pet.vet_certificate_url) missing.push('vetCert');
            return missing;
        }

        renderAddPetForm() {
            return `
                <form id="ppa-pet-form">
                    <p style="text-align:center;margin-bottom:20px;font-size:14px;color:#4A5568;">¡Cuéntanos sobre tu mascota!</p>

                    <h3 class="ppa-section-title">🐾 datos básicos</h3>

                    <div class="ppa-form-group">
                        <label class="ppa-label">Nombre de tu mascota</label>
                        <input type="text" name="name" class="ppa-input" placeholder="¿Cómo se llama?" required>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Especie</label>
                            <select name="petType" id="ppa-pet-type" class="ppa-input" required>
                                <option value="perro">Perro</option>
                                <option value="gato">Gato</option>
                            </select>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Sexo</label>
                            <select name="gender" class="ppa-input" required>
                                <option value="" disabled selected>Selecciona</option>
                                <option value="macho">Macho</option>
                                <option value="hembra">Hembra</option>
                            </select>
                        </div>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Edad</label>
                            <input type="number" name="ageValue" class="ppa-input" placeholder="0" min="0" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Unidad</label>
                            <select name="ageUnit" class="ppa-input">
                                <option value="years">Años</option>
                                <option value="months">Meses</option>
                            </select>
                        </div>
                    </div>
                    <div class="ppa-form-group">
                        <label class="ppa-label">Tamaño</label>
                        <select name="breedSize" class="ppa-input" required>
                            <option value="" disabled selected>Selecciona</option>
                            <option value="pequeño">Pequeño</option>
                            <option value="mediano">Mediano</option>
                            <option value="grande">Grande</option>
                            <option value="extra_grande">Extra Grande</option>
                        </select>
                    </div>

                    <h3 class="ppa-section-title">📋 información general</h3>

                    <div class="ppa-form-group">
                        <label class="ppa-label">Tipo de raza</label>
                        <div class="ppa-breed-switch">
                            <button type="button" class="ppa-breed-switch-btn active" id="ppa-breed-mestizo" data-value="true">
                                <span id="ppa-breed-mestizo-label">Mestizo</span>
                            </button>
                            <button type="button" class="ppa-breed-switch-btn" id="ppa-breed-raza" data-value="false">
                                Raza
                            </button>
                        </div>
                        <input type="hidden" name="isMixed" id="ppa-is-mixed" value="true">
                    </div>

                    <div class="ppa-form-group" id="ppa-breed-input-box" style="display:none;">
                        <label class="ppa-label">Raza</label>
                        <div class="ppa-autocomplete-wrapper">
                            <input type="text" name="breed" id="ppa-breed-input" class="ppa-input" placeholder="Buscar raza..." autocomplete="off">
                            <div class="ppa-autocomplete-list" id="ppa-breed-list"></div>
                        </div>
                    </div>

                    <h3 class="ppa-section-title">🎨 características físicas</h3>

                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Color de pelo *</label>
                            <input type="text" name="coatColor" class="ppa-input" placeholder="Ej: Café, Negro" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Color de nariz</label>
                            <input type="text" name="noseColor" class="ppa-input" placeholder="Ej: Negro, Rosa">
                        </div>
                    </div>
                    <div class="ppa-form-group">
                        <label class="ppa-label">Color de ojos</label>
                        <input type="text" name="eyeColor" class="ppa-input" placeholder="Ej: Café, Azul">
                    </div>

                    <h3 class="ppa-section-title">🏠 adopción</h3>

                    <div class="ppa-adoption-box">
                        <div class="ppa-form-group" style="margin-bottom:8px;">
                            <label class="ppa-label" style="display:flex;align-items:center;gap:8px;margin-bottom:0;">
                                <input type="checkbox" name="isAdopted" style="width:18px;height:18px;"> ¿Es adoptado/rescatado?
                            </label>
                        </div>
                        <p class="ppa-adoption-notice">⚠️ Al llenar la historia nos autorizas a publicarla en redes para inspirar a otros.</p>
                        <div class="ppa-form-group" id="ppa-adoption-story-box" style="display:none;margin-top:12px;">
                            <label class="ppa-label">Cuéntanos su historia</label>
                            <textarea name="adoptionStory" class="ppa-input" style="border-radius:20px;min-height:80px;" placeholder="¿Cómo llegó a tu vida?" maxlength="500"></textarea>
                        </div>
                    </div>

                    <div class="ppa-form-group">
                        <label class="ppa-label" style="display:flex;align-items:center;gap:8px;">
                            <input type="checkbox" name="isSenior" id="ppa-is-senior" style="width:18px;height:18px;"> ¿Es mascota Senior? (Perros 7+ años, Gatos 10+ años)
                        </label>
                    </div>

                    <h3 class="ppa-section-title">📷 fotografía</h3>

                    <div class="ppa-form-group">
                        <label class="ppa-label">Foto de tu mascota</label>
                        <div class="ppa-upload-box" id="up-pet-photo" style="min-height:180px;">
                            <input type="file" id="fi-pet-photo" hidden accept="image/*">
                            <div class="ppa-upload-icon">📸</div>
                            <div class="ppa-upload-text">Subir foto principal</div>
                            <div class="ppa-upload-preview"><img src="" id="pre-pet-photo"></div>
                        </div>
                    </div>

                    <div class="ppa-form-group" id="ppa-pet-cert-box" style="display:none;">
                        <label class="ppa-label">Certificado Veterinario (Requerido para Senior)</label>
                        <div class="ppa-upload-box" id="up-pet-cert" style="min-height:100px;">
                            <input type="file" id="fi-pet-cert" hidden accept="image/*,application/pdf">
                            <div class="ppa-upload-icon">📜</div>
                            <div class="ppa-upload-text">Subir certificado</div>
                            <div class="ppa-upload-preview"><img src="" id="pre-pet-cert"></div>
                        </div>
                    </div>

                    <button type="submit" class="ppa-btn-next">registrar mascota</button>
                    ${this.currentStep > 1 ? '<button class="ppa-btn-back" id="ppa-btn-back">volver</button>' : ''}
                </form>
            `;
        }

        renderCompletePetForm() {
            const pet = this.pets.find(p => p.id === this.incompletePetId) || {};
            const missing = this.incompletePetMissingFields || this.getMissingFields(pet);
            const isMixed = pet.is_mixed_breed !== undefined ? pet.is_mixed_breed : true;

            let fieldsHtml = '';

            // Gender
            if (missing.includes('gender')) {
                fieldsHtml += `
                    <div class="ppa-form-group">
                        <label class="ppa-label">Sexo</label>
                        <select name="gender" class="ppa-input" required>
                            <option value="" selected>Selecciona el sexo</option>
                            <option value="macho">Macho</option>
                            <option value="hembra">Hembra</option>
                        </select>
                    </div>`;
            }

            // Breed type + breed input
            if (missing.includes('breedType') || missing.includes('breed')) {
                fieldsHtml += `
                    <div class="ppa-form-group">
                        <label class="ppa-label">Tipo de raza</label>
                        <div class="ppa-breed-switch">
                            <button type="button" class="ppa-breed-switch-btn ${isMixed ? 'active' : ''}" id="ppa-complete-breed-mestizo" data-value="true">
                                ${pet.pet_type === 'cat' ? 'Doméstico' : 'Mestizo'}
                            </button>
                            <button type="button" class="ppa-breed-switch-btn ${!isMixed ? 'active' : ''}" id="ppa-complete-breed-raza" data-value="false">
                                Raza
                            </button>
                        </div>
                        <input type="hidden" name="isMixedBreed" id="ppa-complete-pet-mixed" value="${isMixed}">
                    </div>
                    <div class="ppa-form-group" id="ppa-complete-pet-breed-box" style="display: ${isMixed ? 'none' : 'block'};">
                        <label class="ppa-label">Raza</label>
                        <div class="ppa-autocomplete-wrapper">
                            <input type="text" name="breed" id="ppa-complete-breed-input" class="ppa-input" value="${pet.breed && pet.breed !== 'Mestizo' && pet.breed !== 'Doméstico' ? pet.breed : ''}" placeholder="Buscar raza..." autocomplete="off">
                            <div class="ppa-autocomplete-list" id="ppa-complete-breed-list"></div>
                        </div>
                    </div>`;
            }

            // Coat color
            if (missing.includes('coatColor')) {
                fieldsHtml += `
                    <div class="ppa-form-group">
                        <label class="ppa-label">Color de pelo *</label>
                        <input type="text" name="coatColor" class="ppa-input" placeholder="Ej: Café, Negro" required>
                    </div>`;
            }

            // Nose color
            if (missing.includes('noseColor')) {
                fieldsHtml += `
                    <div class="ppa-form-group">
                        <label class="ppa-label">Color de nariz</label>
                        <input type="text" name="noseColor" class="ppa-input" placeholder="Ej: Negro, Rosa">
                    </div>`;
            }

            // Eye color
            if (missing.includes('eyeColor')) {
                fieldsHtml += `
                    <div class="ppa-form-group">
                        <label class="ppa-label">Color de ojos</label>
                        <input type="text" name="eyeColor" class="ppa-input" placeholder="Ej: Café, Azul">
                    </div>`;
            }

            // Photo
            if (missing.includes('photo')) {
                fieldsHtml += `
                    <div class="ppa-form-group">
                        <label class="ppa-label">Foto de tu mascota</label>
                        <div class="ppa-upload-box" id="up-pet-photo" style="min-height:180px;">
                            <input type="file" id="fi-pet-photo" hidden accept="image/*">
                            <div class="ppa-upload-icon">📸</div>
                            <div class="ppa-upload-text">Subir foto principal</div>
                            <div class="ppa-upload-preview"><img src="" id="pre-pet-photo"></div>
                        </div>
                    </div>`;
            }

            // Vet certificate (senior)
            if (missing.includes('vetCert')) {
                fieldsHtml += `
                    <div class="ppa-form-group">
                        <label class="ppa-label">Certificado Veterinario (Requerido para Senior)</label>
                        <div class="ppa-upload-box" id="up-pet-cert" style="min-height:120px;">
                            <input type="file" id="fi-pet-cert" hidden accept="image/*,application/pdf">
                            <div class="ppa-upload-icon">📜</div>
                            <div class="ppa-upload-text">Subir certificado</div>
                            <div class="ppa-upload-preview"><img src="" id="pre-pet-cert"></div>
                        </div>
                    </div>`;
            }

            const petEmoji = pet.pet_type === 'cat' ? '🐱' : '🐶';
            const missingCount = missing.length;

            return `
                <form id="ppa-complete-pet-form">
                    <div class="ppa-info-box">
                        <span>${petEmoji}</span>
                        <span>A <strong>${pet.name}</strong> le ${missingCount === 1 ? 'falta 1 dato' : 'faltan ' + missingCount + ' datos'} por completar.</span>
                    </div>
                    ${fieldsHtml}
                    <button type="submit" class="ppa-btn-next">completar información</button>
                    ${this.currentStep > 1 ? '<button class="ppa-btn-back" id="ppa-btn-back">volver</button>' : ''}
                </form>
            `;
        }

        renderSuccess() {
            return `
                <div class="ppa-complete-widget">
                    <div class="ppa-complete-card" style="text-align:center;">
                        <div class="ppa-success-view">
                            <div class="ppa-success-icon">🎉</div>
                            <h1 class="ppa-complete-title">¡perfil completo!</h1>
                            <p class="ppa-complete-subtitle">Tu información ha sido actualizada. Ya eres parte activa de la manada.</p>
                            <button class="ppa-btn-next" onclick="window.location.reload()" style="max-width:240px;margin-top:32px;">ver mi perfil</button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderLoading() {
            const container = document.getElementById('pata-complete-profile');
            if (container) container.innerHTML = '<div style="text-align:center;padding:60px;font-family:Outfit,sans-serif;color:#666;"><div class="ppa-spinner" style="margin:0 auto 20px;"></div>Cargando...</div>';
        }

        renderLoginRequired() {
            const container = document.getElementById('pata-complete-profile');
            if (!container) return;
            
            container.innerHTML = `
                <div class="ppa-complete-widget">
                    <div class="ppa-complete-card">
                        <div class="ppa-loading-overlay" id="ppa-loader"><div class="ppa-spinner"></div></div>
                        <div class="ppa-login-shell">
                            <img
                                src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png"
                                alt="Club Pata Amiga"
                                class="ppa-login-brand"
                            >
                            <p class="ppa-login-kicker">miembros</p>
                            <h1 class="ppa-login-title">inicia sesión</h1>
                            <p class="ppa-login-copy">Entra con el correo de tu membresía para completar los datos que faltan.</p>
                            <div class="ppa-error-msg" id="ppa-error"></div>

                            <form id="ppa-login-form" class="ppa-login-form">
                                <div class="ppa-login-field">
                                    <label class="ppa-login-label" for="ppa-login-email">correo electrónico</label>
                                    <input
                                        id="ppa-login-email"
                                        name="email"
                                        type="email"
                                        class="ppa-login-input"
                                        placeholder="clubpataamiga@correo.com"
                                        autocomplete="email"
                                        required
                                    >
                                </div>
                                <div class="ppa-login-field">
                                    <label class="ppa-login-label" for="ppa-login-password">contraseña</label>
                                    <input
                                        id="ppa-login-password"
                                        name="password"
                                        type="password"
                                        class="ppa-login-input"
                                        placeholder="Tu contraseña"
                                        autocomplete="current-password"
                                        required
                                    >
                                </div>
                                <button type="submit" id="ppa-btn-login" class="ppa-login-submit ppa-btn-next">entrar y continuar</button>
                            </form>
                            <p class="ppa-login-footer">
                                ¿No tienes cuenta? <a href="/registro">Regístrate aquí</a>
                            </p>
                            <p class="ppa-login-support">
                                Si no recuerdas tu contraseña, usa la opción de recuperación en tu correo de acceso.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const loginForm = document.getElementById('ppa-login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', e => this.handleLoginSubmit(e));
            }
        }

        async handleLoginSubmit(e) {
            e.preventDefault();

            if (!window.$memberstackDom) {
                this.showError('No se pudo cargar el sistema de autenticación. Recarga la página e intenta de nuevo.');
                return;
            }

            const fd = new FormData(e.target);
            const email = String(fd.get('email') || '').trim();
            const password = String(fd.get('password') || '');

            if (!email || !password) {
                this.showError('Escribe tu correo y contraseña para continuar.');
                return;
            }

            this.setLoading(true);
            try {
                const loginResult = await window.$memberstackDom.loginMemberEmailPassword({
                    email,
                    password,
                });

                if (!loginResult?.data) {
                    this.showError('No pudimos iniciar sesión con esos datos.');
                    return;
                }

                const authenticatedMember = await this.waitForAuthenticatedMember(loginResult.data);
                if (!authenticatedMember) {
                    this.showError('No pudimos confirmar tu sesion. Recarga la pagina e intenta de nuevo.');
                    return;
                }

                this.member = authenticatedMember;
                await this.loadData();
            } catch (error) {
                console.error('Login error:', error);
                this.showError('No pudimos iniciar sesión. Revisa tu correo y contraseña.');
            } finally {
                this.setLoading(false);
            }
        }

        renderError(msg) {
            const container = document.getElementById('pata-complete-profile');
            if (container) container.innerHTML = `<div style="text-align:center;padding:60px;font-family:Outfit,sans-serif;color:#E53E3E;font-weight:700;">${msg}</div>`;
        }

        bindEvents() {
            const stepContent = document.getElementById('ppa-step-content');
            if (!stepContent) return;

            // Member Info Form
            const memberForm = document.getElementById('ppa-member-form');
            if (memberForm) {
                memberForm.addEventListener('submit', e => this.handleMemberSubmit(e));
                const cpInput = document.getElementById('ppa-cp');
                if (cpInput) {
                    cpInput.addEventListener('input', e => this.handleCPChange(e));
                    // Si ya tiene 5 dígitos al cargar, poblar colonias
                    if (cpInput.value && cpInput.value.length === 5) {
                        this.handleCPChange({ target: cpInput });
                    }
                }
            }

            // Pet Form (add_pet)
            const petForm = document.getElementById('ppa-pet-form');
            if (petForm) {
                petForm.addEventListener('submit', e => this.handlePetSubmit(e));
                
                const isAdoptedCheck = petForm.querySelector('input[name="isAdopted"]');
                const adoptionStoryBox = document.getElementById('ppa-adoption-story-box');
                if (isAdoptedCheck && adoptionStoryBox) {
                    isAdoptedCheck.addEventListener('change', e => {
                        adoptionStoryBox.style.display = e.target.checked ? 'block' : 'none';
                    });
                }

                const isSeniorCheck = document.getElementById('ppa-is-senior');
                const petCertBox = document.getElementById('ppa-pet-cert-box');
                if (isSeniorCheck && petCertBox) {
                    isSeniorCheck.addEventListener('change', e => {
                        petCertBox.style.display = e.target.checked ? 'block' : 'none';
                    });
                }

                // Breed type toggle
                const breedMestizoBtn = document.getElementById('ppa-breed-mestizo');
                const breedRazaBtn = document.getElementById('ppa-breed-raza');
                const isMixedInput = document.getElementById('ppa-is-mixed');
                const breedInputBox = document.getElementById('ppa-breed-input-box');
                const petTypeSelect = document.getElementById('ppa-pet-type');
                const mestizoLabel = document.getElementById('ppa-breed-mestizo-label');
                if (breedMestizoBtn && breedRazaBtn && isMixedInput && breedInputBox) {
                    breedMestizoBtn.addEventListener('click', () => {
                        breedMestizoBtn.classList.add('active');
                        breedRazaBtn.classList.remove('active');
                        isMixedInput.value = 'true';
                        breedInputBox.style.display = 'none';
                    });
                    breedRazaBtn.addEventListener('click', () => {
                        breedRazaBtn.classList.add('active');
                        breedMestizoBtn.classList.remove('active');
                        isMixedInput.value = 'false';
                        breedInputBox.style.display = 'block';
                    });
                }
                // Update Mestizo/Doméstico label on species change
                if (petTypeSelect && mestizoLabel) {
                    petTypeSelect.addEventListener('change', e => {
                        mestizoLabel.textContent = e.target.value === 'gato' ? 'Doméstico' : 'Mestizo';
                    });
                }

                // Breed autocomplete
                this.setupBreedAutocomplete('ppa-breed-input', 'ppa-breed-list', 'ppa-pet-type');

                // File uploads
                const petPhotoBox = document.getElementById('up-pet-photo');
                const petPhotoInput = document.getElementById('fi-pet-photo');
                if (petPhotoBox && petPhotoInput) {
                    petPhotoBox.addEventListener('click', () => petPhotoInput.click());
                    petPhotoInput.addEventListener('change', e => this.handleFileUpload(e, 'pet-photo'));
                }

                const petCertBoxUpload = document.getElementById('up-pet-cert');
                const petCertInput = document.getElementById('fi-pet-cert');
                if (petCertBoxUpload && petCertInput) {
                    petCertBoxUpload.addEventListener('click', () => petCertInput.click());
                    petCertInput.addEventListener('change', e => this.handleFileUpload(e, 'pet-cert'));
                }
            }

            // Complete Pet Form (complete_pet — dynamic missing fields)
            const completePetForm = document.getElementById('ppa-complete-pet-form');
            if (completePetForm) {
                completePetForm.addEventListener('submit', e => this.handleCompletePetSubmit(e));
                
                // Breed type toggle (only present if breed fields are missing)
                const mestizoBtn = document.getElementById('ppa-complete-breed-mestizo');
                const razaBtn = document.getElementById('ppa-complete-breed-raza');
                const mixedInput = document.getElementById('ppa-complete-pet-mixed');
                const breedBox = document.getElementById('ppa-complete-pet-breed-box');
                if (mestizoBtn && razaBtn && mixedInput && breedBox) {
                    mestizoBtn.addEventListener('click', () => {
                        mestizoBtn.classList.add('active');
                        razaBtn.classList.remove('active');
                        mixedInput.value = 'true';
                        breedBox.style.display = 'none';
                    });
                    razaBtn.addEventListener('click', () => {
                        razaBtn.classList.add('active');
                        mestizoBtn.classList.remove('active');
                        mixedInput.value = 'false';
                        breedBox.style.display = 'block';
                    });
                }

                // Breed autocomplete in complete form
                const pet = this.pets.find(p => p.id === this.incompletePetId);
                const petType = pet ? (pet.pet_type === 'dog' ? 'perro' : pet.pet_type === 'cat' ? 'gato' : pet.pet_type) : 'perro';
                this.setupBreedAutocomplete('ppa-complete-breed-input', 'ppa-complete-breed-list', null, petType);

                // File uploads (only present if those fields are missing)
                const petPhotoBox = document.getElementById('up-pet-photo');
                const petPhotoInput = document.getElementById('fi-pet-photo');
                if (petPhotoBox && petPhotoInput) {
                    petPhotoBox.addEventListener('click', () => petPhotoInput.click());
                    petPhotoInput.addEventListener('change', e => this.handleFileUpload(e, 'pet-photo'));
                }
                const petCertBox = document.getElementById('up-pet-cert');
                const petCertInput = document.getElementById('fi-pet-cert');
                if (petCertBox && petCertInput) {
                    petCertBox.addEventListener('click', () => petCertInput.click());
                    petCertInput.addEventListener('change', e => this.handleFileUpload(e, 'pet-cert'));
                }
            }

            // Back button
            const backBtn = document.getElementById('ppa-btn-back');
            if (backBtn) backBtn.addEventListener('click', () => this.prevStep());
        }

        setLoading(val) {
            this.isLoading = val;
            const loader = document.getElementById('ppa-loader');
            if (loader) loader.style.display = val ? 'flex' : 'none';
            const btns = document.querySelectorAll('.ppa-btn-next');
            btns.forEach(b => b.disabled = val);
        }

        showError(msg) {
            const err = document.getElementById('ppa-error');
            if (err) {
                err.textContent = msg;
                err.style.display = 'block';
                setTimeout(() => err.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            }
        }

        async handleCPChange(e) {
            const cp = e.target.value;
            if (cp.length === 5) {
                try {
                    const res = await fetch(`${CONFIG.apiUrl}/api/sepomex?cp=${cp}`).then(r => r.json());
                    if (res.success && res.data) {
                        const stateInput = document.getElementById('ppa-state');
                        const cityInput = document.getElementById('ppa-city');
                        const colonySelect = document.getElementById('ppa-colony');

                        if (stateInput) stateInput.value = res.data.state || '';
                        if (cityInput) cityInput.value = res.data.municipality || '';
                        
                        this.formData.state = res.data.state || '';
                        this.formData.city = res.data.municipality || '';

                        if (colonySelect) {
                            const currentColony = this.formData.colony || (this.user && this.user.colony) || '';
                            colonySelect.innerHTML = '';
                            if (res.data.colonies && res.data.colonies.length > 0) {
                                res.data.colonies.forEach(colony => {
                                    const opt = document.createElement('option');
                                    opt.value = colony;
                                    opt.textContent = colony;
                                    if (colony === currentColony) {
                                        opt.selected = true;
                                    }
                                    colonySelect.appendChild(opt);
                                });
                                if (!res.data.colonies.includes(currentColony)) {
                                    this.formData.colony = res.data.colonies[0];
                                } else {
                                    this.formData.colony = currentColony;
                                }
                            } else {
                                const opt = document.createElement('option');
                                opt.value = '';
                                opt.textContent = 'No se encontraron colonias';
                                colonySelect.appendChild(opt);
                                this.formData.colony = '';
                            }
                        }
                    }
                } catch (e) {
                    console.error('CP fetch error:', e);
                }
            }
        }

        async handleFileUpload(e, type) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo es muy pesado (máx 5MB)');
                return;
            }

            const box = document.getElementById(`up-${type}`);
            const preview = document.getElementById(`pre-${type}`);
            
            this.setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('memberstackId', this.member.id);
            formData.append('userId', this.member.id);

            let endpoint = `${CONFIG.apiUrl}/api/upload/document`;
            if (type === 'pet-photo') endpoint = `${CONFIG.apiUrl}/api/upload/pet-photo`;
            if (type === 'pet-cert') {
                endpoint = `${CONFIG.apiUrl}/api/upload/vet-certificate`;
                formData.append('type', 'vet_certificate');
            }
            if (type === 'ine-front' || type === 'ine-back' || type === 'proof') {
                formData.append('type', type === 'proof' ? 'proof_of_address' : type === 'ine-front' ? 'ine_front' : 'ine_back');
            }

            try {
                const res = await fetch(endpoint, { method: 'POST', body: formData }).then(r => r.json());
                if (res.success && res.url) {
                    if (preview) {
                        preview.src = res.url;
                        box.classList.add('done');
                    }
                    // Save to formData
                    const fieldMap = {
                        'ine-front': 'ine_front_url',
                        'ine-back': 'ine_back_url',
                        'proof': 'proof_of_address_url',
                        'pet-photo': 'primaryPhotoUrl',
                        'pet-cert': 'vetCertificateUrl'
                    };
                    if (fieldMap[type]) this.formData[fieldMap[type]] = res.url;
                } else {
                    alert('Error al subir archivo: ' + (res.error || 'Intenta de nuevo'));
                }
            } catch (err) {
                console.error('Upload error:', err);
                alert('Error de conexión al subir archivo');
            } finally {
                this.setLoading(false);
            }
        }

        async handleMemberSubmit(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            data.memberstackId = this.member.id;

            this.setLoading(true);
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/update-profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(r => r.json());

                if (res.success) {
                    this.nextStep();
                } else {
                    this.showError(res.error || 'Error al guardar información');
                }
            } catch (err) {
                this.showError('Error de conexión');
            } finally {
                this.setLoading(false);
            }
        }

        setupBreedAutocomplete(inputId, listId, typeSelectId, fixedType) {
            const breedInput = document.getElementById(inputId);
            const breedList = document.getElementById(listId);
            if (!breedInput || !breedList) return;

            let debounceTimer = null;
            breedInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                const query = breedInput.value.trim();
                if (query.length < 2) { breedList.classList.remove('show'); return; }
                debounceTimer = setTimeout(async () => {
                    const petType = fixedType || (typeSelectId && document.getElementById(typeSelectId)?.value) || 'perro';
                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/breeds?type=${petType}&search=${encodeURIComponent(query)}`).then(r => r.json());
                        if (res.breeds && res.breeds.length > 0) {
                            breedList.innerHTML = res.breeds.slice(0, 8).map(b => `<div class="ppa-autocomplete-item" data-breed="${b.name}">${b.name}</div>`).join('');
                            breedList.classList.add('show');
                            breedList.querySelectorAll('.ppa-autocomplete-item').forEach(item => {
                                item.addEventListener('click', () => {
                                    breedInput.value = item.dataset.breed;
                                    breedList.classList.remove('show');
                                });
                            });
                        } else {
                            breedList.classList.remove('show');
                        }
                    } catch (e) { breedList.classList.remove('show'); }
                }, 300);
            });
            document.addEventListener('click', (e) => {
                if (!breedInput.contains(e.target) && !breedList.contains(e.target)) {
                    breedList.classList.remove('show');
                }
            });
        }

        async handlePetSubmit(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            
            // Convert checkbox values
            data.isAdopted = e.target.querySelector('input[name="isAdopted"]').checked;
            data.isSenior = e.target.querySelector('input[name="isSenior"]').checked;
            // Read hidden isMixed value
            const isMixedVal = document.getElementById('ppa-is-mixed')?.value;
            data.isMixed = isMixedVal === 'true';
            if (data.isMixed) {
                const petTypeVal = document.getElementById('ppa-pet-type')?.value;
                data.breed = petTypeVal === 'gato' ? 'Doméstico' : 'Mestizo';
            }
            
            data.memberstackId = this.member.id;
            data.primaryPhotoUrl = this.formData.primaryPhotoUrl;
            data.vetCertificateUrl = this.formData.vetCertificateUrl;

            if (!data.primaryPhotoUrl) {
                this.showError('Debes subir una foto de tu mascota');
                return;
            }

            if (data.isSenior && !data.vetCertificateUrl) {
                this.showError('Debes subir el certificado veterinario para mascotas senior');
                return;
            }

            this.setLoading(true);
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/add-pet`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(r => r.json());

                if (res.success) {
                    this.nextStep();
                } else {
                    this.showError(res.error || 'Error al registrar mascota');
                }
            } catch (err) {
                this.showError('Error de conexión');
            } finally {
                this.setLoading(false);
            }
        }

        async handleCompletePetSubmit(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            const pet = this.pets.find(p => p.id === this.incompletePetId) || {};
            
            // Parse isMixedBreed from hidden input if present
            const mixedInput = document.getElementById('ppa-complete-pet-mixed');
            if (mixedInput) {
                data.isMixedBreed = mixedInput.value === 'true';
                if (data.isMixedBreed && !data.breed) {
                    data.breed = pet.pet_type === 'cat' ? 'Doméstico' : 'Mestizo';
                }
            }
            
            // Set additional required values, merging existing pet data with form data
            data.userId = this.member.id;
            data.petId = this.incompletePetId;
            data.photo1Url = this.formData.primaryPhotoUrl || pet.primary_photo_url || pet.photo_url;
            data.vetCertificateUrl = this.formData.vetCertificateUrl || pet.vet_certificate_url;

            // Only validate photo if it was a missing field
            const missing = this.incompletePetMissingFields || [];
            if (missing.includes('photo') && !data.photo1Url) {
                this.showError('Debes subir una foto de tu mascota');
                return;
            }

            if (missing.includes('vetCert') && !data.vetCertificateUrl) {
                this.showError('Debes subir el certificado veterinario para mascotas senior');
                return;
            }

            this.setLoading(true);
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/${this.incompletePetId}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(r => r.json());

                if (res.success) {
                    this.nextStep();
                } else {
                    this.showError(res.error || 'Error al completar información');
                }
            } catch (err) {
                this.showError('Error de conexión');
            } finally {
                this.setLoading(false);
            }
        }

        nextStep() {
            if (this.currentStep < this.steps.length) {
                this.currentStep++;
                this.render();
            } else {
                this.currentStep = 4;
                this.render();
            }
        }

        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this.render();
            }
        }
    }

    // Auto-init
    const widget = new CompleteProfileWidget();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => widget.init());
    } else {
        widget.init();
    }
})();
