/**
 * 🐾 Pata Amiga - Home Page Widget (Figma Modern & Clean Style)
 * 
 * Widget incrustable para Webflow que renderiza la nueva sección de inicio.
 * Optimizado para desktop y mobile, con animaciones sutiles y diseño de interfaz suave (soft UI/SaaS).
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        plans: {
            monthly: 'prc_mensual-452k30jah',
            yearly: 'prc_anual-o9d101ta'
        },
        images: {
            hero: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6a45d84c9f38a75a73cf3608_Group%202.avif',
            appMockup: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6a3a1eb79cbd8d3381436e73_image%203.avif',
            wellness: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6a3a1eb85db9290fb77ead38_xd%201.avif',
            logo: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6930687c8f64d3b129a9cece_PATA_AMIGA_LOGOTIPO_EDITABLE-02.webp'
        },
        faqs: [
            {
                category: 'Sobre Pata Amiga',
                questions: [
                    {
                        q: '¿Qué es Pata Amiga?',
                        a: 'Pata Amiga es una membresía de salud para mascotas creada para que nunca tengas que enfrentar solo los imprevistos con tu peludo.<br><br>Somos una comunidad de personas que comparten el mismo propósito: cuidar a quienes nos acompañan con amor todos los días. Por eso, cuando formas parte de la manada, cuentas con beneficios que te ayudan a cuidar su salud y a tener mayor tranquilidad.<br><br>Con una sola membresía puedes proteger hasta 3 mascotas y disfrutar de beneficios como:<br>• Reintegro en emergencias médicas, para ayudarte con gastos por urgencias, estudios, cirugía u hospitalización.<br>• Reintegro para vacunas, para impulsar el cuidado preventivo de tu peludo.<br>• Reintegro por fallecimiento, para brindarte respaldo económico en uno de los momentos más difíciles.<br>• Orientación veterinaria 24/7, para resolver dudas y recibir guía profesional cuando la necesites, estés donde estés.<br><br>Además, tu membresía tiene alcance en todo México, es 100% digital y tú decides con qué veterinario atender a tu peludo.<br><br>Porque cuando cuidamos juntos, todo se vuelve un poco más fácil.'
                    }
                ]
            },
            {
                category: 'Sobre membresía y contribuciones',
                questions: [
                    {
                        q: '¿Cuántas membresías existen?',
                        a: 'En Pata Amiga solo existe una membresía, diseñada para hacer más fácil el cuidado de tus mascotas.<br><br>Puedes elegir la modalidad que mejor se adapte a ti:<br>• Mensual: desde $159 al mes.<br>• Anual: realiza un solo pago y disfruta de todos los beneficios durante 12 meses.<br><br>Sin importar la modalidad que elijas, tendrás acceso a los mismos beneficios y podrás proteger hasta 3 mascotas con una sola membresía.'
                    },
                    {
                        q: '¿Cuánto dura la membresía?',
                        a: 'Tú decides cómo disfrutar de tu membresía: puedes contratarla en modalidad mensual o anual.<br><br>Ambas opciones cuentan con renovación automática, para que tus mascotas continúen protegidas y sigan disfrutando de todos los beneficios de Pata Amiga sin interrupciones.<br><br>Si en algún momento deseas cancelar tu renovación, puedes hacerlo de acuerdo con los términos de tu membresía.'
                    },
                    {
                        q: '¿Qué formas de contribución aceptan?',
                        a: 'Actualmente puedes adquirir tu membresía con tarjetas de crédito y débito.<br><br>Estamos trabajando para incorporar nuevas formas de pago muy pronto, para que unirte a la manada y proteger a tus mascotas sea cada vez más fácil.'
                    }
                ]
            },
            {
                category: 'Lo que incluye tu membresía',
                questions: [
                    {
                        q: '¿Con qué cuento al ser parte de la manada?',
                        a: 'Al formar parte de Pata Amiga, tú y hasta 3 mascotas podrán disfrutar de beneficios pensados para acompañarlos en cada etapa de su vida.<br><br><strong>Reintegro en emergencias médicas</strong><br>Recibe un reintegro para ayudarte con gastos por urgencias, estudios, cirugía u hospitalización cuando tu peludo más lo necesite.<br><br><strong>Reintegro para vacunas</strong><br>Porque la prevención también es una forma de cuidar. Tu membresía incluye un reintegro para apoyar el esquema de vacunación de tus mascotas.<br><br><strong>Reintegro por fallecimiento</strong><br>En uno de los momentos más difíciles, cuentas con un respaldo económico para ayudarte con los gastos derivados de la despedida de tu compañero.<br><br><strong>Orientación veterinaria 24/7</strong><br>Resuelve tus dudas y recibe guía profesional en cualquier momento, desde donde estés, para tomar las mejores decisiones sobre la salud de tu mascota.<br><br><strong>Ayudamos a más peludos juntos</strong><br>Cada vez que nuestra comunidad crece, también crece el impacto que generamos. Por cada 1,000 nuevos miembros, realizamos una donación a refugios aliados para que más perros y gatos tengan una nueva oportunidad.<br><br>Porque en Pata Amiga no solo cuidas a tus mascotas; también formas parte de una comunidad que ayuda a muchas más.'
                    }
                ]
            },
            {
                category: 'Sobre embajadores',
                questions: [
                    {
                        q: '¿Quiénes son los embajadores?',
                        a: 'Los embajadores de Pata Amiga son personas, creadores de contenido, médicos veterinarios, asociaciones y refugios aliados que comparten nuestra misión de promover el bienestar animal.<br><br>A través de sus redes, comunidades y espacios, nos ayudan a que más familias conozcan Pata Amiga y puedan proteger a sus mascotas. Como parte de este programa, reciben beneficios especiales por impulsar el crecimiento de nuestra comunidad y contribuir a que cada vez más peludos tengan acceso a una mejor calidad de vida.'
                    }
                ]
            },
            {
                category: 'Sobre la red veterinaria y de cuidado',
                questions: [
                    {
                        q: '¿Quiénes pueden ser parte de nuestra red de aliados veterinarios?',
                        a: 'Nuestra red de aliados está abierta a hospitales veterinarios, clínicas, médicos veterinarios, laboratorios, estéticas caninas y felinas, paseadores, etólogos, entrenadores, hoteles para mascotas, centros funerarios y, en general, a todos los profesionales y negocios dedicados al bienestar animal que compartan nuestra misión.<br><br>Si tu trabajo ayuda a mejorar la vida de los perros y gatos, en Pata Amiga siempre habrá un lugar para sumar esfuerzos y seguir cuidando a más peludos juntos.'
                    }
                ]
            }
        ]
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        /* Brand Colors & Variables */
        :root {
            --pata-green: #84d400;
            --pata-turquoise: #00BBB4;
            --pata-orange: #FE8F15;
            --pata-pink: #FF0063;
            --pata-black: #1b1b1b;
            --pata-gray: #eaeaea;
            --pata-white: #ffffff;
            --pata-font: 'Outfit', sans-serif;
            --pata-transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pata-home-wrapper {
            font-family: var(--pata-font);
            color: var(--pata-black);
            background: linear-gradient(90deg, #eaeaea 0%, #eaeaea 100%);
            width: 100%;
            margin: 0 auto;
            overflow-x: hidden;
            box-sizing: border-box;
        }

        .pata-home-wrapper *, .pata-home-wrapper *::before, .pata-home-wrapper *::after {
            box-sizing: border-box;
        }

        /* Container helper */
        .pata-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 80px 24px;
            width: 100%;
        }

        /* Titles */
        .pata-h1 {
            font-size: clamp(40px, 6vw, 68px);
            font-weight: 900;
            line-height: 1.1;
            margin: 0 0 24px 0;
            text-transform: uppercase;
            letter-spacing: -1.5px;
        }

        .pata-h1 span.green-text {
            color: var(--pata-green);
        }

        .pata-h2 {
            font-size: clamp(32px, 5vw, 48px);
            font-weight: 900;
            line-height: 1.2;
            margin: 0 0 16px 0;
            text-transform: uppercase;
            text-align: center;
        }

        .pata-section-subtitle {
            font-size: 18px;
            color: rgba(27, 27, 27, 0.7);
            text-align: center;
            margin-bottom: 48px;
            font-weight: 500;
        }

        /* Premium Soft SaaS buttons (No Black Borders) */
        .pata-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 16px 36px;
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: var(--pata-transition);
            text-decoration: none;
            position: relative;
            background: var(--pata-green);
            color: var(--pata-black);
            box-shadow: 0px 10px 15px -3px rgba(132, 212, 0, 0.2), 0px 4px 6px -4px rgba(132, 212, 0, 0.2);
        }

        .pata-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0px 12px 20px -3px rgba(132, 212, 0, 0.35), 0px 6px 10px -4px rgba(132, 212, 0, 0.35);
            filter: brightness(1.05);
        }

        .pata-btn:active {
            transform: translateY(1px);
            box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06);
        }

        .pata-btn:focus-visible,
        .pata-btn-green-wellness:focus-visible,
        .pata-faq-summary:focus-visible,
        .pata-nav-item a:focus-visible,
        .pata-contact-link:focus-visible,
        .pata-social-icon:focus-visible {
            outline: 3px solid rgba(0, 187, 180, 0.65);
            outline-offset: 4px;
        }

        .pata-btn-black {
            background: var(--pata-black);
            color: var(--pata-white);
            box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1);
        }

        .pata-btn-black:hover {
            box-shadow: 0px 12px 20px -3px rgba(0, 0, 0, 0.2), 0px 6px 10px -4px rgba(0, 0, 0, 0.2);
            background: #2a2a2a;
        }

        .pata-btn-orange {
            background: var(--pata-orange);
            color: var(--pata-white);
            box-shadow: 0px 10px 15px -3px rgba(254, 143, 21, 0.2), 0px 4px 6px -4px rgba(254, 143, 21, 0.2);
        }

        .pata-btn-orange:hover {
            box-shadow: 0px 12px 20px -3px rgba(254, 143, 21, 0.35), 0px 6px 10px -4px rgba(254, 143, 21, 0.35);
        }

        .pata-btn-pink {
            background: var(--pata-pink);
            color: var(--pata-white);
            box-shadow: 0px 10px 15px -3px rgba(255, 0, 99, 0.2);
        }

        .pata-btn-pink:hover {
            box-shadow: 0px 12px 20px -3px rgba(255, 0, 99, 0.35);
        }

        .pata-btn:disabled {
            background: #cccccc;
            color: #666666;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* 1. Hero Section */
        .pata-hero-section {
            background: linear-gradient(180deg, #eaeaea 0%, #eaeaea 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 80px;
            max-width: 1400px;
        }

        .pata-hero-content {
            flex: 1.2;
            max-width: 680px;
        }

        .pata-hero-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 32px;
        }

        .pata-hero-bullet {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 600;
            color: rgba(27, 27, 27, 0.8);
        }

        .pata-bullet-check {
            width: 22px;
            height: 19px;
            flex-shrink: 0;
            background-repeat: no-repeat;
            background-size: contain;
            background-image: url('data:image/svg+xml;utf8,<svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 9.5L7.5 15.5L20 2" stroke="%2384d400" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
        }

        .pata-hero-image-container {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            max-width: 580px;
        }

        .pata-hero-image-wrapper {
            width: 100%;
            border-radius: 40px;
            overflow: hidden;
            box-shadow: 0px 25px 50px -12px rgba(0, 0, 0, 0.25);
            aspect-ratio: 1441/1466;
        }

        .pata-hero-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        /* 2. Suscríbete Section */
        .pata-pricing-section {
            background: #f7f7f7;
        }

        .pata-pricing-grid {
            display: flex;
            justify-content: center;
            gap: 40px;
            flex-wrap: wrap;
            max-width: 1000px;
            margin: 0 auto;
        }

        .pata-pricing-card {
            background: var(--pata-white);
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 25px;
            padding: 48px;
            flex: 1;
            min-width: 320px;
            max-width: 460px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            position: relative;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
            transition: var(--pata-transition);
        }

        .pata-pricing-card:hover {
            transform: translateY(-5px);
            box-shadow: 0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .pata-card-badge {
            display: inline-block;
            background: #eaeaea;
            color: rgba(27, 27, 27, 0.6);
            font-size: 11px;
            font-weight: 800;
            padding: 6px 14px;
            border-radius: 20px;
            align-self: flex-start;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .pata-pricing-card.popular {
            border: 2px solid var(--pata-green);
        }

        .pata-pricing-card.popular .pata-card-badge {
            background: rgba(132, 212, 0, 0.1);
            color: #3f6900;
        }

        .pata-discount-tag {
            position: absolute;
            top: -16px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--pata-pink);
            color: var(--pata-white);
            font-size: 12px;
            font-weight: 900;
            padding: 8px 24px;
            border-radius: 25px;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
        }

        .pata-card-title {
            font-size: 32px;
            font-weight: 900;
            margin: 0;
        }

        .pata-price-row {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-top: -8px;
        }

        .pata-price-amount {
            font-size: 36px;
            font-weight: 900;
        }

        .pata-price-period {
            font-size: 16px;
            color: rgba(27, 27, 27, 0.5);
            font-weight: 600;
        }

        .pata-card-features {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .pata-feature-row {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 500;
            color: rgba(27, 27, 27, 0.7);
        }

        .pata-feature-row .check-icon {
            width: 16px;
            height: 16px;
            background-repeat: no-repeat;
            background-size: contain;
            background-image: url('data:image/svg+xml;utf8,<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 8.5L6.5 12.5L14 3.5" stroke="%231b1b1b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>');
        }

        /* 3. Todo lo que tu mascota necesita Section */
        .pata-services-section {
            background: var(--pata-white);
        }

        .pata-services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 32px;
            width: 100%;
        }

        .pata-service-card {
            background: var(--pata-white);
            border: 1px solid rgba(0,0,0,0.05);
            border-radius: 25px;
            padding: 40px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: 0px 4px 20px 0px rgba(0,0,0,0.05);
            transition: var(--pata-transition);
        }

        .pata-service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0px 15px 30px rgba(0,0,0,0.08);
        }

        .pata-service-icon-bg {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pata-service-icon {
            font-size: 28px;
        }

        .pata-service-img-icon {
            width: 36px;
            height: 36px;
            object-fit: contain;
        }

        .pata-service-title {
            font-size: 24px;
            font-weight: 800;
            margin: 0;
        }

        .pata-service-desc {
            font-size: 16px;
            line-height: 1.5;
            color: rgba(27, 27, 27, 0.7);
            margin: 0;
        }

        /* 4. ¿Cómo funciona? Section */
        .pata-how-section {
            background: linear-gradient(180deg, #eaeaea 0%, #eaeaea 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 60px;
        }

        .pata-how-image-container {
            flex: 1;
            display: flex;
            justify-content: center;
            max-width: 500px;
        }

        .pata-how-image-wrapper {
            width: 100%;
            max-width: 270px;
            border-radius: 25px;
            overflow: hidden;
            box-shadow: 0px 25px 50px -12px rgba(0,0,0,0.25);
            aspect-ratio: 267/512;
        }

        .pata-how-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .pata-how-content {
            flex: 1.2;
            max-width: 580px;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .pata-how-steps {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .pata-step {
            display: flex;
            align-items: center;
            gap: 24px;
        }

        .pata-step-number {
            width: 48px;
            height: 48px;
            border-radius: 24px;
            background: var(--pata-black);
            color: var(--pata-white);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 700;
            flex-shrink: 0;
        }

        .pata-step-text {
            font-size: 22px;
            font-weight: 700;
            color: var(--pata-black);
        }

        /* 5. FAQ Section */
        .pata-faq-section-wrapper {
            background: rgba(248, 249, 255, 0.5);
            border-top: 1px solid rgba(0,0,0,0.05);
            border-bottom: 1px solid rgba(0,0,0,0.05);
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
        }

        .pata-faq-container {
            width: 100%;
            margin: 0 auto;
        }

        .pata-faq-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .pata-faq-item {
            background: var(--pata-white);
            border: 1px solid rgba(0,0,0,0.05);
            border-radius: 24px;
            overflow: hidden;
            transition: var(--pata-transition);
        }

        .pata-faq-summary {
            padding: 24px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
            background: rgba(132, 212, 0, 0.05);
            transition: background 0.2s ease;
        }

        .pata-faq-summary:hover {
            background: rgba(132, 212, 0, 0.1);
        }

        .pata-faq-title {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
        }

        .pata-faq-arrow {
            width: 14px;
            height: 8px;
            transition: transform 0.3s ease;
            background-repeat: no-repeat;
            background-size: contain;
            background-image: url('data:image/svg+xml;utf8,<svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L7 7L13 1" stroke="%231b1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
        }

        .pata-faq-item.open .pata-faq-arrow {
            transform: rotate(180deg);
        }

        .pata-faq-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s cubic-bezier(0, 1, 0, 1);
            padding: 0 32px;
        }

        .pata-faq-item.open .pata-faq-content {
            max-height: 2000px;
            padding: 24px 32px;
            border-top: 1.5px solid rgba(0,0,0,0.05);
        }

        .pata-faq-category-body {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .pata-faq-qa {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-faq-question {
            font-size: 16px;
            font-weight: 800;
            color: var(--pata-black);
        }

        .pata-faq-answer {
            font-size: 15px;
            line-height: 1.5;
            color: rgba(27, 27, 27, 0.7);
        }

        /* 6. Centros de Bienestar Section */
        .pata-wellness-section {
            background: #ffffff;
            display: flex;
            align-items: stretch;
            gap: 64px;
            padding: 0;
        }

        .pata-wellness-form-column {
            flex: 1;
            padding: 80px 24px 80px 80px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .pata-wellness-info {
            max-width: 576px;
            margin-bottom: 32px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
        }

        .pata-wellness-tag {
            font-size: 14px;
            font-weight: 700;
            color: var(--pata-green);
            letter-spacing: 1.4px;
            text-transform: uppercase;
            margin: 0 0 16px 0;
        }

        .pata-wellness-heading {
            font-size: clamp(36px, 6vw, 72px);
            font-weight: 900;
            line-height: 1.0;
            letter-spacing: -1.8px;
            margin: 0 0 16px 0;
            color: var(--pata-black);
        }

        .pata-wellness-heading span.green-text {
            color: var(--pata-green);
        }

        .pata-wellness-subtitle {
            font-size: 20px;
            font-weight: 600;
            color: rgba(27, 27, 27, 0.8);
            margin: 0 0 12px 0;
            line-height: 1.4;
        }

        .pata-wellness-desc {
            font-size: 16px;
            font-weight: 400;
            line-height: 1.6;
            color: rgba(27, 27, 27, 0.7);
            margin: 0;
        }

        .pata-wellness-box {
            background: var(--pata-white);
            border: 1px solid rgba(0,0,0,0.05);
            border-radius: 35px;
            padding: 40px;
            box-shadow: 0px 25px 50px -12px rgba(0,0,0,0.1);
            max-width: 500px;
        }

        .pata-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
        }

        .pata-form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-form-group.full-width {
            grid-column: span 2;
        }

        .pata-form-label {
            font-size: 13px;
            font-weight: 700;
            padding-left: 8px;
            text-transform: uppercase;
        }

        .pata-form-input {
            width: 100%;
            padding: 16px 20px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 50px;
            font-family: var(--pata-font);
            font-size: 15px;
            font-weight: 600;
            outline: none;
            transition: var(--pata-transition);
        }

        .pata-form-input:focus {
            border-color: var(--pata-turquoise);
            box-shadow: 0px 0px 0px 3px rgba(0, 187, 180, 0.15);
        }

        .pata-form-select {
            appearance: none;
            background-image: url('data:image/svg+xml;utf8,<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L11 1" stroke="%231b1b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
            background-repeat: no-repeat;
            background-position: right 24px center;
            background-size: 12px;
            padding-right: 48px;
        }

        .pata-wellness-image-column {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FFF;
        }

        .pata-wellness-img-wrapper {
            width: 100%;
            height: 100%;
            min-height: 600px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pata-wellness-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .pata-form-status {
            font-size: 14px;
            font-weight: 700;
            padding-left: 8px;
            margin-top: 12px;
            display: none;
        }

        .pata-form-status.success { color: #2E7D32; display: block; }
        .pata-form-status.error { color: #C62828; display: block; }

        /* 7. Footer Section */
        .pata-footer-section {
            background: #eaeaea;
            border-top: 1px solid rgba(0,0,0,0.05);
        }

        .pata-footer-top {
            display: flex;
            justify-content: space-between;
            gap: 64px;
            margin-bottom: 64px;
            flex-wrap: wrap;
        }

        .pata-footer-col {
            flex: 1;
            min-width: 280px;
        }

        .pata-footer-title {
            font-size: 36px;
            font-weight: 900;
            color: var(--pata-pink);
            margin: 0 0 24px 0;
            text-transform: uppercase;
        }

        .pata-newsletter-title {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 16px 0;
            text-transform: uppercase;
        }

        .pata-contact-item {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .pata-contact-icon-bg {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            border: 1px solid rgba(0,0,0,0.05);
            background: var(--pata-white);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0px 4px 10px rgba(0,0,0,0.05);
        }

        .pata-contact-link {
            font-size: 16px;
            font-weight: 700;
            color: var(--pata-black);
            text-decoration: none;
        }

        .pata-contact-link:hover {
            color: var(--pata-turquoise);
        }

        .pata-socials {
            display: flex;
            gap: 16px;
        }

        .pata-social-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            background: transparent;
            border: none;
            box-shadow: none;
            transition: var(--pata-transition);
        }

        .pata-social-icon:hover {
            transform: translateY(-2px);
            opacity: 0.8;
        }

        .pata-newsletter-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 16px;
        }

        .pata-newsletter-text {
            font-size: 14px;
            line-height: 1.4;
            color: rgba(27,27,27,0.6);
            font-weight: 600;
        }

        /* Nav Section */
        .pata-footer-nav {
            border-top: 1px solid rgba(0,0,0,0.05);
            padding-top: 48px;
            margin-bottom: 48px;
        }

        .pata-nav-title {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 24px 0;
            text-transform: uppercase;
        }

        .pata-nav-cols {
            display: flex;
            gap: 40px;
            flex-wrap: wrap;
        }

        .pata-nav-col {
            flex: 1;
            min-width: 200px;
        }

        .pata-nav-heading {
            font-size: 14px;
            font-weight: 900;
            color: var(--pata-black);
            margin: 0 0 16px 0;
            letter-spacing: 1px;
        }

        .pata-nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-nav-item a {
            font-size: 14px;
            color: rgba(27, 27, 27, 0.7);
            text-decoration: none;
            font-weight: 600;
        }

        .pata-nav-item a:hover {
            color: var(--pata-turquoise);
            text-decoration: underline;
        }

        /* Copyright */
        .pata-footer-copyright {
            border-top: 1px solid rgba(0,0,0,0.05);
            padding-top: 24px;
            font-size: 14px;
            color: rgba(27, 27, 27, 0.4);
            font-weight: 600;
            text-align: left;
        }

        .pata-loading-spinner {
            width: 18px;
            height: 18px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: pataSpin 0.8s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }

        @keyframes pataSpin {
            to { transform: rotate(360deg); }
        }

        /* Responsive Layouts */
        @media (max-width: 900px) {
            .pata-hero-section {
                flex-direction: column;
                text-align: center;
                gap: 32px;
            }

            .pata-hero-content {
                max-width: 100%;
            }

            .pata-hero-grid {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                max-width: 290px;
                margin: 0 auto 24px auto;
                gap: 12px;
            }

            .pata-hero-bullet {
                justify-content: flex-start;
                text-align: left;
            }

            .pata-hero-image-container {
                max-width: 100%;
                width: 100%;
            }

            .pata-how-section {
                flex-direction: column;
                gap: 48px;
            }

            .pata-how-image-container {
                max-width: 100%;
                order: 2;
            }

            .pata-how-content {
                max-width: 100%;
                order: 1;
            }

            .pata-wellness-section {
                flex-direction: column;
            }

            .pata-wellness-form-column {
                padding: 64px 24px;
                align-items: center;
            }

            .pata-wellness-info {
                text-align: center;
                align-items: center;
                max-width: 100%;
            }

            .pata-wellness-box {
                width: 100%;
            }

            .pata-wellness-image-column {
                display: none;
            }
        }

        @media (max-width: 600px) {
            .pata-container {
                padding: 38px 16px;
            }

            .pata-h1 {
                font-size: 29px;
                line-height: 1.08;
                margin-bottom: 14px;
            }

            .pata-h2 {
                font-size: clamp(28px, 9vw, 38px);
                margin-bottom: 10px;
            }

            .pata-section-subtitle {
                font-size: 15px;
                margin-bottom: 28px;
            }

            .pata-hero-section {
                gap: 24px;
                padding-top: 30px;
                padding-bottom: 34px;
            }

            .pata-hero-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                max-width: 330px;
                margin-bottom: 16px;
                gap: 7px 10px;
            }

            .pata-hero-bullet {
                gap: 7px;
                font-size: 12px;
                line-height: 1.18;
            }

            .pata-bullet-check {
                width: 15px;
                height: 13px;
            }

            .pata-btn,
            .pata-btn-green-wellness {
                width: 100%;
                max-width: 340px;
                min-height: 52px;
                padding-inline: 22px;
                white-space: normal;
            }

            .pata-hero-image-wrapper {
                width: 230px;
                margin: 0 auto;
                border-radius: 28px;
                box-shadow: 0px 16px 32px -16px rgba(0, 0, 0, 0.28);
            }

            .pata-pricing-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                width: 100%;
            }

            .pata-pricing-card {
                min-width: 0;
                max-width: none;
                padding: 22px 12px 14px;
                gap: 13px;
                border-radius: 18px;
            }

            .pata-discount-tag {
                top: -12px;
                font-size: 9px;
                padding: 6px 12px;
                letter-spacing: 0.5px;
            }

            .pata-card-badge {
                font-size: 9px;
                padding: 5px 9px;
                letter-spacing: 0.5px;
            }

            .pata-card-title {
                font-size: 15px;
                line-height: 1.1;
            }

            .pata-price-row {
                flex-wrap: wrap;
                gap: 2px 5px;
                margin-top: -4px;
            }

            .pata-price-amount {
                font-size: 20px;
                line-height: 1.05;
            }

            .pata-price-period {
                font-size: 12px;
            }

            .pata-card-features {
                gap: 10px;
            }

            .pata-feature-row {
                align-items: flex-start;
                gap: 8px;
                font-size: 12px;
                line-height: 1.25;
            }

            .pata-feature-row .check-icon {
                width: 13px;
                height: 13px;
                margin-top: 1px;
                flex: 0 0 13px;
            }

            .pata-pricing-card .pata-btn {
                min-height: 42px;
                padding: 10px 8px;
                font-size: 10px;
                letter-spacing: 0.5px;
            }

            .pata-form-grid {
                grid-template-columns: 1fr;
            }

            .pata-form-group.full-width {
                grid-column: span 1;
            }

            .pata-faq-summary {
                padding: 20px 24px;
            }

            .pata-faq-item.open .pata-faq-content {
                padding: 20px 24px;
            }
        }

        /* Wellness form overrides matching Figma image */
        .pata-form-row-two {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
        }

        @media (max-width: 600px) {
            .pata-form-row-two {
                grid-template-columns: 1fr;
                gap: 12px;
            }
        }

        .pata-phone-input-row {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        @media (max-width: 420px) {
            .pata-phone-input-row {
                flex-wrap: wrap;
            }

            .pata-phone-prefix,
            .pata-phone-input-row .pata-form-input {
                width: 100%;
            }
        }

        .pata-phone-prefix {
            background-color: #eaeaea;
            border-radius: 50px;
            padding: 16px 24px;
            font-size: 15px;
            font-weight: 700;
            color: var(--pata-black);
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pata-checkbox-pill-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        @media (max-width: 500px) {
            .pata-checkbox-pill-grid {
                grid-template-columns: 1fr;
            }
        }

        .pata-checkbox-pill-label {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: #f2f2f2;
            border-radius: 50px;
            padding: 0 16px;
            height: 54px;
            cursor: pointer;
            user-select: none;
            transition: var(--pata-transition);
            box-sizing: border-box;
        }

        .pata-checkbox-pill-label:hover {
            background-color: #e8e8e8;
        }

        .pata-checkbox-pill-input {
            display: none;
        }

        /* Checkbox circle indicator */
        .pata-checkbox-pill-circle {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #ccc;
            background-color: #fff;
            display: inline-block;
            position: relative;
            flex-shrink: 0;
            transition: var(--pata-transition);
        }

        .pata-checkbox-pill-input:checked + .pata-checkbox-pill-circle {
            border-color: var(--pata-green);
            background-color: var(--pata-green);
        }

        .pata-checkbox-pill-input:checked + .pata-checkbox-pill-circle::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #fff;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        .pata-checkbox-pill-text {
            font-size: 13px;
            font-weight: 600;
            color: var(--pata-black);
            line-height: 1.15;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .pata-otro-input-pill {
            border: 1px solid transparent;
        }

        .pata-otro-input-pill:focus-within {
            background-color: #ffffff;
            border-color: var(--pata-turquoise);
            box-shadow: 0px 0px 0px 3px rgba(0, 187, 180, 0.15);
        }

        .pata-checkbox-pill-text-input {
            background: transparent;
            border: none;
            width: 100%;
            height: 100%;
            outline: none;
            font-family: var(--pata-font);
            font-size: 13px;
            font-weight: 600;
            color: var(--pata-black);
            padding: 0;
        }

        /* Inputs within wellness box styling override */
        .pata-wellness-box .pata-form-input {
            background-color: #f2f2f2;
            border: none;
        }

        .pata-wellness-box .pata-form-input:focus {
            background-color: #fff;
            border: 1px solid var(--pata-turquoise);
        }

        /* Green submit button for wellness */
        .pata-btn-green-wellness {
            background-color: var(--pata-green);
            color: var(--pata-black);
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: none;
            border-radius: 50px;
            padding: 18px 36px;
            box-shadow: 0px 8px 16px rgba(132, 212, 0, 0.2);
            cursor: pointer;
            transition: var(--pata-transition);
        }

        .pata-btn-green-wellness:hover {
            transform: translateY(-2px);
            box-shadow: 0px 12px 24px rgba(132, 212, 0, 0.35);
            filter: brightness(1.05);
        }

        /* Scroll Animations */
        .pata-animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: transform, opacity;
        }

        .pata-animate-on-scroll.pata-visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;

    class PataHomeWidget {
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

            // Esperar a Memberstack
            if (window.$memberstackDom) {
                try {
                    const member = await window.$memberstackDom.getCurrentMember();
                    this.member = member?.data;
                } catch (e) {
                    console.error('Error fetching memberstack session:', e);
                }
            }

            this.render();
        }

        injectStyles() {
            if (document.getElementById('pata-home-widget-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-home-widget-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        render() {
            if (!this.container) return;

            this.container.innerHTML = `
                <div class="pata-home-wrapper">
                    
                    <!-- 1. Hero Section -->
                    <div class="pata-container pata-hero-section">
                        <div class="pata-hero-content pata-animate-on-scroll">
                            <h1 class="pata-h1">Membresía de Salud<br><span class="green-text">para tu mascota</span></h1>
                            
                            <div class="pata-hero-grid">
                                <div class="pata-hero-bullet">
                                    <div class="pata-bullet-check"></div>
                                    <span>Alcance en todo México</span>
                                </div>
                                <div class="pata-hero-bullet">
                                    <div class="pata-bullet-check"></div>
                                    <span>Mantienes a tu veterinario</span>
                                </div>
                                <div class="pata-hero-bullet">
                                    <div class="pata-bullet-check"></div>
                                    <span>Incluye hasta 3 mascotas</span>
                                </div>
                                <div class="pata-hero-bullet">
                                    <div class="pata-bullet-check"></div>
                                    <span>Orientación veterinaria 24/7</span>
                                </div>
                                <div class="pata-hero-bullet">
                                    <div class="pata-bullet-check"></div>
                                    <span>Ayudas a refugios</span>
                                </div>
                                <div class="pata-hero-bullet">
                                    <div class="pata-bullet-check"></div>
                                    <span>100% digital</span>
                                </div>
                            </div>

                            <button class="pata-btn pata-btn-orange" id="hero-cta-btn">Obtén tu membresía</button>
                        </div>

                        <div class="pata-hero-image-container pata-animate-on-scroll">
                            <div class="pata-hero-image-wrapper">
                                <img src="${CONFIG.images.hero}" alt="Mascota feliz con su dueño" class="pata-hero-img" width="1441" height="1466" loading="eager" fetchpriority="high" decoding="async" referrerpolicy="no-referrer">
                            </div>
                        </div>
                    </div>

                    <!-- 2. Pricing Section -->
                    <div class="pata-pricing-section" id="pricing-section">
                        <div class="pata-container pata-animate-on-scroll">
                            <h2 class="pata-h2">Suscríbete</h2>
                            <p class="pata-section-subtitle">Elige la membresía que mejor se adapte a ti y a tu mascota</p>
                            
                            <div class="pata-pricing-grid">
                                
                                <!-- Plan Mensual -->
                                <div class="pata-pricing-card">
                                    <span class="pata-card-badge">Flexibilidad</span>
                                    <h3 class="pata-card-title">Suscripción Mensual</h3>
                                    <div class="pata-price-row">
                                        <span class="pata-price-amount">$159 MXN</span>
                                        <span class="pata-price-period">/ mes</span>
                                    </div>
                                    <ul class="pata-card-features">
                                        <li class="pata-feature-row">
                                            <span class="check-icon"></span>
                                            <span>Sin plazos forzosos</span>
                                        </li>
                                        <li class="pata-feature-row">
                                            <span class="check-icon"></span>
                                            <span>Atención 24/7 incluida</span>
                                        </li>
                                    </ul>
                                    <button class="pata-btn pata-btn-black" style="margin-top:auto" id="buy-monthly-btn">Suscribirme Mensual</button>
                                </div>

                                <!-- Plan Anual -->
                                <div class="pata-pricing-card popular">
                                    <span class="pata-discount-tag">Ahorra 10%</span>
                                    <span class="pata-card-badge">Mejor valor</span>
                                    <h3 class="pata-card-title">Suscripción Anual</h3>
                                    <div class="pata-price-row">
                                        <span class="pata-price-amount">$1,699 MXN</span>
                                        <span class="pata-price-period">/ año</span>
                                    </div>
                                    <ul class="pata-card-features">
                                        <li class="pata-feature-row">
                                            <span class="check-icon"></span>
                                            <span>Tranquilidad por 365 días</span>
                                        </li>
                                        <li class="pata-feature-row">
                                            <span class="check-icon"></span>
                                            <span>Prioridad en reembolsos</span>
                                        </li>
                                    </ul>
                                    <button class="pata-btn" style="margin-top:auto" id="buy-yearly-btn">Suscribirme Anual</button>
                                </div>

                            </div>
                        </div>
                    </div>

                    <!-- 3. Todo lo que tu mascota necesita Section -->
                    <div class="pata-services-section">
                        <div class="pata-container pata-animate-on-scroll">
                            <p style="text-transform:uppercase; text-align:center; font-weight:800; color:#3f6900; letter-spacing:1px; margin:0 0 12px 0">reintegro</p>
                            <h2 class="pata-h2">Todo lo que tu mascota necesita</h2>
                            
                            <div class="pata-services-grid">
                                
                                <!-- Emergencias -->
                                <div class="pata-service-card">
                                    <div class="pata-service-icon-bg" style="background: rgba(132, 212, 0, 0.1)">
                                        <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6a3a2ba555c21a920f934c1a_emergencias.svg" alt="Emergencias" class="pata-service-img-icon" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                    </div>
                                    <h3 class="pata-service-title">Emergencias</h3>
                                    <p class="pata-service-desc">Reintegro de hasta $3,000 MXN para urgencias, análisis y estudios, cirugía y hospitalización.</p>
                                </div>

                                <!-- Prevención -->
                                <div class="pata-service-card">
                                    <div class="pata-service-icon-bg" style="background: rgba(255, 189, 0, 0.1)">
                                        <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6a3a2ba529ac04b87511dc4c_prevencion.svg" alt="Prevención" class="pata-service-img-icon" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                    </div>
                                    <h3 class="pata-service-title">Prevención</h3>
                                    <p class="pata-service-desc">Reintegro de hasta $300 MXN para sus vacunas anuales.</p>
                                </div>

                                <!-- Apoyo por Fallecimiento -->
                                <div class="pata-service-card">
                                    <div class="pata-service-icon-bg" style="background: rgba(254, 143, 21, 0.1)">
                                        <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6a3a2ba51de4757f932ce432_apoyo%20por%20fallecimiento.svg" alt="Apoyo por fallecimiento" class="pata-service-img-icon" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                    </div>
                                    <h3 class="pata-service-title">Apoyo por fallecimiento</h3>
                                    <p class="pata-service-desc">Reintegro de hasta $2,000 MXN en caso de fallecimiento, para su despedida digna.</p>
                                </div>

                            </div>
                        </div>
                    </div>

                    <!-- 4. ¿Cómo funciona? Section -->
                    <div class="pata-container pata-how-section pata-animate-on-scroll">
                        <div class="pata-how-image-container">
                            <div class="pata-how-image-wrapper">
                                <img src="${CONFIG.images.appMockup}" alt="Aplicación de Pata Amiga" class="pata-how-img" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                            </div>
                        </div>

                        <div class="pata-how-content">
                            <h2 class="pata-h2" style="text-align:left">¿Cómo funciona?</h2>
                            
                            <div class="pata-how-steps">
                                <div class="pata-step">
                                    <div class="pata-step-number">01</div>
                                    <span class="pata-step-text">Vas a tu veterinario de confianza</span>
                                </div>
                                <div class="pata-step">
                                    <div class="pata-step-number">02</div>
                                    <span class="pata-step-text">Subes la foto de la factura</span>
                                </div>
                                <div class="pata-step">
                                    <div class="pata-step-number">03</div>
                                    <span class="pata-step-text">Transferimos tu reintegro en 72hs</span>
                                </div>
                            </div>

                            <button class="pata-btn pata-btn-orange" id="how-cta-btn" style="align-self:flex-start">Únete a la manada</button>
                        </div>
                    </div>

                    <!-- 5. FAQ Section -->
                    <div class="pata-faq-section-wrapper" id="faq-section">
                        <div class="pata-container pata-animate-on-scroll">
                            <h2 class="pata-h2">Preguntas Frecuentes</h2>
                            <p class="pata-section-subtitle">Resolvemos tus dudas de manera clara y directa.</p>
                            
                            <div class="pata-faq-container">
                                <div class="pata-faq-list">
                                    ${CONFIG.faqs.map((cat, idx) => `
                                        <div class="pata-faq-item" data-index="${idx}">
                                            <div class="pata-faq-summary" role="button" tabindex="0" aria-expanded="false">
                                                <h3 class="pata-faq-title">${cat.category}</h3>
                                                <div class="pata-faq-arrow"></div>
                                            </div>
                                            <div class="pata-faq-content">
                                                <div class="pata-faq-category-body">
                                                    ${cat.questions.map(q => `
                                                        <div class="pata-faq-qa">
                                                            <span class="pata-faq-question">${q.q}</span>
                                                            <span class="pata-faq-answer">${q.a}</span>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 6. Red veterinaria y de cuidado Section -->
                    <div class="pata-wellness-section pata-animate-on-scroll" id="wellness-section">
                        <div class="pata-wellness-form-column">
                            <div class="pata-wellness-info">
                                <div class="pata-wellness-tag">PRÓXIMAMENTE 2026</div>
                                <h2 class="pata-wellness-heading">red veterinaria <br><span class="green-text">y de cuidado</span></h2>
                                <h3 class="pata-wellness-subtitle">La red de cuidado más grande para mascotas</h3>
                                <p class="pata-wellness-desc">
                                    Estamos construyendo una red de clínicas veterinarias, hospitales y negocios pet-friendly que compartan nuestros valores de cuidado, empatía y responsabilidad. Muy pronto podrás registrar tu establecimiento y recibir solicitudes de orientación de miembros de la manada.
                                </p>
                            </div>

                            <div class="pata-wellness-box">
                                <form id="pata-wellness-form">
                                    <!-- Row 1: Nombre(s) y apellido / Correo electrónico -->
                                    <div class="pata-form-row-two">
                                        <div class="pata-form-group">
                                            <input type="text" class="pata-form-input" name="contact_name" placeholder="Nombre(s) y apellido" required>
                                        </div>
                                        <div class="pata-form-group">
                                            <input type="email" class="pata-form-input" name="email" placeholder="Correo electrónico" required>
                                        </div>
                                    </div>

                                    <!-- Row 2: Teléfono -->
                                    <div class="pata-form-group">
                                        <label class="pata-form-label" style="text-transform: none; font-size: 15px; font-weight: 700; margin-bottom: 8px;">Número de teléfono</label>
                                        <div class="pata-phone-input-row">
                                            <div class="pata-phone-prefix">MX +52</div>
                                            <input type="tel" class="pata-form-input" name="phone" placeholder="123 123 1234" required>
                                        </div>
                                    </div>

                                    <!-- Row 3: Tipo de establecimiento checkboxes -->
                                    <div class="pata-form-group" style="margin-top: 24px;">
                                        <label class="pata-form-label" style="text-transform: none; font-size: 15px; font-weight: 700; margin-bottom: 12px;">Tipo de establecimiento</label>
                                        <div class="pata-checkbox-pill-grid">
                                            <label class="pata-checkbox-pill-label">
                                                <input type="checkbox" name="services" value="Clínica veterinaria" class="pata-checkbox-pill-input">
                                                <span class="pata-checkbox-pill-circle"></span>
                                                <span class="pata-checkbox-pill-text">Clínica veterinaria</span>
                                            </label>
                                            <label class="pata-checkbox-pill-label">
                                                <input type="checkbox" name="services" value="Hospital 24/7" class="pata-checkbox-pill-input">
                                                <span class="pata-checkbox-pill-circle"></span>
                                                <span class="pata-checkbox-pill-text">Hospital 24/7</span>
                                            </label>
                                            <label class="pata-checkbox-pill-label">
                                                <input type="checkbox" name="services" value="Tienda de mascotas" class="pata-checkbox-pill-input">
                                                <span class="pata-checkbox-pill-circle"></span>
                                                <span class="pata-checkbox-pill-text">Tienda de mascotas</span>
                                            </label>
                                            <label class="pata-checkbox-pill-label">
                                                <input type="checkbox" name="services" value="Hotel" class="pata-checkbox-pill-input">
                                                <span class="pata-checkbox-pill-circle"></span>
                                                <span class="pata-checkbox-pill-text">Hotel</span>
                                            </label>
                                            <label class="pata-checkbox-pill-label">
                                                <input type="checkbox" name="services" value="Paseador de perros" class="pata-checkbox-pill-input">
                                                <span class="pata-checkbox-pill-circle"></span>
                                                <span class="pata-checkbox-pill-text">Paseador de perros</span>
                                            </label>
                                            <div class="pata-checkbox-pill-label pata-otro-input-pill">
                                                <input type="text" id="pata-otro-service-input" name="other_service" class="pata-checkbox-pill-text-input" placeholder="Otro...">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Submit button & Status -->
                                    <div style="margin-top: 24px;">
                                        <button type="submit" class="pata-btn-green-wellness" style="width: 100%" id="wellness-submit-btn">REGISTRAR MI CENTRO</button>
                                    </div>
                                    <div id="wellness-form-status" class="pata-form-status"></div>
                                </form>
                            </div>
                        </div>

                        <div class="pata-wellness-image-column">
                            <div class="pata-wellness-img-wrapper">
                                <img src="${CONFIG.images.wellness}" alt="Red veterinaria y de cuidado Pata Amiga" class="pata-wellness-img" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                            </div>
                        </div>
                    </div>

                    <!-- 7. Footer Section -->
                    <div class="pata-container pata-footer-section">
                        <div class="pata-footer-top">
                            <div class="pata-footer-col">
                                <h2 class="pata-footer-title">Contáctanos</h2>
                                <div class="pata-contact-item">
                                    <div class="pata-contact-icon-bg">
                                        <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6a3a3350c708e1ff5594a139_mail%20icon.svg" alt="Email" style="width: 24px; height: 24px; object-fit: contain;" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                    </div>
                                    <a href="mailto:soporte@pataamiga.mx" class="pata-contact-link">soporte@pataamiga.mx</a>
                                </div>
                                <div class="pata-socials">
                                    <a href="https://www.instagram.com/pataamigamx" target="_blank" rel="noopener noreferrer" class="pata-social-icon">
                                        <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698ba31dfc45e778d44da0d1_ig%202.svg" alt="Instagram" style="width: 24px; height: 24px; object-fit: contain;" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                    </a>
                                    <a href="https://www.facebook.com/share/14YQRpe9WzS/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" class="pata-social-icon">
                                        <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698ba31df02487238b780583_fb%202.svg" alt="Facebook" style="width: 24px; height: 24px; object-fit: contain;" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                    </a>
                                    <a href="https://www.tiktok.com/@pataamigamx" target="_blank" rel="noopener noreferrer" class="pata-social-icon">
                                        <img src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698ba31d1b1b4de158a1ffb9_tiktok%202.svg" alt="TikTok" style="width: 24px; height: 24px; object-fit: contain;" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                                    </a>
                                </div>
                            </div>

                            <div class="pata-footer-col">
                                <h3 class="pata-newsletter-title">Suscríbete</h3>
                                <form id="pata-newsletter-form" class="pata-newsletter-form">
                                    <input type="email" class="pata-form-input" id="newsletter-email" placeholder="Correo electrónico" required style="background:#FFF">
                                    <button type="submit" class="pata-btn pata-btn-pink" id="newsletter-submit-btn">Enviar</button>
                                    <div id="newsletter-form-status" class="pata-form-status"></div>
                                </form>
                                <p class="pata-newsletter-text">Te enviaremos novedades, consejos y noticias que te harán mover la cola. 🐾</p>
                            </div>
                        </div>

                        <div class="pata-footer-nav">
                            <h3 class="pata-nav-title">Navegación</h3>
                            <div class="pata-nav-cols">
                                <div class="pata-nav-col">
                                    <h4 class="pata-nav-heading">LEGAL</h4>
                                    <ul class="pata-nav-list">
                                        <li class="pata-nav-item"><a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b14873e67fb7f89b1_Terminosycondiciones%20girbaz.pdf" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a></li>
                                        <li class="pata-nav-item"><a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b6bf2c96bf1d2b123_Reglamento%20de%20Integridad.pdf" target="_blank" rel="noopener noreferrer">Reglamento de Integridad</a></li>
                                        <li class="pata-nav-item"><a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b1b8d0a6dc9f79e5c_Conveio%20asociado%20.pdf" target="_blank" rel="noopener noreferrer">Convenio asociado</a></li>
                                        <li class="pata-nav-item"><a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61adc0bfbb17c833501_AVISO%20DE%20PRIVACIDAD%20INTEGRAL.pdf" target="_blank" rel="noopener noreferrer">Aviso de privacidad Integral</a></li>
                                        <li class="pata-nav-item"><a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/69bc12e1761591b0dc638332_POLI%CC%81TICA%20DE%20COOKIES.pdf" target="_blank" rel="noopener noreferrer">Política de Cookies</a></li>
                                        <li class="pata-nav-item"><a href="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b8bccea76df450705_REGLAMENTO%20DEL%20FONDO%20SOLIDARIO%20CLUB%20PATA%20AMIGA.zip" target="_blank" rel="noopener noreferrer">Reglamento del fondo solidario</a></li>
                                    </ul>
                                </div>
                                <div class="pata-nav-col">
                                    <h4 class="pata-nav-heading">INFORMACIÓN</h4>
                                    <ul class="pata-nav-list">
                                        <li class="pata-nav-item"><a href="#pricing-section">Beneficios</a></li>
                                        <li class="pata-nav-item"><a href="mailto:contacto@pataamiga.mx">Contacto</a></li>
                                        <li class="pata-nav-item"><a href="#faq-section">Dudas frecuentes</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="pata-footer-copyright">
                            GIRBAZ, S.A. de C.V. y PATA AMIGA, A.C. Todos los derechos reservados. Hecho con ♡ en México.
                        </div>
                    </div>

                </div>
            `;

            this.attachEvents();
        }

        attachEvents() {
            // Scroll triggers
            const heroCta = this.container.querySelector('#hero-cta-btn');
            const howCta = this.container.querySelector('#how-cta-btn');
            
            const scrollToPricing = (e) => {
                e.preventDefault();
                const pricing = this.container.querySelector('#pricing-section');
                if (pricing) {
                    pricing.scrollIntoView({ behavior: 'smooth' });
                }
            };

            if (heroCta) heroCta.onclick = scrollToPricing;
            if (howCta) howCta.onclick = scrollToPricing;

            // Purchase Plans checkout
            const buyMonthly = this.container.querySelector('#buy-monthly-btn');
            const buyYearly = this.container.querySelector('#buy-yearly-btn');

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
                        console.error('Error opening memberstack checkout:', err);
                        alert('Hubo un error al iniciar el checkout. Inténtalo de nuevo.');
                    }
                } else {
                    window.location.href = `${CONFIG.apiUrl}/registro?step=1&plan=${planType}`;
                }
            };

            if (buyMonthly) buyMonthly.onclick = () => handlePlanPurchase('monthly');
            if (buyYearly) buyYearly.onclick = () => handlePlanPurchase('yearly');

            // FAQ Accordion toggles
            this.container.querySelectorAll('.pata-faq-item').forEach(item => {
                const summary = item.querySelector('.pata-faq-summary');
                const toggleFaq = () => {
                    const isOpen = item.classList.contains('open');
                    
                    // Close others
                    this.container.querySelectorAll('.pata-faq-item').forEach(other => {
                        other.classList.remove('open');
                        const otherSummary = other.querySelector('.pata-faq-summary');
                        if (otherSummary) otherSummary.setAttribute('aria-expanded', 'false');
                    });

                    if (!isOpen) {
                        item.classList.add('open');
                        summary.setAttribute('aria-expanded', 'true');
                    }
                };

                summary.onclick = toggleFaq;
                summary.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFaq();
                    }
                };
            });

            // Handle "Otro" input field
            const otroInput = this.container.querySelector('#pata-otro-service-input');

            // Wellness Form Submit
            const wellnessForm = this.container.querySelector('#pata-wellness-form');
            if (wellnessForm) {
                wellnessForm.onsubmit = async (e) => {
                    e.preventDefault();
                    if (this.isWellnessProcessing) return;

                    this.isWellnessProcessing = true;
                    const submitBtn = this.container.querySelector('#wellness-submit-btn');
                    const statusEl = this.container.querySelector('#wellness-form-status');
                    
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<div class="pata-loading-spinner"></div> Enviando...';
                    statusEl.style.display = 'none';

                    const formData = new FormData(wellnessForm);
                    
                    // Collect selected services
                    const selectedServices = [];
                    this.container.querySelectorAll('input[name="services"]:checked').forEach(cb => {
                        if (cb.value !== 'Otro') {
                            selectedServices.push(cb.value);
                        }
                    });
                    
                    const otherServiceVal = otroInput?.value?.trim() || '';
                    if (otherServiceVal) {
                        selectedServices.push(otherServiceVal);
                    }

                    const payload = {
                        establishment_name: formData.get('contact_name'),
                        contact_name: formData.get('contact_name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        services: selectedServices,
                        source: 'webflow_home_widget'
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
                            statusEl.className = 'pata-form-status success';
                            statusEl.textContent = '✨ ¡Gracias por tu interés! Nos pondremos en contacto contigo muy pronto.';
                            wellnessForm.reset();
                        } else {
                            statusEl.className = 'pata-form-status error';
                            statusEl.textContent = `❌ ${data.error || 'Ocurrió un error. Por favor inténtalo de nuevo.'}`;
                        }
                    } catch (error) {
                        console.error('Error submitting wellness lead:', error);
                        statusEl.className = 'pata-form-status error';
                        statusEl.textContent = '❌ Error de red. Revisa tu conexión e inténtalo de nuevo.';
                    } finally {
                        this.isWellnessProcessing = false;
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'REGISTRAR MI CENTRO';
                        statusEl.style.display = 'block';
                    }
                };
            }

            // Newsletter Form Submit
            const newsletterForm = this.container.querySelector('#pata-newsletter-form');
            if (newsletterForm) {
                newsletterForm.onsubmit = async (e) => {
                    e.preventDefault();
                    if (this.isNewsletterProcessing) return;

                    this.isNewsletterProcessing = true;
                    const emailInput = this.container.querySelector('#newsletter-email');
                    const submitBtn = this.container.querySelector('#newsletter-submit-btn');
                    const statusEl = this.container.querySelector('#newsletter-form-status');

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<div class="pata-loading-spinner"></div>';
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
                                first_name: '',
                                source: 'webflow_home_widget'
                            })
                        });

                        const data = await res.json();

                        if (res.ok && data.success) {
                            statusEl.className = 'pata-form-status success';
                            statusEl.textContent = '✨ ¡Gracias por suscribirte!';
                            newsletterForm.reset();
                        } else {
                            statusEl.className = 'pata-form-status error';
                            statusEl.textContent = `❌ ${data.error || 'Ocurrió un error.'}`;
                        }
                    } catch (error) {
                        console.error('Error subscribing to newsletter:', error);
                        statusEl.className = 'pata-form-status error';
                        statusEl.textContent = '❌ Error de conexión.';
                    } finally {
                        this.isNewsletterProcessing = false;
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Enviar';
                        statusEl.style.display = 'block';
                    }
                };
            }

            // Intersection Observer for scroll animations
            if ('IntersectionObserver' in window) {
                const observerOptions = {
                    root: null,
                    rootMargin: '0px',
                    threshold: 0.1
                };

                const observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('pata-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, observerOptions);

                this.container.querySelectorAll('.pata-animate-on-scroll').forEach(el => {
                    observer.observe(el);
                });
            } else {
                // Fallback for browsers that don't support IntersectionObserver
                this.container.querySelectorAll('.pata-animate-on-scroll').forEach(el => {
                    el.classList.add('pata-visible');
                });
            }
        }
    }

    // Auto-init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new PataHomeWidget());
    } else {
        new PataHomeWidget();
    }

})();
