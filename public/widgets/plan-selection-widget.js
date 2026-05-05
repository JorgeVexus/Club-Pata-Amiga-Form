/**
 * 🐾 Club Pata Amiga - Plan Selection Widget (Neo-Brutalist)
 * 
 * Widget incrustable para Webflow que permite la selección de planes y checkout
 * manteniendo la sesión del usuario y la estética de la marca.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        plans: [
            {
                id: 'prc_mensual-452k30jah',
                name: 'Mensual',
                price: 159,
                priceDisplay: '$159',
                description: 'Toda la protección mes a mes',
                features: [
                    'Vacunación anual (Hasta $300)',
                    'Apoyo por fallecimiento (Hasta $2,000)',
                    'Chat veterinario 24/7',
                    'Emergencias médicas (Hasta $3,000)',
                    'Comunidad Pata Amiga'
                ]
            },
            {
                id: 'prc_anual-o9d101ta',
                name: 'Anual',
                price: 1699,
                priceDisplay: '$1,699',
                description: 'Ahorra 209 pesos',
                popular: true,
                features: [
                    'Vacunación anual (Hasta $300)',
                    'Apoyo por fallecimiento (Hasta $2,000)',
                    'Chat veterinario 24/7',
                    'Emergencias médicas (Hasta $3,000)',
                    'Comunidad Pata Amiga'
                ]
            }
        ]
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Fraiche:wght@400;700&display=swap');

        .pata-plan-widget {
            font-family: 'Outfit', sans-serif;
            color: #000;
            width: 100%;
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 30px;
            padding: 20px;
            box-sizing: border-box;
        }

        .pata-plan-header {
            text-align: center;
            margin-bottom: 10px;
        }

        .pata-plan-title {
            font-family: 'Fraiche', sans-serif;
            font-size: clamp(32px, 6vw, 50px);
            text-transform: uppercase;
            margin: 0;
            line-height: 1.1;
        }

        .pata-plan-subtitle {
            font-size: 18px;
            color: #666;
            margin-top: 10px;
        }

        /* Cards Grid */
        .pata-plan-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            width: 100%;
        }

        .pata-plan-card {
            background: #fff;
            border: 3px solid #000;
            border-radius: 35px;
            padding: 35px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            flex-direction: column;
            gap: 15px;
            box-sizing: border-box;
        }

        .pata-plan-card:hover {
            transform: translateY(-8px);
            box-shadow: 10px 10px 0 #000;
        }

        .pata-plan-card.selected {
            border-color: #00BBB4;
            background: #F0FDFA;
            box-shadow: 10px 10px 0 #00BBB4;
        }

        .pata-popular-badge {
            position: absolute;
            top: -15px;
            right: 30px;
            background: #FE8F15;
            color: #fff;
            font-weight: 900;
            font-size: 14px;
            padding: 6px 18px;
            border-radius: 50px;
            border: 3px solid #000;
            text-transform: uppercase;
        }

        .pata-plan-name {
            font-family: 'Fraiche', sans-serif;
            font-size: 32px;
            margin: 0;
        }

        .pata-plan-price-row {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .pata-plan-price {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: -0.02em;
        }

        .pata-plan-period {
            font-size: 18px;
            color: #666;
            font-weight: 600;
        }

        .pata-features-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            font-size: 15px;
        }

        .pata-feature-check {
            color: #00BBB4;
            font-weight: 900;
            font-size: 20px;
        }

        .pata-select-btn {
            margin-top: auto;
            width: 100%;
            padding: 18px;
            border: 3px solid #000;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 16px;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s;
            background: #fff;
        }

        .pata-select-btn.selected {
            background: #00BBB4;
            color: #fff;
        }

        /* Referral Section */
        .pata-referral-box {
            background: #F8FAFC;
            border: 3px solid #000;
            border-radius: 35px;
            padding: 30px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .pata-referral-label {
            font-weight: 900;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .pata-referral-input-wrapper {
            position: relative;
            width: 100%;
        }

        .pata-referral-input {
            width: 100%;
            padding: 18px 25px;
            border: 3px solid #000;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 16px;
            box-sizing: border-box;
            text-transform: uppercase;
        }

        .pata-referral-input:focus {
            outline: none;
            border-color: #00BBB4;
        }

        .pata-referral-status {
            font-size: 14px;
            font-weight: 700;
            padding-left: 20px;
            display: none;
        }

        .pata-referral-status.success { color: #2E7D32; display: block; }
        .pata-referral-status.error { color: #C62828; display: block; }

        /* Terms & Action */
        .pata-terms-box {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            cursor: pointer;
            padding: 10px;
        }

        .pata-checkbox-custom {
            width: 24px;
            height: 24px;
            border: 3px solid #000;
            border-radius: 6px;
            flex-shrink: 0;
            position: relative;
            background: #fff;
        }

        .pata-checkbox-custom.checked::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: 900;
            color: #00BBB4;
        }

        .pata-terms-text {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.4;
        }

        .pata-terms-link {
            color: #00BBB4;
            text-decoration: underline;
        }

        .pata-pay-btn {
            width: 100%;
            padding: 24px;
            background: #FE8F15;
            color: #fff;
            border: 3px solid #000;
            border-radius: 50px;
            font-family: 'Fraiche', sans-serif;
            font-size: 24px;
            text-transform: uppercase;
            cursor: pointer;
            box-shadow: 8px 8px 0 #000;
            transition: all 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
        }

        .pata-pay-btn:hover {
            transform: translate(-2px, -2px);
            box-shadow: 10px 10px 0 #000;
        }

        .pata-pay-btn:active {
            transform: translate(4px, 4px);
            box-shadow: 0 0 0 #000;
        }

        .pata-pay-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .pata-security-note {
            text-align: center;
            font-size: 14px;
            color: #666;
            font-weight: 600;
        }

        .pata-loading-spinner {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: pataSpin 0.8s linear infinite;
        }

        @keyframes pataSpin {
            to { transform: rotate(360deg); }
        }

        /* Modal Styles */
        .pata-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
            backdrop-filter: blur(5px);
        }

        .pata-modal-content {
            background: #fff;
            border: 4px solid #000;
            border-radius: 35px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 20px 20px 0 rgba(0, 0, 0, 0.3);
            animation: pataModalFade 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes pataModalFade {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .pata-modal-header {
            padding: 30px;
            border-bottom: 3px solid #000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .pata-modal-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 28px;
            margin: 0;
            text-transform: uppercase;
        }

        .pata-modal-close {
            background: #000;
            color: #fff;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: transform 0.2s;
        }

        .pata-modal-close:hover {
            transform: scale(1.1) rotate(90deg);
            background: #FE8F15;
        }

        .pata-modal-body {
            padding: 30px;
            overflow-y: auto;
            font-size: 16px;
            line-height: 1.6;
        }

        .pata-modal-footer {
            padding: 25px;
            border-top: 3px solid #000;
            display: flex;
            justify-content: center;
        }

        .pata-modal-legal-text h4 {
            font-family: 'Fraiche', sans-serif;
            font-size: 20px;
            margin: 30px 0 15px 0;
            text-transform: uppercase;
            color: #00BBB4;
        }

        .pata-modal-legal-text p {
            margin: 0 0 15px 0;
        }

        /* Mobile */
        @media (max-width: 600px) {
            .pata-plan-grid { grid-template-columns: 1fr; }
            .pata-plan-title { font-size: 32px; }
            .pata-pay-btn { font-size: 20px; padding: 18px; }
            .pata-modal-content { max-height: 95vh; }
            .pata-modal-header { padding: 20px; }
            .pata-modal-body { padding: 20px; }
        }
    `;

    class PataPlanSelectionWidget {
        constructor() {
            this.selectedPlan = null;
            this.termsAccepted = false;
            this.referralCode = '';
            this.isCodeValidated = false;
            this.ambassadorName = '';
            this.isProcessing = false;
            this.member = null;
            
            // Terms Modal state
            this.showTermsModal = false;
            this.termsContent = null;
            this.isLoadingTerms = false;

            this.init();
        }

        async init() {
            this.injectStyles();
            this.container = document.getElementById('pata-plan-selection-widget');
            if (!this.container) return;

            // Esperar a Memberstack
            if (window.$memberstackDom) {
                const member = await window.$memberstackDom.getCurrentMember();
                this.member = member?.data;
                if (this.member?.customFields?.['ambassador-code']) {
                    this.referralCode = this.member.customFields['ambassador-code'];
                    // Validar automáticamente si ya tiene uno
                    this.validateReferral(this.referralCode);
                }
            }

            this.render();
        }

        injectStyles() {
            if (document.getElementById('pata-plan-widget-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-plan-widget-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        render() {
            if (!this.container) return;

            this.container.innerHTML = `
                <div class="pata-plan-widget">
                    <div class="pata-plan-header">
                        <h2 class="pata-plan-title">Elige tu plan</h2>
                        <p class="pata-plan-subtitle">Protección completa para tu mejor amigo 🐾</p>
                    </div>

                    <div class="pata-plan-grid">
                        ${CONFIG.plans.map(plan => `
                            <div class="pata-plan-card ${this.selectedPlan === plan.id ? 'selected' : ''}" data-id="${plan.id}">
                                ${plan.popular ? '<span class="pata-popular-badge">Más popular</span>' : ''}
                                <h3 class="pata-plan-name">${plan.name}</h3>
                                <p class="pata-plan-subtitle" style="margin:0">${plan.description}</p>
                                <div class="pata-plan-price-row">
                                    <span class="pata-plan-price">${plan.priceDisplay}</span>
                                    <span class="pata-plan-period">${plan.name === 'Mensual' ? '/mes' : '/año'}</span>
                                </div>
                                <ul class="pata-features-list">
                                    ${plan.features.map(f => `
                                        <li class="pata-feature-item">
                                            <span class="pata-feature-check">✓</span>
                                            ${f}
                                        </li>
                                    `).join('')}
                                </ul>
                                <button class="pata-select-btn ${this.selectedPlan === plan.id ? 'selected' : ''}">
                                    ${this.selectedPlan === plan.id ? 'Seleccionado ✓' : 'Seleccionar'}
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <div class="pata-referral-box">
                        <label class="pata-referral-label">🎟️ ¿Tienes un código de Embajador?</label>
                        <div class="pata-referral-input-wrapper">
                            <input type="text" class="pata-referral-input" placeholder="INGRESA TU CÓDIGO" value="${this.referralCode}">
                        </div>
                        <div id="pata-referral-status" class="pata-referral-status"></div>
                    </div>

                    <div class="pata-terms-box" id="pata-terms-toggle">
                        <div class="pata-checkbox-custom ${this.termsAccepted ? 'checked' : ''}"></div>
                        <span class="pata-terms-text">
                            He leído y acepto los <a href="#" class="pata-terms-link" id="pata-view-terms">términos y condiciones</a> y el aviso de privacidad.
                        </span>
                    </div>

                    <button class="pata-pay-btn" id="pata-pay-btn" ${!this.selectedPlan || !this.termsAccepted || this.isProcessing ? 'disabled' : ''}>
                        ${this.isProcessing ? '<div class="pata-loading-spinner"></div> Procesando...' : 'Continuar al pago →'}
                    </button>

                    <p class="pata-security-note">🔒 Pago seguro procesado por Stripe. Cancela cuando quieras.</p>

                    <!-- Terms Modal -->
                    ${this.showTermsModal ? this.renderTermsModal() : ''}
                </div>
            `;

            this.attachEvents();
        }

        attachEvents() {
            // Plan selection
            this.container.querySelectorAll('.pata-plan-card').forEach(card => {
                card.onclick = () => {
                    this.selectedPlan = card.dataset.id;
                    this.render();
                };
            });

            // Referral Input
            const refInput = this.container.querySelector('.pata-referral-input');
            let debounceTimer;
            refInput.oninput = (e) => {
                const val = e.target.value.toUpperCase();
                this.referralCode = val;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.validateReferral(val), 600);
            };

            // Terms Toggle
            this.container.querySelector('#pata-terms-toggle').onclick = (e) => {
                if (e.target.closest('#pata-view-terms')) return;
                this.termsAccepted = !this.termsAccepted;
                this.render();
            };

            // View Terms Link
            const viewTermsLink = this.container.querySelector('#pata-view-terms');
            if (viewTermsLink) {
                viewTermsLink.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openTermsModal();
                };
            }

            // Pay Button
            const payBtn = this.container.querySelector('#pata-pay-btn');
            payBtn.onclick = () => this.handleCheckout();

            // Modal Events
            if (this.showTermsModal) {
                const closeBtn = this.container.querySelector('#pata-modal-close');
                const understoodBtn = this.container.querySelector('#pata-modal-understood');
                const overlay = this.container.querySelector('#pata-modal-overlay');

                if (closeBtn) closeBtn.onclick = () => this.closeTermsModal();
                if (understoodBtn) understoodBtn.onclick = () => this.closeTermsModal();
                if (overlay) overlay.onclick = (e) => {
                    if (e.target === overlay) this.closeTermsModal();
                };
            }
        }

        async openTermsModal() {
            this.showTermsModal = true;
            this.render();
            
            if (!this.termsContent) {
                await this.fetchTerms();
            }
        }

        closeTermsModal() {
            this.showTermsModal = false;
            document.body.style.overflow = 'unset';
            this.render();
        }

        async fetchTerms() {
            if (this.isLoadingTerms) return;
            this.isLoadingTerms = true;
            
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/legal/terms`);
                const data = await res.json();
                if (data.success) {
                    this.termsContent = data.fullDocument;
                }
            } catch (error) {
                console.error('Error fetching terms:', error);
                this.termsContent = 'Error al cargar los términos y condiciones. Por favor, intenta de nuevo más tarde.';
            } finally {
                this.isLoadingTerms = false;
                this.render();
            }
        }

        renderTermsModal() {
            document.body.style.overflow = 'hidden';
            
            let contentHtml = '';
            if (this.isLoadingTerms) {
                contentHtml = '<div style="text-align:center; padding: 50px;"><div class="pata-loading-spinner" style="border-top-color:#00BBB4; margin: 0 auto;"></div><p style="margin-top:20px; font-weight:700;">Cargando términos...</p></div>';
            } else if (this.termsContent) {
                contentHtml = `<div class="pata-modal-legal-text">${this.formatLegalText(this.termsContent)}</div>`;
            }

            return `
                <div class="pata-modal-overlay" id="pata-modal-overlay">
                    <div class="pata-modal-content">
                        <div class="pata-modal-header">
                            <h2 class="pata-modal-title">📋 Términos y Condiciones</h2>
                            <button class="pata-modal-close" id="pata-modal-close">✕</button>
                        </div>
                        <div class="pata-modal-body">
                            ${contentHtml}
                        </div>
                        <div class="pata-modal-footer">
                            <button class="pata-select-btn selected" style="max-width: 200px;" id="pata-modal-understood">Entendido ✓</button>
                        </div>
                    </div>
                </div>
            `;
        }

        formatLegalText(text) {
            if (!text) return '';
            return text.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                    return `<h4>${trimmed.replace(/^###?\s/, '')}</h4>`;
                }
                if (trimmed === '') return '<br/>';
                return `<p>${line}</p>`;
            }).join('');
        }

        async validateReferral(code) {
            const statusEl = document.getElementById('pata-referral-status');
            if (!code || code.length < 3) {
                this.isCodeValidated = false;
                if (statusEl) statusEl.style.display = 'none';
                return;
            }

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/referrals/validate-code?code=${code}`);
                const data = await res.json();

                if (data.success && data.valid) {
                    this.isCodeValidated = true;
                    this.ambassadorName = data.ambassador_name;
                    if (statusEl) {
                        statusEl.className = 'pata-referral-status success';
                        statusEl.innerHTML = `✨ ¡Bienvenido a la manada de <strong>${data.ambassador_name}</strong>! Tu beneficio de carencia ha sido aplicado.`;
                    }
                    // Actualizar Memberstack silenciosamente si existe
                    if (window.$memberstackDom && this.member) {
                        window.$memberstackDom.updateMember({
                            customFields: { 'ambassador-code': code }
                        });
                    }
                } else {
                    this.isCodeValidated = false;
                    if (statusEl) {
                        statusEl.className = 'pata-referral-status error';
                        statusEl.textContent = `❌ ${data.message || 'Código no válido'}`;
                    }
                }
            } catch (e) {
                console.error('Error validando código:', e);
            }
        }

        async handleCheckout() {
            if (!this.selectedPlan || !this.termsAccepted || this.isProcessing) return;

            this.isProcessing = true;
            this.render();

            try {
                if (!window.$memberstackDom) {
                    alert('Error: Memberstack no detectado. Por favor recarga la página.');
                    this.isProcessing = false;
                    this.render();
                    return;
                }

                const member = await window.$memberstackDom.getCurrentMember();
                if (!member.data) {
                    // No hay sesión, redirigir a registro
                    window.location.href = '/usuarios/registro';
                    return;
                }

                // Ejecutar compra/update vía Memberstack
                // Esto abrirá el modal de Stripe de Memberstack automáticamente
                const result = await window.$memberstackDom.purchasePlansWithCheckout({
                    priceId: this.selectedPlan,
                    successUrl: window.location.origin + '/payment-success',
                    cancelUrl: window.location.href
                });

                // Si Memberstack no redirige automáticamente (depende de config),
                // podemos manejar el éxito aquí.
                console.log('Purchase initiated:', result);

            } catch (error) {
                console.error('Error en checkout:', error);
                alert('Hubo un error al iniciar el pago. Por favor intenta de nuevo.');
                this.isProcessing = false;
                this.render();
            }
        }
    }

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new PataPlanSelectionWidget());
    } else {
        new PataPlanSelectionWidget();
    }

})();
