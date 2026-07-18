/**
 * ⚙️ Club Pata Amiga - User Settings Widget
 * 
 * Widget para la configuración de cuenta del usuario.
 * Sincroniza preferencias con Supabase y acciones con Memberstack.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        brandColor: '#7DD8D5',
        actionColor: '#FF0066', // Rosa/Rojo para desactivar cuenta
        textColor: '#2D3748',
        textLight: '#718096',
        bgLight: '#F7FAFC'
    };

    const MONTHS = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const fmtDate = d => {
        if (!d || d === 'null' || d === 'undefined') return '—';
        const x = new Date(d);
        if (isNaN(x.getTime())) return '—';
        return x.getDate() + ' de ' + MONTHS[x.getMonth() + 1] + ' ' + x.getFullYear();
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        @font-face {
            font-family: 'Fraiche';
            src: url('https://uploads-ssl.webflow.com/64b5687796068e860950337c/64b56b3e96068e860953a2a6_Fraiche.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }

        .pata-settings-widget {
            font-family: 'Outfit', sans-serif;
            color: ${CONFIG.textColor};
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: transparent; /* Fondo transparente solicitado */
            display: none; 
        }

        .pata-settings-widget.show {
            display: block;
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .pata-settings-header {
            margin-bottom: 40px;
        }

        .pata-settings-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 48px;
            margin: 0 0 10px 0;
            line-height: 1.1;
            color: #000;
        }

        .pata-settings-subtitle {
            font-size: 18px;
            color: ${CONFIG.textLight};
            line-height: 1.4;
        }

        .pata-settings-container {
            max-width: 600px;
            margin: 0 auto;
            background: transparent;
            border-radius: 50px;
            padding: 40px;
            font-family: 'Outfit', sans-serif;
            color: ${CONFIG.textColor};
            position: relative;
        }

        .pata-settings-section {
            margin-bottom: 35px;
            background: #FFFFFF;
            border-radius: 30px;
            padding: 30px;
            border: 1px solid #EDF2F7;
        }

        .pata-section-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #1A202C;
        }

        .pata-section-subtitle {
            font-size: 14px;
            color: ${CONFIG.textLight};
            margin-bottom: 25px;
        }

        .pata-settings-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-settings-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: #FFFFFF;
            border-radius: 20px;
            transition: all 0.2s ease;
            cursor: pointer;
            border: 1px solid transparent;
        }

        .pata-settings-item:hover {
            background: ${CONFIG.bgLight};
            transform: translateX(5px);
        }

        .pata-item-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .pata-item-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${CONFIG.textColor};
        }

        .pata-item-label {
            font-size: 16px;
            font-weight: 500;
            color: #4A5568;
        }

        .pata-item-right {
            display: flex;
            align-items: center;
        }

        .pata-chevron {
            width: 20px;
            height: 20px;
            color: #CBD5E0;
        }

        /* Toggles */
        .pata-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }

        .pata-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .pata-slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #E2E8F0;
            transition: .4s;
            border-radius: 34px;
        }

        .pata-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }

        input:checked + .pata-slider {
            background-color: ${CONFIG.brandColor};
        }

        input:checked + .pata-slider:before {
            transform: translateX(20px);
        }

        /* Subscription Card */
        .pata-subscription-card {
            background: #F8FAFC;
            border-radius: 24px;
            padding: 24px;
            border: 1px solid #E2E8F0;
        }
        .pata-sub-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }
        .pata-sub-icon {
            width: 44px;
            height: 44px;
            background: #7DD8D5;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        .pata-sub-details {
            display: flex;
            flex-direction: column;
        }
        .pata-sub-name {
            font-size: 18px;
            font-weight: 700;
            color: #1A202C;
            line-height: 1.2;
        }
        .pata-sub-cost {
            font-size: 14px;
            color: #718096;
            margin-top: 2px;
        }
        .pata-sub-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 15px;
            border-top: 1px dashed #CBD5E0;
            margin-top: 5px;
        }
        .pata-sub-next {
            font-size: 13px;
            color: #4A5568;
        }
        .pata-sub-manage {
            background: none;
            border: none;
            color: #00BBB4;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 0;
            transition: all 0.2s;
            font-family: 'Outfit', sans-serif;
        }
        .pata-sub-manage:hover {
            color: #000;
            transform: translateX(3px);
        }

        /* Account Section */
        .pata-btn-deactivate {
            width: 100%;
            background: ${CONFIG.actionColor};
            color: #FFFFFF;
            padding: 18px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s ease;
        }

        .pata-btn-deactivate:hover {
            opacity: 0.9;
            transform: scale(0.98);
        }

        .pata-badge-soon {
            font-size: 10px;
            background: #EDF2F7;
            color: #718096;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 8px;
            text-transform: uppercase;
            font-weight: 800;
        }

        /* Modal Custom */
        .pata-custom-modal {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
        }
        .pata-custom-modal.show {
            display: flex;
            animation: fadeIn 0.2s ease-out;
        }
        .pata-modal-content {
            background: #FFFFFF;
            border-radius: 30px;
            padding: 40px;
            width: 90%;
            max-width: 400px;
            position: relative;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            animation: modalSlideIn 0.3s ease-out;
            box-sizing: border-box;
        }
        @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .pata-modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #A0AEC0;
            transition: color 0.2s;
        }
        .pata-modal-close:hover {
            color: #2D3748;
        }
        .pata-modal-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 28px;
            margin: 0 0 25px 0;
            color: #1A202C;
            line-height: 1.1;
        }
        .pata-form-group {
            margin-bottom: 20px;
        }
        .pata-label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #4A5568;
        }
        .pata-input {
            width: 100%;
            padding: 14px 20px;
            border-radius: 50px;
            border: 2px solid #EDF2F7;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            outline: none;
            transition: all 0.2s;
            box-sizing: border-box;
        }
        .pata-input:focus {
            border-color: #7DD8D5;
        }
        .pata-pwd-wrapper {
            position: relative;
            display: block;
        }
        .pata-pwd-wrapper .pata-input {
            padding-right: 45px;
        }
        .pata-pwd-toggle {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #A0AEC0;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        .pata-pwd-toggle:hover {
            color: #2D3748;
        }
        .pata-btn-submit {
            width: 100%;
            background: #FE8F15;
            color: #FFFFFF;
            padding: 16px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            border: 2px solid #000;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Fraiche', sans-serif;
            margin-top: 10px;
        }
        .pata-btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000;
        }
        .pata-btn-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }


        /* Modal Legal (Términos y Condiciones) */
        .pata-legal-modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 100000;
            padding: 20px;
            box-sizing: border-box;
            backdrop-filter: blur(5px);
        }
        .pata-legal-modal-overlay.show {
            display: flex;
        }
        .pata-legal-modal-content {
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
            box-sizing: border-box;
            overflow: hidden;
        }
        @keyframes pataModalFade {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .pata-legal-modal-header {
            padding: 25px 30px;
            border-bottom: 3px solid #000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #fff;
        }
        .pata-legal-modal-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 28px;
            margin: 0;
            text-transform: uppercase;
        }
        .pata-legal-modal-close {
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
        .pata-legal-modal-close:hover {
            transform: scale(1.1) rotate(90deg);
            background: #FE8F15;
        }
        .pata-legal-modal-body {
            padding: 30px;
            overflow-y: auto;
            font-size: 16px;
            line-height: 1.6;
            flex: 1;
        }
        .pata-legal-modal-footer {
            padding: 20px;
            border-top: 3px solid #000;
            display: flex;
            justify-content: center;
            background: #fff;
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
        .pata-loading-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(0, 187, 180, 0.2);
            border-top-color: #00BBB4;
            border-radius: 50%;
            animation: pataSpin 0.8s linear infinite;
        }
        @keyframes pataSpin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
            .pata-settings-title { font-size: 36px; }
            .pata-settings-subtitle { font-size: 16px; }
            .pata-modal-content { padding: 30px; }
            .pata-legal-modal-content { max-height: 95vh; }
            .pata-legal-modal-header { padding: 20px; }
            .pata-legal-modal-body { padding: 20px; }
        }

        /* 🆕 Estilos de plan selector */
        .pata-plan-option-card {
            border: 2px solid #E2E8F0;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            background: #FFFFFF;
            box-sizing: border-box;
            width: 100%;
            text-align: left;
        }
        .pata-plan-option-card:hover {
            border-color: #7DD8D5;
            background: #F0FDFD;
            transform: translateY(-2px);
        }
        .pata-plan-option-card.selected {
            border-color: #00BBB4;
            background: #E6FFFA;
            box-shadow: 0 4px 12px rgba(0, 187, 180, 0.15);
        }
        .pata-plan-option-card.selected::after {
            content: "✓";
            position: absolute;
            top: 20px;
            right: 20px;
            width: 24px;
            height: 24px;
            background: #00BBB4;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        .pata-plan-option-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 18px;
            color: #2D3748;
            margin: 0 0 5px 0;
        }
        .pata-plan-option-cost {
            font-size: 15px;
            font-weight: 700;
            color: #00BBB4;
        }
        .pata-plan-option-desc {
            font-size: 13px;
            color: #718096;
            margin-top: 5px;
            line-height: 1.4;
        }
        /* Settings V2 visual standard */
        .pata-settings-widget { max-width:1040px; padding:24px; color:#174f4c; }
        .pata-settings-container { max-width:900px; padding:0; }
        .pata-settings-header { margin-bottom:24px; }
        .pata-settings-title { color:#174f4c; font-size:clamp(36px,6vw,52px); }
        .pata-settings-subtitle { color:#71817f; font-size:16px; }
        .pata-settings-section { margin-bottom:18px; padding:26px; border:1px solid #e8e0d4; border-radius:24px; box-shadow:0 8px 24px rgba(24,75,71,.06); }
        .pata-section-title { color:#174f4c; font-family:'Fraiche',sans-serif; font-size:25px; }
        .pata-section-subtitle { color:#71817f; margin-bottom:18px; }
        .pata-settings-list { gap:8px; }
        .pata-settings-item { min-height:58px; padding:14px 16px; border:1px solid #eee7dd; border-radius:14px; background:#fbfaf7; }
        .pata-settings-item:hover { background:#e7f6f4; transform:none; border-color:#bfe8e4; }
        .pata-item-icon { color:#159b94; }
        .pata-item-label { color:#315c59; font-weight:600; }
        .pata-slider { background:#dcd8d1; }
        input:checked + .pata-slider { background:#1fbdb3; }
        .pata-subscription-card { border:1px solid #e8e0d4; border-radius:16px; background:#fff; }
        .pata-sub-icon { background:#1fbdb3; }
        .pata-modal-content,.pata-legal-modal-content { border:1px solid #e8e0d4 !important; border-radius:24px !important; box-shadow:0 22px 60px rgba(24,75,71,.2) !important; }
        .pata-input { border:1px solid #ddd4c7 !important; border-radius:14px !important; background:#fbfaf7 !important; }
        .pata-btn-submit { border:0 !important; border-radius:999px !important; background:#1fbdb3 !important; box-shadow:none !important; text-transform:none !important; }
        @media(max-width:640px) { .pata-settings-widget { padding:14px; } .pata-settings-section { padding:20px 16px; border-radius:20px; } }
    `;

    const ICONS = {
        key: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>`,
        activity: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        devices: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
        mail: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
        whatsapp: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 4.5l-2.1 4.6Z"/><path d="M16 10l-2 2-2-2"/></svg>`,
        bell: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
        payment: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
        news: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
        shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        doc: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        house: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        image: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        chevron: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
        xCircle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        eye: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        eyeOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    };

    class UserSettingsWidget {
        constructor() {
            this.container = null;
            this.member = null;
            this.preferences = {
                notif_email: true,
                notif_whatsapp: true,
                notif_alerts: true,
                notif_payments: true,
                notif_news: true
            };
            this.paymentMethod = null;
            this.showLegalModal = false;
            this.legalContent = null;
            this.isLoadingLegal = false;
            this.init();
        }

        async init() {
            this.injectStyles();
            await this.createContainer();
            this.loadAccountNavbar();
            await this.loadMember();
            if (this.member) {
                // Cargar datos en paralelo para mejor performance
                await Promise.all([
                    this.loadPreferences(),
                    this.loadPaymentMethod()
                ]);
                this.render();
            } else {
                this.renderNoSession();
            }
        }

        loadAccountNavbar() {
            if (window.PataAccountNavbar || document.getElementById('pata-account-navbar-script')) return;
            const script = document.createElement('script');
            script.id = 'pata-account-navbar-script';
            script.src = `${CONFIG.apiUrl}/widgets/member-account-navbar.js?v=20260717-primary-nav-2`;
            script.onerror = () => console.error('[SettingsWidget] No fue posible cargar la navegación de cuenta.');
            document.head.appendChild(script);
        }

        injectStyles() {
            const styleTag = document.createElement('style');
            styleTag.innerHTML = STYLES;
            document.head.appendChild(styleTag);
        }

        async createContainer() {
            const div = document.createElement('div');
            div.className = 'pata-settings-widget';
            div.id = 'pata-settings-widget-inner';
            
            // Intentar encontrar el contenedor por ID (más fiable en Webflow) o atributo
            const findTarget = () => {
                return document.getElementById('pata-settings') || 
                       document.querySelector('[data-pata-widget="settings"]');
            };

            let target = findTarget();

            if (target) {
                target.appendChild(div);
                this.container = div;
            } else {
                console.warn('⚠️ [SETTINGS] No se encontró contenedor (#pata-settings). Reintentando...');
                // Esperar a que Webflow cargue el DOM
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                target = findTarget();
                if (target) {
                    target.appendChild(div);
                    this.container = div;
                } else {
                    console.warn('⚠️ [SETTINGS] Contenedor no encontrado tras reintento. Usando fallback al body.');
                    document.body.appendChild(div);
                    this.container = div;
                }
            }
        }

        async loadMember() {
            return new Promise((resolve) => {
                if (window.$memberstackDom) {
                    window.$memberstackDom.getCurrentMember().then(({ data }) => {
                        if (data) {
                            this.member = data;
                            console.log('👤 [SETTINGS] Miembro cargado:', data.auth.email);
                        } else {
                            console.warn('⚠️ [SETTINGS] No hay sesión de Memberstack');
                        }
                        resolve(data);
                    });
                } else {
                    console.error('❌ [SETTINGS] Memberstack no está cargado');
                    resolve(null);
                }
            });
        }

        async loadPreferences() {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/user/preferences?memberstackId=${this.member.id}`);
                const data = await response.json();
                if (data.success) {
                    this.preferences = data.preferences;
                }
            } catch (error) {
                console.error('❌ [SETTINGS] Error cargando preferencias:', error);
            }
        }
        
        async loadPaymentMethod() {
            try {
                console.log('💳 [SETTINGS] Cargando método de pago...');
                const response = await fetch(`${CONFIG.apiUrl}/api/user/payment-method?memberstackId=${this.member.id}`);
                const data = await response.json();
                if (data.success && data.paymentMethod) {
                    this.paymentMethod = data.paymentMethod;
                    console.log('💳 [SETTINGS] Método de pago cargado:', data.paymentMethod.plan_name);
                }
            } catch (error) {
                console.error('❌ [SETTINGS] Error cargando método de pago:', error);
            }
        }

        async savePreference(key, value) {
            this.preferences[key] = value;
            try {
                await fetch(`${CONFIG.apiUrl}/api/user/preferences`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberstackId: this.member.id,
                        preferences: this.preferences
                    })
                });
            } catch (error) {
                console.error('❌ [SETTINGS] Error guardando preferencia:', error);
            }
        }

        render() {
            const planInfo = this.getActivePlanInfo();
            const currentPlan = planInfo ? (planInfo.name.toLowerCase().includes('anual') ? 'anual' : 'mensual') : 'mensual';

            this.container.innerHTML = `
                <div class="pata-settings-header">
                    <h1 class="pata-settings-title">Centro de configuración</h1>
                    <p class="pata-settings-subtitle">Personaliza datos, accesos y detalles de tu cuenta de manera sencilla y segura.</p>
                </div>

                <!-- Seguridad y acceso -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Seguridad y acceso</h2>
                    <p class="pata-section-subtitle">Mantén protegida tu cuenta administrando tus accesos</p>
                    <div class="pata-settings-list">
                        ${this.renderItem('Cambiar contraseña', 'key', () => this.handleSecurityChange())}
                        ${this.renderItem('Actividad de inicio de sesión', 'activity', null, true)}
                        ${this.renderItem('Cerrar sesión en otros dispositivos', 'devices', null, true)}
                    </div>
                </div>

                <!-- Notificaciones -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Notificaciones</h2>
                    <p class="pata-section-subtitle">Elige cómo quieres que te avisemos</p>
                    <div class="pata-settings-list">
                        ${this.renderToggle('Recibir correo electrónicos', 'mail', 'notif_email')}
                        <div style="display: none;">${this.renderToggle('Notificaciones por WhatsApp', 'whatsapp', 'notif_whatsapp')}</div>
                        ${this.renderToggle('Alertas de tus solicitudes', 'bell', 'notif_alerts')}
                        ${this.renderToggle('Recordatorio de pagos', 'payment', 'notif_payments')}
                        ${this.renderToggle('Noticias del club', 'news', 'notif_news')}
                    </div>
                </div>

                <!-- Legal -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Legal</h2>
                    <p class="pata-section-subtitle">Consulta nuestros documentos legales actualizados.</p>
                    <div class="pata-settings-list">
                        ${this.renderItem('Ver términos y condiciones', 'doc', null)}
                    </div>
                </div>

                <!-- Cuenta -->
                <div class="pata-settings-section">
                    <h2 class="pata-section-title">Cuenta y suscripción</h2>
                    <p class="pata-section-subtitle">Administra tu suscripción o solicita la baja de la plataforma.</p>
                    <div class="pata-settings-list" style="margin-bottom: 20px;">
                        ${this.renderSubscriptionInfo()}
                    </div>
                    ${(() => {
                        const isCancelled = this.paymentMethod?.is_cancelled === true;
                        if (isCancelled) {
                            return `
                                <div style="padding: 20px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 16px; display: flex; flex-direction: column; gap: 12px; color: #B91C1C;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        ${ICONS.xCircle}
                                        <div>
                                            <strong style="font-size: 16px;">Cuenta desactivada</strong>
                                            <p style="margin: 4px 0 0; font-size: 14px; color: #DC2626;">Tu suscripción está cancelada. Mantienes acceso hasta la fecha de fin de tu periodo pagado.</p>
                                        </div>
                                    </div>
                                    <button class="pata-btn-reactivate" id="pata-btn-reactivate" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: ${CONFIG.brandColor}; color: #FFFFFF; border: none; border-radius: 50px; font-weight: 700; font-size: 16px; font-family: 'Fraiche', sans-serif; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                                        ${ICONS.shield}
                                        Reactivar membresía
                                    </button>
                                </div>
                            `;
                        }
                        return `
                            <button class="pata-btn-deactivate" id="pata-btn-deactivate">
                                ${ICONS.xCircle}
                                Desactivar cuenta
                            </button>
                        `;
                    })()}
                </div>

                <!-- Modal Custom para Contraseña -->
                <div class="pata-custom-modal" id="pata-password-modal">
                    <div class="pata-modal-content">
                        <button class="pata-modal-close" id="pata-close-password">×</button>
                        <h3 class="pata-modal-title">Cambiar contraseña</h3>
                        <form id="pata-password-form">
                            <div class="pata-form-group">
                                <label class="pata-label">Contraseña Actual</label>
                                <div class="pata-pwd-wrapper">
                                    <input type="password" id="pata-current-pwd" required class="pata-input" placeholder="••••••••">
                                    <button type="button" class="pata-pwd-toggle" title="Mostrar/Ocultar contraseña">${ICONS.eye}</button>
                                </div>
                            </div>
                            <div class="pata-form-group">
                                <label class="pata-label">Nueva Contraseña</label>
                                <div class="pata-pwd-wrapper">
                                    <input type="password" id="pata-new-pwd" required class="pata-input" placeholder="••••••••">
                                    <button type="button" class="pata-pwd-toggle" title="Mostrar/Ocultar contraseña">${ICONS.eye}</button>
                                </div>
                            </div>
                            <button type="submit" class="pata-btn-submit" id="pata-btn-pwd">Guardar Cambios</button>
                            <div id="pata-pwd-error" style="color: #E53E3E; margin-top: 15px; font-size: 14px; display: none; text-align: center;"></div>
                            <div id="pata-pwd-success" style="color: #38A169; margin-top: 15px; font-size: 14px; display: none; text-align: center; font-weight: bold;">¡Contraseña actualizada con éxito!</div>
                        </form>
                    </div>
                </div>

                <!-- 🆕 Modal Custom para Cambiar Plan -->
                <div class="pata-custom-modal" id="pata-change-plan-modal">
                    <div class="pata-modal-content" style="max-width: 450px;">
                        <button class="pata-modal-close" id="pata-close-change-plan">×</button>
                        <h3 class="pata-modal-title">Cambiar de Plan</h3>
                        <p style="font-size: 14px; color: ${CONFIG.textLight}; margin: -15px 0 20px;">
                            Cambia tu plan de Club Pata Amiga de manera inmediata o en tu próximo cobro.
                        </p>
                        <div class="pata-plan-option-card ${currentPlan === 'mensual' ? 'selected' : ''}" data-plan="mensual" style="margin-bottom: 12px;">
                            <div>
                                <h4 class="pata-plan-option-title">Plan Mensual</h4>
                                <span class="pata-plan-option-cost">$159 MXN / mes</span>
                                <p class="pata-plan-option-desc">Ideal para protección continua mes a mes.</p>
                            </div>
                        </div>
                        <div class="pata-plan-option-card ${currentPlan === 'anual' ? 'selected' : ''}" data-plan="anual" style="margin-bottom: 24px;">
                            <div>
                                <h4 class="pata-plan-option-title">Plan Anual 🐾</h4>
                                <span class="pata-plan-option-cost">$1,699 MXN / año</span>
                                <p class="pata-plan-option-desc">Ahorra con 12 meses de cobertura completa y continua.</p>
                            </div>
                        </div>
                        <button type="button" class="pata-btn-submit" id="pata-btn-confirm-plan" style="width: 100%;">Confirmar Cambio</button>
                        <div id="pata-plan-error" style="color: #E53E3E; margin-top: 15px; font-size: 14px; display: none; text-align: center; line-height: 1.4;"></div>
                        <div id="pata-plan-success" style="color: #38A169; margin-top: 15px; font-size: 14px; display: none; text-align: center; font-weight: bold;">¡Plan cambiado con éxito!</div>
                    </div>
                </div>

                <!-- Modal Legal (Términos y Condiciones) -->
                ${this.renderLegalModal()}
            `;

            this.container.classList.add('show');
            this.bindEvents();
        }

        renderNoSession() {
            this.container.innerHTML = `
                <div class="pata-settings-section" style="text-align: center; padding: 60px;">
                    <h2 class="pata-section-title">Inicia sesión</h2>
                    <p class="pata-section-subtitle">Debes estar conectado para ver tu configuración.</p>
                    <a href="/user/inicio-de-sesion" class="pata-btn-deactivate" style="background: ${CONFIG.brandColor}; text-decoration: none;">
                        Ir al Login
                    </a>
                </div>
            `;
            this.container.classList.add('show');
        }

        renderItem(label, iconKey, action, isSoon = false) {
            return `
                <div class="pata-settings-item" data-action="${iconKey}">
                    <div class="pata-item-left">
                        <div class="pata-item-icon">${ICONS[iconKey]}</div>
                        <span class="pata-item-label">${label} ${isSoon ? '<span class="pata-badge-soon">Muy pronto</span>' : ''}</span>
                    </div>
                    <div class="pata-item-right">
                        ${ICONS.chevron}
                    </div>
                </div>
            `;
        }

        renderToggle(label, iconKey, prefKey) {
            const isChecked = this.preferences[prefKey] ? 'checked' : '';
            return `
                <div class="pata-settings-item no-click">
                    <div class="pata-item-left">
                        <div class="pata-item-icon">${ICONS[iconKey]}</div>
                        <span class="pata-item-label">${label}</span>
                    </div>
                    <div class="pata-item-right">
                        <label class="pata-switch">
                            <input type="checkbox" data-pref="${prefKey}" ${isChecked}>
                            <span class="pata-slider"></span>
                        </label>
                    </div>
                </div>
            `;
        }

        getActivePlanInfo() {
            // Prioridad 1: Datos frescos desde la API custom de Stripe (vía backend)
            if (this.paymentMethod) {
                const isCancelled = this.paymentMethod.is_cancelled === true;
                const membershipEndDate = this.paymentMethod.membership_end_date;
                const cancelledAt = this.paymentMethod.cancelled_at;
                
                return {
                    name: this.paymentMethod.plan_name || 'Plan Club Pata Amiga',
                    amount: this.paymentMethod.plan_cost ? this.paymentMethod.plan_cost.toFixed(2) : '0.00',
                    currency: 'MXN',
                    nextPayment: fmtDate(this.paymentMethod.next_payment_date),
                    // 🆕 Cancelación
                    isCancelled,
                    membershipEndDate,
                    cancelledAt
                };
            }

            // Prioridad 2: Fallback a Memberstack (lo que teníamos antes)
            if (!this.member || !this.member.planConnections || this.member.planConnections.length === 0) return null;
            
            const activePlan = this.member.planConnections.find(p => p.status === 'ACTIVE' || p.status === 'TRIALING') 
                             || this.member.planConnections[0];
            
            if (!activePlan) return null;

            const amount = activePlan.payment?.amount ? (activePlan.payment.amount / 100).toFixed(2) : '0.00';
            const currency = activePlan.payment?.currency?.toUpperCase() || 'MXN';
            
            let nextPayment = 'No disponible';
            if (activePlan.currentPeriodEnd) {
                try {
                    // Normalizar timestamp (segundos vs milisegundos)
                    const ts = typeof activePlan.currentPeriodEnd === 'number' && activePlan.currentPeriodEnd < 10000000000 
                               ? activePlan.currentPeriodEnd * 1000 
                               : activePlan.currentPeriodEnd;
                    nextPayment = fmtDate(ts);
                } catch (e) {
                    console.warn('⚠️ [SETTINGS] Error formateando fecha:', e);
                }
            }

            return {
                name: activePlan.planName || 'Plan Club Pata Amiga',
                amount,
                currency,
                nextPayment,
                // 🆕 Cancelación (Memberstack no tiene estos campos, por eso false/null)
                isCancelled: false,
                membershipEndDate: null,
                cancelledAt: null
            };
        }

        renderSubscriptionInfo() {
            const plan = this.getActivePlanInfo();
            if (!plan) {
                return this.renderItem('Administrar suscripción', 'payment', 'payment');
            }

            // 🆕 Si está cancelada, mostrar mensaje especial
            if (plan.isCancelled) {
                const endDate = plan.membershipEndDate ? fmtDate(plan.membershipEndDate) : '—';
                return `
                    <div class="pata-subscription-card" style="border: 2px solid #E53E3E; background: #FEF2F2;">
                        <div class="pata-sub-header">
                            <div class="pata-sub-icon" style="background: #E53E3E;">${ICONS.payment}</div>
                            <div class="pata-sub-details">
                                <span class="pata-sub-name">${plan.name}</span>
                                <span class="pata-sub-cost" style="color: #E53E3E;">$${plan.amount} ${plan.currency} / mes</span>
                            </div>
                        </div>
                        <div class="pata-sub-footer">
                            <span class="pata-sub-next" style="color: #E53E3E; font-weight: 700;">
                                🠗 Membresía cancelada · Apoyo hasta: <strong>${endDate}</strong>
                            </span>
                            <button class="pata-sub-manage" data-action="payment" style="opacity: 0.6; pointer-events: none;">Cancelada · No renovará</button>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="pata-subscription-card">
                    <div class="pata-sub-header">
                        <div class="pata-sub-icon">${ICONS.payment}</div>
                        <div class="pata-sub-details">
                            <span class="pata-sub-name">${plan.name}</span>
                            <span class="pata-sub-cost">$${plan.amount} ${plan.currency} / mes</span>
                        </div>
                    </div>
                    <div class="pata-sub-footer" style="display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                        <span class="pata-sub-next">Siguiente pago: <strong>${plan.nextPayment}</strong></span>
                        <div style="display: flex; gap: 8px;">
                            <button class="pata-sub-manage" id="pata-btn-change-plan-trigger" style="background: #FFFFFF; color: #00BBB4; border: 1.5px solid #00BBB4; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">Cambiar Plan</button>
                            <button class="pata-sub-manage" data-action="payment">Administrar ${ICONS.chevron}</button>
                        </div>
                    </div>
                </div>
            `;
        }

        bindEvents() {
            // Click en items normales y botón de administrar suscripción
            this.container.querySelectorAll('.pata-settings-item:not(.no-click), .pata-sub-manage').forEach(item => {
                item.addEventListener('click', () => {
                    const actionKey = item.getAttribute('data-action');
                    if (actionKey === 'key') this.handleSecurityChange();
                    if (actionKey === 'payment') this.handleManagePlan();
                    if (actionKey === 'doc') this.openLegalModal();
                });
            });

            // Cambios en toggles
            this.container.querySelectorAll('.pata-switch input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const prefKey = e.target.getAttribute('data-pref');
                    this.savePreference(prefKey, e.target.checked);
                });
            });

            // Desactivar cuenta
            const btnDeactivate = this.container.querySelector('#pata-btn-deactivate');
            if (btnDeactivate) {
                btnDeactivate.addEventListener('click', () => this.handleDeactivate());
            }

            // Reactivar membresía
            const btnReactivate = this.container.querySelector('#pata-btn-reactivate');
            if (btnReactivate) {
                btnReactivate.addEventListener('click', () => this.handleReactivate());
            }

            // Password Modal Events
            const pwdModal = this.container.querySelector('#pata-password-modal');
            const closePwdBtn = this.container.querySelector('#pata-close-password');
            const pwdForm = this.container.querySelector('#pata-password-form');
            const pwdError = this.container.querySelector('#pata-pwd-error');
            const pwdSuccess = this.container.querySelector('#pata-pwd-success');
            const pwdBtn = this.container.querySelector('#pata-btn-pwd');

            // Legal Modal Events
            const legalModal = this.container.querySelector('#pata-legal-modal-overlay');
            if (legalModal) {
                const closeLegalBtn = legalModal.querySelector('#pata-legal-modal-close');
                const understoodBtn = legalModal.querySelector('#pata-legal-modal-understood');

                if (closeLegalBtn) closeLegalBtn.addEventListener('click', () => this.closeLegalModal());
                if (understoodBtn) understoodBtn.addEventListener('click', () => this.closeLegalModal());
                legalModal.addEventListener('click', (e) => {
                    if (e.target === legalModal) this.closeLegalModal();
                });
            }

            if (closePwdBtn && pwdModal) {
                closePwdBtn.addEventListener('click', () => {
                    pwdModal.classList.remove('show');
                    if(pwdForm) pwdForm.reset();
                    if(pwdError) pwdError.style.display = 'none';
                    if(pwdSuccess) pwdSuccess.style.display = 'none';
                    // Resetear iconos de ojito
                    this.container.querySelectorAll('.pata-pwd-toggle').forEach(btn => {
                        btn.previousElementSibling.type = 'password';
                        btn.innerHTML = ICONS.eye;
                    });
                });
            }

            // Cerrar si hace clic fuera del modal
            if (pwdModal) {
                pwdModal.addEventListener('click', (e) => {
                    if (e.target === pwdModal) {
                        pwdModal.classList.remove('show');
                        if(pwdForm) pwdForm.reset();
                        if(pwdError) pwdError.style.display = 'none';
                        if(pwdSuccess) pwdSuccess.style.display = 'none';
                        // Resetear iconos de ojito a oculto por defecto
                        this.container.querySelectorAll('.pata-pwd-toggle').forEach(btn => {
                            btn.previousElementSibling.type = 'password';
                            btn.innerHTML = ICONS.eye;
                        });
                    }
                });
            }

            // Toggle Password Visibility
            this.container.querySelectorAll('.pata-pwd-toggle').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = btn.previousElementSibling;
                    if (input.type === 'password') {
                        input.type = 'text';
                        btn.innerHTML = ICONS.eyeOff;
                    } else {
                        input.type = 'password';
                        btn.innerHTML = ICONS.eye;
                    }
                });
            });

            if (pwdForm) {
                pwdForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const currentPwd = this.container.querySelector('#pata-current-pwd').value;
                    const newPwd = this.container.querySelector('#pata-new-pwd').value;
                    
                    pwdBtn.textContent = 'Guardando...';
                    pwdBtn.disabled = true;
                    pwdError.style.display = 'none';
                    pwdSuccess.style.display = 'none';

                    try {
                        await window.$memberstackDom.updateMemberAuth({
                            oldPassword: currentPwd,
                            newPassword: newPwd
                        });
                        pwdSuccess.style.display = 'block';
                        pwdForm.reset();
                        setTimeout(() => {
                            pwdModal.classList.remove('show');
                            pwdSuccess.style.display = 'none';
                            // Resetear iconos de ojito
                            this.container.querySelectorAll('.pata-pwd-toggle').forEach(btn => {
                                btn.previousElementSibling.type = 'password';
                                btn.innerHTML = ICONS.eye;
                            });
                        }, 2000);
                    } catch (error) {
                        pwdError.textContent = error.message || 'Ocurrió un error al actualizar la contraseña.';
                        pwdError.style.display = 'block';
                    } finally {
                        pwdBtn.textContent = 'Guardar Cambios';
                        pwdBtn.disabled = false;
                    }
                });
            }

            // 🆕 Cambiar Plan Modal Events
            const planModal = this.container.querySelector('#pata-change-plan-modal');
            const planTrigger = this.container.querySelector('#pata-btn-change-plan-trigger');
            const closePlanBtn = this.container.querySelector('#pata-close-change-plan');
            const confirmPlanBtn = this.container.querySelector('#pata-btn-confirm-plan');
            const planError = this.container.querySelector('#pata-plan-error');
            const planSuccess = this.container.querySelector('#pata-plan-success');
            let selectedPlan = this.member.planConnections?.find(p => p.status === 'ACTIVE' || p.status === 'TRIALING')?.planName?.toLowerCase().includes('anual') ? 'anual' : 'mensual';

            if (planTrigger && planModal) {
                planTrigger.addEventListener('click', () => {
                    planModal.classList.add('show');
                });
            }

            if (closePlanBtn && planModal) {
                closePlanBtn.addEventListener('click', () => {
                    planModal.classList.remove('show');
                    if (planError) planError.style.display = 'none';
                    if (planSuccess) planSuccess.style.display = 'none';
                });
            }

            if (planModal) {
                planModal.addEventListener('click', (e) => {
                    if (e.target === planModal) {
                        planModal.classList.remove('show');
                        if (planError) planError.style.display = 'none';
                        if (planSuccess) planSuccess.style.display = 'none';
                    }
                });
            }

            // Seleccionar tarjetas de planes
            this.container.querySelectorAll('#pata-change-plan-modal .pata-plan-option-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.container.querySelectorAll('#pata-change-plan-modal .pata-plan-option-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    selectedPlan = card.getAttribute('data-plan');
                });
            });

            if (confirmPlanBtn) {
                confirmPlanBtn.addEventListener('click', async () => {
                    const activePlan = this.member.planConnections?.find(p => p.status === 'ACTIVE' || p.status === 'TRIALING');
                    const activePlanName = activePlan?.planName?.toLowerCase().includes('anual') ? 'anual' : 'mensual';

                    if (selectedPlan === activePlanName) {
                        if (planError) {
                            planError.textContent = 'Ya tienes seleccionado este plan actualmente.';
                            planError.style.display = 'block';
                        }
                        return;
                    }

                    const isUpgrade = selectedPlan === 'anual';
                    const confirmMessage = isUpgrade 
                        ? '¿Confirmar cambio a Plan Anual? Se realizará un cobro prorrateado inmediato en tu tarjeta por la diferencia.'
                        : '¿Confirmar cambio a Plan Mensual? El cambio se programará y se aplicará al final de tu periodo de cobertura anual actual.';

                    if (!confirm(confirmMessage)) return;

                    confirmPlanBtn.textContent = 'Procesando...';
                    confirmPlanBtn.disabled = true;
                    if (planError) planError.style.display = 'none';
                    if (planSuccess) planSuccess.style.display = 'none';

                    try {
                        const response = await fetch(CONFIG.apiUrl + '/api/user/change-plan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                memberstackId: this.member.id,
                                targetPlan: selectedPlan
                            })
                        });

                        const data = await response.json();

                        if (data.success) {
                            if (planSuccess) planSuccess.style.display = 'block';
                            alert(`¡Plan cambiado con éxito a ${data.plan}! Costo: ${data.cost}`);
                            
                            setTimeout(async () => {
                                planModal.classList.remove('show');
                                confirmPlanBtn.textContent = 'Confirmar Cambio';
                                confirmPlanBtn.disabled = false;
                                // Recargar datos y refrescar widget
                                await this.loadPaymentMethod();
                                window.location.reload();
                            }, 1500);
                        } else {
                            throw new Error(data.error || 'Error cambiando de plan');
                        }
                    } catch (err) {
                        console.error('❌ [SETTINGS] Error cambiando plan:', err);
                        if (planError) {
                            planError.textContent = err.message || 'Error al intentar cambiar de plan.';
                            planError.style.display = 'block';
                        }
                        confirmPlanBtn.textContent = 'Confirmar Cambio';
                        confirmPlanBtn.disabled = false;
                    }
                });
            }
        }

        handleSecurityChange() {
            const pwdModal = this.container.querySelector('#pata-password-modal');
            if (pwdModal) {
                pwdModal.classList.add('show');
            }
        }

        handleManagePlan() {
            if (window.$memberstackDom) {
                window.$memberstackDom.launchStripeCustomerPortal().catch(err => {
                    console.error('❌ [SETTINGS] Error abriendo el portal de Stripe:', err);
                    alert('No pudimos abrir el portal de suscripción en este momento. Por favor, intenta de nuevo más tarde.');
                });
            } else {
                console.error('❌ [SETTINGS] Memberstack no está disponible');
            }
        }

        async handleDeactivate() {
            if (confirm('¿Estás seguro de que deseas desactivar tu cuenta? Esta acción cancelará tu suscripción activa y no se puede deshacer fácilmente.')) {
                
                const btnDeactivate = this.container.querySelector('#pata-btn-deactivate');
                const originalText = btnDeactivate.innerHTML;
                
                if (btnDeactivate) {
                    btnDeactivate.innerHTML = 'Desactivando...';
                    btnDeactivate.disabled = true;
                    btnDeactivate.style.opacity = '0.7';
                    btnDeactivate.style.cursor = 'not-allowed';
                }

                try {
                    const memberId = this.member.id;
                    const response = await fetch(CONFIG.apiUrl + '/api/user/deactivate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            memberstackId: memberId,
                            reason: 'no_longer_needed'
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        alert('Tu suscripción ha sido cancelada exitosamente. Mantienes acceso hasta la fecha de fin de tu periodo pagado.');
                        await this.loadPaymentMethod();
                        this.renderSubscriptionInfo();
                        this.render();
                    } else {
                        throw new Error(data.error || 'Error desconocido');
                    }
                } catch (error) {
                    console.error('❌ [SETTINGS] Error desactivando cuenta:', error);
                    alert('Hubo un problema al intentar desactivar tu cuenta: ' + error.message);
                    
                    if (btnDeactivate) {
                        btnDeactivate.innerHTML = originalText;
                        btnDeactivate.disabled = false;
                        btnDeactivate.style.opacity = '1';
                        btnDeactivate.style.cursor = 'pointer';
                    }
                }
            }
        }

        async handleReactivate() {
            if (!confirm('¿Estás seguro de que deseas reactivar tu membresía? Se restablecerá el cobro automático en tu próximo periodo de facturación.')) {
                return;
            }
            
            const btnReactivate = this.container.querySelector('#pata-btn-reactivate');
            const originalText = btnReactivate.innerHTML;
            
            if (btnReactivate) {
                btnReactivate.innerHTML = 'Reactivando...';
                btnReactivate.disabled = true;
                btnReactivate.style.opacity = '0.7';
                btnReactivate.style.cursor = 'not-allowed';
            }

            try {
                const memberId = this.member.id;
                const response = await fetch(CONFIG.apiUrl + '/api/user/reactivate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ memberstackId: memberId })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Tu membresía ha sido reactivada exitosamente. El cobro automático se restablecerá en tu próximo periodo.');
                    await this.loadPaymentMethod();
                    this.render();
                } else if (data.code === 'SUBSCRIPTION_EXPIRED') {
                    alert('Tu suscripción anterior ha expirado por completo y no se puede reactivar. Serás redirigido para seleccionar una nueva membresía.');
                    window.location.href = CONFIG.apiUrl + '/registro?reason=complete_payment';
                } else {
                    throw new Error(data.error || 'Error desconocido');
                }
            } catch (error) {
                console.error('❌ [SETTINGS] Error reactivando membresía:', error);
                if (error.message !== 'Tu suscripción anterior ha expirado por completo y no se puede reactivar. Serás redirigido para seleccionar una nueva membresía.') {
                    alert('Hubo un problema al intentar reactivar tu membresía: ' + error.message);
                }
                
                if (btnReactivate) {
                    btnReactivate.innerHTML = originalText;
                    btnReactivate.disabled = false;
                    btnReactivate.style.opacity = '1';
                    btnReactivate.style.cursor = 'pointer';
                }
            }
        }
        async openLegalModal() {
            this.showLegalModal = true;
            const modal = this.container.querySelector('#pata-legal-modal-overlay');
            if (modal) {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
            
            if (!this.legalContent) {
                await this.fetchLegalTerms();
            }
        }

        closeLegalModal() {
            this.showLegalModal = false;
            const modal = this.container.querySelector('#pata-legal-modal-overlay');
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = 'unset';
            }
        }

        async fetchLegalTerms() {
            if (this.isLoadingLegal) return;
            this.isLoadingLegal = true;
            this.updateLegalModalBody();
            
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/legal/terms`);
                const data = await res.json();
                if (data.success) {
                    this.legalContent = data.fullDocument;
                }
            } catch (error) {
                console.error('Error fetching terms:', error);
                this.legalContent = 'Error al cargar los términos y condiciones. Por favor, intenta de nuevo más tarde.';
            } finally {
                this.isLoadingLegal = false;
                this.updateLegalModalBody();
            }
        }

        updateLegalModalBody() {
            const body = this.container.querySelector('#pata-legal-modal-body');
            if (!body) return;

            if (this.isLoadingLegal) {
                body.innerHTML = '<div style="text-align:center; padding: 50px;"><div class="pata-loading-spinner" style="margin: 0 auto;"></div><p style="margin-top:20px; font-weight:700;">Cargando documentos legales...</p></div>';
            } else if (this.legalContent) {
                body.innerHTML = `<div class="pata-modal-legal-text">${this.formatLegalText(this.legalContent)}</div>`;
            }
        }

        renderLegalModal() {
            return `
                <div class="pata-legal-modal-overlay" id="pata-legal-modal-overlay">
                    <div class="pata-legal-modal-content">
                        <div class="pata-legal-modal-header">
                            <h2 class="pata-legal-modal-title">📋 Documentación Legal</h2>
                            <button class="pata-legal-modal-close" id="pata-legal-modal-close">✕</button>
                        </div>
                        <div class="pata-legal-modal-body" id="pata-legal-modal-body">
                            <div style="text-align:center; padding: 50px;">
                                <div class="pata-loading-spinner" style="margin: 0 auto;"></div>
                                <p style="margin-top:20px; font-weight:700;">Preparando documentos...</p>
                            </div>
                        </div>
                        <div class="pata-legal-modal-footer">
                            <button class="pata-btn-submit" style="max-width: 200px; margin: 0;" id="pata-legal-modal-understood">Entendido ✓</button>
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
    }

    // Auto-inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new UserSettingsWidget());
    } else {
        new UserSettingsWidget();
    }

})();
