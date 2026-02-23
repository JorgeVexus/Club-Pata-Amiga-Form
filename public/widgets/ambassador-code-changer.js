/**
 * 🔄 Widget Cambio de Código de Embajador - Club Pata Amiga
 * Para embajadores existentes que pueden cambiar su código una sola vez
 * Integración en Webflow via embed
 * 
 * Uso: Colocar un div con id="ambassador-code-changer" en Webflow
 * y cargar este script. El widget detecta automáticamente el token en la URL.
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        API_BASE_URL: 'https://app.pataamiga.mx',
        DEBUG: false
    };

    // ============================================
    // ESTILOS CSS
    // ============================================
    const STYLES = `
        .amb-code-changer-container {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .amb-code-changer-card {
            background: white;
            border-radius: 24px;
            border: 2px solid #000;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .amb-code-changer-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .amb-code-changer-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.75rem;
            color: #2D3748;
            margin: 0;
        }

        .amb-code-changer-badge {
            background: #FE8F15;
            color: white;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .amb-code-current-box {
            background: linear-gradient(135deg, #7DD8D5 0%, #00BBB4 100%);
            padding: 1.5rem;
            border-radius: 16px;
            text-align: center;
            margin-bottom: 1.5rem;
        }

        .amb-code-current-label {
            display: block;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 0.5rem;
        }

        .amb-code-current-value {
            display: block;
            font-family: 'Courier New', monospace;
            font-size: 2rem;
            font-weight: 700;
            color: white;
            letter-spacing: 0.15em;
        }

        .amb-code-changer-desc {
            color: #718096;
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .amb-code-changer-desc strong {
            color: #E53E3E;
        }

        .amb-code-rules {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f7fafc;
            border-radius: 12px;
        }

        .amb-code-rule {
            font-size: 0.8rem;
            color: #2D3748;
            text-align: center;
        }

        .amb-code-input-group {
            position: relative;
            margin-bottom: 1rem;
        }

        .amb-code-input {
            width: 100%;
            padding: 1rem 1.25rem;
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-align: center;
            text-transform: uppercase;
            border: 2px solid #e2e8f0;
            border-radius: 50px;
            background: rgba(125, 216, 213, 0.1);
            transition: all 0.2s ease;
            color: #2D3748;
            box-sizing: border-box;
        }

        .amb-code-input:focus {
            outline: none;
            border-color: #7DD8D5;
            background: white;
            box-shadow: 0 0 0 3px rgba(125, 216, 213, 0.3);
        }

        .amb-code-input.valid {
            border-color: #38A169;
            background: rgba(56, 161, 105, 0.05);
        }

        .amb-code-input.invalid {
            border-color: #E53E3E;
            background: rgba(229, 62, 62, 0.05);
        }

        .amb-code-char-count {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.8rem;
            color: #718096;
        }

        .amb-code-status {
            font-size: 0.9rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .amb-code-status.hint {
            background: #ebf8ff;
            color: #2b6cb0;
        }

        .amb-code-status.validating {
            background: #faf5ff;
            color: #6b46c1;
        }

        .amb-code-status.success {
            background: #f0fff4;
            color: #276749;
            border: 1px solid #9ae6b4;
        }

        .amb-code-status.error {
            background: #fff5f5;
            color: #c53030;
            border: 1px solid #feb2b2;
        }

        .amb-code-preview {
            background: #f0fff4;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            text-align: center;
            border: 2px dashed #68d391;
        }

        .amb-code-preview-label {
            font-size: 0.8rem;
            color: #718096;
            margin-bottom: 0.5rem;
        }

        .amb-code-preview-value {
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            font-weight: 600;
            color: #2D3748;
            word-break: break-all;
        }

        .amb-code-suggestions {
            margin-bottom: 1.5rem;
        }

        .amb-code-suggestions-title {
            font-size: 0.9rem;
            color: #718096;
            margin-bottom: 0.75rem;
        }

        .amb-code-suggestions-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .amb-code-suggestion-chip {
            font-size: 0.85rem;
            font-weight: 600;
            padding: 0.5rem 1rem;
            background: #7DD8D5;
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .amb-code-suggestion-chip:hover {
            background: #68c4c1;
            transform: translateY(-1px);
        }

        .amb-code-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1.5rem;
        }

        .amb-code-btn {
            font-family: 'Fraiche', sans-serif;
            font-weight: 300;
            padding: 0.875rem 2rem;
            border: 2px solid #000;
            border-radius: 50px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .amb-code-btn-secondary {
            background: #00BBB4;
            color: white;
        }

        .amb-code-btn-secondary:hover:not(:disabled) {
            background: #00a8a1;
            transform: translateY(-1px);
        }

        .amb-code-btn-primary {
            background: #FE8F15;
            color: white;
        }

        .amb-code-btn-primary:hover:not(:disabled) {
            background: #e88213;
            transform: translateY(-1px);
        }

        .amb-code-btn:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
            border-color: #a0aec0;
        }

        .amb-code-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            animation: ambSpin 0.75s linear infinite;
            margin-right: 8px;
        }

        @keyframes ambSpin {
            to { transform: rotate(360deg); }
        }

        /* Modal de confirmación */
        .amb-code-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        }

        .amb-code-modal {
            background: white;
            border-radius: 24px;
            border: 2px solid #000;
            max-width: 480px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            animation: ambModalSlide 0.3s ease;
        }

        @keyframes ambModalSlide {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .amb-code-modal-header {
            padding: 1.5rem 2rem 0;
            text-align: center;
        }

        .amb-code-modal-header h3 {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.5rem;
            color: #c53030;
            margin: 0;
        }

        .amb-code-modal-body {
            padding: 1.5rem 2rem;
        }

        .amb-code-modal-text {
            color: #718096;
            text-align: center;
            margin-bottom: 1rem;
        }

        .amb-code-change-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .amb-code-old-small,
        .amb-code-new-small {
            font-family: 'Courier New', monospace;
            font-size: 1.25rem;
            font-weight: 700;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            letter-spacing: 0.1em;
        }

        .amb-code-old-small {
            background: #e2e8f0;
            color: #718096;
        }

        .amb-code-new-small {
            background: linear-gradient(135deg, #7DD8D5 0%, #00BBB4 100%);
            color: white;
        }

        .amb-code-arrow-small {
            font-size: 1.5rem;
            color: #7DD8D5;
        }

        .amb-code-modal-warning {
            background: #fff5f5;
            border: 2px solid #feb2b2;
            border-radius: 12px;
            padding: 1rem;
            font-size: 0.9rem;
            color: #742a2a;
        }

        .amb-code-modal-warning strong {
            color: #c53030;
            display: block;
            margin-bottom: 0.5rem;
            text-align: center;
        }

        .amb-code-modal-warning ul {
            margin: 0;
            padding-left: 1.25rem;
        }

        .amb-code-modal-warning li {
            margin-bottom: 0.25rem;
        }

        .amb-code-modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            padding: 0 2rem 2rem;
        }

        .amb-code-btn-danger {
            background: #E53E3E;
            color: white;
        }

        .amb-code-btn-danger:hover:not(:disabled) {
            background: #c53030;
            transform: translateY(-1px);
        }

        /* Estados */
        .amb-code-loading,
        .amb-code-error,
        .amb-code-success,
        .amb-code-not-allowed {
            text-align: center;
            padding: 3rem 2rem;
        }

        .amb-code-loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e2e8f0;
            border-top-color: #7DD8D5;
            border-radius: 50%;
            animation: ambSpin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        .amb-code-error-icon,
        .amb-code-success-icon,
        .amb-code-not-allowed-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .amb-code-error-title,
        .amb-code-success-title,
        .amb-code-not-allowed-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.75rem;
            color: #2D3748;
            margin-bottom: 1rem;
        }

        .amb-code-error-message,
        .amb-code-not-allowed-message {
            color: #718096;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        .amb-code-success-comparison {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin: 1.5rem 0;
            flex-wrap: wrap;
        }

        .amb-code-success-old,
        .amb-code-success-new {
            background: #f7fafc;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            text-align: center;
        }

        .amb-code-success-new {
            background: linear-gradient(135deg, #7DD8D5 0%, #00BBB4 100%);
        }

        .amb-code-success-new .amb-code-success-value {
            color: white;
        }

        .amb-code-success-label {
            display: block;
            font-size: 0.8rem;
            color: #718096;
            margin-bottom: 0.25rem;
        }

        .amb-code-success-new .amb-code-success-label {
            color: rgba(255, 255, 255, 0.9);
        }

        .amb-code-success-value {
            display: block;
            font-family: 'Courier New', monospace;
            font-size: 1.5rem;
            font-weight: 700;
            color: #2D3748;
            letter-spacing: 0.1em;
        }

        .amb-code-success-arrow {
            font-size: 2rem;
            color: #7DD8D5;
        }

        .amb-code-warning-box {
            background: #fffaf0;
            border: 1px solid #f6ad55;
            border-radius: 12px;
            padding: 1rem;
            margin: 1.5rem 0;
            text-align: center;
        }

        .amb-code-warning-box strong {
            color: #c05621;
        }

        .amb-code-warning-box p {
            color: #744210;
            margin: 0.5rem 0 0;
        }

        /* Responsive */
        @media (max-width: 640px) {
            .amb-code-changer-card {
                padding: 1.5rem;
                border-radius: 24px;
            }

            .amb-code-changer-title {
                font-size: 1.5rem;
            }

            .amb-code-changer-header {
                flex-direction: column;
                gap: 0.5rem;
            }

            .amb-code-current-value {
                font-size: 1.5rem;
            }

            .amb-code-input {
                font-size: 1.25rem;
            }

            .amb-code-actions {
                flex-direction: column;
            }

            .amb-code-btn {
                width: 100%;
            }

            .amb-code-modal {
                border-radius: 24px;
            }

            .amb-code-modal-header,
            .amb-code-modal-body {
                padding-left: 1.5rem;
                padding-right: 1.5rem;
            }

            .amb-code-change-display {
                flex-direction: column;
            }

            .amb-code-arrow-small {
                transform: rotate(90deg);
            }

            .amb-code-success-comparison {
                flex-direction: column;
            }

            .amb-code-success-arrow {
                transform: rotate(90deg);
            }
        }
    `;

    // ============================================
    // UTILIDADES
    // ============================================
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================
    // ESTADO
    // ============================================
    let state = {
        ambassadorId: null,
        token: null,
        currentCode: '',
        canChange: false,
        cannotChangeReason: '',
        newCode: '',
        isValidating: false,
        validationResult: null,
        isSaving: false,
        showConfirmModal: false,
        success: false,
        changedData: null
    };

    // ============================================
    // RENDERIZADO
    // ============================================
    function renderLoading() {
        return `
            <div class="amb-code-loading">
                <div class="amb-code-loading-spinner"></div>
                <p>Cargando...</p>
            </div>
        `;
    }

    function renderNotAllowed(reason) {
        return `
            <div class="amb-code-changer-card">
                <div class="amb-code-not-allowed">
                    <div class="amb-code-not-allowed-icon">⚠️</div>
                    <h2 class="amb-code-not-allowed-title">No puedes cambiar tu código</h2>
                    <p class="amb-code-not-allowed-message">${reason}</p>
                    <button class="amb-code-btn amb-code-btn-primary" onclick="window.goToDashboard()">
                        Volver al dashboard
                    </button>
                </div>
            </div>
        `;
    }

    function renderError(message) {
        return `
            <div class="amb-code-error">
                <div class="amb-code-error-icon">⚠️</div>
                <h2 class="amb-code-error-title">Algo salió mal</h2>
                <p class="amb-code-error-message">${message}</p>
                <button class="amb-code-btn amb-code-btn-primary" onclick="window.initCodeChanger()">
                    Intentar de nuevo
                </button>
            </div>
        `;
    }

    function renderSuccess(oldCode, newCode) {
        return `
            <div class="amb-code-changer-card">
                <div class="amb-code-success">
                    <div class="amb-code-success-icon">🎉</div>
                    <h2 class="amb-code-success-title">¡Código cambiado!</h2>
                    
                    <div class="amb-code-success-comparison">
                        <div class="amb-code-success-old">
                            <span class="amb-code-success-label">Código anterior:</span>
                            <span class="amb-code-success-value">${oldCode}</span>
                        </div>
                        <div class="amb-code-success-arrow">→</div>
                        <div class="amb-code-success-new">
                            <span class="amb-code-success-label">Nuevo código:</span>
                            <span class="amb-code-success-value">${newCode}</span>
                        </div>
                    </div>
                    
                    <div class="amb-code-warning-box">
                        <strong>⚠️ Importante:</strong>
                        <p>Este cambio solo se puede hacer una vez. Tu nuevo código es permanente.</p>
                    </div>

                    <p style="color: #718096; margin-bottom: 1.5rem;">
                        Asegúrate de actualizar cualquier lugar donde hayas compartido tu código anterior.
                    </p>
                    
                    <button class="amb-code-btn amb-code-btn-primary" onclick="window.goToDashboard()">
                        Volver al dashboard
                    </button>
                </div>
            </div>
        `;
    }

    function renderValidationStatus() {
        if (state.newCode.length < 2) {
            return `<div class="amb-code-status hint">💡 Ingresa un código de 2-8 caracteres</div>`;
        }

        if (state.isValidating) {
            return `<div class="amb-code-status validating"><span class="amb-code-spinner"></span>Verificando...</div>`;
        }

        if (!state.validationResult) return '';

        if (state.validationResult.isAvailable) {
            return `<div class="amb-code-status success">✅ ¡Código disponible!</div>`;
        }

        return `<div class="amb-code-status error">❌ ${state.validationResult.error}</div>`;
    }

    function renderPreview() {
        if (!state.validationResult?.isAvailable) return '';

        return `
            <div class="amb-code-preview">
                <div class="amb-code-preview-label">Tu nuevo enlace:</div>
                <div class="amb-code-preview-value">clubpataamiga.com?ref=${state.newCode}</div>
            </div>
        `;
    }

    function renderSuggestions() {
        if (!state.validationResult?.suggestions?.length) return '';

        return `
            <div class="amb-code-suggestions">
                <div class="amb-code-suggestions-title">Sugerencias:</div>
                <div class="amb-code-suggestions-list">
                    ${state.validationResult.suggestions.map(s => `
                        <button type="button" class="amb-code-suggestion-chip" onclick="window.selectNewCodeSuggestion('${s}')">
                            ${s}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderConfirmModal() {
        if (!state.showConfirmModal) return '';

        return `
            <div class="amb-code-modal-overlay" onclick="window.closeChangeConfirmModal()">
                <div class="amb-code-modal" onclick="event.stopPropagation()">
                    <div class="amb-code-modal-header">
                        <h3>⚠️ ¿Estás absolutamente seguro?</h3>
                    </div>
                    
                    <div class="amb-code-modal-body">
                        <p class="amb-code-modal-text">Estás cambiando tu código de:</p>
                        
                        <div class="amb-code-change-display">
                            <div class="amb-code-old-small">${state.currentCode}</div>
                            <div class="amb-code-arrow-small">→</div>
                            <div class="amb-code-new-small">${state.newCode}</div>
                        </div>
                        
                        <div class="amb-code-modal-warning">
                            <strong>⚠️ Esto solo se puede hacer UNA VEZ</strong>
                            <ul>
                                <li>Tu código actual dejará de funcionar inmediatamente</li>
                                <li>Los enlaces antiguos con tu código ya no funcionarán</li>
                                <li>Debes actualizar todos los lugares donde compartiste tu código</li>
                                <li><strong>NO podrás cambiarlo nuevamente</strong></li>
                            </ul>
                        </div>
                    </div>

                    <div class="amb-code-modal-actions">
                        <button class="amb-code-btn amb-code-btn-secondary" onclick="window.closeChangeConfirmModal()" ${state.isSaving ? 'disabled' : ''}>
                            Cancelar
                        </button>
                        <button class="amb-code-btn amb-code-btn-danger" onclick="window.changeCode()" ${state.isSaving ? 'disabled' : ''}>
                            ${state.isSaving ? '<span class="amb-code-spinner"></span>Cambiando...' : 'Sí, cambiar mi código'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderForm() {
        return `
            <div class="amb-code-changer-card">
                <div class="amb-code-changer-header">
                    <h2 class="amb-code-changer-title">🔄 Cambiar tu código</h2>
                    <span class="amb-code-changer-badge">Solo una vez</span>
                </div>
                
                <div class="amb-code-current-box">
                    <span class="amb-code-current-label">Código actual:</span>
                    <span class="amb-code-current-value">${state.currentCode}</span>
                </div>

                <p class="amb-code-changer-desc">
                    Puedes cambiar tu código de embajador <strong>una sola vez</strong>. 
                    Elige cuidadosamente, ya que no podrás modificarlo nuevamente.
                </p>

                <div class="amb-code-rules">
                    <div class="amb-code-rule">✓ 2-8 caracteres</div>
                    <div class="amb-code-rule">✓ Letras A-Z</div>
                    <div class="amb-code-rule">✓ Números 0-9</div>
                    <div class="amb-code-rule">✗ Sin O, I, L</div>
                </div>

                <div class="amb-code-input-group">
                    <input
                        type="text"
                        value="${state.newCode}"
                        oninput="window.handleNewCodeInput(this.value)"
                        placeholder="Ej: NUEVO25"
                        class="amb-code-input ${state.validationResult?.isAvailable ? 'valid' : state.validationResult && !state.validationResult.isAvailable ? 'invalid' : ''}"
                        maxlength="8"
                        ${state.isSaving ? 'disabled' : ''}
                    />
                    <div class="amb-code-char-count">${state.newCode.length}/8</div>
                </div>

                ${renderValidationStatus()}
                ${renderPreview()}
                ${renderSuggestions()}

                <div class="amb-code-actions">
                    <button class="amb-code-btn amb-code-btn-secondary" onclick="window.goToDashboard()">
                        Cancelar
                    </button>
                    <button
                        class="amb-code-btn amb-code-btn-primary"
                        onclick="window.openChangeConfirmModal()"
                        ${!state.validationResult?.isAvailable || state.isSaving ? 'disabled' : ''}
                    >
                        ${state.isSaving ? '<span class="amb-code-spinner"></span>Cambiando...' : 'Cambiar código'}
                    </button>
                </div>
            </div>
            ${renderConfirmModal()}
        `;
    }

    // ============================================
    // FUNCIONES GLOBALES
    // ============================================
    window.handleNewCodeInput = debounce(async (value) => {
        let cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        
        state.newCode = cleanValue;
        state.validationResult = null;
        
        if (cleanValue.length < 2) {
            updateUI();
            return;
        }

        // No permitir el código actual
        if (cleanValue === state.currentCode) {
            state.validationResult = {
                isAvailable: false,
                error: 'El nuevo código debe ser diferente al actual',
                suggestions: []
            };
            updateUI();
            return;
        }

        state.isValidating = true;
        updateUI();

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/referral-code/validate?code=${encodeURIComponent(cleanValue)}`);
            const data = await response.json();

            if (data.success) {
                state.validationResult = data.data;
            }
        } catch (error) {
            console.error('Error validando código:', error);
        } finally {
            state.isValidating = false;
            updateUI();
        }
    }, 500);

    window.selectNewCodeSuggestion = (suggestion) => {
        state.newCode = suggestion;
        state.validationResult = null;
        window.handleNewCodeInput(suggestion);
    };

    window.openChangeConfirmModal = () => {
        if (!state.validationResult?.isAvailable) return;
        state.showConfirmModal = true;
        updateUI();
    };

    window.closeChangeConfirmModal = () => {
        state.showConfirmModal = false;
        updateUI();
    };

    window.changeCode = async () => {
        if (!state.validationResult?.isAvailable) return;

        state.isSaving = true;
        updateUI();

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/referral-code/change`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ambassadorId: state.ambassadorId,
                    newCode: state.newCode,
                    confirmed: true
                })
            });

            const data = await response.json();

            if (data.success) {
                state.success = true;
                state.changedData = data.data;
                state.showConfirmModal = false;
            } else {
                alert(data.error || 'Error al cambiar el código');
            }
        } catch (error) {
            console.error('Error cambiando código:', error);
            alert('Error de conexión. Intenta de nuevo.');
        } finally {
            state.isSaving = false;
            updateUI();
        }
    };

    window.goToDashboard = () => {
        window.location.href = '/dashboard-embajadores';
    };

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    function updateUI() {
        const container = document.getElementById('ambassador-code-changer');
        if (!container) return;

        if (state.success && state.changedData) {
            container.innerHTML = renderSuccess(state.changedData.old_code, state.changedData.new_code);
        } else if (!state.canChange && state.cannotChangeReason) {
            container.innerHTML = renderNotAllowed(state.cannotChangeReason);
        } else {
            container.innerHTML = renderForm();
        }
    }

    async function init() {
        const container = document.getElementById('ambassador-code-changer');
        if (!container) {
            console.error('Ambassador code changer container not found');
            return;
        }

        // Inject styles
        if (!document.getElementById('amb-code-changer-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'amb-code-changer-styles';
            styleTag.textContent = STYLES;
            document.head.appendChild(styleTag);
        }

        // Get token from URL
        const token = getUrlParam('token');
        if (!token) {
            container.innerHTML = renderError('Token de acceso no proporcionado. Por favor usa el link que te enviamos por email.');
            return;
        }

        state.token = token;
        container.innerHTML = renderLoading();

        try {
            // Verify token and get ambassador data
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/me?token=${token}`);
            const data = await response.json();

            if (!data.success || !data.authenticated) {
                container.innerHTML = renderError(data.error || 'Token inválido o sesión expirada');
                return;
            }

            state.ambassadorId = data.ambassador.id;
            state.currentCode = data.ambassador.referral_code || 'N/A';

            // Check if can change
            const changeCheckResponse = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/referral-code/change?ambassadorId=${state.ambassadorId}`);
            const changeCheckData = await changeCheckResponse.json();

            if (changeCheckData.success) {
                state.canChange = changeCheckData.data.canChange;
                state.cannotChangeReason = changeCheckData.data.reason;
            }

            updateUI();

        } catch (error) {
            console.error('Error initializing:', error);
            container.innerHTML = renderError('Error de conexión. Por favor intenta de nuevo.');
        }
    }

    window.initCodeChanger = init;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
})();
