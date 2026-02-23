/**
 * 🎯 Widget Selección de Código de Embajador - Club Pata Amiga
 * Para embajadores recién aprobados que necesitan elegir su código
 * Integración en Webflow via embed
 * 
 * Uso: Colocar un div con id="ambassador-code-selector" en Webflow
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
        .amb-code-selector-container {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .amb-code-selector-card {
            background: white;
            border-radius: 24px;
            border: 2px solid #000;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .amb-code-selector-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.75rem;
            color: #2D3748;
            text-align: center;
            margin: 0 0 1rem 0;
        }

        .amb-code-selector-desc {
            color: #718096;
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .amb-code-rules {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f7fafc;
            border-radius: 12px;
        }

        .amb-code-rule {
            font-size: 0.85rem;
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
            color: #2D3748;
            margin: 0;
        }

        .amb-code-modal-body {
            padding: 1.5rem 2rem;
        }

        .amb-code-modal-code {
            font-family: 'Courier New', monospace;
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            color: #2D3748;
            background: #f7fafc;
            padding: 1rem;
            border-radius: 12px;
            margin: 1rem 0;
            letter-spacing: 0.15em;
        }

        .amb-code-modal-warning {
            background: #fffaf0;
            border: 1px solid #f6ad55;
            border-radius: 12px;
            padding: 1rem;
            font-size: 0.9rem;
            color: #744210;
        }

        .amb-code-modal-warning strong {
            color: #c53030;
            display: block;
            margin-bottom: 0.5rem;
            text-align: center;
        }

        .amb-code-modal-warning ul {
            margin: 0.5rem 0 0;
            padding-left: 1.25rem;
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

        /* Estados de carga y error */
        .amb-code-loading,
        .amb-code-error,
        .amb-code-success {
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
        .amb-code-success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .amb-code-error-title,
        .amb-code-success-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.75rem;
            color: #2D3748;
            margin-bottom: 1rem;
        }

        .amb-code-error-message {
            color: #718096;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        .amb-code-success-code {
            background: linear-gradient(135deg, #7DD8D5 0%, #00BBB4 100%);
            padding: 1.5rem 3rem;
            border-radius: 16px;
            margin: 1.5rem 0;
            text-align: center;
        }

        .amb-code-success-code-label {
            display: block;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 0.5rem;
        }

        .amb-code-success-code-value {
            display: block;
            font-family: 'Courier New', monospace;
            font-size: 2rem;
            font-weight: 700;
            color: white;
            letter-spacing: 0.15em;
        }

        /* Responsive */
        @media (max-width: 640px) {
            .amb-code-selector-card {
                padding: 1.5rem;
                border-radius: 24px;
            }

            .amb-code-selector-title {
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

            .amb-code-modal-code {
                font-size: 1.5rem;
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
    // COMPONENTES
    // ============================================
    let state = {
        ambassadorId: null,
        token: null,
        code: '',
        isValidating: false,
        validationResult: null,
        isSaving: false,
        showConfirmModal: false,
        success: false
    };

    function renderLoading() {
        return `
            <div class="amb-code-loading">
                <div class="amb-code-loading-spinner"></div>
                <p>Cargando...</p>
            </div>
        `;
    }

    function renderError(message, onRetry) {
        return `
            <div class="amb-code-error">
                <div class="amb-code-error-icon">⚠️</div>
                <h2 class="amb-code-error-title">Algo salió mal</h2>
                <p class="amb-code-error-message">${message}</p>
                ${onRetry ? `<button class="amb-code-btn amb-code-btn-primary" onclick="${onRetry}()">Intentar de nuevo</button>` : ''}
            </div>
        `;
    }

    function renderSuccess(code) {
        return `
            <div class="amb-code-success">
                <div class="amb-code-success-icon">🎉</div>
                <h2 class="amb-code-success-title">¡Código establecido!</h2>
                
                <div class="amb-code-success-code">
                    <span class="amb-code-success-code-label">Tu código:</span>
                    <span class="amb-code-success-code-value">${code}</span>
                </div>
                
                <p>Tu código de embajador ha sido guardado exitosamente.</p>
                
                <div style="background: #f7fafc; padding: 1rem; border-radius: 12px; margin: 1.5rem 0;">
                    <p style="font-size: 0.85rem; color: #718096; margin: 0 0 0.5rem 0;">Tu enlace de referido:</p>
                    <p style="font-family: monospace; font-size: 0.95rem; color: #2D3748; margin: 0; word-break: break-all;">
                        clubpataamiga.com?ref=${code}
                    </p>
                </div>
                
                <button class="amb-code-btn amb-code-btn-primary" onclick="window.location.href='/dashboard-embajadores'">
                    Ir a mi dashboard
                </button>
            </div>
        `;
    }

    function renderValidationStatus() {
        if (state.code.length < 2) {
            return `<div class="amb-code-status hint">💡 Mínimo 2 caracteres, máximo 8. Solo letras (A-Z) y números (0-9).</div>`;
        }

        if (state.isValidating) {
            return `<div class="amb-code-status validating"><span class="amb-code-spinner"></span>Verificando disponibilidad...</div>`;
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
                <div class="amb-code-preview-label">Así se verá tu código:</div>
                <div class="amb-code-preview-value">clubpataamiga.com?ref=${state.code}</div>
            </div>
        `;
    }

    function renderSuggestions() {
        if (!state.validationResult?.suggestions?.length) return '';

        return `
            <div class="amb-code-suggestions">
                <div class="amb-code-suggestions-title">Sugerencias disponibles:</div>
                <div class="amb-code-suggestions-list">
                    ${state.validationResult.suggestions.map(s => `
                        <button type="button" class="amb-code-suggestion-chip" onclick="window.selectCodeSuggestion('${s}')">
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
            <div class="amb-code-modal-overlay" onclick="window.closeConfirmModal()">
                <div class="amb-code-modal" onclick="event.stopPropagation()">
                    <div class="amb-code-modal-header">
                        <h3>⚠️ ¿Estás seguro?</h3>
                    </div>
                    
                    <div class="amb-code-modal-body">
                        <p style="color: #718096; text-align: center; margin-bottom: 1rem;">Estás a punto de elegir el código:</p>
                        
                        <div class="amb-code-modal-code">${state.code}</div>
                        
                        <div class="amb-code-modal-warning">
                            <strong>Importante:</strong>
                            <ul>
                                <li>Una vez guardado, el código <strong>NO puede cambiarse</strong></li>
                                <li>Este código te identificará permanentemente como embajador</li>
                                <li>Tus referidos lo usarán para registrarse</li>
                            </ul>
                        </div>
                    </div>

                    <div class="amb-code-modal-actions">
                        <button class="amb-code-btn amb-code-btn-secondary" onclick="window.closeConfirmModal()" ${state.isSaving ? 'disabled' : ''}>
                            Volver a editar
                        </button>
                        <button class="amb-code-btn amb-code-btn-danger" onclick="window.saveCode()" ${state.isSaving ? 'disabled' : ''}>
                            ${state.isSaving ? '<span class="amb-code-spinner"></span>Guardando...' : 'Sí, estoy seguro'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderForm() {
        return `
            <div class="amb-code-selector-card">
                <h2 class="amb-code-selector-title">🎯 Elige tu código de embajador</h2>
                
                <p class="amb-code-selector-desc">
                    Este código te identificará como embajador de Club Pata Amiga. 
                    Tus referidos lo usarán para obtener beneficios especiales.
                </p>

                <div class="amb-code-rules">
                    <div class="amb-code-rule">✓ 2-8 caracteres</div>
                    <div class="amb-code-rule">✓ Letras A-Z</div>
                    <div class="amb-code-rule">✓ Números 0-9</div>
                    <div class="amb-code-rule">✗ Sin O, I, L</div>
                    <div class="amb-code-rule">✗ Sin espacios</div>
                </div>

                <div class="amb-code-input-group">
                    <input
                        type="text"
                        value="${state.code}"
                        oninput="window.handleCodeInput(this.value)"
                        placeholder="Ej: MARIA25"
                        class="amb-code-input ${state.validationResult?.isAvailable ? 'valid' : state.validationResult && !state.validationResult.isAvailable ? 'invalid' : ''}"
                        maxlength="8"
                        ${state.isSaving ? 'disabled' : ''}
                    />
                    <div class="amb-code-char-count">${state.code.length}/8</div>
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
                        onclick="window.openConfirmModal()"
                        ${!state.validationResult?.isAvailable || state.isSaving ? 'disabled' : ''}
                    >
                        ${state.isSaving ? '<span class="amb-code-spinner"></span>Guardando...' : 'Continuar'}
                    </button>
                </div>
            </div>
            ${renderConfirmModal()}
        `;
    }

    // ============================================
    // FUNCIONES GLOBALES
    // ============================================
    window.handleCodeInput = debounce(async (value) => {
        // Limpiar input
        let cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        
        state.code = cleanValue;
        state.validationResult = null;
        
        if (cleanValue.length < 2) {
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

    window.selectCodeSuggestion = (suggestion) => {
        state.code = suggestion;
        state.validationResult = null;
        window.handleCodeInput(suggestion);
    };

    window.openConfirmModal = () => {
        if (!state.validationResult?.isAvailable) return;
        state.showConfirmModal = true;
        updateUI();
    };

    window.closeConfirmModal = () => {
        state.showConfirmModal = false;
        updateUI();
    };

    window.saveCode = async () => {
        if (!state.validationResult?.isAvailable) return;

        state.isSaving = true;
        updateUI();

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/referral-code/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ambassadorId: state.ambassadorId,
                    code: state.code,
                    confirmed: true
                })
            });

            const data = await response.json();

            if (data.success) {
                state.success = true;
                state.showConfirmModal = false;
            } else {
                alert(data.error || 'Error al guardar el código');
            }
        } catch (error) {
            console.error('Error guardando código:', error);
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
        const container = document.getElementById('ambassador-code-selector');
        if (!container) return;

        if (state.success) {
            container.innerHTML = renderSuccess(state.code);
        } else {
            container.innerHTML = renderForm();
        }
    }

    async function init() {
        const container = document.getElementById('ambassador-code-selector');
        if (!container) {
            console.error('Ambassador code selector container not found');
            return;
        }

        // Inject styles
        if (!document.getElementById('amb-code-selector-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'amb-code-selector-styles';
            styleTag.textContent = STYLES;
            document.head.appendChild(styleTag);
        }

        // Get token from URL
        const token = getUrlParam('token');
        if (!token) {
            container.innerHTML = renderError('Token de acceso no proporcionado. Por favor usa el link que te enviamos por email.', null);
            return;
        }

        state.token = token;
        container.innerHTML = renderLoading();

        try {
            // Verify token and get ambassador data
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/me?token=${token}`);
            const data = await response.json();

            if (!data.success || !data.authenticated) {
                container.innerHTML = renderError(data.error || 'Token inválido o sesión expirada', null);
                return;
            }

            // Check if already has active code
            if (data.ambassador.referral_code && data.ambassador.referral_code_status === 'active') {
                container.innerHTML = renderSuccess(data.ambassador.referral_code);
                return;
            }

            state.ambassadorId = data.ambassador.id;
            updateUI();

        } catch (error) {
            console.error('Error initializing:', error);
            container.innerHTML = renderError('Error de conexión. Por favor intenta de nuevo.', 'initCodeSelector');
        }
    }

    window.initCodeSelector = init;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
})();
