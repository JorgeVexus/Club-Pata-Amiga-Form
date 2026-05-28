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
        .ppa-input { width:100%; padding:14px 20px; border:2px solid #E2E8F0; border-radius:50px; font-family:'Outfit',sans-serif; font-size:16px; outline:none; transition:all .2s; background:#fff; color:#000; }
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

        .ppa-btn-back { background:none; border:none; color:#718096; font-size:14px; font-weight:700; cursor:pointer; margin-top:16px; text-decoration:underline; width:100%; text-align:center; }
        
        .ppa-success-view { text-align:center; padding:20px 0; }
        .ppa-success-icon { font-size:64px; margin-bottom:20px; }
        
        .ppa-loading-overlay { position:absolute; inset:0; background:rgba(255,255,255,.8); z-index:10; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); display:none; }
        .ppa-spinner { width:40px; height:40px; border:4px solid #f3f3f3; border-top:4px solid #15BEB2; border-radius:50%; animation:ppaSpin 1s linear infinite; }
        @keyframes ppaSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .ppa-error-msg { background:#FFF5F5; color:#C53030; padding:12px 20px; border-radius:12px; font-size:14px; font-weight:600; margin-bottom:20px; border:1px solid #FEB2B2; display:none; }

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
                console.log('🔍 [DEBUG] Cargando datos para member:', this.member.auth.email);
                this.renderLoading();
                
                // Enviamos tanto ID como Email para asegurar que lo encuentre
                const profileRes = await fetch(`${CONFIG.apiUrl}/api/user/profile?memberstackId=${this.member.id}&email=${encodeURIComponent(this.member.auth.email)}`).then(r => r.json());
                
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
                this.renderError('No pudimos conectar con la base de datos.');
            }
        }

        determineSteps() {
            this.steps = [];
            const u = this.user || {};
            
            console.log('🛠️ [DEBUG] Evaluando campos para determinar pasos:');
            console.log('- first_name:', u.first_name);
            console.log('- last_name:', u.last_name);
            console.log('- curp:', u.curp);
            console.log('- phone:', u.phone);
            console.log('- postal_code:', u.postal_code);
            console.log('- city:', u.city);
            console.log('- colony:', u.colony);

            // Step 1: Personal Info
            // Aseguramos que los campos existan y no sean solo espacios
            const hasInfo = u.first_name && u.last_name && u.curp && u.phone && u.postal_code && u.colony && u.city;
            if (!hasInfo) {
                console.log('🚩 [DEBUG] Paso "member_info" REQUERIDO');
                this.steps.push('member_info');
            } else {
                console.log('✅ [DEBUG] Paso "member_info" SALTADO (datos completos)');
            }

            // Step 2: Documents
            console.log('- ine_front:', u.ine_front_url);
            console.log('- proof:', u.proof_of_address_url);
            const hasDocs = u.ine_front_url && u.proof_of_address_url;
            if (!hasDocs) {
                console.log('🚩 [DEBUG] Paso "documents" REQUERIDO');
                this.steps.push('documents');
            } else {
                console.log('✅ [DEBUG] Paso "documents" SALTADO');
            }

            // Step 3: Pets
            if (this.pets.length === 0) {
                console.log('🚩 [DEBUG] Paso "add_pet" REQUERIDO (0 mascotas)');
                this.steps.push('add_pet');
            } else {
                const incompletePet = this.pets.find(p => !p.primary_photo_url || (p.is_senior && !p.vet_certificate_url));
                if (incompletePet) {
                    console.log('🚩 [DEBUG] Paso "complete_pet" REQUERIDO para:', incompletePet.name);
                    this.steps.push('complete_pet');
                    this.incompletePetId = incompletePet.id;
                } else {
                    console.log('✅ [DEBUG] Paso "pets" SALTADO');
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
                case 'documents': content = this.renderDocumentsForm(); break;
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
                'documents': 'Sube tus identificaciones oficiales.',
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
                            <input type="text" name="mother_last_name" class="ppa-input" value="${u.mother_last_name || ''}" placeholder="Segundo apellido">
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

        renderDocumentsForm() {
            const u = this.user || {};
            return `
                <div id="ppa-docs-view">
                    <p style="text-align:center;margin-bottom:20px;font-size:14px;color:#4A5568;">Sube una foto clara de tus documentos. Aceptamos JPG, PNG o PDF.</p>
                    <div class="ppa-upload-grid">
                        <div class="ppa-upload-box ${u.ine_front_url ? 'done' : ''}" id="up-ine-front">
                            <input type="file" id="fi-ine-front" hidden accept="image/*,application/pdf">
                            <div class="ppa-upload-icon">🪪</div>
                            <div class="ppa-upload-text">INE Frente / Pasaporte</div>
                            <div class="ppa-upload-preview"><img src="${u.ine_front_url || ''}" id="pre-ine-front"></div>
                        </div>
                        <div class="ppa-upload-box ${u.ine_back_url ? 'done' : ''}" id="up-ine-back">
                            <input type="file" id="fi-ine-back" hidden accept="image/*,application/pdf">
                            <div class="ppa-upload-icon">🔙</div>
                            <div class="ppa-upload-text">INE Reverso</div>
                            <div class="ppa-upload-preview"><img src="${u.ine_back_url || ''}" id="pre-ine-back"></div>
                        </div>
                    </div>
                    <div class="ppa-form-group" style="margin-top:16px">
                        <div class="ppa-upload-box ${u.proof_of_address_url ? 'done' : ''}" id="up-proof" style="min-height:100px;">
                            <input type="file" id="fi-proof" hidden accept="image/*,application/pdf">
                            <div class="ppa-upload-icon">🏠</div>
                            <div class="ppa-upload-text">Comprobante de Domicilio</div>
                            <div class="ppa-upload-preview"><img src="${u.proof_of_address_url || ''}" id="pre-proof"></div>
                        </div>
                    </div>
                    <button type="button" class="ppa-btn-next" id="ppa-btn-docs">continuar</button>
                    ${this.currentStep > 1 ? '<button class="ppa-btn-back" id="ppa-btn-back">volver</button>' : ''}
                </div>
            `;
        }

        renderAddPetForm() {
            return `
                <form id="ppa-pet-form">
                    <p style="text-align:center;margin-bottom:20px;font-size:14px;color:#4A5568;">¡Cuéntanos sobre tu mascota!</p>
                    <div class="ppa-form-group">
                        <label class="ppa-label">Nombre de tu mascota</label>
                        <input type="text" name="name" class="ppa-input" placeholder="¿Cómo se llama?" required>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Especie</label>
                            <select name="petType" class="ppa-input" required>
                                <option value="perro">Perro</option>
                                <option value="gato">Gato</option>
                            </select>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Género</label>
                            <select name="gender" class="ppa-input" required>
                                <option value="macho">Macho</option>
                                <option value="hembra">Hembra</option>
                            </select>
                        </div>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Raza</label>
                            <input type="text" name="breed" class="ppa-input" placeholder="Ej: Poodle, Mestizo" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Tamaño</label>
                            <select name="breedSize" class="ppa-input" required>
                                <option value="pequeño">Pequeño</option>
                                <option value="mediano">Mediano</option>
                                <option value="grande">Grande</option>
                                <option value="extra_grande">Extra Grande</option>
                            </select>
                        </div>
                    </div>
                    <div class="ppa-row">
                        <div class="ppa-form-group">
                            <label class="ppa-label">Edad</label>
                            <input type="number" name="ageValue" class="ppa-input" placeholder="0" required>
                        </div>
                        <div class="ppa-form-group">
                            <label class="ppa-label">Unidad</label>
                            <select name="ageUnit" class="ppa-input">
                                <option value="years">Años</option>
                                <option value="months">Meses</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="background:#F7FAFC;border-radius:20px;padding:20px;margin-bottom:20px;border:1px solid #E2E8F0;">
                        <div class="ppa-form-group">
                            <label class="ppa-label" style="display:flex;align-items:center;gap:8px;">
                                <input type="checkbox" name="isAdopted" style="width:18px;height:18px;"> ¿Es adoptado?
                            </label>
                        </div>
                        <div class="ppa-form-group" id="ppa-adoption-story-box" style="display:none;">
                            <label class="ppa-label">Cuéntanos su historia de adopción</label>
                            <textarea name="adoptionStory" class="ppa-input" style="border-radius:20px;min-height:80px;" placeholder="¿Cómo llegó a tu vida?"></textarea>
                        </div>
                    </div>

                    <div class="ppa-form-group">
                        <label class="ppa-label" style="display:flex;align-items:center;gap:8px;">
                            <input type="checkbox" name="isSenior" id="ppa-is-senior" style="width:18px;height:18px;"> ¿Es mascota Senior? (Perros 7+ años, Gatos 10+ años)
                        </label>
                    </div>

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
            return `
                <form id="ppa-complete-pet-form">
                    <p style="text-align:center;margin-bottom:20px;font-size:14px;color:#4A5568;">Faltan detalles de <strong>${pet.name}</strong></p>
                    
                    ${!pet.primary_photo_url ? `
                        <div class="ppa-form-group">
                            <label class="ppa-label">Foto de ${pet.name}</label>
                            <div class="ppa-upload-box" id="up-pet-photo" style="min-height:180px;">
                                <input type="file" id="fi-pet-photo" hidden accept="image/*">
                                <div class="ppa-upload-icon">📸</div>
                                <div class="ppa-upload-text">Subir foto principal</div>
                                <div class="ppa-upload-preview"><img src="" id="pre-pet-photo"></div>
                            </div>
                        </div>
                    ` : ''}

                    ${pet.is_senior && !pet.vet_certificate_url ? `
                        <div class="ppa-form-group">
                            <label class="ppa-label">Certificado Veterinario (Mascota Senior)</label>
                            <div class="ppa-upload-box" id="up-pet-cert" style="min-height:120px;">
                                <input type="file" id="fi-pet-cert" hidden accept="image/*,application/pdf">
                                <div class="ppa-upload-icon">📜</div>
                                <div class="ppa-upload-text">Subir certificado</div>
                                <div class="ppa-upload-preview"><img src="" id="pre-pet-cert"></div>
                            </div>
                        </div>
                    ` : ''}

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
                    <div class="ppa-complete-card" style="text-align:center;">
                        <div class="ppa-complete-header">
                            <h1 class="ppa-complete-title">inicia sesión</h1>
                            <p class="ppa-complete-subtitle">Para completar tu perfil, primero necesitamos saber quién eres.</p>
                        </div>
                        <div style="padding:20px 0;">
                            <div style="font-size:64px;margin-bottom:24px;">🔑</div>
                            <button id="ppa-btn-login" class="ppa-btn-next">iniciar sesión</button>
                            <p style="margin-top:20px;font-size:14px;color:#718096;">
                                ¿No tienes cuenta? <a href="/registro" style="color:#15BEB2;font-weight:700;text-decoration:none;">Regístrate aquí</a>
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const loginBtn = document.getElementById('ppa-btn-login');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    if (window.$memberstackDom) {
                        window.$memberstackDom.openModal('LOGIN');
                    } else {
                        alert('Error al cargar el sistema de autenticación. Por favor recarga la página.');
                    }
                });
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

            // Documents Form
            ['ine-front', 'ine-back', 'proof'].forEach(id => {
                const box = document.getElementById(`up-${id}`);
                const input = document.getElementById(`fi-${id}`);
                if (box && input) {
                    box.addEventListener('click', () => input.click());
                    input.addEventListener('change', e => this.handleFileUpload(e, id));
                }
            });
            const docsBtn = document.getElementById('ppa-btn-docs');
            if (docsBtn) docsBtn.addEventListener('click', () => this.nextStep());

            // Pet Form
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

            // Complete Pet Form
            const completePetForm = document.getElementById('ppa-complete-pet-form');
            if (completePetForm) {
                completePetForm.addEventListener('submit', e => this.handleCompletePetSubmit(e));
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

        async handlePetSubmit(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            
            // Convert checkbox values
            data.isAdopted = e.target.querySelector('input[name="isAdopted"]').checked;
            data.isSenior = e.target.querySelector('input[name="isSenior"]').checked;
            
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
            const data = {
                memberstackId: this.member.id,
                petId: this.incompletePetId,
                primaryPhotoUrl: this.formData.primaryPhotoUrl,
                vetCertificateUrl: this.formData.vetCertificateUrl
            };

            this.setLoading(true);
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/update-pet-docs`, {
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
