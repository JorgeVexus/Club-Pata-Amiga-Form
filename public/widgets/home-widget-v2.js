/**
 * 🐾 Club Pata Amiga - Home Page Widget v2 (Exact Landing Page Replica)
 * 
 * Widget incrustable para Webflow que replica exactamente la nueva landing page.
 * Optimizado para desktop y mobile, con animaciones fluidas y diseño premium.
 */

(function () {
    'use strict';

    const apiUrl = window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx';
    const CONFIG = {
        apiUrl: apiUrl,
        plans: {
            monthly: 'prc_mensual-452k30jah',
            yearly: 'prc_anual-o9d101ta'
        },
        images: {
            hero: `${apiUrl}/widgets/home%20v2%20images/landing-hero.webp`,
            planes: `${apiUrl}/widgets/home%20v2%20images/landing-planes.webp`,
            red: 'https://hjvhntxjkuuobgfslzlf.supabase.co/storage/v1/object/public/pet-photos/landing-red.png'
        }
    };

    const BENEFITS = [
        {
            emoji: '💬',
            bg: 'pata-v2-bg-info-bg',
            title: 'Orientación veterinaria 24/7',
            text: 'Orientación inmediata con IA veterinaria, disponible desde el primer día de tu membresía.'
        },
        {
            emoji: '🐾',
            bg: 'pata-v2-bg-warning-bg',
            title: 'Reintegros',
            text: 'Hasta $3,000 MXN en gastos veterinarios, $2,000 por fallecimiento y $300 en vacunas. En 72 hrs.'
        },
        {
            emoji: '📍',
            bg: 'pata-v2-bg-success-bg',
            title: 'Centros aliados',
            text: 'Red de veterinarias, tiendas y hoteles con beneficios exclusivos para miembros, cerca de ti.'
        }
    ];

    const HOW_IT_WORKS = [
        'Vas a tu veterinario de confianza',
        'Subes la foto de la factura',
        'Transferimos tu reintegro en 72 hrs'
    ];

    const MEMBERSHIP_FEATURES = [
        'Disponible en todo México',
        'Mantienes a tu veterinario',
        'Incluye hasta 3 mascotas',
        'Orientación veterinaria 24/7',
        '100% digital'
    ];

    const FAQ_DATA = [
        {
            title: 'Sobre Pata Amiga',
            items: [
                {
                    q: '¿Qué es Pata Amiga?',
                    a: [
                        'Pata Amiga es una membresía de salud para mascotas creada para que nunca tengas que enfrentar solo los imprevistos con tu peludo.',
                        'Somos una comunidad de personas que comparten el mismo propósito: cuidar a quienes nos acompañan con amor todos los días. Por eso, cuando formas parte de la manada, cuentas con beneficios que te ayudan a cuidar su salud y a tener mayor tranquilidad.',
                        'Con una sola membresía puedes proteger hasta 3 mascotas y disfrutar de beneficios como:\n• Reintegro en emergencias médicas, para ayudarte con gastos por urgencias, estudios, cirugía u hospitalización.\n• Reintegro para vacunas, para impulsar el cuidado preventivo de tu peludo.\n• Reintegro por fallecimiento, para ayudarte con los gastos en uno de los momentos más difíciles.\n• Orientación veterinaria 24/7, para resolver dudas y recibir guía cuando la necesites, estés donde estés.',
                        'Además, tu membresía tiene alcance en todo México, es 100% digital y tú decides con qué veterinario atender a tu peludo.',
                        'Porque cuando cuidamos juntos, todo se vuelve un poco más fácil.'
                    ]
                }
            ]
        },
        {
            title: 'Sobre membresía y contribuciones',
            items: [
                {
                    q: '¿Cuántas membresías existen?',
                    a: [
                        'En Pata Amiga solo existe una membresía, diseñada para hacer más fácil el cuidado de tus mascotas.',
                        'Puedes elegir la modalidad que mejor se adapte a ti:\n• Mensual: desde $159 al mes.\n• Anual: realiza un solo pago y disfruta de todos los beneficios durante 12 meses.',
                        'Sin importar la modalidad que elijas, tendrás acceso a los mismos beneficios y podrás proteger hasta 3 mascotas con una sola membresía.'
                    ]
                },
                {
                    q: '¿Cuánto dura la membresía?',
                    a: [
                        'Tú decides cómo disfrutar de tu membresía: puedes contratarla en modalidad mensual o anual.',
                        'Ambas opciones cuentan con renovación automática, para que tus mascotas continúen protegidas y sigan disfrutando de todos los beneficios de Pata Amiga sin interrupciones.',
                        'Si en algún momento deseas cancelar tu renovación, puedes hacerlo de acuerdo con los términos de tu membresía.'
                    ]
                },
                {
                    q: '¿Qué formas de pago aceptan?',
                    a: [
                        'Actualmente puedes adquirir tu membresía con tarjetas de crédito y débito.',
                        'Estamos trabajando para incorporar nuevas formas de pago muy pronto, para que unirte a la manada y proteger a tus mascotas sea cada vez más fácil.'
                    ]
                }
            ]
        },
        {
            title: 'Lo que incluye tu membresía',
            items: [
                {
                    q: '¿Con qué cuento al ser parte de la manada?',
                    a: [
                        'Al formar parte de Pata Amiga, tú y hasta 3 mascotas podrán disfrutar de beneficios pensados para acompañarlos en cada etapa de su vida.',
                        'Reintegro en emergencias médicas: recibe un reintegro para ayudarte con gastos por urgencias, estudios, cirugía u hospitalización cuando tu peludo más lo necesite.',
                        'Reintegro para vacunas: porque la prevención también es una forma de cuidar. Tu membresía incluye un reintegro para apoyar el esquema de vacunación de tus mascotas.',
                        'Reintegro por fallecimiento: en uno de los momentos más difíciles, cuentas con un reintegro para ayudarte con los gastos derivados de la despedida de tu compañero.',
                        'Orientación veterinaria 24/7: resuelve tus dudas y recibe orientación en cualquier momento, desde donde estés, para tomar las mejores decisiones sobre la salud de tu mascota.',
                        'Ayudamos a más peludos juntos: por cada 1,000 nuevos miembros, realizamos una donación a refugios aliados para que más perros y gatos tengan una nueva oportunidad. Porque en Pata Amiga no solo cuidas a tus mascotas; también formas parte de una comunidad que ayuda a muchas más.'
                    ]
                }
            ]
        },
        {
            title: 'Sobre embajadores',
            items: [
                {
                    q: '¿Quiénes son los embajadores?',
                    a: [
                        'Los embajadores de Pata Amiga son personas, creadores de contenido, médicos veterinarios, asociaciones y refugios aliados que comparten nuestra misión de promover el bienestar animal.',
                        'A través de sus redes, comunidades y espacios, nos ayudan a que más familias conozcan Pata Amiga y puedan proteger a sus mascotas. Como parte de este programa, reciben beneficios especiales por impulsar el crecimiento de nuestra comunidad y contribuir a que cada vez más peludos tengan acceso a una mejor calidad de vida.'
                    ]
                }
            ]
        },
        {
            title: 'Sobre la red veterinaria y de cuidado',
            items: [
                {
                    q: '¿Quiénes pueden ser parte de nuestra red de aliados?',
                    a: [
                        'Nuestra red de aliados está abierta a hospitales veterinarios, clínicas, médicos veterinarios, laboratorios, estéticas caninas y felinas, paseadores, etólogos, entrenadores, hoteles para mascotas, centros funerarios y, en general, a todos los profesionales y negocios dedicados al bienestar animal que compartan nuestra misión.',
                        'Si tu trabajo ayuda a mejorar la vida de los perros y gatos, en Pata Amiga siempre habrá un lugar para sumar esfuerzos y seguir cuidando a más peludos juntos.'
                    ]
                }
            ]
        }
    ];

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        :root {
            --pata-v2-cream: #faf7f1;
            --pata-v2-cream-light: #fdf9ef;
            --pata-v2-teal: #1cbcad;
            --pata-v2-teal-deep: #0e8377;
            --pata-v2-teal-dark: #1e5350;
            --pata-v2-orange: #f7941d;
            --pata-v2-pink: #f23d6d;
            --pata-v2-lime: #a6ce39;
            --pata-v2-yellow: #ffc20e;
            --pata-v2-white: #ffffff;
            --pata-v2-black: #1b1b1b;
            
            /* State pairs */
            --pata-v2-success-bg: #eff6dc;
            --pata-v2-success-text: #5a7a18;
            --pata-v2-warning-bg: #fff4e3;
            --pata-v2-warning-text: #c77414;
            --pata-v2-error-bg: #fdecf1;
            --pata-v2-error-text: #c22a56;
            --pata-v2-info-bg: #e9f7f5;
            --pata-v2-info-text: #0e8377;

            /* Text colors */
            --pata-v2-ink-title: #1e5350;
            --pata-v2-ink-body: #3d524f;
            --pata-v2-ink-secondary: #6b7c79;
            --pata-v2-ink-tertiary: #8a9490;
            --pata-v2-ink-placeholder: #a9a294;

            /* Borders */
            --pata-v2-border-input: #e4dfd3;
            --pata-v2-border-divider: #eee9dd;

            --pata-v2-font-sans: 'Outfit', sans-serif;
            --pata-v2-font-display: 'Fraiche', 'Outfit', sans-serif;
            
            --pata-v2-transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            --pata-v2-shadow-card: 0 2px 12px rgba(30, 83, 80, 0.06);
        }

        .pata-v2-home-wrapper {
            font-family: var(--pata-v2-font-sans);
            color: var(--pata-v2-ink-body);
            background-color: var(--pata-v2-cream);
            width: 100%;
            margin: 0 auto;
            overflow-x: hidden;
            box-sizing: border-box;
            line-height: 1.5;
        }

        .pata-v2-home-wrapper *, 
        .pata-v2-home-wrapper *::before, 
        .pata-v2-home-wrapper *::after {
            box-sizing: border-box;
        }

        /* Utilidades de Diseño */
        .pata-v2-h1 {
            font-family: var(--pata-v2-font-display);
            font-size: clamp(38px, 6vw, 58px);
            font-weight: 400;
            line-height: 1.02;
            color: var(--pata-v2-white);
            margin: 0;
        }

        .pata-v2-h2 {
            font-family: var(--pata-v2-font-display);
            font-size: clamp(28px, 4vw, 36px);
            font-weight: 400;
            line-height: 1.15;
            color: var(--pata-v2-ink-title);
            margin: 0;
        }

        /* Botones Premium */
        .pata-v2-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 54px;
            padding: 0 30px;
            font-size: 15px;
            font-weight: 700;
            border-radius: 50px;
            text-decoration: none;
            cursor: pointer;
            transition: var(--pata-v2-transition);
            border: none;
            white-space: nowrap;
        }

        .pata-v2-btn-white {
            background-color: var(--pata-v2-white);
            color: var(--pata-v2-teal-deep);
        }

        .pata-v2-btn-white:hover {
            background-color: var(--pata-v2-cream-light);
        }

        .pata-v2-btn-teal {
            background-color: var(--pata-v2-teal);
            color: var(--pata-v2-white);
        }

        .pata-v2-btn-teal:hover {
            background-color: var(--pata-v2-teal-deep);
        }

        .pata-v2-btn-orange {
            background-color: var(--pata-v2-orange);
            color: var(--pata-v2-white);
        }

        .pata-v2-btn-orange:hover {
            opacity: 0.9;
        }

        .pata-v2-btn-outline {
            background-color: transparent;
            border: 2px solid var(--pata-v2-teal);
            color: var(--pata-v2-teal-deep);
            padding: 0 28px;
        }

        .pata-v2-btn-outline:hover {
            background-color: var(--pata-v2-teal);
            color: var(--pata-v2-white);
        }

        /* Header / Nav */
        .pata-v2-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--pata-v2-border-divider);
            background-color: var(--pata-v2-white);
            padding: 14px 20px;
        }

        @media (min-width: 640px) {
            .pata-v2-header {
                padding: 14px 32px;
            }
        }

        .pata-v2-logo-link {
            display: inline-block;
        }

        .pata-v2-logo-img {
            height: 44px;
            width: auto;
            display: block;
        }

        .pata-v2-nav {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 14px;
            font-weight: 600;
        }

        @media (min-width: 1024px) {
            .pata-v2-nav {
                gap: 26px;
            }
        }

        .pata-v2-nav-item {
            color: var(--pata-v2-ink-body);
            text-decoration: none;
            transition: var(--pata-v2-transition);
            display: none;
        }

        @media (min-width: 768px) {
            .pata-v2-nav-item {
                display: inline;
            }
        }

        .pata-v2-nav-item:hover {
            color: var(--pata-v2-teal-deep);
        }

        .pata-v2-nav-login {
            color: var(--pata-v2-teal-deep);
            text-decoration: none;
            transition: var(--pata-v2-transition);
            white-space: nowrap;
        }

        .pata-v2-nav-login:hover {
            color: var(--pata-v2-teal);
        }

        .pata-v2-nav-join {
            background-color: var(--pata-v2-teal);
            color: var(--pata-v2-white);
            text-decoration: none;
            padding: 10px 16px;
            border-radius: 50px;
            font-weight: 700;
            transition: var(--pata-v2-transition);
            white-space: nowrap;
        }

        @media (min-width: 640px) {
            .pata-v2-nav-join {
                padding: 10px 22px;
            }
        }

        .pata-v2-nav-join:hover {
            background-color: var(--pata-v2-teal-deep);
        }

        /* 1. Hero Section */
        .pata-v2-hero {
            position: relative;
            background-color: var(--pata-v2-teal);
            display: grid;
            overflow: hidden;
        }

        @media (min-width: 1024px) {
            .pata-v2-hero {
                grid-template-columns: 1.1fr 1fr;
                min-height: 440px;
            }
        }

        .pata-v2-hero .blob {
            position: absolute;
            bottom: -120px;
            left: -100px;
            width: 360px;
            height: 360px;
            background-color: rgba(255, 255, 255, 0.1);
        }

        .pata-v2-hero-content {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 20px;
            padding: 48px 20px;
        }

        @media (min-width: 640px) {
            .pata-v2-hero-content {
                padding: 56px 56px;
            }
        }

        .pata-v2-hero-desc {
            max-width: 420px;
            font-size: 16px;
            line-height: 1.55;
            color: rgba(255, 255, 255, 0.92);
            margin: 0;
        }

        .pata-v2-hero-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
        }

        .pata-v2-hero-price-link {
            font-size: 15px;
            font-weight: 600;
            color: var(--pata-v2-white);
            text-decoration: underline;
            text-underline-offset: 4px;
            padding: 8px 16px;
        }

        .pata-v2-hero-image-column {
            position: relative;
            display: none;
            align-items: end;
            justify-content: center;
        }

        @media (min-width: 1024px) {
            .pata-v2-hero-image-column {
                display: flex;
            }
        }

        .pata-v2-hero-img {
            height: 86%;
            width: 88%;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
            object-fit: cover;
            object-position: top;
            display: block;
        }

        .pata-v2-hero-placeholder {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 86%;
            width: 88%;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
            border: 2px dashed rgba(255, 255, 255, 0.5);
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.75);
            letter-spacing: 0.05em;
        }

        /* 2. Benefits Marquee */
        .pata-v2-marquee-container {
            overflow: hidden;
            padding: 12px 0;
            background-color: var(--pata-v2-teal-dark);
        }

        .pata-v2-marquee-track {
            display: flex;
            width: max-content;
            align-items: center;
            animation: pata-v2-marquee-animation 40s linear infinite;
        }

        @media (hover: hover) and (pointer: fine) {
            .pata-v2-marquee-track:hover {
                animation-play-state: paused;
            }
        }

        .pata-v2-marquee-item {
            display: flex;
            align-items: center;
            gap: 12px;
            white-space: nowrap;
            padding-right: 12px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.02em;
            color: rgba(255, 255, 255, 0.9);
        }

        .pata-v2-marquee-paw {
            color: var(--pata-v2-white);
            flex-shrink: 0;
        }

        @keyframes pata-v2-marquee-animation {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }

        /* 3. Beneficios Section */
        .pata-v2-benefits-section {
            display: flex;
            flex-direction: column;
            gap: 32px;
            padding: 48px 20px;
            max-width: 1200px;
            margin: 0 auto;
        }

        @media (min-width: 640px) {
            .pata-v2-benefits-section {
                padding: 48px 56px;
            }
        }

        .pata-v2-section-header {
            text-align: center;
        }

        .pata-v2-section-subtitle {
            margin-top: 8px;
            font-size: 15px;
            color: var(--pata-v2-ink-secondary);
        }

        .pata-v2-benefits-grid {
            display: grid;
            gap: 18px;
        }

        @media (min-width: 768px) {
            .pata-v2-benefits-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        .pata-v2-benefit-card {
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-radius: 20px;
            background-color: var(--pata-v2-white);
            padding: 26px;
            box-shadow: var(--pata-v2-shadow-card);
        }

        .pata-v2-benefit-emoji-bg {
            display: grid;
            width: 52px;
            height: 52px;
            place-items: center;
            border-radius: 16px;
            font-size: 24px;
        }

        .pata-v2-bg-info-bg { background-color: var(--pata-v2-info-bg); color: var(--pata-v2-info-text); }
        .pata-v2-bg-warning-bg { background-color: var(--pata-v2-warning-bg); color: var(--pata-v2-warning-text); }
        .pata-v2-bg-success-bg { background-color: var(--pata-v2-success-bg); color: var(--pata-v2-success-text); }

        .pata-v2-benefit-title {
            font-size: 17px;
            font-weight: 700;
            color: var(--pata-v2-ink-title);
            margin: 0;
        }

        .pata-v2-benefit-text {
            font-size: 13.5px;
            line-height: 1.55;
            color: var(--pata-v2-ink-secondary);
            margin: 0;
        }

        /* 4. Planes Section */
        .pata-v2-planes-container {
            display: grid;
            align-items: center;
            gap: 18px;
            border-radius: 24px;
            background-color: var(--pata-v2-white);
            padding: 24px;
            box-shadow: var(--pata-v2-shadow-card);
        }

        @media (min-width: 640px) {
            .pata-v2-planes-container {
                padding: 32px;
            }
        }

        @media (min-width: 1024px) {
            .pata-v2-planes-container {
                grid-template-columns: 1fr 1fr;
            }
        }

        .pata-v2-planes-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-v2-planes-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        @media (min-width: 640px) {
            .pata-v2-planes-grid {
                flex-direction: row;
            }
        }

        .pata-v2-plan-card {
            flex: 1;
            border-radius: 16px;
            border: 1.5px solid var(--pata-v2-border-input);
            padding: 16px;
            position: relative;
        }

        .pata-v2-plan-card-popular {
            border: 2px solid var(--pata-v2-teal);
        }

        .pata-v2-plan-badge {
            position: absolute;
            top: -10px;
            right: 12px;
            border-radius: 50px;
            background-color: var(--pata-v2-pink);
            padding: 4px 10px;
            font-size: 10px;
            font-weight: 800;
            color: var(--pata-v2-white);
            text-transform: uppercase;
        }

        .pata-v2-plan-type {
            font-size: 13px;
            font-weight: 700;
            color: var(--pata-v2-ink-tertiary);
            text-transform: uppercase;
        }

        .pata-v2-plan-card-popular .pata-v2-plan-type {
            color: var(--pata-v2-teal-deep);
        }

        .pata-v2-plan-price {
            font-family: var(--pata-v2-font-display);
            font-size: 28px;
            color: var(--pata-v2-ink-title);
        }

        .pata-v2-plan-price-span {
            font-family: var(--pata-v2-font-sans);
            font-size: 13px;
            color: var(--pata-v2-ink-tertiary);
        }

        .pata-v2-planes-img {
            display: none;
            width: 100%;
            height: 280px;
            border-radius: 20px;
            object-fit: cover;
        }

        @media (min-width: 1024px) {
            .pata-v2-planes-img {
                display: block;
            }
        }

        .pata-v2-planes-placeholder {
            display: none;
            height: 280px;
            border: 2px dashed #C9C3B4;
            border-radius: 20px;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: var(--pata-v2-ink-placeholder);
            align-content: center;
        }

        @media (min-width: 1024px) {
            .pata-v2-planes-placeholder {
                display: grid;
            }
        }

        /* 5. Como Funciona Section */
        .pata-v2-how-section {
            background-color: var(--pata-v2-white);
            padding: 56px 20px;
        }

        @media (min-width: 640px) {
            .pata-v2-how-section {
                padding: 56px 56px;
            }
        }

        .pata-v2-how-inner {
            max-width: 980px;
            margin: 0 auto;
            display: grid;
            align-items: center;
            gap: 40px;
        }

        @media (min-width: 1024px) {
            .pata-v2-how-inner {
                grid-template-columns: 1fr 1.2fr;
            }
        }

        .pata-v2-how-image-col {
            display: none;
        }

        @media (min-width: 1024px) {
            .pata-v2-how-image-col {
                display: block;
            }
        }

        .pata-v2-how-content {
            display: flex;
            flex-direction: column;
            gap: 28px;
        }

        .pata-v2-how-steps {
            display: flex;
            flex-direction: column;
            gap: 24px;
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .pata-v2-how-step-item {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .pata-v2-how-step-num {
            display: grid;
            width: 48px;
            height: 48px;
            place-items: center;
            border-radius: 50%;
            background-color: var(--pata-v2-teal-dark);
            font-family: var(--pata-v2-font-display);
            font-size: 17px;
            color: var(--pata-v2-white);
            flex-shrink: 0;
        }

        .pata-v2-how-step-text {
            font-size: 16px;
            font-weight: 600;
            color: var(--pata-v2-ink-body);
        }

        @media (min-width: 640px) {
            .pata-v2-how-step-text {
                font-size: 17px;
            }
        }

        /* 6. FAQ Section */
        .pata-v2-faq-section {
            display: flex;
            flex-direction: column;
            gap: 32px;
            padding: 56px 20px;
            max-width: 1200px;
            margin: 0 auto;
        }

        @media (min-width: 640px) {
            .pata-v2-faq-section {
                padding: 56px 56px;
            }
        }

        .pata-v2-faq-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            max-width: 860px;
            margin: 0 auto;
        }

        .pata-v2-faq-item {
            overflow: hidden;
            border-radius: 18px;
            background-color: var(--pata-v2-white);
            box-shadow: var(--pata-v2-shadow-card);
            transition: var(--pata-v2-transition);
        }

        .pata-v2-faq-item.open {
            box-shadow: 0 6px 20px rgba(30, 83, 80, 0.10);
        }

        .pata-v2-faq-item:not(.open):hover {
            box-shadow: 0 6px 20px rgba(30, 83, 80, 0.12);
        }

        .pata-v2-faq-btn {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            background: transparent;
            border: none;
            padding: 20px 24px;
            text-align: left;
            cursor: pointer;
            transition: var(--pata-v2-transition);
            outline: none;
        }

        .pata-v2-faq-btn:hover {
            background-color: var(--pata-v2-cream-light);
        }

        .pata-v2-faq-title {
            font-family: var(--pata-v2-font-display);
            font-size: 19px;
            color: var(--pata-v2-ink-title);
            transition: var(--pata-v2-transition);
        }

        .pata-v2-faq-btn:hover .pata-v2-faq-title {
            color: var(--pata-v2-teal-deep);
        }

        .pata-v2-faq-arrow {
            color: var(--pata-v2-teal-deep);
            transition: transform 0.3s ease;
            font-size: 16px;
        }

        .pata-v2-faq-item.open .pata-v2-faq-arrow {
            transform: rotate(180deg);
        }

        .pata-v2-faq-content {
            display: none;
            flex-direction: column;
            gap: 20px;
            padding: 0 24px 24px 24px;
            border-top: 1px solid var(--pata-v2-border-divider);
        }

        .pata-v2-faq-item.open .pata-v2-faq-content {
            display: flex;
            padding-top: 24px;
        }

        .pata-v2-faq-subitem {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .pata-v2-faq-q {
            font-size: 15px;
            font-weight: 700;
            color: var(--pata-v2-ink-title);
            margin: 0;
        }

        .pata-v2-faq-p {
            font-size: 14px;
            line-height: 1.6;
            color: var(--pata-v2-ink-body);
            margin: 0;
            white-space: pre-line;
        }

        /* 7. Red / Registro de Centro Section */
        .pata-v2-red-section {
            background-color: var(--pata-v2-white);
            padding: 56px 20px;
        }

        @media (min-width: 640px) {
            .pata-v2-red-section {
                padding: 56px 56px;
            }
        }

        .pata-v2-red-inner {
            max-width: 1060px;
            margin: 0 auto;
            display: grid;
            align-items: center;
            gap: 40px;
        }

        @media (min-width: 1024px) {
            .pata-v2-red-inner {
                grid-template-columns: 1fr 1.1fr;
            }
        }

        .pata-v2-red-info {
            display: flex;
            flex-direction: column;
            align-items: start;
            gap: 16px;
        }

        .pata-v2-red-tag {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: var(--pata-v2-teal-deep);
            text-transform: uppercase;
        }

        .pata-v2-red-title span.teal {
            color: var(--pata-v2-teal);
        }

        .pata-v2-red-desc {
            max-width: 560px;
            font-size: 14.5px;
            line-height: 1.55;
            color: var(--pata-v2-ink-secondary);
            margin: 0;
        }

        .pata-v2-red-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }

        .pata-v2-red-image-col {
            display: none;
        }

        @media (min-width: 1024px) {
            .pata-v2-red-image-col {
                display: block;
            }
        }

        .pata-v2-red-img {
            max-height: 440px;
            width: 100%;
            object-fit: contain;
            display: block;
        }

        .pata-v2-red-placeholder {
            height: 340px;
            border: 2px dashed #C9C3B4;
            border-radius: 24px;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: var(--pata-v2-ink-placeholder);
            align-content: center;
        }

        /* 8. Wellness Partner Lead Form */
        .pata-v2-wellness-card {
            background-color: var(--pata-v2-cream-light);
            border: 1.5px solid var(--pata-v2-border-divider);
            border-radius: 24px;
            padding: 24px;
            width: 100%;
            box-shadow: var(--pata-v2-shadow-card);
        }

        .pata-v2-wellness-card-title {
            font-family: var(--pata-v2-font-display);
            font-size: 22px;
            color: var(--pata-v2-ink-title);
            margin: 0 0 16px 0;
            text-align: center;
        }

        .pata-v2-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .pata-v2-form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .pata-v2-form-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: var(--pata-v2-ink-secondary);
            text-transform: uppercase;
        }

        .pata-v2-form-input {
            height: 44px;
            border-radius: 50px;
            border: 1.5px solid var(--pata-v2-border-input);
            background-color: var(--pata-v2-white);
            padding: 0 16px;
            font-family: var(--pata-v2-font-sans);
            font-size: 14px;
            color: var(--pata-v2-ink-body);
            outline: none;
            width: 100%;
            transition: var(--pata-v2-transition);
        }

        .pata-v2-form-input:focus {
            border-color: var(--pata-v2-teal);
        }

        .pata-v2-services-legend {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: var(--pata-v2-ink-secondary);
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .pata-v2-services-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        @media (max-width: 480px) {
            .pata-v2-services-grid {
                grid-template-columns: 1fr;
            }
        }

        .pata-v2-service-cb-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            color: var(--pata-v2-ink-body);
            cursor: pointer;
            user-select: none;
        }

        .pata-v2-service-cb-input {
            width: 16px;
            height: 16px;
            accent-color: var(--pata-v2-teal);
        }

        .pata-v2-service-text-input {
            height: 36px;
            border-radius: 50px;
            border: 1.5px solid var(--pata-v2-border-input);
            background-color: var(--pata-v2-white);
            padding: 0 12px;
            font-family: var(--pata-v2-font-sans);
            font-size: 13px;
            outline: none;
            width: 100%;
        }

        .pata-v2-form-status {
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            display: none;
        }

        .pata-v2-form-status.success {
            color: var(--pata-v2-success-text);
            display: block;
        }

        .pata-v2-form-status.error {
            color: var(--pata-v2-error-text);
            display: block;
        }

        /* 9. Footer Section */
        .pata-v2-footer {
            background-color: var(--pata-v2-teal-dark);
            padding: 48px 20px 32px 20px;
            display: flex;
            flex-direction: column;
            gap: 36px;
        }

        @media (min-width: 640px) {
            .pata-v2-footer {
                padding: 48px 56px 32px 56px;
            }
        }

        .pata-v2-footer-top {
            max-width: 980px;
            width: 100%;
            margin: 0 auto;
            display: grid;
            gap: 36px;
        }

        @media (min-width: 768px) {
            .pata-v2-footer-top {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .pata-v2-footer-contact {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .pata-v2-footer-h3 {
            font-family: var(--pata-v2-font-display);
            font-size: 22px;
            color: var(--pata-v2-white);
            margin: 0;
        }

        .pata-v2-footer-email {
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.85);
            text-decoration: none;
            transition: var(--pata-v2-transition);
        }

        .pata-v2-footer-email:hover {
            color: var(--pata-v2-white);
        }

        .pata-v2-socials-row {
            display: flex;
            gap: 12px;
        }

        .pata-v2-social-btn {
            display: grid;
            width: 40px;
            height: 40px;
            place-items: center;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            transition: var(--pata-v2-transition);
            text-decoration: none;
        }

        .pata-v2-social-btn:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: var(--pata-v2-white);
        }

        /* Newsletter form footer */
        .pata-v2-newsletter-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .pata-v2-newsletter-row {
            display: flex;
            gap: 8px;
        }

        .pata-v2-newsletter-input {
            height: 44px;
            flex: 1;
            border-radius: 50px;
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            background-color: rgba(255, 255, 255, 0.1);
            padding: 0 16px;
            font-family: var(--pata-v2-font-sans);
            font-size: 14px;
            color: var(--pata-v2-white);
            outline: none;
            min-width: 0;
        }

        .pata-v2-newsletter-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .pata-v2-newsletter-input:focus {
            border-color: var(--pata-v2-lime);
        }

        .pata-v2-newsletter-btn {
            display: grid;
            height: 44px;
            place-items: center;
            border-radius: 50px;
            background-color: var(--pata-v2-lime);
            color: var(--pata-v2-teal-dark);
            font-size: 13px;
            font-weight: 800;
            border: none;
            padding: 0 20px;
            cursor: pointer;
            transition: var(--pata-v2-transition);
        }

        .pata-v2-newsletter-btn:hover {
            opacity: 0.9;
        }

        .pata-v2-newsletter-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .pata-v2-newsletter-desc {
            font-size: 12px;
            line-height: 1.4;
            color: rgba(255, 255, 255, 0.6);
        }

        .pata-v2-newsletter-status {
            font-size: 13px;
            font-weight: 600;
        }

        .pata-v2-newsletter-status.success {
            color: var(--pata-v2-lime);
        }

        .pata-v2-newsletter-status.error {
            color: #FFB3C4;
        }

        /* Links Columns Footer */
        .pata-v2-footer-links-grid {
            max-width: 980px;
            width: 100%;
            margin: 0 auto;
            display: grid;
            gap: 36px;
        }

        @media (min-width: 640px) {
            .pata-v2-footer-links-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (min-width: 992px) {
            .pata-v2-footer-links-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        .pata-v2-footer-links-col {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .pata-v2-footer-links-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }

        .pata-v2-footer-link {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.75);
            text-decoration: none;
            transition: var(--pata-v2-transition);
        }

        .pata-v2-footer-link:hover {
            color: var(--pata-v2-white);
        }

        /* Copyright bar */
        .pata-v2-footer-copyright-bar {
            max-width: 980px;
            width: 100%;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: start;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 24px;
        }

        @media (min-width: 640px) {
            .pata-v2-footer-copyright-bar {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
            }
        }

        .pata-v2-footer-logo-img {
            height: 35px;
            width: auto;
        }

        .pata-v2-footer-copyright-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.55);
            margin: 0;
        }

        /* CSS Phone Mockup */
        .pata-v2-phone-mockup-wrapper {
            margin: 0 auto;
            width: 290px;
            border-radius: 44px;
            background-color: var(--pata-v2-teal-dark);
            padding: 10px;
            box-shadow: 0 24px 60px rgba(30, 83, 80, 0.25);
        }

        .pata-v2-phone-screen {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-radius: 36px;
            background-color: var(--pata-v2-cream);
        }

        .pata-v2-phone-notch-bar {
            position: relative;
            display: flex;
            height: 36px;
            align-items: center;
            justify-content: center;
            background-color: var(--pata-v2-teal);
        }

        .pata-v2-phone-notch {
            position: absolute;
            left: 50%;
            top: 0;
            height: 20px;
            width: 96px;
            transform: translateX(-50%);
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
            background-color: var(--pata-v2-teal-dark);
        }

        .pata-v2-phone-body {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px 20px 28px 20px;
        }

        .pata-v2-phone-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .pata-v2-phone-logo {
            height: 22px;
            width: auto;
        }

        .pata-v2-phone-badge {
            border-radius: 50px;
            background-color: var(--pata-v2-info-bg);
            padding: 4px 10px;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.06em;
            color: var(--pata-v2-info-text);
        }

        .pata-v2-phone-indicators {
            display: flex;
            gap: 6px;
        }

        .pata-v2-phone-indicator-dot {
            height: 6px;
            flex: 1;
            border-radius: 50px;
            background-color: var(--pata-v2-border-divider);
        }

        .pata-v2-phone-indicator-dot.active {
            background-color: var(--pata-v2-teal);
        }

        .pata-v2-phone-title {
            font-family: var(--pata-v2-font-display);
            font-size: 19px;
            color: var(--pata-v2-ink-title);
        }

        .pata-v2-phone-form-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .pata-v2-phone-form-label {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: var(--pata-v2-ink-tertiary);
        }

        .pata-v2-phone-input-mock {
            display: flex;
            height: 36px;
            align-items: center;
            border-radius: 10px;
            border: 1.5px solid var(--pata-v2-border-input);
            background-color: var(--pata-v2-white);
            padding: 0 12px;
            font-size: 11px;
            color: var(--pata-v2-ink-secondary);
        }

        .pata-v2-phone-input-mock-pw {
            display: flex;
            height: 36px;
            align-items: center;
            justify-content: space-between;
            border-radius: 10px;
            border: 1.5px solid var(--pata-v2-border-input);
            background-color: var(--pata-v2-white);
            padding: 0 12px;
        }

        .pata-v2-phone-pw-dots {
            font-size: 11px;
            letter-spacing: 0.2em;
            color: var(--pata-v2-ink-title);
        }

        .pata-v2-phone-pw-show {
            font-size: 10px;
            font-weight: 700;
            color: var(--pata-v2-teal-deep);
        }

        .pata-v2-phone-input-mock-tel {
            display: flex;
            height: 36px;
            align-items: center;
            gap: 8px;
            border-radius: 10px;
            border: 1.5px solid var(--pata-v2-border-input);
            background-color: var(--pata-v2-white);
            padding: 0 12px;
            font-size: 11px;
        }

        .pata-v2-phone-tel-prefix {
            font-weight: 700;
            color: var(--pata-v2-ink-title);
        }

        .pata-v2-phone-tel-placeholder {
            color: var(--pata-v2-ink-placeholder);
        }

        .pata-v2-phone-btn {
            margin-top: 4px;
            display: grid;
            height: 40px;
            place-items: center;
            border-radius: 50px;
            background-color: var(--pata-v2-teal);
            font-size: 12px;
            font-weight: 700;
            color: var(--pata-v2-white);
        }

        .pata-v2-phone-footer-text {
            text-align: center;
            font-size: 9px;
            color: var(--pata-v2-ink-tertiary);
        }
    `;

    class PataHomeWidgetV2 {
        constructor() {
            this.container = null;
            this.isWellnessProcessing = false;
            this.isNewsletterProcessing = false;
            this.member = null;

            this.init();
        }

        async init() {
            this.injectStyles();
            this.container = document.getElementById('pata-home-widget');
            if (!this.container) return;

            // Integración Memberstack
            if (window.$memberstackDom) {
                try {
                    const member = await window.$memberstackDom.getCurrentMember();
                    this.member = member?.data;
                } catch (e) {
                    console.error('Error fetching Memberstack session:', e);
                }
            }

            this.render();
        }

        injectStyles() {
            if (document.getElementById('pata-home-widget-v2-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-home-widget-v2-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        render() {
            if (!this.container) return;

            // Logo de marca
            const logoColorUrl = `${CONFIG.apiUrl}/widgets/home%20v2%20images/logo-light-bg.svg`;
            const logoOnDarkUrl = `${CONFIG.apiUrl}/widgets/home%20v2%20images/logo-on-dark.svg`;

            // Construir HTML de la Marquee
            let marqueeItemsHtml = '';
            // Duplicado para loop sin cortes. Repetido 6 veces para pantallas gigantes.
            for (let r = 0; r < 6; r++) {
                MEMBERSHIP_FEATURES.forEach(feature => {
                    marqueeItemsHtml += `
                        <span class="pata-v2-marquee-item">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="pata-v2-marquee-paw" aria-hidden="true">
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

            // Construir HTML de FAQ
            let faqListHtml = '';
            FAQ_DATA.forEach((cat, index) => {
                let catItemsHtml = '';
                cat.items.forEach(item => {
                    let paragraphHtml = '';
                    item.a.forEach(p => {
                        paragraphHtml += `<p class="pata-v2-faq-p">${p}</p>`;
                    });

                    catItemsHtml += `
                        <div class="pata-v2-faq-subitem">
                            <h3 class="pata-v2-faq-q">${item.q}</h3>
                            ${paragraphHtml}
                        </div>
                    `;
                });

                // La primera categoría empieza abierta por defecto
                const isOpenClass = index === 0 ? 'open' : '';
                faqListHtml += `
                    <div class="pata-v2-faq-item ${isOpenClass}" data-faq-index="${index}">
                        <button type="button" class="pata-v2-faq-btn" aria-expanded="${index === 0 ? 'true' : 'false'}">
                            <span class="pata-v2-faq-title">${cat.title}</span>
                            <span class="pata-v2-faq-arrow" aria-hidden="true">▾</span>
                        </button>
                        <div class="pata-v2-faq-content">
                            ${catItemsHtml}
                        </div>
                    </div>
                `;
            });

            this.container.innerHTML = `
                <div class="pata-v2-home-wrapper">
                    
                    <!-- Header / Navigation Bar -->
                    <header class="pata-v2-header">
                        <a href="/" class="pata-v2-logo-link">
                            <img src="${logoColorUrl}" alt="Club Pata Amiga" class="pata-v2-logo-img">
                        </a>
                        <nav class="pata-v2-nav">
                            <a href="#beneficios" class="pata-v2-nav-item">Beneficios</a>
                            <a href="#wellness-partner-form-anchor" class="pata-v2-nav-item" id="nav-centros-btn">Centros aliados</a>
                            <a href="https://www.pataamiga.mx/embajadores/dashboard" class="pata-v2-nav-item">Embajadores</a>
                            <a href="https://www.pataamiga.mx/user/inicio-de-sesion" class="pata-v2-nav-login">
                                <span>Iniciar sesión</span>
                            </a>
                            <a href="https://app.pataamiga.mx/registro?step=1" class="pata-v2-nav-join" id="nav-join-btn">
                                <span>Únete a la manada</span>
                            </a>
                        </nav>
                    </header>

                    <!-- 1. Hero Section -->
                    <section class="pata-v2-hero">
                        <div class="blob"></div>
                        <div class="pata-v2-hero-content">
                            <h1 class="pata-v2-h1">
                                Protección<br>para tu manada.
                            </h1>
                            <p class="pata-v2-hero-desc">
                                Membresía de salud para tu lomito y/o michi: orientación veterinaria 24/7, reintegros para gastos veterinarios. Mantienes a tu veterinario de confianza.
                            </p>
                            <div class="pata-v2-hero-actions">
                                <a href="https://app.pataamiga.mx/registro?step=1" class="pata-v2-btn pata-v2-btn-white" id="hero-cta-btn">Proteger a mi peludo</a>
                                <a href="#planes" class="pata-v2-hero-price-link" id="hero-price-anchor">Desde $159 MXN al mes</a>
                            </div>
                        </div>
                        <div class="pata-v2-hero-image-column">
                            <img src="${CONFIG.images.hero}" alt="Mascota feliz de Club Pata Amiga" class="pata-v2-hero-img" id="hero-img-el">
                            <div class="pata-v2-hero-placeholder" id="hero-placeholder-el" style="display:none;">
                                FOTO<br>perro y gato mirando arriba<br>(recorte sobre teal)
                            </div>
                        </div>
                    </section>

                    <!-- 2. Benefits Marquee (Banda animada) -->
                    <div class="pata-v2-marquee-container" aria-label="Beneficios: ${MEMBERSHIP_FEATURES.join(', ')}">
                        <div class="pata-v2-marquee-track" aria-hidden="true">
                            ${marqueeItemsHtml}
                        </div>
                    </div>

                    <!-- 3. Beneficios Section (Amor que deja huella) -->
                    <section id="beneficios" class="pata-v2-benefits-section">
                        <div class="pata-v2-section-header">
                            <h2 class="pata-v2-h2">Amor que deja huella</h2>
                            <p class="pata-v2-section-subtitle">Todo lo que tu peludo recibe al unirse a la manada.</p>
                        </div>
                        
                        <div class="pata-v2-benefits-grid">
                            ${BENEFITS.map(b => `
                                <div class="pata-v2-benefit-card">
                                    <div class="pata-v2-benefit-emoji-bg ${b.bg}">
                                        <span aria-hidden="true">${b.emoji}</span>
                                    </div>
                                    <h3 class="pata-v2-benefit-title">${b.title}</h3>
                                    <p class="pata-v2-benefit-text">${b.text}</p>
                                </div>
                            `).join('')}
                        </div>

                        <!-- 4. Planes Card Box -->
                        <div id="planes" class="pata-v2-planes-container">
                            <div class="pata-v2-planes-info">
                                <h2 class="pata-v2-h2" style="line-height:1.2;">
                                    Planes simples,<br>sin letras chiquitas
                                </h2>
                                <div class="pata-v2-planes-grid">
                                    <!-- Plan Mensual -->
                                    <div class="pata-v2-plan-card">
                                        <div class="pata-v2-plan-type">MENSUAL</div>
                                        <div class="pata-v2-plan-price">
                                            $159 <span class="pata-v2-plan-price-span">MXN/mes</span>
                                        </div>
                                    </div>
                                    <!-- Plan Anual -->
                                    <div class="pata-v2-plan-card pata-v2-plan-card-popular">
                                        <span class="pata-v2-plan-badge">AHORRA 10%</span>
                                        <div class="pata-v2-plan-type">ANUAL</div>
                                        <div class="pata-v2-plan-price">
                                            $1,699 <span class="pata-v2-plan-price-span">MXN/año</span>
                                        </div>
                                    </div>
                                </div>
                                <a href="https://app.pataamiga.mx/registro?step=1" class="pata-v2-btn pata-v2-btn-teal" id="buy-plans-btn" style="margin-top:8px;">Ver planes completos</a>
                            </div>
                            <div>
                                <img src="${CONFIG.images.planes}" alt="Tutora abrazando a su perro" class="pata-v2-planes-img" id="planes-img-el">
                                <div class="pata-v2-planes-placeholder" id="planes-placeholder-el" style="display:none;">
                                    FOTO<br>tutora abrazando a su perro<br>(estilo brandbook)
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- 5. ¿Cómo funciona? Section -->
                    <section class="pata-v2-how-section">
                        <div class="pata-v2-how-inner">
                            <div class="pata-v2-how-image-col">
                                <div class="pata-v2-phone-mockup-wrapper">
                                    <div class="pata-v2-phone-screen">
                                        <div class="pata-v2-phone-notch-bar">
                                            <div class="pata-v2-phone-notch"></div>
                                        </div>
                                        <div class="pata-v2-phone-body">
                                            <div class="pata-v2-phone-header">
                                                <img src="${logoColorUrl}" alt="" class="pata-v2-phone-logo">
                                                <span class="pata-v2-phone-badge">PASO 1 DE 3</span>
                                            </div>
                                            <div class="pata-v2-phone-indicators">
                                                <span class="pata-v2-phone-indicator-dot active"></span>
                                                <span class="pata-v2-phone-indicator-dot"></span>
                                                <span class="pata-v2-phone-indicator-dot"></span>
                                            </div>
                                            <span class="pata-v2-phone-title">Únete a la manada</span>
                                            
                                            <div class="pata-v2-phone-form-group">
                                                <span class="pata-v2-phone-form-label">CORREO ELECTRÓNICO</span>
                                                <div class="pata-v2-phone-input-mock">hola@pataamiga.mx</div>
                                            </div>
                                            <div class="pata-v2-phone-form-group">
                                                <span class="pata-v2-phone-form-label">CONTRASEÑA</span>
                                                <div class="pata-v2-phone-input-mock-pw">
                                                    <span class="pata-v2-phone-pw-dots">••••••••</span>
                                                    <span class="pata-v2-phone-pw-show">Mostrar</span>
                                                </div>
                                            </div>
                                            <div class="pata-v2-phone-form-group">
                                                <span class="pata-v2-phone-form-label">TELÉFONO</span>
                                                <div class="pata-v2-phone-input-mock-tel">
                                                    <span class="pata-v2-phone-tel-prefix">MX +52</span>
                                                    <span class="pata-v2-phone-tel-placeholder">123 123 1234</span>
                                                </div>
                                            </div>
                                            
                                            <div class="pata-v2-phone-btn">Continuar</div>
                                            <span class="pata-v2-phone-footer-text">🐾 Orientación veterinaria 24/7 desde el día uno</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="pata-v2-how-content">
                                <h2 class="pata-v2-h2">¿Cómo funciona?</h2>
                                <ol class="pata-v2-how-steps">
                                    ${HOW_IT_WORKS.map((step, i) => `
                                        <li class="pata-v2-how-step-item">
                                            <span class="pata-v2-how-step-num">0${i + 1}</span>
                                            <span class="pata-v2-how-step-text">${step}</span>
                                        </li>
                                    `).join('')}
                                </ol>
                                <a href="https://app.pataamiga.mx/registro?step=1" class="pata-v2-btn pata-v2-btn-orange" id="how-cta-btn" style="align-self: flex-start; padding: 0 32px;">Únete a la manada</a>
                            </div>
                        </div>
                    </section>

                    <!-- 6. Preguntas Frecuentes Section -->
                    <section id="faq" class="pata-v2-faq-section">
                        <div class="pata-v2-section-header">
                            <h2 class="pata-v2-h2">Preguntas frecuentes</h2>
                            <p class="pata-v2-section-subtitle">Resolvemos tus dudas de manera clara y directa.</p>
                        </div>
                        <div class="pata-v2-faq-list">
                            ${faqListHtml}
                        </div>
                    </section>

                    <!-- 7. Red / Registro de Centro Aliado Section -->
                    <section class="pata-v2-red-section">
                        <div class="pata-v2-red-inner">
                            <div class="pata-v2-red-info">
                                <span class="pata-v2-red-tag">RED PATA AMIGA</span>
                                <h2 class="pata-v2-h2 pata-v2-red-title" style="line-height: 1.15;">
                                    Red veterinaria<br><span class="teal">y de cuidado</span>
                                </h2>
                                <p class="pata-v2-red-desc">
                                    Estamos construyendo la red de cuidado más grande para mascotas: clínicas veterinarias, hospitales y negocios pet-friendly que comparten nuestros valores de cuidado, empatía y responsabilidad. Explora los centros aliados o registra tu establecimiento hoy mismo.
                                </p>
                                <div class="pata-v2-red-actions">
                                    <a href="https://www.pataamiga.mx/centros" class="pata-v2-btn pata-v2-btn-teal" style="display:none; font-size:14px; padding:0 28px;">Explorar centros aliados</a>
                                    <a href="#wellness-partner-form-anchor" class="pata-v2-btn pata-v2-btn-outline" id="scroll-to-partner-form-btn" style="font-size:14px; padding:0 28px;">Registrar mi centro</a>
                                </div>
                            </div>
                            
                            <!-- Wellness form card right side -->
                            <div class="pata-v2-wellness-card" id="wellness-partner-form-anchor">
                                <h3 class="pata-v2-wellness-card-title">Registra tu Establecimiento</h3>
                                <form id="pata-v2-wellness-form" class="pata-v2-form">
                                    <div class="pata-v2-form-group">
                                        <label for="pata-v2-contact-name" class="pata-v2-form-label">Nombre de contacto</label>
                                        <input type="text" id="pata-v2-contact-name" name="contact_name" class="pata-v2-form-input" placeholder="Nombre completo" required>
                                    </div>
                                    
                                    <div class="pata-v2-form-group">
                                        <label for="pata-v2-establishment-name" class="pata-v2-form-label">Nombre del centro o negocio</label>
                                        <input type="text" id="pata-v2-establishment-name" name="establishment_name" class="pata-v2-form-input" placeholder="Veterinaria, estética, etc." required>
                                    </div>
                                    
                                    <div class="pata-v2-form-group">
                                        <label for="pata-v2-email" class="pata-v2-form-label">Correo electrónico</label>
                                        <input type="email" id="pata-v2-email" name="email" class="pata-v2-form-input" placeholder="ejemplo@correo.com" required>
                                    </div>
                                    
                                    <div class="pata-v2-form-group">
                                        <label for="pata-v2-phone" class="pata-v2-form-label">Teléfono / WhatsApp</label>
                                        <input type="tel" id="pata-v2-phone" name="phone" class="pata-v2-form-input" placeholder="10 dígitos" required>
                                    </div>
                                    
                                    <div class="pata-v2-form-group">
                                        <span class="pata-v2-services-legend">Tipo de servicios</span>
                                        <div class="pata-v2-services-grid">
                                            <label class="pata-v2-service-cb-label">
                                                <input type="checkbox" name="services" value="Veterinaria" class="pata-v2-service-cb-input">
                                                <span>Veterinaria</span>
                                            </label>
                                            <label class="pata-v2-service-cb-label">
                                                <input type="checkbox" name="services" value="Hospital" class="pata-v2-service-cb-input">
                                                <span>Hospital 24h</span>
                                            </label>
                                            <label class="pata-v2-service-cb-label">
                                                <input type="checkbox" name="services" value="Estética" class="pata-v2-service-cb-input">
                                                <span>Estética / Spa</span>
                                            </label>
                                            <label class="pata-v2-service-cb-label">
                                                <input type="checkbox" name="services" value="Hotel" class="pata-v2-service-cb-input">
                                                <span>Hotel / Guardería</span>
                                            </label>
                                            <label class="pata-v2-service-cb-label">
                                                <input type="checkbox" name="services" value="Tienda" class="pata-v2-service-cb-input">
                                                <span>Tienda / Boutique</span>
                                            </label>
                                            <label class="pata-v2-service-cb-label">
                                                <input type="checkbox" name="services" value="Otro" id="pata-v2-cb-otro" class="pata-v2-service-cb-input">
                                                <span>Otro...</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div class="pata-v2-form-group" id="pata-v2-otro-input-group" style="display:none;">
                                        <input type="text" id="pata-v2-otro-service" class="pata-v2-service-text-input" placeholder="Especifica el servicio">
                                    </div>
                                    
                                    <button type="submit" class="pata-v2-btn pata-v2-btn-teal" id="wellness-submit-btn" style="width: 100%">Registrar mi centro</button>
                                    <div id="wellness-form-status" class="pata-v2-form-status"></div>
                                </form>
                            </div>
                        </div>
                    </section>

                    <!-- 8. Footer Section -->
                    <footer class="pata-v2-footer">
                        <div class="pata-v2-footer-top">
                            <div class="pata-v2-footer-contact">
                                <h3 class="pata-v2-footer-h3">Contáctanos</h3>
                                <a href="mailto:soporte@pataamiga.mx" class="pata-v2-footer-email">✉️ soporte@pataamiga.mx</a>
                                <div class="pata-v2-socials-row">
                                    <a href="https://www.instagram.com/pataamigamx" target="_blank" rel="noopener noreferrer" class="pata-v2-social-btn" aria-label="Instagram">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.8" />
                                            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8" />
                                            <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
                                        </svg>
                                    </a>
                                    <a href="https://www.facebook.com/share/14YQRpe9WzS/" target="_blank" rel="noopener noreferrer" class="pata-v2-social-btn" aria-label="Facebook">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d="M14 8.5V6.8c0-.8.5-1.3 1.3-1.3H17V2.5h-2.6C11.9 2.5 10.5 4 10.5 6.5v2h-2.5V12h2.5v9.5H14V12h2.6l.4-3.5H14z" fill="currentColor" />
                                        </svg>
                                    </a>
                                    <a href="https://www.tiktok.com/@pataamigamx" target="_blank" rel="noopener noreferrer" class="pata-v2-social-btn" aria-label="TikTok">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d="M16.5 3c.3 1.9 1.6 3.4 3.5 3.8v3.1c-1.3 0-2.5-.4-3.5-1.1v6.4c0 3.2-2.6 5.8-5.8 5.8S5 18.4 5 15.2s2.6-5.8 5.8-5.8c.3 0 .6 0 .9.1v3.2a2.7 2.7 0 1 0 1.8 2.5V3h3z" fill="currentColor" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            
                            <div class="pata-v2-footer-contact">
                                <h3 class="pata-v2-footer-h3">Suscríbete</h3>
                                <form id="pata-v2-newsletter-form" class="pata-v2-newsletter-form">
                                    <div class="pata-v2-newsletter-row">
                                        <input type="email" class="pata-v2-newsletter-input" id="newsletter-email" placeholder="Tu correo" required>
                                        <button type="submit" class="pata-v2-newsletter-btn" id="newsletter-submit-btn">Enviar</button>
                                    </div>
                                    <div id="newsletter-form-status" class="pata-v2-newsletter-status"></div>
                                    <span class="pata-v2-newsletter-desc">
                                        Te enviaremos novedades, consejos y noticias que te harán mover la cola. 🐾
                                    </span>
                                </form>
                            </div>
                        </div>

                        <!-- Secondary link lists footer -->
                        <div class="pata-v2-footer-links-grid">
                            <div class="pata-v2-footer-links-col">
                                <span class="pata-v2-footer-links-title">LEGAL</span>
                                <a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b14873e67fb7f89b1_Terminosycondiciones%20girbaz.pdf" target="_blank" rel="noopener noreferrer" class="pata-v2-footer-link">Términos y Condiciones</a>
                                <a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b6bf2c96bf1d2b123_Reglamento%20de%20Integridad.pdf" target="_blank" rel="noopener noreferrer" class="pata-v2-footer-link">Reglamento de Integridad</a>
                                <a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b1b8d0a6dc9f79e5c_Conveio%20asociado%20.pdf" target="_blank" rel="noopener noreferrer" class="pata-v2-footer-link">Convenio asociado</a>
                                <a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61adc0bfbb17c833501_AVISO%20DE%20PRIVACIDAD%20INTEGRAL.pdf" target="_blank" rel="noopener noreferrer" class="pata-v2-footer-link">Aviso de privacidad Integral</a>
                                <a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/69bc12e1761591b0dc638332_POLI%CC%81TICA%20DE%20COOKIES.pdf" target="_blank" rel="noopener noreferrer" class="pata-v2-footer-link">Política de Cookies</a>
                                <a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b8bccea76df450705_REGLAMENTO%20DEL%20FONDO%20SOLIDARIO%20CLUB%20PATA%20AMIGA.zip" target="_blank" rel="noopener noreferrer" class="pata-v2-footer-link">Reglamento de reintegros</a>
                            </div>
                            
                            <div class="pata-v2-footer-links-col">
                                <span class="pata-v2-footer-links-title">INFORMACIÓN</span>
                                <a href="#beneficios" class="pata-v2-footer-link">Beneficios</a>
                                <a href="#faq" class="pata-v2-footer-link">Dudas frecuentes</a>
                                <a href="mailto:contacto@pataamiga.mx" class="pata-v2-footer-link">Contacto</a>
                            </div>
                            
                            <div class="pata-v2-footer-links-col">
                                <span class="pata-v2-footer-links-title">COMUNIDAD</span>
                                <a href="https://www.pataamiga.mx/centros" class="pata-v2-footer-link">Centros aliados</a>
                                <a href="https://www.pataamiga.mx/centros/registro" class="pata-v2-footer-link">Quiero ser centro aliado</a>
                                <a href="https://www.pataamiga.mx/embajadores/dashboard" class="pata-v2-footer-link">Quiero ser embajador</a>
                            </div>
                        </div>

                        <!-- Copyright bottom bar -->
                        <div class="pata-v2-footer-copyright-bar">
                            <img src="${logoOnDarkUrl}" alt="Club Pata Amiga" class="pata-v2-footer-logo-img">
                            <p class="pata-v2-footer-copyright-text">
                                GIRBAZ, S.A. de C.V. y PATA AMIGA, A.C. Todos los derechos reservados. Hecho con ♡ en México.
                            </p>
                        </div>
                    </footer>

                </div>
            `;

            // Cargar y validar imágenes (si dan error usar placeholders)
            this.validateImages();

            this.attachEvents();
        }

        validateImages() {
            // Hero Image Validation
            const heroImg = this.container.querySelector('#hero-img-el');
            const heroPlaceholder = this.container.querySelector('#hero-placeholder-el');
            if (heroImg && heroPlaceholder) {
                heroImg.onerror = () => {
                    heroImg.style.display = 'none';
                    heroPlaceholder.style.display = 'flex';
                };
            }

            // Planes Image Validation
            const planesImg = this.container.querySelector('#planes-img-el');
            const planesPlaceholder = this.container.querySelector('#planes-placeholder-el');
            if (planesImg && planesPlaceholder) {
                planesImg.onerror = () => {
                    planesImg.style.display = 'none';
                    planesPlaceholder.style.display = 'grid';
                };
            }
        }

        attachEvents() {
            // Scroll suave para links internos del widget
            const registerNavLinks = (selector, targetSelector) => {
                const link = this.container.querySelector(selector);
                if (link) {
                    link.onclick = (e) => {
                        e.preventDefault();
                        const target = this.container.querySelector(targetSelector);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                        }
                    };
                }
            };

            registerNavLinks('a[href="#beneficios"]', '#beneficios');
            registerNavLinks('a[href="#faq"]', '#faq');
            registerNavLinks('#hero-price-anchor', '#planes');
            registerNavLinks('#scroll-to-partner-form-btn', '#wellness-partner-form-anchor');
            registerNavLinks('#nav-centros-btn', '#wellness-partner-form-anchor');

            // Integración de compra con Memberstack
            const buyPlansBtn = this.container.querySelector('#buy-plans-btn');

            const handlePlanPurchase = async (planType) => {
                const priceId = CONFIG.plans[planType];

                if (window.$memberstackDom && this.member) {
                    try {
                        await window.$memberstackDom.purchasePlansWithCheckout({
                            priceId: priceId,
                            successUrl: `${CONFIG.apiUrl}/completar-perfil`,
                            cancelUrl: window.location.href
                        });
                    } catch (err) {
                        console.error('Error starting checkout:', err);
                        alert('Hubo un error al iniciar el checkout. Inténtalo de nuevo.');
                    }
                } else {
                    window.location.href = `https://app.pataamiga.mx/registro?step=1&plan=${planType}`;
                }
            };

            if (buyPlansBtn) {
                buyPlansBtn.onclick = (e) => {
                    e.preventDefault();
                    // Al hacer click, redirige a la selección nativa por defecto o checkout anual si está logueado
                    handlePlanPurchase('yearly');
                };
            }

            // FAQ Accordion logic
            this.container.querySelectorAll('.pata-v2-faq-item').forEach(item => {
                const btn = item.querySelector('.pata-v2-faq-btn');
                const toggleFaq = () => {
                    const isOpen = item.classList.contains('open');

                    // Colapsar los demás acordeones
                    this.container.querySelectorAll('.pata-v2-faq-item').forEach(other => {
                        other.classList.remove('open');
                        const otherBtn = other.querySelector('.pata-v2-faq-btn');
                        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                    });

                    // Alternar estado del clickeado
                    if (!isOpen) {
                        item.classList.add('open');
                        btn.setAttribute('aria-expanded', 'true');
                    }
                };

                btn.onclick = toggleFaq;
            });

            // Toggle campo "Otro" en servicios del lead de Wellness
            const cbOtro = this.container.querySelector('#pata-v2-cb-otro');
            const otroInputGroup = this.container.querySelector('#pata-v2-otro-input-group');
            if (cbOtro && otroInputGroup) {
                cbOtro.onchange = () => {
                    otroInputGroup.style.display = cbOtro.checked ? 'block' : 'none';
                };
            }

            // Envío del Formulario de Wellness
            const wellnessForm = this.container.querySelector('#pata-v2-wellness-form');
            if (wellnessForm) {
                wellnessForm.onsubmit = async (e) => {
                    e.preventDefault();
                    if (this.isWellnessProcessing) return;

                    this.isWellnessProcessing = true;
                    const submitBtn = this.container.querySelector('#wellness-submit-btn');
                    const statusEl = this.container.querySelector('#wellness-form-status');

                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Enviando...';
                    statusEl.style.display = 'none';

                    const formData = new FormData(wellnessForm);

                    // Recoger servicios
                    const selectedServices = [];
                    this.container.querySelectorAll('input[name="services"]:checked').forEach(cb => {
                        if (cb.value !== 'Otro') {
                            selectedServices.push(cb.value);
                        }
                    });

                    const otherServiceVal = this.container.querySelector('#pata-v2-otro-service')?.value?.trim() || '';
                    if (cbOtro && cbOtro.checked && otherServiceVal) {
                        selectedServices.push(otherServiceVal);
                    }

                    const payload = {
                        establishment_name: formData.get('establishment_name') || formData.get('contact_name'),
                        contact_name: formData.get('contact_name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        services: selectedServices,
                        other_service: cbOtro && cbOtro.checked ? otherServiceVal : '',
                        source: 'webflow_home_widget_v2'
                    };

                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/webflow/wellness-lead`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });

                        const data = await res.json();

                        if (res.ok && data.success) {
                            statusEl.className = 'pata-v2-form-status success';
                            statusEl.textContent = '✨ ¡Gracias por tu interés! Nos pondremos en contacto contigo muy pronto.';
                            wellnessForm.reset();
                            if (otroInputGroup) otroInputGroup.style.display = 'none';
                        } else {
                            statusEl.className = 'pata-v2-form-status error';
                            statusEl.textContent = `❌ ${data.error || 'Ocurrió un error. Por favor inténtalo de nuevo.'}`;
                        }
                    } catch (error) {
                        console.error('Error submitting wellness lead:', error);
                        statusEl.className = 'pata-v2-form-status error';
                        statusEl.textContent = '❌ Error de conexión. Inténtalo de nuevo.';
                    } finally {
                        this.isWellnessProcessing = false;
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Registrar mi centro';
                        statusEl.style.display = 'block';
                    }
                };
            }

            // Envío de Formulario Boletín (Newsletter)
            const newsletterForm = this.container.querySelector('#pata-v2-newsletter-form');
            if (newsletterForm) {
                newsletterForm.onsubmit = async (e) => {
                    e.preventDefault();
                    if (this.isNewsletterProcessing) return;

                    this.isNewsletterProcessing = true;
                    const emailInput = this.container.querySelector('#newsletter-email');
                    const submitBtn = this.container.querySelector('#newsletter-submit-btn');
                    const statusEl = this.container.querySelector('#newsletter-form-status');

                    submitBtn.disabled = true;
                    submitBtn.textContent = '...';
                    statusEl.style.display = 'none';

                    const emailVal = emailInput.value;

                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/webflow/newsletter`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: emailVal,
                                source: 'webflow_home_widget_v2'
                            })
                        });

                        const data = await res.json();

                        if (res.ok && data.success) {
                            statusEl.className = 'pata-v2-newsletter-status success';
                            statusEl.textContent = '✨ ¡Listo! Ya eres parte de la manada informada. 🐾';
                            newsletterForm.reset();
                        } else {
                            statusEl.className = 'pata-v2-newsletter-status error';
                            statusEl.textContent = `❌ ${data.error || 'Ocurrió un error.'}`;
                        }
                    } catch (error) {
                        console.error('Error subscribing to newsletter:', error);
                        statusEl.className = 'pata-v2-newsletter-status error';
                        statusEl.textContent = '❌ Error de red.';
                    } finally {
                        this.isNewsletterProcessing = false;
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Enviar';
                        statusEl.style.display = 'block';
                    }
                };
            }
        }
    }

    // Auto-inicializar cuando el documento esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new PataHomeWidgetV2());
    } else {
        new PataHomeWidgetV2();
    }

})();
