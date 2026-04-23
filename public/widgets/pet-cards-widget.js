/**
 * 🐾 Club Pata Amiga - Pet Cards Widget (Simplified - Cards Only)
 */

(function () {
    'use strict';

    const CONFIG = {
        apiUrl: window.PATA_AMIGA_CONFIG?.apiUrl || 'https://app.pataamiga.mx',
        maxPets: 3,
        placeholderDog: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png',
        statusColors: {
            approved: { bg: '#E8F5E9', text: '#2E7D32', label: 'APROBADA', icon: '✅' },
            pending: { bg: '#FFF3E0', text: '#EF6C00', label: 'PENDIENTE', icon: '⏳' },
            rejected: { bg: '#FFEBEE', text: '#C62828', label: 'RECHAZADA', icon: '❌' },
            action_required: { bg: '#E3F2FD', text: '#1565C0', label: 'ACCION REQUERIDA', icon: '⚠️' },
            appealed: { bg: '#F3E5F5', text: '#7B1FA2', label: 'APELADA', icon: '⚖️' },
            incomplete: { bg: '#FFF9E6', text: '#D97706', label: 'COMPLETAR PERFIL', icon: '⚠️' }
        }
    };

    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fraiche&display=swap');

        .pata-widget-container {
            font-family: 'Outfit', sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .pata-manada-title {
            font-size: 80px;
            font-weight: 900;
            color: #FFBD12;
            margin: 0 0 40px 0;
            line-height: 0.9;
            letter-spacing: -2px;
        }

        /* Cards Grid */
        .pata-cards-grid {
            display: flex;
            flex-direction: row;
            gap: 25px;
            justify-content: flex-start;
            align-items: flex-start;
            flex-wrap: wrap;
        }

        /* Pet Card - Square Premium */
        .pata-pet-card {
            background: #fff;
            border-radius: 40px;
            width: 260px;
            height: 260px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            box-sizing: border-box;
        }
        .pata-pet-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }

        /* Photo Container Wrapper - Teals background */
        .pata-card-photo-wrapper {
            width: 100%;
            height: 100%;
            background: #00BBB4;
            border-radius: 30px;
            overflow: hidden;
            position: relative;
        }
        
        .pata-card-photo-wrapper img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover;
            display: block;
        }

        /* Status & Info Overlays */
        .pata-card-overlay-status {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255,255,255,0.9);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 800;
            z-index: 5;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .pata-card-overlay-name {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 6px 20px;
            border-radius: 30px;
            font-weight: 800;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 5;
            white-space: nowrap;
        }

        /* Add Card - Dashed Square */
        .pata-add-card {
            width: 260px;
            height: 260px;
            background: #FFFFFF;
            border: 2px dashed #E0E0E0;
            border-radius: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-sizing: border-box;
            padding: 20px;
        }
        .pata-add-card:hover { border-color: #FFBD12; transform: translateY(-10px); background: #fdfdfd; }

        .pata-add-icon-circle {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 4px solid #FFBD12;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFBD12;
            font-size: 40px;
            font-weight: 400;
            margin-bottom: 20px;
        }

        .pata-add-text-title {
            font-size: 18px;
            font-weight: 700;
            color: #A0A0A0;
            margin: 0 0 8px 0;
        }

        .pata-add-text-subtitle {
            font-size: 11px;
            color: #C0C0C0;
            margin: 0;
            font-weight: 500;
        }

        /* Modal Redesign */

        .material-symbols-outlined {
            text-transform: none !important;
            font-family: 'Material Symbols Outlined' !important;
            display: inline-block;
            vertical-align: middle;
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .pata-modal-overlay {
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(24, 26, 46, 0.4); z-index: 100000; 
            display: flex; align-items: center; justify-content: center; padding: 20px;
            backdrop-filter: blur(8px);
            animation: pataFadeIn 0.3s ease-out;
        }
        .pata-modal-box {
            background: #fff; border-radius: 40px; 
            position: relative; max-width: 900px; width: 100%;
            box-shadow: 0 30px 60px rgba(0,0,0,0.15);
            font-family: 'Outfit', sans-serif;
            overflow: hidden;
            display: flex;
            max-height: 90vh;
            animation: pataSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pata-modal-main {
            display: flex;
            width: 100%;
            height: 100%;
        }

        /* Left Section: Gallery */
        .pata-modal-gallery {
            width: 40%;
            background: #F4F2FF;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow-y: auto;
        }

        .pata-gallery-main {
            aspect-ratio: 1;
            width: 100%;
            border-radius: 24px;
            overflow: hidden;
            background: #fff;
            position: relative;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .pata-gallery-main img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .pata-gallery-main:hover img {
            transform: scale(1.05);
        }

        .pata-gallery-label {
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(4px);
            padding: 4px 12px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            font-weight: 800;
            color: #00677D;
            text-transform: uppercase;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .pata-gallery-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        /* Right Section: Info */
        .pata-modal-info {
            width: 60%;
            padding: 32px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            overflow-y: auto;
            position: relative;
        }

        .pata-info-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .pata-pet-name {
            font-family: 'Fraiche', sans-serif;
            font-size: 40px;
            color: #00677D;
            margin: 0;
            line-height: 1;
            text-transform: lowercase;
        }

        .pata-pet-breed-info {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #4A5568;
            font-size: 14px;
            font-weight: 600;
            margin-top: 4px;
        }

        .pata-close-modal {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #EDECFF;
            border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s; color: #718096;
        }

        .pata-close-modal:hover {
            background: #E6E6FF; color: #2D3748; transform: rotate(90deg);
        }

        .pata-badge-row {
            display: flex; flex-wrap: wrap; gap: 8px;
        }

        .pata-badge {
            padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 800;
            text-transform: uppercase; display: flex; align-items: center; gap: 6px;
        }

        /* Info Card */
        .pata-info-card {
            background: #F4F2FF; border-radius: 24px; padding: 24px;
            border: 1px solid rgba(109, 121, 126, 0.1);
        }

        .pata-info-card-title {
            font-size: 10px; font-weight: 800; color: #718096;
            text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;
        }

        .pata-info-grid {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
        }

        .pata-info-item {
            display: flex; align-items: center; gap: 12px;
        }

        .pata-info-icon-wrap {
            width: 36px; height: 36px; border-radius: 12px; background: #fff;
            display: flex; align-items: center; justify-content: center; color: #00677D;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05); flex-shrink: 0;
        }

        .pata-info-texts {
            display: flex; flex-direction: column;
        }

        .pata-info-label {
            font-size: 9px; font-weight: 800; color: #718096; text-transform: uppercase;
            line-height: 1; margin-bottom: 2px;
        }

        .pata-info-value {
            font-size: 14px; font-weight: 700; color: #1A1A1E; line-height: 1.2;
        }

        /* Vet Banner */
        .pata-vet-banner {
            background: rgba(74, 182, 167, 0.08);
            border: 2px dashed rgba(74, 182, 167, 0.3);
            border-radius: 24px; padding: 20px;
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
            margin-top: auto;
        }

        .pata-vet-banner-left {
            display: flex; align-items: center; gap: 16px;
        }

        .pata-vet-icon-main {
            width: 44px; height: 44px; border-radius: 50%; background: #4AB6A7; color: #fff;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(74, 182, 167, 0.2);
        }

        .pata-vet-texts h4 {
            font-size: 11px; font-weight: 800; color: #00433C; margin: 0; text-transform: uppercase;
        }

        .pata-vet-texts p {
            font-size: 11px; color: rgba(0, 67, 60, 0.7); margin: 2px 0 0 0;
        }

        .pata-vet-btn {
            background: #006A60; color: #fff; padding: 10px 20px; border-radius: 50px;
            font-size: 12px; font-weight: 700; text-decoration: none;
            display: flex; align-items: center; gap: 8px; transition: all 0.2s; border: none; cursor: pointer; white-space: nowrap;
        }

        .pata-vet-btn:hover { background: #005048; transform: scale(1.02); }

        /* Story/Alert Cards */
        .pata-alert-card {
            background: #FFF9E6; border: 1px solid #FFD000; border-radius: 24px; padding: 20px; 
            display: flex; gap: 16px; align-items: center; margin-bottom: 8px;
        }

        .pata-story-card {
            background: #F1F8E9; border-radius: 24px; padding: 24px; border: 1px solid #C8E6C9; margin-bottom: 8px;
        }

        .pata-notes-card {
            background: #FFFDE7; border-radius: 24px; padding: 24px; border: 1px solid #FFF59D; margin-bottom: 8px;
        }

        .pata-modal-upload-box {
            aspect-ratio: 1; border-radius: 16px; border: 2px dashed #CBD5E0; background: #fff;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s; position: relative;
        }

        .pata-modal-upload-box:hover {
            border-color: #00BBB4; background: #F7FAFC;
        }

        /* Utils */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* ==========================================================================
           RESPONSIVE - MODAL REDESIGN
           ========================================================================== */

        /* Tablet & Large Mobile */
        @media (max-width: 900px) {
            .pata-modal-box {
                max-width: 90%;
                width: 600px;
            }
            .pata-pet-name { font-size: 36px; }
        }

        /* Mobile Breakpoint (The Big Switch) */
        @media (max-width: 768px) {
            .pata-modal-overlay {
                padding: 0;
                align-items: flex-end; /* Slide up feel */
            }

            .pata-modal-box {
                flex-direction: column !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 92vh !important;
                max-height: 92vh !important;
                margin: 0 !important;
                border-radius: 30px 30px 0 0 !important;
                overflow-y: auto !important;
                background: #fff !important;
                animation: pataSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes pataSlideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }

            .pata-modal-main {
                display: flex !important;
                flex-direction: column !important;
                height: auto !important;
                width: 100% !important;
            }

            .pata-modal-gallery {
                width: 100% !important;
                min-height: auto !important;
                padding: 16px 20px 8px 20px !important;
                border-right: none !important;
                border-bottom: 1px solid rgba(0,0,0,0.05);
                flex: 0 0 auto !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 8px !important;
                box-sizing: border-box !important;
            }

            .pata-gallery-main {
                width: 100% !important;
                height: 140px !important;
                margin: 0 !important;
                border-radius: 20px !important;
            }

            .pata-gallery-grid { 
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                gap: 10px !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 4px 0 8px 0 !important;
                -webkit-overflow-scrolling: touch !important;
            }

            .pata-gallery-grid::-webkit-scrollbar {
                height: 4px !important;
            }

            .pata-gallery-grid::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.1) !important;
                border-radius: 10px !important;
            }

            .pata-modal-upload-box {
                flex: 0 0 70px !important;
                width: 70px !important;
                height: 70px !important;
                border-radius: 12px !important;
            }

            /* Adjust info section for visibility */
            .pata-modal-info {
                width: 100% !important;
                padding: 12px 20px 40px 20px !important;
                overflow-y: visible !important;
                flex: 1 1 auto !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 16px !important;
                box-sizing: border-box !important;
            }

            .pata-pet-name {
                font-size: 32px !important;
                margin-bottom: 2px !important;
                line-height: 1.1 !important;
            }

            .pata-info-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 12px !important;
                background: #F8F9FD !important;
                padding: 16px !important;
                border-radius: 20px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }

            .pata-info-item {
                padding: 0 !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
            }

            .pata-close-modal {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                z-index: 10000 !important;
                background: white !important;
                width: 48px !important;
                height: 48px !important;
                border-radius: 50% !important;
                box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
                border: 1px solid rgba(0,0,0,0.05) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                -webkit-tap-highlight-color: transparent !important;
            }
            
            .pata-close-modal span {
                font-size: 24px !important;
                color: #1E293B !important;
            }

            /* Banners & Cards in Mobile */
            .pata-vet-banner {
                flex-direction: column !important;
                text-align: center !important;
                padding: 20px !important;
            }
            .pata-vet-banner-left {
                flex-direction: column !important;
                align-items: center !important;
            }
            .pata-vet-btn {
                width: 100% !important;
                justify-content: center !important;
            }

            .pata-alert-card, .pata-notes-card, .pata-story-card {
                padding: 20px !important;
            }
        }

        /* Very Small Devices */
        @media (max-width: 380px) {
            .pata-info-grid {
                grid-template-columns: 1fr !important; /* Single column for very narrow screens */
            }
            .pata-gallery-main { height: 200px !important; }
        }

        /* Responsive - Grid */
        @media (max-width: 750px) {
            .pata-cards-grid { justify-content: center; }
            .pata-pet-card, .pata-add-card { width: 100%; max-width: 280px; height: 280px; }
            .pata-manada-title { font-size: 60px; text-align: center; }
        }

        /* Autocomplete Suggestions */
        .pata-autocomplete-wrapper { position: relative; }
        .pata-autocomplete-suggestions {
            position: absolute;
            top: 100%; left: 0; right: 0;
            background: #fff;
            border: 1px solid #E2E8F0;
            border-top: none;
            border-radius: 0 0 15px 15px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            display: none;
        }
        .pata-autocomplete-suggestions.active { display: block; }
        .pata-autocomplete-suggestion {
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            color: #4A5568;
            border-bottom: 1px solid #EDF2F7;
            transition: all 0.2s;
        }
        .pata-autocomplete-suggestion:hover { background: #F7FAFC; color: #00BBB4; }
        .pata-autocomplete-suggestion:last-child { border-bottom: none; border-radius: 0 0 15px 15px; }

        .pata-breed-wrapper { position: relative; grid-column: 1 / -1; }
        .pata-breed-suggestions {
            position: absolute; top: 100%; left: 0; right: 0;
            background: #fff; border: 1px solid #ddd; border-top: none;
            border-radius: 0 0 8px 8px; max-height: 200px; overflow-y: auto;
            z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: none;
        }
        .pata-breed-suggestions.active { display: block; }
        .pata-breed-suggestion {
            padding: 10px 12px; cursor: pointer; font-size: 13px;
            border-bottom: 1px solid #f0f0f0; transition: background 0.15s;
        }
        .pata-breed-suggestion:hover { background: #f5f5f5; }
        .pata-breed-suggestion:last-child { border-bottom: none; }
        .pata-breed-suggestion.selected { background: #E8F5E9; }
            margin-top: 8px; border-radius: 0 8px 8px 0; font-size: 11px; color: #666;
        }
        /* 🆕 Multi-step Form Styles */
        .pata-step-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 25px; justify-content: center; }
        .pata-step-dot { width: 10px; height: 10px; border-radius: 50%; background: #E0E0E0; transition: all 0.3s ease; }
        .pata-step-dot.active { background: #15BEB2; width: 30px; border-radius: 10px; }
        .pata-step-label { font-size: 12px; font-weight: 700; color: #A0A0A0; margin-left: 5px; text-transform: uppercase; }

        .pata-type-sel { display: flex; gap: 15px; margin-bottom: 20px; }
        .pata-type-btn {
            flex: 1; padding: 20px; border: 2px solid #F0F0F0; border-radius: 25px;
            background: #FFF; cursor: pointer; text-align: center; transition: all 0.3s;
            font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px; color: #1A1A1A;
        }
        .pata-type-btn:hover { border-color: #15BEB2; transform: translateY(-2px); }
        .pata-type-btn.active { border-color: #15BEB2; background: #F0FEFE; box-shadow: 0 8px 20px rgba(21,190,178,0.1); }
        .pata-type-icon { font-size: 40px; display: block; margin-bottom: 10px; }

        .pata-age-row { display: flex; gap: 10px; align-items: flex-start; }
        .pata-age-input-group { flex: 1; }
        .pata-age-input { width: 100% !important; height: 55px; border-radius: 50px; border: 2px solid #F0F0F0; padding: 0 25px; font-size: 16px; box-sizing: border-box; outline: none; transition: border-color 0.3s; }
        .pata-age-input:focus { border-color: #15BEB2; }
        
        .pata-unit-toggle {
            display: flex; gap: 2px; background: #F7F7F7; padding: 4px; border-radius: 50px; 
            border: 2px solid #F0F0F0; height: 55px; box-sizing: border-box;
        }
        .pata-unit-btn {
            padding: 0 20px; border: none; border-radius: 50px; background: transparent;
            color: #718096; font-family: inherit; font-size: 14px; font-weight: 700;
            cursor: pointer; transition: all 0.2s; white-space: nowrap; height: 100%;
        }
        .pata-unit-btn.active { background: #15BEB2; color: #fff; box-shadow: 0 2px 8px rgba(21,190,178,0.2); }

        .pata-info-box {
            background: #F0FEFE; border: 1.5px solid #7DD8D5; border-radius: 20px;
            padding: 15px 20px; margin-top: 15px; display: flex; gap: 12px;
            align-items: center; animation: pataSlideDown 0.3s ease-out;
        }
        .pata-info-box.senior { background: #FFF9E6; border-color: #FBD38D; }
        .pata-info-box.error { background: #FFF5F5; border-color: #FEB2B2; }
        .pata-info-icon { font-size: 20px; }
        .pata-info-text { font-size: 13px; color: #2D3748; line-height: 1.4; margin: 0; }
        .pata-info-text strong { color: #234E52; }
        .pata-info-box.senior .pata-info-text strong { color: #744210; }
        .pata-info-box.error .pata-info-text { color: #C53030; }
        .pata-info-box.error .pata-info-text strong { color: #9B2C2C; }
        
        /* 🚨 UI/UX PRO MAX: FORCED VERTICAL LAYOUT FOR MOBILE OPTIMIZATION */
        .pata-form-row { display: flex; flex-direction: column; gap: 15px; margin-bottom: 15px; }
        
        .pata-form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
        .pata-form-label { font-size: 13px; font-weight: 700; color: #4A4A4A; }
        .pata-form-input, .pata-form-select, .pata-form-textarea {
            width: 100%; padding: 14px 20px; border: 2px solid #F0F0F0; border-radius: 50px;
            font-family: inherit; font-size: 15px; outline: none; box-sizing: border-box; transition: border-color 0.3s;
        }
        .pata-form-textarea { border-radius: 20px; resize: none; height: 80px; }
        .pata-form-input:focus, .pata-form-select:focus, .pata-form-textarea:focus { border-color: #15BEB2; }

        /* Breed/Type Switch Premium */
        .pata-breed-type-switch {
            display: flex; background: #fff; border: 2px solid #F0F0F0;
            border-radius: 16px; padding: 6px; gap: 6px; margin-bottom: 15px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .pata-switch-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            gap: 8px; padding: 12px; border: none; border-radius: 12px;
            background: transparent; color: #718096; font-family: inherit;
            font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .pata-switch-btn.active { background: #15BEB2; color: #fff; box-shadow: 0 4px 12px rgba(21,190,178,0.2); }
        .pata-switch-icon { display: flex; align-items: center; justify-content: center; }

        /* Adoption Section Premium */
        .pata-adoption-section {
            background: linear-gradient(135deg, #E6FFFA 0%, #B2F5EA 100%);
            border: 2px solid #7DD8D5; border-radius: 20px; padding: 20px; margin: 10px 0 20px 0;
            animation: pataFadeIn 0.3s ease-out;
        }
        .pata-adoption-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
        .pata-adoption-icon {
            font-size: 24px; width: 44px; height: 44px; background: #fff;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 187, 180, 0.1);
        }
        .pata-adoption-title { font-weight: 800; font-size: 15px; color: #234E52; margin: 0; }
        .pata-adoption-subtitle { font-size: 12px; color: #4A7C7F; margin: 2px 0 0 0; }
        .pata-adoption-checkbox-wrapper {
            background: rgba(255, 255, 255, 0.6); border-radius: 12px; padding: 12px 15px;
            display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
        }
        .pata-adoption-checkbox-wrapper:hover { background: rgba(255, 255, 255, 0.8); }
        .pata-adoption-checkbox { width: 22px; height: 22px; accent-color: #15BEB2; cursor: pointer; }
        .pata-adoption-checkbox-text { font-size: 14px; font-weight: 700; color: #2D3748; }
        
        .pata-adoption-story-wrapper {
            background: rgba(255, 255, 255, 0.9); border-radius: 16px; padding: 15px;
            margin-top: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); animation: pataSlideDown 0.3s ease-out;
        }
        .pata-adoption-story-label {
            display: flex; align-items: center; gap: 8px; font-weight: 800;
            font-size: 14px; color: #1a365d; margin-bottom: 10px;
        }
        .pata-adoption-textarea {
            width: 100%; padding: 12px; border: 1.5px solid #E2E8F0; border-radius: 14px;
            font-family: inherit; font-size: 14px; resize: vertical; min-height: 100px;
            box-sizing: border-box; transition: all 0.2s;
        }
        .pata-adoption-textarea:focus { border-color: #7DD8D5; outline: none; background: #fff; }



        .pata-upload-box {
            border: 2px dashed #CBD5E0; border-radius: 25px; padding: 30px; text-align: center;
            cursor: pointer; transition: all 0.3s; background: #FAFAFA; position: relative; overflow: hidden;
            display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .pata-upload-box:hover { border-color: #7DD8D5; background: rgba(125, 216, 213, 0.05); }
        .pata-upload-box.has-file { border-style: solid; border-color: #9FD406; background: #F6FFF6; }
        .pata-upload-box.small { padding: 15px; border-radius: 20px; min-height: 110px; height: 110px; }
        .pata-upload-box.small .pata-upload-icon { font-size: 20px; margin-bottom: 2px; }
        .pata-upload-box.small .pata-upload-text { font-size: 10px; }
        .pata-upload-preview { width: 100%; max-height: 120px; object-fit: contain; border-radius: 12px; }
        .pata-upload-icon { font-size: 32px; }
        .pata-upload-text { font-size: 13px; font-weight: 700; color: #4A5568; margin: 0; }
        .pata-upload-subtext { font-size: 11px; color: #718096; margin: 0; }
        
        .pata-alert-box {
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            border: 2px solid #F59E0B; border-radius: 16px;
            padding: 15px; margin-bottom: 20px; display: flex; gap: 12px; align-items: flex-start;
        }
        .pata-alert-icon { font-size: 22px; flex-shrink: 0; }
        .pata-alert-text { font-size: 13px; color: #92400E; line-height: 1.4; }
        .pata-alert-text strong { display: block; color: #92400E; margin-bottom: 4px; font-size: 14px; font-weight: 800; }

        .pata-btn-row { display: flex; gap: 15px; margin-top: 25px; }
        .pata-btn {
            flex: 1; padding: 16px 20px; border: 2px solid #000; border-radius: 50px;
            font-family: inherit; font-weight: 800; font-size: 16px; cursor: pointer; transition: all 0.3s;
        }
        .pata-btn-primary { background: #FE8F15; color: #FFF; }
        .pata-btn-secondary { background: #00BBB4; color: #FFF; }
        .pata-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .pata-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        @keyframes pataFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pataSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pataSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Referral Validation Colors */
        .pata-referral-msg { font-size: 11px; margin-top: 5px; font-weight: 600; min-height: 14px; }
        .pata-referral-msg.success { color: #38A169; }
        .pata-referral-msg.error { color: #E53E3E; }
        .pata-referral-msg.loading { color: #718096; font-style: italic; }
        .pata-form-input.valid { border-color: #38A169; background: #F0FFF4; }
        .pata-form-input.invalid { border-color: #E53E3E; background: #FFF5F5; }
    `;

    class ManadaWidget {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.member = null;
            this.pets = [];
            this.msFields = {};
            if (!this.container) return;
            this.init();
        }

        async init() {
            this.injectStyles();
            this.container.innerHTML = `<div style="text-align:center; padding: 40px; color:#888; font-family:'Outfit',sans-serif;">🐾 Cargando...</div>`;

            try {
                await this.waitForMemberstack();
                if (!this.member) {
                    this.container.innerHTML = '<div style="text-align:center; padding: 40px; color:#888;">Inicia sesión para ver tus mascotas.</div>';
                    return;
                }
                await this.loadData();
                this.render();
            } catch (err) {
                console.error('Widget Error:', err);
            }
        }

        injectStyles() {
            if (document.getElementById('pata-cards-styles')) return;
            const style = document.createElement('style');
            style.id = 'pata-cards-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
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
                            this.msFields = data?.customFields || {};
                            resolve();
                        });
                    } else if (attempts > 100) { clearInterval(check); resolve(); }
                }, 100);
            });
        }

        async loadData() {
            const res = await fetch(`${CONFIG.apiUrl}/api/user/pets?userId=${this.member.id}`);
            const data = await res.json();
            if (data.success) {
                this.pets = data.pets || [];
            }
        }

        getPetStatusContext(pet) {
            const ageNum = parseInt(pet.age_value) || 0;
            const isSenior = pet.is_senior || (pet.age_unit === 'months' ? Math.floor(ageNum/12) : ageNum) >= 10;
            
            // Check for missing photos - ONLY primary photo is mandatory
            const primaryPhotoUrl = pet.photo_url || pet.primary_photo_url;
            const hasPrimaryPhoto = primaryPhotoUrl && primaryPhotoUrl.startsWith('http');

            const isMissingPhotos = !hasPrimaryPhoto;
            const isMissingCert = isSenior && !pet.vet_certificate_url;

            // Updated status logic: Prioritize missing documentation for UX clarity
            // If it's missing photos or certificate, it should show specific action label regardless of database status
            if (isMissingCert) {
                return { ...CONFIG.statusColors.incomplete, label: 'CERTIFICADO PENDIENTE', isMissingCert: true };
            }
            if (isMissingPhotos) {
                return { ...CONFIG.statusColors.incomplete, label: 'COMPLETAR FOTOS', isMissingPhotos: true };
            }

            // Normal flow statuses
            if (pet.status === 'pending') {
                return { ...CONFIG.statusColors.pending, label: 'EN REVISIÓN' };
            }

            if (pet.status === 'approved') {
                return { ...CONFIG.statusColors.approved, label: 'APROBADA' };
            }

            return { ...CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending };
        }

        render() {
            const petCards = this.pets.map((pet, idx) => this.createPetCardHtml(pet, idx + 1)).join('');
            const addCard = this.pets.length < CONFIG.maxPets ? this.createAddCardHtml() : '';

            this.container.innerHTML = `
                <div class="pata-widget-container">
                    <h1 class="pata-manada-title">mi manada</h1>
                    <div class="pata-cards-grid">
                        ${petCards}
                        ${addCard}
                    </div>
                </div>
            `;
        }

        createPetCardHtml(pet, index) {
            const statusContext = this.getPetStatusContext(pet);
            const msPhotoUrl = this.msFields[`pet-${index}-photo-1-url`];
            const imageUrl = pet.primary_photo_url || pet.photo_url || msPhotoUrl || CONFIG.placeholderDog;

            return `
                <div class="pata-pet-card" onclick="window.ManadaWidget.showDetails('${pet.id}')">
                    <div class="pata-card-photo-wrapper">
                        <div class="pata-card-overlay-status" style="background: ${statusContext.bg}; color: ${statusContext.text};">
                            ${statusContext.icon} ${statusContext.label}
                        </div>
                        <img src="${imageUrl}" alt="${pet.name}" onerror="this.src='${CONFIG.placeholderDog}';">
                        <div class="pata-card-overlay-name">${pet.name}</div>
                    </div>
                </div>
            `;
        }

        createAddCardHtml() {
            return `
                <div class="pata-add-card" onclick="if(window.ManadaWidget) window.ManadaWidget.showAddForm()">
                    <div class="pata-add-icon-circle">+</div>
                    <h3 class="pata-add-text-title">Agregar otro peludo</h3>
                    <p class="pata-add-text-subtitle">Periodo de carencia de 6 meses</p>
                </div>
            `;
        }

        showDetails(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;
            const status = CONFIG.statusColors[pet.status] || CONFIG.statusColors.pending;

            // Dates formatting
            const registrationDate = pet.created_at ? new Date(pet.created_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', year: 'numeric'
            }) : 'No disponible';

            const activationDate = pet.waiting_period_end ? new Date(pet.waiting_period_end).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', year: 'numeric'
            }) : '---';

            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'pata-modal-overlay';
            modalOverlay.id = 'pata-details-modal';
            
            // Lock body scroll
            document.body.style.overflow = 'hidden';

            // Close on backdrop click
            modalOverlay.onclick = (e) => {
                if (e.target === modalOverlay) this.closeModal(modalOverlay);
            };

            // Close on Escape key
            const escListener = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal(modalOverlay);
                    document.removeEventListener('keydown', escListener);
                }
            };
            document.addEventListener('keydown', escListener);

            // Photo Gallery Logic
            const photoSlots = [
                pet.photo_url || pet.primary_photo_url,
                pet.photo2_url,
                pet.photo3_url,
                pet.photo4_url,
                pet.photo5_url
            ];

            const typeLower = (pet.type || pet.pet_type || '').toLowerCase();
            const isCat = typeLower === 'gato' || typeLower === 'cat';
            const petNickName = isCat ? 'michi' : 'peludo';
            const petTypeDisplay = isCat ? 'Gato' : 'Perro';
            const genderIcon = pet.gender === 'hembra' ? 'female' : 'male';
            const genderDisplay = pet.gender === 'macho' ? 'Macho' : pet.gender === 'hembra' ? 'Hembra' : 'No especificado';
            
            const ageValue = pet.age_value || pet.age || '';
            const ageUnit = pet.age_unit === 'months' ? 'meses' : 'años';
            const ageNum = parseInt(ageValue) || 0;
            const isSenior = pet.is_senior || (pet.age_unit === 'months' ? Math.floor(ageNum/12) : ageNum) >= 10;
            const breedDisplay = pet.is_mixed_breed ? (isCat ? 'Doméstico' : 'Mestizo') : (pet.breed || 'Mestizo');

            // Badges
            const badges = [];
            if (pet.status === 'pending') badges.push({ text: 'EN REVISIÓN', bg: 'rgba(255, 183, 2, 0.2)', color: '#6B4B00', dot: true });
            if (pet.is_adopted) badges.push({ text: 'ADOPTADO', bg: 'rgba(74, 182, 167, 0.2)', color: '#00433C', icon: 'verified' });
            if (pet.is_mixed_breed) badges.push({ text: breedDisplay.toUpperCase(), bg: 'rgba(179, 235, 255, 0.3)', color: '#00677D' });
            if (isSenior) badges.push({ text: 'SENIOR', bg: 'rgba(109, 121, 126, 0.2)', color: '#3D494D' });

            // Alert Box for missing documents
            const statusContext = this.getPetStatusContext(pet);
            let alertHtml = '';
            if (statusContext.isMissingCert || statusContext.isMissingPhotos) {
                alertHtml = `
                    <div class="pata-alert-card">
                        <div style="font-size: 28px;">✨</div>
                        <div>
                            <p style="margin: 0; font-weight: 900; color: #D97706; font-size: 11px; text-transform: uppercase;">¡Casi listo!</p>
                            <p style="margin: 4px 0 0 0; color: #854D0E; font-size: 11px; line-height: 1.4; font-weight: 600;">
                                Recuerda subir los documentos faltantes para poder seguir protegiendo a tu <strong>${petNickName}</strong>. 
                                Tienes 15 días para completarlos y mantener todos sus beneficios activos. ¡Gracias por cuidarlo tanto! 🐾
                            </p>
                        </div>
                    </div>
                `;
            }

            modalOverlay.innerHTML = `
                <div class="pata-modal-box">
                    <main class="pata-modal-main">
                        <!-- Left: Gallery -->
                        <section class="pata-modal-gallery hide-scrollbar">
                            <div class="pata-gallery-main">
                                <img src="${photoSlots[0] || CONFIG.placeholderDog}" alt="${pet.name}" onerror="this.src='${CONFIG.placeholderDog}'">
                                <div class="pata-gallery-label">
                                    <span class="material-symbols-outlined" style="font-size:14px">photo_camera</span>
                                    <span>Foto Principal</span>
                                </div>
                            </div>
                            <div class="pata-gallery-grid">
                                ${photoSlots.slice(1).map((url, i) => {
                                    const num = i + 2;
                                    if (url && url.startsWith('http')) {
                                        return `
                                            <div style="aspect-ratio:1; border-radius:16px; overflow:hidden; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                                                <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
                                            </div>`;
                                    } else {
                                        return `
                                            <div class="pata-modal-upload-box" id="modal-photo-upload-${num}">
                                                <input type="file" accept="image/*" style="position:absolute; inset:0; opacity:0; cursor:pointer; z-index: 2;"
                                                    onchange="window.ManadaWidget.handleModalFileUpload('${pet.id}', 'photo${num}', this.files[0], 'modal-photo-upload-${num}')">
                                                <span class="material-symbols-outlined" style="font-size:24px; color:#A0AEC0">add_a_photo</span>
                                                <span style="font-size:9px; font-weight:800; color:#718096; text-transform:uppercase; margin-top:4px">Foto ${num}</span>
                                            </div>`;
                                    }
                                }).join('')}
                            </div>
                        </section>

                        <!-- Right: Info -->
                        <section class="pata-modal-info hide-scrollbar">
                            <header class="pata-info-header">
                                <div>
                                    <h2 class="pata-pet-name">${pet.name}</h2>
                                    <div class="pata-pet-breed-info">
                                        <span class="material-symbols-outlined" style="font-size:18px">pets</span>
                                        ${breedDisplay}
                                    </div>
                                </div>
                                <button class="pata-close-modal" onclick="window.ManadaWidget.closeModal(this.closest('.pata-modal-overlay'))">
                                    <span class="material-symbols-outlined">close</span>
                                </button>
                            </header>

                            <div class="pata-badge-row">
                                ${badges.map(b => `
                                    <span class="pata-badge" style="background:${b.bg}; color:${b.color}">
                                        ${b.dot ? `<span style="width:6px; height:6px; border-radius:50%; background:${b.color}"></span>` : ''}
                                        ${b.icon ? `<span class="material-symbols-outlined" style="font-size:14px; font-variation-settings:'FILL' 1">${b.icon}</span>` : ''}
                                        ${b.text}
                                    </span>
                                `).join('')}
                            </div>

                            ${alertHtml}

                            <div class="pata-info-card">
                                <h3 class="pata-info-card-title">Información General</h3>
                                <div class="pata-info-grid">
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">category</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Especie</span>
                                            <span class="pata-info-value">${petTypeDisplay}</span>
                                        </div>
                                    </div>
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">event</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Edad</span>
                                            <span class="pata-info-value">${ageValue} ${ageUnit}</span>
                                        </div>
                                    </div>
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">${genderIcon}</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Género</span>
                                            <span class="pata-info-value">${genderDisplay}</span>
                                        </div>
                                    </div>
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">palette</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Color Pelo</span>
                                            <span class="pata-info-value">${pet.coat_color || '---'}</span>
                                        </div>
                                    </div>
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">visibility</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Color Ojos</span>
                                            <span class="pata-info-value">${pet.eye_color || '---'}</span>
                                        </div>
                                    </div>
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">fiber_manual_record</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Color Nariz</span>
                                            <span class="pata-info-value">${pet.nose_color || '---'}</span>
                                        </div>
                                    </div>
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">login</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Ingreso</span>
                                            <span class="pata-info-value">${registrationDate}</span>
                                        </div>
                                    </div>
                                    <div class="pata-info-item">
                                        <div class="pata-info-icon-wrap"><span class="material-symbols-outlined">rocket_launch</span></div>
                                        <div class="pata-info-texts">
                                            <span class="pata-info-label">Activación</span>
                                            <span class="pata-info-value">${activationDate}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            ${pet.adoption_story ? `
                                <div class="pata-story-card">
                                    <p style="margin:0 0 8px 0; font-weight:800; color:#2E7D32; font-size:10px; text-transform:uppercase;">📜 Historia de adopción</p>
                                    <p style="margin:0; color:#333; font-size:14px; line-height:1.6; font-weight:600;">${pet.adoption_story}</p>
                                </div>
                            ` : ''}

                            ${pet.admin_notes ? `
                                <div class="pata-notes-card">
                                    <p style="margin:0 0 8px 0; font-weight:800; color:#F57F17; font-size:10px; text-transform:uppercase;">📝 Notas del equipo</p>
                                    <p style="margin:0; color:#333; font-size:14px; line-height:1.6; font-weight:600;">${pet.admin_notes}</p>
                                </div>
                            ` : ''}

                            <div class="pata-vet-banner">
                                <div class="pata-vet-banner-left">
                                    <div class="pata-vet-icon-main"><span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">medical_services</span></div>
                                    <div class="pata-vet-texts">
                                        <h4>INFORMACIÓN VETERINARIA</h4>
                                        <p>Historial médico completo y vacunas.</p>
                                    </div>
                                </div>
                                ${pet.vet_certificate_url ? 
                                    `<a href="${pet.vet_certificate_url}" target="_blank" class="pata-vet-btn">
                                        Ver Certificado <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span>
                                    </a>` : 
                                    `<div class="pata-vet-btn" style="position:relative; overflow:hidden; cursor:pointer;">
                                        <input type="file" accept=".pdf,image/*" style="position:absolute; inset:0; opacity:0; cursor:pointer; z-index:2" 
                                            onchange="window.ManadaWidget.handleModalFileUpload('${pet.id}', 'vet', this.files[0], 'modal-vet-upload-placeholder')">
                                        <span id="modal-vet-upload-placeholder">Subir Certificado</span>
                                        <span class="material-symbols-outlined" style="font-size:16px">upload</span>
                                    </div>`
                                }
                            </div>
                        </section>
                    </main>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        }

        closeModal(modalElement) {
            if (modalElement) {
                modalElement.remove();
                // Restore body scroll
                document.body.style.overflow = '';
            }
        }

        async saveAdoptionStory(petId) {
            const textarea = document.getElementById(`pata-add-story-${petId}`);
            const btn = document.getElementById(`pata-btn-story-${petId}`);
            if (!textarea || !btn) return;

            const content = textarea.value.trim();
            if (!content) {
                alert('Por favor escribe la historia antes de guardar.');
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
                        adoptionStory: content
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert('¡Historia guardada exitosamente!');
                    // Cerrar el modal actual
                    const modal = btn.closest('.pata-modal-overlay');
                    if (modal) modal.remove();
                    // Recargar los datos para refrescar la UI
                    this.init();
                } else {
                    alert('Error al guardar: ' + (data.error || 'Desconocido'));
                }
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error inesperado al guardar la historia.');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Guardar historia';
                btn.style.opacity = '1';
            }
        }

        showAddForm() {
            this.addStep = 1;
            this.addFormData = { 
                petType: '', name: '', ageValue: '', ageUnit: 'years', gender: '', 
                breedType: 'raza', breed: '', isMixed: false,
                coatColor: '', noseColor: '', eyeColor: '', 
                isAdopted: false, adoptionStory: '',
                referralCode: '', referralName: '', isReferralValid: false
            };
            this.uploadedPhotoUrl = null;
            this.uploadedVetUrl = null;

            // Inicializar caches una sola vez por sesión de "Añadir mascota"
            this.breedsCache = { perro: [], gato: [] };
            this.colorsCache = {
                coat: { perro: [], gato: [] },
                nose: { perro: [], gato: [] },
                eye: { perro: [], gato: [] }
            };
            
            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.id = 'pata-add-modal';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `<div class="pata-modal-box" id="pata-add-content" style="max-width:550px; max-height:90vh; overflow-y:auto;"></div>`;
            document.body.appendChild(modal);
            
            this.renderAddStep();
        }

        renderAddStep() {
            const content = document.getElementById('pata-add-content');
            if (!content) return;
            
            if (this.addStep === 1) this.renderStep1(content);
            else this.renderStep2(content);
        }

        renderStep1(container) {
            const d = this.addFormData;
            container.innerHTML = `
                <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer; z-index:10;" onclick="this.closest('.pata-modal-overlay').remove()">&times;</button>
                <h2 style="text-align:center; font-weight:900; font-size:28px; margin:0 0 20px 0; color:#1A1A1A;">🐾 Nueva mascota</h2>
                
                <div class="pata-step-indicator">
                    <div class="pata-step-dot active"></div>
                    <div class="pata-step-dot"></div>
                    <span class="pata-step-label">Paso 1 de 2</span>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Tipo de mascota *</label>
                    <div class="pata-type-sel">
                        <button type="button" class="pata-type-btn ${d.petType==='perro'?'active':''}" data-type="perro"><span class="pata-type-icon">🐶</span>Perro</button>
                        <button type="button" class="pata-type-btn ${d.petType==='gato'?'active':''}" data-type="gato"><span class="pata-type-icon">🐱</span>Gato</button>
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label" id="name-label">${d.petType==='gato'?'¿Cómo se llama tu michi?':'¿Cómo se llama tu peludo?'} *</label>
                    <input class="pata-form-input" id="add-name" value="${d.name}" placeholder="Ej: Luna, Max, Pelusa...">
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Edad *</label>
                    <div class="pata-age-row">
                        <div class="pata-age-input-group">
                            <input class="pata-age-input" id="add-age-val" type="number" min="0" value="${d.ageValue}" placeholder="Ej: 3">
                        </div>
                        <div class="pata-unit-toggle">
                            <button type="button" class="pata-unit-btn ${d.ageUnit==='years'?'active':''}" data-unit="years">Años</button>
                            <button type="button" class="pata-unit-btn ${d.ageUnit==='months'?'active':''}" data-unit="months">Meses</button>
                        </div>
                    </div>
                    <div id="pata-age-info" style="margin-top: 10px;"></div>
                </div>

                <div class="pata-btn-row">
                    <button class="pata-btn pata-btn-primary" id="add-next">Continuar →</button>
                </div>`;

            // Events
            container.querySelectorAll('.pata-type-btn').forEach(btn => {
                btn.onclick = () => {
                    d.petType = btn.dataset.type;
                    container.querySelectorAll('.pata-type-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('name-label').innerText = d.petType === 'gato' ? '¿Cómo se llama tu michi? *' : '¿Cómo se llama tu peludo? *';
                };
            });

            // Age Unit Toggle Events
            container.querySelectorAll('.pata-unit-btn').forEach(btn => {
                btn.onclick = () => {
                    const newUnit = btn.dataset.unit;
                    if (d.ageUnit === newUnit) return;
                    
                    // Convert value logic (optional but nice)
                    let currentVal = parseInt(document.getElementById('add-age-val').value) || 0;
                    if (d.ageUnit === 'years' && newUnit === 'months') {
                        currentVal = currentVal * 12;
                    } else if (d.ageUnit === 'months' && newUnit === 'years') {
                        currentVal = Math.floor(currentVal / 12);
                    }
                    
                    d.ageUnit = newUnit;
                    document.getElementById('add-age-val').value = currentVal;
                    
                    container.querySelectorAll('.pata-unit-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updateAgeFeedback();
                };
            });

            const updateAgeFeedback = () => {
                const ageVal = parseInt(document.getElementById('add-age-val').value) || 0;
                const infoDiv = document.getElementById('pata-age-info');
                if (!infoDiv) return;

                if (ageVal <= 0) {
                    infoDiv.innerHTML = '';
                    return;
                }

                const totalMonths = d.ageUnit === 'years' ? ageVal * 12 : ageVal;
                const isSenior = totalMonths >= 120; // 10 years

                if (totalMonths < 4) {
                    infoDiv.innerHTML = `
                        <div class="pata-info-box error">
                            <span class="pata-info-icon">❌</span>
                            <p class="pata-info-text">
                                La edad mínima de tu peludo debe ser superior a <strong>4 meses</strong> para poder registrarse.
                            </p>
                        </div>
                    `;
                } else if (isSenior) {
                    infoDiv.innerHTML = `
                        <div class="pata-info-box">
                            <span class="pata-info-icon">💡</span>
                            <p class="pata-info-text">
                                Como es un peludito senior (10+ años), más adelante te vamos a pedir un poco más de información sobre su estado de salud actual. 🐾💙
                            </p>
                        </div>
                    `;
                } else {
                    infoDiv.innerHTML = `
                        <div class="pata-info-box">
                            <span class="pata-info-icon">💡</span>
                            <p class="pata-info-text">
                                ¡Perfecto! La foto de tu mascota la podrás subir en el siguiente paso. 
                                <strong>Tienes 15 días para hacerlo.</strong>
                            </p>
                        </div>
                    `;
                }
            };

            document.getElementById('add-age-val').oninput = updateAgeFeedback;
            updateAgeFeedback(); // Initial call

            document.getElementById('add-next').onclick = () => {
                const name = document.getElementById('add-name').value.trim();
                const age = document.getElementById('add-age-val').value;
                if (!d.petType) return alert('Selecciona si es perro o gato');
                if (!name) return alert('El nombre es requerido');
                if (!age || age < 0) return alert('Ingresa una edad válida');
                
                const totalMonths = d.ageUnit === 'years' ? parseInt(age) * 12 : parseInt(age);
                if (totalMonths < 4) return alert('La edad mínima de tu peludo debe ser superior a 4 meses para poder registrarse.');
                
                d.name = name;
                d.ageValue = age;
                // d.ageUnit already updated by toggle clicks

                this.addStep = 2;
                this.renderAddStep();
            };
        }

        renderStep2(container) {
            const d = this.addFormData;
            const isGato = d.petType === 'gato';
            const ageNum = d.ageUnit === 'years' ? parseInt(d.ageValue) : Math.floor(parseInt(d.ageValue)/12);
            
            // Lógica Senior: Unificado a 10 años
            const isSenior = ageNum >= 10;

            container.innerHTML = `
                <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer; z-index:10;" onclick="this.closest('.pata-modal-overlay').remove()">&times;</button>
                <h2 style="text-align:center; font-weight:900; font-size:28px; margin:0 0 20px 0; color:#1A1A1A;">Datos de ${d.name}</h2>
                
                <div class="pata-step-indicator">
                    <div class="pata-step-dot"></div>
                    <div class="pata-step-dot active"></div>
                    <span class="pata-step-label">Paso 2 de 2</span>
                </div>

                <div class="pata-form-row">
                    <div class="pata-form-group">
                        <label class="pata-form-label">Sexo *</label>
                        <select class="pata-form-select" id="add-gender">
                            <option value="">Selecciona...</option>
                            <option value="macho" ${d.gender==='macho'?'selected':''}>Macho</option>
                            <option value="hembra" ${d.gender==='hembra'?'selected':''}>Hembra</option>
                        </select>
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Tipo *</label>
                    <div class="pata-breed-type-switch">
                        <button type="button" class="pata-switch-btn ${d.breedType==='mestizo'?'active':''}" data-bt="mestizo">
                            ${d.breedType==='mestizo' ? '<span class="pata-switch-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : ''}
                            ${isGato ? 'Doméstico' : 'Mestizo'}
                        </button>
                        <button type="button" class="pata-switch-btn ${d.breedType==='raza'?'active':''}" data-bt="raza">
                            ${d.breedType==='raza' ? '<span class="pata-switch-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : ''}
                            Raza
                        </button>
                    </div>
                    <p style="font-size:11px; color:#A0A0A0; margin-top:-5px;">Selecciona si es ${isGato ? 'doméstico' : 'mestizo'} o de raza definida</p>
                </div>

                <div class="pata-form-group" id="breed-group" style="display:${d.breedType==='raza'?'block':'none'}">
                    <label class="pata-form-label">Raza *</label>
                    <div class="pata-breed-wrapper">
                        <input class="pata-form-input" id="pata-breed-input" value="${d.breed}" placeholder="Escribe para buscar..." autocomplete="off">
                        <div id="pata-breed-suggestions" class="pata-breed-suggestions"></div>
                        <div id="pata-breed-warning" class="pata-breed-warning" style="display:none;"></div>
                    </div>
                </div>


                <div class="pata-form-row">
                    <div class="pata-form-group">
                        <label class="pata-form-label">Color de pelo *</label>
                        <div class="pata-autocomplete-wrapper">
                            <input class="pata-form-input" id="add-coat" value="${d.coatColor}" placeholder="Ej: Café, Negro..." autocomplete="off">
                            <div id="pata-coat-suggestions" class="pata-autocomplete-suggestions"></div>
                        </div>
                    </div>
                    <div class="pata-form-group">
                        <label class="pata-form-label">Color de nariz</label>
                        <div class="pata-autocomplete-wrapper">
                            <input class="pata-form-input" id="add-nose" value="${d.noseColor}" placeholder="Ej: Negro, Rosado..." autocomplete="off">
                            <div id="pata-nose-suggestions" class="pata-autocomplete-suggestions"></div>
                        </div>
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label">Color de ojos</label>
                    <div class="pata-autocomplete-wrapper">
                        <input class="pata-form-input" id="add-eyes" value="${d.eyeColor}" placeholder="Ej: Miel, Azules..." autocomplete="off">
                        <div id="pata-eye-suggestions" class="pata-autocomplete-suggestions"></div>
                    </div>
                </div>

                <div class="pata-form-group">
                    <label class="pata-form-label" style="font-weight: 900; font-size: 18px; margin-bottom: 5px;">Álbum de fotos</label>
                    <p style="font-size: 13px; color: #666; margin-bottom: 20px;">Sube hasta 5 fotos para su perfil. Una buena foto ayuda a identificarlo mejor en caso de emergencia.</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                        ${[1,2,3,4,5].map(num => `
                            <div class="pata-upload-box small" id="photo-box-${num}" style="position: relative; overflow: hidden; height: 110px; border-radius: 20px;">
                                <input type="file" accept="image/*" class="pata-photo-input" data-num="${num}" style="position:absolute; inset:0; opacity:0; cursor:pointer; z-index: 2;">
                                <div class="pata-upload-content" style="text-align: center; padding: 10px;">
                                    <span class="pata-upload-icon" style="font-size: 20px; display: block; margin-bottom: 4px;">📷</span>
                                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase;">${num === 1 ? 'Principal *' : 'Foto ' + num}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="pata-adoption-section">
                    <div class="pata-adoption-header">
                        <div class="pata-adoption-icon">🏠</div>
                        <div>
                            <h4 class="pata-adoption-title">¿Tu mascota es adoptada?</h4>
                            <p class="pata-adoption-subtitle">Nos encantaría conocer su origen</p>
                        </div>
                    </div>

                    <div class="pata-adoption-checkbox-wrapper" id="adoption-toggle">
                        <input type="checkbox" class="pata-adoption-checkbox" id="add-adopted" ${d.isAdopted?'checked':''} style="pointer-events: none;">
                        <span class="pata-adoption-checkbox-text">¡Sí, es rescatada / adoptada!</span>
                    </div>

                    <div class="pata-adoption-story-wrapper" id="story-group" style="display:${d.isAdopted?'block':'none'}">
                        <label class="pata-adoption-story-label">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00BBB4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            Cuéntanos su historia
                        </label>
                        <textarea class="pata-adoption-textarea" id="add-story" placeholder="Ej: La encontramos en un refugio hace 2 años...">${d.adoptionStory}</textarea>
                        <p style="font-size:10px; color:#718096; margin-top:8px; line-height:1.3;">⚠️ <strong>AVISO:</strong> Al llenar la historia nos autorizas a publicarla en nuestras redes para inspirar a otros.</p>
                    </div>
                </div>



                <div class="pata-form-group">
                    <label class="pata-form-label">Código de Embajador (Opcional)</label>
                    <input class="pata-form-input ${d.referralCode ? (d.isReferralValid ? 'valid' : 'invalid') : ''}" 
                           id="add-referral-code" 
                           value="${d.referralCode}" 
                           placeholder="Ej: MARCOS24" 
                           style="text-transform: uppercase;">
                    <div id="referral-msg" class="pata-referral-msg ${d.isReferralValid ? 'success' : 'error'}">
                        ${d.referralName ? `✓ Embajador: ${d.referralName}` : ''}
                    </div>
                </div>

                ${isSenior ? `
                <div class="pata-form-group">
                    <label class="pata-form-label">Sobre su salud (Senior 10+ años)</label>
                    <div class="pata-upload-box" id="vet-box">
                        <input type="file" accept=".pdf,image/*" id="add-vet" style="position:absolute; inset:0; opacity:0; cursor:pointer;">
                        <div id="vet-preview-wrap">
                            ${this.uploadedVetUrl ? '<span class="pata-upload-icon">✅</span>' : '<span class="pata-upload-icon">📄</span>'}
                            <p class="pata-upload-text">${this.uploadedVetUrl ? '✓ Información lista' : 'Subir información de salud'}</p>
                            <p class="pata-upload-subtext">Como es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual para completar su registro. 🐾💙</p>
                        </div>
                    </div>
                </div>` : ''}


                <div class="pata-btn-row">
                    <button class="pata-btn pata-btn-secondary" id="add-back">← Atrás</button>
                    <button class="pata-btn pata-btn-primary" id="pata-save-btn">Registrar mascota ✓</button>
                </div>`;

            // Setup Events
            document.getElementById('add-back').onclick = () => { this.saveStep2Fields(); this.addStep = 1; this.renderAddStep(); };
            
            container.querySelectorAll('.pata-switch-btn').forEach(btn => {
                btn.onclick = () => {
                    d.breedType = btn.dataset.bt;
                    d.isMixed = (d.breedType === 'mestizo');
                    
                    if (d.breedType === 'raza') {
                        d.breed = ''; // Reset breed name to pick a new one
                    } else {
                        d.breed = isGato ? 'Doméstico' : 'Mestizo';
                    }
                    
                    this.saveStep2Fields();
                    this.renderStep2(container);
                };
            });

            document.getElementById('adoption-toggle').onclick = (e) => {
                const cb = document.getElementById('add-adopted');
                if (e.target !== cb) {
                    cb.checked = !cb.checked;
                }
                d.isAdopted = cb.checked;
                document.getElementById('story-group').style.display = d.isAdopted ? 'block' : 'none';
            };




            this.setupBreedAutocomplete(container);
            this.setupColorAutocomplete('add-coat', 'pata-coat-suggestions', 'coat');
            this.setupColorAutocomplete('add-nose', 'pata-nose-suggestions', 'nose');
            this.setupColorAutocomplete('add-eyes', 'pata-eye-suggestions', 'eye');
            this.setupFileUploads();
            this.setupReferralValidation();

            document.getElementById('pata-save-btn').onclick = (e) => {
                e.preventDefault();
                this.submitNewPet(isSenior);
            };
        }

        saveStep2Fields() {
            const d = this.addFormData;
            d.gender = document.getElementById('add-gender').value;
            d.coatColor = document.getElementById('add-coat').value;
            d.eyeColor = document.getElementById('add-eyes').value;
            d.noseColor = document.getElementById('add-nose').value;
            d.adoptionStory = document.getElementById('add-story') ? document.getElementById('add-story').value : '';

            d.referralCode = document.getElementById('add-referral-code').value.toUpperCase();
            if (d.breedType === 'raza') d.breed = document.getElementById('pata-breed-input').value;
        }

        setupReferralValidation() {
            const input = document.getElementById('add-referral-code');
            const msg = document.getElementById('referral-msg');
            if (!input || !msg) return;

            let debounceTimer;
            input.addEventListener('input', (e) => {
                const code = e.target.value.toUpperCase();
                this.addFormData.referralCode = code;
                clearTimeout(debounceTimer);

                if (!code) {
                    msg.innerHTML = '';
                    input.classList.remove('valid', 'invalid');
                    this.addFormData.isReferralValid = false;
                    this.addFormData.referralName = '';
                    return;
                }

                msg.innerHTML = 'Validando...';
                msg.className = 'pata-referral-msg loading';
                
                debounceTimer = setTimeout(async () => {
                    try {
                        const res = await fetch(`${CONFIG.apiUrl}/api/referrals/validate-code?code=${code}`);
                        const data = await res.json();
                        
                        if (data.success && data.valid) {
                            const ambassadorName = data.ambassador_name || 'Embajador';
                            msg.innerHTML = `✓ Embajador: ${ambassadorName}`;
                            msg.className = 'pata-referral-msg success';
                            input.classList.add('valid');
                            input.classList.remove('invalid');
                            this.addFormData.isReferralValid = true;
                            this.addFormData.referralName = ambassadorName;
                        } else {
                            msg.innerHTML = data.message || '❌ Código no válido';
                            msg.className = 'pata-referral-msg error';
                            input.classList.add('invalid');
                            input.classList.remove('valid');
                            this.addFormData.isReferralValid = false;
                            this.addFormData.referralName = '';
                        }
                    } catch (err) {
                        console.error('Referral validation catch:', err);
                        msg.innerHTML = '⚠️ Error al validar';
                        msg.className = 'pata-referral-msg error';
                    }
                }, 600);
            });
        }

        setupFileUploads() {
            // Multiple Pet Photos
            document.querySelectorAll('.pata-photo-input').forEach(input => {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const num = input.dataset.num;
                    const box = document.getElementById(`photo-box-${num}`);
                    const originalContent = box.innerHTML;
                    
                    box.innerHTML = '<div style="width:24px; height:24px; border:3px solid #eee; border-top-color:#15BEB2; border-radius:50%; animation:pataSpin 0.8s linear infinite; position: absolute; top: 50%; left: 50%; margin: -12px 0 0 -12px;"></div>';
                    
                    try {
                        const url = await this.uploadNewPetPhoto(file);
                        this.addFormData.photos = this.addFormData.photos || {};
                        this.addFormData.photos[`photo${num}`] = url;
                        
                        box.classList.add('has-file');
                        box.innerHTML = `
                            <input type="file" accept="image/*" class="pata-photo-input" data-num="${num}" style="position:absolute; inset:0; opacity:0; cursor:pointer; z-index: 2;">
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; font-size: 9px; padding: 4px; text-align: center; font-weight: 800;">✓ LISTA</div>
                        `;
                        this.setupFileUploads(); // Re-attach listeners for other inputs
                    } catch(err) { 
                        alert('Error subiendo foto'); 
                        box.innerHTML = originalContent;
                        this.setupFileUploads();
                    }
                };
            });

            const vetInput = document.getElementById('add-vet');
            if (vetInput) {
                vetInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const box = document.getElementById('vet-box');
                    const originalContent = box.innerHTML;
                    box.innerHTML = '<div style="width:30px; height:30px; border:3px solid #eee; border-top-color:#15BEB2; border-radius:50%; animation:pataSpin 0.8s linear infinite; margin:20px auto;"></div>';
                    try {
                        const url = await this.uploadNewPetPhoto(file);
                        this.uploadedVetUrl = url;
                        box.classList.add('has-file');
                        box.innerHTML = `<input type="file" accept=".pdf,image/*" id="add-vet" style="position:absolute; inset:0; opacity:0; cursor:pointer;" /><span class="pata-upload-icon">✅</span><p class="pata-upload-text">✓ Información lista</p><p class="pata-upload-subtext">Haz clic para cambiar</p>`;
                        this.setupFileUploads();
                    } catch(err) { 
                        alert('Error subiendo certificado'); 
                        box.innerHTML = originalContent;
                        this.setupFileUploads();
                    }
                };
            }
        }
        async setupBreedAutocomplete(container) {
            const input = document.getElementById('pata-breed-input');
            const suggestions = document.getElementById('pata-breed-suggestions');
            const warning = document.getElementById('pata-breed-warning');
            if (!input || !suggestions) return;

            const type = this.addFormData.petType;

            const load = async () => {
                if (this.breedsCache[type].length) return;
                try {
                    const res = await fetch(`${CONFIG.apiUrl}/api/breeds?type=${type}`);
                    const data = await res.json();
                    if (data.success) this.breedsCache[type] = data.breeds;
                } catch(e) { console.error('Error loading breeds', e); }
            };

            input.onfocus = async () => {
                await load();
                show('');
            };

            input.oninput = (e) => show(e.target.value);

            const show = (q) => {
                const list = this.breedsCache[type] || [];
                const filtered = q ? list.filter(b => b.name.toLowerCase().includes(q.toLowerCase())).slice(0,10) : list.slice(0,8);
                suggestions.innerHTML = filtered.map(b => {
                const displayName = (b.id === 'mestizo' && type === 'gato') ? 'Doméstico' : b.name;
                    return `<div class="pata-breed-suggestion" data-id="${b.id}" data-name="${b.name}" data-warning="${b.warning_message||''}">${displayName}</div>`;
                }).join('');
                suggestions.classList.add('active');
            };

            suggestions.onclick = (e) => {
                const item = e.target.closest('.pata-breed-suggestion');
                if (item) {
                    const displayName = item.innerText.trim();
                    input.value = displayName;
                    this.addFormData.breed = displayName;
                    suggestions.classList.remove('active');
                    if (item.dataset.warning) {
                        warning.innerHTML = item.dataset.warning;
                        warning.style.display = 'block';
                    } else {
                        warning.style.display = 'none';
                    }
                }
            };

            document.addEventListener('click', (e) => { if (!input.contains(e.target)) suggestions.classList.remove('active'); });
        }

        async setupColorAutocomplete(inputId, suggestionsId, category) {
            const input = document.getElementById(inputId);
            const suggestions = document.getElementById(suggestionsId);
            if (!input || !suggestions) return;

            const type = this.addFormData.petType;
            const apiType = type === 'perro' ? 'perro' : 'gato'; // El API espera perro/gato y lo mapea internamente a dog/cat

            const load = async () => {
                if (this.colorsCache[category][type].length) return;
                try {
                    const res = await fetch(`${CONFIG.apiUrl}/api/catalogs/coat-colors?petType=${apiType}&category=${category}`);
                    const data = await res.json();
                    if (data.success) {
                        this.colorsCache[category][type] = data.data;
                    }
                } catch(e) { console.error(`Error loading ${category} colors`, e); }
            };

            const show = (q) => {
                const list = this.colorsCache[category][type] || [];
                const filtered = q 
                    ? list.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10) 
                    : list.slice(0, 8);
                
                if (filtered.length === 0 && !q) {
                    suggestions.classList.remove('active');
                    return;
                }

                suggestions.innerHTML = filtered.map(c => `
                    <div class="pata-autocomplete-suggestion" data-name="${c.name}">
                        ${c.name}
                    </div>
                `).join('');
                suggestions.classList.add('active');
            };

            input.onfocus = async () => {
                await load();
                show(input.value);
            };

            input.oninput = (e) => show(e.target.value);

            suggestions.onclick = (e) => {
                const item = e.target.closest('.pata-autocomplete-suggestion');
                if (item) {
                    input.value = item.dataset.name;
                    // Update appropriate field in addFormData
                    if (category === 'coat') this.addFormData.coatColor = item.dataset.name;
                    if (category === 'nose') this.addFormData.noseColor = item.dataset.name;
                    if (category === 'eye') this.addFormData.eyeColor = item.dataset.name;
                    suggestions.classList.remove('active');
                }
            };

            document.addEventListener('click', (e) => { 
                if (!input.contains(e.target) && !suggestions.contains(e.target)) {
                    suggestions.classList.remove('active'); 
                }
            });
        }

        async submitNewPet(isSenior) {
            const btn = document.getElementById('pata-save-btn');
            this.saveStep2Fields();
            const d = this.addFormData;

            if (!d.gender) return alert('Selecciona el sexo');
            if (d.breedType === 'raza' && !d.breed) return alert('Selecciona una raza');
            if (!d.coatColor) return alert('Ingresa el color de pelo');

            // Las fotos y certificados ahora son opcionales con aviso de 15 días para completar


            btn.disabled = true;
            btn.innerText = 'Guardando...';

            try {
                const payload = {
                    memberstackId: this.member.id,
                    petData: {
                        name: d.name,
                        petType: d.petType,
                        ageValue: parseInt(d.ageValue),
                        ageUnit: d.ageUnit,
                        gender: d.gender,
                        breed: d.isMixed ? (d.petType === 'gato' ? 'Doméstico' : 'Mestizo') : d.breed,
                        isMixed: d.isMixed,
                        coatColor: d.coatColor,
                        noseColor: d.noseColor,
                        eyeColor: d.eyeColor,
                        isAdopted: d.isAdopted,
                        adoptionStory: d.adoptionStory,
                        photo1Url: d.photos?.photo1 || null,
                        photo2Url: d.photos?.photo2 || null,
                        photo3Url: d.photos?.photo3 || null,
                        photo4Url: d.photos?.photo4 || null,
                        photo5Url: d.photos?.photo5 || null,
                        isSenior: isSenior,
                        vetCertificateUrl: this.uploadedVetUrl,

                        referralCode: d.isReferralValid ? d.referralCode : ''
                    }
                };

                const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.success) {
                    alert('¡Mascota registrada! Revisaremos la información pronto.');
                    document.getElementById('pata-add-modal').remove();
                    this.init();
                } else {
                    alert('Error: ' + (data.error || 'No se pudo guardar'));
                    btn.disabled = false;
                    btn.innerText = 'Registrar mascota ✓';
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Ocurrió un error al guardar');
                btn.disabled = false;
                btn.innerText = 'Registrar mascota ✓';
            }
        }

        async uploadNewPetPhoto(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', this.member.id);

            const res = await fetch(`${CONFIG.apiUrl}/api/user/upload-pet-photo`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success && data.url) return data.url;
            throw new Error(data.error || 'Error subiendo archivo');
        }

        showAppealForm(petId) {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) return;
            const modal = document.createElement('div');
            modal.className = 'pata-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="pata-modal-box">
                    <button style="position:absolute; top:15px; right:15px; border:none; background:#f0f0f0; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer;" onclick="this.closest('.pata-modal-overlay').remove()">&times;</button>
                    <h2 style="text-align:center; font-weight:800; font-size:26px; margin:0 0 15px 0;">⚖️ Apelar para ${pet.name}</h2>
                    ${pet.admin_notes ? `<div style="background:#FFEBEE; padding:12px; border-radius:10px; margin-bottom:20px; border-left:4px solid #C62828;"><strong>Motivo del rechazo:</strong><br>${pet.admin_notes}</div>` : ''}
                    <form id="pata-appeal-form">
                        <p style="margin-bottom:10px; color:#666;">Explica por qué reconsiderar la decisión.</p>
                        <textarea id="pata-appeal-msg" required placeholder="Escribe tu mensaje..." style="width:100%; height:100px; padding:15px; border-radius:10px; border:1px solid #ddd; resize:none; font-family:inherit; font-size:14px;"></textarea>
                        <button type="submit" class="pata-btn pata-btn-primary" style="width:100%; height:55px; font-size:16px; background:#7B1FA2; margin-top:15px;" id="pata-appeal-btn">Enviar Apelación</button>
                    </form>
                </div>`;
            document.body.appendChild(modal);

            document.getElementById('pata-appeal-form').onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.getElementById('pata-appeal-btn');
                const msg = document.getElementById('pata-appeal-msg').value.trim();
                btn.disabled = true; btn.innerText = 'Enviando...';
                try {
                    const res = await fetch(`${CONFIG.apiUrl}/api/user/appeal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberId: this.member.id, petId, appealMessage: msg })
                    });
                    const data = await res.json();
                    if (data.success) { alert('¡Apelación enviada!'); modal.remove(); this.init(); }
                    else { alert('Error: ' + data.error); btn.disabled = false; btn.innerText = 'Enviar Apelación'; }
                } catch (err) { alert('Error de conexión'); btn.disabled = false; }
            };
        }

        async handleModalFileUpload(petId, type, file, elementId) {
            if (!file) return;
            const container = document.getElementById(elementId);
            const originalContent = container.innerHTML;
            
            // Show loading
            container.innerHTML = `
                <div style="width:30px; height:30px; border:3px solid #eee; border-top-color:#15BEB2; border-radius:50%; animation:pataSpin 0.8s linear infinite; margin:10px auto;"></div>
                <p style="font-size:12px; color:#666; font-weight:600;">Subiendo...</p>
            `;
            container.style.pointerEvents = 'none';

            try {
                // 1. Upload to storage
                const url = await this.uploadNewPetPhoto(file);
                
                // 2. Prepare payload
                const updateData = { userId: this.member.id };
                if (type === 'photo1') updateData.photo1Url = url;
                if (type === 'photo2') updateData.photo2Url = url;
                if (type === 'photo3') updateData.photo3Url = url;
                if (type === 'photo4') updateData.photo4Url = url;
                if (type === 'photo5') updateData.photo5Url = url;
                if (type === 'vet') updateData.vetCertificateUrl = url;

                // 3. Update in database
                const res = await fetch(`${CONFIG.apiUrl}/api/user/pets/${petId}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                const data = await res.json();
                if (data.success) {
                    container.innerHTML = `<span style="font-size:30px;">✅</span><p style="font-size:13px; font-weight:700; color:#2E7D32; margin:0;">¡Listo!</p>`;
                    setTimeout(() => {
                        // Refresh both the main grid and the modal
                        this.init().then(() => {
                            // Re-open/refresh details if the modal is still there
                            const modal = container.closest('.pata-modal-overlay');
                            if (modal) {
                                modal.remove();
                                this.showDetails(petId);
                            }
                        });
                    }, 1500);
                } else {
                    throw new Error(data.error || 'Error actualizando registro');
                }
            } catch (err) {
                console.error('Modal upload error:', err);
                alert('No se pudo subir: ' + err.message);
                container.innerHTML = originalContent;
                container.style.pointerEvents = 'auto';
            }
        }


    }

    // Exponer al global con espera de DOM
    function initManadaWidget() {
        const container = document.getElementById('pata-amiga-manada-widget');
        if (container) {
            if (!window.ManadaWidget || !window.ManadaWidget.container) {
                console.log('🐾 Inicializando ManadaWidget...');
                window.ManadaWidget = new ManadaWidget('pata-amiga-manada-widget');
            } else {
                console.log('🐾 El widget ya estaba inicializado en el global.');
            }
        } else {
            console.log('🐾 Contenedor no encontrado aún, reintentando en 500ms...');
            setTimeout(initManadaWidget, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initManadaWidget);
    } else {
        initManadaWidget();
    }
})();
