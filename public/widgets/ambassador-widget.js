/**
 * 🎯 Widget Dashboard Embajador - Club Pata Amiga
 * Widget para embajadores con estados: pendiente, aprobado, rechazado
 * Para integrar en Webflow
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURACIÓN
    // ============================================
    const CONFIG = {
        API_BASE_URL: 'https://www.pataamiga.mx',
        IMAGES_BASE_URL: 'https://www.pataamiga.mx/embajadores-images',
        DEBUG: false
    };

    // ============================================
    // ESTILOS CSS
    // ============================================
    const STYLES = `
        /* Container Principal */
        .ambassador-widget-container {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
        }

        .ambassador-widget-bg {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('${CONFIG.IMAGES_BASE_URL}/bienvenida background.png');
            background-size: cover;
            background-position: center;
            z-index: 0;
        }

        .ambassador-widget-content {
            position: relative;
            z-index: 1;
            padding: 40px 20px;
            max-width: 1000px;
            margin: 0 auto;
        }

        /* ============================================
           ESTADO: PENDIENTE / EN REVISIÓN
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

        .ambassador-pending-title img {
            width: 50px;
            height: 50px;
        }

        .ambassador-pending-subtitle {
            font-size: 1rem;
            opacity: 0.95;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        /* Progress Bar */
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

        .ambassador-pending-message {
            margin-top: 25px;
            font-size: 1rem;
            font-weight: 500;
            opacity: 0.95;
        }

        /* Decorative Elements */
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

        /* ============================================
           TARJETAS DE BENEFICIOS
           ============================================ */
        .ambassador-breadcrumb {
            text-align: right;
            margin-bottom: 20px;
            font-size: 0.9rem;
            color: #666;
        }

        .ambassador-breadcrumb a {
            color: #00BBB4;
            text-decoration: underline;
        }

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

        /* ============================================
           ESTADO: RECHAZADO
           ============================================ */
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
           NOT AMBASSADOR STATE
           ============================================ */
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
           PAW BUTTON
           ============================================ */
        .ambassador-paw-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #FFC107;
            border: none;
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            transition: transform 0.2s;
            z-index: 100;
        }

        .ambassador-paw-btn:hover {
            transform: scale(1.1);
        }

        /* ============================================
           APPROVED DASHBOARD STYLES (Figma Design)
           ============================================ */
        .amb-dashboard {
            padding: 20px 0;
        }

        /* Header */
        .amb-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding: 0 10px;
        }

        .amb-header-content {
            display: flex;
            gap: 15px;
            align-items: flex-start;
        }

        .amb-header-icon {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }

        .amb-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: #333;
            margin: 0 0 8px 0;
        }

        .amb-subtitle {
            color: #666;
            font-size: 0.95rem;
            line-height: 1.5;
            margin: 0;
        }

        .amb-help-link {
            color: #15BEB2;
            text-decoration: underline;
            font-size: 0.9rem;
            white-space: nowrap;
        }

        /* Code Section */
        .amb-code-section {
            background: white;
            border: 3px solid #333;
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 30px;
        }

        .amb-section-title-alt {
            font-size: 1.3rem;
            font-weight: 700;
            color: #333;
            margin: 0 0 10px 0;
        }

        .amb-code-desc {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 20px;
        }

        .amb-code-box {
            background: white;
            border: 3px dashed #15BEB2;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }

        .amb-code-label {
            font-size: 0.85rem;
            color: #888;
            display: block;
            margin-bottom: 10px;
        }

        .amb-code-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: #333;
            letter-spacing: 3px;
            margin-bottom: 20px;
            font-family: 'Fraiche', sans-serif;
        }

        .amb-code-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .amb-btn-yellow {
            background: #FFD93D;
            color: #333;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .amb-btn-yellow:hover {
            background: #FFC700;
            transform: translateY(-2px);
        }

        .amb-btn-green {
            background: #4ADE80;
            color: #333;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .amb-btn-green:hover {
            background: #22C55E;
            transform: translateY(-2px);
        }

        .amb-how-it-works {
            background: #FFF9E6;
            border-radius: 12px;
            padding: 15px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }

        .amb-star {
            font-size: 1.2rem;
        }

        .amb-how-it-works strong {
            display: block;
            margin-bottom: 5px;
        }

        .amb-how-it-works p {
            margin: 0;
            font-size: 0.85rem;
            color: #666;
        }

        /* Two Columns Grid */
        .amb-two-columns {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 25px;
        }

        @media (max-width: 700px) {
            .amb-two-columns {
                grid-template-columns: 1fr;
            }
        }

        /* Earnings Card */
        .amb-earnings-card {
            background: white;
            border: 3px solid #333;
            border-radius: 20px;
            padding: 25px;
        }

        .amb-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .amb-card-icon {
            font-size: 1.8rem;
        }

        .amb-card-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #333;
            margin: 0;
        }

        .amb-card-subtitle {
            font-size: 0.85rem;
            color: #888;
            margin: 2px 0 0 0;
        }

        .amb-earnings-total {
            margin-bottom: 15px;
        }

        .amb-earnings-label {
            display: block;
            font-size: 0.85rem;
            color: #888;
            margin-bottom: 5px;
        }

        .amb-earnings-value {
            font-size: 3rem;
            font-weight: 800;
            color: #15BEB2;
            display: block;
        }

        .amb-earnings-pending {
            background: #F0FDF4;
            border-radius: 10px;
            padding: 15px;
        }

        .amb-earnings-pending-value {
            font-size: 2rem;
            font-weight: 700;
            color: #22C55E;
            display: block;
        }

        /* Stats Card */
        .amb-stats-card {
            background: white;
            border: 3px solid #333;
            border-radius: 20px;
            padding: 25px;
        }

        .amb-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .amb-stat {
            border-radius: 12px;
            padding: 20px 15px;
            text-align: center;
        }

        .amb-stat.cyan { background: #CFFAFE; }
        .amb-stat.blue { background: #DBEAFE; }
        .amb-stat.yellow { background: #FEF9C3; }
        .amb-stat.green { background: #DCFCE7; }

        .amb-stat-num {
            font-size: 2.5rem;
            font-weight: 800;
            color: #333;
            display: block;
        }

        .amb-stat-label {
            font-size: 0.8rem;
            color: #666;
            display: block;
            margin-top: 5px;
        }

        /* Bank Alert */
        .amb-bank-alert {
            background: white;
            border: 2px solid #333;
            border-radius: 15px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            gap: 15px;
            flex-wrap: wrap;
        }

        .amb-bank-alert-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .amb-bank-icon {
            font-size: 1.5rem;
        }

        .amb-bank-alert strong {
            display: block;
            margin-bottom: 3px;
        }

        .amb-bank-alert p {
            margin: 0;
            font-size: 0.85rem;
            color: #666;
        }

        .amb-btn-outline {
            background: white;
            border: 2px solid #15BEB2;
            color: #15BEB2;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .amb-btn-outline:hover {
            background: #15BEB2;
            color: white;
        }

        /* Referrals Section */
        .amb-referrals-section {
            background: #15BEB2;
            border-radius: 25px;
            padding: 30px;
            margin-bottom: 25px;
        }

        .amb-section-title-dark {
            font-size: 1.4rem;
            font-weight: 700;
            color: white;
            margin: 0 0 5px 0;
        }

        .amb-section-subtitle {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
            margin: 0 0 20px 0;
        }

        .amb-referrals-table {
            background: white;
            border-radius: 15px;
            overflow: hidden;
        }

        .amb-table-header {
            display: flex;
            gap: 10px;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }

        .amb-search-input {
            flex: 1;
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 10px;
            font-size: 0.9rem;
        }

        .amb-filter-select {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 10px;
            font-size: 0.9rem;
            background: white;
            cursor: pointer;
        }

        .amb-table-body {
            max-height: 300px;
            overflow-y: auto;
        }

        .amb-referral-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid #f0f0f0;
        }

        .amb-referral-row:last-child {
            border-bottom: none;
        }

        .amb-referral-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .amb-referral-info strong {
            font-size: 0.95rem;
            color: #333;
        }

        .amb-referral-email {
            font-size: 0.8rem;
            color: #888;
        }

        .amb-referral-date {
            font-size: 0.75rem;
            color: #aaa;
        }

        .amb-referral-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
        }

        .amb-referral-amount {
            font-weight: 600;
            color: #333;
        }

        .amb-referral-status {
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .amb-referral-status.paid {
            background: #DCFCE7;
            color: #16A34A;
        }

        .amb-referral-status.pending {
            background: #FEF3C7;
            color: #D97706;
        }

        .amb-empty-referrals {
            text-align: center;
            padding: 40px 20px;
            color: #888;
        }

        .amb-empty-icon {
            font-size: 3rem;
            display: block;
            margin-bottom: 10px;
        }

        .amb-empty-hint {
            font-size: 0.85rem;
            color: #aaa;
        }

        /* Material Section */
        .amb-material-section {
            background: linear-gradient(135deg, #FF0063, #FF3D7F);
            border-radius: 25px;
            padding: 30px;
            text-align: center;
            color: white;
            margin-bottom: 25px;
        }

        .amb-material-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0 0 15px 0;
        }

        .amb-material-desc {
            font-size: 0.95rem;
            line-height: 1.6;
            margin: 0 0 20px 0;
            opacity: 0.95;
        }

        .amb-material-cta {
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 0.9rem;
        }

        .amb-btn-green-solid {
            background: #22C55E;
            color: white;
            border: none;
            padding: 14px 30px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .amb-btn-green-solid:hover {
            background: #16A34A;
            transform: translateY(-2px);
        }

        /* How Section */
        .amb-how-section {
            background: white;
            border: 3px solid #333;
            border-radius: 20px;
            padding: 25px;
        }

        .amb-how-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #333;
            margin: 0 0 20px 0;
            text-align: center;
        }

        .amb-how-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .amb-how-item {
            background: #F8FAFC;
            padding: 15px;
            border-radius: 10px;
            font-size: 0.9rem;
            color: #333;
        }

        /* Responsive */
        @media (max-width: 600px) {
            .amb-header {
                flex-direction: column;
                gap: 15px;
            }
            
            .amb-title {
                font-size: 1.3rem;
            }
            
            .amb-code-value {
                font-size: 1.8rem;
            }
            
            .amb-earnings-value {
                font-size: 2rem;
            }
            
            .amb-stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .amb-stat-num {
                font-size: 1.8rem;
            }
            
            .amb-bank-alert {
                flex-direction: column;
                text-align: center;
            }
            
            .amb-bank-alert-content {
                flex-direction: column;
            }
        }

        .amb-btn-primary {
            background: #15BEB2;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
            margin-top: 15px;
        }

        .amb-btn-primary:hover:not(:disabled) {
            background: #00a09a;
            transform: translateY(-2px);
        }

        .amb-btn-primary:disabled {
            background: #ccc;
            cursor: not-allowed;
            opacity: 0.7;
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
                <!-- Decorative elements -->
                <img src="${CONFIG.IMAGES_BASE_URL}/bandera.png" alt="" class="ambassador-deco-flag">
                <img src="${CONFIG.IMAGES_BASE_URL}/altavoz.png" alt="" class="ambassador-deco-megaphone">

                <h2 class="ambassador-pending-title">
                    Tu solicitud está en revisión
                    <img src="${CONFIG.IMAGES_BASE_URL}/clock icon.png" alt="clock">
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
            </div>

            <div class="ambassador-breadcrumb">
                <a href="/perfil">Perfil</a> &gt; <a href="#">Embajadores</a>
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
        const registroUrl = memberId
            ? `${CONFIG.API_BASE_URL}/embajadores/registro?memberId=${memberId}`
            : `${CONFIG.API_BASE_URL}/embajadores/registro`;

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
                    Sabemos que esto puede ser decepcionante. Si crees que hubo un error o 
                    quieres intentarlo de nuevo con información actualizada, puedes volver a aplicar.
                </p>

                <button class="ambassador-btn-retry" onclick="window.location.href='${registroUrl}'">
                    Volver a aplicar
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

    // Estado: Aprobado - Dashboard completo (Diseño Figma)
    function renderApproved(ambassador) {
        const formatCurrency = (amount) => {
            return '$' + (amount || 0).toLocaleString('es-MX');
        };

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        };

        // Estadísticas del embajador
        const totalReferrals = ambassador.referrals_count || 0;
        const totalEarnings = ambassador.total_earnings || 0;
        const pendingPayout = ambassador.pending_payout || 0;
        const referralCode = ambassador.referral_code || 'PATA123';
        const monthlyReferrals = ambassador.monthly_referrals || 0;
        const paidReferrals = ambassador.paid_referrals || 0;
        const pendingReferrals = ambassador.pending_referrals || 0;
        const hasBankData = ambassador.payment_method && ambassador.payment_method !== 'pending';

        // Mock de referidos para la tabla (se reemplazará con datos reales)
        const referrals = ambassador.recent_referrals || [];

        return `
            <div class="amb-dashboard">
                <!-- Header -->
                <div class="amb-header">
                    <div class="amb-header-content">
                        <img src="${CONFIG.IMAGES_BASE_URL}/altavoz.png" alt="" class="amb-header-icon">
                        <div>
                            <h1 class="amb-title">Gana por compartir el amor por los peludos</h1>
                            <p class="amb-subtitle">Comparte tu código, invita a más familias y recibe un porcentaje real por cada membresía aprobada con tu referido.</p>
                        </div>
                    </div>
                    <a href="#help" class="amb-help-link">¿Qué es esto?</a>
                </div>

                <!-- Código de Referido -->
                <div class="amb-code-section">
                    <h2 class="amb-section-title-alt">Tu código de referido</h2>
                    <p class="amb-code-desc">Comparte tu código con tus amigos. Si se unirán al ejército+que y pagan una membresía real por cada membresía que invitas.<br>Es muy fácil, tú ganas una comisión.</p>
                    
                    <div class="amb-code-box">
                        <span class="amb-code-label">Código único:</span>
                        <div class="amb-code-value">${referralCode}</div>
                        <div class="amb-code-buttons">
                            <button class="amb-btn-yellow" onclick="copyReferralCode('${referralCode}')">
                                Copiar código
                            </button>
                            <button class="amb-btn-green" onclick="shareCode('${referralCode}')">
                                Compartir ➜
                            </button>
                        </div>
                    </div>
                    
                    <div class="amb-how-it-works">
                        <span class="amb-star">⭐</span>
                        <strong>¿Cómo funciona?</strong>
                        <p>Comparte tu código con tus amigos. Si se unirán al ejército+que y pagan una membresía, tú ganas una comisión.</p>
                    </div>
                </div>

                <!-- Grid: Ganancias y Estadísticas -->
                <div class="amb-two-columns">
                    <!-- Tus Ganancias -->
                    <div class="amb-earnings-card">
                        <div class="amb-card-header">
                            <span class="amb-card-icon">💰</span>
                            <div>
                                <h3 class="amb-card-title">Tus ganancias</h3>
                                <p class="amb-card-subtitle">Historial de comisiones</p>
                            </div>
                        </div>
                        <div class="amb-earnings-total">
                            <span class="amb-earnings-label">Total acumulado:</span>
                            <span class="amb-earnings-value">${formatCurrency(totalEarnings)}</span>
                        </div>
                        <div class="amb-earnings-pending">
                            <span class="amb-earnings-label">Disponible:</span>
                            <span class="amb-earnings-pending-value">${formatCurrency(pendingPayout)}</span>
                            
                            <button class="amb-btn-primary" 
                                    onclick="requestWithdraw('${ambassador.id}', ${pendingPayout})"
                                    ${pendingPayout <= 0 ? 'disabled' : ''}>
                                Solicitar retiro
                            </button>
                        </div>
                    </div>

                    <!-- Estadísticas -->
                    <div class="amb-stats-card">
                        <div class="amb-card-header">
                            <span class="amb-card-icon">📊</span>
                            <div>
                                <h3 class="amb-card-title">Estadísticas</h3>
                                <p class="amb-card-subtitle">Resumen de tus referidos</p>
                            </div>
                        </div>
                        <div class="amb-stats-grid">
                            <div class="amb-stat cyan">
                                <span class="amb-stat-num">${totalReferrals}</span>
                                <span class="amb-stat-label">Total</span>
                            </div>
                            <div class="amb-stat blue">
                                <span class="amb-stat-num">${monthlyReferrals}</span>
                                <span class="amb-stat-label">Este mes</span>
                            </div>
                            <div class="amb-stat yellow">
                                <span class="amb-stat-num">${pendingReferrals}</span>
                                <span class="amb-stat-label">Pendientes</span>
                            </div>
                            <div class="amb-stat green">
                                <span class="amb-stat-num">${paidReferrals}</span>
                                <span class="amb-stat-label">Pagados</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alerta Datos Bancarios -->
                ${!hasBankData ? `
                <div class="amb-bank-alert">
                    <div class="amb-bank-alert-content">
                        <span class="amb-bank-icon">🏦</span>
                        <div>
                            <strong>Agrega tus datos bancarios</strong>
                            <p>Para poder recibir tus pagos, por favor agrega tus datos bancarios en tu perfil. 💳</p>
                        </div>
                    </div>
                    <button class="amb-btn-outline" onclick="window.location.href='/perfil#bancarios'">
                        Agregar datos bancarios
                    </button>
                </div>
                ` : ''}

                <!-- Estado de tus referidos -->
                <div class="amb-referrals-section">
                    <h2 class="amb-section-title-dark">Estado de tus referidos</h2>
                    <p class="amb-section-subtitle">Personas que usaron tu código</p>
                    
                    <div class="amb-referrals-table">
                        <div class="amb-table-header">
                            <input type="text" placeholder="🔍 Buscar..." class="amb-search-input">
                            <select class="amb-filter-select">
                                <option>Todos 📋</option>
                                <option>Pagados</option>
                                <option>Pendientes</option>
                            </select>
                        </div>
                        
                        <div class="amb-table-body">
                            ${referrals.length > 0 ? referrals.map(ref => `
                                <div class="amb-referral-row">
                                    <div class="amb-referral-info">
                                        <strong>${ref.referred_user_name || 'Usuario'}</strong>
                                        <span class="amb-referral-email">${ref.referred_user_email || ''}</span>
                                        <span class="amb-referral-date">📅 ${formatDate(ref.created_at)}</span>
                                    </div>
                                    <div class="amb-referral-right">
                                        <span class="amb-referral-amount">${formatCurrency(ref.commission_amount)}</span>
                                        <span class="amb-referral-status ${ref.commission_status === 'paid' ? 'paid' : 'pending'}">
                                            ${ref.commission_status === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="amb-empty-referrals">
                                    <span class="amb-empty-icon">🐾</span>
                                    <p>Aún no tienes referidos</p>
                                    <p class="amb-empty-hint">¡Comparte tu código para empezar a ganar!</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Material Digital -->
                <div class="amb-material-section">
                    <h2 class="amb-material-title">Material digital para compartir</h2>
                    <p class="amb-material-desc">
                        Hemos creado un kit lleno de material promocional, logos, plantillas, imágenes y recursos listos 
                        para descargar y compartir en tus redes. Todo diseñado para que invites de manera fácil y estética, 
                        y todos salgamos ganando con más amigos peludos en la manada.
                    </p>
                    <div class="amb-material-cta">
                        Comparte la info, difunde la manada y sigue ayudando hocikitos. ¡Te estaremos esperando!
                    </div>
                    <button class="amb-btn-green-solid" onclick="window.open('/materiales-embajador', '_blank')">
                        Descargar kit
                    </button>
                </div>

                <!-- Cómo funciona -->
                <div class="amb-how-section">
                    <h3 class="amb-how-title">¿Cómo funciona ser embajador?</h3>
                    <div class="amb-how-list">
                        <div class="amb-how-item">✅ Recibe un porcentaje real de cada membresía adquirida con tu código.</div>
                        <div class="amb-how-item">✅ La comisión se abona a saldo una vez que se inicie el período de cobertura a quien invitaste.</div>
                        <div class="amb-how-item">✅ Consulta tus recomendaciones y comisiones directamente desde tu panel.</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // FUNCIONES AUXILIARES (compartir, copiar, etc.)
    // ============================================

    // Función para copiar código de referido
    window.copyReferralCode = function (code) {
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.querySelector('.amb-btn-yellow') || document.querySelector('.ambassador-copy-btn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✅ ¡Copiado!';
                btn.style.background = '#22C55E';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#FFD93D';
                }, 2000);
            }
            // También mostrar alerta para feedback
            console.log('Código copiado:', code);
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('Tu código es: ' + code);
        });
    };

    // Copiar link de registro con código
    window.copyReferralLink = function (code) {
        const link = `https://www.clubpataamiga.com/registro?ref=${code}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('¡Link copiado!\n' + link);
        }).catch(err => {
            alert('Tu link es: ' + link);
        });
    };

    // Compartir en WhatsApp
    window.shareOnWhatsApp = function (code) {
        const message = `¡Únete a Club Pata Amiga y protege a tus peludos! 🐾\n\nUsa mi código de referido: ${code}\n\nRegístrate aquí: https://www.clubpataamiga.com/registro?ref=${code}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Compartir en Facebook
    window.shareOnFacebook = function (code) {
        const url = `https://www.clubpataamiga.com/registro?ref=${code}`;
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent('¡Únete a Club Pata Amiga con mi código: ' + code)}`;
        window.open(fbUrl, '_blank');
    };

    // Compartir código (usa Web Share API si está disponible)
    window.shareCode = function (code) {
        const shareData = {
            title: 'Club Pata Amiga',
            text: `¡Únete a Club Pata Amiga y protege a tus peludos! 🐾\n\nUsa mi código de referido: ${code}`,
            url: `https://www.clubpataamiga.com/registro?ref=${code}`
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => {
                console.log('Error compartiendo:', err);
                // Fallback a WhatsApp
                window.shareOnWhatsApp(code);
            });
        } else {
            // Fallback: mostrar opciones
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

    // Solicitar retiro
    window.requestWithdraw = async function (ambassadorId, amount) {
        if (!confirm(`¿Deseas solicitar un retiro de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)}?`)) {
            return;
        }

        try {
            const btn = document.querySelector('.amb-btn-primary');
            if (btn) btn.disabled = true;

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassadorId}/payouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Tu solicitud de retiro ha sido enviada con éxito. Te contactaremos pronto para procesar el pago.');
                // Recargar el widget para mostrar saldo en 0 y el nuevo pago en la lista (si lo estuviéramos recargando)
                location.reload();
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo procesar el retiro'));
            }
        } catch (error) {
            console.error('Error solicitando retiro:', error);
            alert('❌ Hubo un error al procesar tu solicitud. Por favor intenta más tarde.');
        } finally {
            const btn = document.querySelector('.amb-btn-primary');
            if (btn) btn.disabled = false;
        }
    };

    // ============================================
    // FUNCIONES PRINCIPALES
    // ============================================

    async function checkAmbassadorStatus(email) {
        try {
            // Primero buscar embajador por email
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors?search=${encodeURIComponent(email)}&limit=1`);
            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                const ambassador = data.data[0];

                // Si está aprobado, obtener datos completos incluyendo referidos
                if (ambassador.status === 'approved') {
                    try {
                        const detailResponse = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors/${ambassador.id}`);
                        const detailData = await detailResponse.json();

                        if (detailData.success && detailData.data) {
                            console.log('📊 Ambassador data con referidos:', detailData.data);
                            return {
                                ...detailData.data,
                                recent_referrals: detailData.data.referrals || []
                            };
                        }
                    } catch (detailError) {
                        console.error('Error getting ambassador details:', detailError);
                    }
                }

                return ambassador;
            }
            return null;
        } catch (error) {
            console.error('Error checking ambassador status:', error);
            return null;
        }
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
                <div class="ambassador-widget-bg"></div>
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
        if (email) {
            ambassador = await checkAmbassadorStatus(email);
        }

        // Render based on status
        let content = '';
        if (!ambassador) {
            content = renderNotAmbassador(memberId);
        } else if (ambassador.status === 'pending') {
            content = renderPending(ambassador);
        } else if (ambassador.status === 'rejected') {
            content = renderRejected(ambassador, memberId);
        } else if (ambassador.status === 'approved') {
            content = renderApproved(ambassador);
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
                <div class="ambassador-widget-bg"></div>
                <div class="ambassador-widget-content">
                    ${content}
                </div>
                <button class="ambassador-paw-btn" title="Ayuda">🐾</button>
            </div>
        `;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        // Small delay to ensure Memberstack is loaded
        setTimeout(initWidget, 500);
    }

    // Export for manual initialization
    window.initAmbassadorWidget = initWidget;

})();
