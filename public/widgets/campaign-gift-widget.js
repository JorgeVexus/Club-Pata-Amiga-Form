/**
 * 🎁 Widget Campaña Regalo - Club Pata Amiga
 * Integración en Webflow y Next.js landings via embed.
 * 
 * Replica con total precisión el diseño original de la landing,
 * incluyendo colores, sombras suaves (sin bordes negros), blobs y marquesina.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        campaign: window.PATA_AMIGA_CONFIG?.campaign || 'regalo'
    };

    const FEATURES = [
        "Disponible en todo México",
        "Mantienes a tu veterinario",
        "Incluye hasta 3 mascotas",
        "Orientación veterinaria 24/7",
        "100% digital"
    ];

    const STYLES = `
        /* Reset y estilos base del widget */
        .pata-gift-container {
            position: relative;
            width: 100%;
            background-color: #1cbcad; /* bg-teal */
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .pata-gift-container * {
            box-sizing: border-box;
        }

        .pata-gift-header {
            display: flex;
            justify-content: center;
            padding: 28px 20px 8px 20px;
            z-index: 10;
        }

        .pata-gift-logo {
            height: 53px;
            width: auto;
        }

        .pata-gift-main {
            position: relative;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 20px 56px 20px;
            z-index: 10;
        }

        /* Blobs orgánicos de fondo */
        .pata-gift-blob {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 47% 53% 61% 39% / 52% 46% 54% 48%;
            pointer-events: none;
            z-index: 1;
        }

        .pata-gift-blob-left {
            left: -110px;
            top: 30%;
            width: 340px;
            height: 340px;
        }

        .pata-gift-blob-right {
            right: -90px;
            top: -70px;
            width: 260px;
            height: 260px;
        }

        .pata-gift-content-inner {
            position: relative;
            width: 100%;
            max-width: 520px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: center;
            z-index: 5;
        }

        .pata-gift-h1 {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-weight: 400;
            font-size: 34px;
            line-height: 1.08;
            margin: 0;
            color: #ffffff;
        }

        @media (min-width: 640px) {
            .pata-gift-h1 {
                font-size: 42px;
            }
        }

        .pata-gift-desc {
            font-size: 15px;
            line-height: 1.55;
            margin: 0 auto;
            max-width: 440px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 400;
        }

        .pata-gift-perks {
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 18px;
            padding: 16px;
            text-align: left;
            width: 100%;
        }

        .pata-gift-perk-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
        }

        .pata-gift-perk-emoji {
            font-size: 18px;
        }

        .pata-gift-card {
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 16px 44px rgba(30, 83, 80, 0.25);
            padding: 20px;
            color: #1e5350; /* ink-title */
            text-align: left;
            width: 100%;
        }

        @media (min-width: 640px) {
            .pata-gift-card {
                padding: 24px;
            }
        }

        .pata-gift-card-title {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-size: 19px;
            color: #1e5350;
            margin-bottom: 12px;
            display: block;
        }

        .pata-gift-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-gift-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
        }

        @media (min-width: 640px) {
            .pata-gift-row {
                grid-template-columns: 1fr 1fr;
            }
        }

        .pata-gift-input {
            width: 100%;
            height: 48px;
            background: #ffffff;
            border: 1.5px solid #e4dfd3; /* border-input */
            border-radius: 12px;
            padding: 0 16px;
            font-size: 15px;
            font-family: 'Outfit', sans-serif;
            color: #1e5350;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s ease;
        }

        .pata-gift-input::placeholder {
            color: #a9a294; /* ink-placeholder */
        }

        .pata-gift-input:focus {
            border-color: #1cbcad; /* focus:border-teal */
        }

        .pata-gift-consent {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 12px;
            line-height: 1.35;
            color: #6b7c79; /* ink-secondary */
            cursor: pointer;
            user-select: none;
            margin-top: 4px;
        }

        .pata-gift-checkbox {
            margin-top: 2px;
            width: 16px;
            height: 16px;
            accent-color: #1cbcad;
            cursor: pointer;
            flex-shrink: 0;
        }

        .pata-gift-consent-link {
            color: #6b7c79;
            text-decoration: underline;
        }

        .pata-gift-btn {
            width: 100%;
            height: 52px;
            background: #f7941d; /* bg-orange */
            color: #ffffff;
            border: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: opacity 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pata-gift-btn:hover {
            opacity: 0.9;
        }

        .pata-gift-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .pata-gift-status {
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 13px;
            font-weight: 600;
            display: none;
        }

        .pata-gift-status.error {
            display: block;
            background: #fdecf1; /* bg-error-bg */
            color: #c22a56; /* text-error-text */
        }

        .pata-gift-success-card {
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 16px 44px rgba(30, 83, 80, 0.25);
            padding: 28px;
            color: #1e5350;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
        }

        .pata-gift-success-icon {
            font-size: 46px;
        }

        .pata-gift-success-title {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-size: 24px;
            color: #1e5350;
            margin: 0;
            line-height: tight;
        }

        .pata-gift-success-text {
            font-size: 14px;
            line-height: 1.6;
            color: #6b7c79;
            margin: 0;
        }

        .pata-gift-footer-info {
            font-size: 11.5px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.6);
            margin: 0 auto;
            max-width: 420px;
        }

        /* Marquesina de Beneficios (Marquee) */
        .pata-gift-marquee {
            width: 100%;
            overflow: hidden;
            background: #1e5350; /* bg-teal-dark */
            padding: 12px 0;
            z-index: 10;
        }

        .pata-gift-marquee-track {
            display: flex;
            width: max-content;
            align-items: center;
            animation: pata-gift-marquee-anim 40s linear infinite;
        }

        .pata-gift-marquee:hover .pata-gift-marquee-track {
            animation-play-state: paused;
        }

        .pata-gift-marquee-item {
            display: flex;
            align-items: center;
            gap: 12px;
            white-space: nowrap;
            padding-right: 24px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.03em;
            color: rgba(255, 255, 255, 0.9);
        }

        .pata-gift-paw {
            width: 15px;
            height: 15px;
            fill: #ffffff;
            flex-shrink: 0;
        }

        @keyframes pata-gift-marquee-anim {
            from {
                transform: translateX(0);
            }
            to {
                transform: translateX(-50%);
            }
        }
    `;

    class CampaignGiftWidget {
        constructor() {
            this.container = document.getElementById('pata-campaign-gift-widget');
            this.isProcessing = false;
            this.init();
        }

        init() {
            if (!this.container) {
                console.error('❌ Pata Campaign Gift Widget: Contenedor #pata-campaign-gift-widget no encontrado.');
                return;
            }

            this.injectStyles();
            this.render();
        }

        injectStyles() {
            if (document.getElementById('pata-campaign-gift-styles')) return;
            const styleEl = document.createElement('style');
            styleEl.id = 'pata-campaign-gift-styles';
            styleEl.textContent = STYLES;
            document.head.appendChild(styleEl);
        }

        getUtmParams() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                source: urlParams.get('utm_source') || '',
                medium: urlParams.get('utm_medium') || '',
                campaign: urlParams.get('utm_campaign') || ''
            };
        }

        render() {
            const utm = this.getUtmParams();
            const logoUrl = `${CONFIG.apiUrl}/widgets/logo-on-dark.svg`;

            // Construir la marquesina con loop duplicado (REPEATS = 3 por mitad)
            let marqueeItemsHtml = '';
            for (let i = 0; i < 6; i++) {
                FEATURES.forEach(feature => {
                    marqueeItemsHtml += `
                        <span class="pata-gift-marquee-item">
                            <svg class="pata-gift-paw" viewBox="0 0 24 24">
                                <ellipse cx="7" cy="7.5" rx="2.3" ry="3" />
                                <ellipse cx="17" cy="7.5" rx="2.3" ry="3" />
                                <ellipse cx="3.4" cy="12.5" rx="2" ry="2.6" />
                                <ellipse cx="20.6" cy="12.5" rx="2" ry="2.6" />
                                <path d="M12 11c3.2 0 6.2 2.6 6.2 5.6 0 2.2-1.5 3.4-3.4 3.4-1 0-1.9-.4-2.8-.4s-1.8.4-2.8.4c-1.9 0-3.4-1.2-3.4-3.4C5.8 13.6 8.8 11 12 11z" />
                            </svg>
                            ${feature}
                        </span>
                    `;
                });
            }

            this.container.innerHTML = `
                <div class="pata-gift-container">
                    <!-- Blobs de fondo -->
                    <div class="pata-gift-blob pata-gift-blob-left"></div>
                    <div class="pata-gift-blob pata-gift-blob-right"></div>

                    <!-- Header -->
                    <header class="pata-gift-header">
                        <img src="${logoUrl}" alt="Club Pata Amiga" class="pata-gift-logo">
                    </header>

                    <!-- Main -->
                    <main class="pata-gift-main">
                        <div class="pata-gift-content-inner">
                            <h1 class="pata-gift-h1">Tu regalo para consentir a tu peludo 🎁</h1>
                            <p class="pata-gift-desc">Regístrate gratis y recibe en tu correo un descuento para la membresía Club Pata Amiga y una guía de cuidado para tu mascota.</p>

                            <!-- Perks List -->
                            <div class="pata-gift-perks">
                                <div class="pata-gift-perk-item">
                                    <span class="pata-gift-perk-emoji">🏷️</span>
                                    <span>Cupón de descuento para tu membresía</span>
                                </div>
                                <div class="pata-gift-perk-item">
                                    <span class="pata-gift-perk-emoji">📘</span>
                                    <span>Guía de cuidado para tu peludo (PDF)</span>
                                </div>
                                <div class="pata-gift-perk-item">
                                    <span class="pata-gift-perk-emoji">💬</span>
                                    <span>Orientación veterinaria 24/7 al unirte a la manada</span>
                                </div>
                            </div>

                            <!-- Lead Form Card -->
                            <div class="pata-gift-card" id="pata-gift-card-content">
                                <span class="pata-gift-card-title">Regístrate y recibe tu regalo</span>
                                <form class="pata-gift-form" id="pata-gift-lead-form">
                                    <div class="pata-gift-row">
                                        <input type="text" name="firstName" placeholder="Nombre" required class="pata-gift-input">
                                        <input type="text" name="lastName" placeholder="Apellidos" required class="pata-gift-input">
                                    </div>
                                    <input type="email" name="email" placeholder="Correo electrónico" required class="pata-gift-input">
                                    <input type="tel" name="phone" placeholder="Teléfono (10 dígitos)" required maxlength="10" class="pata-gift-input">
                                    
                                    <label class="pata-gift-consent">
                                        <input type="checkbox" name="consent" required class="pata-gift-checkbox">
                                        <span>
                                            Acepto recibir mi regalo y comunicaciones de Club Pata Amiga conforme al 
                                            <a href="https://www.pataamiga.mx/legales/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" class="pata-gift-consent-link">Aviso de privacidad</a>.
                                        </span>
                                    </label>

                                    <div class="pata-gift-status error" id="pata-gift-form-error"></div>

                                    <button type="submit" class="pata-gift-btn" id="pata-gift-submit-btn">
                                        <span>🎁 Quiero mi regalo</span>
                                    </button>
                                </form>
                            </div>

                            <p class="pata-gift-footer-info">Membresía de salud para mascotas — no es un seguro. Tus datos solo se usan para enviarte tu regalo y novedades de Club Pata Amiga.</p>
                        </div>
                    </main>

                    <!-- Beneficios Marquee -->
                    <div class="pata-gift-marquee" aria-label="Beneficios: ${FEATURES.join(', ')}">
                        <div class="pata-gift-marquee-track" aria-hidden="true">
                            ${marqueeItemsHtml}
                        </div>
                    </div>
                </div>
            `;

            this.bindEvents(utm);
        }

        bindEvents(utm) {
            const form = this.container.querySelector('#pata-gift-lead-form');
            if (!form) return;

            form.onsubmit = async (e) => {
                e.preventDefault();
                if (this.isProcessing) return;

                this.isProcessing = true;
                const submitBtn = this.container.querySelector('#pata-gift-submit-btn');
                const errorEl = this.container.querySelector('#pata-gift-form-error');
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Enviando...</span>';
                errorEl.style.display = 'none';

                const formData = new FormData(form);
                const payload = {
                    campaign: CONFIG.campaign,
                    firstName: formData.get('firstName')?.trim(),
                    lastName: formData.get('lastName')?.trim(),
                    email: formData.get('email')?.trim().toLowerCase(),
                    phone: formData.get('phone')?.trim(),
                    consent: formData.get('consent') === 'on',
                    utm: utm
                };

                try {
                    const res = await fetch(`${CONFIG.apiUrl}/api/webflow/campaign-lead`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (res.ok && data.success) {
                        this.renderSuccess(payload.firstName, payload.email);
                    } else {
                        errorEl.textContent = `❌ ${data.error || 'Ocurrió un error. Inténtalo de nuevo.'}`;
                        errorEl.style.display = 'block';
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>🎁 Quiero mi regalo</span>';
                        this.isProcessing = false;
                    }
                } catch (error) {
                    console.error('Error submitting campaign lead:', error);
                    errorEl.textContent = '❌ Error de conexión con el servidor. Inténtalo de nuevo.';
                    errorEl.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>🎁 Quiero mi regalo</span>';
                    this.isProcessing = false;
                }
            };

            // Validar que el teléfono sea numérico únicamente
            const telInput = form.querySelector('input[name="phone"]');
            if (telInput) {
                telInput.oninput = () => {
                    telInput.value = telInput.value.replace(/\D/g, '');
                };
            }
        }

        renderSuccess(firstName, email) {
            const cardContainer = this.container.querySelector('#pata-gift-card-content');
            if (!cardContainer) return;

            const shortName = firstName.trim().split(' ')[0];

            cardContainer.innerHTML = `
                <div class="pata-gift-success-card">
                    <span class="pata-gift-success-icon" aria-hidden="true">📬</span>
                    <h2 class="pata-gift-success-title">¡Listo, ${shortName}!</h2>
                    <p class="pata-gift-success-text">
                        Tu regalo va en camino a <strong>${email}</strong>. Si no lo ves en unos minutos, revisa la carpeta de spam o promociones.
                    </p>
                </div>
            `;
        }
    }

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new CampaignGiftWidget());
    } else {
        new CampaignGiftWidget();
    }
})();
