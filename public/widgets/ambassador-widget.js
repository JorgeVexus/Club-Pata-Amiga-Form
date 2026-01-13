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
        API_BASE_URL: 'https://club-pata-amiga-form.vercel.app',
        IMAGES_BASE_URL: 'https://club-pata-amiga-form.vercel.app/embajadores-images',
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
    function renderNotAmbassador() {
        return `
            <div class="ambassador-not-found">
                <div class="ambassador-not-found-icon">🎯</div>
                <h2>¿Quieres ser Embajador Pata Amiga?</h2>
                <p>Únete a nuestra manada y gana comisiones por cada familia que ayudes a proteger a sus peludos.</p>
                <button class="ambassador-btn-apply" onclick="window.location.href='/embajadores/registro'">
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
    function renderRejected(ambassador) {
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

                <button class="ambassador-btn-retry" onclick="window.location.href='/embajadores/registro'">
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

    // ============================================
    // FUNCIONES PRINCIPALES
    // ============================================

    async function checkAmbassadorStatus(email) {
        try {
            // Primero intentar buscar por email del miembro actual
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/ambassadors?search=${encodeURIComponent(email)}&limit=1`);
            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                return data.data[0];
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
        if (window.$memberstackDom) {
            try {
                const member = await window.$memberstackDom.getCurrentMember();
                email = member?.data?.auth?.email;
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
            content = renderNotAmbassador();
        } else if (ambassador.status === 'pending') {
            content = renderPending(ambassador);
        } else if (ambassador.status === 'rejected') {
            content = renderRejected(ambassador);
        } else if (ambassador.status === 'approved') {
            // Dashboard completo - se implementará después
            content = `<p>Dashboard del embajador - Próximamente</p>`;
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
