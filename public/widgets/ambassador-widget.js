/**
 * 🎯 Widget Dashboard Embajador - Club Pata Amiga
 * Widget para embajadores con estados: pendiente, aprobado, rechazado
 * Para integrar en Webflow
 * 
 * DISEÑO ACTUALIZADO - Basado en imagen de referencia
 */

(function () {
    'use strict';

    let currentAmbassador = null;
    let chatRealtimeInitialized = false;
    let chatModalOpen = false;
    let chatMessagesCache = [];
    const DEFAULT_AVATAR_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
            <rect width="80" height="80" rx="40" fill="#E8F8F7"/>
            <circle cx="40" cy="31" r="13" fill="#00BBB4"/>
            <path d="M18 66c4-16 13-24 22-24s18 8 22 24" fill="#00BBB4"/>
        </svg>
    `)}`;
    const COMMON_BANK_OPTIONS = [
        'BBVA',
        'Santander',
        'Banorte',
        'HSBC',
        'Citibanamex',
        'Scotiabank',
        'Inbursa',
        'Banco Azteca',
        'BanBajio',
        'Banregio',
        'Nu Mexico',
        'Hey Banco'
    ];
    const CLABE_BANK_CODES = {
        '002': 'Citibanamex',
        '012': 'BBVA',
        '014': 'Santander',
        '021': 'HSBC',
        '030': 'BanBajio',
        '036': 'Inbursa',
        '044': 'Scotiabank',
        '058': 'Banregio',
        '072': 'Banorte',
        '127': 'Banco Azteca',
        '168': 'Hey Banco',
        '638': 'Nu Mexico'
    };

    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        API_BASE_URL: 'https://app.pataamiga.mx',
        IMAGES_BASE_URL: 'https://app.pataamiga.mx/embajadores-images',
        CLOUDINARY_URL: 'https://res.cloudinary.com/dqy07kgu6/image/upload',
        DEBUG: false,
        supabaseUrl: 'https://hjvhntxjkuuobgfslzlf.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTg5NTcsImV4cCI6MjA4MDQzNDk1N30.YnrJ_ECWnqcO_iDP5V-tBkgwd4LdBhJnJ5jdLsowjnA'
    };

    function sanitizeClabeInput(value) {
        return String(value || '').replace(/\D/g, '').slice(0, 18);
    }

    function getBankNameFromClabe(clabe) {
        return CLABE_BANK_CODES[sanitizeClabeInput(clabe).slice(0, 3)] || '';
    }

    function isValidClabe(clabe) {
        const normalizedClabe = sanitizeClabeInput(clabe);
        if (!/^\d{18}$/.test(normalizedClabe)) {
            return false;
        }

        const weights = [3, 7, 1];
        const partialSum = normalizedClabe
            .slice(0, 17)
            .split('')
            .reduce((sum, digit, index) => {
                const product = Number(digit) * weights[index % weights.length];
                return sum + (product % 10);
            }, 0);

        const checkDigit = (10 - (partialSum % 10)) % 10;
        return checkDigit === Number(normalizedClabe[17]);
    }

    function getClabeValidationMessage(clabe) {
        const normalizedClabe = sanitizeClabeInput(clabe);
        if (!normalizedClabe) return 'Ingresa tu CLABE.';
        if (normalizedClabe.length !== 18) return 'La CLABE debe tener exactamente 18 digitos.';
        if (!isValidClabe(normalizedClabe)) return 'La CLABE no es valida. Revisa los 18 digitos e intentalo de nuevo.';
        return '';
    }

    function syncBankInputWithClabe(clabeInput, bankInput) {
        if (!clabeInput || !bankInput) return;
        const normalizedClabe = sanitizeClabeInput(clabeInput.value);
        const detectedBank = getBankNameFromClabe(normalizedClabe);
        const currentBankName = bankInput.value.trim();
        const previousAutoValue = bankInput.dataset.autoValue || '';
        const canAutofill = !currentBankName || currentBankName === previousAutoValue;
        clabeInput.value = normalizedClabe;
        if (detectedBank && canAutofill) {
            bankInput.value = detectedBank;
            bankInput.dataset.autoValue = detectedBank;
        } else if (!detectedBank && currentBankName === previousAutoValue) {
            bankInput.value = '';
            bankInput.dataset.autoValue = '';
        }
        clabeInput.setCustomValidity(getClabeValidationMessage(normalizedClabe));
    }

    // ============================================
    // ESTILOS CSS
    // ============================================
    const STYLES = `
        /* Container Principal */
        .ambassador-widget-container {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            position: relative;
            width: 100%;
        }

        .ambassador-widget-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        /* ============================================
           HEADER / HERO
           ============================================ */
        .amb-header {
            margin-bottom: 40px;
            position: relative;
        }

        .amb-header-top {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
        }

        .amb-profile-link {
            color: #333;
            text-decoration: underline;
            font-size: 0.9rem;
            font-weight: 500;
        }

        .amb-header-content {
            text-align: left;
        }

        .amb-header-title {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            color: #333;
            margin: 0 0 15px 0;
            line-height: 1.2;
        }

        .amb-header-subtitle {
            font-size: 1rem;
            color: #333;
            line-height: 1.6;
            margin: 0;
            max-width: 600px;
        }

        @media (max-width: 768px) {
            .amb-header-title {
                font-size: 40px;
                line-height: 1.2;
            }
            .amb-header-subtitle {
                font-size: 16px;
            }
            .amb-profile-link {
                font-size: 14px;
            }
            .ambassador-widget-content {
                padding: 15px;
            }
            /* Reducir border radius */
            .amb-code-card,
            .amb-earnings-card,
            .amb-stats-card,
            .amb-material-card,
            .amb-how-card,
            .amb-referral-item {
                border-radius: 20px;
            }
            .amb-code-box {
                border-radius: 20px;
            }
            .amb-earnings-available {
                border-radius: 20px;
            }
            .amb-stat-box {
                border-radius: 20px;
            }
            /* Alturas auto */
            .amb-code-box,
            .amb-stat-box {
                height: auto;
                min-height: auto;
            }
            /* Títulos cards */
            .amb-code-card .amb-card-title,
            .amb-earnings-card .amb-card-title,
            .amb-stats-card .amb-card-title {
                font-size: 30px;
                line-height: 1.2;
            }
            .amb-material-title,
            .amb-how-title {
                font-size: 24px;
                line-height: 1.2;
                white-space: normal;
                word-wrap: break-word;
            }
            /* Textos */
            .amb-code-card .amb-card-subtitle,
            .amb-earnings-card .amb-card-subtitle,
            .amb-stats-card .amb-card-subtitle,
            .amb-material-text,
            .amb-how-item {
                font-size: 16px;
            }
            .amb-referrals-title {
                font-size: 35px;
            }
        }

        /* ============================================
           CARDS GENERALES
           ============================================ */
        .amb-card {
            background: white;
            border-radius: 24px;
            padding: 30px;
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .amb-card-title {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-size: 1.4rem;
            font-weight: 700;
            color: #333;
            margin: 0 0 8px 0;
        }

        .amb-card-subtitle {
            font-size: 0.9rem;
            color: #888;
            margin: 0 0 20px 0;
        }

        /* Iconos flotantes */
        .amb-float-icon {
            position: absolute;
            width: 60px;
            height: 60px;
            z-index: 10;
        }

        .amb-float-icon.gift {
            top: -20px;
            right: 20px;
            width: 70px;
            height: 70px;
        }

        .amb-float-icon.money {
            top: -20px;
            right: -10px;
            width: 70px;
            height: 70px;
        }

        .amb-float-icon.stats {
            top: -20px;
            right: -10px;
            width: 60px;
            height: 60px;
        }

        @media (max-width: 768px) {
            .amb-float-icon {
                width: 45px;
                height: 45px;
            }
            .amb-float-icon.gift {
                width: 50px;
                height: 50px;
                top: -15px;
            }
            .amb-float-icon.money {
                width: 50px;
                height: 50px;
                top: -20px;
                right: 10px;
            }
            .amb-float-icon.stats {
                width: 50px;
                height: 50px;
                top: -15px;
            }
        }

        /* ============================================
           CÓDIGO DE REFERIDO
           ============================================ */
        .amb-code-section {
            margin-bottom: 30px;
        }

        .amb-code-card {
            border-radius: 66px;
            background: #FFF;
            padding: 40px;
            position: relative;
        }

        .amb-code-card .amb-card-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 50px;
            font-weight: 600;
            color: #000;
            margin: 0 0 10px 0;
            line-height: 63px;
        }

        .amb-code-card .amb-card-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            color: rgba(0, 0, 0, 0.40);
            margin: 0 0 30px 0;
            font-weight: 700;
        }

        .amb-code-box {
            display: flex;
            width: 476px;
            height: 228px;
            padding: 28px 21px 16px 21px;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            border-radius: 40px;
            border: 3px dashed #9FD406;
            background: #15BEB2;
            margin: 20px 0;
        }

        @media (max-width: 768px) {
            .amb-code-box {
                width: 100%;
                max-width: 476px;
                height: auto;
                min-height: 228px;
            }
            .amb-code-card {
                padding: 25px;
            }
            .amb-code-card .amb-card-title {
                font-size: 32px;
                line-height: 40px;
            }
            .amb-code-card .amb-card-subtitle {
                font-size: 16px;
            }
        }

        .amb-code-label {
            font-size: 0.85rem;
            color: rgba(255,255,255,0.9);
            display: block;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .amb-code-value {
            font-family: 'Fraiche', sans-serif;
            font-size: 3.5rem;
            font-weight: 800;
            color: white;
            letter-spacing: 4px;
        }

        @media (max-width: 768px) {
            .amb-code-value {
                font-size: 2.5rem;
                letter-spacing: 2px;
            }
        }

        .amb-code-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            width: 100%;
        }

        .amb-btn-orange {
            background: #FE8F15;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.95rem;
        }

        .amb-btn-orange:hover {
            background: #e67a12;
            transform: translateY(-2px);
        }

        .amb-btn-cancel {
            background: #9FD406;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.95rem;
        }

        .amb-btn-cancel:hover {
            background: #8bc306;
            transform: translateY(-2px);
        }

        .amb-how-it-works-inline {
            margin-top: 30px;
        }

        .amb-how-it-works-inline h3 {
            font-family: 'Fraiche', sans-serif;
            font-size: 50px;
            font-weight: 600;
            color: #000;
            margin: 0 0 8px 0;
            line-height: 63px;
        }

        @media (max-width: 768px) {
            .amb-how-it-works-inline h3 {
                font-size: 32px;
                line-height: 40px;
            }
        }

        .amb-how-it-works-inline p {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.40);
            margin: 0;
            line-height: normal;
            font-weight: 700;
        }

        /* ============================================
           GRID 2 COLUMNAS
           ============================================ */
        .amb-two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            align-items: stretch;
        }

        .amb-earnings-card,
        .amb-stats-card {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .amb-stats-grid {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            align-content: center;
        }

        @media (max-width: 900px) {
            .amb-two-columns {
                grid-template-columns: 1fr;
            }
        }

        /* ============================================
           GANANCIAS
           ============================================ */
        .amb-earnings-section {
            position: relative;
        }

        .amb-earnings-card {
            background: white;
            border-radius: 24px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
        }

        .amb-earnings-card .amb-card-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 50px;
            font-weight: 600;
            color: #000;
            margin: 0 0 5px 0;
            line-height: 63px;
        }

        .amb-earnings-card .amb-card-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            color: #9B9B9B;
            margin: 0 0 25px 0;
            font-weight: 700;
        }

        .amb-earnings-total {
            margin-bottom: 20px;
        }

        .amb-earnings-label {
            font-size: 0.8rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
            display: block;
        }

        .amb-earnings-value {
            font-family: 'Fraiche', sans-serif;
            font-size: 100px;
            font-weight: 600;
            color: #333;
            line-height: 1;
        }

        .amb-earnings-available {
            border-radius: 43px;
            border: 2px dashed #BBECE9;
            background: #BBECE9;
            padding: 20px;
            margin-bottom: 15px;
        }

        .amb-earnings-available-value {
            font-family: 'Fraiche', sans-serif;
            font-size: 100px;
            font-weight: 600;
            color: #333;
            line-height: 1;
        }

        .amb-earnings-note {
            color: #000;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 400;
            line-height: normal;
            margin: 0;
        }

        @media (max-width: 768px) {
            .amb-earnings-value,
            .amb-earnings-available-value {
                font-size: 60px;
            }
            .amb-earnings-card .amb-card-title {
                font-size: 32px;
                line-height: 40px;
            }
        }

        /* ============================================
           ESTADÍSTICAS
           ============================================ */
        .amb-stats-section {
            position: relative;
        }

        .amb-stats-card {
            background: white;
            border-radius: 24px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
        }

        .amb-stats-card .amb-card-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 50px;
            font-weight: 600;
            color: #000;
            margin: 0 0 5px 0;
            line-height: 63px;
        }

        .amb-stats-card .amb-card-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            color: #9B9B9B;
            margin: 0 0 25px 0;
            font-weight: 700;
        }

        .amb-stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .amb-stat-box {
            display: flex;
            width: 100%;
            height: auto;
            min-height: 120px;
            padding: 15px 20px;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 0;
            border-radius: 40px;
            color: white;
        }

        .amb-stat-box.approved {
            background: #7CB342;
        }

        .amb-stat-box.review {
            background: #FF8C42;
        }

        .amb-stat-box.rejected {
            background: #E91E63;
        }

        .amb-stat-box.total {
            background: #00BCD4;
        }

        .amb-stat-box.active-pata {
            grid-column: span 2;
            background: #00BBB4;
        }

        .amb-stat-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.95;
        }

        .amb-stat-num {
            font-family: 'Fraiche', sans-serif;
            font-size: 100px;
            font-weight: 600;
            color: #FFF;
            text-align: center;
            line-height: normal;
        }

        @media (max-width: 768px) {
            .amb-stats-card .amb-card-title {
                font-size: 32px;
                line-height: 40px;
            }
            .amb-stat-box {
                width: 100%;
                height: auto;
                min-height: 100px;
                padding: 15px;
            }
            .amb-stat-num {
                font-size: 60px;
            }
        }

        /* ============================================
           MÉTODO DE PAGO
           ============================================ */
        .amb-payment-section {
            margin-bottom: 30px;
        }

        .amb-payment-card {
            background: white;
            border-radius: 24px;
            padding: 25px 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
        }

        .amb-payment-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .amb-payment-icon {
            width: 40px;
            height: 40px;
        }

        .amb-payment-details {
            display: flex;
            flex-direction: column;
        }

        .amb-payment-label {
            font-size: 0.75rem;
            color: #888;
            text-transform: uppercase;
        }

        .amb-payment-card-info {
            font-size: 0.95rem;
            color: #333;
            font-weight: 600;
        }

        .amb-payment-actions {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .amb-payment-status {
            font-size: 0.8rem;
            color: #888;
        }

        .amb-payment-link {
            color: #E91E63;
            text-decoration: underline;
            font-size: 0.85rem;
            cursor: pointer;
            background: none;
            border: none;
        }

        .amb-payment-divider {
            width: 100%;
            border-bottom: 2px dashed #15BEB2;
            margin: 5px 0;
        }

        .amb-payment-add {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #333;
            font-weight: 500;
            cursor: pointer;
            background: none;
            border: none;
            font-size: 0.95rem;
        }

        .amb-payment-add-icon {
            width: 24px;
            height: 24px;
            border: 2px solid #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }

        .amb-payment-history {
            color: #666;
            font-size: 0.85rem;
            text-decoration: underline;
            cursor: pointer;
            background: none;
            border: none;
        }

        .amb-payment-empty {
            border-radius: 55px;
            background: #FFBD00;
            display: flex;
            padding: 18px 40px;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }

        .amb-payment-empty-icon {
            width: 50px;
            height: 50px;
        }

        .amb-payment-empty-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .amb-payment-empty-content {
            flex: 1;
        }

        .amb-payment-empty-content strong {
            color: #000;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 700;
            display: block;
            margin-bottom: 4px;
        }

        .amb-payment-empty-content p {
            color: #000;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 700;
            margin: 0;
        }

        /* Alerta datos bancarios */
        .amb-bank-alert {
            border-radius: 55px;
            background: #FFBD00;
            display: flex;
            padding: 18px 40px;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
            margin-bottom: 30px;
        }

        .amb-bank-alert-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .amb-bank-alert-icon {
            width: 50px;
            height: 50px;
        }

        .amb-bank-alert-text {
            color: #000;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 700;
            line-height: normal;
        }

        .amb-bank-alert-text strong {
            display: block;
            margin-bottom: 4px;
            font-size: 16px;
        }

        .amb-btn-bank {
            display: flex;
            width: 252px;
            height: 42px;
            justify-content: center;
            align-items: center;
            background: #15BEB2;
            color: white;
            border: none;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .amb-btn-bank:hover {
            background: #00a09a;
            transform: translateY(-2px);
        }

        .amb-btn-primary {
            background: #00BCD4;
            color: white;
            border: 2px solid #333;
            padding: 14px 30px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
        }

        .amb-btn-primary:hover {
            background: #00ACC1;
            transform: translateY(-2px);
        }

        /* ============================================
           MODALES
           ============================================ */
        .amb-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }

        .amb-modal-content {
            background: white;
            border-radius: 30px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: ambModalIn 0.3s ease;
        }

        @keyframes ambModalIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        .amb-modal-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 2rem;
            color: #888;
            cursor: pointer;
            line-height: 1;
        }

        .amb-modal-close:hover {
            color: #333;
        }

        .amb-modal-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 28px;
            color: #333;
            margin: 0 0 25px 0;
            text-align: center;
        }

        /* ============================================
           CHAT CON ADMINISTRACIÓN
           ============================================ */
        .amb-chat-bubble {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #00BBB4;
            color: white;
            border: none;
            font-size: 1.6rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            cursor: pointer;
            z-index: 998;
            transition: transform 0.2s;
        }

        .amb-chat-bubble:hover {
            transform: scale(1.08);
        }

        .amb-chat-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 22px;
            height: 22px;
            padding: 0 5px;
            border-radius: 11px;
            background: #FE8F15;
            color: white;
            font-size: 0.7rem;
            font-weight: 700;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        }

        .amb-chat-modal-content {
            max-width: 480px;
            display: flex;
            flex-direction: column;
        }

        .amb-chat-messages {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 45vh;
            overflow-y: auto;
            padding: 4px 4px 10px;
            margin-bottom: 16px;
        }

        .amb-chat-empty {
            text-align: center;
            color: #888;
            padding: 30px 10px;
            font-size: 0.9rem;
        }

        .amb-chat-msg {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .amb-chat-msg-self {
            align-self: flex-end;
            background: #00BBB4;
            color: white;
            border-bottom-right-radius: 4px;
        }

        .amb-chat-msg-admin {
            align-self: flex-start;
            background: #f0f0f0;
            color: #333;
            border-bottom-left-radius: 4px;
        }

        .amb-chat-msg-text {
            margin: 0;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            font-size: 0.9rem;
        }

        .amb-chat-msg-time {
            font-size: 0.7rem;
            opacity: 0.7;
            align-self: flex-end;
        }

        .amb-chat-input-row {
            display: flex;
            gap: 10px;
        }

        .amb-chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #eee;
            border-radius: 50px;
            font-size: 0.9rem;
            outline: none;
        }

        .amb-chat-input:focus {
            border-color: #00BBB4;
        }

        .amb-chat-send-btn {
            padding: 12px 22px;
            background: #FE8F15;
            color: white;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
        }

        .amb-chat-send-btn:hover {
            transform: translateY(-2px);
        }

        .amb-form-group {
            margin-bottom: 20px;
        }

        .amb-form-group label {
            display: block;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }

        .amb-form-group input,
        .amb-form-group select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #E0E0E0;
            border-radius: 12px;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            transition: border-color 0.2s;
        }

        .amb-form-group textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #E0E0E0;
            border-radius: 12px;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            transition: border-color 0.2s;
            resize: vertical;
            min-height: 90px;
            box-sizing: border-box;
        }

        .amb-form-group textarea:focus {
            outline: none;
            border-color: #15BEB2;
        }

        .amb-profile-photo-row {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
        }

        .amb-profile-photo-preview {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #333;
            flex-shrink: 0;
        }

        .amb-profile-photo-upload-btn {
            background: #F0FDFC;
            color: #333;
            border: 2px solid #15BEB2;
            padding: 10px 18px;
            border-radius: 50px;
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
        }

        .amb-profile-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #333;
            flex-shrink: 0;
        }

        .amb-profile-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
            min-width: 180px;
        }

        .amb-profile-name {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.1rem;
            color: #333;
        }

        .amb-profile-socials {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 4px;
        }

        .amb-profile-social-badge {
            background: #E8F8F7;
            color: #00BBB4;
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 0.72rem;
            font-weight: 700;
        }

        .amb-profile-social-badge.empty {
            background: #F1F1F1;
            color: #888;
        }

        .amb-form-group input:focus,
        .amb-form-group select:focus {
            outline: none;
            border-color: #15BEB2;
        }

        .amb-history-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 400px;
            overflow-y: auto;
        }

        .amb-history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #F8F9FA;
            border-radius: 16px;
        }

        .amb-history-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .amb-history-date {
            font-size: 13px;
            color: #888;
        }

        .amb-history-concept {
            font-size: 15px;
            color: #333;
            font-weight: 500;
        }

        .amb-history-amount {
            font-family: 'Fraiche', sans-serif;
            font-size: 20px;
            font-weight: 600;
        }

        .amb-history-amount.income {
            color: #22C55E;
        }

        .amb-history-amount.expense {
            color: #EF4444;
        }

        @media (max-width: 768px) {
            .amb-modal-content {
                padding: 25px;
                border-radius: 20px;
            }
            .amb-modal-title {
                font-size: 24px;
            }
            .amb-history-item {
                padding: 12px 15px;
            }
        }

        @media (max-width: 768px) {
            .amb-payment-empty {
                flex-direction: column;
                text-align: center;
                padding: 20px;
            }
            .amb-bank-alert {
                flex-direction: column;
                text-align: center;
                padding: 20px;
            }
            .amb-bank-alert-left {
                flex-direction: column;
            }
            .amb-btn-bank {
                width: 100%;
                max-width: 252px;
            }
        }

        /* ============================================
           ESTADO DE REFERIDOS
           ============================================ */
        .amb-referrals-section {
            margin-bottom: 30px;
        }

        .amb-referrals-header {
            margin-bottom: 25px;
        }

        .amb-referrals-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 100px;
            font-weight: 600;
            color: white;
            margin: 0 0 5px 0;
            line-height: 1;
        }

        .amb-referrals-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            color: rgba(255,255,255,0.9);
            margin: 0 0 20px 0;
        }

        .amb-referrals-filters {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }

        .amb-search-box {
            display: flex;
            width: 300px;
            align-items: center;
            gap: 5px;
            flex-shrink: 0;
        }

        .amb-search-input {
            width: 100%;
            padding: 8px 15px 8px 35px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            background: rgba(255,255,255,0.9);
            font-size: 0.9rem;
        }

        .amb-search-icon {
            width: 20px;
            height: 20px;
        }

        .amb-filter-container {
            display: flex;
            height: 31px;
            justify-content: center;
            align-items: center;
            gap: 8px;
        }

        .amb-filter-label {
            color: white;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
        }

        .amb-filter-dropdown {
            height: 31px;
            padding: 0 12px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            background: rgba(255,255,255,0.9);
            font-size: 14px;
            cursor: pointer;
        }

        .amb-referrals-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .amb-referral-item {
            border-radius: 35px;
            background: #FFF;
            display: flex;
            padding: 15px 30px 15px 50px;
            justify-content: space-between;
            align-items: center;
            align-self: stretch;
            margin-bottom: 12px;
        }

        .amb-referral-left {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .amb-referral-name {
            color: #000;
            font-family: 'Fraiche', sans-serif;
            font-size: 30px;
            font-weight: 600;
            line-height: 20px;
        }

        .amb-referral-email {
            color: #9B9B9B;
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 700;
            line-height: 16px;
        }

        .amb-referral-date {
            color: #000;
            font-family: 'Fraiche', sans-serif;
            font-size: 14px;
            font-weight: 600;
            line-height: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .amb-referral-date-icon {
            width: 16px;
            height: 16px;
        }

        .amb-referral-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .amb-referral-commission-label {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            color: #9B9B9B;
            text-transform: uppercase;
            font-weight: 500;
            margin-bottom: 5px;
        }

        .amb-referral-commission-value {
            color: #000;
            text-align: center;
            font-family: 'Fraiche', sans-serif;
            font-size: 65px;
            font-weight: 600;
            line-height: 60px;
        }

        .amb-referral-status-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .amb-referral-status-badge {
            display: flex;
            height: 25px;
            padding: 4px 12px 4px 30px;
            align-items: center;
            justify-content: center;
            border-radius: 33554400px;
            font-size: 12px;
            font-weight: 600;
            text-transform: lowercase;
            font-family: 'Outfit', sans-serif;
            position: relative;
        }

        .amb-referral-status-badge.approved {
            background: #9FD406;
            color: #FFF;
        }

        .amb-referral-status-badge.process {
            background: #FE8F15;
            color: #FFF;
        }

        .amb-referral-status-badge.rejected {
            background: #FF0063;
            color: #FFF;
        }

        .amb-status-icon {
            position: absolute;
            left: -12px;
            top: 50%;
            transform: translateY(-50%);
            width: 24px;
            height: 24px;
            z-index: 10;
        }

        @media (max-width: 768px) {
            .amb-referral-item {
                padding: 15px 20px;
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            .amb-referral-name {
                font-size: 22px;
                line-height: 1.2;
            }
            .amb-referral-email {
                font-size: 14px;
            }
            .amb-referral-commission-value {
                font-size: 36px;
                line-height: 1;
            }
            .amb-referral-center {
                align-items: flex-start;
                width: 100%;
                flex-direction: row;
                justify-content: space-between;
                gap: 10px;
            }
            .amb-referral-status-wrapper {
                align-self: flex-start;
            }
            .amb-referral-status-badge {
                width: auto;
                min-width: 90px;
                padding: 4px 12px 4px 25px;
            }
            .amb-status-icon {
                width: 20px;
                height: 20px;
                left: -10px;
            }
        }

        /* ============================================
           MATERIAL DIGITAL (galería descargable con filtros)
           ============================================ */
        .amb-material-section {
            margin-bottom: 30px;
        }

        .amb-material-card {
            background: white;
            border-radius: 24px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .amb-material-header {
            margin-bottom: 20px;
        }

        .amb-material-filters {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 22px;
        }

        .amb-material-filter-btn {
            background: #F1F1F1;
            color: #555;
            border: none;
            border-radius: 999px;
            padding: 8px 18px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            transition: all 0.2s;
        }

        .amb-material-filter-btn.active {
            background: #E91E63;
            color: white;
        }

        .amb-material-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 16px;
        }

        .amb-material-item {
            background: #F8F9FA;
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
            text-align: center;
        }

        .amb-material-thumb {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 12px;
            background: white;
        }

        .amb-material-icon {
            width: 100%;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            background: white;
            border-radius: 12px;
        }

        .amb-material-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            width: 100%;
        }

        .amb-material-item-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            color: #333;
            word-break: break-word;
        }

        .amb-material-item-desc {
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            color: #888;
        }

        .amb-btn-pink {
            background: #E91E63;
            color: white;
            border: none;
            display: flex;
            width: 160px;
            height: 42px;
            padding-right: 1px;
            justify-content: center;
            align-items: center;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            margin: 0 auto;
        }

        .amb-btn-pink:hover {
            background: #C2185B;
            transform: translateY(-2px);
        }

        .amb-material-download {
            width: 100%;
            margin: 0;
            text-decoration: none;
            box-sizing: border-box;
        }

        .amb-material-empty {
            text-align: center;
            padding: 30px;
            color: #999;
            font-family: 'Outfit', sans-serif;
        }

        /* Newsletter: tarjeta destacada de noticias/efemérides, ocupa todo el ancho del grid */
        .amb-newsletter-item {
            grid-column: 1 / -1;
            flex-direction: row;
            align-items: stretch;
            text-align: left;
            padding: 0;
            overflow: hidden;
            position: relative;
            gap: 0;
        }

        .amb-newsletter-date-badge {
            position: absolute;
            top: 14px;
            left: 14px;
            background: #FE8F15;
            color: white;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 0.8rem;
            padding: 6px 14px;
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1;
        }

        .amb-newsletter-image {
            width: 220px;
            min-width: 220px;
            height: auto;
            object-fit: cover;
            background: white;
        }

        .amb-newsletter-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 20px;
        }

        .amb-newsletter-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.2rem;
            color: #333;
            margin: 0;
        }

        .amb-newsletter-desc {
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            color: #666;
            margin: 0;
            line-height: 1.5;
        }

        .amb-newsletter-actions {
            display: flex;
            gap: 10px;
            margin-top: auto;
            padding-top: 10px;
            flex-wrap: wrap;
        }

        .amb-newsletter-download {
            width: auto;
            margin: 0;
            padding: 0 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 42px;
            border-radius: 50px;
            background: #F1F1F1;
            color: #333;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            font-family: 'Outfit', sans-serif;
            transition: all 0.2s;
        }

        .amb-newsletter-download:hover {
            background: #E0E0E0;
        }

        @media (max-width: 768px) {
            .amb-material-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            }

            .amb-newsletter-item {
                flex-direction: column;
            }

            .amb-newsletter-image {
                width: 100%;
                min-width: 0;
                height: 160px;
            }
        }

        /* ============================================
           MIS DATOS DE REGISTRO (primera sección: identidad del embajador)
           ============================================ */
        .amb-registration-data-section {
            margin-bottom: 30px;
        }

        .amb-registration-data-card {
            background: white;
            border-radius: 24px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
        }

        .amb-registration-data-identity {
            display: flex;
            align-items: center;
            gap: 18px;
            padding-bottom: 22px;
            margin-bottom: 22px;
            border-bottom: 1px solid #EFEFEF;
            flex-wrap: wrap;
        }

        .amb-registration-data-identity .amb-profile-avatar {
            width: 72px;
            height: 72px;
        }

        .amb-registration-data-identity .amb-profile-name {
            font-size: 1.3rem;
        }

        .amb-registration-data-approved-badge {
            background: #E9F9E9;
            color: #2F9E44;
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 0.72rem;
            font-weight: 700;
        }

        .amb-registration-data-title {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
            margin: 0 0 6px 0;
            line-height: 1.3;
            background: none;
            text-decoration: none;
            box-shadow: none;
            padding: 0;
        }

        .amb-registration-data-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            color: #888;
            margin: 0 0 24px 0;
            font-weight: 500;
        }

        .amb-registration-data-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }

        .amb-registration-data-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
            background: #F8F9FA;
            border-radius: 14px;
            padding: 12px 16px;
        }

        .amb-data-label {
            font-family: 'Outfit', sans-serif;
            font-size: 0.7rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .amb-data-value {
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            color: #333;
            font-weight: 600;
            word-break: break-word;
        }

        .amb-data-value a {
            color: #00BBB4;
            text-decoration: underline;
        }

        .amb-data-full-width {
            grid-column: span 2;
        }

        @media (max-width: 900px) {
            .amb-registration-data-grid {
                grid-template-columns: 1fr;
            }

            .amb-data-full-width {
                grid-column: span 1;
            }

            .amb-registration-data-identity {
                gap: 14px;
            }

            .amb-registration-data-identity .amb-profile-avatar {
                width: 56px;
                height: 56px;
            }

            .amb-registration-data-title {
                font-size: 1.25rem;
            }
        }

        /* ============================================
           CÓMO FUNCIONA
           ============================================ */
        .amb-how-section {
            position: relative;
            margin-bottom: 30px;
        }

        .amb-how-card {
            background: #15BEB2;
            border-radius: 68px;
            padding: 40px 60px;
            position: relative;
            overflow: visible;
            min-height: 200px;
        }

        .amb-how-content {
            max-width: 70%;
            position: relative;
            z-index: 5;
        }

        .amb-how-title {
            color: #FFF;
            font-family: 'Fraiche', sans-serif;
            font-size: 36px;
            font-weight: 600;
            line-height: 1.2;
            margin: 0 0 25px 0;
            white-space: normal;
        }

        .amb-how-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .amb-how-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            color: #FFF;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 700;
            line-height: normal;
        }

        .amb-how-check {
            width: 20px;
            height: 20px;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 0.7rem;
        }

        .amb-how-image {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 280px;
            height: 100%;
            object-fit: cover;
            object-position: center top;
            z-index: 10;
            border-radius: 0 0 68px 0;
        }

        @media (max-width: 768px) {
            .amb-how-card {
                padding: 25px !important;
                min-height: auto !important;
            }
            .amb-how-content {
                max-width: 100% !important;
                padding-bottom: 0 !important;
                text-align: center !important;
            }
            .amb-how-title {
                font-size: 24px;
                line-height: 1.2;
                text-align: center;
                margin-bottom: 20px !important;
            }
            .amb-how-list {
                gap: 15px !important;
            }
            .amb-how-item {
                text-align: left;
            }
            .amb-how-image {
                display: none !important;
            }
        }

        /* ============================================
           ESTADOS: PENDIENTE / RECHAZADO / NO EMBAJADOR
           ============================================ */
        .ambassador-pending-card {
            background: linear-gradient(135deg, #00BBB4 0%, #00a09a 100%);
            border-radius: 24px;
            padding: 40px;
            color: white;
            text-align: center;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
            position: relative;
            margin-bottom: 40px;
        }

        .ambassador-pending-title {
            font-size: 2.2rem;
            font-weight: 700;
            margin: 0 0 15px 0;
            font-style: italic;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }

        .ambassador-pending-subtitle {
            font-size: 1rem;
            opacity: 0.95;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .ambassador-progress-container {
            margin: 30px 0;
        }

        .ambassador-progress-labels {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .ambassador-progress-bar {
            position: relative;
            height: 20px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            overflow: visible;
        }

        .ambassador-progress-fill {
            height: 100%;
            width: 60%;
            background: linear-gradient(90deg, #FFC107, #F59E0B);
            border-radius: 20px;
            position: relative;
            transition: width 0.5s ease;
        }

        .ambassador-progress-paw {
            position: absolute;
            right: -15px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.8rem;
        }

        .ambassador-deco-flag {
            position: absolute;
            left: -30px;
            top: 50%;
            transform: translateY(-50%);
            width: 100px;
        }

        .ambassador-deco-megaphone {
            position: absolute;
            right: -30px;
            top: 50%;
            transform: translateY(-50%) rotate(-15deg);
            width: 100px;
        }

        @media (max-width: 768px) {
            .ambassador-deco-flag,
            .ambassador-deco-megaphone {
                display: none;
            }
            .ambassador-pending-card {
                padding: 30px 20px;
            }
            .ambassador-pending-title {
                font-size: 1.6rem;
            }
        }

        .ambassador-rejected-card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
            border-top: 5px solid #ef4444;
            margin-bottom: 30px;
        }

        .ambassador-rejected-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #FFEBEE;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 2.5rem;
        }

        .ambassador-rejected-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
        }

        .ambassador-rejected-reason {
            background: #f9f9f9;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }

        .ambassador-rejected-reason h4 {
            color: #ef4444;
            margin: 0 0 10px 0;
            font-size: 0.95rem;
        }

        .ambassador-rejected-reason p {
            color: #555;
            margin: 0;
            line-height: 1.6;
        }

        .ambassador-rejected-message {
            color: #666;
            font-size: 0.95rem;
            margin-bottom: 25px;
        }

        .ambassador-btn-retry {
            background: #00BBB4;
            color: white;
            border: none;
            padding: 14px 30px;
            border-radius: 30px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .ambassador-btn-retry:hover {
            background: #00a09a;
            transform: translateY(-2px);
        }

        .ambassador-not-found {
            background: white;
            border-radius: 24px;
            padding: 50px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        .ambassador-not-found-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }

        .ambassador-not-found h2 {
            font-size: 1.5rem;
            color: #333;
            margin-bottom: 15px;
        }

        .ambassador-not-found p {
            color: #666;
            margin-bottom: 25px;
        }

        .ambassador-btn-apply {
            background: linear-gradient(135deg, #00BBB4, #00a09a);
            color: white;
            border: none;
            padding: 16px 40px;
            border-radius: 30px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(0, 187, 180, 0.3);
        }

        .ambassador-btn-apply:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 187, 180, 0.4);
        }

        /* ============================================
           LOADING STATE
           ============================================ */
        .ambassador-loading {
            text-align: center;
            padding: 60px 20px;
        }

        .ambassador-loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #eee;
            border-top-color: #00BBB4;
            border-radius: 50%;
            animation: ambassadorSpin 0.8s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes ambassadorSpin {
            to { transform: rotate(360deg); }
        }

        /* ============================================
           BENEFICIOS GRID (para estados no aprobados)
           ============================================ */
        .ambassador-benefits-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 20px;
        }

        @media (max-width: 900px) {
            .ambassador-benefits-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 500px) {
            .ambassador-benefits-grid {
                grid-template-columns: 1fr;
            }
        }

        .ambassador-benefit-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border-left: 5px solid;
            transition: transform 0.2s ease;
        }

        .ambassador-benefit-card:hover {
            transform: translateY(-5px);
        }

        .ambassador-benefit-card.yellow {
            border-color: #FFC107;
        }

        .ambassador-benefit-card.orange {
            border-color: #F59E0B;
        }

        .ambassador-benefit-card.coral {
            border-color: #FF6B6B;
        }

        .ambassador-benefit-card.green {
            border-color: #22c55e;
        }

        .ambassador-benefit-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 1.5rem;
        }

        .ambassador-benefit-card.yellow .ambassador-benefit-icon {
            background: #FFF8E1;
        }

        .ambassador-benefit-card.orange .ambassador-benefit-icon {
            background: #FFF3E0;
        }

        .ambassador-benefit-card.coral .ambassador-benefit-icon {
            background: #FFEBEE;
        }

        .ambassador-benefit-card.green .ambassador-benefit-icon {
            background: #E8F5E9;
        }

        .ambassador-benefit-title {
            font-weight: 700;
            font-size: 0.95rem;
            color: #333;
            margin-bottom: 8px;
        }

        .ambassador-benefit-desc {
            font-size: 0.8rem;
            color: #666;
            line-height: 1.4;
        }

        /* Welcome Modal */
        .amb-welcome-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
            opacity: 0;
            animation: ambFadeIn 0.3s ease forwards;
        }

        .amb-welcome-modal {
            background: white;
            border-radius: 30px;
            padding: 40px;
            max-width: 550px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.25);
            text-align: center;
            position: relative;
            transform: translateY(-20px);
            animation: ambSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            font-family: 'Outfit', sans-serif;
            box-sizing: border-box;
        }

        .amb-welcome-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }

        .amb-welcome-title {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-size: 28px;
            color: #333;
            margin: 0 0 15px 0;
            line-height: 1.3;
        }

        .amb-welcome-text {
            color: #555;
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 25px;
            text-align: left;
        }

        .amb-welcome-text p {
            margin: 0 0 15px 0;
        }

        .amb-welcome-list {
            margin: 0 0 20px 0;
            padding-left: 0;
            list-style: none;
        }

        .amb-welcome-list li {
            position: relative;
            padding-left: 25px;
            margin-bottom: 10px;
            font-size: 0.9rem;
            color: #444;
            line-height: 1.4;
        }

        .amb-welcome-list li::before {
            content: "🐾";
            position: absolute;
            left: 0;
            top: 2px;
            font-size: 1rem;
        }

        .amb-welcome-btn {
            background: #FE8F15;
            color: white;
            border: 2px solid #000000;
            padding: 14px 28px;
            border-radius: 50px;
            font-family: 'Fraiche', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.2s ease;
            box-shadow: 0 4px 10px rgba(254, 143, 21, 0.2);
        }

        .amb-welcome-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(254, 143, 21, 0.3);
            background: #e57f10;
        }

        @keyframes ambFadeIn {
            to { opacity: 1; }
        }

        @keyframes ambSlideUp {
            to { transform: translateY(0); }
        }
    `;

    // ============================================
    // TEMPLATES HTML
    // ============================================

    // Estado: Cargando
    function renderLoading() {
        return `
            <div class="ambassador-loading">
                <div class="ambassador-loading-spinner"></div>
                <p>Verificando tu estado de embajador...</p>
            </div>
        `;
    }

    // Estado: No es embajador
    function renderNotAmbassador(memberId) {
        const registroUrl = memberId
            ? `${CONFIG.API_BASE_URL}/embajadores/registro?memberId=${memberId}`
            : `${CONFIG.API_BASE_URL}/embajadores/registro`;

        return `
            <div class="ambassador-not-found">
                <div class="ambassador-not-found-icon">🎯</div>
                <h2>¿Quieres ser Embajador Pata Amiga?</h2>
                <p>Únete a nuestra manada y gana comisiones por cada familia que ayudes a proteger a sus peludos.</p>
                <button class="ambassador-btn-apply" onclick="window.location.href='${registroUrl}'">
                    Quiero ser Embajador
                </button>
            </div>
        `;
    }

    // Estado: Pendiente / En Revisión
    function renderPending(ambassador) {
        return `
            <div class="ambassador-pending-card">
                <img src="${CONFIG.IMAGES_BASE_URL}/bandera.png" alt="" class="ambassador-deco-flag">
                <img src="${CONFIG.IMAGES_BASE_URL}/altavoz.png" alt="" class="ambassador-deco-megaphone">

                <h2 class="ambassador-pending-title">
                    Tu solicitud está en revisión
                </h2>
                
                <p class="ambassador-pending-subtitle">
                    Estamos revisando tu registro para convertirte en Embajador.<br>
                    En 24-48 horas te avisaremos si fue aprobado.
                </p>

                <div class="ambassador-progress-container">
                    <div class="ambassador-progress-labels">
                        <span>Solicitud enviada</span>
                        <span>En revisión...</span>
                    </div>
                    <div class="ambassador-progress-bar">
                        <div class="ambassador-progress-fill">
                            <span class="ambassador-progress-paw">🐾</span>
                        </div>
                    </div>
                </div>

                <p class="ambassador-pending-message">
                    Gracias por querer sumar tu voz a la manada
                </p>

                <button class="ambassador-btn-retry" onclick="window.editAmbassadorProfile()">
                    📝 Completa tu perfil
                </button>
                <p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.9;">
                    Agrega tu RFC, datos bancarios, redes sociales y foto para agilizar tu aprobación.
                </p>
            </div>

            <div class="ambassador-benefits-grid">
                <div class="ambassador-benefit-card yellow">
                    <div class="ambassador-benefit-icon">💰</div>
                    <div class="ambassador-benefit-title">Gana por compartir</div>
                    <div class="ambassador-benefit-desc">
                        Recibe una comisión del 10% por cada persona que se una al club usando tu código único.
                    </div>
                </div>

                <div class="ambassador-benefit-card orange">
                    <div class="ambassador-benefit-icon">🔗</div>
                    <div class="ambassador-benefit-title">Invita a tu manera</div>
                    <div class="ambassador-benefit-desc">
                        Te damos materiales digitales listos para compartir en tus redes o con tus amigos.
                    </div>
                </div>

                <div class="ambassador-benefit-card coral">
                    <div class="ambassador-benefit-icon">❤️</div>
                    <div class="ambassador-benefit-title">Haz crecer la manada</div>
                    <div class="ambassador-benefit-desc">
                        Ayuda a que más peludos reciban protección y apoyo médico de calidad.
                    </div>
                </div>

                <div class="ambassador-benefit-card green">
                    <div class="ambassador-benefit-icon">📊</div>
                    <div class="ambassador-benefit-title">Todo desde tu panel</div>
                    <div class="ambassador-benefit-desc">
                        Administra tus referidos, ve tus ganancias y solicita retiros fácilmente.
                    </div>
                </div>
            </div>
        `;
    }

    // Estado: Rechazado
    function renderRejected(ambassador, memberId) {
        const contactMailto = "mailto:contacto@pataamiga.mx?subject=" + encodeURIComponent('Consulta sobre mi solicitud de embajador');

        return `
            <div class="ambassador-rejected-card">
                <div class="ambassador-rejected-icon">😔</div>
                <h2 class="ambassador-rejected-title">Tu solicitud no fue aprobada</h2>

                ${ambassador.rejection_reason ? `
                    <div class="ambassador-rejected-reason">
                        <h4>Motivo:</h4>
                        <p>${ambassador.rejection_reason}</p>
                    </div>
                ` : ''}

                <p class="ambassador-rejected-message">
                    Si crees que esto es un error o quieres intentarlo de nuevo, escríbenos a
                    <strong>contacto@pataamiga.mx</strong>.
                </p>

                <button class="ambassador-btn-retry" onclick="window.location.href='${contactMailto}'">
                    Escríbenos por correo
                </button>
            </div>

            <div class="ambassador-benefits-grid">
                <div class="ambassador-benefit-card yellow">
                    <div class="ambassador-benefit-icon">💰</div>
                    <div class="ambassador-benefit-title">Gana por compartir</div>
                    <div class="ambassador-benefit-desc">
                        Recibe una comisión del 10% por cada persona que se una al club.
                    </div>
                </div>

                <div class="ambassador-benefit-card orange">
                    <div class="ambassador-benefit-icon">🔗</div>
                    <div class="ambassador-benefit-title">Invita a tu manera</div>
                    <div class="ambassador-benefit-desc">
                        Materiales digitales listos para compartir.
                    </div>
                </div>

                <div class="ambassador-benefit-card coral">
                    <div class="ambassador-benefit-icon">❤️</div>
                    <div class="ambassador-benefit-title">Haz crecer la manada</div>
                    <div class="ambassador-benefit-desc">
                        Ayuda a proteger más peludos.
                    </div>
                </div>

                <div class="ambassador-benefit-card green">
                    <div class="ambassador-benefit-icon">📊</div>
                    <div class="ambassador-benefit-title">Todo desde tu panel</div>
                    <div class="ambassador-benefit-desc">
                        Administra todo fácilmente.
                    </div>
                </div>
            </div>
        `;
    }

    // Estado: Aprobado pero sin código
    function renderApprovedNoCode(ambassador) {
        return `
            <div class="ambassador-pending-card" style="background: linear-gradient(135deg, #FFD93D 0%, #F59E0B 100%);">
                <div class="ambassador-pending-title">
                    ¡Felicidades! Eres Embajador
                    <span style="font-size: 2.5rem;">🎉</span>
                </div>
                
                <p class="ambassador-pending-subtitle">
                    Tu solicitud ha sido aprobada. Ahora necesitas elegir tu código de embajador único.<br>
                    Este código te identificará y tus referidos lo usarán para obtener beneficios.
                </p>

                <div style="background: rgba(255,255,255,0.2); border-radius: 15px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 15px 0; font-size: 0.95rem;">
                        📧 Te hemos enviado un email con un link para elegir tu código.<br>
                        Revisa tu bandeja de entrada (y spam).
                    </p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
                    <button class="ambassador-btn-apply" onclick="window.generateCodeLink('${ambassador.id}')">
                        🎯 Elegir código ahora
                    </button>
                    
                    <button class="ambassador-btn-retry" onclick="window.requestNewCodeEmail('${ambassador.id}')" 
                            style="background: transparent; border: 2px solid white; color: white;">
                        📧 Reenviar email
                    </button>
                </div>
                
                <p style="margin-top: 15px; font-size: 0.8rem; opacity: 0.9;">
                    💡 Si no recibiste el email, usa "Elegir código ahora" para continuar.
                </p>
            </div>
        `;
    }

    // Estado: Aprobado - Dashboard completo (Nuevo Diseño)
    function renderApproved(ambassador, materials) {
        materials = materials || [];
        const toNumber = (value, fallback = 0) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        const formatCurrency = (amount) => {
            return '$' + toNumber(amount).toLocaleString('es-MX');
        };

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        };

        const formatPhone = (phone) => {
            if (!phone) return '—';
            const cleaned = String(phone).replace(/\D/g, '');
            if (cleaned.length === 10) {
                return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6);
            }
            return phone;
        };

        const GENDER_LABELS = { male: 'Hombre', female: 'Mujer', not_specified: 'No especificar' };
        const genderLabel = (gender) => GENDER_LABELS[gender] || gender || '—';

        const fullName = [ambassador.first_name, ambassador.paternal_surname, ambassador.maternal_surname].filter(Boolean).join(' ');
        const hasAddress = [ambassador.address, ambassador.city, ambassador.state, ambassador.postal_code].some(Boolean);
        const addressLine = [ambassador.address, ambassador.neighborhood, ambassador.city, ambassador.state].filter(Boolean).join(', ') + (ambassador.postal_code ? ', CP ' + ambassador.postal_code : '');
        const hasAnySocial = ambassador.facebook || ambassador.instagram || ambassador.tiktok;
        const socialLinks = [
            ambassador.facebook ? `<a href="${ambassador.facebook}" target="_blank" rel="noopener noreferrer">Facebook</a>` : '',
            ambassador.instagram ? ` · <a href="${ambassador.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>` : '',
            ambassador.tiktok ? ` · <a href="${ambassador.tiktok}" target="_blank" rel="noopener noreferrer">TikTok</a>` : ''
        ].filter(Boolean).join('');

        // Verificar si tiene código activo
        // Robustez: si tiene un código que no empieza con TMP, lo consideramos activo
        const hasActiveCode = ambassador.referral_code &&
                             (ambassador.referral_code_status === 'active' || !ambassador.referral_code.startsWith('TMP'));
        
        console.log('[AmbassadorWidget] Referral code check:', { 
            code: ambassador.referral_code, 
            status: ambassador.referral_code_status,
            hasActiveCode 
        });

        if (!hasActiveCode) {
            return renderApprovedNoCode(ambassador);
        }

        // Estadísticas del embajador
        const totalReferrals = toNumber(ambassador.total_referrals ?? ambassador.referrals_count);
        const totalEarnings = toNumber(ambassador.total_earnings);
        const pendingPayout = toNumber(ambassador.pending_payout);
        const referralCode = ambassador.referral_code || '---';
        const approvedReferrals = toNumber(ambassador.approved_referrals);
        const reviewReferrals = toNumber(ambassador.review_referrals);
        const rejectedReferrals = toNumber(ambassador.rejected_referrals);
        const activeReferrals = toNumber(ambassador.active_referrals_count);
        
        // Datos de pago
        const hasPaymentMethod = ambassador.payment_method === 'clabe' && !!ambassador.clabe;
        const clabe = String(ambassador.clabe || '');
        const clabeLast4 = clabe.slice(-4) || '----';
        const bankName = ambassador.bank_name || 'Banco no especificado';

        // Referidos reales
        const referrals = ambassador.recent_referrals || [];

        return `
            <div class="amb-dashboard">
                <!-- Header -->
                <header class="amb-header">
                    <div class="amb-header-top">
                        <a href="#perfil" class="amb-profile-link">Perfil | Embajadores</a>
                    </div>
                    <div class="amb-header-content">
                        <h1 class="amb-header-title">gana por compartir el amor por los peludos</h1>
                        <p class="amb-header-subtitle">
                            Comparte tu código, invita a más familias y recibe un porcentaje real por cada membresía aprobada con tu referido.
                        </p>
                    </div>
                </header>

                <!-- Mis Datos de Registro (lo primero: quién eres como embajador) -->
                <section class="amb-registration-data-section" id="embajador-perfil">
                    <div class="amb-registration-data-card">
                        <div class="amb-registration-data-identity">
                            <img src="${ambassador.profile_photo_url || DEFAULT_AVATAR_PLACEHOLDER}" alt="Foto de perfil" class="amb-profile-avatar">
                            <div class="amb-profile-info">
                                <span class="amb-profile-name">${fullName || 'Embajador'}</span>
                                <div class="amb-profile-socials">
                                    <span class="amb-registration-data-approved-badge">✓ Embajador aprobado</span>
                                    ${ambassador.facebook ? `<span class="amb-profile-social-badge">Facebook</span>` : ''}
                                    ${ambassador.instagram ? `<span class="amb-profile-social-badge">Instagram</span>` : ''}
                                    ${ambassador.tiktok ? `<span class="amb-profile-social-badge">TikTok</span>` : ''}
                                    ${!hasAnySocial ? `<span class="amb-profile-social-badge empty">Sin redes agregadas</span>` : ''}
                                </div>
                            </div>
                        </div>

                        <h2 class="amb-registration-data-title">mis datos de registro</h2>
                        <p class="amb-registration-data-subtitle">Información que registraste como embajador</p>
                        <div class="amb-registration-data-grid">
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">Nombre completo</span>
                                <span class="amb-data-value">${fullName || '—'}</span>
                            </div>
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">Correo</span>
                                <span class="amb-data-value">${ambassador.email || '—'}</span>
                            </div>
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">Celular</span>
                                <span class="amb-data-value">${formatPhone(ambassador.phone)}</span>
                            </div>
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">CURP</span>
                                <span class="amb-data-value">${ambassador.curp || '—'}</span>
                            </div>
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">RFC</span>
                                <span class="amb-data-value">${ambassador.rfc || 'Sin RFC registrado'}</span>
                            </div>
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">Fecha de nacimiento</span>
                                <span class="amb-data-value">${formatDate(ambassador.birth_date)}</span>
                            </div>
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">Ciudad de nacimiento</span>
                                <span class="amb-data-value">${ambassador.birth_city || '—'}</span>
                            </div>
                            <div class="amb-registration-data-item">
                                <span class="amb-data-label">Sexo</span>
                                <span class="amb-data-value">${genderLabel(ambassador.gender)}</span>
                            </div>
                            ${hasAddress ? `
                            <div class="amb-registration-data-item amb-data-full-width">
                                <span class="amb-data-label">Dirección</span>
                                <span class="amb-data-value">${addressLine}</span>
                            </div>
                            ` : ''}
                            ${ambassador.motivation ? `
                            <div class="amb-registration-data-item amb-data-full-width">
                                <span class="amb-data-label">Por qué quiero ser embajador</span>
                                <span class="amb-data-value">${ambassador.motivation}</span>
                            </div>
                            ` : ''}
                        </div>
                        <button class="amb-btn-bank" onclick="window.editAmbassadorProfile()" style="margin-top: 20px;">
                            Editar información
                        </button>
                    </div>
                </section>

                <!-- Código de Referido -->
                <section class="amb-code-section">
                    <div class="amb-code-card">
                        <img src="${CONFIG.CLOUDINARY_URL}/v1772036421/gift_icon_wrrk9f.png"
                             alt="Regalo" class="amb-float-icon gift">

                        <h2 class="amb-card-title">tu código de referido</h2>
                        <p class="amb-card-subtitle">
                            Comparte tu código, invita a más familias y recibe un porcentaje real por cada membresía aprobada con tu referido.
                        </p>

                        <div class="amb-code-box">
                            <span class="amb-code-label">Tu código único</span>
                            <div class="amb-code-value">${referralCode}</div>
                            <div class="amb-code-buttons">
                                <button class="amb-btn-cancel" onclick="window.cancelAmbassadorRequest('${ambassador.id}')">
                                    Cancelar solicitud
                                </button>
                                <button class="amb-btn-orange" onclick="window.shareCode('${referralCode}')">
                                    Compartir 🔗
                                </button>
                            </div>
                        </div>

                        <div class="amb-how-it-works-inline">
                            <h3>¿cómo funciona?</h3>
                            <p>Comparte tu código con tus amigos. Si su solicitud es aprobada y pagan su membresía, tú ganas una comisión.</p>
                        </div>
                    </div>
                </section>

                <!-- Grid: Ganancias y Estadísticas -->
                <div class="amb-two-columns">
                    <!-- Ganancias -->
                    <section class="amb-earnings-section">
                        <img src="${CONFIG.CLOUDINARY_URL}/v1772036420/money_icon_gyxpwi.png"
                             alt="Dinero" class="amb-float-icon money">
                        <div class="amb-earnings-card">
                            <h2 class="amb-card-title">tus ganancias</h2>
                            <p class="amb-card-subtitle">Historial de comisiones</p>

                            <div class="amb-earnings-total">
                                <span class="amb-earnings-label">Total ganado histórico</span>
                                <span class="amb-earnings-value">${formatCurrency(totalEarnings)}</span>
                            </div>

                            <div class="amb-earnings-available">
                                <span class="amb-earnings-label">Disponible para retirar</span>
                                <span class="amb-earnings-available-value">${formatCurrency(pendingPayout)}</span>
                            </div>

                            <p class="amb-earnings-note">
                                El día 6 de cada mes, tus ganancias se transfieren de forma automática a tu cuenta bancaria registrada.
                            </p>
                        </div>
                    </section>

                    <!-- Estadísticas -->
                    <section class="amb-stats-section">
                        <img src="${CONFIG.CLOUDINARY_URL}/v1772036421/estaduisticas_icon_ntslcc.png"
                             alt="Estadísticas" class="amb-float-icon stats">
                        <div class="amb-stats-card">
                            <h2 class="amb-card-title">estadísticas</h2>
                            <p class="amb-card-subtitle">Resumen de tus referidos</p>

                            <div class="amb-stats-grid">
                                <div class="amb-stat-box approved">
                                    <span class="amb-stat-label">Aprobados</span>
                                    <span class="amb-stat-num">${approvedReferrals}</span>
                                </div>
                                <div class="amb-stat-box review">
                                    <span class="amb-stat-label">En revisión</span>
                                    <span class="amb-stat-num">${reviewReferrals}</span>
                                </div>
                                <div class="amb-stat-box rejected">
                                    <span class="amb-stat-label">Rechazados</span>
                                    <span class="amb-stat-num">${rejectedReferrals}</span>
                                </div>
                                <div class="amb-stat-box total">
                                    <span class="amb-stat-label">Total</span>
                                    <span class="amb-stat-num">${totalReferrals}</span>
                                </div>
                                <div class="amb-stat-box active-pata">
                                    <span class="amb-stat-label">Vigentes / Activos</span>
                                    <span class="amb-stat-num">${activeReferrals}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Método de Pago -->
                <section class="amb-payment-section">
                    ${hasPaymentMethod ? `
                    <div class="amb-payment-card">
                        <div class="amb-payment-info">
                            <img src="${CONFIG.CLOUDINARY_URL}/v1772036420/mastercard_icon.png"
                                 alt="CLABE" class="amb-payment-icon"
                                 onerror="this.style.display='none'">
                            <div class="amb-payment-details">
                                <span class="amb-payment-label">${bankName}</span>
                                <span class="amb-payment-card-info">CLABE •••• ${clabeLast4}</span>
                            </div>
                        </div>
                        <div class="amb-payment-actions">
                            <span class="amb-payment-status">Predeterminado</span>
                            <button class="amb-payment-link" onclick="window.removePaymentMethod()">Eliminar CLABE</button>
                        </div>
                        <div class="amb-payment-divider"></div>
                        <button class="amb-payment-add" onclick="window.addPaymentMethod()">
                            <span class="amb-payment-add-icon">+</span>
                            Actualizar CLABE
                        </button>
                        <button class="amb-payment-history" onclick="window.viewPaymentHistory()">Ver historial de pagos</button>
                    </div>
                    ` : `
                    <div class="amb-payment-empty">
                        <div class="amb-payment-empty-icon">
                            <img src="${CONFIG.CLOUDINARY_URL}/v1772049171/tarjeta_zgbc9t.webp" alt="Tarjeta">
                        </div>
                        <div class="amb-payment-empty-content">
                            <strong>Agrega tu CLABE bancaria</strong>
                            <p>Para recibir tus comisiones, agrega tus datos bancarios en tu perfil.</p>
                        </div>
                        <button class="amb-btn-primary" onclick="window.addPaymentMethod()">
                            Agregar CLABE
                        </button>
                    </div>
                    `}
                </section>

                <!-- Estado de Referidos -->
                <section class="amb-referrals-section" id="embajador-referidos">
                    <div class="amb-referrals-header">
                        <h2 class="amb-referrals-title">estado de tus referidos</h2>
                        <p class="amb-referrals-subtitle">Personas que usaron tu código</p>
                        
                        <div class="amb-referrals-filters">
                            <div class="amb-search-box">
                                <img src="${CONFIG.CLOUDINARY_URL}/v1772043289/search_1_iucddd.svg" 
                                     alt="Buscar" class="amb-search-icon">
                                <input type="text" class="amb-search-input" placeholder="Buscar...">
                            </div>
                            <div class="amb-filter-container">
                                <span class="amb-filter-label">Filtrar por:</span>
                                <select class="amb-filter-dropdown">
                                    <option>Recientes ↓</option>
                                    <option>Más antiguos</option>
                                    <option>Por monto</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="amb-referrals-list">
                        ${referrals.length > 0 ? referrals.map(ref => {
                            const status = ref.status || ref.commission_status || 'approved';
                            const statusText = status === 'approved' || status === 'paid' ? 'aprobada' : 
                                              status === 'process' || status === 'pending' ? 'proceso' : 'rechazada';
                            const statusIcon = status === 'approved' || status === 'paid'
                                ? `${CONFIG.CLOUDINARY_URL}/v1772044135/palomita_3_brc5do.svg`
                                : `${CONFIG.CLOUDINARY_URL}/v1772044134/time_1_xbstfg.svg`;
                            return `
                            <div class="amb-referral-item">
                                <div class="amb-referral-left">
                                    <span class="amb-referral-name">${ref.name || ref.referred_user_name || 'Usuario'}</span>
                                    <span class="amb-referral-email">${ref.email || ref.referred_user_email || ''}</span>
                                    <span class="amb-referral-date">
                                        <img src="${CONFIG.CLOUDINARY_URL}/v1772043745/calendario_1_n3pzcf.svg" alt="" class="amb-referral-date-icon">
                                        ${ref.date || formatDate(ref.created_at)}
                                    </span>
                                </div>
                                <div class="amb-referral-center">
                                    <span class="amb-referral-commission-label">Comisión</span>
                                    <span class="amb-referral-commission-value">$${ref.commission || ref.commission_amount || 0}</span>
                                </div>
                                <div class="amb-referral-status-wrapper">
                                    <img src="${statusIcon}" alt="" class="amb-status-icon">
                                    <span class="amb-referral-status-badge ${status === 'paid' ? 'approved' : status === 'pending' ? 'process' : status}">${statusText}</span>
                                </div>
                            </div>
                            `;
                        }).join('') : `
                            <div class="amb-empty-state" style="padding: 40px 20px; text-align: center; color: #718096;">
                                <img src="${CONFIG.CLOUDINARY_URL}/v1772043745/calendario_1_n3pzcf.svg" alt="" style="width: 48px; opacity: 0.3; margin-bottom: 15px;">
                                <p style="margin: 0;">Aún no tienes referidos registrados con tu código.</p>
                                <p style="font-size: 0.9rem; margin-top: 5px;">¡Comparte tu código para empezar a ganar!</p>
                            </div>
                        `}
                    </div>
                </section>

                <!-- Material Digital -->
                <section class="amb-material-section" id="embajador-material">
                    <div class="amb-material-card">
                        <div class="amb-material-header">
                            <h2 class="amb-card-title">material digital para compartir</h2>
                            <p class="amb-card-subtitle">
                                Descarga imágenes, PDFs y videos listos para usar en tus redes y ayudar a que más peludos reciban el apoyo que merecen.
                            </p>
                        </div>

                        ${materials.length > 0 ? `
                        <div class="amb-material-filters">
                            <button class="amb-material-filter-btn active" data-filter="all" onclick="window.filterAmbassadorMaterials('all')">Todos</button>
                            ${materials.some(m => m.file_type === 'newsletter') ? `<button class="amb-material-filter-btn" data-filter="newsletter" onclick="window.filterAmbassadorMaterials('newsletter')">📰 Newsletter</button>` : ''}
                            ${materials.some(m => m.file_type === 'image') ? `<button class="amb-material-filter-btn" data-filter="image" onclick="window.filterAmbassadorMaterials('image')">Imágenes</button>` : ''}
                            ${materials.some(m => m.file_type === 'pdf') ? `<button class="amb-material-filter-btn" data-filter="pdf" onclick="window.filterAmbassadorMaterials('pdf')">PDFs</button>` : ''}
                            ${materials.some(m => m.file_type === 'video') ? `<button class="amb-material-filter-btn" data-filter="video" onclick="window.filterAmbassadorMaterials('video')">Videos</button>` : ''}
                            ${materials.some(m => m.file_type === 'other') ? `<button class="amb-material-filter-btn" data-filter="other" onclick="window.filterAmbassadorMaterials('other')">Otros</button>` : ''}
                        </div>

                        <div class="amb-material-grid">
                            ${materials.map(mat => {
                                if (mat.file_type === 'newsletter') {
                                    const dateLabel = mat.news_date ? formatDate(mat.news_date) : '';
                                    return `
                                    <div class="amb-material-item amb-newsletter-item" data-type="newsletter">
                                        ${dateLabel ? `<span class="amb-newsletter-date-badge">📰 ${dateLabel}</span>` : ''}
                                        <img src="${mat.file_url}" alt="${mat.title}" class="amb-newsletter-image">
                                        <div class="amb-newsletter-content">
                                            <h3 class="amb-newsletter-title">${mat.title}</h3>
                                            ${mat.description ? `<p class="amb-newsletter-desc">${mat.description}</p>` : ''}
                                            <div class="amb-newsletter-actions">
                                                <a href="${mat.file_url}" download="${mat.file_name}" target="_blank" rel="noopener noreferrer" class="amb-newsletter-download">Descargar ⬇️</a>
                                            </div>
                                        </div>
                                    </div>
                                    `;
                                }
                                const icon = mat.file_type === 'image' ? '🖼️' : mat.file_type === 'pdf' ? '📄' : mat.file_type === 'video' ? '🎬' : '📎';
                                const thumb = mat.file_type === 'image'
                                    ? `<img src="${mat.file_url}" alt="${mat.title}" class="amb-material-thumb">`
                                    : `<div class="amb-material-icon">${icon}</div>`;
                                return `
                                <div class="amb-material-item" data-type="${mat.file_type}">
                                    ${thumb}
                                    <div class="amb-material-info">
                                        <span class="amb-material-item-title">${mat.title}</span>
                                        ${mat.description ? `<span class="amb-material-item-desc">${mat.description}</span>` : ''}
                                    </div>
                                    <a href="${mat.file_url}" download="${mat.file_name}" target="_blank" rel="noopener noreferrer" class="amb-btn-pink amb-material-download">
                                        Descargar ⬇️
                                    </a>
                                </div>
                                `;
                            }).join('')}
                        </div>
                        ` : `
                        <div class="amb-material-empty">
                            <p>Pronto habrá material digital disponible para descargar.</p>
                        </div>
                        `}
                    </div>
                </section>

                <!-- Cómo funciona -->
                <section class="amb-how-section">
                    <div class="amb-how-card">
                        <div class="amb-how-content">
                            <h2 class="amb-how-title">¿cómo funciona ser embajador?</h2>
                            <div class="amb-how-list">
                                <div class="amb-how-item">
                                    <span class="amb-how-check">✓</span>
                                    <span>Recibe un porcentaje real de cada membresía adquirida con tu código.</span>
                                </div>
                                <div class="amb-how-item">
                                    <span class="amb-how-check">✓</span>
                                    <span>La comisión se libera cuando el referido es aprobado y completa su pago.</span>
                                </div>
                                <div class="amb-how-item">
                                    <span class="amb-how-check">✓</span>
                                    <span>Consulta tus movimientos en cualquier momento desde tu panel.</span>
                                </div>
                            </div>
                        </div>
                        <img src="${CONFIG.CLOUDINARY_URL}/v1772036454/como_funciona_ser_embajador_img_xdvqwn.webp" 
                             alt="Perro embajador" class="amb-how-image">
                    </div>
                </section>
            </div>
        `;
    }

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================

    window.copyReferralCode = function (code) {
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.querySelector('.amb-btn-orange');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓ Copiado';
                btn.style.background = '#22C55E';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '#FF8C42';
                }, 2000);
            }
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('Tu código es: ' + code);
        });
    };

    window.copyReferralLink = function (code) {
        const link = `https://www.clubpataamiga.com/registro?ref=${code}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('¡Link copiado!\n' + link);
        }).catch(err => {
            alert('Tu link es: ' + link);
        });
    };

    window.shareOnWhatsApp = function (code) {
        const message = `¡Únete a Club Pata Amiga y protege a tus peludos! 🐾\n\nUsa mi código de referido: ${code}\n\nRegístrate aquí: https://www.clubpataamiga.com/registro?ref=${code}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    window.shareOnFacebook = function (code) {
        const url = `https://www.clubpataamiga.com/registro?ref=${code}`;
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent('¡Únete a Club Pata Amiga con mi código: ' + code)}`;
        window.open(fbUrl, '_blank');
    };

    window.shareCode = function (code) {
        const shareData = {
            title: 'Club Pata Amiga',
            text: `¡Únete a Club Pata Amiga y protege a tus peludos! 🐾\n\nUsa mi código de referido: ${code}`,
            url: `https://www.clubpataamiga.com/registro?ref=${code}`
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => {
                console.log('Error compartiendo:', err);
                window.shareOnWhatsApp(code);
            });
        } else {
            const options = [
                { name: 'WhatsApp', action: () => window.shareOnWhatsApp(code) },
                { name: 'Facebook', action: () => window.shareOnFacebook(code) },
                { name: 'Copiar link', action: () => window.copyReferralLink(code) }
            ];

            const choice = prompt('¿Cómo quieres compartir?\n1. WhatsApp\n2. Facebook\n3. Copiar link\n\nEscribe el número:');
            if (choice === '1') window.shareOnWhatsApp(code);
            else if (choice === '2') window.shareOnFacebook(code);
            else if (choice === '3') window.copyReferralLink(code);
        }
    };

    window.generateCodeLink = async function (ambassadorId) {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '⏳ Generando link...';
        btn.disabled = true;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassadorId}/generate-code-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success && data.data?.selection_url) {
                window.location.href = data.data.selection_url;
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo generar el link'));
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Error generando link:', error);
            alert('❌ Hubo un error. Por favor intenta más tarde.');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    };

    window.requestCodeChange = async function (ambassadorId) {
        if (!confirm('¿Deseas cambiar tu código de embajador?\n\n⚠️ Esto solo se puede hacer UNA VEZ.\nTu código actual dejará de funcionar.')) {
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassadorId}/request-code-change`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Hemos enviado un email con el link para cambiar tu código. Revisa tu bandeja de entrada.');
            } else {
                alert('❌ ' + (data.error || 'No se pudo procesar la solicitud'));
            }
        } catch (error) {
            console.error('Error solicitando cambio:', error);
            alert('❌ Hubo un error. Por favor intenta más tarde.');
        }
    };

    window.requestNewCodeEmail = async function (ambassadorId) {
        if (!confirm('¿Deseas que te reenviemos el email para elegir tu código de embajador?')) {
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassadorId}/resend-code-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Email enviado. Revisa tu bandeja de entrada (y spam).');
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo enviar el email'));
            }
        } catch (error) {
            console.error('Error enviando email:', error);
            alert('❌ Hubo un error. Por favor intenta más tarde.');
        }
    };

    window.cancelAmbassadorRequest = async function (ambassadorId) {
        if (!confirm('¿Deseas cancelar tu solicitud de embajador?\n\nEsta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassadorId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Tu solicitud ha sido cancelada.');
                location.reload();
            } else {
                alert('❌ ' + (data.error || 'No se pudo cancelar la solicitud'));
            }
        } catch (error) {
            console.error('Error cancelando:', error);
            alert('❌ Hubo un error. Por favor intenta más tarde.');
        }
    };

    // ============================================
    // MODALES DE PAGO
    // ============================================
    
    window.addPaymentMethod = function () {
        openPaymentModal();
    };

    window.viewPaymentHistory = function () {
        openHistoryModal();
    };

    function openPaymentModal() {
        const modal = document.createElement('div');
        const savedBankName = currentAmbassador?.bank_name || '';
        const savedClabe = currentAmbassador?.clabe || '';
        modal.id = 'amb-payment-modal';
        modal.innerHTML = `
            <div class="amb-modal-overlay" onclick="closePaymentModal(event)">
                <div class="amb-modal-content" onclick="event.stopPropagation()">
                    <button class="amb-modal-close" onclick="closePaymentModal()">&times;</button>
                    <h3 class="amb-modal-title">Agregar CLABE bancaria</h3>
                    <form id="amb-payment-form" onsubmit="submitPaymentMethod(event)">
                        <div class="amb-form-group">
                            <label>Banco</label>
                            <input type="text" name="bank_name" list="amb-bank-options" placeholder="Ej: BBVA, Santander..." value="${savedBankName}" autocomplete="organization" required>
                            <datalist id="amb-bank-options">
                                ${COMMON_BANK_OPTIONS.map(bankName => `<option value="${bankName}"></option>`).join('')}
                            </datalist>
                        </div>
                        <div class="amb-form-group">
                            <label>CLABE</label>
                            <input type="text" name="clabe" placeholder="18 digitos" inputmode="numeric" pattern="\\d{18}" minlength="18" maxlength="18" title="Ingresa una CLABE valida de 18 digitos" value="${sanitizeClabeInput(savedClabe)}" required>
                        </div>
                        <div class="amb-form-group">
                            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #555;">
                                Los primeros 3 digitos nos ayudan a sugerir el banco. Puedes corregirlo si hace falta.
                            </p>
                        </div>
                        <button type="submit" class="amb-btn-primary" style="width: 100%; margin-top: 20px;">
                            Guardar CLABE
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const form = modal.querySelector('#amb-payment-form');
        const clabeInput = form?.querySelector('input[name="clabe"]');
        const bankInput = form?.querySelector('input[name="bank_name"]');

        if (clabeInput && bankInput) {
            bankInput.dataset.autoValue = getBankNameFromClabe(clabeInput.value) || '';
            syncBankInputWithClabe(clabeInput, bankInput);
            clabeInput.addEventListener('input', function () {
                syncBankInputWithClabe(clabeInput, bankInput);
            });
            clabeInput.addEventListener('blur', function () {
                syncBankInputWithClabe(clabeInput, bankInput);
                clabeInput.reportValidity();
            });
            bankInput.addEventListener('input', function () {
                if (bankInput.value.trim() !== (bankInput.dataset.autoValue || '')) {
                    bankInput.dataset.autoValue = '';
                }
                bankInput.setCustomValidity('');
            });
        }
    }

    window.closePaymentModal = function(event) {
        if (!event || event.target === event.currentTarget) {
            const modal = document.getElementById('amb-payment-modal');
            if (modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        }
    };

    window.submitPaymentMethod = async function(event) {
        event.preventDefault();
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        if (!currentAmbassador?.id) {
            alert('❌ No se pudo identificar al embajador actual.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar CLABE';
            return;
        }

        const clabeInput = form.clabe;
        const bankInput = form.bank_name;
        const clabe = sanitizeClabeInput(clabeInput.value);
        const clabeMessage = getClabeValidationMessage(clabe);

        clabeInput.value = clabe;
        clabeInput.setCustomValidity(clabeMessage);

        if (clabeMessage) {
            clabeInput.reportValidity();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar CLABE';
            return;
        }

        if (!bankInput.value.trim()) {
            bankInput.setCustomValidity('Ingresa o confirma el banco de tu CLABE.');
            bankInput.reportValidity();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar CLABE';
            return;
        }
        bankInput.setCustomValidity('');

        const formData = {
            payment_method: 'clabe',
            bank_name: bankInput.value.trim(),
            clabe
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${currentAmbassador.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ CLABE guardada correctamente');
                closePaymentModal();
                location.reload();
            } else {
                alert('❌ ' + (data.error || 'No se pudo guardar la CLABE'));
            }
        } catch (error) {
            console.error('Error guardando CLABE:', error);
            alert('❌ Hubo un error. Por favor intenta más tarde.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar CLABE';
        }
    };

    window.removePaymentMethod = async function () {
        if (!currentAmbassador?.id) {
            alert('❌ No se pudo identificar al embajador actual.');
            return;
        }

        if (!confirm('¿Deseas eliminar esta CLABE?')) {
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${currentAmbassador.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_method: 'pending',
                    bank_name: '',
                    clabe: ''
                })
            });
            
            if (response.ok) {
                alert('✅ CLABE eliminada correctamente');
                location.reload();
            } else {
                const data = await response.json();
                alert('❌ ' + (data.error || 'No se pudo eliminar la CLABE'));
            }
        } catch (error) {
            console.error('Error eliminando CLABE:', error);
            alert('❌ Hubo un error al eliminar. Por favor intenta más tarde.');
        }
    };

    // ============================================
    // MODAL DE PERFIL (RFC, redes, motivación, foto)
    // ============================================

    window.editAmbassadorProfile = function () {
        openProfileModal();
    };

    function openProfileModal() {
        const amb = currentAmbassador || {};
        const modal = document.createElement('div');
        modal.id = 'amb-profile-modal';
        modal.innerHTML = `
            <div class="amb-modal-overlay" onclick="closeProfileModal(event)">
                <div class="amb-modal-content" onclick="event.stopPropagation()">
                    <button class="amb-modal-close" onclick="closeProfileModal()">&times;</button>
                    <h3 class="amb-modal-title">Editar mi perfil</h3>
                    <form id="amb-profile-form" onsubmit="submitProfileForm(event)">
                        <div class="amb-profile-photo-row">
                            <img id="amb-profile-photo-preview" src="${amb.profile_photo_url || DEFAULT_AVATAR_PLACEHOLDER}" alt="Foto de perfil" class="amb-profile-photo-preview">
                            <div>
                                <input type="file" id="amb-profile-photo-input" accept="image/*" style="display:none;">
                                <button type="button" class="amb-profile-photo-upload-btn" onclick="document.getElementById('amb-profile-photo-input').click()">
                                    Cambiar foto
                                </button>
                                <input type="hidden" name="profile_photo_url" id="amb-profile-photo-url" value="${amb.profile_photo_url || ''}">
                            </div>
                        </div>
                        <div class="amb-form-group">
                            <label>RFC</label>
                            <input type="text" name="rfc" maxlength="13" placeholder="Ej. ABCD123456EFG" style="text-transform: uppercase;" value="${amb.rfc || ''}">
                        </div>
                        <div class="amb-form-group">
                            <label>Facebook</label>
                            <input type="text" name="facebook" placeholder="https://facebook.com/..." value="${amb.facebook || ''}">
                        </div>
                        <div class="amb-form-group">
                            <label>Instagram</label>
                            <input type="text" name="instagram" placeholder="https://instagram.com/..." value="${amb.instagram || ''}">
                        </div>
                        <div class="amb-form-group">
                            <label>TikTok</label>
                            <input type="text" name="tiktok" placeholder="https://tiktok.com/@..." value="${amb.tiktok || ''}">
                        </div>
                        <div class="amb-form-group">
                            <label>¿Por qué quieres ser embajador?</label>
                            <textarea name="motivation" placeholder="Cuéntanos tu historia...">${amb.motivation || ''}</textarea>
                        </div>
                        <button type="submit" class="amb-btn-primary" style="width: 100%; margin-top: 10px;">
                            Guardar cambios
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const photoInput = modal.querySelector('#amb-profile-photo-input');
        photoInput?.addEventListener('change', handleProfilePhotoSelect);
    }

    window.closeProfileModal = function (event) {
        if (!event || event.target === event.currentTarget) {
            const modal = document.getElementById('amb-profile-modal');
            if (modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        }
    };

    async function handleProfilePhotoSelect(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !currentAmbassador?.id) return;

        if (!file.type.startsWith('image/')) {
            alert('❌ Solo se aceptan imágenes');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ La imagen no puede superar 5MB');
            return;
        }

        const uploadBtn = document.querySelector('.amb-profile-photo-upload-btn');
        if (uploadBtn) uploadBtn.textContent = 'Subiendo...';

        const fd = new FormData();
        fd.append('file', file);
        fd.append('ambassadorId', currentAmbassador.id);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload/ambassador-photo`, {
                method: 'POST',
                body: fd
            });
            const data = await response.json();

            if (data.success) {
                const preview = document.getElementById('amb-profile-photo-preview');
                const urlInput = document.getElementById('amb-profile-photo-url');
                if (preview) preview.src = data.url;
                if (urlInput) urlInput.value = data.url;
            } else {
                alert('❌ Error al subir foto: ' + (data.error || 'intenta de nuevo'));
            }
        } catch (error) {
            console.error('Error subiendo foto de perfil:', error);
            alert('❌ Error de conexión al subir la foto');
        } finally {
            if (uploadBtn) uploadBtn.textContent = 'Cambiar foto';
        }
    }

    window.submitProfileForm = async function (event) {
        event.preventDefault();
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        if (!currentAmbassador?.id) {
            alert('❌ No se pudo identificar al embajador actual.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar cambios';
            return;
        }

        const formData = {
            rfc: form.rfc.value.trim().toUpperCase() || undefined,
            facebook: form.facebook.value.trim() || undefined,
            instagram: form.instagram.value.trim() || undefined,
            tiktok: form.tiktok.value.trim() || undefined,
            motivation: form.motivation.value.trim() || undefined,
            profile_photo_url: form.profile_photo_url.value || undefined
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${currentAmbassador.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ ¡Datos actualizados! Muchas gracias.\nTu información de perfil ha sido guardada.');
                closeProfileModal();
                location.reload();
            } else {
                alert('❌ ' + (data.error || 'No se pudo guardar el perfil'));
            }
        } catch (error) {
            console.error('Error guardando perfil:', error);
            alert('❌ Hubo un error. Por favor intenta más tarde.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar cambios';
        }
    };

    function openHistoryModal() {
        // Cargar historial desde el backend
        loadPaymentHistory().then(history => {
            const modal = document.createElement('div');
            modal.id = 'amb-history-modal';
            modal.innerHTML = `
                <div class="amb-modal-overlay" onclick="closeHistoryModal(event)">
                    <div class="amb-modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                        <button class="amb-modal-close" onclick="closeHistoryModal()">&times;</button>
                        <h3 class="amb-modal-title">Historial de pagos</h3>
                        <div class="amb-history-list">
                            ${history.length > 0 ? history.map(item => `
                                <div class="amb-history-item">
                                    <div class="amb-history-info">
                                        <span class="amb-history-date">${formatDate(item.date)}</span>
                                        <span class="amb-history-concept">${item.concept}</span>
                                    </div>
                                    <span class="amb-history-amount ${item.type}">${formatCurrency(item.amount)}</span>
                                </div>
                            `).join('') : '<p style="text-align: center; color: #888; padding: 40px;">No hay movimientos registrados</p>'}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        });
    }

    window.closeHistoryModal = function(event) {
        if (!event || event.target === event.currentTarget) {
            const modal = document.getElementById('amb-history-modal');
            if (modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        }
    };

    async function loadPaymentHistory() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/payment-history`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Error cargando historial:', error);
            return [];
        }
    }

    // ============================================
    // CHAT CON ADMINISTRACIÓN (solo embajadores aprobados)
    // ============================================

    function formatChatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function renderChatMessagesHtml(messages) {
        if (!messages || messages.length === 0) {
            return '<p class="amb-chat-empty">Aún no hay mensajes. Escribe tu pregunta y el equipo te responderá pronto.</p>';
        }
        return messages.map(msg => `
            <div class="amb-chat-msg ${msg.sender_role === 'ambassador' ? 'amb-chat-msg-self' : 'amb-chat-msg-admin'}">
                <p class="amb-chat-msg-text">${escapeHtml(msg.message)}</p>
                <span class="amb-chat-msg-time">${formatChatTime(msg.created_at)}</span>
            </div>
        `).join('');
    }

    function scrollChatToBottom() {
        const list = document.getElementById('amb-chat-messages');
        if (list) list.scrollTop = list.scrollHeight;
    }

    function updateChatBadge(count) {
        const badge = document.getElementById('amb-chat-badge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    async function loadAmbassadorChatMessages() {
        if (!currentAmbassador) return;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${currentAmbassador.id}/messages?markReadFor=ambassador`);
            const data = await response.json();
            chatMessagesCache = Array.isArray(data) ? data : [];
            const list = document.getElementById('amb-chat-messages');
            if (list) {
                list.innerHTML = renderChatMessagesHtml(chatMessagesCache);
                scrollChatToBottom();
            }
            updateChatBadge(0);
        } catch (error) {
            console.error('Error cargando mensajes del chat:', error);
        }
    }

    window.sendAmbassadorChatMessage = async function () {
        const input = document.getElementById('amb-chat-input');
        if (!input || !currentAmbassador) return;
        const message = input.value.trim();
        if (!message) return;

        input.disabled = true;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${currentAmbassador.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderRole: 'ambassador', message })
            });

            if (response.ok) {
                const newMessage = await response.json();
                if (!chatMessagesCache.some(m => m.id === newMessage.id)) {
                    chatMessagesCache.push(newMessage);
                }
                const list = document.getElementById('amb-chat-messages');
                if (list) {
                    list.innerHTML = renderChatMessagesHtml(chatMessagesCache);
                    scrollChatToBottom();
                }
                input.value = '';
            } else {
                const err = await response.json();
                alert('Error: ' + (err.error || 'No se pudo enviar el mensaje'));
            }
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            alert('Hubo un error al enviar tu mensaje. Intenta de nuevo.');
        } finally {
            input.disabled = false;
            input.focus();
        }
    };

    function openAmbassadorChatModal() {
        if (!currentAmbassador) return;
        chatModalOpen = true;

        const modal = document.createElement('div');
        modal.id = 'amb-chat-modal';
        modal.innerHTML = `
            <div class="amb-modal-overlay" onclick="closeAmbassadorChatModal(event)">
                <div class="amb-modal-content amb-chat-modal-content" onclick="event.stopPropagation()">
                    <button class="amb-modal-close" onclick="closeAmbassadorChatModal()">&times;</button>
                    <h3 class="amb-modal-title">💬 Chat con administración</h3>
                    <div class="amb-chat-messages" id="amb-chat-messages">
                        <p class="amb-chat-empty">Cargando mensajes...</p>
                    </div>
                    <div class="amb-chat-input-row">
                        <input
                            type="text"
                            id="amb-chat-input"
                            class="amb-chat-input"
                            placeholder="Escribe tu pregunta..."
                            onkeypress="if(event.key === 'Enter'){ sendAmbassadorChatMessage(); }"
                        />
                        <button class="amb-chat-send-btn" onclick="sendAmbassadorChatMessage()">Enviar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        loadAmbassadorChatMessages();
    }

    window.closeAmbassadorChatModal = function (event) {
        if (!event || event.target === event.currentTarget) {
            const modal = document.getElementById('amb-chat-modal');
            if (modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
            chatModalOpen = false;
        }
    };

    window.openAmbassadorChatModal = openAmbassadorChatModal;

    function renderChatBubble() {
        if (document.getElementById('amb-chat-bubble')) return;
        const bubble = document.createElement('button');
        bubble.id = 'amb-chat-bubble';
        bubble.className = 'amb-chat-bubble';
        bubble.setAttribute('onclick', 'openAmbassadorChatModal()');
        bubble.innerHTML = `💬<span id="amb-chat-badge" class="amb-chat-badge" style="display:none">0</span>`;
        document.body.appendChild(bubble);
    }

    async function fetchAmbassadorUnreadChatCount(ambassadorId) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassadorId}/messages?unreadOnly=true&for=ambassador`);
            const data = await response.json();
            return data.count || 0;
        } catch (error) {
            console.error('Error consultando mensajes no leídos:', error);
            return 0;
        }
    }

    function waitForSupabaseSdk(maxAttempts, intervalMs) {
        return new Promise((resolve) => {
            let attempts = 0;
            const check = () => {
                if (typeof supabase !== 'undefined' && supabase.createClient && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) {
                    resolve(true);
                    return;
                }
                attempts++;
                if (attempts >= maxAttempts) {
                    resolve(false);
                    return;
                }
                setTimeout(check, intervalMs);
            };
            check();
        });
    }

    function handleIncomingAdminChatMessage(ambassador, newMessage) {
        if (chatModalOpen) {
            if (!chatMessagesCache.some(m => m.id === newMessage.id)) {
                chatMessagesCache.push(newMessage);
            }
            const list = document.getElementById('amb-chat-messages');
            if (list) {
                list.innerHTML = renderChatMessagesHtml(chatMessagesCache);
                scrollChatToBottom();
            }
            fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassador.id}/messages?markReadFor=ambassador`).catch(() => {});
        } else {
            fetchAmbassadorUnreadChatCount(ambassador.id).then(count => updateChatBadge(count));
        }
    }

    function initAmbassadorChatRealtime(ambassador) {
        if (chatRealtimeInitialized || !ambassador || ambassador.status !== 'approved') return;
        chatRealtimeInitialized = true;

        renderChatBubble();

        fetchAmbassadorUnreadChatCount(ambassador.id).then(count => updateChatBadge(count));

        // El polling corre siempre como respaldo, incluso si Realtime logra conectar.
        // Así el chat sigue funcionando aunque el SDK de Supabase no cargue a tiempo
        // en la página de Webflow (orden de scripts) o la suscripción se caiga.
        startChatPolling(ambassador);

        waitForSupabaseSdk(10, 300).then((available) => {
            if (!available) {
                console.warn('[AmbassadorChat] SDK de Supabase no disponible tras esperar; usando solo polling.');
                return;
            }
            try {
                const supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
                supabaseClient
                    .channel(`ambassador-chat-${ambassador.id}`)
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'ambassador_messages',
                        filter: `ambassador_id=eq.${ambassador.id}`
                    }, (payload) => {
                        const newMessage = payload.new;
                        if (newMessage.sender_role !== 'admin') return;
                        handleIncomingAdminChatMessage(ambassador, newMessage);
                    })
                    .subscribe((status) => {
                        console.log('[AmbassadorChat] Estado de suscripción Realtime:', status);
                    });
            } catch (error) {
                console.error('[AmbassadorChat] No se pudo iniciar Realtime, se mantiene el polling:', error);
            }
        });
    }

    function startChatPolling(ambassador) {
        setInterval(() => {
            if (chatModalOpen) {
                loadAmbassadorChatMessages();
            } else {
                fetchAmbassadorUnreadChatCount(ambassador.id).then(count => updateChatBadge(count));
            }
        }, 8000);
    }

    window.requestWithdraw = async function (ambassadorId, amount) {
        if (!confirm(`¿Deseas solicitar un retiro de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)}?`)) {
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassadorId}/payouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Tu solicitud de retiro ha sido enviada con éxito.');
                location.reload();
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo procesar el retiro'));
            }
        } catch (error) {
            console.error('Error solicitando retiro:', error);
            alert('❌ Hubo un error al procesar tu solicitud.');
        }
    };

    // ============================================
    // FUNCIONES PRINCIPALES
    // ============================================

    async function checkAmbassadorStatus(email, memberstackId) {
        try {
            console.log(`[AmbassadorWidget] Checking status for: ${email || 'unknown'} (ID: ${memberstackId || 'none'})`);
            
            // Prefer memberstackId for the query
            const url = memberstackId 
                ? `${CONFIG.API_BASE_URL}/api/ambassadors/by-memberstack?memberstackId=${encodeURIComponent(memberstackId)}`
                : `${CONFIG.API_BASE_URL}/api/ambassadors?search=${encodeURIComponent(email)}&limit=1`;
            
            console.log(`[AmbassadorWidget] Fetching: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error(`[AmbassadorWidget] API Error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            console.log('[AmbassadorWidget] Received data:', data);

            if (data.success && data.data) {
                // Compatible with both array (old search) and object (by-memberstack)
                const ambassador = Array.isArray(data.data) ? data.data[0] : data.data;
                
                if (!ambassador) {
                    console.log('[AmbassadorWidget] No ambassador record found');
                    return null;
                }

                console.log(`[AmbassadorWidget] Found ambassador: ${ambassador.id} (Status: ${ambassador.status})`);
                
                // Add referrals list for compatibility if not present but expected
                if (ambassador.recent_referrals && !ambassador.referrals) {
                    ambassador.referrals = ambassador.recent_referrals;
                }

                return ambassador;
            }
            
            return null;
        } catch (error) {
            console.error('[AmbassadorWidget] Exception in checkAmbassadorStatus:', error);
            return null;
        }
    }

    // Materiales digitales para compartir (imágenes, PDFs, videos subidos por el admin)
    async function fetchAmbassadorMaterials() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassador-materials`);
            if (!response.ok) return [];
            const data = await response.json();
            return (data.success && Array.isArray(data.materials)) ? data.materials : [];
        } catch (error) {
            console.error('[AmbassadorWidget] Error fetching materials:', error);
            return [];
        }
    }

    window.filterAmbassadorMaterials = function (type) {
        document.querySelectorAll('.amb-material-item').forEach(function (item) {
            item.style.display = (type === 'all' || item.dataset.type === type) ? '' : 'none';
        });
        document.querySelectorAll('.amb-material-filter-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.filter === type);
        });
    };

    function showAmbassadorWelcomeModal(ambassador) {
        const overlay = document.createElement('div');
        overlay.className = 'amb-welcome-overlay';
        overlay.id = 'amb-welcome-modal-overlay';
        
        overlay.innerHTML = `
            <div class="amb-welcome-modal" onclick="event.stopPropagation()">
                <div class="amb-welcome-icon">🎉</div>
                <h2 class="amb-welcome-title">¡Felicidades! Tu cuenta de Embajador ha sido aprobada</h2>
                <div class="amb-welcome-text">
                    <p>¡Ya eres parte oficial de la manada de Pata Amiga! 🐾</p>
                    <p>A partir de este momento, tu código de referido está activo. Desde este panel podrás:</p>
                    <ul class="amb-welcome-list">
                        <li><strong>Compartir tu código único</strong> para invitar a más familias.</li>
                        <li><strong>Recibir una comisión del 10%</strong> por cada membresía aprobada que use tu referido.</li>
                        <li><strong>Dar seguimiento en tiempo real</strong> a tus referidos, comisiones acumuladas y pagos mensuales.</li>
                        <li><strong>Descargar materiales de difusión</strong> listos para compartir con tus amigos o en redes sociales.</li>
                    </ul>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: #777; text-align: center;">
                        ¡Gracias por sumar tu voz para que más peludos y sus familias estén protegidos!
                    </p>
                </div>
                <button id="btn-welcome-close" class="amb-welcome-btn">Comenzar ahora</button>
            </div>
        `;

        const closeModal = async () => {
            overlay.remove();
            ambassador.welcome_shown = true;
            
            try {
                await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassador.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ welcome_shown: true })
                });
            } catch (err) {
                console.error('[AmbassadorWidget] Error guardando welcome_shown:', err);
            }
        };

        overlay.querySelector('#btn-welcome-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        document.body.appendChild(overlay);
    }

    async function initWidget() {
        const container = document.getElementById('ambassador-widget');
        if (!container) {
            console.error('Ambassador widget container not found');
            return;
        }

        // Inject styles
        if (!document.getElementById('ambassador-widget-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'ambassador-widget-styles';
            styleTag.textContent = STYLES;
            document.head.appendChild(styleTag);
        }

        // Show loading
        container.innerHTML = `
            <div class="ambassador-widget-container">
                <div class="ambassador-widget-content">
                    ${renderLoading()}
                </div>
            </div>
        `;

        // Wait for Memberstack
        let email = null;
        let memberId = null;
        if (window.$memberstackDom) {
            try {
                const member = await window.$memberstackDom.getCurrentMember();
                email = member?.data?.auth?.email;
                memberId = member?.data?.id;
                console.log('👤 Memberstack user:', { email, memberId });
            } catch (e) {
                console.log('Memberstack not available');
            }
        }

        // Check ambassador status
        let ambassador = null;
        if (email || memberId) {
            ambassador = await checkAmbassadorStatus(email, memberId);
        }
        currentAmbassador = ambassador;

        // Cargar materiales digitales en paralelo (solo se usan si el embajador está aprobado)
        const materials = (ambassador && ambassador.status === 'approved')
            ? await fetchAmbassadorMaterials()
            : [];

        // Render based on status
        let content = '';
        if (!ambassador) {
            content = renderNotAmbassador(memberId);
        } else if (ambassador.status === 'pending') {
            content = renderPending(ambassador);
        } else if (ambassador.status === 'rejected') {
            content = renderRejected(ambassador, memberId);
        } else if (ambassador.status === 'approved') {
            content = renderApproved(ambassador, materials);
        } else if (ambassador.status === 'suspended') {
            content = `
                <div class="ambassador-rejected-card">
                    <div class="ambassador-rejected-icon">⏸️</div>
                    <h2 class="ambassador-rejected-title">Tu cuenta está suspendida</h2>
                    <p class="ambassador-rejected-message">
                        Si crees que esto es un error, por favor contacta a nuestro equipo de soporte.
                    </p>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="ambassador-widget-container">
                <div class="ambassador-widget-content">
                    ${content}
                </div>
            </div>
        `;

        // Mostrar modal de bienvenida si el embajador está aprobado y welcome_shown es falso
        if (ambassador && ambassador.status === 'approved' && !ambassador.welcome_shown) {
            setTimeout(function() {
                showAmbassadorWelcomeModal(ambassador);
            }, 300);
        }

        // Burbuja de chat con administración (solo embajadores aprobados)
        if (ambassador && ambassador.status === 'approved') {
            initAmbassadorChatRealtime(ambassador);
        }

        // Si se llegó con un ancla (#perfil, #referidos, #newsletter), hacer scroll a esa sección
        scrollToAmbassadorSection();
    }

    // Navega a una sección del dashboard según el hash de la URL.
    // Enlaces esperados: .../embajadores/dashboard#perfil | #referidos | #newsletter | #material
    function scrollToAmbassadorSection() {
        const hash = (window.location.hash || '').replace('#', '').toLowerCase();
        if (!hash) return;

        const sectionMap = {
            'perfil': 'embajador-perfil',
            'referidos': 'embajador-referidos',
            'material': 'embajador-material',
            'newsletter': 'embajador-material'
        };

        const targetId = sectionMap[hash];
        if (!targetId) return;

        setTimeout(function () {
            const el = document.getElementById(targetId);
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });

            if (hash === 'newsletter' && typeof window.filterAmbassadorMaterials === 'function') {
                setTimeout(function () {
                    window.filterAmbassadorMaterials('newsletter');
                }, 400);
            }
        }, 150);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        setTimeout(initWidget, 500);
    }

    // Export for manual initialization
    window.initAmbassadorWidget = initWidget;

})();
