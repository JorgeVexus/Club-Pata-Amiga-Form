/**
 * 🎡 Club Pata Amiga - Unified Membership Widget (Tabs + tiempo de espera + Apelación)
 * 
 * Este widget unifica el panel de tiempo de espera y el sistema de apelaciones.
 * Se adapta dinámicamente al estado de cada mascota individualmente.
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        memberPortalUrl: window.PATA_AMIGA_CONFIG?.memberPortalUrl || '/mi-cuenta',
        reimbursementsUrl: window.PATA_AMIGA_CONFIG?.reimbursementsUrl || '/reintegros',
        vetUrl: window.PATA_AMIGA_CONFIG?.vetUrl || '/orientacion-veterinaria',
        centersUrl: window.PATA_AMIGA_CONFIG?.centersUrl || '/centros-aliados',
        ambassadorUrl: window.PATA_AMIGA_CONFIG?.ambassadorUrl || '/embajadores/panel',
        addPetUrl: window.PATA_AMIGA_CONFIG?.addPetUrl || '/registrar-mascotas',
        brandColor: '#00BBB4',
        progressColor: '#9fd406',
        countdownBg: '#C8E600',
        statusColors: {
            approved: { bg: '#E8F5E9', text: '#2E7D32', label: 'APROBADA', icon: '✅' },
            pending: { bg: '#FFF3E0', text: '#EF6C00', label: 'PENDIENTE', icon: '⏳' },
            rejected: { bg: '#FFEBEE', text: '#C62828', label: 'RECHAZADA', icon: '❌' },
            action_required: { bg: '#E3F2FD', text: '#1565C0', label: 'ACCION REQUERIDA', icon: '⚠️' },
            appealed: { bg: '#F3E5F5', text: '#7B1FA2', label: 'APELADA', icon: '⚖️' }
        }
    };

    const CLABE_BANK_CODES = {
        '002':'Citibanamex', '012':'BBVA', '014':'Santander', '021':'HSBC',
        '030':'BanBajio', '036':'Inbursa', '044':'Scotiabank', '058':'Banregio',
        '072':'Banorte', '127':'Banco Azteca', '168':'Hey Banco', '638':'Nu Mexico'
    };
    const CLABE_BANK_OPTIONS = [...new Set(Object.values(CLABE_BANK_CODES))].sort((a, b) => a.localeCompare(b, 'es'));

    function sanitizeClabeV2(value) {
        return String(value || '').replace(/\D/g, '').slice(0, 18);
    }

    function isValidClabeV2(value) {
        const clabe = sanitizeClabeV2(value);
        if (!/^\d{18}$/.test(clabe)) return false;
        const weights = [3, 7, 1];
        const sum = clabe.slice(0, 17).split('').reduce((total, digit, index) => total + ((Number(digit) * weights[index % 3]) % 10), 0);
        return ((10 - (sum % 10)) % 10) === Number(clabe[17]);
    }

    class EmbeddedSolidarityClient {
        constructor(apiUrl = '', fetchImpl = globalThis.fetch.bind(globalThis)) {
            this.apiUrl = String(apiUrl).replace(/\/$/, '');
            this.fetch = fetchImpl;
        }

        async request(path, options) {
            const response = await this.fetch(`${this.apiUrl}${path}`, options);
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'No pudimos completar la solicitud.');
            return data;
        }

        async getOverview(memberstackId) {
            const id = encodeURIComponent(memberstackId);
            const [stats, history, balance] = await Promise.all([
                this.request(`/api/solidarity/stats?memberstackId=${id}`),
                this.request(`/api/solidarity/history?memberstackId=${id}`),
                this.request(`/api/solidarity/balance?memberstackId=${id}`),
            ]);
            return { stats, history, balance };
        }

        createRequest(payload) {
            return this.request('/api/solidarity/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }

        getDetail(requestId, memberstackId) {
            return this.request(`/api/solidarity/requests/${encodeURIComponent(requestId)}?memberstackId=${encodeURIComponent(memberstackId)}`);
        }

        getMessages(requestId, memberstackId) {
            return this.request(`/api/solidarity/requests/${encodeURIComponent(requestId)}/messages?memberstackId=${encodeURIComponent(memberstackId)}`);
        }

        sendMessage(requestId, payload) {
            return this.request(`/api/solidarity/requests/${encodeURIComponent(requestId)}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }

        async uploadDocument(file, memberstackId, docType) {
            const body = new FormData();
            body.append('file', file);
            body.append('memberstackId', memberstackId);
            body.append('docType', docType);
            return this.request('/api/upload/solidarity-document', { method: 'POST', body });
        }
    }

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@400;600;700&display=swap');

        :root {
            --pata-primary: #00BBB4;
            --pata-primary-light: #7DD8D5;
            --pata-action: #FE8F15;
            --pata-accent: #FFBD12;
            --pata-glass-bg: rgba(255, 255, 255, 0.85);
            --pata-glass-border: rgba(255, 255, 255, 0.3);
            --pata-shadow-premium: 0 20px 40px rgba(0, 0, 0, 0.1);
            --pata-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
            --pata-border-thick: 4px solid #000;
            --pata-border-thin: 2px solid #000;
        }

        body.pata-no-scroll {
            overflow: hidden !important;
        }

        .pata-unified-panel {
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border: none;
            border-radius: 0;
            padding: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            box-shadow: none;
            font-family: 'Outfit', sans-serif;
            color: #1A1A1A;
            display: none;
            position: relative;
            overflow: visible;
            transition: all 0.4s var(--pata-spring);
            box-sizing: border-box;
        }

        @media (max-width: 600px) {
            .pata-unified-panel {
                padding: 0;
                border-radius: 0;
                width: 100% !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            .pata-external-greeting {
                margin: 30px auto 15px auto !important;
                padding: 0 20px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .pata-welcome-title {
                font-size: clamp(32px, 11vw, 40px) !important;
                line-height: 0.95 !important;
                word-break: break-word !important;
            }
            .pata-welcome-subtitle {
                font-size: 15px !important;
                margin-top: 15px !important;
                line-height: 1.5 !important;
            }
            .pata-btn-ver-detalles {
                padding: 16px 20px !important;
                font-size: 15px !important;
                border-radius: 40px !important;
            }
            .pata-carencia-title {
                font-size: 26px !important;
                margin-bottom: 8px !important;
            }
            .pata-pet-info-box {
                padding: 20px !important;
                border-radius: 30px !important;
            }
            .pata-checklist-item {
                font-size: 14px !important;
            }
            .pata-tab-btn {
                padding: 10px 20px !important;
                font-size: 14px !important;
            }
        }

        .pata-unified-panel.show { 
            display: block; 
            animation: pataBounceIn 0.8s var(--pata-spring) forwards;
        }

        @keyframes pataBounceIn {
            0% { opacity: 0; transform: scale(0.9) translateY(40px); }
            70% { transform: scale(1.02) translateY(-5px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes pataSlideInFromRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .pata-slide-animate {
            animation: pataSlideInFromRight 0.5s var(--pata-spring) forwards;
        }

        /* External Greeting */
        .pata-external-greeting {
            width: 100%;
            margin: 40px auto 20px auto;
            font-family: 'Outfit', sans-serif;
            color: #FFFFFF;
            text-align: left;
            box-sizing: border-box;
        }

        .pata-welcome-title {
            font-size: clamp(48px, 10vw, 100px);
            font-weight: 900;
            margin: 0;
            line-height: 0.9;
            letter-spacing: -0.02em;
        }

        .pata-welcome-subtitle {
            font-size: clamp(16px, 2vw, 20px);
            font-weight: 600;
            margin: 20px 0 0 0;
            line-height: 1.4;
            max-width: 700px;
            opacity: 0.9;
        }

        /* Mobile Responsive Tabs */
        .pata-pet-tabs { 
            display: flex; 
            gap: 12px; 
            margin-bottom: 25px; 
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 10px 20px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }
        .pata-pet-tabs::-webkit-scrollbar { display: none; }

        .pata-tab-btn {
            background: #F0F2F5;
            border: var(--pata-border-thin);
            border-color: transparent;
            border-radius: 50px;
            padding: 12px 28px;
            cursor: pointer;
            transition: all 0.3s var(--pata-spring);
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #666;
            font-size: 16px;
            white-space: nowrap;
            flex-shrink: 0;
            min-height: 48px;
        }

        .pata-tab-btn:hover { transform: translateY(-2px); background: #E8EAED; }
        .pata-tab-btn.active { 
            background: var(--pata-primary); 
            color: #FFFFFF; 
            border-color: rgba(255,255,255,0.3);
            box-shadow: 0 8px 20px rgba(0, 187, 180, 0.3);
            transform: scale(1.05);
        }

        /* 📉 Unsubscription & Inactive States */
        .pata-grayscale {
            filter: grayscale(100%) !important;
            opacity: 0.7 !important;
        }
        
        .pata-grayscale-no-events {
            filter: grayscale(100%) !important;
            opacity: 0.8 !important;
            pointer-events: none !important;
            cursor: not-allowed !important;
        }
        
        .pata-grayscale-no-events * {
            pointer-events: none !important;
        }

        .pata-btn-unsubscribe {
            background: #f8f9fa;
            color: #666;
            border: 2px solid #ddd;
            border-radius: 50px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.2s;
            width: 100%;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .pata-btn-unsubscribe:hover {
            background: #fff5f5;
            color: #c62828;
            border-color: #c62828;
            transform: translateY(-2px);
        }

        /* 🔴 Modal Reason Styles */
        .pata-reason-item {
            display: block;
            padding: 16px 20px;
            border: 2px solid #eee;
            border-radius: 20px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 600;
        }
        
        .pata-reason-item:hover {
            border-color: var(--pata-primary);
            background: #f0fdfc;
        }
        
        .pata-reason-item.selected {
            border-color: var(--pata-primary);
            background: #e6fffa;
            box-shadow: 0 4px 12px rgba(0, 187, 180, 0.1);
        }

        /* Approved View Layout */
        .pata-approved-grid {
            display: grid;
            grid-template-columns: 1fr minmax(300px, 340px);
            gap: 30px;
            align-items: flex-start;
        }

        @media (max-width: 900px) {
            .pata-approved-grid { grid-template-columns: 1fr; }
        }

        .pata-carencia-title {
            font-size: clamp(32px, 5vw, 44px);
            font-weight: 900;
            color: var(--pata-primary);
            margin: 0 0 10px 0;
            line-height: 1.1;
            text-transform: lowercase;
            letter-spacing: -0.02em;
        }

        .pata-pet-profile {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }

        @media (max-width: 600px) {
            .pata-pet-profile {
                flex-direction: column;
                align-items: stretch;
            }
            .pata-pet-photo-box {
                width: 100% !important;
                height: 200px !important;
            }
            .pata-approved-sidebar {
                margin-top: 30px;
            }
        }

        /* 💬 Chat Styles */
        .pata-chat-container {
            margin-top: 40px;
            background: #fff;
            border-radius: 35px;
            border: var(--pata-border-thick);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            height: auto;
            min-height: 380px;
            box-shadow: 8px 8px 0 rgba(0,0,0,0.04);
            transition: all 0.3s ease;
        }

        .pata-chat-header {
            padding: 16px 25px;
            background: var(--pata-primary);
            color: #fff;
            font-weight: 950;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-bottom: var(--pata-border-thick);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .pata-chat-messages {
            flex: 1;
            overflow-y: visible;
            padding: 25px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            background-color: transparent;
        }

        .pata-chat-bubble {
            max-width: 85%;
            padding: 16px 20px;
            border-radius: 24px;
            font-size: 14.5px;
            line-height: 1.6;
            position: relative;
            font-weight: 700;
            border: 3px solid #000;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.05);
            word-wrap: break-word;
        }

        .pata-chat-bubble.admin {
            align-self: flex-start;
            background: #fff;
            border-bottom-left-radius: 6px;
            color: #1A1A1A;
        }

        .pata-chat-bubble.user {
            align-self: flex-end;
            background: var(--pata-primary);
            color: #fff;
            border-bottom-right-radius: 6px;
        }

        .pata-chat-input-area {
            padding: 18px;
            background: #fff;
            border-top: var(--pata-border-thick);
            display: flex;
            gap: 12px;
            align-items: center;
        }

        /* Progress Bar */
        .pata-progress-container-v2 {
            margin-top: 25px;
        }
        .pata-progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 15px;
            font-weight: 700;
            color: #1A1A1A;
        }
        .pata-bar-v2 {
            height: 22px;
            background: #F0F2F5;
            border-radius: 50px;
            border: var(--pata-border-thin);
            padding: 4px;
            position: relative;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }

        .pata-fill-v2 {
            height: 100%;
            background: linear-gradient(90deg, var(--pata-primary) 0%, var(--pata-primary-light) 100%);
            border-radius: 50px;
            transition: width 1.5s var(--pata-spring);
            position: relative;
            overflow: hidden;
        }
        .pata-fill-v2::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: pataShine 2s infinite;
        }
        @keyframes pataShine {
            from { transform: translateX(-100%); }
            to { transform: translateX(100%); }
        }

        .pata-bar-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 13px;
            font-weight: 900;
            color: #666;
            padding: 0 5px;
        }

        /* Pet Profile Cards */
        .pata-pet-photo-box {
            width: 140px;
            height: 140px;
            background: var(--pata-primary);
            border-radius: 24px;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            border: var(--pata-border-thin);
        }

        .pata-pet-info-box {
            flex: 1;
            background: var(--pata-primary);
            border-radius: 24px;
            padding: 20px;
            color: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: var(--pata-border-thin);
            box-shadow: 8px 8px 0 rgba(0,0,0,0.05);
        }

        /* Modal Base Styles */
        .pata-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
        }

        .pata-modal-overlay.show { display: flex; }

        .pata-modal {
            background: #FFFFFF;
            width: 100%;
            max-width: 550px;
            border-radius: 40px;
            border: var(--pata-border-thick);
            overflow: visible;
            box-shadow: 0 30px 60px rgba(0,0,0,0.25);
            animation: pataModalSlideUp 0.5s var(--pata-spring) forwards;
        }

        #pata-member-welcome-modal {
            background: rgba(30, 83, 80, 0.4);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
        }

        .pata-member-welcome-modal {
            width: min(420px, calc(100vw - 40px));
            max-width: 420px;
            padding: 32px;
            border: 0;
            border-radius: 24px;
            background: #FFFFFF;
            box-shadow: 0 24px 60px rgba(30, 83, 80, 0.25);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .pata-member-welcome-icon {
            width: 54px;
            height: 54px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            color: #1CBcad;
        }

        .pata-member-welcome-icon svg {
            width: 52px;
            height: 52px;
            display: block;
        }

        .pata-member-welcome-title {
            font-family: 'Fraiche', 'Outfit', sans-serif;
            font-size: 26px;
            line-height: 1.15;
            margin: 0 0 16px;
            color: #1E5350;
        }

        .pata-member-welcome-text {
            color: #6B7C79;
            font-size: 14px;
            line-height: 1.65;
            font-weight: 400;
            margin: 0 0 16px;
        }

        .pata-member-welcome-btn {
            width: 100%;
            height: 48px;
            border: 0;
            border-radius: 999px;
            background: #1CBcad;
            color: #FFFFFF;
            padding: 0 24px;
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: none;
            transition: background-color 0.2s ease, opacity 0.2s ease;
        }

        .pata-member-welcome-btn:hover {
            background: #0E8377;
        }

        .pata-member-welcome-btn:disabled {
            cursor: wait;
            opacity: 0.65;
        }

        @media (max-width: 600px) {
            .pata-member-welcome-modal {
                padding: 28px 22px;
            }
        }

        @keyframes pataModalSlideUp { 
            from { transform: translateY(40px) scale(0.95); opacity: 0; } 
            to { transform: translateY(0) scale(1); opacity: 1; } 
        }

        /* Editorial Modal Distribution */
        .pata-amiga-container {
            width: 100%;
            max-width: 1400px;
        }
        .pata-editorial-container {
            max-width: 1100px;
            width: 95%;
            max-height: 92vh;
            border-radius: 40px;
            border: var(--pata-border-thick);
            overflow-y: auto;
            overflow-x: hidden;
            background: #fff;
            display: flex;
            flex-direction: column;
            animation: pataModalSlideUp 0.5s var(--pata-spring) forwards;
            position: relative;
            scrollbar-width: thin;
            scrollbar-color: var(--pata-primary) transparent;
        }

        .pata-editorial-container::-webkit-scrollbar {
            width: 10px;
        }
        .pata-editorial-container::-webkit-scrollbar-track {
            background: transparent;
            margin: 30px 0;
        }
        .pata-editorial-container::-webkit-scrollbar-thumb {
            background: var(--pata-primary);
            border-radius: 10px;
            border: 3px solid #fff;
        }

        .pata-editorial-body {
            display: grid;
            grid-template-columns: minmax(320px, 440px) 1fr;
            height: auto;
            overflow: visible;
        }

        .pata-editorial-left {
            background: var(--pata-primary-light);
            padding: 40px;
            display: flex;
            flex-direction: column;
            gap: 25px;
            border-right: var(--pata-border-thick);
            overflow-y: visible;
        }

        .pata-editorial-right {
            padding: 50px;
            background: #fff;
            overflow-y: visible;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .pata-editorial-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px 30px;
            margin-bottom: 30px;
            width: 100%;
        }

        .pata-info-card {
            background: var(--pata-primary-light);
            border-radius: 24px;
            padding: 24px;
            border: var(--pata-border-thin);
            margin-bottom: 30px;
        }

        .pata-info-card-title {
            font-size: 10px;
            font-weight: 800;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin: 0 0 16px 0;
            opacity: 0.6;
        }

        .pata-info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }

        .pata-info-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .pata-info-icon-wrap {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            flex-shrink: 0;
            border: 2px solid #000;
        }

        .pata-info-icon-wrap img {
            width: 22px;
            height: 22px;
            object-fit: contain;
        }

        .pata-info-texts {
            display: flex;
            flex-direction: column;
        }

        .pata-info-label {
            font-size: 9px;
            font-weight: 800;
            color: #718096;
            text-transform: uppercase;
            line-height: 1;
            margin-bottom: 2px;
        }

        .pata-info-value {
            font-size: 14px;
            font-weight: 700;
            color: #1A1A1E;
            line-height: 1.2;
        }

        .pata-editorial-name {
            font-size: clamp(48px, 6vw, 72px);
            font-weight: 950;
            line-height: 0.85;
            margin: 0 0 10px 0;
            letter-spacing: -0.04em;
            color: #000;
            text-transform: lowercase;
        }

        .pata-editorial-main-img-box {
            width: 100%; 
            height: 440px; 
            background: #fff; 
            border-radius: 35px; 
            border: var(--pata-border-thick); 
            overflow: hidden; 
            position: relative; 
            box-shadow: 12px 12px 0 rgba(0,0,0,0.05); 
            transform: rotate(-1deg);
            transition: all 0.3s ease;
        }

        @media (max-width: 900px) {
            .pata-editorial-container {
                max-height: 95vh;
                border-radius: 35px;
                width: 98%;
            }
            .pata-editorial-body {
                grid-template-columns: 1fr;
                overflow-y: visible; 
                height: auto;
            }
            .pata-editorial-info-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            .pata-info-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            .pata-info-card {
                padding: 20px;
                border-radius: 22px;
            }
            .pata-editorial-left, .pata-editorial-right {
                overflow-y: visible; 
                height: auto;
            }
            .pata-editorial-left {
                border-right: none;
                border-bottom: var(--pata-border-thick);
                padding: 24px;
                gap: 15px;
            }
            .pata-editorial-right {
                padding: 35px 25px;
            }
            .pata-editorial-main-img-box {
                height: 280px;
                transform: rotate(0);
                border-radius: 25px;
            }
            .pata-editorial-name {
                font-size: 40px;
            }
        }

        /* ❌ REMOVED SIDE-STRIPE BAN 1 ❌ */
        .pata-benefits-review {
            margin-top: 40px;
            padding: 35px;
            background: #FFFFFF;
            border-radius: 40px;
            border: var(--pata-border-thin);
            text-align: left;
            box-shadow: 0 15px 45px rgba(0, 187, 180, 0.08);
            position: relative;
        }
        
        .pata-benefits-review::before { display: none; } /* Kill the side-stripe */
        
        /* Replace with a more distinctive header */
        .pata-benefits-title {
            font-size: 22px;
            font-weight: 950;
            color: var(--pata-primary);
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 12px;
            text-transform: lowercase;
            letter-spacing: -0.5px;
            padding-bottom: 12px;
            border-bottom: 2px dashed var(--pata-primary-light);
        }

        .pata-checklist {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin: 25px 0;
        }
        .pata-checklist-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 600;
            color: #444;
        }
        .pata-checklist-icon {
            width: 24px;
            height: 24px;
            background: #00BBB4;
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            flex-shrink: 0;
            border: 1.5px solid #000;
        }

        .pata-disclaimer {
            font-size: 13px;
            color: #888;
            text-align: center;
            margin-top: 15px;
            font-style: italic;
        }

        /* Editorial & Benefits Improvements */
        .pata-benefit-card {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            align-items: flex-start;
            padding: 24px;
            border-radius: 35px;
            background: #fff;
            border: var(--pata-border-thin);
            box-shadow: 6px 6px 0 rgba(0, 187, 180, 0.05);
            transition: all 0.3s var(--pata-spring);
        }
        .pata-benefit-card:hover {
            transform: scale(1.02);
            box-shadow: 10px 10px 0 rgba(0, 187, 180, 0.1);
        }

        .pata-benefit-icon-box {
            font-size: 28px;
            background: #FFFFFF;
            color: var(--pata-primary);
            width: 56px;
            height: 56px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: var(--pata-border-thin);
            box-shadow: 4px 4px 0 rgba(0, 187, 180, 0.1);
        }

        /* Utilities */
        .pata-btn {
            background: #1A1A1A;
            color: #fff;
            padding: 16px 36px;
            border-radius: 60px;
            border: var(--pata-border-thin);
            font-weight: 900;
            cursor: pointer;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            text-decoration: none !important;
            transition: all 0.2s var(--pata-spring);
        }
        .pata-btn:hover { transform: translateY(-3px); box-shadow: 6px 6px 0 rgba(0,0,0,0.1); }
        
        .pata-btn-ver-detalles {
            background: var(--pata-accent);
            color: #000 !important;
            border: var(--pata-border-thin);
            border-radius: 50px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
            transition: all 0.2s;
        }

        .pata-orange-alert {
            background: var(--pata-accent);
            border-radius: 24px;
            padding: 16px 20px;
            display: flex;
            gap: 16px;
            align-items: center;
            margin-bottom: 20px;
            color: #1A1A1A;
            border: var(--pata-border-thin);
            box-shadow: 4px 4px 0 rgba(0,0,0,0.05);
            font-family: var(--pata-font-body);
        }

        .pata-alert-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .pata-alert-list li {
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .pata-upload-preview {
            max-width: 100%;
            max-height: 180px;
            object-fit: contain;
            border-radius: 16px;
            border: var(--pata-border-thin);
            margin-bottom: 12px;
            background: #f8f8f8;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
        }

        .pata-modal-scrollable {
            max-height: 70vh;
            overflow-y: auto;
            padding-right: 10px;
        }
        .pata-modal-scrollable::-webkit-scrollbar { width: 6px; }
        .pata-modal-scrollable::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }

        /* ❌ Rejected State Premium Styles */
        .pata-rejected-wrapper {
            position: relative;
            padding: 40px 0;
            margin-top: 20px;
        }

        .pata-rejected-white-card {
            background: #FFFFFF;
            border-radius: 50px;
            border: var(--pata-border-thick);
            padding: 50px;
            position: relative;
            display: grid;
            grid-template-columns: 1fr 200px;
            gap: 30px;
            box-shadow: 15px 15px 0 rgba(0,0,0,0.05);
            overflow: visible;
        }

        .pata-rejected-dog-popout {
            position: absolute;
            right: -20px;
            top: -60px;
            width: 280px;
            z-index: 5;
            filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
            pointer-events: none;
        }

        .pata-rejected-title-hero {
            font-size: clamp(32px, 5vw, 48px);
            font-weight: 950;
            line-height: 0.95;
            margin: 0 0 15px 0;
            letter-spacing: -0.04em;
            color: #000;
        }

        .pata-rejected-text-hero {
            font-size: 18px;
            line-height: 1.5;
            color: #444;
            margin: 0;
            max-width: 90%;
        }

        .pata-rejected-reason-box {
            margin-top: 30px;
            padding: 25px;
            background: #FFF5F5;
            border-radius: 30px;
            border: 2px dashed #C62828;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        @media (max-width: 900px) {
            .pata-rejected-white-card {
                grid-template-columns: 1fr;
                padding: 40px 30px;
                border-radius: 40px;
            }
            .pata-rejected-dog-popout {
                width: 180px;
                top: -40px;
                right: 0;
            }
            .pata-dog-placeholder { display: none; }
        }

        /* 📸 Mobile Carousel & Accordion Improvements */
        .pata-photo-carousel {
            display: none;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 15px;
            padding: 10px 5px;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
        }
        .pata-photo-carousel::-webkit-scrollbar { display: none; }
        .pata-photo-carousel .pata-carousel-item {
            flex: 0 0 85%;
            scroll-snap-align: center;
            height: 220px;
            background: #fff;
            border-radius: 35px;
            border: var(--pata-border-thick);
            overflow: hidden;
            box-shadow: 12px 12px 0 rgba(0,0,0,0.05);
        }

        .pata-mobile-accordion {
            display: none;
            width: 100%;
            margin-top: 20px;
        }
        .pata-mobile-accordion summary {
            list-style: none;
            padding: 15px 20px;
            background: #F0F2F5;
            border-radius: 18px;
            border: var(--pata-border-thin);
            font-weight: 900;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.2s;
            outline: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        .pata-mobile-accordion summary::-webkit-details-marker { display: none; }
        .pata-mobile-accordion summary::after {
            content: '↓';
            font-size: 18px;
            transition: transform 0.3s;
        }
        .pata-mobile-accordion[open] summary::after {
            transform: rotate(180deg);
        }

        /* Scroll Lock Class */
        .pata-no-scroll {
            overflow: hidden !important;
            height: 100vh !important;
        }

        @media (max-width: 900px) {
            .pata-photo-carousel { display: flex; }
            .pata-editorial-left .pata-editorial-main-img-box,
            .pata-editorial-left .pata-no-scrollbar { display: none; }
            
            .pata-editorial-right .pata-editorial-info-grid,
            .pata-editorial-right > .pata-info-card { display: none; }
            .pata-mobile-accordion { display: block; }
            .pata-mobile-accordion .pata-info-card { display: block !important; }
            .pata-mobile-accordion .pata-info-grid { display: grid !important; }
            
            .pata-editorial-left { padding: 15px; border-bottom: none; }
            .pata-editorial-right { padding: 20px 25px 30px !important; }
            
            .pata-editorial-container { 
                border-radius: 35px 35px 0 0; 
                max-height: 88vh !important; 
                height: auto !important; 
                overflow-y: auto !important;
                overflow-x: hidden !important;
                width: 100% !important;
                margin-top: auto; /* Push to bottom for bottom-sheet feel */
            }
            .pata-editorial-body { 
                display: block !important;
                height: auto !important; 
                overflow: visible !important; 
            }
            .pata-modal-overlay {
                align-items: flex-end; /* Mobile bottom sheet */
                padding: 0;
            }
        }

        /* 🟠 Temas de Color */
        .pata-theme-orange {
            position: relative;
            overflow: visible;
            min-height: auto;
        }

        /* ❌ Estilos Vista Rechazada (Nuevo Diseño) */
        .pata-rejected-bg-overlay {
            position: absolute; 
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: transparent;
            z-index: 0;
            pointer-events: none;
        }
        
        .pata-rejected-wrapper {
            position: relative;
            z-index: 1;
            padding: 40px 0;
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            box-sizing: border-box;
            min-height: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: visible;
        }

        .pata-rejected-content-container {
            width: 100%;
            max-width: 900px; /* Slightly wider */
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            position: relative;
            z-index: 5;
        }

        .pata-rejected-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 100px; /* Bigger as in Figma */
            line-height: 0.9;
            color: #FFFFFF;
            margin: 0 0 20px 0;
            text-transform: lowercase;
            font-weight: 400;
            letter-spacing: -3px;
            width: 100%;
            max-width: 900px;
            z-index: 10;
        }

        .pata-rejected-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 400; /* Regular */
            color: #000000;
            margin: 0 0 50px 0;
            line-height: 1.4;
            max-width: 800px;
            z-index: 10;
        }

        .pata-rejected-card {
            background: #FFFFFF;
            border-radius: 66px;
            padding: 50px 60px;
            width: 100%;
            box-sizing: border-box;
            position: relative;
            z-index: 2;
            box-shadow: 15px 15px 0 rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 0;
            border: none;
            overflow: visible; 
            min-height: auto;
        }

        .pata-rejected-description {
            font-size: 20px;
            font-weight: 600;
            color: #000;
            line-height: 1.4;
            margin: 0 0 40px 0;
            font-family: 'Outfit', sans-serif;
            max-width: 90%;
        }

        /* .pata-rejected-image-container removed as requested - now background */
        
        .pata-rejected-divider {
            height: 1px;
            background: rgba(0, 0, 0, 0.1);
            width: 100%;
            margin: 0 0 30px 0;
        }
        
        .pata-rejected-reason-title {
            font-size: 18px;
            font-weight: 800;
            color: #000;
            margin-bottom: 15px;
            font-family: 'Outfit', sans-serif;
        }
        
        .pata-rejected-reason-body {
            font-size: 16px;
            font-weight: 500;
            color: #000;
            line-height: 1.6;
            font-family: 'Outfit', sans-serif;
            margin: 0;
            max-width: 100%;
        }

        .pata-rejected-external-actions {
            margin-top: 40px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center; /* Centered */
            text-align: center;
        }

        .pata-btn-appeal {
            background: #15BEB2;
            color: #000 !important;
            border: 3px solid #000;
            border-radius: 60px;
            padding: 20px 50px;
            font-family: 'Fraiche', sans-serif;
            font-size: 28px;
            font-weight: 950;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: lowercase;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            box-shadow: 8px 8px 0 #000;
            margin-bottom: 15px; /* Added margin */
        }

        .pata-btn-appeal:hover {
            transform: translate(-2px, -2px);
            box-shadow: 12px 12px 0 #000;
            background: #12A99E;
        }

        .pata-btn-appeal:active {
            transform: translate(2px, 2px);
            box-shadow: 4px 4px 0 #000;
        }

        .pata-appeal-footer-text {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 600;
            color: #000000; /* Black as requested */
            margin: 0;
            text-align: center;
        }

        /* ⏳ PENDING VIEW REDESIGN (NEO-BRUTALIST) */
        .pata-pending-wrapper {
            min-height: auto !important;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: visible !important;
            position: relative;
            padding: 40px 0;
            font-family: 'Outfit', sans-serif;
            width: 100%;
            box-sizing: border-box;
            background: transparent !important;
        }

        .pata-pending-bg-letter {
            display: none;
        }

        .pata-pending-container {
            width: 100%;
            max-width: 1100px;
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .pata-pending-header {
            max-width: 900px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .pata-pending-header h1 {
            color: white;
            font-size: clamp(48px, 8vw, 100px);
            font-weight: 800;
            line-height: 1;
            letter-spacing: -0.02em;
            margin: 0;
            text-transform: lowercase;
            font-family: 'Fraiche', sans-serif;
        }

        .pata-pending-header-sub {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: clamp(16px, 2vw, 20px);
            line-height: 1.4;
            color: white;
            font-weight: 500;
        }

        .pata-pending-card {
            background: #FFFFFF;
            border-radius: 66px;
            padding: clamp(24px, 5vw, 48px);
            display: flex;
            flex-direction: column;
            gap: 32px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
        }

        .pata-pending-card-header {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-pending-card-title {
            font-size: clamp(32px, 5vw, 50px);
            font-weight: 800;
            line-height: 1.1;
            margin: 0;
            color: #000;
            font-family: 'Fraiche', sans-serif;
        }

        .pata-pending-card-intro {
            font-size: clamp(16px, 1.5vw, 20px);
            color: rgba(0, 0, 0, 0.7);
            max-width: 750px;
            line-height: 1.5;
            font-weight: 500;
        }

        .pata-pending-progress-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-pending-progress-labels {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: 600;
            color: #000;
        }

        .pata-pending-progress-bar-container {
            width: 100%;
            height: 24px;
            background: #f0f0f0;
            border-radius: 50px;
            border: 2px solid #000;
            overflow: hidden;
            position: relative;
        }

        .pata-pending-progress-bar-fill {
            height: 100%;
            width: 0%; /* Initial width for animation */
            background: #15BEB2;
            border-radius: 50px;
            transition: width 1.5s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .pata-pending-checklist-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
            background: #FFFFFF;
            padding: 12px 0;
        }

        .pata-pending-checklist-title {
            font-size: 18px;
            font-weight: 800;
            color: #000;
        }

        .pata-pending-checklist {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 0;
            margin: 0;
        }

        .pata-pending-checklist-item {
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 16px;
            color: #000;
            font-weight: 500;
        }

        .pata-pending-check-box {
            width: 24px;
            height: 24px;
            background: #78EB7B;
            border: 2px solid #000;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
        }

        .pata-pending-check-box::after {
            content: '';
            width: 12px;
            height: 8px;
            background: #C9F7CA;
            display: block;
        }

        .pata-pending-card-footer-note {
            font-size: 14px;
            color: #000;
            opacity: 0.7;
            font-weight: 600;
        }

        .pata-pending-cta-container {
            display: flex;
            justify-content: center;
            margin-top: 10px;
        }

        .pata-pending-btn-main {
            background: #15BEB2;
            color: #000;
            padding: 18px 60px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: 900;
            text-decoration: none;
            transition: all 0.3s ease;
            border: 3px solid #000;
            cursor: pointer;
            box-shadow: 8px 8px 0 #000;
            text-align: center;
            font-family: 'Fraiche', sans-serif;
        }

        .pata-pending-btn-main:hover {
            transform: translate(-2px, -2px);
            box-shadow: 12px 12px 0 #000;
            background-color: #12A99E;
        }

        .pata-pending-control-badge {
            background: rgba(21, 190, 178, 0.1);
            border: 2px dashed #15BEB2;
            padding: 20px;
            border-radius: 30px;
            text-align: center;
            margin-top: 20px;
        }

        .pata-pending-control-title {
            margin: 0;
            font-size: 16px;
            font-weight: 950;
            color: #008884;
        }

        .pata-pending-control-text {
            margin: 8px 0 0 0;
            font-size: 14px;
            color: #444;
            line-height: 1.4;
        }

        @media (max-width: 768px) {
            .pata-pending-wrapper {
                padding: 40px 16px;
            }
            .pata-pending-header h1 {
                text-align: center;
                font-size: 48px;
            }
            .pata-pending-header-sub {
                text-align: center;
            }
            .pata-pending-card {
                border-radius: 40px;
            }
            .pata-pending-btn-main {
                width: 100%;
            }
        }

        /* 🎁 BENEFITS STYLING (NEO-BRUTALIST) */
        .pata-benefits-review {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin: 10px 0;
        }

        .pata-benefits-title {
            font-size: 20px;
            font-weight: 800;
            color: #000;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Fraiche', sans-serif;
            text-transform: lowercase;
        }

        .pata-benefit-card {
            background: #FFFFFF;
            border: 2px solid #000;
            border-radius: 30px;
            padding: 24px;
            display: flex;
            gap: 20px;
            box-shadow: 6px 6px 0 rgba(0,0,0,0.05);
            transition: all 0.2s ease;
        }

        .pata-benefit-card:hover {
            transform: translate(-2px, -2px);
            box-shadow: 8px 8px 0 rgba(0,0,0,0.08);
        }

        .pata-benefit-icon-box {
            font-size: 32px;
            background: #F8F9FA;
            width: 60px;
            height: 60px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #000;
            flex-shrink: 0;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
        }

        .pata-benefit-info h4 {
            margin: 0 0 6px 0;
            font-size: 18px;
            font-weight: 900;
            color: #000;
            font-family: 'Outfit', sans-serif;
        }

        .pata-benefit-info p {
            margin: 0;
            font-size: 15px;
            color: #444;
            line-height: 1.5;
            font-weight: 500;
        }

        .pata-pati-message {
            margin-top: 12px;
            font-style: italic;
            font-size: 14px;
            color: #15BEB2;
            font-weight: 600;
            padding-left: 14px;
            border-left: 3px solid #15BEB2;
            line-height: 1.4;
        }

        @media (max-width: 900px) {
            .pata-rejected-wrapper {
                padding: 40px 20px;
            }
            .pata-rejected-title {
                font-size: 48px;
                line-height: 1.1;
                margin-bottom: 10px;
            }
            .pata-rejected-subtitle {
                font-size: 18px;
                margin-bottom: 30px;
                line-height: 1.3;
            }
            .pata-rejected-card {
                padding: 40px 30px;
                border-radius: 40px;
            }
        }

        /* 🆕 Pet Selector for Rejected View */
        .pata-rejected-pet-selector {
            display: flex;
            gap: 12px;
            margin-bottom: 35px;
            overflow-x: auto;
            padding: 10px 5px;
            scrollbar-width: none;
            justify-content: center;
            width: 100%;
        }
        .pata-rejected-pet-selector::-webkit-scrollbar { display: none; }
        
        .pata-rejected-pet-selector .pata-tab-btn {
            background: rgba(255, 255, 255, 0.15);
            border: 2px solid rgba(0, 0, 0, 0.1);
            color: #fff;
            opacity: 0.7;
            backdrop-filter: blur(5px);
        }
        
        .pata-rejected-pet-selector .pata-tab-btn.active {
            background: #FFFFFF;
            opacity: 1;
            color: #000;
            border-color: #000;
            box-shadow: 6px 6px 0 rgba(0,0,0,0.2);
            transform: scale(1.1);
        }

        /* ⚠️ ACTION REQUIRED / MISSING INFO STYLES */
        .pata-bg-letter {
            display: none;
        }

        .pata-missing-header {
            max-width: 900px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 32px;
            text-align: left;
            position: relative;
            z-index: 2;
        }

        .pata-missing-header h1 {
            color: white !important;
            font-size: clamp(48px, 8vw, 100px);
            font-weight: 800;
            line-height: 1;
            letter-spacing: -0.02em;
            margin: 0;
            font-family: 'Fraiche', sans-serif;
            text-transform: lowercase;
        }

        .pata-missing-header-sub {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: clamp(16px, 2vw, 18px);
            line-height: 1.4;
            color: #000;
            font-weight: 500;
        }

        .pata-missing-card {
            background: #FFFFFF;
            border-radius: 66px;
            padding: clamp(24px, 5vw, 48px);
            width: 100%;
            box-sizing: border-box;
            position: relative;
            z-index: 2;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            gap: 32px;
            border: none;
        }

        .pata-missing-card-header {
            display: flex;
            flex-direction: column;
            gap: 12px;
            text-align: left;
        }

        .pata-missing-card-title {
            font-size: clamp(32px, 5vw, 50px);
            font-weight: 800;
            line-height: 1.1;
            margin: 0;
            color: #000;
            font-family: 'Fraiche', sans-serif;
            text-transform: lowercase;
        }

        .pata-missing-card-intro {
            font-size: clamp(16px, 1.5vw, 20px);
            color: rgba(0, 0, 0, 0.7);
            max-width: 750px;
            line-height: 1.5;
            font-weight: 500;
        }

        .pata-info-missing-box {
            background: #CAF5F2;
            border: 3px solid #000;
            border-radius: 30px;
            padding: 30px;
            display: flex;
            align-items: center;
            gap: 24px;
            box-shadow: 6px 6px 0 #000;
            position: relative;
            z-index: 2;
        }

        .pata-upload-icon {
            width: 80px;
            height: 80px;
            background: #FFFFFF;
            border: 3px solid #000;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 4px 4px 0 #000;
            color: #15BEB2;
        }

        .pata-upload-icon svg {
            width: 40px;
            height: 40px;
        }

        .pata-info-text-card {
            display: flex;
            flex-direction: column;
            gap: 8px;
            text-align: left;
            flex: 1;
        }

        .pata-info-text-card h3 {
            font-size: 20px;
            font-weight: 900;
            margin: 0;
            color: #000;
        }

        .pata-info-text-card p {
            font-size: 16px;
            color: #000;
            line-height: 1.5;
            margin: 0;
            font-weight: 500;
        }

        .pata-btn-group {
            display: flex;
            gap: 16px;
            margin-top: 10px;
            flex-wrap: wrap;
        }

        .pata-btn-primary {
            background: #15BEB2 !important;
            color: #000 !important;
            border: 3px solid #000 !important;
            box-shadow: 6px 6px 0 #000 !important;
            font-size: 20px !important;
            padding: 18px 48px !important;
            font-family: 'Fraiche', sans-serif !important;
            text-transform: lowercase !important;
        }

        .pata-btn-outline {
            background: transparent !important;
            color: #000 !important;
            border: 3px solid #000 !important;
            box-shadow: 6px 6px 0 #000 !important;
            font-size: 20px !important;
            padding: 18px 48px !important;
            font-family: 'Fraiche', sans-serif !important;
            text-transform: lowercase !important;
        }

        .pata-badge {
            background: rgba(0, 0, 0, 0.05);
            border: 2px dashed rgba(0, 0, 0, 0.15);
            border-radius: 30px;
            padding: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 10px;
        }

        .pata-badge-icon {
            font-size: 32px;
            flex-shrink: 0;
        }

        .pata-badge-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: left;
        }

        .pata-badge-content strong {
            font-size: 16px;
            font-weight: 800;
            color: #000;
        }

        .pata-badge-content p {
            font-size: 14px;
            color: rgba(0, 0, 0, 0.6);
            margin: 0;
            line-height: 1.4;
            font-weight: 500;
        }

        /* 🎁 Benefits Section */
        .pata-benefits-review {
            background: rgba(0, 0, 0, 0.05);
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 40px;
            padding: 32px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin-top: 10px;
        }

        .pata-benefits-title {
            font-size: 22px;
            font-weight: 800;
            color: #000;
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0;
            font-family: 'Fraiche', sans-serif;
            text-transform: lowercase;
        }

        .pata-benefit-card {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }

        .pata-benefit-icon-box {
            width: 50px;
            height: 50px;
            background: #fff;
            border: 2px solid #000;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            flex-shrink: 0;
            box-shadow: 3px 3px 0 #000;
        }

        .pata-benefit-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .pata-benefit-info h4 {
            font-size: 16px;
            font-weight: 800;
            color: #000;
            margin: 0;
        }

        .pata-benefits-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            width: 100%;
            margin: 0 auto;
        }

        .pata-pati-message {
            margin-top: 10px;
            padding: 12px 20px;
            background: #fff;
            border: 2px solid #000;
            border-radius: 15px;
            font-size: 13px;
            font-style: italic;
            color: #000;
            position: relative;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.05);
            font-family: 'Outfit', sans-serif;
        }

        .pata-pati-message::before {
            content: '';
            position: absolute;
            top: -10px;
            left: 20px;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 10px solid #000;
        }

        @media (max-width: 900px) {
            .test-widget-user {
                padding: 0 !important;
            }
            .pata-benefits-grid {
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            .pata-benefit-card {
                padding: 12px !important;
                border-radius: 20px !important;
                gap: 8px !important;
                flex-direction: column !important;
                align-items: flex-start !important;
            }
            .pata-benefit-icon-box {
                width: 20px !important;
                height: 20px !important;
                font-size: 11px !important;
                border-radius: 6px !important;
                border-width: 1.5px !important;
                box-shadow: 2px 2px 0 rgba(0,0,0,0.1) !important;
            }
            .pata-benefit-info h4 {
                font-size: 13px !important;
                line-height: 1.2 !important;
            }
            .pata-benefit-info p {
                font-size: 11px !important;
                line-height: 1.3 !important;
            }
            .pata-pati-message {
                padding: 6px 10px !important;
                font-size: 10px !important;
                margin-top: 6px !important;
                border-radius: 10px !important;
            }
        }

        /* 🏆 DASHBOARD V3 (APPROVED DUAL CARD - NEO-BRUTALIST) */
        .pata-approved-wrapper-new {
            width: 100%;
            min-height: auto !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: transparent !important;
            overflow: visible !important;
        }

        .pata-container-new {
            width: 100%;
            max-width: 1300px;
            margin: 0 auto;
            padding: 0;
            display: flex;
            flex-direction: column;
        }

        .pata-header-new {
            text-align: left;
            margin-bottom: 30px;
            color: #000;
        }

        .pata-header-new h1 {
            font-family: 'Fraiche', sans-serif;
            font-size: clamp(40px, 8vw, 80px);
            margin: 0;
            line-height: 0.9;
            color: #000 !important;
            text-transform: lowercase;
        }

        .pata-header-sub-new {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            margin-top: 12px;
            font-weight: 500;
            opacity: 0.8;
        }

        .pata-card-new {
            background: #FFFFFF;
            border: 3px solid #000;
            border-radius: 60px;
            padding: 50px;
            box-shadow: 15px 15px 0 rgba(0,0,0,0.03);
            width: 100%;
            box-sizing: border-box;
            position: relative;
            text-align: left;
        }

        @media (max-width: 768px) {
            .pata-card-new {
                padding: 25px;
                border-radius: 35px;
            }
        }

        .pata-approved-grid-new {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
        }

        .pata-approved-banner-new {
            background: #FFBD00;
            border: 3px solid #000;
            border-radius: 20px;
            padding: 15px 25px;
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }

        .pata-banner-icon-new {
            width: 38px;
            height: 38px;
            background-image: url("data:image/svg+xml,%3Csvg width='41' height='41' viewBox='0 0 41 41' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_2014_45425)'%3E%3Cpath d='M20.3703 6.36C19.5603 6.36 18.9103 5.71 18.9103 4.9V1.46C18.9003 0.65 19.5603 0 20.3703 0C21.1803 0 21.8303 0.65 21.8303 1.46V4.9C21.8303 5.71 21.1803 6.36 20.3703 6.36Z' fill='%23222221'/%3E%3Cpath d='M35.8304 33.86H4.90043C4.09043 33.86 3.44043 33.21 3.44043 32.4C3.44043 31.59 4.09043 30.94 4.90043 30.94H35.8304C36.6404 30.94 37.2904 31.59 37.2904 32.4C37.2904 33.21 36.6404 33.86 35.8304 33.86Z' fill='%23222221'/%3E%3Cpath d='M20.37 40.73C16.72 40.73 13.75 37.76 13.75 34.11C13.75 33.3 14.4 32.65 15.21 32.65C16.02 32.65 16.67 33.3 16.67 34.11C16.67 36.15 18.33 37.8 20.36 37.8C22.39 37.8 24.05 36.14 24.05 34.11C24.05 33.3 24.7 32.65 25.51 32.65C26.32 32.65 26.97 33.3 26.97 34.11C26.97 37.76 24 40.73 20.35 40.73H20.37Z' fill='%23222221'/%3E%3Cpath d='M15.21 35.57C14.4 35.57 13.75 34.92 13.75 34.11V32.39C13.75 31.58 14.4 30.93 15.21 30.93C16.02 30.93 16.67 31.58 16.67 32.39V34.11C16.67 34.92 16.02 35.57 15.21 35.57Z' fill='%23222221'/%3E%3Cpath d='M25.5196 35.57C24.7096 35.57 24.0596 34.92 24.0596 34.11V32.39C24.0596 31.58 24.7096 30.93 25.5196 30.93C26.3296 30.93 26.9796 31.58 26.9796 32.39V34.11C26.9796 34.92 26.3296 35.57 25.5196 35.57Z' fill='%23222221'/%3E%3Cpath d='M4.90043 33.86C4.09043 33.86 3.44043 33.21 3.44043 32.4C3.44043 30.8 4.02043 29.3 4.69043 27.58C5.67043 25.06 6.88043 21.93 6.88043 16.94C6.88043 16.13 7.53043 15.48 8.34043 15.48C9.15043 15.48 9.80043 16.13 9.80043 16.94C9.80043 22.48 8.42043 26.04 7.41043 28.64C6.82043 30.15 6.36043 31.35 6.36043 32.41C6.36043 33.22 5.71043 33.87 4.90043 33.87V33.86Z' fill='%23222221'/%3E%3Cpath d='M35.8297 33.86C35.0197 33.86 34.3697 33.21 34.3697 32.4C34.3697 31.34 33.9097 30.15 33.3197 28.63C32.3097 26.03 30.9297 22.47 30.9297 16.93C30.9297 16.12 31.5797 15.47 32.3897 15.47C33.1997 15.47 33.8497 16.12 33.8497 16.93C33.8497 21.92 35.0597 25.06 36.0397 27.57C36.7097 29.3 37.2897 30.79 37.2897 32.39C37.2897 33.2 36.6397 33.85 35.8297 33.85V33.86Z' fill='%23222221'/%3E%3Cpath d='M32.3999 18.39C31.5899 18.39 30.9399 17.74 30.9399 16.93C30.9399 11.1 26.1999 6.36 20.3699 6.36C14.5399 6.36 9.79988 11.1 9.79988 16.93C9.79988 17.74 9.14988 18.39 8.33988 18.39C7.52988 18.39 6.87988 17.74 6.87988 16.93C6.87988 9.49 12.9299 3.44 20.3699 3.44C27.8099 3.44 33.8599 9.49 33.8599 16.93C33.8599 17.74 33.2099 18.39 32.3999 18.39Z' fill='%23222221'/%3E%3Cpath d='M39.2704 18.39C38.4604 18.39 37.8104 17.74 37.8104 16.93C37.8104 11.26 35.0404 5.93002 30.4004 2.66002C29.7404 2.20002 29.5804 1.28002 30.0504 0.620024C30.5104 -0.0399762 31.4304 -0.199976 32.0904 0.270024C37.5104 4.09002 40.7404 10.31 40.7404 16.93C40.7404 17.74 40.0904 18.39 39.2804 18.39H39.2704Z' fill='%23222221'/%3E%3Cpath d='M1.46 18.39C0.65 18.39 0 17.74 0 16.93C0 10.31 3.23 4.08 8.65 0.270001C9.31 -0.189999 10.22 -0.0399992 10.69 0.620001C11.15 1.28 11 2.19 10.34 2.66C5.7 5.93 2.93 11.26 2.93 16.93C2.93 17.74 2.28 18.39 1.47 18.39H1.46Z' fill='%23222221'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_2014_45425'%3E%3Crect width='40.73' height='40.73' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            flex-shrink: 0;
        }

        .pata-banner-content-new {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000;
            line-height: 1.4;
        }

        .pata-approved-grid-main {
            display: flex;
            justify-content: space-between;
            gap: 40px;
            width: 100%;
            align-items: center;
        }

        @media (max-width: 1000px) {
            .pata-approved-grid-main {
                flex-direction: column;
                align-items: flex-start;
                gap: 40px;
            }
        }

        /* Lado Izquierdo: Progreso */
        .pata-approved-column-left {
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            flex: 1;
        }

        .pata-approved-status-badge {
            font-family: 'Fraiche', sans-serif;
            font-size: clamp(32px, 6vw, 50px);
            font-weight: 400;
            color: #15BEB2;
            text-transform: lowercase;
            letter-spacing: 0;
            display: inline-block;
            margin-bottom: 10px;
        }

        .pata-approved-progress-box {
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-width: 600px;
        }

        .pata-approved-progress-msg {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 400;
            color: #000;
            margin: 0;
            line-height: 1.4;
        }

        .pata-carencia-explanation {
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            font-weight: 700;
            line-height: 1.45;
            color: #000;
            background: #FFFFFF;
            border: 2px solid #000;
            border-radius: 22px;
            padding: 14px 16px;
            box-shadow: 5px 5px 0 rgba(0,0,0,0.08);
            margin: 0;
        }

        .pata-approved-progress-container {
            height: 20px;
            background: #F0F0F0;
            border: 3px solid #000;
            border-radius: 50px;
            overflow: hidden;
            position: relative;
        }

        .pata-approved-progress-labels-top {
            display: flex;
            justify-content: space-between;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000;
            margin-bottom: -12px;
        }

        .pata-approved-progress-bar {
            height: 100%;
            background: #15BEB2;
            border-right: 3px solid #000;
            transition: width 1s ease-in-out;
        }

        .pata-approved-progress-labels {
            display: flex;
            justify-content: space-between;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000;
            text-transform: none;
            margin-top: -12px; /* Pegado a la barra */
        }

        .pata-approved-days-left {
            font-family: 'Fraiche', sans-serif;
            font-size: 25px;
            color: #15BEB2;
            margin: -5px 0 0 0;
            line-height: 1.2;
        }

        .pata-approved-days-left strong {
            color: #000;
            font-weight: 400;
        }

        /* Lado Derecho: Resumen Mascota (Cards) */
        .pata-approved-column-right {
            display: flex;
            gap: 20px;
            align-items: stretch;
            flex-shrink: 0;
        }

        @media (max-width: 1000px) {
            .pata-approved-grid-main {
                display: flex !important;
                flex-direction: column !important;
                gap: 30px !important;
            }

            .pata-approved-column-left,
            .pata-approved-column-right {
                width: 100% !important;
                max-width: none !important;
            }

            .pata-approved-status-badge {
                line-height: 1.1em !important;
            }

            .pata-pet-info-card-teal {
                width: 100% !important;
            }

            .pata-approved-column-right {
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }

            .pata-pet-photo-card, .pata-pet-info-card-teal {
                width: 100% !important;
                max-width: none !important;
                flex: none !important;
            }

            .pata-pet-photo-card {
                height: 250px;
                width: 100% !important;
            }
        }

        .pata-pet-photo-card {
            flex: 0 0 180px;
            height: 180px;
            border-radius: 35px;
            overflow: hidden;
            border: 3px solid #000;
        }

        .pata-pet-photo-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* Rejected Pet View New */
        .pata-rejected-view-new {
            padding: 20px 0;
            text-align: left;
        }

        .pata-rejected-title-new {
            font-family: 'Fraiche', sans-serif;
            font-size: 50px;
            color: #000;
            line-height: 1.1;
            margin-bottom: 20px;
            text-transform: none;
        }

        .pata-rejected-subtitle-new {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000;
            margin-bottom: 40px;
            line-height: 1.4;
        }

        .pata-rejected-grid-new {
            display: flex;
            gap: 30px;
            align-items: center;
            margin-bottom: 50px;
        }

        .pata-rejected-photo-new {
            width: 200px;
            height: 200px;
            border-radius: 35px;
            overflow: hidden;
            border: 3px solid #000;
            flex-shrink: 0;
        }

        .pata-rejected-photo-new img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .pata-rejected-info-new {
            flex: 1;
        }

        .pata-rejected-reason-label-new {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 400;
            color: #000;
            margin-bottom: 15px;
        }

        .pata-rejected-reason-text-new {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #000;
            line-height: 1.3;
        }

        .pata-rejected-actions-new {
            display: flex;
            gap: 20px;
            justify-content: flex-start;
        }

        .pata-btn-appeal-new, .pata-btn-accept-new {
            background: #15BEB2;
            color: #000;
            border: 3px solid #000;
            border-radius: 50px;
            padding: 15px 40px;
            font-family: 'Fraiche', sans-serif;
            font-size: 20px;
            cursor: pointer;
            min-width: 200px;
            transition: transform 0.2s;
            text-align: center;
        }

        .pata-btn-appeal-new:hover, .pata-btn-accept-new:hover {
            transform: translateY(-2px);
        }

        /* Action Required View New */
        .pata-action-required-view-new {
            padding: 20px 0;
            text-align: left;
        }

        .pata-action-required-title-new {
            font-family: 'Fraiche', sans-serif;
            font-size: 50px;
            color: #000;
            line-height: 1.1;
            margin-bottom: 20px;
            text-transform: none;
        }

        .pata-action-required-subtitle-new {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000;
            margin-bottom: 30px;
            line-height: 1.4;
        }

        .pata-action-required-progress-container {
            margin-bottom: 40px;
        }

        .pata-action-required-progress-labels {
            display: flex;
            justify-content: space-between;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #666;
            margin-bottom: 10px;
        }

        .pata-action-required-progress-track {
            height: 12px;
            background: #eee;
            border: 2px solid #000;
            border-radius: 50px;
            overflow: hidden;
        }

        .pata-action-required-progress-fill {
            width: 70%;
            height: 100%;
            background: #15BEB2;
            border-right: 2px solid #000;
        }

        .pata-action-required-grid-new {
            display: flex;
            gap: 30px;
            align-items: center;
            margin-bottom: 50px;
        }

        .pata-action-required-photo-new {
            width: 200px;
            height: 200px;
            border-radius: 35px;
            overflow: hidden;
            border: 3px solid #000;
            flex-shrink: 0;
        }

        .pata-action-required-photo-new img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .pata-action-required-info-new {
            flex: 1;
        }

        .pata-action-required-message-label-new {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 400;
            color: #000;
            margin-bottom: 10px;
        }

        .pata-action-required-message-text-new {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #000;
            line-height: 1.3;
        }

        .pata-btn-open-chat-new {
            background: #15BEB2;
            color: #000;
            border: 3px solid #000;
            border-radius: 50px;
            padding: 15px 40px;
            font-family: 'Fraiche', sans-serif;
            font-size: 20px;
            cursor: pointer;
            min-width: 250px;
            transition: transform 0.2s;
            text-align: center;
            display: inline-block;
        }

        .pata-btn-open-chat-new:hover {
            transform: translateY(-2px);
        }

        @media (max-width: 768px) {
            .pata-action-required-grid-new {
                flex-direction: column;
                align-items: flex-start;
            }
            .pata-action-required-title-new {
                font-size: 35px;
            }
        }

        /* Member Pending View New */
        .pata-member-pending-view-new {
            padding: 20px 0;
            text-align: left;
        }

        .pata-member-pending-title-new {
            font-family: 'Fraiche', sans-serif;
            font-size: 50px;
            color: #000;
            line-height: 1.1;
            margin-bottom: 20px;
            text-transform: none;
        }

        .pata-member-pending-subtitle-new {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000;
            margin-bottom: 30px;
            line-height: 1.4;
        }

        .pata-badge-brutalist {
            margin-top: 50px;
            background: #CAF5F2;
            border: 3px solid #000;
            border-radius: 30px;
            padding: 25px;
            display: flex;
            gap: 20px;
            align-items: center;
            box-shadow: 8px 8px 0 #000;
        }

        .pata-badge-title-brutalist {
            display: block;
            font-family: 'Fraiche', sans-serif;
            font-size: 22px;
            text-transform: lowercase;
            margin-bottom: 4px;
            color: #000;
        }

        .pata-badge-text-brutalist {
            margin: 0;
            font-size: 15px;
            font-family: 'Outfit', sans-serif;
            color: #000;
            line-height: 1.4;
        }

        @media (max-width: 768px) {
            .pata-member-pending-title-new {
                font-size: 35px;
            }
            .pata-badge-brutalist {
                flex-direction: column;
                text-align: center;
                gap: 10px;
            }
        }

        @media (max-width: 768px) {
            .pata-rejected-grid-new {
                flex-direction: column;
                align-items: flex-start;
            }
            .pata-rejected-actions-new {
                flex-direction: column;
            }
            .pata-rejected-title-new {
                font-size: 35px;
            }
        }
        .pata-pet-photo-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .pata-pet-info-card-teal {
            flex: 0 0 180px;
            max-width: 180px;
            background: #15BEB2;
            border: 3px solid #000;
            border-radius: 30px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 15px;
            color: #FFF;
            box-shadow: 10px 10px 0 rgba(0,0,0,0.05);
            text-align: left;
        }

        .pata-pet-info-card-teal h3 {
            font-family: 'Fraiche', sans-serif;
            font-size: 32px;
            margin: 0 0 10px 0;
            color: #FFF !important;
            text-transform: lowercase;
            line-height: 1;
        }

        .pata-pet-info-list {
            list-style: none;
            padding: 0;
            margin: 0 0 15px 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-pet-info-list li {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 800;
            color: #000;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .pata-pet-info-list li::before {
            content: "•";
            font-size: 24px;
        }

        .pata-btn-details-teal {
            background: #FE8F15;
            border: 3px solid #000;
            border-radius: 50px;
            padding: 10px 15px;
            font-family: 'Fraiche', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000;
            cursor: pointer;
            width: 100%;
            text-align: center;
            transition: all 0.2s ease;
            box-shadow: 4px 4px 0 #000;
            text-transform: lowercase;
        }

        .pata-btn-details-teal:hover {
            transform: translateY(-2px);
            box-shadow: 6px 6px 0 #000;
        }

        /* Tabs SVGs fix */
        .pata-tabs-new {
            display: flex;
            gap: 16px;
            margin-bottom: 40px;
            overflow-x: auto;
            padding: 10px 5px;
            scrollbar-width: none;
            justify-content: flex-start;
        }

        .pata-tab-new {
            background: #fff;
            border: 3px solid #E2E8F0;
            border-radius: 50px;
            padding: 10px 24px 10px 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 4px 4px 0 rgba(0,0,0,0.05);
            min-width: 160px;
        }

        .pata-tab-new.tab-active {
            border-color: #15BEB2;
            background: #fff;
            box-shadow: 6px 6px 0 rgba(21, 190, 178, 0.2);
            transform: translateY(-2px);
        }

        .pata-tab-icon-new {
            width: 44px;
            height: 44px;
            background: #F1F5F9;
            border: 2px solid #E2E8F0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            overflow: hidden;
        }

        .pata-tab-new.tab-active .pata-tab-icon-new {
            background: #15BEB2;
            border-color: #000;
        }

        .pata-tab-icon-new img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .pata-tab-icon-new svg {
            width: 22px;
            height: 22px;
        }

        .pata-tab-name-new {
            font-family: 'Fraiche', sans-serif;
            font-weight: 400;
            font-size: 20px;
            color: #94A3B8;
            text-transform: lowercase;
        }

        .pata-tab-new.tab-active .pata-tab-name-new {
            color: #15BEB2;
        }

        /* Footer Banner in Shell */
        .pata-footer-banner-new {
            margin-top: 40px;
            background: #FFBD12;
            border: 3px solid #000;
            border-radius: 25px;
            padding: 25px 30px;
            display: flex;
            align-items: center;
            gap: 20px;
            text-align: left;
        }

        .pata-footer-banner-new svg {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
        }

        .pata-footer-text-new h4 {
            font-family: 'Fraiche', sans-serif;
            font-size: 20px;
            margin: 0 0 5px 0;
            text-transform: lowercase;
        }

        .pata-footer-text-new p {
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            margin: 0;
            font-weight: 600;
        }

        .pata-senior-badge {
            background: #7B1FA2;
            color: #fff;
            font-size: 12px;
            padding: 4px 12px;
            border-radius: 20px;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            text-transform: uppercase;
        }

        .pata-pet-info-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .pata-pet-info-list li {
            font-weight: 600;
            color: #444;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
        }

        .pata-pet-info-list li::before {
            content: '•';
            color: #15BEB2;
            font-size: 24px;
            line-height: 1;
        }

        @media (max-width: 900px) {
            .pata-approved-grid {
                grid-template-columns: 1fr;
            }
            .pata-approved-card {
                padding: 30px 20px;
                border-radius: 40px;
            }
            .pata-carencia-title {
                font-size: 36px;
            }
        }


        .pata-benefit-info p {
            font-size: 14px;
            color: rgba(0, 0, 0, 0.6);
            margin: 0;
            line-height: 1.4;
            font-weight: 500;
        }

        .pata-pati-message {
            margin-top: 12px;
            background: #FFFFFF;
            border: 2px solid #000;
            padding: 16px;
            border-radius: 20px;
            font-size: 13px;
            color: #000;
            line-height: 1.4;
            font-style: italic;
            position: relative;
            font-weight: 500;
        }

        .pata-pati-message::before {
            content: "";
            position: absolute;
            top: -10px;
            left: 20px;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 10px solid #000;
        }

        /* ✅ Approved View Neo-Brutalist */
        .pata-approved-card {
            background: #FFFFFF;
            border-radius: 66px;
            padding: 48px;
            display: flex;
            flex-direction: column;
            gap: 32px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
            border: 2px solid rgba(0, 0, 0, 0.15);
        }

        .pata-pet-selector {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-pet-selector-title {
            font-size: 18px;
            font-weight: 400;
            color: #000;
        }

        .pata-tabs {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .pata-tab {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            border-radius: 50px;
            background: white;
            min-width: 160px;
            height: 42px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid rgba(0, 0, 0, 0.3);
            opacity: 0.6;
        }

        .pata-tab.active {
            border: 2px solid #15BEB2;
            opacity: 1;
        }

        .pata-tab-name {
            font-weight: 800;
            font-size: 18px;
            color: rgba(0, 0, 0, 0.5);
            text-transform: lowercase;
            margin-left: 8px;
            font-family: 'Outfit', sans-serif;
        }

        .pata-tab.active .pata-tab-name {
            color: #15BEB2;
        }

        .pata-tab-icon {
            width: 32px;
            height: 32px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .pata-tab.active .pata-tab-icon {
            background: #15BEB2;
        }

        .pata-dashboard-content {
            display: grid;
            grid-template-columns: 1fr 200px;
            gap: clamp(20px, 4vw, 40px);
            align-items: center;
        }

        .pata-progress-container-brutalist {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .pata-progress-header-brutalist {
            text-align: center;
        }

        .pata-progress-title-brutalist {
            font-size: clamp(24px, 4vw, 50px);
            color: #15BEB2;
            font-weight: 800;
            text-transform: lowercase;
            font-family: 'Fraiche', sans-serif;
            margin: 0;
        }

        .pata-progress-subtitle-brutalist {
            font-size: 18px;
            margin: 8px 0;
            color: #000;
        }

        .pata-progress-counter-brutalist {
            font-size: 25px;
            font-weight: 800;
            color: #000;
        }

        .pata-progress-counter-brutalist span {
            color: #15BEB2;
        }

        .pata-bar-wrapper-brutalist {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-bar-labels-brutalist {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            color: #000;
            font-weight: 600;
        }

        .pata-bar-track-brutalist {
            height: 24px;
            background: #f0f0f0;
            border: 2px solid black;
            border-radius: 50px;
            overflow: hidden;
        }

        .pata-bar-fill-brutalist {
            height: 100%;
            background: #15BEB2;
            border-radius: 50px;
            transition: width 1s ease-out;
        }

        .pata-pet-profile-card-brutalist {
            width: 100%;
            aspect-ratio: 1/1;
            background: #15BEB2;
            border-radius: 30px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: white;
            border: 2px solid #000;
            box-shadow: 6px 6px 0 #000;
        }

        .pata-pet-info-brutalist {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-pet-info-name-brutalist {
            font-size: 25px;
            font-weight: 800;
            text-transform: lowercase;
            margin: 0;
        }

        .pata-pet-info-tag-brutalist {
            display: flex;
            align-items: center;
            gap: 8px;
            color: black;
            font-size: 18px;
            font-weight: 700;
        }

        .pata-dot-brutalist {
            width: 8px;
            height: 8px;
            background: black;
            border-radius: 50%;
        }

        .pata-btn-details-brutalist {
            background: #FFBD00;
            color: black;
            padding: 8px 16px;
            border-radius: 50px;
            text-align: center;
            font-weight: 700;
            text-decoration: none;
            font-size: 16px;
            transition: transform 0.2s;
            border: 2px solid #000;
        }

        .pata-btn-details-brutalist:hover {
            transform: scale(1.05);
        }

        .pata-footer-banner-brutalist {
            background: #FFBD00;
            padding: 24px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 20px;
            border: 2px solid #000;
            margin-top: 10px;
        }

        .pata-footer-banner-brutalist svg {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
        }

        .pata-footer-text-brutalist h4 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            color: #000;
        }

        .pata-footer-text-brutalist p {
            font-size: 16px;
            font-weight: 500;
            margin: 4px 0 0 0;
            color: #000;
        }

        @media (max-width: 768px) {
            .pata-missing-card {
                padding: 32px 24px;
                border-radius: 40px;
                background-size: 200px auto;
            }
            .pata-info-missing-box {
                flex-direction: column;
                align-items: flex-start;
                padding: 24px;
            }
            .pata-upload-icon {
                width: 64px;
                height: 64px;
            }
            .pata-btn-group {
                flex-direction: column;
            }
            .pata-btn-primary, .pata-btn-outline {
                width: 100%;
            }
            .pata-benefits-review {
                padding: 24px;
            }
        }

        /* ----------------------------------------------------------------- */
        /* 🆕 NEW APPROVED DESIGN STYLES (Phase 4)                        */
        /* ----------------------------------------------------------------- */
        .pata-approved-bg-letter-new {
            display: none !important;
        }

        .pata-approved-wrapper-new {
            min-height: auto !important;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: visible !important;
            position: relative;
            border-radius: 35px;
            padding: 40px 0;
            background: transparent !important;
        }

        .pata-container-new {
            width: 100%;
            max-width: 1200px;
            padding: 20px 24px;
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .pata-header-new {
            max-width: 1000px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            text-align: center;
            align-self: center;
        }

        .pata-header-new h1 {
            color: white !important;
            font-size: clamp(40px, 7vw, 100px);
            font-weight: 800;
            line-height: 0.9;
            letter-spacing: -0.02em;
            text-transform: lowercase;
            margin: 0;
        }

        .pata-header-sub-new {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: clamp(14px, 1.8vw, 18px);
            line-height: 1.4;
            max-width: 850px;
            margin: 0 auto;
            color: #000;
        }

        .pata-card-new {
            background: #FFFFFF;
            border-radius: 66px;
            padding: clamp(24px, 5vw, 48px);
            display: flex;
            flex-direction: column;
            gap: 32px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
            border: 2px solid #000;
        }

        .pata-pet-selector-new {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .pata-pet-selector-title-new {
            font-size: 18px;
            font-weight: 400;
            color: #000;
            margin-bottom: 8px;
        }

        .pata-tabs-new {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .pata-tab-new {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            border-radius: 50px;
            background: white;
            min-width: 160px;
            height: 48px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid rgba(0, 0, 0, 0.3);
            box-sizing: border-box;
        }

        .pata-tab-new.tab-active {
            border: 2px solid #15BEB2;
            opacity: 1;
        }

        .pata-tab-new.tab-inactive {
            opacity: 0.6;
        }

        .pata-tab-name-new {
            font-weight: 800;
            font-size: 18px;
            color: #15BEB2;
            text-transform: lowercase;
            margin-left: 8px;
        }

        .pata-tab-new.tab-inactive .pata-tab-name-new {
            color: rgba(0, 0, 0, 0.5);
        }

        .pata-tab-icon-new {
            width: 32px;
            height: 32px;
            background: #15BEB2;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
        }

        .pata-tab-new.tab-inactive .pata-tab-icon-new {
            background: rgba(0, 0, 0, 0.3);
        }

        .pata-dashboard-content-new {
            display: block;
            width: 100%;
        }

        .pata-progress-container-new {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .pata-progress-header-new {
            text-align: center;
        }

        .pata-progress-title-new {
            font-size: clamp(24px, 4vw, 50px);
            color: #15BEB2;
            font-weight: 800;
            text-transform: lowercase;
            margin: 0;
        }

        .pata-progress-subtitle-new {
            font-size: 18px;
            margin: 8px 0;
            color: #000;
        }

        .pata-progress-counter-new {
            font-size: 25px;
            font-weight: 800;
            color: #000;
        }

        .pata-progress-counter-new span {
            color: #15BEB2;
        }

        .pata-bar-wrapper-new {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-bar-labels-new {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            color: #666;
            font-weight: 600;
        }

        .pata-bar-track-new {
            height: 24px;
            background: #f0f0f0;
            border: 2px solid black;
            border-radius: 50px;
            overflow: hidden;
        }

        .pata-bar-fill-new {
            height: 100%;
            background: #15BEB2;
            border-radius: 50px;
            transition: width 1s ease-in-out;
        }

        .pata-pet-profile-card-new {
            width: 100%;
            aspect-ratio: 1/1;
            background: #15BEB2;
            border-radius: 30px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: white;
            border: 2px solid #000;
        }

        .pata-pet-info-new {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .pata-pet-info-name-new {
            font-size: 25px;
            font-weight: 800;
            text-transform: lowercase;
            margin: 0;
            color: white;
        }

        .pata-pet-info-tag-new {
            display: flex;
            align-items: center;
            gap: 8px;
            color: black;
            font-size: 18px;
            font-weight: 700;
        }

        .pata-dot-new {
            width: 8px;
            height: 8px;
            background: black;
            border-radius: 50%;
        }

        .pata-btn-details-new {
            background: #FFBD00;
            color: black;
            padding: 12px 16px;
            border-radius: 50px;
            text-align: center;
            font-weight: 700;
            text-decoration: none;
            font-size: 16px;
            transition: transform 0.2s;
            border: 2px solid #000;
            cursor: pointer;
        }

        .pata-btn-details-new:hover {
            transform: scale(1.05);
        }

        .pata-footer-banner-new {
            background: #FFBD00;
            padding: 20px 26px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            gap: 20px;
            border: 2px solid #000;
        }

        .pata-footer-banner-new svg {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
        }

        .pata-footer-text-new h4 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            color: #000;
        }

        .pata-footer-text-new p {
            font-size: 16px;
            font-weight: 500;
            margin: 4px 0 0 0;
            color: #000;
        }

        @media (max-width: 900px) {
            .pata-dashboard-content-new {
                width: 100%;
            }
            .pata-pet-profile-card-new {
                max-width: 280px;
                margin: 0 auto;
            }
            .pata-footer-banner-new {
                flex-direction: column;
                text-align: center;
            }
            }

            /* ----------------------------------------------------------------- */
            /* 🆕 NEW REJECTED DESIGN STYLES (Phase 4)                        */
            /* ----------------------------------------------------------------- */
            .pata-rejected-wrapper-new {
                position: relative;
                z-index: 1;
                width: 100%;
                margin: 0 auto;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                overflow: visible !important;
                background: transparent !important;
                min-height: auto !important;
            }

            .pata-missing-wrapper {
                position: relative;
                z-index: 1;
                width: 100%;
                margin: 0 auto;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                overflow: visible !important;
                background: transparent !important;
                min-height: auto !important;
            }

            .pata-rejected-container-new {
            width: 100%;
            max-width: 1200px;
            padding: 20px 24px;
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 40px;
            animation: pataSlideUpNew 0.8s ease-out forwards;
            }

            .pata-rejected-header-new {
            max-width: 900px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            text-align: left;
            }

            .pata-rejected-header-new h1 {
            color: white !important;
            font-size: clamp(48px, 8vw, 100px);
            font-weight: 800;
            line-height: 1;
            letter-spacing: -0.02em;
            margin: 0;
            text-transform: lowercase;
            }

            .pata-rejected-header-sub-new {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: clamp(16px, 2vw, 20px);
            line-height: 1.4;
            color: #000;
            }

            .pata-rejected-card-wrapper-new {
            position: relative;
            align-self: flex-start;
            width: 100%;
            max-width: 1048px;
            margin-top: 20px;
            }

            .pata-rejected-card-new {
            background: #FFFFFF;
            border-radius: 66px;
            padding: clamp(24px, 5vw, 48px);
            display: flex;
            flex-direction: column;
            gap: clamp(20px, 4vw, 32px);
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 2;
            border: 2px solid #000;
            }

            .pata-rejected-card-title-new {
            font-size: clamp(32px, 5vw, 50px);
            font-weight: 800;
            line-height: 1.1;
            max-width: 700px;
            margin: 0;
            color: #000;
            text-align: left;
            }

            .pata-rejected-card-intro-new {
            font-size: clamp(16px, 1.5vw, 20px);
            color: rgba(0, 0, 0, 0.7);
            max-width: 600px;
            margin: 0;
            text-align: left;
            }

            .pata-rejected-card-details-new {
            border-top: 1px solid rgba(0, 0, 0, 0.15);
            padding-top: clamp(20px, 4vw, 32px);
            display: flex;
            flex-direction: column;
            gap: 16px;
            text-align: left;
            }

            .pata-rejected-detail-label-new {
            font-size: 18px;
            font-weight: 500;
            color: #000;
            }

            .pata-rejected-detail-text-new {
            font-size: 16px;
            color: rgba(0, 0, 0, 0.6);
            line-height: 1.5;
            max-width: 540px;
            margin: 0;
            }

            .pata-rejected-mascot-new {
            position: absolute;
            right: -100px;
            top: 50%;
            transform: translateY(-40%);
            width: 480px;
            height: auto;
            z-index: 3;
            pointer-events: none;
            animation: pataMascotPopNew 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
            }

            .pata-rejected-footer-new {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            margin-top: 20px;
            }

            .pata-rejected-btn-appeal-new {
            background: #15BEB2;
            color: #000;
            padding: 12px 48px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid #000;
            cursor: pointer;
            box-shadow: 0 8px 16px rgba(21, 190, 178, 0.3);
            text-align: center;
            }

            .pata-rejected-btn-appeal-new:hover {
            transform: translateY(-4px) scale(1.05);
            box-shadow: 0 12px 24px rgba(21, 190, 178, 0.4);
            background-color: #18d8ca;
            }

            .pata-rejected-footer-note-new {
            font-size: 14px;
            color: #000;
            opacity: 0.6;
            }

            @keyframes pataMascotPopNew {
            from { opacity: 0; transform: translateY(-40%) scale(0.5) rotate(10deg); }
            to { opacity: 1; transform: translateY(-40%) scale(1) rotate(0deg); }
            }

            @media (max-width: 1150px) {
            .pata-rejected-mascot-new {
                position: relative;
                right: 0;
                top: 0;
                transform: none;
                width: 320px;
                margin: 0 auto -60px;
                display: block;
                animation: pataSlideUpNew 1s ease-out 0.5s both;
            }
            .pata-rejected-card-wrapper-new {
                display: flex;
                flex-direction: column-reverse;
                align-items: center;
            }
            .pata-rejected-card-new {
                border-radius: 40px;
                text-align: center;
            }
            .pata-rejected-card-intro-new, .pata-rejected-detail-text-new {
                margin: 0 auto;
                text-align: center;
            }
            .pata-rejected-card-details-new {
                text-align: center;
            }
            .pata-rejected-header-new h1, .pata-rejected-header-sub-new {
                text-align: center;
            }
            .pata-rejected-container-new {
                align-items: center;
            }
            .pata-upload-preview {
                width: 100%;
                height: 100%;
                object-fit: cover;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                border-radius: 13px;
            }

            .pata-upload-filename {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.7);
                color: white;
                font-size: 10px;
                padding: 4px;
                text-align: center;
                z-index: 2;
                font-weight: 600;
                backdrop-filter: blur(2px);
            }

            .pata-alert-banner.pata-premium-info {
                background: #E0F7F6 !important;
                border: 3px solid #000 !important;
                box-shadow: 8px 8px 0 rgba(0, 187, 180, 0.2);
                border-radius: 30px;
                padding: 25px !important;
                transition: transform 0.3s ease;
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .pata-alert-banner.pata-premium-info:hover {
                transform: translateY(-2px);
            }

            .pata-btn-premium-banner {
                margin-top: 15px;
                background: #FE8F15 !important;
                color: #000 !important;
                border: 2px solid #000 !important;
                padding: 10px 24px !important;
                border-radius: 50px !important;
                font-family: 'Fraiche', sans-serif !important;
                font-size: 15px !important;
                cursor: pointer;
                text-transform: lowercase;
                box-shadow: 4px 4px 0 #000;
                transition: all 0.2s;
                display: inline-block;
                text-decoration: none;
            }

            .pata-btn-premium-banner:hover {
                transform: translate(-2px, -2px);
                box-shadow: 6px 6px 0 #000;
                background: #ff9f35 !important;
            }

            @media (max-width: 600px) {
                .pata-tabs-new {
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 8px !important;
                    margin-bottom: 20px !important;
                }
                .pata-tab-new {
                    min-width: 0 !important;
                    width: 100% !important;
                    padding: 4px 8px !important;
                    gap: 6px !important;
                    height: 44px !important;
                    justify-content: flex-start !important;
                }
                .pata-tab-name-new {
                    font-size: 14px !important;
                    margin-left: 4px !important;
                }
                .pata-tab-icon-new {
                    width: 28px !important;
                    height: 28px !important;
                }
                .pata-pet-info-list {
                    flex-direction: row !important;
                    flex-wrap: wrap !important;
                    gap: 8px !important;
                    margin-bottom: 15px !important;
                    justify-content: flex-start !important;
                }
                .pata-pet-info-list li {
                    font-size: 14px !important;
                    gap: 4px !important;
                }
                .pata-pet-info-list li::before {
                    display: none !important;
                }
                .pata-pet-info-list li:not(:first-child)::before {
                    content: "|" !important;
                    display: inline-block !important;
                    margin-right: 4px !important;
                    color: rgba(0, 0, 0, 0.3) !important;
                    font-size: 14px !important;
                }
            }
            `;

    const V2_STYLES = `
        .pata-unified-panel.show { animation: none; }
        .pata-v2-shell, .pata-v2-shell * { box-sizing: border-box; }
        .pata-v2-shell {
            --v2-cream: #F8F5EE;
            --v2-white: #FFFFFF;
            --v2-teal: #21BCAF;
            --v2-teal-deep: #1E5D57;
            --v2-teal-soft: #E5F5F2;
            --v2-orange: #FE8F15;
            --v2-ink: #153F3B;
            --v2-body: #4E6865;
            --v2-muted: #8A9692;
            --v2-line: #ECE7DD;
            --v2-shadow: 0 5px 18px rgba(38, 62, 58, .055);
            min-height: 100dvh;
            display: grid;
            grid-template-columns: 232px minmax(0, 1fr);
            background: var(--v2-cream);
            color: var(--v2-body);
            font-family: 'Outfit', sans-serif;
        }
        .pata-v2-sidebar {
            position: sticky; top: 0; height: 100dvh;
            display: flex; flex-direction: column; gap: 18px;
            padding: 22px 12px 20px;
            background: var(--v2-white); border-right: 1px solid var(--v2-line);
        }
        .pata-v2-logo { display: flex; align-items: center; min-height: 54px; padding: 0 7px 8px; }
        .pata-v2-logo img { width: 92px; height: auto; display: block; }
        .pata-v2-nav { display: grid; gap: 5px; }
        .pata-v2-nav-bottom { margin-top: auto; }
        .pata-v2-nav-link {
            width: 100%; min-height: 43px; display: flex; align-items: center; gap: 12px;
            padding: 10px 15px; border: 0; border-radius: 13px; background: transparent;
            color: #405854; font: 700 13.5px/1 'Outfit', sans-serif; text-decoration: none;
            text-align: left; cursor: pointer; transition: background .2s ease, color .2s ease, transform .2s ease;
        }
        .pata-v2-nav-link:hover { background: #F2F8F6; color: var(--v2-teal-deep); transform: translateX(2px); }
        .pata-v2-nav-link:focus-visible { outline: 3px solid rgba(33,188,175,.28); outline-offset: 2px; }
        .pata-v2-nav-link.is-active { background: var(--v2-teal-soft); color: #087B72; }
        .pata-v2-nav-icon { width: 18px; text-align: center; font-size: 15px; }
        .pata-v2-account {
            display: flex; align-items: center; gap: 10px; margin-top: 3px; padding: 11px 12px;
            border-radius: 14px; background: var(--v2-cream);
        }
        .pata-v2-avatar { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: var(--v2-teal); color: white; font-weight: 900; }
        .pata-v2-account strong, .pata-v2-account span { display: block; }
        .pata-v2-account strong { color: var(--v2-ink); font-size: 13px; }
        .pata-v2-account span { margin-top: 2px; color: var(--v2-muted); font-size: 10.5px; }
        .pata-v2-main { min-width: 0; padding: 30px 34px 34px; }
        .pata-v2-content { width: 100%; max-width: 1640px; margin: 0 auto; display: grid; gap: 22px; }
        .pata-v2-mobile-top { display: none; }
        .pata-v2-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .pata-v2-title { margin: 0; color: var(--v2-ink); font-family: 'Fraiche', 'Outfit', sans-serif; font-size: clamp(28px, 2.2vw, 34px); line-height: 1; }
        .pata-v2-subtitle { margin: 8px 0 0; color: var(--v2-body); font-size: 14px; }
        .pata-v2-header-actions { display: flex; align-items: center; gap: 10px; }
        .pata-v2-icon-button { width: 45px; height: 45px; display: grid; place-items: center; border: 0; border-radius: 50%; background: white; box-shadow: var(--v2-shadow); }
        .pata-v2-vet-button { min-height: 45px; display: inline-flex; align-items: center; padding: 0 20px; border-radius: 999px; background: var(--v2-teal); color: white; font-weight: 800; font-size: 13px; text-decoration: none; }
        .pata-v2-kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .pata-v2-kpi {
            position: relative; min-height: 126px; overflow: hidden; display: flex; flex-direction: column; justify-content: center;
            padding: 19px 21px; border-radius: 18px; background: white; box-shadow: var(--v2-shadow);
        }
        .pata-v2-kpi.is-primary { background: var(--v2-teal); color: white; }
        .pata-v2-kpi.is-primary::after { content: ''; position: absolute; width: 150px; height: 150px; right: -50px; bottom: -76px; border-radius: 48%; background: rgba(255,255,255,.14); }
        .pata-v2-kpi-label { position: relative; z-index: 1; margin-bottom: 9px; color: var(--v2-muted); font-size: 11px; font-weight: 900; letter-spacing: .065em; }
        .pata-v2-kpi.is-primary .pata-v2-kpi-label, .pata-v2-kpi.is-primary .pata-v2-kpi-meta { color: rgba(255,255,255,.85); }
        .pata-v2-kpi-value { position: relative; z-index: 1; color: var(--v2-ink); font: 400 25px/1 'Fraiche', 'Outfit', sans-serif; }
        .pata-v2-kpi.is-primary .pata-v2-kpi-value { color: white; }
        .pata-v2-kpi-meta, .pata-v2-kpi-link { position: relative; z-index: 1; margin-top: 10px; font-size: 12px; }
        .pata-v2-kpi-link { color: #007E75; font-weight: 800; text-decoration: none; }
        .pata-v2-section { display: grid; gap: 12px; }
        .pata-v2-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
        .pata-v2-section-title { margin: 0; color: var(--v2-ink); font: 400 21px/1 'Fraiche', 'Outfit', sans-serif; }
        .pata-v2-section-link { border: 0; background: transparent; padding: 0; color: #007E75; font-weight: 800; font-size: 12px; text-decoration: none; cursor: pointer; }
        .pata-v2-pets-page-head { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .pata-v2-pets-page-head p { margin: 8px 0 0; color: var(--v2-body); font-size: 13px; }
        .pata-v2-add-button { min-height: 44px; display: inline-flex; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--v2-teal); color: white; font-size: 13px; font-weight: 900; text-decoration: none; }
        .pata-v2-pet-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
        .pata-v2-pet-card {
            min-width: 0; display: grid; grid-template-columns: 86px minmax(0, 1fr); gap: 16px;
            padding: 20px; border-radius: 20px; background: white; box-shadow: var(--v2-shadow);
        }
        .pata-v2-pet-photo { width: 86px; height: 86px; overflow: hidden; display: grid; place-items: center; border: 1px dashed #9CDCD6; border-radius: 17px; background: #EAF8F6; color: #159A8F; font-size: 11px; font-weight: 800; text-align: center; }
        .pata-v2-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .pata-v2-pet-content { min-width: 0; display: flex; flex-direction: column; }
        .pata-v2-pet-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .pata-v2-pet-name { margin: 1px 0 5px; color: var(--v2-ink); font-size: 18px; font-weight: 800; }
        .pata-v2-pet-meta { overflow: hidden; margin: 0; color: var(--v2-body); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
        .pata-v2-status { flex: none; padding: 5px 11px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: .03em; }
        .pata-v2-status.approved { color: #557C12; background: #EFF8DA; }
        .pata-v2-status.pending, .pata-v2-status.appealed { color: #B76600; background: #FFF3DE; }
        .pata-v2-status.rejected { color: #B83535; background: #FCEAEA; }
        .pata-v2-status.action_required { color: #087C73; background: #DFF4F1; }
        .pata-v2-status.inactive { color: #66706D; background: #EEF0EF; }
        .pata-v2-wait { margin-top: 13px; }
        .pata-v2-wait-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; color: var(--v2-muted); font-size: 10.5px; }
        .pata-v2-wait-row strong { color: #007E75; }
        .pata-v2-track { height: 7px; overflow: hidden; border-radius: 999px; background: #ECEAE4; }
        .pata-v2-track span { display: block; height: 100%; border-radius: inherit; background: var(--v2-teal); }
        .pata-v2-pet-action { align-self: flex-start; margin-top: 8px; border: 0; background: transparent; padding: 0; color: #007E75; font: 800 11px/1.2 'Outfit', sans-serif; cursor: pointer; }
        .pata-v2-pet-action:focus-visible { outline: 3px solid rgba(33,188,175,.25); outline-offset: 3px; }
        .pata-v2-lower-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 15px; }
        .pata-v2-activity, .pata-v2-centers { min-height: 215px; padding: 22px; border-radius: 20px; }
        .pata-v2-activity { background: white; box-shadow: var(--v2-shadow); }
        .pata-v2-activity-list { display: grid; margin-top: 14px; }
        .pata-v2-activity-item { display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 12px; min-height: 50px; border-bottom: 1px solid var(--v2-line); font-size: 12.5px; }
        .pata-v2-activity-item:last-child { border-bottom: 0; }
        .pata-v2-activity-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: var(--v2-teal-soft); }
        .pata-v2-activity-date { color: #A39A90; font-size: 11px; }
        .pata-v2-centers { position: relative; overflow: hidden; display: flex; flex-direction: column; background: var(--v2-teal-deep); color: white; }
        .pata-v2-centers::after { content: ''; position: absolute; width: 170px; height: 170px; right: -55px; top: -60px; border-radius: 48%; background: rgba(255,255,255,.08); }
        .pata-v2-centers .pata-v2-section-title { position: relative; z-index: 1; color: white; }
        .pata-v2-centers p { position: relative; z-index: 1; max-width: 520px; font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,.84); }
        .pata-v2-centers-link { position: relative; z-index: 1; margin-top: auto; min-height: 44px; display: grid; place-items: center; border-radius: 999px; background: white; color: var(--v2-teal-deep); font-size: 12px; font-weight: 900; text-decoration: none; }
        .pata-v2-empty { grid-column: 1 / -1; padding: 30px; border-radius: 20px; background: white; box-shadow: var(--v2-shadow); text-align: center; }
        .pata-v2-reimbursements { display: grid; gap: 18px; }
        .pata-v2-page-head { display:flex; justify-content:space-between; align-items:center; gap:18px; }
        .pata-v2-back { border:0; background:transparent; color:#087E75; font-weight:800; cursor:pointer; padding:0; }
        .pata-v2-balance-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .pata-v2-balance-card, .pata-v2-request-row, .pata-v2-form-card, .pata-v2-detail-card, .pata-v2-chat-card { background:white; border-radius:18px; box-shadow:var(--v2-shadow); }
        .pata-v2-balance-card { padding:16px 18px 15px; display:grid; gap:8px; }
        .pata-v2-balance-head { display:flex; align-items:center; justify-content:space-between; gap:12px; color:#A0968A; font-size:10px; }
        .pata-v2-balance-label { display:flex; align-items:center; gap:5px; color:#7D837F; font-size:11px; font-weight:900; letter-spacing:.02em; }
        .pata-v2-balance-label i { width:13px; height:13px; display:grid; place-items:center; color:var(--v2-teal); font-style:normal; }
        .pata-v2-balance-label svg { width:13px; height:13px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .pata-v2-balance-amount { display:flex; align-items:baseline; gap:5px; }
        .pata-v2-balance-amount strong { color:var(--v2-ink); font:400 24px/1 'Fraiche','Outfit',sans-serif; }
        .pata-v2-balance-amount span { color:#89908B; font:400 12px/1 'Fraiche','Outfit',sans-serif; }
        .pata-v2-balance-track { height:8px; overflow:hidden; border-radius:999px; background:#ECE9E1; }
        .pata-v2-balance-track > span { display:block; height:100%; min-width:0; border-radius:inherit; background:var(--v2-orange); }
        .pata-v2-balance-card p { margin:1px 0 0; color:#7B8581; font-size:10.5px; line-height:1.35; }
        .pata-v2-request-list { display:grid; gap:9px; }
        .pata-v2-request-row { width:100%; border:0; padding:15px 18px; display:grid; grid-template-columns:110px 1fr auto auto; align-items:center; gap:14px; text-align:left; cursor:pointer; font-family:inherit; }
        .pata-v2-request-row strong { color:var(--v2-ink); }
        .pata-v2-chip { padding:5px 10px; border-radius:999px; background:#FFF3DE; color:#A45B05; font-size:10px; font-weight:900; }
        .pata-v2-form-card, .pata-v2-detail-card { padding:22px; display:grid; gap:16px; }
        .pata-v2-support-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .pata-v2-support-card { min-height:128px; padding:16px; display:flex; flex-direction:column; align-items:flex-start; gap:6px; border:1.5px solid #E2DCD2; border-radius:16px; background:white; color:#A09D94; text-align:left; font-family:inherit; cursor:pointer; transition:border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
        .pata-v2-support-card:hover { transform:translateY(-1px); border-color:var(--v2-teal); }
        .pata-v2-support-card:active { transform:translateY(1px); }
        .pata-v2-support-card.is-selected { border:2px solid var(--v2-teal); color:var(--v2-ink); box-shadow:0 5px 16px rgba(28,188,173,.11); }
        .pata-v2-support-card > span { font-size:11px; font-weight:900; }
        .pata-v2-support-card.is-selected > span { color:#087E75; }
        .pata-v2-support-card > strong { color:inherit; font:400 23px/1 'Fraiche','Outfit',sans-serif; }
        .pata-v2-support-card p, .pata-v2-support-card small { margin:0; font-size:10.5px; line-height:1.35; }
        .pata-v2-form-group { display:grid; gap:8px; }
        .pata-v2-form-label { color:var(--v2-ink); font-size:12px; font-weight:800; }
        .pata-v2-pet-options { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .pata-v2-pet-option { min-height:52px; display:flex; align-items:center; gap:9px; padding:9px 13px; border:1.5px solid #DED9CF; border-radius:12px; background:white; color:#8C887E; font:700 13px 'Outfit',sans-serif; text-align:left; cursor:pointer; }
        .pata-v2-pet-option.is-selected { border-color:var(--v2-teal); background:var(--v2-teal); color:white; }
        .pata-v2-pet-option:disabled { opacity:.58; cursor:not-allowed; }
        .pata-v2-pet-option-icon { width:30px; height:30px; flex:none; display:grid; place-items:center; border-radius:50%; background:#EFEAE0; color:#D77D3B; }
        .pata-v2-pet-option.is-selected .pata-v2-pet-option-icon { background:rgba(255,255,255,.22); color:white; }
        .pata-v2-pet-option-icon svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:1.8; }
        .pata-v2-document-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .pata-v2-document-card { min-height:124px; padding:15px 12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; border:2px dashed #A8DEDA; border-radius:14px; background:#F2FAF9; color:#087E75; text-align:center; cursor:pointer; transition:border-color .2s ease, background .2s ease, transform .2s ease; }
        .pata-v2-document-card[hidden] { display:none; }
        .pata-v2-document-card:hover { transform:translateY(-1px); border-color:var(--v2-teal); }
        .pata-v2-document-card.has-file { border-color:#7DCB91; background:#F1FAF3; color:#337744; }
        .pata-v2-document-card input { position:absolute; width:1px; height:1px; overflow:hidden; opacity:0; pointer-events:none; }
        .pata-v2-document-icon { width:24px; height:24px; display:grid; place-items:center; color:#B79FC9; }
        .pata-v2-document-icon svg { width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .pata-v2-document-card strong { max-width:190px; font-size:11px; line-height:1.35; }
        .pata-v2-document-card small { max-width:190px; overflow:hidden; color:#8A9691; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
        .pata-v2-detail-grid { display:grid; grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr); gap:14px; align-items:start; }
        .pata-v2-detail-card > strong { color:var(--v2-ink); font:400 34px/1 'Fraiche','Outfit',sans-serif; }
        .pata-v2-chat-card { padding:22px; display:grid; gap:14px; }
        .pata-v2-chat-history { display:grid; gap:9px; max-height:300px; overflow:auto; }
        .pata-v2-chat-message { max-width:82%; padding:10px 13px; border-radius:14px 14px 14px 4px; background:var(--v2-teal-soft); color:var(--v2-ink); }
        .pata-v2-chat-message.is-user { justify-self:end; border-radius:14px 14px 4px 14px; background:var(--v2-teal); color:white; }
        .pata-v2-chat-message span { display:block; margin-bottom:3px; font-size:10px; font-weight:900; }
        .pata-v2-chat-message p { margin:0; font-size:12px; line-height:1.45; }
        .pata-v2-chat-form { display:grid; gap:9px; }
        .pata-v2-chat-form textarea { width:100%; min-height:82px; resize:vertical; border:1.5px solid #DED9CF; border-radius:12px; padding:12px 14px; font:500 14px 'Outfit',sans-serif; }
        .pata-v2-field-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:13px; }
        .pata-v2-field { display:grid; gap:6px; color:var(--v2-ink); font-size:12px; font-weight:700; }
        .pata-v2-field input, .pata-v2-field select, .pata-v2-field textarea { width:100%; border:1.5px solid #DED9CF; border-radius:12px; padding:12px 14px; background:white; color:#243C39; font:500 14px 'Outfit',sans-serif; }
        .pata-v2-field textarea { min-height:100px; resize:vertical; }
        .pata-v2-field-help { color:#8A9691; font-size:10.5px; font-weight:500; }
        .pata-v2-field-help.is-valid { color:#337744; }
        .pata-v2-field-help.is-error { color:#A52D2D; }
        .pata-v2-submit { min-height:46px; border:0; border-radius:999px; background:var(--v2-orange); color:white; font-weight:900; cursor:pointer; }
        .pata-v2-notice { padding:12px 14px; border-radius:12px; background:#FFF7E8; color:#8A5A12; font-size:12px; }
        .pata-v2-error { padding:12px; border-radius:12px; background:#FCEAEA; color:#A52D2D; }

        @media (max-width: 1100px) {
            .pata-v2-shell { grid-template-columns: 205px minmax(0, 1fr); }
            .pata-v2-main { padding: 26px 24px 30px; }
            .pata-v2-pet-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
            .pata-v2-shell { display: block; }
            .pata-v2-sidebar { display: none; }
            .pata-v2-main { padding: 0 18px 28px; }
            .pata-v2-mobile-top { min-height: 66px; display: flex; align-items: center; justify-content: space-between; margin: 0 -18px 22px; padding: 10px 18px; background: white; border-bottom: 1px solid var(--v2-line); }
            .pata-v2-mobile-top img { width: 80px; }
            .pata-v2-mobile-actions { display: flex; gap: 7px; }
            .pata-v2-mobile-actions a, .pata-v2-mobile-actions button { min-width: 39px; height: 39px; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--v2-teal-soft); text-decoration: none; cursor: pointer; }
            .pata-v2-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .pata-v2-kpi:first-child { grid-column: 1 / -1; }
            .pata-v2-detail-grid { grid-template-columns:1fr; }
        }
        @media (max-width: 600px) {
            .pata-v2-main { padding-left: 14px; padding-right: 14px; }
            .pata-v2-mobile-top { margin-left: -14px; margin-right: -14px; padding-left: 14px; padding-right: 14px; }
            .pata-v2-header { align-items: flex-start; }
            .pata-v2-pets-page-head { align-items: flex-start; }
            .pata-v2-add-button { min-height: 40px; padding: 0 16px; }
            .pata-v2-header-actions { display: none; }
            .pata-v2-title { font-size: 27px; }
            .pata-v2-subtitle { font-size: 12.5px; line-height: 1.45; }
            .pata-v2-kpi-grid { grid-template-columns: 1fr; gap: 10px; }
            .pata-v2-kpi:first-child { grid-column: auto; }
            .pata-v2-kpi { min-height: 106px; padding: 17px 18px; }
            .pata-v2-support-options, .pata-v2-pet-options, .pata-v2-document-grid, .pata-v2-field-grid { grid-template-columns:1fr; }
            .pata-v2-pet-card { grid-template-columns: 70px minmax(0, 1fr); gap: 12px; padding: 15px; }
            .pata-v2-pet-photo { width: 70px; height: 76px; }
            .pata-v2-pet-top { display: block; }
            .pata-v2-status { display: inline-block; margin-top: 7px; }
            .pata-v2-pet-meta { white-space: normal; }
            .pata-v2-lower-grid { grid-template-columns: 1fr; }
            .pata-v2-balance-grid, .pata-v2-field-grid { grid-template-columns:1fr; }
            .pata-v2-request-row { grid-template-columns:1fr auto; }
            .pata-v2-activity-item { grid-template-columns: 32px 1fr; }
            .pata-v2-activity-date { grid-column: 2; }
        }
    `;

    class UnifiedWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
            this.isAmbassador = false;
            this.v2View = 'home';
            if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('section') === 'reimbursements') this.v2View = 'reimbursements';
            this.solidarity = { loading: false, loaded: false, error: '', stats: {}, requests: [], balances: {}, detail: null, messages: [] };
            this.membershipStatus = 'approved';
            this.memberWelcomeShown = true;
            this.userExtra = { firstName: '', lastName: '', lastAdminResponse: '', actionRequiredFields: [] };
            this.currentIndex = 0;
            this.showAppealForm = false;
            // 🆕 Estados para modal de actualización
            this.showUpdateModal = false;
            this.uploadFiles = { photo1: null, photo2: null, photo3: null, photo4: null, photo5: null };
            this.uploading = false;
            this.missingPhotosFiles = { photo1: null, photo2: null, photo3: null, photo4: null, photo5: null };

            window.UnifiedWidgetInstance = this;

            if (!this.container) return;
            this.init();
        }

        setIndex(idx) {
            console.log('🔄 Unified Widget: Setting active pet index to', idx);
            this.currentIndex = idx;
            this.showAppealForm = false;
            this.render();
        }

        async saveBirthday(petId) {
            const monthInput = document.getElementById(`pata-birth-month-${petId}`);
            const yearInput = document.getElementById(`pata-birth-year-${petId}`);
            const btn = document.getElementById(`pata-btn-birthday-${petId}`);
            if (!monthInput || !yearInput || !btn) return;

            const monthVal = monthInput.value.trim().toLowerCase();
            const yearVal = parseInt(yearInput.value, 10);
            
            const monthsMap = {
                'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
                'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
            };
            
            const birthMonth = monthsMap[monthVal] || parseInt(monthVal, 10);
            const birthYear = yearVal;

            if (!birthMonth || birthMonth < 1 || birthMonth > 12) {
                alert('Por favor ingresa un mes válido (ej. "Enero" o "1").');
                return;
            }

            const currentYear = new Date().getFullYear();
            if (!birthYear || birthYear > currentYear || birthYear < 1990) {
                alert('Por favor ingresa un año válido y que no sea mayor al actual.');
                return;
            }

            btn.disabled = true;
            btn.innerText = 'Guardando...';
            btn.style.opacity = '0.7';

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/${petId}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.member.id,
                        birthMonth,
                        birthYear
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert('¡Cumpleaños guardado exitosamente!');
                    
                    // Actualizar localmente
                    const pet = this.pets.find(p => p.id === petId);
                    if (pet) {
                        pet.birth_month = birthMonth;
                        pet.birth_year = birthYear;
                    }
                    
                    // Refrescar el modal
                    const modalWrapper = document.getElementById('pata-details-modal-wrapper');
                    if (modalWrapper) {
                        modalWrapper.innerHTML = this.renderPetDetailsModal(pet);
                        this.attachEvents();
                    } else {
                        location.reload();
                    }
                } else {
                    alert('Error al guardar: ' + (data.error || 'Desconocido'));
                }
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error inesperado al guardar el cumpleaños.');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Guardar';
                btn.style.opacity = '1';
            }
        }

        isLocalPreview() {
            return (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                && location.pathname.includes('/widgets/');
        }

        async init() {
            console.log('🚀 Unified Widget: Starting initialization...');
            this.injectStyles();

            // Asegurar que ocultamos cualquier loader si algo falla o tarda (Fail-safe)
            this.safetyTimeout = setTimeout(() => {
                console.log('🛡️ Unified Widget: Safety timeout reached, forcing hide loaders.');
                this.hideGlobalLoaders();
            }, 10000);

            try {
                console.log('⏳ Unified Widget: Waiting for Memberstack...');
                if (!this.isLocalPreview()) await this.waitForMemberstack();

                if (!this.member && this.isLocalPreview()) {
                    this.member = { id: 'local-preview-user', customFields: { 'first-name': 'Jorge' } };
                }

                if (!this.member) {
                    console.warn('⚠️ Unified Widget: No member session found.');
                    this.container.innerHTML = '<!-- Pata Amiga: No member session -->';
                    this.hideGlobalLoaders();
                    return;
                }
                console.log('✅ Unified Widget: Member loaded:', this.member.id);

                console.log('⏳ Unified Widget: Loading pet data...');
                await this.loadData();

                console.log('📊 Unified Widget: Pets found:', this.pets.length);

                if (this.pets.length > 0 || ['pending', 'pending_payment', 'payment_processing'].includes(this.membershipStatus)) {
                    console.log('✨ Unified Widget: Rendering panel...');
                    this.container.classList.add('show');
                    this.render();

                    // 🛠️ Debug Tools for Development
                    this.maybeShowMemberWelcomeModal();

                    window.pataDebug = {
                        // 1. Estado: Pago Pendiente
                        pagoPendiente: () => {
                            this.membershipStatus = 'pending_payment';
                            this.render();
                            console.log("💳 Vista: Pago Requerido");
                        },

                        // 2. Estado: Pago en Procesamiento (Stripe)
                        pagoProcesando: () => {
                            this.membershipStatus = 'payment_processing';
                            this.render();
                            console.log("⏳ Vista: Pago en Proceso");
                        },

                        // 3. Estado: Membresía en Revisión (Global)
                        revisionGlobal: () => {
                            this.membershipStatus = 'waiting_approval';
                            this.pets = []; // Forzamos a que no haya mascotas aprobadas aún
                            this.render();
                            console.log("⏳ Vista: Revisión de Perfil (Global)");
                        },

                        // 3.5 Estado: Membresía Cancelada
                        membresiaCancelada: (fecha = '2025-01-01') => {
                            this.membershipStatus = 'canceled_payment';
                            this.userExtra = { ...this.userExtra, canceledAt: fecha };
                            this.pets = [];
                            this.render();
                            console.log("❌ Vista: Membresía Cancelada");
                        },

                        // 4. Estado: Aprobado (Mascota con Carencia)
                        aprobado: (nombre = "Rex", isSenior = false) => {
                            this.membershipStatus = 'approved';
                            this.pets = [{
                                id: "fake-id",
                                name: nombre,
                                status: 'approved',
                                type: 'Perro',
                                breed: 'Labrador',
                                created_at: new Date().toISOString(), // Carencia desde hoy
                                age_value: isSenior ? 11 : 3,
                                age_unit: 'years',
                                photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200',
                                waiting_period_days: 180
                            }];
                            this.currentIndex = 0;
                            this.render();
                            console.log("✅ Vista: Mascota Aprobada (Carencia activa)");
                        },

                        // 5. Estado: Rechazado (Con perro asomado)
                        rechazado: () => {
                            this.membershipStatus = 'approved';
                            this.pets = [{
                                id: "fake-id",
                                name: "Tobby",
                                status: 'rejected',
                                rejection_reason: "La foto del certificado no es legible.",
                                type: 'Gato',
                                created_at: new Date().toISOString(),
                                photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200'
                            }];
                            this.currentIndex = 0;
                            this.render();
                            console.log("❌ Vista: Mascota Rechazada");
                        },

                        // 6. Estado: Acción Requerida (Subir documentos)
                        accionRequerida: () => {
                            this.membershipStatus = 'approved';
                            this.pets = [{
                                id: "fake-id",
                                name: "Luna",
                                status: 'action_required',
                                type: 'Perro',
                                created_at: new Date().toISOString(),
                                photo_url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=200&h=200'
                            }];
                            this.currentIndex = 0;
                            this.render();
                            console.log("⚠️ Vista: Acción Requerida");
                        },

                        // 7. Estado: Apelación Enviada
                        apelado: () => {
                            this.membershipStatus = 'approved';
                            this.pets = [{
                                id: "fake-id",
                                name: "Luna",
                                status: 'appealed',
                                type: 'Perro',
                                created_at: new Date().toISOString(),
                                photo_url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=200&h=200'
                            }];
                            this.currentIndex = 0;
                            this.render();
                            console.log("⚖️ Vista: Apelación en curso");
                        },

                        // Ayuda
                        help: () => {
                            console.table({
                                "pataDebug.pagoPendiente()": "Ver pantalla de cobro",
                                "pataDebug.pagoProcesando()": "Ver pantalla de Stripe procesando",
                                "pataDebug.revisionGlobal()": "Ver revisión de cuenta (24h)",
                                "pataDebug.membresiaCancelada()": "Ver pantalla de renovación",
                                "pataDebug.aprobado()": "Ver dashboard con tiempo de espera",
                                "pataDebug.rechazado()": "Ver pantalla de rechazo/reembolso",
                                "pataDebug.accionRequerida()": "Ver pantalla de documentos faltantes",
                                "pataDebug.apelado()": "Ver estado de apelación"
                            });
                        }
                    };

                    window.pataDebug.help();

                    // 🆕 Magic Link: Auto-open chat if URL has action=chat&petId=X
                    try {
                        const urlParams = new URLSearchParams(window.location.search);
                        const action = urlParams.get('action');
                        const magicPetId = urlParams.get('petId');
                        if (action === 'chat' && magicPetId) {
                            const targetPet = this.pets.find(p => p.id === magicPetId);
                            if (targetPet) {
                                console.log('🔗 Magic Link: Opening chat for pet', magicPetId);
                                setTimeout(() => {
                                    const modalHtml = this.renderPetDetailsModal(targetPet);
                                    const modalDiv = document.createElement('div');
                                    modalDiv.id = 'pata-details-modal-wrapper';
                                    modalDiv.innerHTML = modalHtml;
                                    document.body.appendChild(modalDiv);
                                    document.body.classList.add('pata-no-scroll');

                                    const close = () => {
                                        modalDiv.remove();
                                        document.body.classList.remove('pata-no-scroll');
                                    };

                                    const closeBtn1 = document.getElementById('pata-close-details');
                                    const closeBtn2 = document.getElementById('pata-close-details-btn');
                                    if (closeBtn1) closeBtn1.onclick = close;
                                    if (closeBtn2) closeBtn2.onclick = close;
                                    this.fetchAndRenderChat(targetPet.id);
                                    const modalOverlay = document.getElementById('pata-pet-details-modal');
                                    if (modalOverlay) {
                                        modalOverlay.onclick = (ev) => {
                                            if (ev.target.id === 'pata-pet-details-modal') close();
                                        };
                                    }
                                }, 800);
                            }
                        }
                    } catch (e) { console.warn('Magic link handling error:', e); }
                } else {
                    console.warn('⚠️ Unified Widget: No pets found for this user in Supabase.');
                    this.container.innerHTML = `
                        <div class="pata-unified-panel show">
                            <div style="color:white; padding:20px; text-align:center; font-weight:600;">
                                👋 Hola ${(this.userExtra?.firstName || 'Socio').toLowerCase()}. <br>
                                <span style="font-size: 14px; font-weight: 400; opacity: 0.8;">No encontramos mascotas registradas o están pendientes de sincronización.</span>
                            </div>
                        </div>
                    `;
                    this.container.classList.add('show');
                    this.hideGlobalLoaders();
                }
            } catch (err) {
                console.error('❌ Unified Widget: Critical error during init:', err);
                this.container.innerHTML = `<div style="color:red; padding:10px; font-size:12px;">Widget Error: ${err.message}</div>`;
                this.hideGlobalLoaders();
            } finally {
                // Si llegamos aquí y no hay mascotas para renderizar de forma normal,
                // aseguramos que el loader se vaya de todos modos.
                if (this.pets.length === 0 && !['pending', 'pending_payment', 'payment_processing'].includes(this.membershipStatus)) {
                    this.hideGlobalLoaders();
                }
                if (this.safetyTimeout) clearTimeout(this.safetyTimeout);
            }
        }

        injectStyles() {
            if (!document.getElementById('pata-unified-styles')) {
                const style = document.createElement('style');
                style.id = 'pata-unified-styles';
                style.textContent = STYLES;
                document.head.appendChild(style);
            }
            if (!document.getElementById('pata-v2-styles')) {
                const v2Style = document.createElement('style');
                v2Style.id = 'pata-v2-styles';
                v2Style.textContent = V2_STYLES;
                document.head.appendChild(v2Style);
            }
        }

        async waitForMemberstack() {
            return new Promise((resolve) => {
                let attempts = 0;
                const check = setInterval(() => {
                    attempts++;
                    if (window.$memberstackDom) {
                        clearInterval(check);
                        window.$memberstackDom.getCurrentMember().then(({ data }) => {
                            this.member = data;
                            resolve();
                        });
                    } else if (attempts > 50) { clearInterval(check); resolve(); }
                }, 100);
            });
        }

        async loadData() {
            try {
                // 🔴 LOCAL TESTING: Inject 3 pets if on localhost
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    console.log('🧪 Unified Widget: Local environment detected, injecting test pets...');
                    this.pets = [
                        {
                            id: 'test-approved',
                            name: 'Simba',
                            type: 'Perro',
                            breed: 'Golden Retriever',
                            status: 'approved',
                            photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200',
                            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
                            waiting_period_days: 180
                        },
                        {
                            id: 'test-rejected',
                            name: 'Luna',
                            type: 'Gato',
                            breed: 'Persa',
                            status: 'rejected',
                            rejection_reason: 'La documentación proporcionada no coincide con los datos del registro.',
                            photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200'
                        },
                        {
                            id: 'test-action',
                            name: 'Rex',
                            type: 'Perro',
                            breed: 'Pastor Alemán',
                            status: 'action_required',
                            photo_url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=200&h=200'
                        }
                    ];
                    this.membershipStatus = 'approved';
                    this.memberWelcomeShown = this.isLocalPreview();
                    this.member = this.member || { id: 'test-user', customFields: { 'first-name': 'Jorge' } };
                    this.userExtra = {
                        firstName: 'Jorge',
                        lastAdminResponse: '',
                        actionRequiredFields: []
                    };
                    this.isAmbassador = true;
                    return;
                }

                // 🔴 PRIMERO: Verificar si tiene plan activo
                console.log('📡 Unified Widget: Checking payment status...');
                const roleRes = await fetch(`${CONFIG.apiUrl}/api/auth/check-role`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberstackId: this.member.id })
                });
                const roleData = await roleRes.json();

                if (roleData.success) {
                    this.isAmbassador = roleData.role === 'ambassador' || roleData.isAmbassador === true;
                    console.log('📊 Unified Widget: Role check result:', roleData.role);

                    // Cuando actives cobros, descomenta el bloque original
                    if (roleData.role === 'pending_payment') {
                        console.log('💳 Unified Widget: User has no active plan. Bloqueando panel y pidiendo pago.');
                        this.membershipStatus = 'pending_payment';
                        this.pets = [];
                        return; // No cargar mascotas, mostrar vista de pago
                    }

                    if (roleData.role === 'payment_processing') {
                        console.log('⏳ Unified Widget: Payment is processing');
                        this.membershipStatus = 'payment_processing';
                        this.pets = [];
                        return;
                    }

                    if (roleData.role === 'canceled_payment') {
                        console.log('❌ Unified Widget: Membership is canceled');
                        this.membershipStatus = 'canceled_payment';
                        this.userExtra.canceledAt = roleData.canceledAt;
                        this.pets = [];
                        return;
                    }
                }

                // ✅ Si tiene plan, cargar mascotas normalmente
                const url = `${CONFIG.apiUrl}/api/user/pets?userId=${this.member.id}&t=${Date.now()}`;
                console.log('📡 Unified Widget: Fetching pets from:', url);
                const res = await fetch(url);
                const data = await res.json();
                console.log('📥 Unified Widget: Received data:', data);

                if (data.success) {
                    this.pets = data.pets || [];
                    this.membershipStatus = (data.membership_status || 'approved').toLowerCase();
                    this.memberWelcomeShown = data.welcome_shown === true;
                    console.log(`📊 Unified Widget: Status="${this.membershipStatus}", Pets=${this.pets.length}`);
                    this.userExtra = {
                        firstName: data.first_name || '',
                        lastName: data.last_name || '',
                        lastAdminResponse: data.last_admin_response || '',
                        actionRequiredFields: data.action_required_fields || []
                    };
                } else {
                    console.error('❌ Unified Widget: API error:', data.error);
                }
            } catch (err) {
                console.error('❌ Unified Widget: Fetch failed:', err);
            }
        }

        calculateCarencia(pet) {
            const now = new Date();
            let start = new Date();
            if (pet.waiting_period_start) {
                const parsed = new Date(pet.waiting_period_start);
                if (!isNaN(parsed.getTime())) start = parsed;
            } else if (pet.created_at) {
                const parsed = new Date(pet.created_at);
                if (!isNaN(parsed.getTime())) start = parsed;
            }

            // Lógica de carencia refinada:
            // 1. Codigo de embajador -> 90 dias
            // 2. Mestizo + Adoptado -> 120 dias
            // 3. Raza + Adoptado -> 150 dias
            // 4. Estandar (No adoptado) -> 180 dias

            if (pet.waiting_period_end) {
                const endDate = new Date(pet.waiting_period_end);
                if (!isNaN(endDate.getTime())) {
                    const diffTotal = Math.max(0, endDate.getTime() - start.getTime());
                    const totalDays = Math.ceil(diffTotal / (1000 * 60 * 60 * 24)) || 180;
                    const diffTime = Math.max(0, now.getTime() - start.getTime());
                    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                    const percentage = Math.min(100, Math.round((daysPassed / totalDays) * 100));

                    return { daysRemaining, percentage, totalDays, endDate, isWaiting: daysRemaining > 0 };
                }
            }

            let totalDays = 180;

            const isTrue = (val) => val === true || val === 'true' || val === 1 || val === '1';
            const isAdopted = isTrue(pet.is_adopted) || isTrue(pet['is-adopted']) || isTrue(pet.isAdopted);
            const isMixed = isTrue(pet.is_mixed_breed) || isTrue(pet['is-mixed-breed']) || isTrue(pet.is_mixed) || isTrue(pet.isMixed);
            const hasAmbassadorCode = !!(pet.referral_code || pet.ambassador_code || (this.msFields && (this.msFields['referral-code'] || this.msFields['ambassador-code'])));

            // Si el objeto ya trae el campo calculado del backend, usarlo
            if (pet.waiting_period_days) {
                totalDays = parseInt(pet.waiting_period_days);
            } else if (hasAmbassadorCode) {
                totalDays = 90;
            } else if (isAdopted) {
                totalDays = isMixed ? 120 : 150;
            }


            const diffTime = Math.max(0, now.getTime() - start.getTime());
            const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, totalDays - daysPassed);
            const percentage = Math.min(100, Math.round((daysPassed / totalDays) * 100));

            const endDate = new Date(start);
            endDate.setDate(endDate.getDate() + totalDays);

            return { daysRemaining, percentage, totalDays, endDate, isWaiting: daysRemaining > 0 };
        }

        maybeShowMemberWelcomeModal() {
            const hasPets = this.pets && this.pets.length > 0;
            const isMemberReady = this.membershipStatus === 'active' || this.membershipStatus === 'approved' || hasPets;
            const blockedStatus = ['pending_payment', 'payment_processing', 'canceled_payment'].includes(this.membershipStatus);

            if (!this.member || this.memberWelcomeShown || !isMemberReady || blockedStatus) return;

            setTimeout(() => this.showMemberWelcomeModal(), 300);
        }

        showMemberWelcomeModal() {
            if (document.getElementById('pata-member-welcome-modal')) return;

            const overlay = document.createElement('div');
            overlay.className = 'pata-modal-overlay show';
            overlay.id = 'pata-member-welcome-modal';
            overlay.style.zIndex = '1000000';
            overlay.innerHTML = `
                <div class="pata-modal pata-member-welcome-modal" onclick="event.stopPropagation()">
                    <div class="pata-member-welcome-icon" aria-hidden="true">
                        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="32" cy="40" rx="17" ry="14" fill="currentColor"/>
                            <circle cx="15" cy="25" r="7" fill="currentColor"/>
                            <circle cx="27" cy="15" r="7" fill="currentColor"/>
                            <circle cx="41" cy="15" r="7" fill="currentColor"/>
                            <circle cx="51" cy="27" r="7" fill="currentColor"/>
                        </svg>
                    </div>
                    <h2 class="pata-member-welcome-title">&iexcl;Bienvenido a la manada!</h2>
                    <p class="pata-member-welcome-text">
                        Tu membres&iacute;a est&aacute; activa: orientaci&oacute;n veterinaria 24/7, reintegros y centros aliados te esperan.
                    </p>
                    <p id="pata-member-welcome-error" class="pata-member-welcome-text" role="alert" hidden></p>
                    <button id="pata-member-welcome-close" class="pata-member-welcome-btn">Explorar mi cuenta</button>
                </div>
            `;

            const closeModal = async () => {
                if (overlay.dataset.saving === 'true') return;
                const button = overlay.querySelector('#pata-member-welcome-close');
                const errorMessage = overlay.querySelector('#pata-member-welcome-error');
                overlay.dataset.saving = 'true';
                button.disabled = true;
                button.textContent = 'Guardando...';
                errorMessage.hidden = true;

                try {
                    const response = await fetch(`${CONFIG.apiUrl}/api/user/welcome-shown`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberstackId: this.member.id })
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success || data.welcome_shown !== true) {
                        throw new Error(data.error || 'No se pudo guardar la bienvenida.');
                    }
                    this.memberWelcomeShown = true;
                    overlay.remove();
                } catch (err) {
                    console.error('Unified Widget: Error saving member welcome_shown:', err);
                    errorMessage.textContent = 'No pudimos guardar este cambio. Intenta nuevamente.';
                    errorMessage.hidden = false;
                    button.disabled = false;
                    button.textContent = 'Reintentar';
                    overlay.dataset.saving = 'false';
                }
            };

            overlay.querySelector('#pata-member-welcome-close').addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);
            document.body.appendChild(overlay);
        }

        escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        getCarenciaExplanation(pet) {
            const isTrue = (val) => val === true || val === 'true' || val === 1 || val === '1';
            const isAdopted = isTrue(pet.is_adopted) || isTrue(pet['is-adopted']) || isTrue(pet.isAdopted);
            const isMixed = isTrue(pet.is_mixed_breed) || isTrue(pet['is-mixed-breed']) || isTrue(pet.is_mixed) || isTrue(pet.isMixed);
            const hasAmbassadorCode = !!(pet.referral_code || pet.ambassador_code || (this.msFields && (this.msFields['referral-code'] || this.msFields['ambassador-code'])));
            const carencia = this.calculateCarencia(pet);
            const type = (pet.pet_type || pet.type || '').toLowerCase();
            const species = type.includes('gato') || type.includes('cat') ? 'michi' : 'lomito';
            const adoptedText = isAdopted ? 'adoptado' : 'no adoptado';
            const breedText = isMixed ? (species === 'michi' ? 'dom&eacute;stico' : 'mestizo') : 'de raza';
            const ambassadorText = hasAmbassadorCode ? ' y registrado con c&oacute;digo de embajador' : '';
            const name = this.escapeHtml(pet.name || 'tu mascota');

            return `Al ser <strong>${name}</strong> un ${species} ${breedText} y ${adoptedText}${ambassadorText}, su periodo de activaci&oacute;n total es de <strong>${carencia.totalDays} d&iacute;as</strong>. Mientras tanto, &iexcl;ya est&aacute;s dentro de la comunidad!`;
        }

        isSenior(pet) {
            const age = parseInt(pet.age_value) || 0;
            const totalMonths = pet.age_unit === 'months' ? age : age * 12;
            return totalMonths >= 120; // 10+ years
        }

        getPetIcon(pet) {
            const photoUrl = pet.photo_url || pet.primary_photo_url;
            if (photoUrl) {
                return `<img src="${photoUrl}" alt="${pet.name || 'Mascota'}" />`;
            }

            const type = (pet.pet_type || pet.petType || '').toLowerCase();
            const iconName = (type === 'gato' || type === 'cat') ? 'cat-icon.svg' : 'dog-icon.svg';
            // IMPORTANTE: Para assets en /public, siempre usar el dominio de producción app.pataamiga.mx y respetar las mayúsculas (Icons)
            return `<img src="https://app.pataamiga.mx/Icons/${iconName}" alt="${type}" style="width: 24px; height: 24px; opacity: 0.8;" />`;
        }

        checkMissingDocs(pet) {
            if (!pet) return [];
            const missing = [];
            
            // 1. Validar Foto Principal
            const hasPhoto = !!(pet.photo_url || pet.primary_photo_url || pet.pet_photo_url);
            if (!hasPhoto) missing.push("Foto principal de tu mascota");
            
            // 2. Validar Certificado Médico si es Senior
            if (this.isSenior(pet)) {
                if (!pet.vet_certificate_url) {
                    missing.push("Certificado médico de salud");
                }
            }
            
            return missing;
        }

        getDeadlineInfo() {
            if (!this.member?.userMeta?.registrationDate && !this.member?.createdAt) return null;
            const regDateStr = this.member.customFields?.['registration-date'] || this.member.createdAt;
            const regDate = new Date(regDateStr);
            if (isNaN(regDate.getTime())) return null;

            const deadline = new Date(regDate.getTime() + (15 * 24 * 60 * 60 * 1000));
            const now = new Date();
            const diff = deadline - now;
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

            return {
                deadline: deadline.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }),
                daysLeft,
                isExpired: daysLeft < 0
            };
        }

        renderWarningBanner(pet) {
            const missing = this.checkMissingDocs(pet);
            if (missing.length === 0) return '';

            const deadlineInfo = this.getDeadlineInfo();
            if (!deadlineInfo) return '';

            return `
                <div class="pata-documentation-warning">
                    <div class="pata-warning-icon">⚠️</div>
                    <div class="pata-warning-content">
                        <strong>Documentación pendiente para ${pet.name}</strong>
                        <p>Falta: ${missing.join(', ')}</p>
                        <p class="pata-warning-deadline">
                            ${deadlineInfo.isExpired
                    ? '⚠️ Tu plazo de 15 días ha expirado. Sube estos documentos pronto para evitar problemas con tu cobertura.'
                    : `Tienes hasta el <strong>${deadlineInfo.deadline}</strong> (${deadlineInfo.daysLeft} días) para completar tu registro.`}
                        </p>
                    </div>
                </div>
            `;
        }

        renderMemberPendingView(firstName) {
            return `
                <div class="pata-approved-wrapper-new">
                    <main class="pata-container-new">
                        <header class="pata-header-new">
                            <h1 data-od-id="dashboard-greeting">¡hola, ${firstName}!</h1>
                            <div class="pata-header-sub-new">
                                <p>Estamos preparando todo para darte la bienvenida oficial.</p>
                            </div>
                        </header>

                        <section class="pata-card-new">
                            <div class="pata-member-pending-view-new">
                                <h2 class="pata-member-pending-title-new">tu membresía está en revisión</h2>
                                <p class="pata-member-pending-subtitle-new">
                                    Recibimos tu solicitud y ya estamos revisando la información para poder continuar con tu proceso. 
                                    En un máximo de 24-48 horas te notificaremos el resultado.
                                </p>
                                
                                <div class="pata-action-required-progress-container" style="margin-bottom: 40px;">
                                    <div class="pata-action-required-progress-labels">
                                        <span>Solicitud enviada</span>
                                        <span>En revisión...</span>
                                    </div>
                                    <div class="pata-action-required-progress-track">
                                        <div class="pata-action-required-progress-fill" style="width: 85%;"></div>
                                    </div>
                                </div>

                                ${this.renderInReviewBenefits('mientras tanto, disfruta de estos beneficios:')}

                                <div class="pata-badge-brutalist">
                                    <div style="font-size: 32px;">🛡️</div>
                                    <div style="text-align: left;">
                                        <strong class="pata-badge-title-brutalist">control total de tu cuenta</strong>
                                        <p class="pata-badge-text-brutalist">Recuerda que puedes cancelar tu membresía en cualquier momento desde tu panel sin complicaciones.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            `;
        }

        render() {
            if (!this.container) return;

            const firstName = (this.userExtra?.firstName || 'Socio').toLowerCase();
            const pet = this.pets[this.currentIndex];

            // 1. Payment states (Priority)
            if (this.membershipStatus === 'pending_payment') {
                this.container.innerHTML = this.renderPaymentRequiredView(firstName);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
                return;
            }

            if (this.membershipStatus === 'payment_processing') {
                this.container.innerHTML = this.renderPaymentProcessingView(firstName);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
                return;
            }

            if (this.membershipStatus === 'canceled_payment') {
                const canceledAt = this.userExtra?.canceledAt;
                this.container.innerHTML = this.renderCanceledView(firstName, canceledAt);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
                return;
            }

            // 2. Member Pending (Waiting Approval)
            const hasPets = this.pets && this.pets.length > 0;
            const isLegacyMemberReviewStatus = this.membershipStatus === 'waiting_approval' || this.membershipStatus === 'pending_approval';
            if (isLegacyMemberReviewStatus && !hasPets) {
                this.container.innerHTML = this.renderMemberPendingView(firstName);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
                return;
            }

            // 3. Dashboard View (Active, Approved)
            const isMemberApproved = this.membershipStatus === 'active' || this.membershipStatus === 'approved';

            console.log(`📊 Unified Widget: Global Status="${this.membershipStatus}", Current Pet="${pet?.name}", PetsCount=${this.pets.length}`);

            if (isMemberApproved || hasPets) {
                // If member is approved, or if they have pets (and not waiting approval above), show the dashboard
                this.renderDashboardView(firstName, pet);
            } else if (this.membershipStatus === 'rejected') {
                // Globally rejected
                this.renderRejectedView(firstName, null);
            } else {
                // Default fallback for pending with no pets
                this.container.innerHTML = this.renderCompleteRegistrationView(firstName);
                this.container.classList.add('show');
                this.hideGlobalLoaders();
            }
        }

        handleCancelAppeal() {
            console.log('⚖️ Unified Widget: Cancelling appeal.');
            this.showAppealForm = false;
            this.render();
        }

        renderAppealForm(firstName, pet) {
            return `
                <div class="pata-missing-wrapper">
                    <main class="pata-missing-container">
                        <header class="pata-missing-header">
                            <h1 style="color: white !important;">apelar solicitud</h1>
                            <p style="color: black;">revisaremos tu caso para <strong>${pet.name.toLowerCase()}</strong></p>
                        </header>

                        <section class="pata-missing-card" style="border: 2px solid #000; padding: 40px; border-radius: 40px; background: white;">
                            <div class="pata-missing-content">
                                <h3 style="font-family: 'Fraiche', sans-serif; font-size: 24px; margin-bottom: 20px; text-transform: lowercase;">cuéntanos más</h3>
                                <textarea id="pata-textarea-appeal" 
                                          style="width: 100%; min-height: 150px; border: 2px solid #000; border-radius: 20px; padding: 20px; font-family: 'Outfit', sans-serif; font-size: 16px; margin-bottom: 30px;" 
                                          placeholder="Describe por qué deberíamos reconsiderar tu solicitud..."></textarea>

                                <div class="pata-btn-group" style="display: flex; gap: 15px; flex-wrap: wrap;">
                                    <button class="pata-btn" style="background: #eee; color: #000; border: 2px solid #000; padding: 15px 40px; border-radius: 50px; font-weight: 900; cursor: pointer; font-family: 'Fraiche', sans-serif; text-transform: lowercase;" onclick="window.pataWidget.handleCancelAppeal()">
                                        cancelar
                                    </button>
                                    <button id="pata-btn-submit-appeal" class="pata-btn" data-pet-id="${pet.id}" style="flex: 1; background: #15BEB2; color: #000; border: 2px solid #000; padding: 15px 40px; border-radius: 50px; font-weight: 900; cursor: pointer; font-family: 'Fraiche', sans-serif; text-transform: lowercase;">
                                        enviar apelación
                                    </button>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            `;
        }

        renderRejectedView(firstName, pet) {
            const rejectionReason = this.userExtra?.lastAdminResponse || pet?.rejection_reason || 'Identificamos un requisito que no está alineado con las reglas de ingreso del club. Es parte de nuestro compromiso por mantener la comunidad protegida.';

            this.container.innerHTML = `
                <div class="pata-rejected-wrapper-new">
                    <main class="pata-rejected-container-new">
                        <header class="pata-rejected-header-new">
                            <h1 data-od-id="greeting">¡hola, ${firstName}!</h1>
                            <div class="pata-rejected-header-sub-new">
                                <p>En esta ocasión no fue posible aprobar tu solicitud para unirte a Club Pata Amiga.</p>
                                <p><strong>Tu pago ha sido devuelto íntegro. No se realizó ningún cargo a tu cuenta.</strong></p>
                            </div>
                        </header>
                        <div class="pata-rejected-card-wrapper-new">
                            <div class="pata-rejected-card-new">
                                <div class="pata-rejected-card-main-new">
                                    <h2 class="pata-rejected-card-title-new" data-od-id="main-status">tu solicitud no fue aprobada</h2>
                                    <p class="pata-rejected-card-intro-new">Lamentamos informarte que la solicitud de ${pet?.name || 'tu mascota'} no pudo ser aprobada en esta ocasión. Con el compromiso de mantener una total transparencia en nuestro proceso, te compartimos la razón detallada a continuación:</p>
                                </div>
                                <div class="pata-rejected-card-details-new">
                                    <span class="pata-rejected-detail-label-new">Motivo del rechazo:</span>
                                    <p class="pata-rejected-detail-text-new" data-od-id="reason">
                                        "${rejectionReason}"
                                    </p>
                                </div>
                            </div>
                            <img src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777945368/pet-rejected_ude216.png" alt="Mascota triste" class="pata-rejected-mascot-new" data-od-id="mascot">
                        </div>
                        <footer class="pata-rejected-footer-new">
                            <a href="javascript:void(0)" class="pata-rejected-btn-appeal-new pata-btn-ver-detalles" data-pet-id="${pet.id}" data-od-id="cta">Apelar mi solicitud</a>
                            <p class="pata-rejected-footer-note-new">Revisaremos tu apelación con gusto ♡</p>
                        </footer>
                    </main>
                </div>
            `;
            this.container.classList.add('show');
            this.attachEvents();
            this.hideGlobalLoaders();
        }

        renderActionRequiredView(firstName, pet) {
            const petImage = pet?.photo_url || 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';

            this.container.innerHTML = `
                <div class="pata-missing-wrapper">
                    <main class="pata-missing-container">
                        <header class="pata-missing-header">
                            <h1 style="color: white !important;">¡hola, ${firstName}!</h1>
                            <div class="pata-missing-header-sub">
                                <p><strong>Necesitamos un poco más de información</strong></p>
                                <p>Revisamos tu solicitud y falta algún detalle para poder darte la bienvenida oficial. ¡No te preocupes, es muy rápido!</p>
                            </div>
                        </header>

                        <section class="pata-missing-card">
                            <div class="pata-missing-card-content">
                                <h2 class="pata-missing-card-title">información pendiente</h2>
                                <p class="pata-missing-card-intro">Nuestro equipo detectó que falta lo siguiente para completar tu registro:</p>

                                <div class="pata-missing-fields-box">
                                    <ul class="pata-missing-list">
                                        ${(this.userExtra?.actionRequiredFields || []).map(f => `<li>${f}</li>`).join('') || '<li>Detalles adicionales de tu mascota</li>'}
                                    </ul>
                                </div>

                                <div class="pata-missing-note">
                                    <div class="pata-missing-note-icon">💡</div>
                                    <div class="pata-missing-note-text">
                                        <strong>Nota del equipo:</strong><br>
                                        "${this.userExtra?.lastAdminResponse || 'Por favor, contacta con nosotros para resolver los detalles pendientes.'}"
                                    </div>
                                </div>

                                <button class="pata-btn pata-btn-chat" style="background: #15BEB2; color: #000; border: 2px solid #000; font-family: 'Fraiche', sans-serif;" onclick="if(window.MemberStackChat) window.MemberStackChat.open()">
                                    <span>abrir chat y actualizar</span>
                                    <div class="pata-btn-arrow">→</div>
                                </button>
                            </div>

                            <div class="pata-missing-card-image">
                                <img src="${petImage}" alt="Mascota">
                                <div class="pata-missing-image-badge">🛡️ Registro seguro</div>
                            </div>
                        </section>
                    </main>
                </div>
            `;
            this.container.classList.add('show');
            this.hideGlobalLoaders();
        }

        getV2Status(pet) {
            if (pet.is_active === false) return { key: 'inactive', label: 'DADA DE BAJA' };
            const status = (pet.status || pet.approval_status || 'pending').toLowerCase();
            const statuses = {
                approved: { key: 'approved', label: '✓ APROBADO' },
                pending: { key: 'pending', label: 'EN REVISIÓN' },
                pending_approval: { key: 'pending', label: 'EN REVISIÓN' },
                waiting_approval: { key: 'pending', label: 'EN REVISIÓN' },
                rejected: { key: 'rejected', label: 'RECHAZADO' },
                action_required: { key: 'action_required', label: 'ACCIÓN REQUERIDA' },
                appealed: { key: 'appealed', label: 'APELACIÓN EN REVISIÓN' }
            };
            return statuses[status] || statuses.pending;
        }

        formatV2Date(value) {
            if (!value) return '';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return '';
            return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        renderV2PetCards() {
            if (!this.pets.length) {
                return `<div class="pata-v2-empty">Aún no registras a ningún peludo. <a class="pata-v2-kpi-link" href="${CONFIG.addPetUrl}">Preséntanos al primero →</a></div>`;
            }

            return this.pets.map((pet, index) => {
                const status = this.getV2Status(pet);
                const carencia = this.calculateCarencia(pet);
                const image = pet.photo_url || pet.primary_photo_url || pet.pet_photo_url || '';
                const type = this.escapeHtml(pet.type || pet.species || 'Mascota');
                const breed = this.escapeHtml(pet.breed || pet.breed_name || 'Sin raza registrada');
                const age = pet.age ? ` · ${this.escapeHtml(String(pet.age))}` : '';
                const name = this.escapeHtml(pet.name || `Peludo ${index + 1}`);
                const waitText = carencia.daysRemaining > 0 ? `${carencia.daysRemaining} días` : 'Completado';
                const actionText = status.key === 'approved' && !carencia.isWaiting
                    ? 'Reintegro disponible · Utilizar mis beneficios →'
                    : status.key === 'action_required'
                        ? 'Completar información →'
                        : status.key === 'rejected'
                            ? 'Ver motivo y opciones →'
                            : 'Ver expediente →';

                return `
                    <article class="pata-v2-pet-card ${pet.is_active === false ? 'pata-grayscale' : ''}">
                        <div class="pata-v2-pet-photo">
                            ${image ? `<img src="${this.escapeHtml(image)}" alt="Foto de ${name}" loading="lazy">` : `<span>FOTO<br>${name}</span>`}
                        </div>
                        <div class="pata-v2-pet-content">
                            <div class="pata-v2-pet-top">
                                <div>
                                    <h3 class="pata-v2-pet-name">${name}</h3>
                                    <p class="pata-v2-pet-meta">${type} · ${breed}${age}</p>
                                </div>
                                <span class="pata-v2-status ${status.key}">${status.label}</span>
                            </div>
                            <div class="pata-v2-wait">
                                <div class="pata-v2-wait-row"><span>Período de espera</span><strong>${waitText}</strong></div>
                                <div class="pata-v2-track"><span style="width:${carencia.percentage}%"></span></div>
                            </div>
                            <button class="pata-v2-pet-action pata-btn-ver-detalles" data-pet-id="${this.escapeHtml(String(pet.id))}" data-pet-index="${index}">${actionText}</button>
                        </div>
                    </article>
                `;
            }).join('');
        }

        renderV2Activity() {
            const activities = this.pets.slice(0, 3).map(pet => ({
                text: `Registraste a ${this.escapeHtml(pet.name || 'tu mascota')} — su período de espera comenzó`,
                date: this.formatV2Date(pet.created_at || pet.waiting_period_start)
            }));
            if (!activities.length) return '<p>Aquí verás los avances de tu manada.</p>';
            return activities.map(item => `
                <div class="pata-v2-activity-item">
                    <span class="pata-v2-activity-icon">🐾</span>
                    <span>${item.text}</span>
                    <span class="pata-v2-activity-date">${item.date}</span>
                </div>
            `).join('');
        }

        getSolidarityClient() {
            if (window.PataSolidarityClient) return new window.PataSolidarityClient(CONFIG.apiUrl);
            return new EmbeddedSolidarityClient(CONFIG.apiUrl);
        }

        async showReimbursementsV2() {
            this.v2View = 'reimbursements';
            this.render();
            if (this.solidarity.loaded || this.solidarity.loading) return;
            this.solidarity.loading = true;
            this.render();
            try {
                if (this.isLocalPreview()) {
                    this.solidarity.balances = {
                        medical_emergency: { limit: 3000, used: 1200, available: 1800 },
                        annual_vaccination: { limit: 300, used: 0, available: 300 },
                        death: { limit: 2000, used: 0, available: 2000 }
                    };
                    this.solidarity.requests = [
                        { id:'mock-1', request_number:'A345', benefit_type:'medical_emergency', status:'in_review', requested_amount:1200, case_title:'Consulta y estudios', created_at:new Date().toISOString(), pet:{ name:'Simba' } },
                        { id:'mock-2', request_number:'A298', benefit_type:'annual_vaccination', status:'paid', requested_amount:300, case_title:'Vacuna anual', created_at:new Date(Date.now()-30*86400000).toISOString(), pet:{ name:'Luna' } }
                    ];
                } else {
                    const client = this.getSolidarityClient();
                    if (!client) throw new Error('No se cargó el cliente de reintegros.');
                    const data = await client.getOverview(this.member.id);
                    this.solidarity.balances = data.balance.balances || data.balance || {};
                    this.solidarity.requests = data.history.requests || [];
                    this.solidarity.stats = data.stats || {};
                }
                this.solidarity.loaded = true;
                this.solidarity.error = '';
            } catch (error) { this.solidarity.error = error.message; }
            finally {
                this.solidarity.loading = false;
                if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('form') === 'original') this.v2View = 'newReimbursement';
                this.render();
            }
        }

        showNewReimbursementV2() { this.v2View = 'newReimbursement'; this.render(); }

        async showReimbursementDetailV2(requestId) {
            this.v2View = 'reimbursementDetail';
            this.solidarity.detail = this.solidarity.requests.find(r => String(r.id) === String(requestId)) || null;
            if (this.isLocalPreview()) {
                this.solidarity.messages = [
                    { id:'mock-message-1', sender_role:'admin', message:'Recibimos tu solicitud. El comité está revisando la documentación.', created_at:new Date().toISOString() }
                ];
            }
            this.render();
            if (this.isLocalPreview() || !requestId) return;
            try {
                const client = this.getSolidarityClient();
                const [detail, messages] = await Promise.all([client.getDetail(requestId, this.member.id), client.getMessages(requestId, this.member.id)]);
                this.solidarity.detail = detail.request;
                this.solidarity.messages = Array.isArray(messages) ? messages : (messages.messages || []);
                this.render();
            } catch (error) { this.solidarity.error = error.message; this.render(); }
        }

        formatMoneyV2(value) { return `$${Number(value || 0).toLocaleString('es-MX')}`; }

        renderV2ReimbursementsView() {
            if (this.solidarity.loading) return '<div class="pata-v2-empty">Cargando tus reintegros…</div>';
            const labels = { medical_emergency:'Gastos veterinarios', annual_vaccination:'Vacunas', death:'Fallecimiento' };
            const icons = {
                medical_emergency:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5h16v8H4zM7 7h10v3.5H7zM10 4h4v3"/><path d="M8 14h2m-1-1v2m6-1h2"/></svg>',
                death:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20V9l5-5 5 5v11M5 20h14M10 13h4v7"/></svg>',
                annual_vaccination:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 18 9-9m-6 0 6 6m-8 1-2 2 1 1 2-2m5-10 2-2 4 4-2 2M14 4l6 6"/></svg>'
            };
            const year = new Date().getFullYear();
            const balances = ['medical_emergency','death','annual_vaccination'].map(key => {
                const b = this.solidarity.balances[key] || { limit:0, used:0, available:0 };
                const usedPercentage = Number(b.limit) > 0 ? Math.min(100, Math.max(0, Number(b.used) / Number(b.limit) * 100)) : 0;
                return `<article class="pata-v2-balance-card"><div class="pata-v2-balance-head"><span class="pata-v2-balance-label"><i>${icons[key]}</i>${labels[key].toUpperCase()}</span><span>${year}</span></div><div class="pata-v2-balance-amount"><strong>${this.formatMoneyV2(b.available)}</strong><span>disponibles</span></div><div class="pata-v2-balance-track" role="progressbar" aria-label="Saldo utilizado de ${labels[key]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(usedPercentage)}"><span style="width:${usedPercentage}%"></span></div><p>Usaste ${this.formatMoneyV2(b.used)} de ${this.formatMoneyV2(b.limit)} MXN — tu saldo se renueva en enero.</p></article>`;
            }).join('');
            const rows = this.solidarity.requests.map(r => `<button class="pata-v2-request-row" type="button" onclick="window.pataWidget.showReimbursementDetailV2('${this.escapeHtml(String(r.id))}')"><strong>${this.escapeHtml(r.request_number || r.folio || 'Solicitud')}</strong><span>${this.escapeHtml(r.pet?.name || r.pets?.name || 'Mascota')} · ${labels[r.benefit_type] || r.benefit_type}</span><b>${this.formatMoneyV2(r.requested_amount)}</b><span class="pata-v2-chip">${this.escapeHtml((r.status || 'new').replaceAll('_',' ').toUpperCase())}</span></button>`).join('');
            return `<section class="pata-v2-reimbursements"><header class="pata-v2-page-head"><div><h1 class="pata-v2-title">Reintegros</h1><p class="pata-v2-subtitle">Consulta tu disponible del Fondo Solidario y el seguimiento de tus solicitudes.</p></div><button class="pata-v2-add-button" type="button" onclick="window.pataWidget.showNewReimbursementV2()">+ Nueva solicitud</button></header>${this.solidarity.error ? `<div class="pata-v2-error">${this.escapeHtml(this.solidarity.error)}</div>` : ''}<div class="pata-v2-balance-grid">${balances}</div><div><h2 class="pata-v2-section-title">Mis solicitudes</h2><div class="pata-v2-request-list">${rows || '<div class="pata-v2-empty">Aún no tienes solicitudes.</div>'}</div></div></section>`;
        }

        isPetEligibleForReimbursementV2(pet) {
            return pet.is_active !== false
                && this.getV2Status(pet).key === 'approved'
                && !this.calculateCarencia(pet).isWaiting;
        }

        renderV2NewReimbursementView() {
            const eligible = this.pets.filter(pet => this.isPetEligibleForReimbursementV2(pet));
            const categoryData = [
                { key:'medical_emergency', title:'GASTOS VETERINARIOS', note:'Urgencias, análisis, estudios, cirugía y hospitalización' },
                { key:'death', title:'FALLECIMIENTO', note:'Gastos funerarios de tu peludo' },
                { key:'annual_vaccination', title:'VACUNAS', note:'Esquema de vacunación al día' }
            ];
            const initialCategory = categoryData.find(item => Number(this.solidarity.balances[item.key]?.available) > 0)?.key || 'medical_emergency';
            const supportCards = categoryData.map(item => {
                const balance = this.solidarity.balances[item.key] || { available:0, limit:0 };
                return `<button class="pata-v2-support-card ${item.key === initialCategory ? 'is-selected' : ''}" type="button" data-benefit-type="${item.key}"><span>${item.title}</span><strong>${this.formatMoneyV2(balance.available)} disp.</strong><p>${item.note}</p><small>Tope anual ${this.formatMoneyV2(balance.limit)} MXN</small></button>`;
            }).join('');
            let petCards = this.pets.map(pet => {
                const isEligible = eligible.some(item => String(item.id) === String(pet.id));
                const isSelected = String(eligible[0]?.id) === String(pet.id);
                const carencia = this.calculateCarencia(pet);
                const petStatus = this.getV2Status(pet);
                let status = 'no disponible';
                if (isEligible) status = 'disponible';
                else if (pet.is_active === false) status = 'dada de baja';
                else if (petStatus.key !== 'approved') status = (petStatus.label || status).toLowerCase();
                else if (carencia.isWaiting) status = `Faltan ${carencia.daysRemaining} días`;
                return `<button class="pata-v2-pet-option ${isSelected ? 'is-selected' : ''}" type="button" data-pet-id="${this.escapeHtml(String(pet.id || ''))}" ${isEligible ? '' : 'disabled'}><span class="pata-v2-pet-option-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 10.5c-1.7 0-3-1.5-3-3.3S6.4 4 7.8 4s2.4 1.6 2.4 3.4m5.3 3.1c1.7 0 3-1.5 3-3.3S17.6 4 16.2 4s-2.4 1.6-2.4 3.4M12 9c-3 0-5.5 2.8-5.5 6 0 2.8 2.1 5 5.5 5s5.5-2.2 5.5-5c0-3.2-2.5-6-5.5-6Z"/></svg></span><span>${this.escapeHtml(pet.name || 'Mascota')} · ${this.escapeHtml(status)}</span></button>`;
            }).join('');
            const submitDisabled = eligible.length ? '' : 'disabled';
            const noEligibleNotice = submitDisabled ? '<p class="pata-v2-error">No tienes mascotas con el tiempo de espera completado.</p>' : '';
            petCards = `${petCards || '<p class="pata-v2-empty">No hay mascotas disponibles.</p>'}${noEligibleNotice}`;
            const documents = [
                { type:'invoice', categories:'medical_emergency annual_vaccination', title:'Comprobante de gastos', note:'JPG, PNG o PDF' },
                { type:'medical_report', categories:'medical_emergency', title:'Informe o indicaciones médicas', note:'JPG, PNG o PDF' },
                { type:'vaccination_card', categories:'annual_vaccination', title:'Cartilla o certificado de vacunación', note:'JPG, PNG o PDF' },
                { type:'pet_photo', categories:'death', title:'Una foto hermosa de tu peludito', note:'JPG, PNG o PDF' },
                { type:'death_certificate', categories:'death', title:'Certificado de defunción o informe médico', note:'JPG, PNG o PDF' },
                { type:'funeral_expense_receipt', categories:'death', title:'Comprobante de gastos funerarios', note:'JPG, PNG o PDF' }
            ].map(doc => `<label class="pata-v2-document-card" data-document-type="${doc.type}" data-categories="${doc.categories}"><input type="file" accept="image/*,.pdf" data-doc-input="${doc.type}"><span class="pata-v2-document-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v5h4M9.5 12h6M9.5 15h6M9.5 18h4"/></svg></span><strong>${doc.title}</strong><small data-file-label>${doc.note}</small></label>`).join('');
            const bankOptions = CLABE_BANK_OPTIONS.map(bank => `<option value="${this.escapeHtml(bank)}">${this.escapeHtml(bank)}</option>`).join('');
            return `<section class="pata-v2-reimbursements"><button class="pata-v2-back" type="button" onclick="window.pataWidget.showReimbursementsV2()">← Volver a reintegros</button><header><h1 class="pata-v2-title">Solicita tu reintegro</h1><p class="pata-v2-subtitle">Acude a tu veterinario de confianza, envíanos tus comprobantes y daremos seguimiento a tu solicitud.</p></header><div class="pata-v2-support-options">${supportCards}</div><form id="pata-v2-reimbursement-form" class="pata-v2-form-card"><input type="hidden" name="benefitType" value="${initialCategory}"><input type="hidden" name="petId" value="${this.escapeHtml(String(eligible[0]?.id || ''))}"><input type="hidden" name="requestType" value="reimbursement"><div class="pata-v2-form-group"><span class="pata-v2-form-label">¿Para quién es el reintegro?</span><div class="pata-v2-pet-options">${petCards || '<p class="pata-v2-empty">No hay mascotas disponibles.</p>'}</div></div><div class="pata-v2-field-grid"><label class="pata-v2-field">Monto del apoyo solicitado<input name="requestedAmount" type="number" min="1" required placeholder="$ Monto en MXN"></label><label class="pata-v2-field">¿Cuánto pagaste en total? <small>(opcional)</small><input name="totalPaidAmount" type="number" min="0" placeholder="$ Total de la factura"></label><label class="pata-v2-field">¿En qué fecha ocurrió?<input name="incidentDate" type="date" required></label><label class="pata-v2-field">Nombre del titular de la cuenta<input name="bankHolder" autocomplete="name" required></label></div><label class="pata-v2-field">Cuéntanos qué ocurrió<textarea name="caseDescription" required></textarea></label><div class="pata-v2-form-group"><span class="pata-v2-form-label">Documentos para tu solicitud</span><div class="pata-v2-document-grid">${documents}</div></div><div class="pata-v2-field-grid"><label class="pata-v2-field">Cuenta para tu transferencia (CLABE)<input name="bankClabe" inputmode="numeric" minlength="18" maxlength="18" pattern="[0-9]{18}" required placeholder="18 dígitos"><small class="pata-v2-field-help" data-clabe-help>Escribe los 18 dígitos; sugeriremos el banco.</small></label><label class="pata-v2-field">Banco<select name="bankName" required><option value="">Selecciona tu banco</option>${bankOptions}</select><small class="pata-v2-field-help">Puedes cambiar la sugerencia si es necesario.</small></label></div><div class="pata-v2-notice">El backend validará elegibilidad, carencia y saldo disponible antes de crear la solicitud.</div><div id="pata-v2-reimbursement-error"></div><button class="pata-v2-submit" type="submit">Enviar solicitud</button></form></section>`;
        }

        renderV2ReimbursementDetailView() {
            const r = this.solidarity.detail;
            if (!r) return '<div class="pata-v2-empty">Cargando solicitud…</div>';
            const messages = this.solidarity.messages.map(message => `<div class="pata-v2-chat-message ${message.sender_role === 'user' ? 'is-user' : ''}"><span>${message.sender_role === 'user' ? 'Tú' : 'Equipo Pata Amiga'}</span><p>${this.escapeHtml(message.message || '')}</p></div>`).join('');
            return `<section class="pata-v2-reimbursements"><button class="pata-v2-back" type="button" onclick="window.pataWidget.showReimbursementsV2()">← Volver a reintegros</button><header><h1 class="pata-v2-title">${this.escapeHtml(r.case_title || `Solicitud ${r.request_number || ''}`)}</h1><p class="pata-v2-subtitle">Seguimiento del Fondo Solidario</p></header><div class="pata-v2-detail-grid"><article class="pata-v2-detail-card"><span class="pata-v2-chip">${this.escapeHtml((r.status || 'new').replaceAll('_',' ').toUpperCase())}</span><strong>${this.formatMoneyV2(r.requested_amount)}</strong><p>${this.escapeHtml(r.case_description || 'Tu solicitud está siendo atendida por el comité.')}</p><p>Peludo: <strong>${this.escapeHtml(r.pet?.name || r.pets?.name || 'Mascota')}</strong></p></article><article class="pata-v2-chat-card"><h2 class="pata-v2-section-title">Mensajes</h2><div class="pata-v2-chat-history">${messages || '<p class="pata-v2-empty">Aún no hay mensajes en esta solicitud.</p>'}</div><form id="pata-v2-solidarity-message-form" class="pata-v2-chat-form"><textarea name="message" required placeholder="Escribe un mensaje para el equipo…"></textarea><div id="pata-v2-message-error"></div><button class="pata-v2-submit" type="submit">Enviar mensaje</button></form></article></div></section>`;
        }

        attachV2ReimbursementEvents() {
            const form = document.getElementById('pata-v2-reimbursement-form');
            if (form) {
                const petIdField = form.querySelector('[name="petId"]');
                const submitButton = form.querySelector('.pata-v2-submit');
                if (submitButton) submitButton.disabled = !petIdField?.value;
            }
            const updateDocumentVisibility = (benefitType) => {
                document.querySelectorAll('.pata-v2-document-card').forEach(card => {
                    const visible = (card.dataset.categories || '').split(' ').includes(benefitType);
                    card.hidden = !visible;
                    const input = card.querySelector('input[type="file"]');
                    if (input) input.required = visible;
                });
            };
            if (form) {
                const benefitInput = form.querySelector('input[name="benefitType"]');
                const petInput = form.querySelector('input[name="petId"]');
                document.querySelectorAll('.pata-v2-support-card').forEach(card => {
                    card.onclick = () => {
                        document.querySelectorAll('.pata-v2-support-card').forEach(item => item.classList.remove('is-selected'));
                        card.classList.add('is-selected');
                        benefitInput.value = card.dataset.benefitType;
                        updateDocumentVisibility(benefitInput.value);
                    };
                });
                document.querySelectorAll('.pata-v2-pet-option:not(:disabled)').forEach(card => {
                    card.onclick = () => {
                        document.querySelectorAll('.pata-v2-pet-option').forEach(item => item.classList.remove('is-selected'));
                        card.classList.add('is-selected');
                        petInput.value = card.dataset.petId;
                    };
                });
                document.querySelectorAll('.pata-v2-document-card input[type="file"]').forEach(input => {
                    input.onchange = () => {
                        const label = input.closest('.pata-v2-document-card');
                        const fileLabel = label.querySelector('[data-file-label]');
                        label.classList.toggle('has-file', Boolean(input.files?.length));
                        fileLabel.textContent = input.files?.[0]?.name || 'JPG, PNG o PDF';
                    };
                });
                const clabeInput = form.querySelector('input[name="bankClabe"]');
                const bankSelect = form.querySelector('select[name="bankName"]');
                const clabeHelp = form.querySelector('[data-clabe-help]');
                clabeInput.oninput = () => {
                    clabeInput.value = sanitizeClabeV2(clabeInput.value);
                    const code = clabeInput.value.slice(0, 3);
                    const detectedBank = CLABE_BANK_CODES[code] || '';
                    if (code.length === 3 && clabeInput.dataset.lastDetectedCode !== code) {
                        if (detectedBank) bankSelect.value = detectedBank;
                        clabeInput.dataset.lastDetectedCode = code;
                    }
                    const isComplete = clabeInput.value.length === 18;
                    const isValid = isComplete && isValidClabeV2(clabeInput.value);
                    clabeInput.setCustomValidity(!isComplete ? 'La CLABE debe tener exactamente 18 dígitos.' : (isValid ? '' : 'La CLABE no es válida. Revisa los 18 dígitos.'));
                    clabeHelp.textContent = !isComplete ? `${clabeInput.value.length} de 18 dígitos` : (isValid ? 'CLABE válida.' : 'La CLABE no supera la validación.');
                    clabeHelp.classList.toggle('is-valid', isValid);
                    clabeHelp.classList.toggle('is-error', isComplete && !isValid);
                };
                updateDocumentVisibility(benefitInput.value);
            }
            if (form) form.onsubmit = async (event) => {
                event.preventDefault();
                const submit = form.querySelector('button[type="submit"]');
                const errorBox = document.getElementById('pata-v2-reimbursement-error');
                submit.disabled = true;
                try {
                    const values = Object.fromEntries(new FormData(form).entries());
                    const documents = [];
                    const client = this.getSolidarityClient();
                    for (const input of form.querySelectorAll('.pata-v2-document-card:not([hidden]) input[type="file"]')) {
                        const file = input.files?.[0];
                        if (!file) continue;
                        const docType = input.dataset.docInput;
                        const uploaded = await client.uploadDocument(file, this.member.id, docType);
                        documents.push({ docType, path:uploaded.path, fileName:uploaded.fileName, fileSize:uploaded.fileSize, mimeType:uploaded.mimeType });
                    }
                    await client.createRequest({ ...values, memberstackId:this.member.id, caseTitle:'Solicitud de reintegro', documents });
                    this.solidarity.loaded = false;
                    this.showReimbursementsV2();
                } catch (error) { errorBox.className='pata-v2-error'; errorBox.textContent=error.message; }
                finally { submit.disabled = false; }
            };
            const messageForm = document.getElementById('pata-v2-solidarity-message-form');
            if (messageForm) messageForm.onsubmit = async (event) => {
                event.preventDefault();
                const submit = messageForm.querySelector('button[type="submit"]');
                const errorBox = document.getElementById('pata-v2-message-error');
                const message = new FormData(messageForm).get('message').trim();
                if (!message) return;
                submit.disabled = true;
                try {
                    const requestId = this.solidarity.detail.id;
                    if (this.isLocalPreview()) {
                        this.solidarity.messages.push({ id:`mock-${Date.now()}`, sender_role:'user', message, created_at:new Date().toISOString() });
                    } else {
                        const created = await this.getSolidarityClient().sendMessage(requestId, { message, senderRole:'user', senderId:this.member.id, attachments:[] });
                        this.solidarity.messages.push(created);
                    }
                    this.render();
                } catch (error) { errorBox.className='pata-v2-error'; errorBox.textContent=error.message; submit.disabled = false; }
            };
        }

        showPetsV2() {
            this.v2View = 'pets';
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        showHomeV2() {
            this.v2View = 'home';
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        renderV2Navigation(firstName) {
            const safeName = this.escapeHtml(firstName || 'Mi cuenta');
            const initial = safeName.charAt(0).toUpperCase() || 'P';
            return `
                <aside class="pata-v2-sidebar" aria-label="Navegación de miembros">
                    <a class="pata-v2-logo" href="/" aria-label="Pata Amiga">
                        <img src="${CONFIG.apiUrl}/widgets/home%20v2%20images/logo-light-bg.svg" alt="Pata Amiga">
                    </a>
                    <nav class="pata-v2-nav">
                        <button class="pata-v2-nav-link ${this.v2View === 'home' ? 'is-active' : ''}" type="button" onclick="window.pataWidget.showHomeV2()"><span class="pata-v2-nav-icon">🏠</span>Inicio</button>
                        <button class="pata-v2-nav-link ${this.v2View === 'pets' ? 'is-active' : ''}" type="button" onclick="window.pataWidget.showPetsV2()"><span class="pata-v2-nav-icon">🐾</span>Mis peludos</button>
                        <button class="pata-v2-nav-link ${['reimbursements','newReimbursement','reimbursementDetail'].includes(this.v2View) ? 'is-active' : ''}" type="button" onclick="window.pataWidget.showReimbursementsV2()"><span class="pata-v2-nav-icon">💚</span>Reintegros</button>
                        <a class="pata-v2-nav-link" href="${CONFIG.vetUrl}"><span class="pata-v2-nav-icon">💬</span>Orientación vet 24/7</a>
                        <a class="pata-v2-nav-link" href="${CONFIG.centersUrl}"><span class="pata-v2-nav-icon">📍</span>Centros aliados</a>
                        ${this.isAmbassador ? `<a class="pata-v2-nav-link" href="${CONFIG.ambassadorUrl}"><span class="pata-v2-nav-icon">🤝</span>Panel de embajador</a>` : ''}
                    </nav>
                    <nav class="pata-v2-nav pata-v2-nav-bottom">
                        <a class="pata-v2-nav-link" href="${CONFIG.memberPortalUrl}"><span class="pata-v2-nav-icon">⚙️</span>Mi cuenta</a>
                        ${this.member ? '<button class="pata-v2-nav-link" type="button" onclick="window.pataWidget.logoutV2()"><span class="pata-v2-nav-icon">👋</span>Cerrar sesión</button>' : ''}
                    </nav>
                    <div class="pata-v2-account"><span class="pata-v2-avatar">${initial}</span><span><strong>${safeName}</strong><span>Plan de membresía</span></span></div>
                </aside>
            `;
        }

        async logoutV2() {
            if (!this.member || !window.$memberstackDom) return;
            try {
                await window.$memberstackDom.logout();
                window.location.href = window.PATA_AMIGA_CONFIG?.loginUrl || '/iniciar-sesion';
            } catch (error) {
                console.error('No fue posible cerrar sesión:', error);
            }
        }

        renderDashboardView(firstName) {
            const isMemberApproved = this.membershipStatus === 'active' || this.membershipStatus === 'approved';
            const activePets = this.pets.filter(pet => pet.is_active !== false);
            const availablePet = activePets.find(pet => this.getV2Status(pet).key === 'approved' && !this.calculateCarencia(pet).isWaiting);
            const safeName = this.escapeHtml(firstName || 'amiga');
            const logoUrl = `${CONFIG.apiUrl}/widgets/home%20v2%20images/logo-light-bg.svg`;
            const isPetsView = this.v2View === 'pets';
            const isSolidarityView = ['reimbursements', 'newReimbursement', 'reimbursementDetail'].includes(this.v2View);
            const solidarityContent = this.v2View === 'newReimbursement'
                ? this.renderV2NewReimbursementView()
                : this.v2View === 'reimbursementDetail'
                    ? this.renderV2ReimbursementDetailView()
                    : this.renderV2ReimbursementsView();

            this.container.innerHTML = `
                <div class="pata-v2-shell">
                    ${this.renderV2Navigation(safeName)}
                    <main class="pata-v2-main">
                        <div class="pata-v2-mobile-top">
                            <img src="${logoUrl}" alt="Pata Amiga">
                            <div class="pata-v2-mobile-actions">
                                <a href="${CONFIG.vetUrl}" aria-label="Orientación veterinaria">💬</a>
                                ${this.member ? '<button type="button" onclick="window.pataWidget.logoutV2()" aria-label="Cerrar sesión">👋</button>' : ''}
                            </div>
                        </div>
                        <div class="pata-v2-content">
                            ${isSolidarityView ? solidarityContent : ''}
                            <div style="${isSolidarityView ? 'display:none' : 'display:contents'}">
                            ${isPetsView ? `
                                <header class="pata-v2-pets-page-head">
                                    <div><h1 class="pata-v2-title">Mis peludos</h1><p>${activePets.length} de 3 peludos activos. Consulta sus datos y abre el expediente de cada integrante de tu manada.</p></div>
                                    ${activePets.length < 3 ? `<a class="pata-v2-add-button" href="${CONFIG.addPetUrl}">+ Agregar</a>` : ''}
                                </header>
                            ` : `
                                <header class="pata-v2-header">
                                    <div>
                                        <h1 class="pata-v2-title" data-od-id="dashboard-greeting">¡Hola, ${safeName}!</h1>
                                        <p class="pata-v2-subtitle">${isMemberApproved ? 'Tu manada está protegida. Tu membresía se encuentra activa.' : 'Estamos revisando tu membresía y te notificaremos cualquier actualización.'}</p>
                                    </div>
                                    <div class="pata-v2-header-actions">
                                        <button class="pata-v2-icon-button" type="button" aria-label="Notificaciones">🔔</button>
                                        <a class="pata-v2-vet-button" href="${CONFIG.vetUrl}">💬&nbsp; Orientación veterinaria 24/7</a>
                                    </div>
                                </header>

                                <section class="pata-v2-kpi-grid" aria-label="Resumen de membresía">
                                    <article class="pata-v2-kpi is-primary"><span class="pata-v2-kpi-label">MEMBRESÍA</span><strong class="pata-v2-kpi-value">${isMemberApproved ? 'Activa' : 'En revisión'}</strong><span class="pata-v2-kpi-meta">Tu protección Pata Amiga</span></article>
                                    <article class="pata-v2-kpi"><span class="pata-v2-kpi-label">MIS PELUDOS</span><strong class="pata-v2-kpi-value">${activePets.length} de 3</strong>${activePets.length < 3 ? `<a class="pata-v2-kpi-link" href="${CONFIG.addPetUrl}">+ Registrar otro peludo</a>` : '<span class="pata-v2-kpi-meta">Tu manada está completa</span>'}</article>
                                    <article class="pata-v2-kpi"><span class="pata-v2-kpi-label">REINTEGROS</span><strong class="pata-v2-kpi-value">${availablePet ? `Disponible para ${this.escapeHtml(availablePet.name)}` : 'En espera'}</strong>${availablePet ? `<button class="pata-v2-kpi-link pata-v2-back" type="button" onclick="window.pataWidget.showReimbursementsV2()">Iniciar solicitud →</button>` : '<span class="pata-v2-kpi-meta">Al completar el período de espera</span>'}</article>
                                </section>
                            `}

                            <section class="pata-v2-section" id="pata-v2-pets">
                                ${isPetsView ? '' : `<div class="pata-v2-section-head"><h2 class="pata-v2-section-title">Mis peludos</h2><button class="pata-v2-section-link" type="button" onclick="window.pataWidget.showPetsV2()">Ver todos →</button></div>`}
                                <div class="pata-v2-pet-grid">${this.renderV2PetCards()}</div>
                            </section>

                            ${isPetsView ? '' : `<section class="pata-v2-lower-grid">
                                <article class="pata-v2-activity"><h2 class="pata-v2-section-title">Actividad reciente</h2><div class="pata-v2-activity-list">${this.renderV2Activity()}</div></article>
                                <article class="pata-v2-centers"><h2 class="pata-v2-section-title">Centros aliados cerca de ti</h2><p>Veterinarias, tiendas y hoteles con beneficios para miembros en todo México.</p><a class="pata-v2-centers-link" href="${CONFIG.centersUrl}">Explorar el directorio</a></article>
                            </section>`}
                            </div>
                        </div>
                    </main>
                </div>
            `;

            this.container.classList.add('show');
            this.attachEvents();
            this.attachV2ReimbursementEvents();
            this.hideGlobalLoaders();
            if (this.v2View === 'reimbursements' && !this.solidarity.loaded && !this.solidarity.loading) {
                setTimeout(() => this.showReimbursementsV2(), 0);
            }
        }

        renderPendingView(firstName, pet) {
            this.container.innerHTML = `
                <div class="pata-pending-wrapper">
                    <main class="pata-pending-container">
                        <header class="pata-pending-header">
                            <h1 style="color: white !important;">¡hola, ${firstName}!</h1>
                            <div class="pata-pending-header-sub">
                                <p><strong>Mientras revisamos tu registro...</strong></p>
                                <p>Recibimos tu solicitud y ya estamos revisando la información para poder continuar con tu proceso. Mientras tanto, puedes entrar aquí cuando quieras para ver tu estatus actualizado.</p>
                            </div>
                        </header>

                        <section class="pata-pending-card">
                            <div class="pata-pending-card-header">
                                <h2 class="pata-pending-card-title">solicitud en revisión</h2>
                                <p class="pata-pending-card-intro">Nuestro equipo la está revisando con calma y cuidado (así como cuidamos a cada miembro de la manada).</p>
                            </div>

                            <div class="pata-pending-progress-section">
                                <div class="pata-pending-progress-labels">
                                    <span>Solicitud enviada</span>
                                    <span>En revisión...</span>
                                </div>
                                <div class="pata-pending-progress-bar-container">
                                    <div class="pata-pending-progress-bar-fill" id="pataProgressBar" style="width: 0%;"></div>
                                </div>
                            </div>

                            <div class="pata-pending-checklist-section">
                                <h3 class="pata-pending-checklist-title">¿Qué estamos revisando?</h3>
                                <ul class="pata-pending-checklist">
                                    <li class="pata-pending-checklist-item">
                                        <div class="pata-pending-check-box"></div>
                                        <span>Información de tu mascota</span>
                                    </li>
                                    <li class="pata-pending-checklist-item">
                                        <div class="pata-pending-check-box"></div>
                                        <span>Documentación enviada</span>
                                    </li>
                                    <li class="pata-pending-checklist-item">
                                        <div class="pata-pending-check-box"></div>
                                        <span>Datos de contacto</span>
                                    </li>
                                </ul>
                            </div>

                            <p class="pata-pending-card-footer-note" style="text-align: center; margin-top: 10px;">
                                No se hará ningún cargo definitivo hasta que tu solicitud sea aprobada.
                            </p>

                            ${this.renderInReviewBenefits()}

                            <div class="pata-pending-control-badge">
                                <p class="pata-pending-control-title">🛡️ Control total de tu cuenta</p>
                                <p class="pata-pending-control-text">Recuerda que puedes cancelar tu membresía en cualquier momento desde tu panel sin complicaciones.</p>
                            </div>
                        </section>
                    </main>
                </div>
            `;

            this.container.classList.add('show');

            // Animate progress bar
            setTimeout(() => {
                const bar = document.getElementById('pataProgressBar');
                if (bar) bar.style.width = '85%';
            }, 100);

            this.hideGlobalLoaders();
        }


        renderUserPendingView(firstName) {
            return `
                <main class="pata-pending-container">
                        <header class="pata-pending-header">
                            <h1>¡hola, ${firstName}!</h1>
                            <div class="pata-pending-header-sub">
                                <p>Gracias por tu paciencia</p>
                                <p>En un máximo de 24-48 horas te notificaremos el resultado. Mientras tanto, puedes entrar aquí cuando quieras para ver tu estatus actualizado.</p>
                            </div>
                        </header>

                        <section class="pata-pending-card">
                            <div class="pata-pending-card-header">
                                <h2 class="pata-pending-card-title">mientras revisamos tu registro</h2>
                                <p class="pata-pending-card-intro">Recuerda que puedes cancelar tu membresía en cualquier momento desde tu panel sin complicaciones.</p>
                            </div>

                            <div class="pata-pending-progress-section">
                                <div class="pata-pending-progress-labels">
                                    <span>Solicitud enviada</span>
                                    <span>En revisión...</span>
                                </div>
                                <div class="pata-pending-progress-bar-container">
                                    <div class="pata-pending-progress-bar-fill" id="pataProgressBar" style="width: 65%;"></div>
                                </div>
                            </div>

                            <div class="pata-badge" style="margin-top: 30px; background: #CAF5F2; border: 2px solid #000; border-radius: 20px; padding: 20px; display: flex; gap: 15px; align-items: center;">
                                <div style="font-size: 24px;">🛡️</div>
                                <div style="text-align: left;">
                                    <strong style="display: block; font-family: 'Fraiche', sans-serif; text-transform: lowercase;">control total de tu cuenta</strong>
                                    <p style="margin: 0; font-size: 14px; font-family: 'Outfit', sans-serif;">recuerda que puedes cancelar tu membresía en cualquier momento.</p>
                                </div>
                            </div>

                            <div style="text-align: center; margin-top: 40px;">
                                <a href="https://pataamiga.mx/pets/pet-waiting-period#beneficios" class="pata-pending-btn-main">Conocer más de pata amiga</a>
                            </div>
                        </section>
                    </main>
                </div>
            `;
        }

        // 🔴 NUEVO: Vista cuando no ha pagado
        renderPaymentRequiredView(firstName) {
            return `
                <div class="pata-approved-wrapper-new">
                    <main class="pata-container-new">
                        <header class="pata-header-new">
                            <h1 data-od-id="dashboard-greeting">¡hola, ${firstName}!</h1>
                            <div class="pata-header-sub-new">
                                <p>Estás a un paso de unirte a la manada.</p>
                            </div>
                        </header>

                        <section class="pata-card-new">
                            <div class="pata-member-pending-view-new" style="text-align: center;">
                                <div style="font-size: 80px; margin-bottom: 20px;">💳</div>
                                <h2 class="pata-member-pending-title-new" style="text-align: center;">completa tu membresía</h2>
                                <p class="pata-member-pending-subtitle-new" style="text-align: center; max-width: 600px; margin-left: auto; margin-right: auto;">
                                    Vimos que aún no has completado el pago de tu membresía. 
                                    Selecciona un plan para activar todos los beneficios de la manada.
                                </p>

                                <div style="margin-top: 40px; margin-bottom: 50px;">
                                    <button
                                        id="pata-select-plan-btn"
                                        class="pata-btn"
                                        style="background: #FE8F15; color: #000; border: 3px solid #000; padding: 20px 60px; font-size: 20px; font-weight: 900; border-radius: 50px; cursor: pointer; font-family: 'Fraiche', sans-serif; box-shadow: 6px 6px 0 #000; text-transform: lowercase;"
                                        onclick="(function(btn) {
                                            btn.disabled = true;
                                            btn.textContent = 'preparando...';

                                            var member = null;
                                            try {
                                                if (window.pataWidget && window.pataWidget.member) {
                                                    member = window.pataWidget.member;
                                                }
                                            } catch(e) {}

                                            function fallback(email) {
                                                var url = 'https://app.pataamiga.mx/registro?reason=complete_payment';
                                                if (email) url += '&email=' + encodeURIComponent(email);
                                                window.location.href = url;
                                            }

                                            function generateAndRedirect(memberId, email, customFields) {
                                                fetch('https://app.pataamiga.mx/api/auth/magic-token', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        memberstackId: memberId,
                                                        email: email,
                                                        customFields: customFields || {}
                                                    })
                                                })
                                                .then(function(res) { return res.json(); })
                                                .then(function(data) {
                                                    if (data.success && data.token) {
                                                        var url = 'https://app.pataamiga.mx/registro'
                                                            + '?mt=' + encodeURIComponent(data.token)
                                                            + '&reason=complete_payment';
                                                        window.location.href = url;
                                                    } else {
                                                        fallback(email);
                                                    }
                                                })
                                                .catch(function(err) {
                                                    fallback(email);
                                                });
                                            }

                                            if (member && member.id) {
                                                var email = (member.auth && member.auth.email) ? member.auth.email : '';
                                                var cf = member.customFields || {};
                                                generateAndRedirect(member.id, email, {
                                                    'registration-step': cf['registration-step'] || '',
                                                    'payment-status': cf['payment-status'] || '',
                                                    'checkout-pending': cf['checkout-pending'] || false,
                                                    'approval-status': cf['approval-status'] || ''
                                                });
                                            } else if (window.$memberstackDom) {
                                                window.$memberstackDom.getCurrentMember()
                                                    .then(function(res) {
                                                        var m = res && res.data ? res.data : null;
                                                        if (m && m.id) {
                                                            var email = (m.auth && m.auth.email) ? m.auth.email : '';
                                                            var cf = m.customFields || {};
                                                            generateAndRedirect(m.id, email, {
                                                                'registration-step': cf['registration-step'] || '',
                                                                'payment-status': cf['payment-status'] || '',
                                                                'checkout-pending': cf['checkout-pending'] || false,
                                                                'approval-status': cf['approval-status'] || ''
                                                            });
                                                        } else {
                                                            fallback('');
                                                        }
                                                    })
                                                    .catch(function() { fallback(''); });
                                            } else {
                                                fallback('');
                                            }
                                        })(this)"
                                    >
                                        seleccionar plan →
                                    </button>
                                </div>

                                <div class="pata-badge-brutalist" style="max-width: 500px; margin: 0 auto;">
                                    <div style="font-size: 32px;">🛡️</div>
                                    <div style="text-align: left;">
                                        <strong class="pata-badge-title-brutalist">membresía flexible</strong>
                                        <p class="pata-badge-text-brutalist">Recuerda que tienes el control total: cancela en cualquier momento si lo necesitas.</p>
                                    </div>
                                </div>
                                
                                <p style="font-family: 'Outfit', sans-serif; font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                                    ¿Tienes problemas? Escríbenos a <a href="mailto:miembros@pataamiga.mx" style="color: #00BBB4; text-decoration: underline;">miembros@pataamiga.mx</a>
                                </p>
                            </div>
                        </section>
                    </main>
                </div>
            `;
        }

        // ⏳ NUEVO: Vista cuando el pago está en proceso
        renderPaymentProcessingView(firstName) {
            return `
                <div class="pata-approved-wrapper-new">
                    <main class="pata-container-new">
                        <header class="pata-header-new">
                            <h1 data-od-id="dashboard-greeting">¡hola, ${firstName}!</h1>
                            <div class="pata-header-sub-new">
                                <p>Casi terminamos...</p>
                            </div>
                        </header>

                        <section class="pata-card-new">
                            <div class="pata-member-pending-view-new" style="text-align: center; padding: 60px 0;">
                                <div style="font-size: 80px; margin-bottom: 30px; animation: pata-pulse 1.5s infinite; display: inline-block;">⏳</div>
                                <h2 class="pata-member-pending-title-new" style="text-align: center;">procesando tu pago</h2>
                                <p class="pata-member-pending-subtitle-new" style="text-align: center; max-width: 600px; margin-left: auto; margin-right: auto;">
                                    Estamos confirmando tu transacción con el banco. 
                                    Esto solo tomará unos segundos. ¡No cierres esta ventana!
                                </p>
                                
                                <div class="pata-action-required-progress-container" style="max-width: 400px; margin: 40px auto;">
                                    <div class="pata-action-required-progress-track">
                                        <div class="pata-action-required-progress-fill" style="width: 50%; background: #FE8F15; border-radius: 10px;"></div>
                                    </div>
                                </div>

                                <p style="font-family: 'Outfit', sans-serif; font-size: 14px; color: #666; text-align: center;">
                                    Se verificará automáticamente en unos segundos...
                                </p>
                            </div>
                        </section>
                    </main>
                </div>
            `;
        }

        // 🏁 NUEVO: Vista cuando ya pagó pero no ha terminado su registro (0 mascotas)
        renderCompleteRegistrationView(firstName) {
            return `
                <div class="pata-approved-wrapper-new">
                    <main class="pata-container-new">
                        <header class="pata-header-new">
                            <h1 data-od-id="dashboard-greeting">¡hola de nuevo, ${firstName}! 👋</h1>
                            <div class="pata-header-sub-new">
                                <p>¡Ya casi eres parte de la manada! 🎉</p>
                            </div>
                        </header>

                        <section class="pata-card-new">
                            <div class="pata-member-pending-view-new" style="text-align: center;">
                                <div style="font-size: 80px; margin-bottom: 20px;">🐶</div>
                                <h2 class="pata-member-pending-title-new" style="text-align: center;">termina tu registro</h2>
                                <p class="pata-member-pending-subtitle-new" style="text-align: center; max-width: 600px; margin-left: auto; margin-right: auto;">
                                    Para activar todos tus beneficios y el respaldo veterinario, 
                                    necesitamos conocer un poco más de ti y de tus amigos de cuatro patas.
                                </p>

                                <div style="margin-top: 40px; margin-bottom: 50px;">
                                    <a href="https://app.pataamiga.mx/registro?reason=finish_onboarding" 
                                       class="pata-btn" 
                                       style="background: #00BBB4; color: #000; border: 3px solid #000; padding: 20px 60px; font-size: 20px; font-weight: 900; border-radius: 50px; cursor: pointer; font-family: 'Fraiche', sans-serif; box-shadow: 6px 6px 0 #000; text-decoration: none; display: inline-block; text-transform: lowercase;">
                                        completar mi registro →
                                    </a>
                                </div>

                                <div class="pata-badge-brutalist" style="max-width: 500px; margin: 0 auto;">
                                    <div style="font-size: 32px;">🛡️</div>
                                    <div style="text-align: left;">
                                        <strong class="pata-badge-title-brutalist">membresía flexible</strong>
                                        <p class="pata-badge-text-brutalist">Recuerda que tienes el control total: cancela en cualquier momento si lo necesitas.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            `;
        }

        // ❌ NUEVO: Vista cuando la membresía está cancelada
        renderCanceledView(firstName, canceledAt) {
            let dateStr = 'recientemente';
            if (canceledAt) {
                try {
                    const date = new Date(canceledAt);
                    dateStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
                } catch (e) { }
            }

            return `
                <div class="pata-approved-wrapper-new">
                    <main class="pata-container-new">
                        <header class="pata-header-new">
                            <h1 data-od-id="dashboard-greeting">¡hola, ${firstName}!</h1>
                            <div class="pata-header-sub-new">
                                <p>bienvenid@ de vuelta a la manada.</p>
                            </div>
                        </header>

                        <section class="pata-card-new">
                            <div class="pata-member-pending-view-new" style="text-align: center;">
                                <div style="font-size: 80px; margin-bottom: 20px;">👋</div>
                                <h2 class="pata-member-pending-title-new" style="text-align: center;">tu membresía finalizó</h2>
                                <p class="pata-member-pending-subtitle-new" style="text-align: center; max-width: 600px; margin-left: auto; margin-right: auto;">
                                    Tu membresía de Club Pata Amiga terminó el pasado <strong>${dateStr}</strong>. 
                                    Renuévala ahora para seguir protegiendo a tus mejores amigos.
                                </p>

                                <div style="margin-top: 40px; margin-bottom: 50px;">
                                    <a href="https://www.pataamiga.mx/miembros/seleccion-plan" 
                                       class="pata-btn" 
                                       style="background: #FE8F15; color: #000; border: 3px solid #000; padding: 20px 60px; font-size: 20px; font-weight: 900; border-radius: 50px; cursor: pointer; font-family: 'Fraiche', sans-serif; box-shadow: 6px 6px 0 #000; text-decoration: none; display: inline-block; text-transform: lowercase;">
                                        renovar ahora →
                                    </a>
                                </div>

                                <!-- Se oculta temporalmente el recuadro de facturas -->
                                <!--
                                <div class="pata-badge-brutalist" style="max-width: 500px; margin: 0 auto;">
                                    <div style="font-size: 32px;">🛠️</div>
                                    <div style="text-align: left;">
                                        <strong class="pata-badge-title-brutalist">¿quieres ver tus facturas?</strong>
                                        <p class="pata-badge-text-brutalist">
                                            Puedes acceder a tu historial de pagos desde el 
                                            <a href="#" data-ms-action="customer-portal" style="color: #000; font-weight: 900; text-decoration: underline;">portal de gestión</a>.
                                        </p>
                                    </div>
                                </div>
                                -->
                                
                                <p style="font-family: 'Outfit', sans-serif; font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                                    ¿Dudas con tu renovación? <a href="mailto:miembros@pataamiga.mx" style="color: #00BBB4; text-decoration: underline;">Escríbenos</a>
                                </p>
                            </div>
                        </section>
                    </main>
                </div>
            `;
        }

        renderInReviewBenefits(title = "Mientras revisamos tu registro...") {
            return `
                <div class="pata-benefits-review">
                    <h3 class="pata-benefits-title">
                        <span>✨</span> ${title}
                    </h3>
                    
                    <div class="pata-benefits-grid">
                        <div class="pata-benefit-card">
                            <div class="pata-benefit-icon-box">🩺</div>
                            <div class="pata-benefit-info">
                                <h4>Chat Dra. PATI</h4>
                                <p>¡No tienes que esperar! Aclara dudas sobre la salud de tus peludos ahora mismo.</p>
                                <div class="pata-pati-message">
                                    A partir de ahora cuentas con acceso al chat con la Dra. PATI para cualquier duda sobre su salud, comportamiento o cuidados del día a día.
                                </div>
                            </div>
                        </div>
        
                        <div class="pata-benefit-card">
                            <div class="pata-benefit-icon-box">🤝</div>
                            <div class="pata-benefit-info">
                                <h4>Impacto Social</h4>
                                <p>Por cada 1,000 miembros, la manada apoya a quienes más lo necesitan. Juntos protegemos más</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 🛡️ NUEVO: Ocultar cualquier loader global de Webflow
        hideGlobalLoaders() {
            console.log('🛡️ Unified Widget: hideGlobalLoaders called');
            const loaders = document.querySelectorAll('.loading-screen, [data-loader], #pata-auth-overlay, #login-redirect-message');
            loaders.forEach(loader => {
                loader.style.opacity = '0';
                loader.style.pointerEvents = 'none'; // Desactivar interacción inmediatamente
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 400);

                // Fallback agresivo: display none después de 500ms sin transiciones if it's still there
                setTimeout(() => {
                    if (loader.style.display !== 'none') loader.style.display = 'none';
                }, 600);
            });
        }

        renderAlertBanners(pet) {
            const isSeniorPet = this.isSenior(pet);
            const hasPhoto1 = !!(pet.photo_url || pet.primary_photo_url || pet.pet_photo_url);
            const hasCert = !!pet.vet_certificate_url;
            
            // Definimos si necesita acción basándonos en la foto o el certificado (si es senior)
            const needsAction = !hasPhoto1 || (isSeniorPet && !hasCert);

            if (!needsAction) return '';

            let alertsHtml = '';
            if (!hasPhoto1) {
                alertsHtml += `
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: #000;">photo_camera</span>
                        <span style="font-size: 14px; font-weight: 700; color: #000;">Falta la foto principal de su álbum.</span>
                    </div>`;
            }
            if (isSeniorPet && !hasCert) {
                alertsHtml += `
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: #000;">medical_services</span>
                        <span style="font-size: 14px; font-weight: 700; color: #000;">Falta el certificado médico (Requerido para Senior).</span>
                    </div>`;
            }

            return `
                <div class="pata-orange-alert" style="display: block; padding: 20px; background: #FFBD12; border: 3px solid #000; border-radius: 30px; box-shadow: 6px 6px 0 rgba(0,0,0,1); margin-bottom: 25px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 10px;">
                        <span class="material-symbols-outlined" style="font-size: 24px; color: #000; font-weight: 900;">priority_high</span>
                        <p style="margin: 0; font-weight: 950; font-size: 18px; text-transform: lowercase; font-family: 'Fraiche', sans-serif; color: #000;">acción requerida</p>
                    </div>
                    
                    <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 4px;">
                        ${alertsHtml}
                    </div>

                    <button id="pata-btn-open-update-cert" style="width: 100%; background: #000; color: #fff; border: 2px solid #000; border-radius: 50px; padding: 14px; font-weight: 900; font-family: 'Outfit', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.2s; font-size: 15px; text-transform: lowercase;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">upload_file</span>
                        subir documentos ahora
                    </button>
                </div>
            `;
        }

        renderPetContent(pet) {
            let content = '';
            if (pet.is_active === false) {
                return this.renderUnsubscribedContent(pet);
            }

            // Si falta el certificado y no estamos ya en acción requerida prevemos banner
            if (pet.status !== 'action_required') {
                content += this.renderAlertBanners(pet);
            }

            if (pet.status === 'approved') {
                return content + this.renderApprovedContent(pet);
            } else if (pet.status === 'rejected') {
                return content + this.renderRejectedContent(pet);
            } else if (pet.status === 'action_required') {
                return content + this.renderActionRequiredContent(pet);
            } else if (pet.status === 'appealed') {
                return content + this.renderAppealedContent(pet);
            } else {
                return content + this.renderPendingContent(pet);
            }
        }

        renderUnsubscribedContent(pet) {
            const petPhoto = pet.photo_url || pet.primary_photo_url || pet.pet_photo_url || 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';
            const reason = this.escapeHtml(pet.unsubscribed_reason || pet.admin_notes || 'Baja registrada');
            const description = pet.unsubscribed_description ? this.escapeHtml(pet.unsubscribed_description) : '';
            const unsubscribedDate = pet.unsubscribed_at ? new Date(pet.unsubscribed_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'Fecha no disponible';

            return `
                <div class="pata-unsubscribed-view-new" style="padding: 0;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:32px; align-items:stretch;">
                        <div style="background:#F1F3F4; border:var(--pata-border-thick); border-radius:38px; padding:14px; box-shadow:10px 10px 0 rgba(0,0,0,0.06);">
                            <div style="position:relative; aspect-ratio:1; border-radius:28px; overflow:hidden; border:var(--pata-border-thin); background:#fff;">
                                <img src="${petPhoto}" alt="${pet.name}" class="pata-grayscale" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                                <div style="position:absolute; top:16px; left:16px; background:#fff; color:#3D494D; border:var(--pata-border-thin); border-radius:50px; padding:8px 16px; font-size:11px; font-weight:950; text-transform:uppercase; box-shadow:4px 4px 0 rgba(0,0,0,0.08);">
                                    DADA DE BAJA
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; flex-direction:column; justify-content:center;">
                            <span style="width:max-content; background:#CAF5F2; border:var(--pata-border-thin); border-radius:50px; padding:8px 16px; font-size:11px; font-weight:950; text-transform:uppercase; color:#000; margin-bottom:18px;">espacio liberado</span>
                            <h2 class="pata-title" style="margin:0 0 14px 0; font-size:40px; color:#000; text-transform:lowercase; font-family:'Fraiche', sans-serif;">${pet.name} fue dado de baja</h2>
                            <p style="font-size:18px; color:#000; line-height:1.45; font-family:'Outfit', sans-serif; font-weight:700; margin:0 0 24px 0;">
                                Esta mascota ya no forma parte activa de tu manada. Conservamos este registro para que tengas claridad sobre el historial.
                            </p>

                            <div style="background:#fff; border:var(--pata-border-thick); border-radius:30px; padding:24px; box-shadow:8px 8px 0 rgba(0,0,0,0.05); display:grid; gap:18px;">
                                <div>
                                    <div style="font-size:11px; font-weight:950; text-transform:uppercase; color:#667085; margin-bottom:6px;">causa de baja</div>
                                    <div style="font-size:20px; font-weight:950; color:#000; font-family:'Fraiche', sans-serif; text-transform:lowercase;">${reason}</div>
                                    ${description ? `<p style="font-size:14px; font-weight:700; color:#3D494D; margin:8px 0 0 0; line-height:1.45;">${description}</p>` : ''}
                                </div>
                                <div>
                                    <div style="font-size:11px; font-weight:950; text-transform:uppercase; color:#667085; margin-bottom:6px;">fecha registrada</div>
                                    <div style="font-size:16px; font-weight:900; color:#000; font-family:'Outfit', sans-serif;">${unsubscribedDate}</div>
                                </div>
                            </div>

                            <div style="margin-top:22px; background:#FFBD12; border:var(--pata-border-thin); border-radius:24px; padding:18px 20px; font-size:15px; font-weight:900; color:#000; line-height:1.4;">
                                Ya puedes registrar a otro peludito desde tu widget de manada si tienes menos de 3 mascotas activas.
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderPendingContent(pet) {
            return `
                <div class="pata-pending-view" style="padding: 0;">
                    <div style="text-align: left; margin-bottom: 30px;">
                        <h2 class="pata-title" style="margin-bottom: 12px; font-size: 40px; color: #000; text-transform: lowercase; font-family: 'Fraiche', sans-serif;">tu solicitud está en revisión</h2>
                        <p style="font-size: 18px; color: #000; line-height: 1.4; font-family: 'Outfit', sans-serif;">
                            Nuestro equipo la está revisando con calma y cuidado (así como cuidamos a cada miembro de la manada).
                        </p>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #666; margin-bottom: 10px;">
                            <span>Solicitud enviada</span>
                            <span>En revisión...</span>
                        </div>
                        <div style="height: 12px; background: #eee; border: 2px solid #000; border-radius: 50px; overflow: hidden;">
                            <div style="width: 70%; height: 100%; background: #15BEB2; border-right: 2px solid #000;"></div>
                        </div>
                    </div>

                    <div style="margin-bottom: 40px;">
                        <h3 style="font-family: 'Fraiche', sans-serif; font-size: 24px; margin-bottom: 20px; color: #000; text-transform: lowercase;">¿Qué estamos revisando?</h3>
                        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 15px;">
                            <li style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 24px; height: 24px; background: #15BEB2; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #000; flex-shrink: 0;">
                                    <span style="color: white; font-size: 12px;">✓</span>
                                </div>
                                <span style="font-weight: 700; color: #000; font-family: 'Outfit', sans-serif;">Información de tu mascota</span>
                            </li>
                            <li style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 24px; height: 24px; background: #15BEB2; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #000; flex-shrink: 0;">
                                    <span style="color: white; font-size: 12px;">✓</span>
                                </div>
                                <span style="font-weight: 700; color: #000; font-family: 'Outfit', sans-serif;">Documentación enviada</span>
                            </li>
                            <li style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 24px; height: 24px; background: #15BEB2; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #000; flex-shrink: 0;">
                                    <span style="color: white; font-size: 12px;">✓</span>
                                </div>
                                <span style="font-weight: 700; color: #000; font-family: 'Outfit', sans-serif;">Datos de contacto</span>
                            </li>
                        </ul>
                    </div>

                    <p style="text-align: center; margin-bottom: 30px; font-size: 13px; color: #888; font-family: 'Outfit', sans-serif; font-style: italic;">
                        No se hará ningún cargo definitivo hasta que tu solicitud sea aprobada.
                    </p>

                    ${this.renderInReviewBenefits("mientras revisamos tu registro...")}
                </div>
            `;
        }


        // 🆕 Renderizar contenido para mascotas con apelación en revisión
        renderAppealedContent(pet) {
            const appealDate = pet.appealed_at ? new Date(pet.appealed_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Reciente';

            return `
                <div class="pata-appealed-view" style="padding: 0;">
                    <div style="text-align: left; margin-bottom: 30px;">
                        <h2 class="pata-title" style="margin-bottom: 12px; font-size: 40px; color: #000; text-transform: lowercase; font-family: 'Fraiche', sans-serif;">apelación en revisión</h2>
                        <p style="font-size: 18px; color: #000; line-height: 1.4; font-family: 'Outfit', sans-serif;">
                            Estamos revisando cuidadosamente tu apelación para <strong>${pet.name}</strong>. Te notificaremos en cuanto tengamos una respuesta.
                        </p>
                    </div>

                    <div style="background: #FFBD12; border: 3px solid #000; border-radius: 40px; padding: 30px; margin-bottom: 30px; box-shadow: 12px 12px 0 rgba(0,0,0,0.05); color: #000;">
                        <div style="font-weight: 900; color: #000; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">Fecha de envío:</div>
                        <div style="font-weight: 900; color: #000; font-size: 20px; font-family: 'Fraiche', sans-serif;">${appealDate}</div>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <button class="pata-btn-ver-detalles" data-pet-id="${pet.id}" style="width: 100%; background: #FE8F15; color: #000; border: 3px solid #000; padding: 18px; border-radius: 50px; font-size: 18px; font-weight: 900; cursor: pointer; font-family: 'Fraiche', sans-serif; display: flex; justify-content: center; align-items: center; gap: 10px;">
                            Ver historial y chat <span>→</span>
                        </button>
                    </div>

                    <div style="background: #F9F9F9; border: 2px solid #000; padding: 20px; border-radius: 25px; text-align: center;">
                        <p style="margin:0; font-size: 14px; color: #666; font-family: 'Outfit', sans-serif;">
                            Nuestro equipo legal y veterinario está analizando tu caso.
                        </p>
                    </div>
                </div>
            `;
        }

        renderApprovedContent(pet) {
            const carencia = this.calculateCarencia(pet);
            const petPhoto = pet.photo_url || pet.primary_photo_url || 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';

            // Dynamic messaging based on thresholds
            let statusMessage = "¡Bienvenido a la manada! Haz comenzado tu camino.";
            if (carencia.percentage >= 75) {
                statusMessage = "¡Ya casi llegas! Falta muy poco.";
            } else if (carencia.percentage >= 50) {
                statusMessage = "¡Ya recorriste más de la mitad del camino!";
            } else if (carencia.percentage >= 25) {
                statusMessage = "¡Vas por excelente camino!.";
            }

            return `
                <div class="pata-approved-grid-new">
                    <!-- Banner superior (Opcional) -->
                    ${this.checkMissingDocs(pet).length > 0 ? `
                        <div class="pata-approved-banner-new">
                            <span class="pata-banner-icon-new"></span>
                            <div class="pata-banner-content-new">
                                <strong>¿Adoptaste a alguno de tus compañeros?</strong><br/>
                                Puedes acelerar tu acceso al apoyo económico. Contáctanos a miembros@pataamiga.mx para validar tus documentos.
                            </div>
                        </div>
                    ` : ''}

                    <div class="pata-approved-grid-main">
                        <!-- Columna Izquierda: Estatus y Progreso -->
                        <div class="pata-approved-column-left">
                            <span class="pata-approved-status-badge">${carencia.daysRemaining <= 0 ? '¡Felicidades!' : 'tu tiempo de espera'}</span>
                            ${carencia.daysRemaining > 0 ? `<p class="pata-carencia-explanation">${this.getCarenciaExplanation(pet)}</p>` : ''}
                            
                            <div class="pata-approved-progress-box">
                                ${carencia.daysRemaining <= 0 ? `
                                    <h3 style="color: var(--pata-primary); font-family: var(--font-heading); margin-bottom: 10px; font-size: 1.2rem;">Apoyo Económico Activado</h3>
                                    <p style="margin-bottom: 20px; font-family: var(--font-body); color: var(--pata-text-dark);"><strong>${pet.name}</strong> ya puede acceder al apoyo económico y utilizar todos sus beneficios.</p>
                                    <a href="https://www.pataamiga.mx/miembros/tu-manada" style="display: block; background: var(--pata-accent); color: #000; border: 2px solid #000; border-radius: 50px; text-decoration: none; font-family: var(--font-heading); text-align: center; font-size: 16px; font-weight: bold; padding: 12px 20px; box-shadow: 4px 4px 0 rgba(0,0,0,1);">Utiliza tus beneficios</a>
                                ` : `
                                    <p class="pata-approved-progress-msg">${statusMessage}</p>
                                    
                                    <p class="pata-approved-days-left">
                                        faltan <strong>${carencia.daysRemaining} d&iacute;as</strong> para activar tus reintegros completos
                                    </p>
                                    
                                    <div class="pata-approved-progress-labels-top">
                                        <span>Inicio de membresía</span>
                                        <span>${Math.round(carencia.percentage)}% completado</span>
                                    </div>
    
                                    <div class="pata-approved-progress-container">
                                        <div class="pata-approved-progress-bar" style="width: ${carencia.percentage}%"></div>
                                    </div>
                                    
                                    <div class="pata-approved-progress-labels">
                                        <span>Día 1</span>
                                        <span>Día ${carencia.totalDays}</span>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Columna Derecha: Tarjetas de Mascota -->
                        <div class="pata-approved-column-right">
                            <!-- Card Foto -->
                            <div class="pata-pet-photo-card">
                                <img src="${petPhoto}" alt="${pet.name}">
                            </div>

                            <!-- Card Info Teal -->
                            <div class="pata-pet-info-card-teal">
                                <div>
                                    <h3>${pet.name.toLowerCase()}</h3>
                                    <ul class="pata-pet-info-list">
                                        <li>${pet.age_value || '?'} ${pet.age_unit === 'years' ? 'años' : 'meses'}</li>
                                        <li>${(pet.pet_type || '').toLowerCase() === 'dog' || (pet.pet_type || '').toLowerCase() === 'perro' ? 'lomito' : (pet.pet_type || '').toLowerCase() === 'cat' || (pet.pet_type || '').toLowerCase() === 'gato' ? 'michi' : (pet.pet_type || 'mascota').toLowerCase()}</li>
                                        <li>${(pet.breed || 'mestizo').toLowerCase()}</li>
                                    </ul>
                                </div>
                                
                                <button class="pata-btn-details-teal pata-btn-ver-detalles" data-pet-id="${pet.id}">
                                    ver detalles
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderRejectedContent(pet) {
            const rejectionReason = pet.rejection_reason || pet.admin_notes || pet.last_admin_response || 'No se especificó un motivo.';
            const petPhoto = pet.photo_url || pet.primary_photo_url || pet.pet_photo_url || 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929d5e779839f5517dc2ded_pata-amiga-logo.png';

            return `
                <div class="pata-rejected-view-new">
                    <h2 class="pata-rejected-title-new">La solicitud de ${pet.name} no fue aceptada</h2>
                    <p class="pata-rejected-subtitle-new">Lamentamos informarte que la solicitud de ${pet.name} no pudo ser aprobada en esta ocasión. Con el compromiso de mantener una total transparencia en nuestro proceso, te compartimos la razón detallada a continuación:</p>
                    
                    <div class="pata-rejected-grid-new">
                        <div class="pata-rejected-photo-new">
                            <img src="${petPhoto}" alt="${pet.name}">
                        </div>
                        <div class="pata-rejected-info-new">
                            <p class="pata-rejected-reason-label-new">Motivo del rechazo:</p>
                            <p class="pata-rejected-reason-text-new">${rejectionReason}</p>
                        </div>
                    </div>
                    
                    <div class="pata-rejected-actions-new">
                        <button class="pata-btn-appeal-new pata-btn-ver-detalles" data-pet-id="${pet.id}">
                            Apelar mi solicitud
                        </button>
                        <button class="pata-btn-accept-new" onclick="window.pataWidget.showPetList()">
                            Aceptar
                        </button>
                    </div>
                </div>
            `;
        }

        renderActionRequiredContent(pet) {
            const adminMsg = pet.last_admin_response || pet.admin_notes || pet['action-required-details'] || 'Por favor revisa la información solicitada en el chat.';
            const petPhoto = pet.photo_url || pet.primary_photo_url || pet.pet_photo_url || 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929d5e779839f5517dc2ded_pata-amiga-logo.png';

            return `
                <div class="pata-action-required-view-new">
                    <h2 class="pata-action-required-title-new">aviso de información faltante</h2>
                    <p class="pata-action-required-subtitle-new">Recibimos tu solicitud y ya estamos revisando la información para poder continuar con tu proceso.</p>
                    
                    <div class="pata-action-required-progress-container">
                        <div class="pata-action-required-progress-labels">
                            <span>Solicitud enviada</span>
                            <span>En revisión...</span>
                        </div>
                        <div class="pata-action-required-progress-track">
                            <div class="pata-action-required-progress-fill"></div>
                        </div>
                    </div>

                    <div class="pata-action-required-grid-new">
                        <div class="pata-action-required-photo-new">
                            <img src="${petPhoto}" alt="${pet.name}">
                        </div>
                        <div class="pata-action-required-info-new">
                            <p class="pata-action-required-message-label-new">Último mensaje del administrador:</p>
                            <p class="pata-action-required-message-text-new">"${adminMsg}"</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <button class="pata-btn-open-chat-new pata-btn-ver-detalles" data-pet-id="${pet.id}">
                            Abrir chat y actualizar
                        </button>
                    </div>
                </div>
            `;
        }

        // 🆕 Renderizar el modal de actualización
        renderUpdateModal(pet) {
            const adminMsg = pet.last_admin_response || 'Por favor actualiza la información solicitada.';
            const isSeniorPet = this.isSenior(pet);
            const hasPhoto1 = !!(pet.photo_url || pet.primary_photo_url || pet.pet_photo_url);
            const hasCert = !!pet.vet_certificate_url;
            const isComplete = hasPhoto1 && (!isSeniorPet || hasCert);

            let uploadFields = '';

            if (!hasPhoto1) {
                uploadFields += `
                    <div style="margin-bottom: 25px;">
                        <p style="font-weight: 800; font-size: 17px; margin-bottom: 15px; color: #000; font-family: 'Fraiche', sans-serif; text-transform: lowercase;">📸 foto principal del álbum:</p>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 15px; max-width: 100%;">
                            <div class="pata-form-group">
                                <div class="pata-upload-area" id="pata-upload-area-1" style="min-height: 180px; border-radius: 40px; border: 3px dashed #000; background: #f8f8f8; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s;">
                                    <input type="file" accept="image/*" class="pata-upload-input" id="pata-file-1" style="display:none;" />
                                    <div class="pata-upload-icon" style="font-size: 32px; margin-bottom: 8px;">📷</div>
                                    <div class="pata-upload-text" style="font-size: 14px; font-weight: 800; text-transform: lowercase; font-family: 'Outfit', sans-serif;">seleccionar foto</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            if (isSeniorPet && !hasCert) {
                uploadFields += `
                    <div style="margin-top: 25px; padding: 30px; background: #E0F7F6; border: var(--pata-border-thick); border-radius: 45px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                        <label style="font-weight: 950; margin-bottom: 15px; display: block; color: #000; font-family: 'Fraiche', sans-serif; text-transform: lowercase; font-size: 20px; letter-spacing: -0.5px;">🩺 certificado de salud (senior):</label>
                        <div class="pata-upload-area" id="pata-upload-area-cert" style="background: #fff; border: 3px dashed #00BBB4; border-radius: 35px; min-height: 160px; overflow: hidden; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s;">
                            <input type="file" accept=".pdf,image/*" class="pata-upload-input" id="pata-file-cert" style="display:none;" />
                            <div class="pata-upload-icon" style="font-size: 32px; margin-bottom: 8px;">📄</div>
                            <div class="pata-upload-text" style="color: #00BBB4; font-weight: 800; font-family: 'Outfit', sans-serif; font-size: 14px; text-transform: lowercase;">subir pdf o imagen</div>
                        </div>
                    </div>
                `;
            }

            if (isComplete) {
                uploadFields = `
                    <div style="padding: 40px; background: #E8F5E9; border: var(--pata-border-thick); border-radius: 50px; text-align: center; margin-bottom: 25px; box-shadow: 8px 8px 0 rgba(76, 175, 80, 0.1);">
                        <div style="font-size: 50px; margin-bottom: 15px;">✅</div>
                        <p style="margin:0; font-size: 22px; font-weight: 950; color: #1B5E20; font-family: 'Fraiche', sans-serif; text-transform: lowercase;">¡documentos listos!</p>
                        <p style="margin:10px 0 0 0; font-size: 16px; color: #2E7D32; font-weight: 600; font-family: 'Outfit', sans-serif;">Ya contamos con la información necesaria.</p>
                    </div>
                `;
            }

            const adminNote = pet.status === 'action_required' ? `
                <div class="pata-admin-request" style="background: #FFF9E6; border: var(--pata-border-thick); padding: 30px; border-radius: 45px; margin-bottom: 30px; box-shadow: 8px 8px 0 rgba(255, 189, 18, 0.1);">
                    <div style="font-weight: 950; margin-bottom: 12px; color: #744210; font-family: 'Fraiche', sans-serif; text-transform: lowercase; font-size: 20px;">📩 nota del equipo:</div>
                    <p style="margin:0; font-size: 16px; line-height: 1.6; color: #5D4037; font-weight: 600; font-family: 'Outfit', sans-serif;">${adminMsg}</p>
                </div>
            ` : '';

            const submitDisabled = this.uploading || isComplete ? 'disabled' : '';
            const submitLabel = this.uploading ? 'enviando...' : 'guardar cambios →';

            return `
                <div class="pata-modal-overlay" id="pata-update-modal">
                    <div class="pata-modal" style="max-width: 600px; max-height: 90vh; border: var(--pata-border-thick); border-radius: 60px; overflow: hidden; display: flex; flex-direction: column; background: #fff; box-shadow: 20px 20px 0 rgba(0,0,0,0.1);">
                        <div class="pata-modal-header" style="background: #fff; border-bottom: var(--pata-border-thick); padding: 30px 40px; display: flex; justify-content: space-between; align-items: center;">
                            <h3 class="pata-modal-title" style="font-size: 28px; letter-spacing: -1px; font-family: 'Fraiche', sans-serif; text-transform: lowercase; margin: 0; color: #000;">📸 actualizar datos de ${pet.name}</h3>
                            <button class="pata-modal-close" id="pata-modal-close" style="font-size: 40px; font-weight: 300; background: transparent; border: none; cursor: pointer; color: #000; display: flex; align-items: center; justify-content: center;">&times;</button>
                        </div>
                        <div class="pata-modal-body" style="padding: 40px; overflow-y: auto; flex: 1; scrollbar-width: thin;">
                            ${adminNote}
                            ${uploadFields}
                            <div style="margin-top: 35px;">
                                <label style="font-weight: 900; margin-bottom: 12px; display: block; font-size: 18px; font-family: 'Fraiche', sans-serif; text-transform: lowercase;">mensaje adicional (opcional):</label>
                                <textarea id="pata-update-message" class="pata-textarea" placeholder="¿Quieres decirnos algo más sobre los cambios?" style="width: 100%; min-height: 140px; padding: 20px; border-radius: 30px; border: 3px solid #000; font-family: 'Outfit', sans-serif; font-size: 16px; box-shadow: 6px 6px 0 rgba(0,0,0,0.05); resize: none;"></textarea>
                            </div>
                        </div>
                        <div class="pata-modal-footer" style="background: #fff; border-top: var(--pata-border-thick); padding: 30px 40px; display: flex; gap: 20px; justify-content: flex-end;">
                            <button class="pata-btn-outline" id="pata-btn-cancel-update" style="border-radius: 50px; padding: 16px 30px; font-weight: 900; border: 3px solid #000; background: #fff; cursor: pointer; font-family: 'Outfit', sans-serif; text-transform: lowercase; font-size: 16px;">cancelar</button>
                            <button class="pata-btn" id="pata-btn-submit-update" style="background: #FE8F15; color: #000; border: 3px solid #000; border-radius: 50px; padding: 16px 40px; font-weight: 950; box-shadow: 6px 6px 0 #000; cursor: pointer; font-family: 'Fraiche', sans-serif; text-transform: lowercase; font-size: 18px; transition: transform 0.2s;" ${submitDisabled}>
                                ${submitLabel}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }


        renderChatInterface(logs, petId, status) {
            const canSend = ['action_required', 'rejected', 'appealed'].includes(status);

            const bubbles = logs.map(log => {
                let bubbleClass = 'system';
                const type = log.type || '';

                if (['user_response', 'user_appeal', 'user_message', 'user_fulfill'].includes(type)) {
                    bubbleClass = 'user';
                } else if (['admin_request', 'admin_message'].includes(type)) {
                    bubbleClass = 'admin';
                } else if (type === 'admin_info_request') {
                    bubbleClass = 'action';
                }

                const dateStr = log.date || log.created_at;
                const date = dateStr ? new Date(dateStr).toLocaleString('es-MX', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                }) : '---';

                const icon = log.icon || '📋';

                if (bubbleClass === 'action') {
                    const meta = log.metadata || {};
                    const items = meta.items || [];
                    const requestTypes = meta.request_types || [];
                    const fulfilled = meta.fulfilled === true;

                    const displayItems = items.length > 0 ? items : requestTypes.map(rt => {
                        const typeLabels = {
                            'PET_PHOTO_1': { label: '📸 Foto Principal' },
                            'PET_VET_CERT': { label: '🏥 Certificado Médico' },
                            'OTHER_DOC': { label: '📄 Documento Adicional' }
                        };
                        return { type: rt, label: typeLabels[rt]?.label || rt, fulfilled: false };
                    });

                    const actionButtons = displayItems.map(item => {
                        if (item.fulfilled || fulfilled) {
                            return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;background:#E8F5E9;border:2px solid #4CAF50;font-size:13px;font-weight:700;color:#2E7D32;margin-bottom:4px;">✅ ${item.label} - Completado</div>`;
                        }
                        return `<button class="pata-action-btn" data-request-type="${item.type}" data-log-id="${log.id}" data-pet-id="${petId}" style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;background:#FFF3E0;border:2px solid #FE8F15;font-size:13px;font-weight:700;color:#E65100;cursor:pointer;width:100%;text-align:left;transition:0.2s;margin-bottom:4px;box-shadow: 2px 2px 0 rgba(254, 143, 21, 0.2);">${item.label} - Subir/Actualizar</button>`;
                    }).join('');

                    let messageContent = log.message || '';
                    messageContent = messageContent.replace(/\n/g, '<br><br>');

                    return `
                        <div class="pata-chat-bubble admin" style="background:linear-gradient(135deg,#FFF8E1,#FFF3E0);border:2px solid #FE8F15;">
                            <div style="font-weight:900;font-size:13px;margin-bottom:8px;color:#FE8F15;">📋 Solicitud de Información</div>
                            <div style="font-size:13px;margin-bottom:12px;">${messageContent}</div>
                            <br>
                            <div style="display:flex;flex-direction:column;gap:8px;">
                                ${actionButtons}
                            </div>
                            <span class="pata-chat-meta">${date}</span>
                        </div>
                    `;
                }

                if (bubbleClass === 'system') {
                    return `
                        <div class="pata-chat-bubble system">
                            <span style="margin-right: 8px;">${icon}</span> ${log.message}
                            <span class="pata-chat-meta">${date}</span>
                        </div>
                    `;
                }

                let messageContent = log.message || '';
                // Add line break after 🏥 emoji for better formatting in info request messages
                messageContent = messageContent.replace(/(🏥)/g, '$1<br>');
                const imageMatch = messageContent.match(/\[Imagen adjunta\]\((.*?)\)/);
                const fileMatch = messageContent.match(/\[Archivo adjunto\]\((.*?)\)/);

                if (imageMatch) {
                    const url = imageMatch[1];
                    messageContent = `
                        <div style="margin-bottom: 8px; font-weight: 700; font-size: 12px; opacity: 0.8;">📸 Imagen adjunta:</div>
                        <a href="${url}" target="_blank">
                            <img src="${url}" style="max-width: 100%; border-radius: 12px; border: 2px solid #000; display: block; margin-bottom: 5px;" />
                        </a>
                    `;
                } else if (fileMatch) {
                    const url = fileMatch[1];
                    messageContent = `
                        <a href="${url}" target="_blank" style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 10px; text-decoration: none; color: inherit; border: 1px solid rgba(0,0,0,0.1);">
                            <span style="font-size: 20px;">📄</span>
                            <div style="overflow: hidden;">
                                <div style="font-weight: 700; font-size: 12px;">Documento adjunto</div>
                                <div style="font-size: 10px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${url.split('/').pop()}</div>
                            </div>
                        </a>
                    `;
                } else {
                    messageContent = messageContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #00BBB4; font-weight: 700;">$1</a>');
                }

                return `
                    <div class="pata-chat-bubble ${bubbleClass}">
                        ${messageContent}
                        <span class="pata-chat-meta">${date}</span>
                    </div>
                `;
            }).join('');

            return `
                <div class="pata-chat-container">
                    <div class="pata-chat-header">Historial de Comunicación</div>
                    <div class="pata-chat-messages" id="pata-chat-messages-container">
                        ${logs.length === 0 ? `
                            <div class="pata-chat-empty">
                                <div style="font-size: 40px; margin-bottom: 10px;">💬</div>
                                <p style="font-weight: 900; margin: 0; color: #000;">Sin mensajes aún</p>
                                <p style="font-size: 13px; margin: 5px 0 0 0;">Aquí verás las actualizaciones de tu solicitud.</p>
                            </div>
                        ` : bubbles}
                    </div>
                    
                    ${canSend ? `
                        <div class="pata-chat-input-area" style="display: flex; gap: 10px; align-items: flex-end; padding: 15px; background: #fff; border-top: 4px solid #000;">
                            <button id="pata-chat-attach" class="pata-chat-btn" style="background: #F0F2F5; border: 2px solid #000; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; transition: 0.2s;">
                                📎
                            </button>
                            <input type="file" id="pata-chat-file-input" style="display: none;" accept="image/*,application/pdf" />
                            <textarea id="pata-chat-input" placeholder="Escribe un mensaje o adjunta archivos..." class="pata-chat-input" style="border-radius: 20px; min-height: 50px; resize: none; border: 2px solid #000; flex: 1; padding: 12px 15px; font-family: inherit;"></textarea>
                            <button id="pata-chat-send" class="pata-chat-send" data-pet-id="${petId}" style="background: #00BBB4; border: 2px solid #000; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; font-weight: 900;">
                                ➔
                            </button>
                        </div>
                    ` : `
                        <div style="padding: 20px; background: #F8F9FA; border-top: 4px solid #000; text-align: center; font-size: 13px; font-weight: 800; color: #666; line-height: 1.4;">
                            El canal de comunicación se activará si nuestro equipo requiere información adicional o si tu solicitud cambia de estado.
                        </div>
                    `}
                </div>
            `;
        }


        async fetchAndRenderChat(petId) {
            const root = document.getElementById('pata-chat-root');
            if (!root) return;

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal-history?memberId=${this.member.id}&petId=${petId}`);
                const data = await res.json();

                if (!data.success) throw new Error(data.error);

                const pet = this.pets.find(p => p.id === petId);
                root.innerHTML = this.renderChatInterface(data.logs || [], petId, pet?.status);

                // Scroll to bottom
                const container = document.getElementById('pata-chat-messages-container');
                if (container) container.scrollTop = container.scrollHeight;

                // Bind send event
                const sendBtn = document.getElementById('pata-chat-send');
                if (sendBtn) {
                    sendBtn.onclick = () => this.handleSendMessage(petId);
                }

                // Bind attach events
                const attachBtn = document.getElementById('pata-chat-attach');
                const fileInput = document.getElementById('pata-chat-file-input');
                if (attachBtn && fileInput) {
                    attachBtn.onclick = () => fileInput.click();
                    fileInput.onchange = () => this.handleChatUpload(petId);
                }

                // 🆕 Bind action buttons for info requests
                const actionBtns = root.querySelectorAll('.pata-action-btn');
                actionBtns.forEach(btn => {
                    btn.onclick = () => this.handleFulfillRequest(btn.dataset.petId, btn.dataset.requestType, btn.dataset.logId, btn);
                });
            } catch (err) {
                console.error('❌ Error fetching chat:', err);
                root.innerHTML = `<div style="color:red; padding:20px; text-align:center; font-weight:800; font-size:14px;">⚠️ No se pudo cargar el historial de mensajes.</div>`;
            }
        }

        async handleChatUpload(petId) {
            const fileInput = document.getElementById('pata-chat-file-input');
            const file = fileInput?.files[0];
            const sendBtn = document.getElementById('pata-chat-send');

            if (!file) return;

            // Mostrar estado de carga en el botón
            const originalText = sendBtn.innerText;
            sendBtn.disabled = true;
            sendBtn.innerText = '⌛';

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('userId', this.member.id);

                const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                const fileUrl = data.url;
                const isImage = file.type.startsWith('image/');
                const message = isImage ? `[Imagen adjunta](${fileUrl})` : `[Archivo adjunto](${fileUrl})`;

                // Enviar mensaje con el link
                const chatRes = await fetch(`${CONFIG.apiUrl}/api/user/chat/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.member.id,
                        petId: petId,
                        message: message
                    })
                });

                const chatData = await chatRes.json();
                if (!chatData.success) throw new Error(chatData.error);

                await this.fetchAndRenderChat(petId);
            } catch (err) {
                console.error('❌ Error en upload de chat:', err);
                alert('No se pudo subir el archivo. Intenta de nuevo.');
            } finally {
                sendBtn.disabled = false;
                sendBtn.innerText = originalText;
                fileInput.value = '';
            }
        }

        async handleSendMessage(petId) {
            const input = document.getElementById('pata-chat-input');
            const btn = document.getElementById('pata-chat-send');
            const msg = input?.value?.trim();

            if (!msg) return;
            if (msg.length < 3) return alert('El mensaje es muy corto.');

            btn.disabled = true;
            btn.innerText = '...';

            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/chat/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.member.id,
                        petId: petId,
                        message: msg
                    })
                });

                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                input.value = '';
                await this.fetchAndRenderChat(petId);
            } catch (err) {
                console.error('❌ Error sending message:', err);
                alert('No se pudo enviar el mensaje. Intenta de nuevo.');
            } finally {
                btn.disabled = false;
                btn.innerText = '➔';
            }
        }

        // 🆕 Handle fulfill request from action buttons
        async handleFulfillRequest(petId, requestType, logId, btnElement) {
            // Create a hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';

            // Set accept type based on request
            if (requestType === 'PET_PHOTO_1') {
                fileInput.accept = 'image/*';
            } else if (requestType === 'PET_VET_CERT') {
                fileInput.accept = 'image/*,application/pdf';
            } else {
                fileInput.accept = 'image/*,application/pdf';
            }

            fileInput.onchange = async () => {
                const file = fileInput.files[0];
                if (!file) return;

                // 10MB limit
                if (file.size > 10 * 1024 * 1024) {
                    alert('El archivo es muy grande. Máximo 10MB.');
                    return;
                }

                // Show loading state
                const originalHTML = btnElement.innerHTML;
                btnElement.disabled = true;
                btnElement.innerHTML = '⏳ Subiendo...';
                btnElement.style.opacity = '0.6';

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('petId', petId);
                    formData.append('userId', this.member.id);
                    formData.append('requestType', requestType);
                    formData.append('logId', logId);

                    const res = await fetch(`${CONFIG.apiUrl}/api/user/fulfill-request`, {
                        method: 'POST',
                        body: formData
                    });

                    const data = await res.json();

                    if (data.success) {
                        // Replace button with success state
                        btnElement.innerHTML = '✅ ¡Completado!';
                        btnElement.style.background = '#E8F5E9';
                        btnElement.style.border = '2px solid #4CAF50';
                        btnElement.style.color = '#2E7D32';

                        // 1. Refresh full data from server to get new URLs and status
                        await this.loadData();

                        // 2. Find the updated pet
                        const updatedPet = this.pets.find(p => p.id === petId);

                        // 3. Update the modal background and info without closing it
                        if (updatedPet) {
                            const modal = document.getElementById('pata-pet-details-modal');
                            if (modal) {
                                // Update main image if it was photo 1
                                if (requestType === 'PET_PHOTO_1') {
                                    const mainImg = document.getElementById('pata-main-gallery-img');
                                    if (mainImg) mainImg.src = data.url;
                                }

                                // Update floating status badge
                                const statusBadge = modal.querySelector('.pata-status-badge-floating');
                                if (statusBadge) {
                                    statusBadge.innerHTML = '⏳ EN REVISIÓN';
                                    statusBadge.style.background = '#FE8F15';
                                    statusBadge.style.color = '#000';
                                }

                                // Refresh benefits/info rows if status changed
                                const statusValue = modal.querySelector('.pata-editorial-status-value');
                                if (statusValue) {
                                    statusValue.innerHTML = '<span style="opacity: 0.4;">🛡️</span> En revisión';
                                    statusValue.style.color = '#FE8F15';
                                }

                                // Update Fact Sheet top badge
                                const topBadge = modal.querySelector('.pata-editorial-status-badge');
                                if (topBadge) {
                                    topBadge.innerText = 'EN REVISIÓN';
                                    topBadge.style.background = '#FE8F15';
                                    topBadge.style.color = '#000';
                                }
                            }
                        }

                        // 4. Refresh chat after a short delay
                        setTimeout(() => {
                            this.fetchAndRenderChat(petId);
                            // Also re-render main list in background
                            this.render();
                        }, 1000);
                    } else {
                        throw new Error(data.error || 'Error al procesar la solicitud');
                    }
                } catch (error) {
                    console.error('❌ Error en handleFulfillRequest:', error);
                    alert('Error: ' + error.message);
                } finally {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalHTML;
                    btnElement.style.opacity = '1';
                }
            };
            fileInput.click();
        }

        renderPetDetailsModal(pet) {
            const petIndex = this.pets.findIndex(p => p.id === pet.id);
            const carencia = this.calculateCarencia(pet);
            const status = pet.is_active === false
                ? { bg: '#F1F3F4', text: '#3D494D', label: 'DADA DE BAJA', icon: '' }
                : (CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending);

            const photos = [
                pet.photo_url || pet.primary_photo_url,
                pet.photo2_url,
                pet.photo3_url,
                pet.photo4_url,
                pet.photo5_url
            ].filter(p => p && p.startsWith('http'));

            if (photos.length === 0) photos.push('https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png');

            const registrationDate = pet.created_at ? new Date(pet.created_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', year: 'numeric'
            }) : 'No disponible';

            const activationDate = carencia.endDate ? carencia.endDate.toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', year: 'numeric'
            }) : '---';

            const infoItems = [
                { label: 'Especie', value: pet.type || (pet.pet_type === 'dog' ? 'Perro' : pet.pet_type === 'cat' ? 'Gato' : pet.pet_type) || 'Perro', icon: 'https://app.pataamiga.mx/Icons/especie.png' },
                { label: 'Edad', value: (pet.age || '').replace(/years?/i, m => m.toLowerCase().endsWith('s') ? 'años' : 'año').replace(/old/i, '').trim() || (pet.age_value ? `${pet.age_value} ${pet.age_unit === 'months' ? 'meses' : 'años'}` : '1 año'), icon: 'https://app.pataamiga.mx/Icons/edad.png' },
                {
                    isCustom: true,
                    html: `
                        <div class="pata-info-item">
                            <div class="pata-info-icon-wrap"><img src="https://app.pataamiga.mx/Icons/cumpleanos.png" alt="Cumpleaños"></div>
                            <div class="pata-info-texts">
                                <span class="pata-info-label">Cumpleaños</span>
                                ${pet.birth_month && pet.birth_year ? `
                                    <span class="pata-info-value">${['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][pet.birth_month] || pet.birth_month} ${pet.birth_year}</span>
                                ` : `
                                    <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
                                        <input type="text" list="pata-months-list" id="pata-birth-month-${pet.id}" placeholder="Mes" style="width:70px; border:1px solid #ddd; border-radius:8px; padding:4px 8px; font-size:12px;">
                                        <datalist id="pata-months-list">
                                            <option value="Enero"><option value="Febrero"><option value="Marzo"><option value="Abril">
                                            <option value="Mayo"><option value="Junio"><option value="Julio"><option value="Agosto">
                                            <option value="Septiembre"><option value="Octubre"><option value="Noviembre"><option value="Diciembre">
                                        </datalist>
                                        <input type="number" id="pata-birth-year-${pet.id}" placeholder="Año" min="1995" max="${new Date().getFullYear()}" style="width:60px; border:1px solid #ddd; border-radius:8px; padding:4px 8px; font-size:12px;">
                                        <button id="pata-btn-birthday-${pet.id}" onclick="window.pataWidget.saveBirthday('${pet.id}')" style="background:#00BBB4; color:white; border:none; border-radius:8px; padding:4px 10px; font-size:11px; font-weight:bold; cursor:pointer;">Guardar</button>
                                    </div>
                                `}
                            </div>
                        </div>
                    `
                },
                { label: 'Género', value: pet.gender || 'Hembra', icon: 'https://app.pataamiga.mx/Icons/sexo.png' },
                { label: 'Color Pelo', value: pet.coat_color || pet.color || pet.pet_color || 'Multicolor', icon: 'https://app.pataamiga.mx/Icons/color-pelo.png' },
                { label: 'Color Ojos', value: pet.eye_color || '---', icon: 'https://app.pataamiga.mx/Icons/color-ojos.png' },
                { label: 'Color Nariz', value: pet.nose_color || '---', icon: 'https://app.pataamiga.mx/Icons/color-nariz.png' },
                { label: 'Fecha de ingreso a la manada', value: registrationDate, icon: 'https://app.pataamiga.mx/Icons/ingreso.png' },
                ...(pet.status === 'approved' ? [{ label: 'Fecha de activación del apoyo económico', value: activationDate, icon: 'https://app.pataamiga.mx/Icons/activacion.png' }] : [])
            ];

            const infoGridHtml = infoItems.map(item => {
                if (item.isCustom) return item.html;
                return `
                    <div class="pata-info-item">
                        <div class="pata-info-icon-wrap"><img src="${item.icon}" alt="${item.label}"></div>
                        <div class="pata-info-texts">
                            <span class="pata-info-label">${item.label}</span>
                            <span class="pata-info-value">${item.value}</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Distinctive Editorial Layout
            return `
                <div class="pata-modal-overlay show" id="pata-pet-details-modal" role="dialog" aria-modal="true" aria-labelledby="pata-editorial-name">
                    <div class="pata-editorial-container">
                        <div class="pata-editorial-body">
                            
                            <!-- Left Section: Visual Identity -->
                            <div class="pata-editorial-left">
                                <!-- 📸 Mobile Carousel -->
                                <div class="pata-photo-carousel">
                                    ${photos.map((url, i) => `
                                        <div class="pata-carousel-item">
                                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Desktop Main Image -->
                                <div class="pata-editorial-main-img-box ${pet.is_active === false ? 'pata-grayscale' : ''}">
                                    <img src="${photos[0]}" id="pata-main-gallery-img" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" loading="lazy">
                                    <div class="pata-status-badge-floating" style="position: absolute; top: 20px; left: 20px; background: ${status.bg}; color: ${status.text}; border: 3px solid #000; padding: 10px 24px; border-radius: 50px; font-weight: 950; font-size: 12px; text-transform: uppercase; box-shadow: 4px 4px 0 rgba(0,0,0,0.1);">
                                        ${status.icon} ${status.label}
                                    </div>
                                </div>
                                
                                <!-- Desktop Thumbnails -->
                                <div style="display: flex; gap: 14px; overflow-x: auto; padding: 10px 5px; scrollbar-width: none;" class="pata-no-scrollbar">
                                    ${photos.map((url, i) => `
                                        <div onclick="document.getElementById('pata-main-gallery-img').src='${url}'" style="width: 75px; height: 75px; border-radius: 18px; border: var(--pata-border-thin); overflow: hidden; cursor: pointer; flex-shrink: 0; background: #fff; transition: all 0.2s; box-shadow: 4px 4px 0 rgba(0,0,0,0.05);">
                                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Foto ${i + 1}">
                                        </div>
                                    `).join('')}
                                </div>

                                ${pet.status === 'approved' ? (() => {
                                    if (carencia.daysRemaining <= 0) {
                                        return `
                                        <div style="background: #FFF; border: var(--pata-border-thick); border-radius: 30px; padding: 25px; margin-top: 10px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05); text-align: center;">
                                            <h3 style="color: var(--pata-primary); font-family: var(--font-heading); margin-bottom: 10px; font-size: 1.2rem;">Apoyo Económico Activado</h3>
                                            <p style="margin-bottom: 15px; font-family: var(--font-body); color: var(--pata-text-dark); font-size: 14px;"><strong>${pet.name}</strong> ya puede acceder al apoyo económico.</p>
                                            <a href="https://www.pataamiga.mx/miembros/tu-manada" style="display: block; background: var(--pata-btn-primary, #FE8F15); color: #000; border: 2px solid #000; border-radius: 50px; text-decoration: none; font-family: var(--font-heading); text-align: center; font-size: 14px; font-weight: bold; padding: 12px 0; box-shadow: 4px 4px 0 rgba(0,0,0,1);">Utiliza tus beneficios</a>
                                        </div>
                                        `;
                                    }
                                    return `
                                    <div style="background: #FFF; border: var(--pata-border-thick); border-radius: 30px; padding: 25px; margin-top: 10px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                                        <div style="font-size: 14px; font-weight: 950; color: var(--pata-primary); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Estatus de tiempo de espera</div>
                                        <p class="pata-carencia-explanation" style="margin-bottom: 16px;">${this.getCarenciaExplanation(pet)}</p>
                                        <div style="height: 20px; background: #F0F0F0; border-radius: 15px; border: var(--pata-border-thin); overflow: hidden; position: relative;">
                                            <div style="width: ${carencia.percentage}%; height: 100%; background: #9fd406; border-right: var(--pata-border-thin);"></div>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin-top: 12px; color: #000;">
                                            <span>Día ${Math.floor((carencia.totalDays * carencia.percentage) / 100)}</span>
                                            <span style="color: var(--pata-primary);">Faltan ${carencia.daysRemaining} días</span>
                                        </div>
                                    </div>
                                    `;
                                })() : ''}
                            </div>

                            <!-- Right Section: Fact Sheet -->
                            <div class="pata-editorial-right">
                                <button class="pata-modal-close" id="pata-close-details" aria-label="Cerrar expediente" style="position: absolute; top: 30px; right: 30px; background: #000; border: none; width: 44px; height: 44px; border-radius: 50%; font-size: 24px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; transition: transform 0.3s; z-index: 10;">&times;</button>
                                
                                <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                                    <div class="pata-editorial-status-badge" style="background: ${status.bg}; color: ${status.text}; border: var(--pata-border-thin); padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 950; box-shadow: 3px 3px 0 rgba(0,0,0,0.05);">
                                         ${status.label.toUpperCase()}
                                    </div>
                                    ${pet.is_senior || this.isSenior(pet) ? `
                                        <div style="background: #F3E5F5; color: #7B1FA2; border: var(--pata-border-thin); padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 950; box-shadow: 3px 3px 0 rgba(123, 31, 162, 0.1);">
                                            👑 SENIOR
                                        </div>
                                    ` : ''}
                                    ${pet.is_adopted ? `
                                        <div style="background: #E0F7FA; color: #006064; border: var(--pata-border-thin); padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 950; box-shadow: 3px 3px 0 rgba(0,0,0,0.05);">
                                            🏠 ADOPTADO
                                        </div>
                                    ` : ''}
                                </div>

                                <h2 class="pata-editorial-name" id="pata-editorial-name">${pet.name}</h2>
                                <p style="font-size: 20px; font-weight: 800; color: var(--pata-primary); margin-bottom: 30px; display: flex; align-items: center; gap: 10px; border-bottom: var(--pata-border-thick); padding-bottom: 15px; width: fit-content;">
                                    ${pet.breed || pet.pet_breed || 'Mestizo de Corazón'}
                                </p>

                                ${this.renderModalActionButtons(pet)}

                                <!-- Desktop Info Grid -->
                                <div class="pata-info-card">
                                    <h3 class="pata-info-card-title">Información General</h3>
                                    <div class="pata-info-grid">
                                        ${infoGridHtml}
                                    </div>
                                </div>

                                <!-- 📂 Mobile Accordion -->
                                <details class="pata-mobile-accordion">
                                    <summary>Ver todos los detalles</summary>
                                    <div class="pata-info-card" style="margin-top: 16px; margin-bottom: 0;">
                                        <h3 class="pata-info-card-title">Información General</h3>
                                        <div class="pata-info-grid">
                                            ${infoGridHtml}
                                        </div>
                                    </div>
                                </details>

                                ${pet.adoption_story ? `
                                    <div style="margin-top: 30px; background: #F1F8E9; border: var(--pata-border-thin); padding: 25px; border-radius: 30px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                                        <div style="font-size: 11px; font-weight: 950; color: #2E7D32; text-transform: uppercase; margin-bottom: 8px;">📜 Historia de Adopción</div>
                                        <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0; font-weight: 600;">${pet.adoption_story}</p>
                                    </div>
                                ` : ''}

                                ${this.isSenior(pet) ? `
                                    <div style="background: #E1F5FE; border: var(--pata-border-thin); padding: 25px; border-radius: 30px; margin-top: 20px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                                        <div style="font-size: 11px; font-weight: 950; color: #01579B; text-transform: uppercase; margin-bottom: 8px;">Expediente Salud Senior</div>
                                        ${pet.vet_certificate_url ?
                        `<a href="${pet.vet_certificate_url}" target="_blank" style="color: #000; font-weight: 950; text-decoration: none; font-size: 16px; display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 40px; height: 40px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">📄</div>
                                                Ver Certificado Médico →
                                            </a>` :
                        '<div style="color: #D32F2F; font-weight: 950; font-size: 15px; display: flex; align-items: center; gap: 10px;">⚠️ Información de salud pendiente</div>'}
                                    </div>
                                ` : ''}

                                <!-- 🗑️ Solicitar Baja Section -->
                                ${pet.is_active !== false ? `
                                    <div style="margin-top: 30px; border-top: 1px dashed #ddd; padding-top: 20px;">
                                        <button class="pata-btn-unsubscribe" onclick="window.pataWidget.handlePetUnsubscribe('${pet.id}', ${petIndex}, '${this.escapeHtml(pet.name)}')">
                                            <span>👋</span> Solicitar baja de este peludito
                                        </button>
                                        <p style="font-size: 11px; color: #888; text-align: center; margin-top: 10px; font-style: italic;">
                                            Al dar de baja a un peludito, liberas un espacio en tu manada para proteger a otro integrante.
                                        </p>
                                    </div>
                                ` : `
                                    <div style="margin-top: 30px; background: #f8f9fa; border: 2px solid #ddd; padding: 20px; border-radius: 20px; text-align: center;">
                                        <span style="font-size: 24px; display: block; margin-bottom: 10px;">📉</span>
                                        <p style="font-size: 14px; font-weight: 700; color: #666; margin: 0;">Esta mascota ya no se encuentra activa en la manada.</p>
                                    </div>
                                `}

                                <!-- 🆕 Chat Interface Container -->
                                <div id="pata-chat-root" style="margin-top: 40px;">
                                    <div class="pata-chat-loading">
                                        <span style="font-size: 24px; animation: pataSpin 1.5s linear infinite;">⏳</span>
                                        Cargando historial de comunicación...
                                    </div>
                                </div>

                                <div style="margin-top: 50px;">
                                    <button id="pata-close-details-btn" class="pata-btn" aria-label="Cerrar expediente y volver" style="background: #FE8F15; color: #000; border: var(--pata-border-thick); width: 100%; font-size: 18px; padding: 20px; border-radius: 50px; font-weight: 950;">
                                        Cerrar Expediente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderModalActionButtons(pet) {
            let actions = '';
            const needsPhoto = !(pet.photo_url || pet.primary_photo_url);
            const needsCert = this.isSenior(pet) && !pet.vet_certificate_url;

            if (needsPhoto) {
                actions += `
                    <button class="pata-btn" style="background: var(--pata-primary); color: #fff; border: var(--pata-border-thick); width: 100%; margin-bottom: 12px; font-size: 15px;" 
                        onclick="window.pataWidget.handleFulfillRequest('${pet.id}', 'PET_PHOTO_1', null, this)">
                        📸 Actualizar Foto Principal
                    </button>
                `;
            }

            if (needsCert) {
                actions += `
                    <button class="pata-btn" style="background: #7B1FA2; color: #fff; border: var(--pata-border-thick); width: 100%; margin-bottom: 12px; font-size: 15px;" 
                        onclick="window.pataWidget.handleFulfillRequest('${pet.id}', 'PET_VET_CERT', null, this)">
                        🏥 Actualizar Certificado Médico
                    </button>
                `;
            }

            if (!actions) return '';

            return `
                <div style="margin-bottom: 35px; background: #FFF9C4; border: var(--pata-border-thick); border-radius: 30px; padding: 25px; box-shadow: 8px 8px 0 rgba(0,0,0,0.05);">
                    <div style="font-size: 12px; font-weight: 950; color: #F57F17; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                        <span>⚠️</span> Acción requerida
                    </div>
                    ${actions}
                </div>
            `;
        }

        renderMissingPhotosView(firstName, pet) {
            const isSenior = pet.age_value >= 10;
            const needsCert = isSenior && !pet.vet_certificate_url;

            // Trigger progress bar animation
            setTimeout(() => {
                const bar = document.getElementById('pata-missing-progress-bar');
                if (bar) bar.style.width = '65%';
            }, 300);

            return `
                <div class="pata-theme-orange" style="min-height: 100vh; position: relative; overflow: hidden; padding: 60px 24px; display: flex; justify-content: center; align-items: center; font-family: 'Outfit', sans-serif;">
                    <img src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777945368/letra_a_orange_vuxixu.png" alt="Decor" class="pata-bg-letter">
                    
                    <div style="width: 100%; max-width: 1100px; position: relative; z-index: 1;">
                        <header class="pata-missing-header">
                            <h1>¡hola, ${firstName}!</h1>
                            <div class="pata-missing-header-sub">
                                <p><strong>Gracias por tu paciencia</strong></p>
                                <p>Recibimos tu solicitud y ya estamos revisando la información para poder continuar con tu proceso. Mientras tanto, puedes entrar aquí cuando quieras para ver tu estatus actualizado.</p>
                            </div>
                        </header>

                        <div class="pata-missing-card">
                            <div class="pata-missing-card-header">
                                <h2 class="pata-missing-card-title">aviso de información faltante</h2>
                                <p class="pata-missing-card-intro">Recibimos tu solicitud y ya estamos revisando la información para poder continuar con tu proceso.</p>
                            </div>

                            <div class="pata-progress-section">
                                <div class="pata-progress-labels">
                                    <span>Solicitud enviada</span>
                                    <span>En revisión...</span>
                                </div>
                                <div class="pata-progress-bar-container">
                                    <div class="pata-progress-bar-fill" id="pata-missing-progress-bar"></div>
                                </div>
                            </div>

                            <div class="pata-info-missing-box">
                                <div class="pata-upload-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                </div>
                                <div class="pata-info-text-card">
                                    <h3>Información faltante en el registro de <strong>${pet.name}</strong></h3>
                                    <p>
                                        ${needsCert ? 'Al ser senior (10+ años), necesitamos conocer cómo se encuentra hoy para completar su registro sin que tu membresía se vea afectada.' : 'Vimos que subiste las fotos, pero falta una selfie contigo y tu perrito. Esta imagen es obligatoria para validar el registro.'}
                                    </p>
                                </div>
                            </div>

                            <div class="pata-btn-group">
                                <button class="pata-btn pata-btn-primary" onclick="window.open('https://wa.me/5215555555555', '_blank')">
                                    Contactar a soporte
                                </button>
                                <a href="https://www.pataamiga.mx/pets/pet-waiting-period#beneficios" class="pata-btn pata-btn-outline">
                                    Revisar beneficios
                                </a>
                            </div>

                            ${this.renderInReviewBenefits()}

                            <div class="pata-badge">
                                <span class="pata-badge-icon">🛡️</span>
                                <div class="pata-badge-content">
                                    <strong>Control total de tu cuenta</strong>
                                    <p>Recuerda que puedes cancelar tu membresía en cualquier momento desde tu panel sin complicaciones.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderUploadSuccess() {
            return `
                <div class="pata-unified-panel show" style="text-align: center; padding: 60px 40px; border: 2px solid #4CAF50;">
                    <div style="font-size: 80px; margin-bottom: 20px;">✅</div>
                    <h2 class="pata-title" style="color: #4CAF50; margin-bottom: 15px;">¡Gracias!</h2>
                    <p style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-bottom: 10px;">
                        Hemos recibido tus fotos correctamente.
                    </p>
                    <p style="font-size: 16px; color: #666;">
                        Tu solicitud ahora está lista para ser revisada por nuestro equipo.<br>
                        En unos segundos serás redirigido a tu estatus actualizado.
                    </p>
                </div>
            `;
        }

        checkMissingPhotosReady(pet) {
            const isSenior = pet.age_value >= 10;
            const needsPhoto1 = !(pet.photo_url || pet.primary_photo_url);
            const needsCert = isSenior && !pet.vet_certificate_url;

            let ready = true;
            if (needsPhoto1 && !this.missingPhotosFiles.photo1) ready = false;
            if (needsCert && !this.missingPhotosFiles.cert) ready = false;

            const submitBtn = document.getElementById('pata-btn-submit-missing');
            const statusText = document.getElementById('pata-upload-status');

            if (submitBtn) {
                submitBtn.disabled = !ready;
                if (ready) {
                    submitBtn.style.opacity = '1';
                    if (statusText) statusText.innerText = '¡Todo listo! Ya puedes enviar la información.';
                } else {
                    submitBtn.style.opacity = '0.5';
                }
            }
        }

        attachMissingPhotosEvents(pet) {
            this.setupMissingPhotoUpload('pata-missing-upload-1', 'pata-missing-file-1', 'photo1', pet);
            this.setupMissingPhotoUpload('pata-missing-upload-cert', 'pata-missing-file-cert', 'cert', pet);

            const submitBtn = document.getElementById('pata-btn-submit-missing');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const isSenior = pet.age_value >= 10;

                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Subiendo información...';

                    try {
                        let photo1Url = null;
                        let vetCertificateUrl = null;

                        if (this.missingPhotosFiles.photo1) {
                            photo1Url = await this.uploadPhoto(this.missingPhotosFiles.photo1);
                        }

                        if (this.missingPhotosFiles.cert) {
                            vetCertificateUrl = await this.uploadPhoto(this.missingPhotosFiles.cert);
                        }

                        submitBtn.innerText = 'Actualizando mascota...';

                        const updateRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/${pet.id}/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: this.member.id,
                                photo1Url: photo1Url,
                                vetCertificateUrl: vetCertificateUrl,
                                message: 'Fotos subidas post-registro' + (isSenior ? ' (incluye certificado senior)' : '')
                            })
                        });

                        const updateData = await updateRes.json();
                        if (updateData.success) {
                            // Mostrar pantalla de éxito
                            this.container.innerHTML = this.renderUploadSuccess();
                            setTimeout(() => {
                                location.reload();
                            }, 3500);
                        } else {
                            throw new Error(updateData.error);
                        }
                    } catch (e) {
                        console.error('Error uploading missing photos:', e);
                        alert('Error: ' + e.message);
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Enviar información';
                    }
                };
            }
        }

        setupMissingPhotoUpload(areaId, fileId, key, pet) {
            const area = document.getElementById(areaId);
            const input = document.getElementById(fileId);
            if (area && input) {
                area.onclick = () => input.click();
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.missingPhotosFiles[key] = file;
                        area.classList.add('has-file');
                        const isImage = file.type.startsWith('image/');

                        // Neo-Brutalist update for area
                        area.innerHTML = `
                            <div style="font-size: 32px; margin-bottom: 10px;">${isImage ? '✅' : '📎'}</div>
                            <div style="font-weight: 800; font-size: 14px; color: #1A1A1A;">${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}</div>
                            <div style="font-size: 12px; color: #15BEB2; font-weight: 700; margin-top: 5px;">¡listo para enviar!</div>
                        `;

                        this.checkMissingPhotosReady(pet);
                    }
                };
            }
        }

        attachEvents() {
            // Tab switch
            this.container.querySelectorAll('.pata-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    this.currentIndex = parseInt(btn.dataset.idx);
                    this.showAppealForm = false;
                    this.render();
                };
            });

            // Delegación de eventos para el contenedor
            this.container.onclick = (e) => {
                const detailsBtn = e.target.closest('.pata-btn-ver-detalles');
                if (detailsBtn) {
                    const petId = detailsBtn.dataset.petId;
                    // Buscar la mascota por ID (más robusto para botones fuera del tab actual)
                    const pet = petId ? this.pets.find(p => p.id === petId) : this.pets[this.currentIndex];
                    if (!pet) return;

                    const modalHtml = this.renderPetDetailsModal(pet);
                    const modalDiv = document.createElement('div');
                    modalDiv.id = 'pata-details-modal-wrapper';
                    modalDiv.innerHTML = modalHtml;
                    document.body.appendChild(modalDiv);
                    document.body.classList.add('pata-no-scroll');

                    // Close events
                    const close = () => {
                        modalDiv.remove();
                        document.body.classList.remove('pata-no-scroll');
                    };

                    const closeBtn1 = document.getElementById('pata-close-details');
                    const closeBtn2 = document.getElementById('pata-close-details-btn');
                    if (closeBtn1) closeBtn1.onclick = close;
                    if (closeBtn2) closeBtn2.onclick = close;

                    // 🆕 Initialize Chat
                    this.fetchAndRenderChat(pet.id);

                    const modalOverlay = document.getElementById('pata-pet-details-modal');
                    if (modalOverlay) {
                        modalOverlay.onclick = (ev) => {
                            if (ev.target.id === 'pata-pet-details-modal') close();
                        };

                        // 📂 Mobile Accordion Manual Toggle (Fix for certain browsers)
                        const summary = modalOverlay.querySelector('.pata-mobile-accordion summary');
                        const details = modalOverlay.querySelector('.pata-mobile-accordion');
                        if (summary && details) {
                            summary.onclick = (ev) => {
                                // Let native happen but ensure it's not blocked
                                console.log('Summary clicked');
                            };
                        }
                    }
                }
            };



            // 🆕 Eventos para carga de fotos en apelación
            this.setupAppealPhotoUpload('pata-appeal-upload-1', 'pata-appeal-file-1', 'pata-appeal-preview-1', 'photo1');
            this.setupAppealPhotoUpload('pata-appeal-upload-2', 'pata-appeal-file-2', 'pata-appeal-preview-2', 'photo2');

            // Submit appeal (con fotos opcionales)
            const submitBtn = document.getElementById('pata-btn-submit-appeal');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const textarea = document.getElementById('pata-textarea-appeal');
                    const msg = textarea?.value || '';
                    if (msg.trim().length < 10) return alert('Por favor describe tu caso con más detalle (mínimo 10 caracteres).');

                    // Obtener petId del data-attribute o del índice actual
                    const petId = submitBtn.dataset.petId || this.pets[this.currentIndex]?.id;
                    if (!petId) return alert('Error: No se pudo identificar la mascota.');

                    submitBtn.innerText = 'Enviando...';
                    submitBtn.disabled = true;

                    try {
                        // 1. Subir fotos si las hay
                        let photo1Url = null;
                        let photo2Url = null;

                        if (this.appealFiles?.photo1) {
                            submitBtn.innerText = 'Subiendo foto 1...';
                            photo1Url = await this.uploadPhoto(this.appealFiles.photo1);
                        }
                        if (this.appealFiles?.photo2) {
                            submitBtn.innerText = 'Subiendo foto 2...';
                            photo2Url = await this.uploadPhoto(this.appealFiles.photo2);
                        }

                        submitBtn.innerText = 'Enviando apelación...';

                        // 2. Enviar apelación
                        let res, data;
                        try {
                            res = await fetch(`${CONFIG.apiUrl}/api/user/appeal`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    memberId: this.member.id,
                                    petId: petId,
                                    appealMessage: msg
                                })
                            });

                            const contentType = res.headers.get("content-type");
                            if (contentType && contentType.indexOf("application/json") !== -1) {
                                data = await res.json();
                            } else {
                                // Si no es JSON (ej: 500 HTML de Vercel), lanzar error
                                const text = await res.text();
                                console.error('Respuesta no JSON:', text.substring(0, 100)); // Loguear para debug
                                throw new Error(`Error del servidor (${res.status}). Por favor contacta soporte.`);
                            }

                            if (!res.ok) {
                                throw new Error(data.error || 'Error al enviar la apelación.');
                            }

                        } catch (networkError) {
                            console.error('Error de red/servidor:', networkError);
                            alert(`❌ ${networkError.message || 'Error de conexión. Verifica tu internet.'}`);
                            submitBtn.innerText = 'Enviar Apelación';
                            submitBtn.disabled = false;
                            return;
                        }

                        // 3. Si hay fotos nuevas, actualizar la mascota
                        if (photo1Url || photo2Url) {
                            submitBtn.innerText = 'Actualizando fotos...';

                            const updateRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/${petId}/update`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: this.member.id,
                                    photo1Url: photo1Url,
                                    photo2Url: photo2Url,
                                    message: `Apelación con nuevas fotos: ${msg.substring(0, 100)}...`
                                })
                            });

                            if (!updateRes.ok) {
                                console.warn('No se pudieron actualizar las fotos, pero la apelación fue enviada');
                            }
                        }

                        alert('✅ Apelación enviada correctamente. Nuestro equipo la revisará pronto.');
                        location.reload();

                    } catch (e) {
                        console.error('Error sending appeal:', e);
                        alert(`❌ ${e.message || 'Error de conexión. Verifica tu internet e intenta nuevamente.'}`);
                        submitBtn.innerText = 'Enviar Apelación';
                        submitBtn.disabled = false;
                    }
                };
            }


            // 🆕 Abrir modal desde banner opcional
            const openUpdateCertBtn = document.getElementById('pata-btn-open-update-cert');
            console.log('🔍 Unified Widget: Buscando botón de documentos:', !!openUpdateCertBtn);
            if (openUpdateCertBtn) {
                openUpdateCertBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('🎯 Unified Widget: Abriendo modal de documentos...');
                    this.showUpdateModal = true;
                    this.uploadFiles = { photo1: null, photo2: null, photo3: null, photo4: null, photo5: null, cert: null };
                    const pet = this.pets[this.currentIndex];
                    
                    // Eliminar modal anterior si existe
                    const existing = document.getElementById('pata-update-modal');
                    if (existing) existing.remove();
                    
                    document.body.insertAdjacentHTML('beforeend', this.renderUpdateModal(pet));
                    this.attachModalEvents();
                };
            }
        }

        // 🆕 Eventos específicos del modal
        attachModalEvents() {
            document.body.classList.add('pata-no-scroll');
            // Cerrar modal
            const closeBtn = document.getElementById('pata-modal-close');
            const cancelBtn = document.getElementById('pata-btn-cancel-update');
            const closeModal = () => {
                const modal = document.getElementById('pata-update-modal');
                if (modal) modal.remove();
                this.showUpdateModal = false;
                document.body.classList.remove('pata-no-scroll');
            };
            if (closeBtn) closeBtn.onclick = closeModal;
            if (cancelBtn) cancelBtn.onclick = closeModal;

            // Click outside to close
            const overlay = document.getElementById('pata-update-modal');
            if (overlay) {
                overlay.onclick = (e) => {
                    if (e.target === overlay) closeModal();
                };
            }

            // Upload areas (Dynamic for 5 photos)
            const setupUpload = (areaId, fileId, key) => {
                const area = document.getElementById(areaId);
                const input = document.getElementById(fileId);
                if (area && input) {
                    area.onclick = () => input.click();
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            this.uploadFiles[key] = file;
                            area.classList.add('has-file');
                            const isImage = file.type.startsWith('image/');
                            const objectUrl = URL.createObjectURL(file);
                            
                            area.innerHTML = `
                                <div style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px;">
                                    ${isImage ? 
                                        `<img src="${objectUrl}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 20px; border: 3px solid #000; box-shadow: 4px 4px 0 rgba(0,0,0,0.1); margin-bottom: 10px;">` : 
                                        `<div style="width: 100px; height: 100px; background: #fff; border: 3px solid #00BBB4; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; box-shadow: 4px 4px 0 rgba(0,187,180,0.1);">
                                            <span style="font-size: 40px;">📄</span>
                                        </div>`
                                    }
                                    <div style="font-size: 13px; font-weight: 800; color: #000; font-family: 'Outfit', sans-serif; text-align: center; text-transform: lowercase;">
                                        ✓ ${key === 'cert' ? 'certificado cargado' : 'foto ' + key.replace('photo', '') + ' cargada'}
                                    </div>
                                    <button type="button" class="pata-remove-file" style="position: absolute; top: 10px; right: 10px; background: #000; color: #fff; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; z-index: 10;">&times;</button>
                                </div>
                            `;

                            // Listener para remover archivo
                            const removeBtn = area.querySelector('.pata-remove-file');
                            if (removeBtn) {
                                removeBtn.onclick = (event) => {
                                    event.stopPropagation();
                                    this.uploadFiles[key] = null;
                                    area.classList.remove('has-file');
                                    area.innerHTML = `
                                        <input type="file" accept="${key === 'cert' ? '.pdf,image/*' : 'image/*'}" class="pata-upload-input" id="${fileId}" style="display:none;" />
                                        <div class="pata-upload-icon" style="font-size: 32px; margin-bottom: 8px;">${key === 'cert' ? '📄' : '📷'}</div>
                                        <div class="pata-upload-text" style="font-size: 14px; font-weight: 800; text-transform: lowercase; font-family: 'Outfit', sans-serif; color: ${key === 'cert' ? '#00BBB4' : '#000'};">${key === 'cert' ? 'subir pdf o imagen' : 'seleccionar foto'}</div>
                                    `;
                                    // Re-vincular el input ya que se recreó el HTML
                                    setupUpload(areaId, fileId, key);
                                };
                            }
                        }
                    };
                }
            };
            
            // Vincular inputs iniciales
            [1, 2, 3, 4, 5].forEach(num => {
                setupUpload(`pata-upload-area-${num}`, `pata-file-${num}`, `photo${num}`);
            });
            setupUpload('pata-upload-area-cert', 'pata-file-cert', 'cert');

            // Submit update
            const submitBtn = document.getElementById('pata-btn-submit-update');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const hasFiles = [1, 2, 3, 4, 5].some(num => this.uploadFiles[`photo${num}`]) || this.uploadFiles.cert;
                    if (!hasFiles) {
                        return alert('Por favor selecciona al menos un archivo para subir.');
                    }

                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Subiendo archivos...';
                    this.uploading = true;

                    try {
                        const pet = this.pets[this.currentIndex];

                        let photoUrls = [null, null, null, null, null];
                        let vetCertificateUrl = null;

                        // Subir fotos
                        for (let i = 1; i <= 5; i++) {
                            if (this.uploadFiles[`photo${i}`]) {
                                submitBtn.innerText = `Subiendo foto ${i}...`;
                                const formData = new FormData();
                                formData.append('file', this.uploadFiles[`photo${i}`]);
                                formData.append('userId', this.member.id);
                                const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                                    method: 'POST',
                                    body: formData
                                });
                                const data = await res.json();
                                if (data.success) {
                                    photoUrls[i - 1] = data.url;
                                } else {
                                    throw new Error(`Error al subir foto ${i}: ` + (data.error || 'Error desconocido'));
                                }
                            }
                        }

                        // Subir certificado (si aplica)
                        if (this.uploadFiles.cert) {
                            submitBtn.innerText = 'Subiendo certificado...';
                            const formData = new FormData();
                            formData.append('file', this.uploadFiles.cert);
                            formData.append('userId', this.member.id);
                            const res = await fetch(`${CONFIG.apiUrl}/api/upload/pet-photo`, {
                                method: 'POST',
                                body: formData
                            });
                            const data = await res.json();
                            if (data.success) {
                                vetCertificateUrl = data.url;
                            } else {
                                throw new Error('Error al subir certificado: ' + (data.error || 'Error desconocido'));
                            }
                        }

                        submitBtn.innerText = 'Guardando...';
                        const message = document.getElementById('pata-update-message')?.value || '';

                        // Actualizar mascota
                        const updateRes = await fetch(`${CONFIG.apiUrl}/api/user/pets/${pet.id}/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: this.member.id,
                                photo1Url: photoUrls[0],
                                photo2Url: photoUrls[1],
                                photo3Url: photoUrls[2],
                                photo4Url: photoUrls[3],
                                photo5Url: photoUrls[4],
                                vetCertificateUrl,
                                message
                            })
                        });

                        const updateData = await updateRes.json();
                        console.log('📥 Respuesta API:', updateData);

                        if (updateData.success) {
                            alert('✅ ' + updateData.message);
                            location.reload();
                        } else {
                            throw new Error(updateData.error || 'Error desconocido en servidor');
                        }
                    } catch (e) {
                        console.error('❌ Error en proceso de actualización:', e);
                        alert('Error: ' + e.message);
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Enviar Actualización';
                    }
                    this.uploading = false;

                };
            }
        }

        // 🆕 Configurar carga de fotos en formulario de apelación
        setupAppealPhotoUpload(areaId, fileId, previewId, photoKey) {
            const area = document.getElementById(areaId);
            const fileInput = document.getElementById(fileId);
            const preview = document.getElementById(previewId);

            if (!area || !fileInput) return;

            // Inicializar objeto de archivos de apelación si no existe
            if (!this.appealFiles) {
                this.appealFiles = { photo1: null, photo2: null };
            }

            // Click en área activa el input
            area.onclick = () => fileInput.click();

            // Cambio de archivo
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Guardar referencia
                    this.appealFiles[photoKey] = file;

                    // Mostrar preview
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (preview) {
                            const isImage = file.type.startsWith('image/');
                            preview.innerHTML = `
                                ${isImage ? `<img src="${ev.target.result}" style="max-width:100%; max-height:80px; border-radius:4px; object-fit:cover;">` : `<div style="width:100%; height:80px; background:#f5f5f5; border-radius:4px; display:flex; align-items:center; justify-content:center;"><span style="font-size:30px;">📄</span></div>`}
                                <p style="margin:5px 0 0 0; font-size:11px; color:#4CAF50;">✓ ${file.name.substring(0, 15)}...</p>
                            `;
                        }
                        area.style.borderColor = '#4CAF50';
                        area.style.background = '#f0fff0';
                    };
                    reader.readAsDataURL(file);
                }
            };

            // Drag and drop robustness
            const preventDefaults = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                area.addEventListener(eventName, preventDefaults, false);
            });

            // Highlight functionality
            area.ondragenter = () => {
                area.style.borderColor = CONFIG.brandColor;
                area.style.background = '#e0f7fa';
            };
            area.ondragover = () => {
                area.style.borderColor = CONFIG.brandColor;
                area.style.background = '#e0f7fa';
            };
            area.ondragleave = () => {
                area.style.borderColor = '#ddd';
                area.style.background = '#fff';
            };
            area.ondrop = (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            };
        }

        // 🆕 Subir foto a Supabase Storage
        async uploadPhoto(file) {
            // Validación Cliente: Formato y Tamaño
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                if (file.type === 'image/webp') {
                    throw new Error('Formato WebP no soportado. Por favor usa JPG o PNG.');
                }
                throw new Error(`Formato ${file.type} no soportado. Solo JPG, PNG o PDF.`);
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                throw new Error('El archivo excede 10MB. Por favor comprímelo o usa un archivo más pequeño.');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', this.member.id);

            const res = await fetch(`${CONFIG.apiUrl}/api/user/upload-pet-photo`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success && data.url) {
                return data.url;
            } else {
                throw new Error(data.error || 'Error subiendo foto');
            }
        }

        // 🆕 Mostrar historial de apelaciones en un modal
        async showAppealHistory(petId) {
            const pet = this.pets.find(p => p.id === petId);
            const petName = pet?.name || 'Mascota';

            // Crear modal de carga
            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:100000; display:flex; align-items:center; justify-content:center; padding:20px;';
            modal.innerHTML = `
                <div style="background:#fff; border-radius:16px; padding:30px; max-width:500px; width:100%; max-height:80vh; overflow:auto; position:relative;">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:36px; height:36px; border-radius:50%; font-size:18px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
                    <h2 style="margin:0 0 20px 0; font-size:20px; font-weight:700;">📜 Historial de ${petName}</h2>
                    <div id="pata-history-content" style="color:#888; text-align:center; padding:30px;">Cargando historial...</div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            try {
                console.log(`📡 Historial: Consultando para petId=${petId}, memberId=${this.member?.id}`);
                const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal-history?memberId=${this.member.id}&petId=${petId}`);

                if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status}`);
                }

                const data = await res.json();
                console.log('📥 Historial recibido:', data);

                const contentDiv = document.getElementById('pata-history-content');
                if (!data.success || !data.logs || data.logs.length === 0) {
                    contentDiv.innerHTML = '<p style="color:#888;">No hay historial de apelaciones para esta mascota.</p>';
                    return;
                }

                // Renderizar logs
                contentDiv.innerHTML = data.logs.map(log => {
                    const logDate = log.date ? new Date(log.date) : new Date();
                    const dateStr = logDate.toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    const isFromAdmin = log.isFromAdmin;
                    const bgColor = isFromAdmin ? '#E3F2FD' : '#E8F5E9';
                    const borderColor = isFromAdmin ? '#1976D2' : '#4CAF50';
                    const label = isFromAdmin ? '👤 Equipo Pata Amiga' : '🐾 Tú';

                    return `
                        <div style="background:${bgColor}; border-left:3px solid ${borderColor}; padding:12px; border-radius:0 8px 8px 0; margin-bottom:12px; text-align:left;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-weight:600; font-size:12px; color:#424242;">${log.icon || '📋'} ${label}</span>
                                <span style="font-size:11px; color:#888;">${dateStr}</span>
                            </div>
                            <p style="margin:0; font-size:14px; color:#1A1A1A;">${log.message}</p>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error('❌ Error cargando historial:', err);
                const contentDiv = document.getElementById('pata-history-content');
                if (contentDiv) {
                    contentDiv.innerHTML = `
                        <p style="color:#C62828; margin-bottom:10px;">Error al cargar el historial.</p>
                        <p style="font-size:11px; color:#666;">Detalle: ${err.message}</p>
                        <button onclick="location.reload()" style="background:#888; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Reintentar</button>
                    `;
                }
            }
        }

        async handlePetUnsubscribe(petId, petIndex, petName) {
            const reason = await this.showUnsubscribeReasons(petName);
            if (!reason) return;
            const confirm = await this.showUnsubscribeConfirm(petName);
            if (!confirm) return;
            this.showGlobalLoader('Procesando baja...');
            try {
                const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/unsubscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberId: this.member.id, petId, petIndex, petName, reason })
                });
                const data = await res.json();
                if (data.success) {
                    alert(`La baja de ${petName} se ha procesado correctamente.`);
                    window.location.reload();
                } else alert('Error: ' + (data.error || 'Inténtalo más tarde.'));
            } catch (err) { alert('Ocurrió un error inesperado.'); } finally { this.hideGlobalLoaders(); }
        }

        showUnsubscribeReasons(petName) {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'pata-modal-overlay show';
                modal.style.zIndex = '1000000';
                modal.innerHTML = `<div class="pata-modal" style="max-width: 450px;"><div style="padding: 40px;"><h2 style="font-family: 'Fraiche', sans-serif; font-size: 28px; margin-bottom: 10px; text-align: center; color: #000;">razones de la baja</h2><p style="text-align: center; color: #666; margin-bottom: 30px; font-weight: 600;">Lamentamos que ${petName} deje la manada.</p><div class="pata-reasons-list"><div class="pata-reason-item" data-reason="fallecimiento">🕊️ Por fallecimiento</div><div class="pata-reason-item" data-reason="ya no vive conmigo">🏠 Ya no vive conmigo</div><div class="pata-reason-item" data-reason="otra">❓ Otra</div></div><div id="pata-other-reason-container" style="display: none; margin-top: 15px;"><textarea id="pata-other-reason-text" placeholder="Describe el motivo..." style="width: 100%; height: 80px; border: 2px solid #000; border-radius: 15px; padding: 12px; font-family: 'Outfit';"></textarea></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px;"><button id="pata-cancel-unsubscribe" class="pata-btn" style="background: #eee; color: #000; border: 2px solid #000;">cancelar</button><button id="pata-confirm-reason" class="pata-btn" style="background: var(--pata-primary); color: #fff; border: 2px solid #000;">continuar</button></div></div></div>`;
                document.body.appendChild(modal);
                let selectedReason = '';
                modal.querySelectorAll('.pata-reason-item').forEach(item => {
                    item.onclick = () => {
                        modal.querySelectorAll('.pata-reason-item').forEach(i => i.classList.remove('selected'));
                        item.classList.add('selected');
                        selectedReason = item.dataset.reason;
                        document.getElementById('pata-other-reason-container').style.display = selectedReason === 'otra' ? 'block' : 'none';
                    };
                });
                document.getElementById('pata-cancel-unsubscribe').onclick = () => { modal.remove(); resolve(null); };
                document.getElementById('pata-confirm-reason').onclick = () => {
                    if (!selectedReason) return alert('Selecciona una razón.');
                    let finalReason = selectedReason;
                    if (selectedReason === 'otra') {
                        const other = document.getElementById('pata-other-reason-text').value.trim();
                        if (!other) return alert('Describe el motivo.');
                        finalReason = `Otra: ${other}`;
                    }
                    modal.remove(); resolve(finalReason);
                };
            });
        }

        showUnsubscribeConfirm(petName) {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'pata-modal-overlay show';
                modal.style.zIndex = '1000000';
                modal.innerHTML = `<div class="pata-modal" style="max-width: 450px;"><div style="padding: 40px; text-align: center;"><div style="font-size: 50px; margin-bottom: 20px;">⚠️</div><h2 style="font-family: 'Fraiche', sans-serif; font-size: 28px; margin-bottom: 15px; color: #000;">confirmar baja</h2><p style="color: #333; font-weight: 700; font-size: 16px; margin-bottom: 25px;">Proceder a confirmar baja de <strong>${petName}</strong>. <br>Recuerda que con esta acción podrás proteger a otro de tus peludos.</p><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;"><button id="pata-no-confirm" class="pata-btn" style="background: #eee; color: #000; border: 2px solid #000;">no, volver</button><button id="pata-yes-confirm" class="pata-btn" style="background: #c62828; color: #fff; border: 2px solid #000;">sí, dar de baja</button></div></div></div>`;
                document.body.appendChild(modal);
                document.getElementById('pata-no-confirm').onclick = () => { modal.remove(); resolve(false); };
                document.getElementById('pata-yes-confirm').onclick = () => { modal.remove(); resolve(true); };
            });
        }
    }

    // Auto init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.pataWidget = new UnifiedWidget('pata-amiga-membership-widget');
        });
    } else {
        window.pataWidget = new UnifiedWidget('pata-amiga-membership-widget');
    }

})();
