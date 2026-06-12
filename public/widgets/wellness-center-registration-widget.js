/**
 * 🏥 Club Pata Amiga - Wellness Center Registration Widget
 * Widget para registro de Centros de Bienestar en Webflow
 * Envía a POST /api/wellness
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        brandColor: '#7DD8D5',
        actionColor: '#FE8F15',
        textColor: '#2D3748',
        textLight: '#718096',
        bgLight: '#F7FAFC'
    };

    const SERVICE_OPTIONS = [
        { id: 'clinica_veterinaria', label: 'Clínica veterinaria', icon: '🏥' },
        { id: 'hospital_24_7', label: 'Hospital 24/7', icon: '🚑' },
        { id: 'tienda_mascotas', label: 'Tienda de mascotas', icon: '🛍️' },
        { id: 'hotel', label: 'Hotel / Guardería', icon: '🏨' },
        { id: 'paseador_perros', label: 'Paseador de perros', icon: '🐕' },
        { id: 'peluqueria', label: 'Peluquería / Estética', icon: '✂️' },
        { id: 'entrenamiento', label: 'Entrenamiento / Adiestramiento', icon: '🎓' },
        { id: 'otro', label: 'Otro', icon: '➕' },
    ];

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @font-face {
            font-family: 'Fraiche';
            src: url('https://uploads-ssl.webflow.com/64b5687796068e860950337c/64b56b3e96068e860953a2a6_Fraiche.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }

        .wc-reg-widget {
            font-family: 'Outfit', sans-serif;
            color: ${CONFIG.textColor};
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: transparent;
            display: none;
        }

        .wc-reg-widget.show {
            display: block;
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .wc-reg-header {
            margin-bottom: 30px;
            text-align: center;
        }

        .wc-reg-title {
            font-family: 'Fraiche', sans-serif;
            font-size: clamp(36px, 6vw, 56px);
            margin: 0 0 10px 0;
            line-height: 1.1;
            color: #000;
        }

        .wc-reg-subtitle {
            font-size: 18px;
            color: ${CONFIG.textLight};
            line-height: 1.4;
        }

        .wc-reg-form-card {
            background: #FFFFFF;
            border-radius: 30px;
            padding: 35px;
            border: 2px solid #000;
            box-shadow: 8px 8px 0 rgba(0,0,0,0.06);
        }

        .wc-reg-section-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.5rem;
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #F1F5F9;
            color: #1E293B;
            text-transform: lowercase;
        }

        .wc-reg-section-title:first-of-type {
            margin-top: 0;
        }

        .wc-reg-input-group {
            margin-bottom: 18px;
        }

        .wc-reg-label {
            display: block;
            font-weight: 700;
            margin-bottom: 6px;
            font-size: 0.95rem;
            color: #475569;
        }

        .wc-reg-input {
            width: 100%;
            padding: 14px 18px;
            border-radius: 16px;
            border: 2px solid #E2E8F0;
            font-family: 'Outfit', sans-serif;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }

        .wc-reg-input:focus {
            border-color: ${CONFIG.brandColor};
            box-shadow: 0 0 0 3px rgba(125, 216, 213, 0.2);
        }

        .wc-reg-input-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        @media (max-width: 600px) {
            .wc-reg-input-row {
                grid-template-columns: 1fr;
            }
        }

        .wc-reg-phone-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .wc-reg-country-code {
            background: #F8FAFC;
            border: 2px solid #E2E8F0;
            border-radius: 14px;
            padding: 0 15px;
            font-size: 1rem;
            font-weight: 600;
            color: ${CONFIG.textLight};
            height: 52px;
            display: flex;
            align-items: center;
        }

        .wc-reg-phone-input {
            flex: 1;
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-left: none !important;
        }

        /* Checkbox Grid */
        .wc-reg-checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            margin-top: 8px;
        }

        @media (max-width: 500px) {
            .wc-reg-checkbox-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        .wc-reg-checkbox-item {
            position: relative;
        }

        .wc-reg-checkbox-item input[type="checkbox"] {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        .wc-reg-checkbox-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 16px 12px;
            border-radius: 16px;
            border: 2px solid #E2E8F0;
            background: #FFFFFF;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 100px;
            text-align: center;
        }

        .wc-reg-checkbox-label:hover {
            border-color: ${CONFIG.brandColor};
            background: #F0FDFC;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(125, 216, 213, 0.15);
        }

        .wc-reg-checkbox-item input[type="checkbox"]:checked + .wc-reg-checkbox-label {
            border-color: ${CONFIG.brandColor};
            background: linear-gradient(135deg, #E0FDFC 0%, #D1FAE5 100%);
            box-shadow: 0 4px 16px rgba(125, 216, 213, 0.3);
        }

        .wc-reg-checkbox-icon {
            font-size: 1.8rem;
            line-height: 1;
        }

        .wc-reg-checkbox-text {
            font-size: 0.8rem;
            font-weight: 600;
            color: #1E293B;
            line-height: 1.2;
        }

        .wc-reg-checkbox-item input[type="checkbox"]:checked + .wc-reg-checkbox-label .wc-reg-checkbox-text {
            color: #006644;
        }

        .wc-reg-checkbox-item input[type="checkbox"]:focus-visible + .wc-reg-checkbox-label {
            outline: 2px solid ${CONFIG.brandColor};
            outline-offset: 2px;
        }

        /* Other service input (when "Otro" is checked) */
        .wc-reg-other-input {
            margin-top: 12px;
            display: none;
            animation: slideDown 0.3s ease;
        }

        .wc-reg-other-input.show {
            display: block;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Terms checkbox */
        .wc-reg-terms-wrapper {
            margin: 24px 0;
            padding: 20px;
            background: #F8FAFC;
            border-radius: 16px;
            border: 2px solid #E2E8F0;
        }

        .wc-reg-terms-label {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            cursor: pointer;
            font-size: 0.9rem;
            color: #475569;
            line-height: 1.5;
        }

        .wc-reg-terms-label input[type="checkbox"] {
            width: 20px;
            height: 20px;
            accent-color: ${CONFIG.brandColor};
            flex-shrink: 0;
            margin-top: 2px;
        }

        .wc-reg-terms-link {
            color: ${CONFIG.brandColor};
            text-decoration: underline;
            font-weight: 600;
        }

        .wc-reg-terms-link:hover {
            color: #008882;
        }

        /* Submit Button */
        .wc-reg-submit-btn {
            width: 100%;
            background: ${CONFIG.actionColor};
            color: #FFFFFF;
            padding: 18px;
            border-radius: 50px;
            font-weight: 800;
            font-size: 1.1rem;
            border: 2px solid #000;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Fraiche', sans-serif;
            text-transform: lowercase;
        }

        .wc-reg-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000;
        }

        .wc-reg-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .wc-reg-submit-btn.loading {
            position: relative;
            color: transparent;
        }

        .wc-reg-submit-btn.loading::after {
            content: '';
            position: absolute;
            width: 24px;
            height: 24px;
            top: 50%;
            left: 50%;
            margin-left: -12px;
            margin-top: -12px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Messages */
        .wc-reg-message {
            margin-top: 16px;
            padding: 14px 18px;
            border-radius: 12px;
            font-weight: 600;
            text-align: center;
            display: none;
        }

        .wc-reg-message.show {
            display: block;
            animation: fadeIn 0.3s ease;
        }

        .wc-reg-message.error {
            background: #FEF2F2;
            border: 2px solid #FECACA;
            color: #B91C1C;
        }

        .wc-reg-message.success {
            background: #F0FDF4;
            border: 2px solid #BBF7D0;
            color: #166534;
        }

        /* Mobile adjustments */
        @media (max-width: 600px) {
            .wc-reg-title { font-size: 28px; }
            .wc-reg-subtitle { font-size: 16px; }
            .wc-reg-form-card { padding: 24px 20px; }
            .wc-reg-checkbox-grid { grid-template-columns: 1fr 1fr; }
        }
    `;

    class WellnessRegistrationWidget {
        constructor() {
            this.container = null;
            this.selectedServices = new Set();
            this.isSubmitting = false;
            this.init();
        }

        init() {
            this.injectStyles();
            this.createContainer();
            this.render();
        }

        injectStyles() {
            if (document.getElementById('wc-reg-styles')) return;
            const styleTag = document.createElement('style');
            styleTag.id = 'wc-reg-styles';
            styleTag.innerHTML = STYLES;
            document.head.appendChild(styleTag);
        }

        createContainer() {
            const div = document.createElement('div');
            div.className = 'wc-reg-widget';
            div.id = 'wc-reg-widget-inner';

            const target = document.getElementById('wc-wellness-registration') || 
                          document.querySelector('[data-wc-widget="registration"]');

            if (target) {
                target.appendChild(div);
                this.container = div;
            } else {
                console.warn('⚠️ [WC-REG] No se encontró contenedor (#wc-wellness-registration). Usando fallback al body.');
                document.body.appendChild(div);
                this.container = div;
            }
        }

        render() {
            if (!this.container) return;

            this.container.innerHTML = `
                <div class="wc-reg-header">
                    <h1 class="wc-reg-title">Registra tu Centro de Bienestar</h1>
                    <p class="wc-reg-subtitle">Únete a la red de aliados de Pata Amiga y atiende a miles de miembros</p>
                </div>

                <form class="wc-reg-form-card" id="wc-reg-form">
                    <!-- Datos del Establecimiento -->
                    <h2 class="wc-reg-section-title">Datos del Establecimiento</h2>
                    
                    <div class="wc-reg-input-group">
                        <label class="wc-reg-label">Nombre del Establecimiento <span style="color:#E53E3E">*</span></label>
                        <input type="text" name="establishment_name" class="wc-reg-input" placeholder="Ej: Clínica Vet Pata Amiga" required autocomplete="organization">
                    </div>

                    <div class="wc-reg-input-row">
                        <div class="wc-reg-input-group">
                            <label class="wc-reg-label">Nombre de Contacto <span style="color:#E53E3E">*</span></label>
                            <input type="text" name="contact_name" class="wc-reg-input" placeholder="Tu nombre completo" required autocomplete="name">
                        </div>
                        <div class="wc-reg-input-group">
                            <label class="wc-reg-label">Correo Electrónico <span style="color:#E53E3E">*</span></label>
                            <input type="email" name="email" class="wc-reg-input" placeholder="contacto@tuclinica.com" required autocomplete="email">
                        </div>
                    </div>

                    <div class="wc-reg-input-row">
                        <div class="wc-reg-input-group">
                            <label class="wc-reg-label">Contraseña <span style="color:#E53E3E">*</span></label>
                            <input type="password" name="password" class="wc-reg-input" placeholder="Mínimo 8 caracteres" required minlength="8" autocomplete="new-password">
                        </div>
                        <div class="wc-reg-input-group">
                            <label class="wc-reg-label">Confirmar Contraseña <span style="color:#E53E3E">*</span></label>
                            <input type="password" name="confirm_password" class="wc-reg-input" placeholder="Repite tu contraseña" required autocomplete="new-password">
                        </div>
                    </div>

                    <div class="wc-reg-input-group">
                        <label class="wc-reg-label">Teléfono de Contacto <span style="color:#E53E3E">*</span></label>
                        <div class="wc-reg-phone-wrapper">
                            <span class="wc-reg-country-code">MX +52</span>
                            <input type="tel" name="phone" class="wc-reg-input wc-reg-phone-input" placeholder="55 1234 5678" required pattern="[0-9\\s]{10,}" autocomplete="tel">
                        </div>
                    </div>

                    <!-- Servicios (Checkboxes) -->
                    <h2 class="wc-reg-section-title">Servicios que Ofreces</h2>
                    <p style="margin: 0 0 16px 0; color: ${CONFIG.textLight}; font-size: 0.9rem;">Selecciona todos los que apliquen (mínimo 1)</p>
                    
                    <div class="wc-reg-checkbox-grid" id="wc-services-grid">
                        ${SERVICE_OPTIONS.map(opt => `
                            <div class="wc-reg-checkbox-item">
                                <input type="checkbox" id="wc-svc-${opt.id}" name="services" value="${opt.id}">
                                <label class="wc-reg-checkbox-label" for="wc-svc-${opt.id}">
                                    <span class="wc-reg-checkbox-icon">${opt.icon}</span>
                                    <span class="wc-reg-checkbox-text">${opt.label}</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>

                    <div class="wc-reg-input-group wc-reg-other-input" id="wc-other-service">
                        <label class="wc-reg-label">Especifica otro servicio</label>
                        <input type="text" name="other_service" class="wc-reg-input" placeholder="Ej: Rehabilitación, Acupuntura, etc.">
                    </div>

                    <!-- Términos y Condiciones -->
                    <div class="wc-reg-terms-wrapper">
                        <label class="wc-reg-terms-label">
                            <input type="checkbox" name="accept_terms" id="wc-accept-terms" required>
                            <span>Acepto los <a href="/terminos-centros-bienestar" target="_blank" class="wc-reg-terms-link">Términos y Condiciones</a> y la <a href="/aviso-privacidad" target="_blank" class="wc-reg-terms-link">Política de Privacidad</a> de Club Pata Amiga para Centros de Bienestar <span style="color:#E53E3E">*</span></span>
                        </label>
                    </div>

                    <!-- Botón Enviar -->
                    <button type="submit" class="wc-reg-submit-btn" id="wc-reg-submit">
                        Registrar mi Centro
                    </button>

                    <!-- Mensajes -->
                    <div class="wc-reg-message" id="wc-reg-message"></div>
                </form>
            `;

            this.container.classList.add('show');
            this.bindEvents();
        }

        bindEvents() {
            const form = this.container.querySelector('#wc-reg-form');
            const submitBtn = this.container.querySelector('#wc-reg-submit');
            const messageEl = this.container.querySelector('#wc-reg-message');
            const otherServiceInput = this.container.querySelector('#wc-other-service');
            const otherCheckbox = this.container.querySelector('#wc-svc-otro');

            // Toggle "Otro" input
            if (otherCheckbox && otherServiceInput) {
                otherCheckbox.addEventListener('change', () => {
                    otherServiceInput.classList.toggle('show', otherCheckbox.checked);
                    const otherInput = otherServiceInput.querySelector('input');
                    if (otherInput) otherInput.required = otherCheckbox.checked;
                });
            }

            // Form submit
            form?.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (this.isSubmitting) return;
                
                // Validar servicios seleccionados
                const checkedServices = Array.from(this.container.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);
                if (checkedServices.length === 0) {
                    this.showMessage('Por favor selecciona al menos un servicio', 'error');
                    return;
                }

                // Si "Otro" está seleccionado, validar que se haya escrito algo
                if (checkedServices.includes('otro')) {
                    const otherInput = this.container.querySelector('input[name="other_service"]');
                    if (!otherInput?.value.trim()) {
                        this.showMessage('Por favor especifica el servicio "Otro"', 'error');
                        otherInput?.focus();
                        return;
                    }
                }

                // Validar contraseñas
                const password = form.querySelector('input[name="password"]').value;
                const confirmPassword = form.querySelector('input[name="confirm_password"]').value;
                if (password !== confirmPassword) {
                    this.showMessage('Las contraseñas no coinciden', 'error');
                    return;
                }

                this.setLoading(true);
                this.showMessage('');

                const formData = {
                    establishment_name: form.querySelector('input[name="establishment_name"]').value.trim(),
                    contact_name: form.querySelector('input[name="contact_name"]').value.trim(),
                    email: form.querySelector('input[name="email"]').value.toLowerCase().trim(),
                    password: password,
                    confirm_password: confirmPassword,
                    phone: form.querySelector('input[name="phone"]').value.replace(/\s+/g, ''),
                    services: checkedServices.filter(s => s !== 'otro'),
                    ...(checkedServices.includes('otro') && { 
                        other_service: form.querySelector('input[name="other_service"]').value.trim() 
                    }),
                    accept_terms: true
                };

                try {
                    const response = await fetch(`${CONFIG.apiUrl}/api/wellness`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    const data = await response.json();

                    if (data.success) {
                        this.showMessage('¡Registro exitoso! Tu solicitud está en revisión. Te contactaremos pronto por correo.', 'success');
                        form.reset();
                        this.selectedServices.clear();
                        otherServiceInput?.classList.remove('show');
                        submitBtn.disabled = true;
                        submitBtn.style.opacity = '0.6';
                    } else {
                        throw new Error(data.error || 'Error al registrar');
                    }
                } catch (error) {
                    console.error('[WC-REG] Error:', error);
                    this.showMessage(error.message || 'Error de conexión. Intenta de nuevo.', 'error');
                } finally {
                    this.setLoading(false);
                }
            });

            // Real-time service count validation
            this.container.querySelectorAll('input[name="services"]').forEach(cb => {
                cb.addEventListener('change', () => {
                    const count = this.container.querySelectorAll('input[name="services"]:checked').length;
                    submitBtn.disabled = count === 0;
                    submitBtn.style.opacity = count === 0 ? '0.6' : '1';
                });
            });
        }

        setLoading(loading) {
            const submitBtn = this.container.querySelector('#wc-reg-submit');
            this.isSubmitting = loading;
            if (loading) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                submitBtn.textContent = '';
            } else {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrar mi Centro';
            }
        }

        showMessage(text, type = 'error') {
            const messageEl = this.container.querySelector('#wc-reg-message');
            if (!messageEl) return;
            
            messageEl.textContent = text;
            messageEl.className = `wc-reg-message show ${type === 'success' ? 'success' : 'error'}`;
            
            if (type === 'success') {
                // Auto-hide success after 5 seconds
                setTimeout(() => {
                    messageEl.classList.remove('show');
                }, 5000);
            }
        }
    }

    // Auto-inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new WellnessRegistrationWidget());
    } else {
        new WellnessRegistrationWidget();
    }

})();