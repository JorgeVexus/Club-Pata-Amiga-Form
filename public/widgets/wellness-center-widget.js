/**
 * 🎯 Widget Dashboard Centro de Bienestar - Club Pata Amiga
 * Integración para Webflow
 */

(function () {
    'use strict';

    function enforceMemberstackSessionStorage() {
        try {
            const sessionKeys = ['_ms-mid', '_ms-mem'];
            if (window.__pataMemberstackSessionStorageGuard) return;
            window.__pataMemberstackSessionStorageGuard = true;

            const hadPersistentToken = Boolean(localStorage.getItem('_ms-mid') && !sessionStorage.getItem('_ms-mid'));

            sessionKeys.forEach(function (key) {
                localStorage.removeItem(key);
            });

            const nativeGetItem = Storage.prototype.getItem;
            const nativeSetItem = Storage.prototype.setItem;
            const nativeRemoveItem = Storage.prototype.removeItem;

            Storage.prototype.getItem = function (key) {
                if (this === localStorage && sessionKeys.indexOf(String(key)) > -1) {
                    return nativeGetItem.call(sessionStorage, key);
                }
                return nativeGetItem.call(this, key);
            };

            Storage.prototype.setItem = function (key, value) {
                if (this === localStorage && sessionKeys.indexOf(String(key)) > -1) {
                    sessionStorage.setItem(key, value);
                    nativeRemoveItem.call(localStorage, key);
                    return;
                }
                return nativeSetItem.call(this, key, value);
            };

            Storage.prototype.removeItem = function (key) {
                if (this === localStorage && sessionKeys.indexOf(String(key)) > -1) {
                    nativeRemoveItem.call(sessionStorage, key);
                }
                return nativeRemoveItem.call(this, key);
            };

            if (hadPersistentToken) {
                let attempts = 0;
                const expireLegacySession = setInterval(function () {
                    attempts += 1;
                    if (window.$memberstackDom && typeof window.$memberstackDom.logout === 'function') {
                        clearInterval(expireLegacySession);
                        window.$memberstackDom.logout().catch(function () {});
                    } else if (attempts >= 20) {
                        clearInterval(expireLegacySession);
                    }
                }, 100);
            }
        } catch (error) {
            console.warn('[Pata Amiga] No se pudo activar la politica de sesion temporal.', error);
        }
    }

    enforceMemberstackSessionStorage();

    let currentCenter = null;
    let payments = [];
    let appointments = [];

    const CONFIG = {
        API_BASE_URL: 'https://app.pataamiga.mx', // Cambiar según entorno
        DEBUG: false
    };

    const INSTAGRAM_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
    const FACEBOOK_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`;
    const TIKTOK_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>`;
    const WEBSITE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
    const DEFAULT_LOGO_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
            <rect width="160" height="160" rx="28" fill="#E8F8F7"/>
            <circle cx="80" cy="70" r="30" fill="#00BBB4"/>
            <circle cx="55" cy="45" r="10" fill="#FE8F15"/>
            <circle cx="80" cy="34" r="11" fill="#FE8F15"/>
            <circle cx="105" cy="45" r="10" fill="#FE8F15"/>
            <path d="M48 118c8-22 22-34 32-34s24 12 32 34" fill="#00BBB4"/>
            <text x="80" y="139" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#1E293B">Pata Amiga</text>
        </svg>
    `)}`;

    const STYLES = `
        .wellness-widget-container {
            font-family: 'Outfit', sans-serif;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .wc-card {
            background: white;
            border-radius: 30px;
            padding: 30px;
            border: 3px solid #000;
            box-shadow: 10px 10px 0px rgba(0,0,0,0.05);
            margin-bottom: 30px;
        }

        .wc-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .wc-status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 0.8rem;
            text-transform: uppercase;
            border: 2px solid #000;
            margin-bottom: 20px;
        }

        .status-pending { background: #FEF3C7; color: #92400E; }
        .status-approved { background: #D1FAE5; color: #065F46; }
        .status-rejected { background: #FEE2E2; color: #991B1B; }
        .status-appealed { background: #E0F2FE; color: #075985; }
        .status-cancelled { background: #E2E8F0; color: #1E293B; }

        .wc-status-screen {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 40px;
            border: 3px solid #000;
            max-width: 600px;
            margin: 0 auto;
        }

        .wc-status-screen-wide {
            max-width: 900px;
            text-align: left;
        }

        .wc-pending-review-copy {
            text-align: center;
            max-width: 620px;
            margin: 0 auto;
        }

        .wc-pending-profile-form-section {
            margin-top: 30px;
            padding-top: 24px;
            border-top: 2px solid #F1F5F9;
        }

        .wc-status-screen-wide > .wc-status-icon,
        .wc-status-screen-wide > .wc-title,
        .wc-status-screen-wide > p {
            text-align: center;
        }

        .wc-status-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }

        .wc-appeal-box {
            margin-top: 30px;
            text-align: left;
            padding: 20px;
            background: #F8FAFC;
            border-radius: 20px;
            border: 2px dashed #CBD5E1;
        }

        .wc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        @media (max-width: 768px) {
            .wc-grid { grid-template-columns: 1fr; }
        }

        .wc-btn {
            padding: 12px 25px;
            border-radius: 50px;
            border: 2px solid #000;
            font-family: 'Fraiche', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
        }

        .wc-btn-primary { background: #FE8F15; color: white; }
        .wc-btn-secondary { background: #00BBB4; color: white; }
        .wc-btn-danger { background: #E53E3E; color: white; }

        .wc-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .wc-table th {
            text-align: left;
            padding: 15px;
            background: #F8FAFC;
            border-bottom: 2px solid #E2E8F0;
        }

        .wc-table td {
            padding: 15px;
            border-bottom: 1px solid #E2E8F0;
        }

        .wc-amount {
            font-weight: bold;
            color: #059669;
        }

        /* Modal Styles */
        .wc-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .wc-modal {
            background: white;
            padding: 40px;
            border-radius: 30px;
            max-width: 800px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            border: 3px solid #000;
        }

        .wc-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .wc-modal-description {
            margin: -8px 0 18px;
            color: #4B5563;
            font-size: 0.95rem;
            line-height: 1.5;
            text-align: left;
        }

        .wc-close-btn {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
        }

        .wc-blocked-screen {
            text-align: center;
            padding: 100px 20px;
        }

        /* Form Styles */
        .wc-form-group {
            margin-bottom: 20px;
            text-align: left;
        }

        .wc-label {
            display: block;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 0.9rem;
            color: #475569;
        }

        .wc-input {
            width: 100%;
            padding: 12px 15px;
            border-radius: 12px;
            border: 2px solid #E2E8F0;
            font-family: inherit;
            font-size: 1rem;
            transition: border-color 0.2s;
        }

        .wc-input:focus {
            outline: none;
            border-color: #FE8F15;
        }

        .wc-input-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .wc-logo-preview-container {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 15px;
        }

        .wc-logo-preview {
            width: 80px;
            height: 80px;
            border-radius: 15px;
            background: #F1F5F9;
            object-fit: cover;
            border: 2px solid #E2E8F0;
        }

        .wc-location-photos-panel {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 14px;
            margin: 12px 0 18px;
        }

        .wc-location-photos-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 10px;
        }

        .wc-location-photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
            gap: 10px;
        }

        .wc-location-photo-thumb {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 12px;
            border: 1px solid #CBD5E1;
            background: #F8FAFC;
        }

        .wc-location-photo-help {
            margin: 0;
            color: #718096;
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .wc-section-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.2rem;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #F1F5F9;
            color: #1E293B;
        }

        .wc-info-card-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 15px;
        }

        .wc-info-header {
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 2px solid #F1F5F9;
            padding-bottom: 15px;
        }

        .wc-info-logo-large {
            width: 90px;
            height: 90px;
            border-radius: 20px;
            object-fit: cover;
            border: 3px solid #000;
            background: #F1F5F9;
            box-shadow: 4px 4px 0px rgba(0,0,0,0.1);
        }

        .wc-info-placeholder-logo {
            width: 90px;
            height: 90px;
            border-radius: 20px;
            border: 3px solid #000;
            background: #7DD8D5;
            color: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Fraiche', sans-serif;
            font-size: 2.5rem;
            box-shadow: 4px 4px 0px rgba(0,0,0,0.1);
        }

        .wc-info-header-text {
            flex: 1;
        }

        .wc-info-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 25px;
        }

        @media (max-width: 768px) {
            .wc-info-grid {
                grid-template-columns: 1fr;
            }
        }

        .wc-info-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .wc-info-section-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.1rem;
            color: #000;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .wc-info-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.95rem;
            color: #475569;
            line-height: 1.4;
        }

        .wc-info-icon {
            font-size: 1.2rem;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .wc-info-promo-box {
            background: #FFF7ED;
            border: 2px dashed #FED7AA;
            border-radius: 20px;
            padding: 15px;
            color: #C2410C;
            font-size: 0.95rem;
            line-height: 1.5;
            position: relative;
        }

        .wc-info-socials {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 8px;
        }

        .wc-info-social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid #000;
            background: #FFF;
            transition: all 0.2s;
            color: #000;
            text-decoration: none;
        }

        .wc-info-social-btn:hover {
            transform: translate(-2px, -2px);
            box-shadow: 3px 3px 0px rgba(0,0,0,0.1);
        }

        .wc-info-social-btn.instagram:hover { background: #E1306C; color: white; }
        .wc-info-social-btn.facebook:hover { background: #1877F2; color: white; }
        .wc-info-social-btn.tiktok:hover { background: #010101; color: white; }
        .wc-info-social-btn.website:hover { background: #00BBB4; color: white; }

        .wc-info-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
            border-top: 2px solid #F1F5F9;
            padding-top: 15px;
        }

        .wc-info-maps-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.85rem;
            color: #00BBB4;
            text-decoration: underline;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: bold;
            padding: 0;
            margin-top: 5px;
        }

        .wc-info-maps-btn:hover {
            color: #008882;
        }

        .wc-branches-panel {
            margin-top: 18px;
            padding: 18px;
            border: 2px solid #E2E8F0;
            border-radius: 18px;
            background: #F8FAFC;
        }

        .wc-branch-question {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
        }

        .wc-branch-toggle-options {
            display: flex;
            gap: 8px;
        }

        .wc-branch-toggle-options label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border: 2px solid #E2E8F0;
            border-radius: 999px;
            background: #fff;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 700;
        }

        .wc-branch-card {
            padding: 16px;
            border: 2px solid #E2E8F0;
            border-radius: 16px;
            background: #fff;
            margin-top: 12px;
        }

        .wc-branch-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
        }

        .wc-branch-title {
            margin: 0;
            font-family: 'Fraiche', sans-serif;
            font-size: 1rem;
            color: #1E293B;
        }

        .wc-branch-remove {
            border: none;
            background: transparent;
            color: #E53E3E;
            font-weight: 800;
            cursor: pointer;
            text-decoration: underline;
        }

        .wc-branch-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 12px;
        }

        .wc-branch-location-btn {
            padding: 8px 14px;
            font-size: 0.85rem;
        }

        .wc-branches-empty {
            color: #718096;
            font-size: 0.9rem;
            font-style: italic;
            margin: 10px 0 0 0;
        }

        @media (max-width: 768px) {
            .wc-branch-question {
                align-items: flex-start;
                flex-direction: column;
            }
        }
    `;

    // ============================================
    // LÓGICA DE DATOS
    // ============================================

    async function fetchCenterData(memberstackId) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/me?memberstack_id=${memberstackId}`);
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Error fetching center data:', error);
            return null;
        }
    }

    async function updateAppointmentStatus(appointmentId, memberstackId, status, details = {}) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/appointments/${appointmentId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    memberstack_id: memberstackId,
                    status,
                    ...details
                })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async function cancelAccount(memberstackId, reason) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberstack_id: memberstackId, reason })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    async function submitAppeal(memberstackId, message) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    memberstack_id: memberstackId, 
                    appeal_message: message,
                    status: 'appealed'
                })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    }

    // ============================================
    // RENDERIZADO
    // ============================================

    function renderLoading(container) {
        container.innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <p>Cargando información del aliado...</p>
            </div>
        `;
    }

    function renderBlocked(container) {
        container.innerHTML = `
            <div class="wc-status-screen">
                <div class="wc-status-icon">🚫</div>
                <h1 class="wc-title">Acceso Restringido</h1>
                <p>Tu cuenta como Centro de Bienestar ha sido desactivada.</p>
                <p>Lamentamos que hayas salido de la manada. Si deseas volver, por favor contáctanos.</p>
                <div style="margin-top: 30px;">
                    <a href="mailto:aliados@pataamiga.mx" class="wc-btn wc-btn-primary" style="text-decoration:none;">Contactar Soporte</a>
                </div>
            </div>
        `;
    }

    function getCenterDisplayName(center) {
        return center.establishment_name || center.name || 'tu centro';
    }

    function normalizeLocationNumber(value) {
        const numberValue = parseFloat(value);
        return Number.isFinite(numberValue) ? numberValue : null;
    }

    function getAdditionalLocations(center) {
        const locations = Array.isArray(center.locations)
            ? center.locations
            : (Array.isArray(center.wellness_center_locations) ? center.wellness_center_locations : []);

        return locations.filter(location => !location.is_primary);
    }

    function getPrimaryLocation(center) {
        const locations = Array.isArray(center.locations)
            ? center.locations
            : (Array.isArray(center.wellness_center_locations) ? center.wellness_center_locations : []);

        return locations.find(location => location.is_primary) || null;
    }

    function parsePhotoUrls(value) {
        if (!value) return [];
        return String(value)
            .split('|')
            .map(url => url.trim())
            .filter(Boolean);
    }

    function serializePhotoUrls(urls) {
        return (Array.isArray(urls) ? urls : []).filter(Boolean).join('|');
    }

    function renderPhotoPreview(urls) {
        const photoUrls = Array.isArray(urls) ? urls : [];
        if (photoUrls.length === 0) {
            return '<p class="wc-location-photo-help">Agrega fotos del exterior, recepcion o areas principales.</p>';
        }

        return `
            <div class="wc-location-photo-grid">
                ${photoUrls.map(url => `<img src="${url}" class="wc-location-photo-thumb" alt="Foto de sucursal">`).join('')}
            </div>
        `;
    }

    async function uploadWellnessLocationPhoto(center, file, locationKey) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('memberstackId', center.memberstack_id);
            formData.append('locationKey', locationKey);

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload/wellness-location-photo`, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('Error uploading location photo:', error);
            return { success: false, error: 'Error de conexion al subir foto' };
        }
    }

    function renderBranchCard(location = {}, index = 0) {
        const photoUrls = Array.isArray(location.photo_urls) ? location.photo_urls : [];

        return `
            <div class="wc-branch-card" data-location-row>
                <div class="wc-branch-card-header">
                    <h4 class="wc-branch-title">Sucursal adicional ${index + 1}</h4>
                    <button type="button" class="wc-branch-remove" data-remove-location>Eliminar</button>
                </div>
                <div class="wc-input-row">
                    <div class="wc-form-group">
                        <label class="wc-label">Nombre de sucursal</label>
                        <input type="text" name="location_name" class="wc-input" value="${location.name || ''}" placeholder="Ej: Sucursal Roma Norte">
                    </div>
                    <div class="wc-form-group">
                        <label class="wc-label">Telefono de sucursal</label>
                        <input type="tel" name="location_phone" class="wc-input" value="${location.phone || ''}" placeholder="Ej: 5512345678">
                    </div>
                </div>
                <div class="wc-form-group">
                    <label class="wc-label">Direccion completa</label>
                    <textarea name="location_address" class="wc-input wc-location-address" style="min-height:70px;" placeholder="Calle, numero, colonia, CP y ciudad">${location.address || ''}</textarea>
                </div>
                <div class="wc-input-row">
                    <div class="wc-form-group">
                        <label class="wc-label">Latitud</label>
                        <input type="number" step="any" name="location_lat" class="wc-input wc-location-lat" value="${location.lat || ''}" placeholder="Ej: 19.4326">
                    </div>
                    <div class="wc-form-group">
                        <label class="wc-label">Longitud</label>
                        <input type="number" step="any" name="location_lng" class="wc-input wc-location-lng" value="${location.lng || ''}" placeholder="Ej: -99.1332">
                    </div>
                </div>
                <div class="wc-branch-actions">
                    <button type="button" class="wc-btn wc-branch-location-btn" data-get-branch-location>Usar mi ubicacion actual</button>
                </div>
                <div class="wc-location-photos-panel">
                    <div class="wc-location-photos-header">
                        <h4 class="wc-branch-title" style="margin:0;">Fotos de sucursal</h4>
                        <label class="wc-btn wc-btn-secondary" style="padding:8px 14px; font-size:0.85rem;">
                            + Foto
                            <input type="file" accept="image/*" data-location-photo-input data-location-key="branch-${index + 1}" style="display:none;">
                        </label>
                    </div>
                    <input type="hidden" name="location_photo_urls" value="${serializePhotoUrls(photoUrls)}">
                    <div data-location-photo-preview>${renderPhotoPreview(photoUrls)}</div>
                </div>
            </div>
        `;
    }

    function renderBranchesEditor(center) {
        const branches = getAdditionalLocations(center);
        const hasBranches = branches.length > 0;

        return `
            <div class="wc-branches-panel" data-branches-panel>
                <div class="wc-branch-question">
                    <div>
                        <label class="wc-label" style="margin-bottom:4px;">¿Tu negocio cuenta con mas de una sucursal?</label>
                        <p style="margin:0; color:#718096; font-size:0.9rem;">Los beneficios y servicios se toman del centro principal.</p>
                    </div>
                    <div class="wc-branch-toggle-options" data-branch-toggle>
                        <label><input type="radio" name="has_branches" value="no" ${hasBranches ? '' : 'checked'}> No</label>
                        <label><input type="radio" name="has_branches" value="yes" ${hasBranches ? 'checked' : ''}> Si</label>
                    </div>
                </div>
                <div data-branches-editor style="${hasBranches ? '' : 'display:none;'}">
                    <div data-locations-list>
                        ${branches.length > 0 ? branches.map(renderBranchCard).join('') : '<p class="wc-branches-empty">Agrega las sucursales adicionales que quieras registrar.</p>'}
                    </div>
                    <button type="button" id="btn-add-location" class="wc-btn wc-btn-secondary" style="width:100%; margin-top:14px;">+ Agregar sucursal</button>
                </div>
            </div>
        `;
    }

    function collectWellnessLocations(form) {
        const primaryAddress = form.querySelector('[name="address"]')?.value || '';
        const primaryLat = form.querySelector('[name="lat"]')?.value || '';
        const primaryLng = form.querySelector('[name="lng"]')?.value || '';
        const primaryPhone = form.querySelector('[name="phone"]')?.value || '';
        const primaryName = form.querySelector('[name="establishment_name"]')?.value || '';
        const primaryPhotoUrls = parsePhotoUrls(form.querySelector('[name="primary_photo_urls"]')?.value || '');

        const locations = [];
        if (primaryAddress.trim()) {
            locations.push({
                name: primaryName.trim() || 'Sucursal principal',
                address: primaryAddress.trim(),
                lat: normalizeLocationNumber(primaryLat),
                lng: normalizeLocationNumber(primaryLng),
                phone: primaryPhone.trim() || null,
                photo_urls: primaryPhotoUrls,
                is_primary: true
            });
        }

        const hasBranches = form.querySelector('[name="has_branches"]:checked')?.value === 'yes';
        if (!hasBranches) {
            return locations;
        }

        form.querySelectorAll('[data-location-row]').forEach((row, index) => {
            const address = row.querySelector('[name="location_address"]')?.value || '';
            if (!address.trim()) return;

            locations.push({
                name: row.querySelector('[name="location_name"]')?.value?.trim() || `Sucursal ${index + 2}`,
                address: address.trim(),
                lat: normalizeLocationNumber(row.querySelector('[name="location_lat"]')?.value || ''),
                lng: normalizeLocationNumber(row.querySelector('[name="location_lng"]')?.value || ''),
                phone: row.querySelector('[name="location_phone"]')?.value?.trim() || null,
                photo_urls: parsePhotoUrls(row.querySelector('[name="location_photo_urls"]')?.value || ''),
                is_primary: false
            });
        });

        return locations;
    }

    function bindWellnessBranchEditor(form) {
        if (!form) return;

        const branchesEditor = form.querySelector('[data-branches-editor]');
        const locationsList = form.querySelector('[data-locations-list]');
        const addLocationButton = form.querySelector('#btn-add-location');
        const branchToggle = form.querySelector('[data-branch-toggle]');

        const refreshBranchTitles = () => {
            if (!locationsList) return;
            const rows = locationsList.querySelectorAll('[data-location-row]');
            rows.forEach((row, index) => {
                const title = row.querySelector('.wc-branch-title');
                if (title) title.innerText = `Sucursal adicional ${index + 1}`;
            });
            if (rows.length === 0) {
                locationsList.innerHTML = '<p class="wc-branches-empty">Agrega las sucursales adicionales que quieras registrar.</p>';
            }
        };

        const bindBranchRow = (row) => {
            const removeButton = row.querySelector('[data-remove-location]');
            const branchLocationButton = row.querySelector('[data-get-branch-location]');

            if (removeButton && !removeButton.dataset.bound) {
                removeButton.addEventListener('click', () => {
                    row.remove();
                    refreshBranchTitles();
                });
                removeButton.dataset.bound = 'true';
            }

            if (branchLocationButton && !branchLocationButton.dataset.bound) {
                branchLocationButton.addEventListener('click', () => {
                    if (!("geolocation" in navigator)) {
                        alert('Tu navegador no soporta geolocalización.');
                        return;
                    }

                    branchLocationButton.innerText = 'Obteniendo...';
                    navigator.geolocation.getCurrentPosition((position) => {
                        row.querySelector('.wc-location-lat').value = position.coords.latitude.toFixed(8);
                        row.querySelector('.wc-location-lng').value = position.coords.longitude.toFixed(8);
                        branchLocationButton.innerText = 'Ubicación obtenida';
                    }, () => {
                        alert('Error al obtener ubicación. Por favor ingrésala manualmente.');
                        branchLocationButton.innerText = 'Intentar de nuevo';
                    });
                });
                branchLocationButton.dataset.bound = 'true';
            }

            if (window.google && window.google.maps && window.google.maps.places) {
                const addressInput = row.querySelector('.wc-location-address');
                if (addressInput && !addressInput.dataset.autocompleteReady) {
                    const autocomplete = new google.maps.places.Autocomplete(addressInput);
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (place.geometry) {
                            row.querySelector('.wc-location-lat').value = place.geometry.location.lat().toFixed(8);
                            row.querySelector('.wc-location-lng').value = place.geometry.location.lng().toFixed(8);
                        }
                    });
                    addressInput.dataset.autocompleteReady = 'true';
                }
            }
        };

        if (branchToggle && branchesEditor) {
            branchToggle.querySelectorAll('[name="has_branches"]').forEach(input => {
                if (input.dataset.bound) return;
                input.addEventListener('change', () => {
                    branchesEditor.style.display = input.value === 'yes' && input.checked ? '' : 'none';
                });
                input.dataset.bound = 'true';
            });
        }

        if (locationsList) {
            locationsList.querySelectorAll('[data-location-row]').forEach(bindBranchRow);
        }

        if (addLocationButton && locationsList && !addLocationButton.dataset.bound) {
            addLocationButton.addEventListener('click', () => {
                const empty = locationsList.querySelector('.wc-branches-empty');
                if (empty) empty.remove();

                const index = locationsList.querySelectorAll('[data-location-row]').length;
                locationsList.insertAdjacentHTML('beforeend', renderBranchCard({}, index));
                const newRow = locationsList.querySelector('[data-location-row]:last-child');
                if (newRow) bindBranchRow(newRow);
            });
            addLocationButton.dataset.bound = 'true';
        }
    }

    function getDisplayLocations(center) {
        const storedLocations = Array.isArray(center.locations)
            ? center.locations
            : (Array.isArray(center.wellness_center_locations) ? center.wellness_center_locations : []);

        if (storedLocations.length > 0) {
            return storedLocations;
        }

        if (center.address) {
            return [{
                name: 'Sucursal principal',
                address: center.address,
                lat: center.lat,
                lng: center.lng,
                phone: center.phone,
                is_primary: true
            }];
        }

        return [];
    }

    function renderLocationsSummary(center) {
        const locations = getDisplayLocations(center);

        if (locations.length === 0) {
            return '<span style="color:#718096; font-style:italic;">No registrada</span>';
        }

        return locations.map((location, index) => `
            <div style="margin-bottom:${index === locations.length - 1 ? '0' : '12px'};">
                <strong>${location.is_primary ? 'Sucursal principal' : (location.name || `Sucursal ${index + 1}`)}:</strong>
                <span>${location.address}</span>
                ${location.phone ? `<br><span style="color:#718096;">Tel. ${location.phone}</span>` : ''}
                ${location.lat && location.lng
                    ? `<br><a href="https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}" target="_blank" class="wc-info-maps-btn">🗺️ Ver en Google Maps</a>`
                    : ''
                }
            </div>
        `).join('');
    }

    function renderEditProfileForm(center, options = {}) {
        const social = center.social_links || {};
        const title = options.title || 'Editar Perfil del Centro';
        const formId = options.formId || 'wc-edit-profile-form';
        const showHeader = options.showHeader !== false;
        const showCloseButton = options.showCloseButton !== false;
        const submitText = options.submitText || 'Guardar Cambios';
        const primaryLocation = getPrimaryLocation(center);
        const primaryPhotoUrls = primaryLocation?.photo_urls || [];

        return `
            ${showHeader ? `
                <div class="wc-modal-header">
                    <h2 class="wc-title">${title}</h2>
                    ${showCloseButton ? '<button class="wc-close-btn" type="button">&times;</button>' : ''}
                </div>
            ` : ''}

            <form id="${formId}">
                <h3 class="wc-section-title">Marca y Logo</h3>
                <div class="wc-logo-preview-container">
                    <img src="${center.logo_url || DEFAULT_LOGO_PLACEHOLDER}" class="wc-logo-preview" id="logo-preview-img" alt="Logo del centro">
                    <div style="flex:1;">
                        <p style="font-size:0.8rem; color:#64748b; margin-bottom:10px;">Recomendado: Imagen cuadrada, min 200x200px (PNG o JPG).</p>
                        <input type="file" id="wc-logo-input" accept="image/*" style="display:none;">
                        <button type="button" id="btn-select-logo" class="wc-btn wc-btn-secondary" style="padding:8px 15px; font-size:0.9rem;">Seleccionar Imagen</button>
                    </div>
                </div>

                <h3 class="wc-section-title">Información de Contacto</h3>
                <div class="wc-form-group">
                    <label class="wc-label">Nombre del Establecimiento</label>
                    <input type="text" name="establishment_name" class="wc-input" value="${center.establishment_name || ''}" placeholder="Ej: Clínica Vet Pata Amiga">
                </div>

                <div class="wc-form-group">
                    <label class="wc-label">Razón Social / Nombre</label>
                    <input type="text" name="name" class="wc-input" value="${center.name || ''}" placeholder="Ej: Veterinaria Patitas Felices SA de CV">
                </div>

                <div class="wc-form-group">
                    <label class="wc-label">Teléfono de Contacto</label>
                    <input type="tel" name="phone" class="wc-input" value="${center.phone || ''}" placeholder="Ej: 5512345678">
                </div>

                <h3 class="wc-section-title">Información para reintegros</h3>
                <p style="font-size:0.9rem; color:#64748b; margin-top:-5px;">Estos datos se usarán para que Pata Amiga realice reintegros a tu Centro.</p>
                <div class="wc-form-group">
                    <label class="wc-label">Banco</label>
                    <input type="text" name="bank_name" class="wc-input" value="${center.bank_name || ''}" placeholder="Ej: BBVA, Santander, Banorte">
                </div>
                <div class="wc-form-group">
                    <label class="wc-label">Titular de la cuenta</label>
                    <input type="text" name="bank_holder" class="wc-input" value="${center.bank_holder || ''}" placeholder="Nombre como aparece en la cuenta">
                </div>
                <div class="wc-form-group">
                    <label class="wc-label">CLABE interbancaria</label>
                    <input type="text" inputmode="numeric" maxlength="18" name="bank_clabe" class="wc-input" value="${center.bank_clabe || ''}" placeholder="18 dígitos">
                </div>

                <h3 class="wc-section-title">Ubicación y Geolocalización</h3>
                <div class="wc-form-group">
                    <label class="wc-label">Dirección Completa</label>
                    <textarea name="address" id="wc-address-input" class="wc-input" style="min-height:80px;" placeholder="Calle, número, colonia, CP y ciudad">${center.address || ''}</textarea>
                </div>

                <div class="wc-input-row">
                    <div class="wc-form-group">
                        <label class="wc-label">Latitud</label>
                        <input type="number" step="any" name="lat" id="wc-lat" class="wc-input" value="${center.lat || ''}" placeholder="Ej: 19.4326">
                    </div>
                    <div class="wc-form-group">
                        <label class="wc-label">Longitud</label>
                        <input type="number" step="any" name="lng" id="wc-lng" class="wc-input" value="${center.lng || ''}" placeholder="Ej: -99.1332">
                    </div>
                </div>
                <button type="button" id="btn-get-location" class="wc-btn" style="width:100%; margin-bottom:20px; font-size:0.9rem;">📍 Obtener mi ubicación actual</button>

                <div class="wc-location-photos-panel">
                    <div class="wc-location-photos-header">
                        <h4 class="wc-branch-title" style="margin:0;">Fotos de Sucursal principal</h4>
                        <label class="wc-btn wc-btn-secondary" style="padding:8px 14px; font-size:0.85rem;">
                            + Foto
                            <input type="file" accept="image/*" data-location-photo-input data-location-key="primary" style="display:none;">
                        </label>
                    </div>
                    <input type="hidden" name="primary_photo_urls" value="${serializePhotoUrls(primaryPhotoUrls)}">
                    <div data-location-photo-preview>${renderPhotoPreview(primaryPhotoUrls)}</div>
                </div>

                ${renderBranchesEditor(center)}

                <h3 class="wc-section-title">Redes Sociales</h3>
                <div class="wc-input-row">
                    <div class="wc-form-group">
                        <label class="wc-label">Instagram (URL)</label>
                        <input type="url" name="social_instagram" class="wc-input" value="${social.instagram || ''}" placeholder="https://instagram.com/...">
                    </div>
                    <div class="wc-form-group">
                        <label class="wc-label">Facebook (URL)</label>
                        <input type="url" name="social_facebook" class="wc-input" value="${social.facebook || ''}" placeholder="https://facebook.com/...">
                    </div>
                </div>
                <div class="wc-input-row">
                    <div class="wc-form-group">
                        <label class="wc-label">TikTok (URL)</label>
                        <input type="url" name="social_tiktok" class="wc-input" value="${social.tiktok || ''}" placeholder="https://tiktok.com/@...">
                    </div>
                    <div class="wc-form-group">
                        <label class="wc-label">Sitio Web</label>
                        <input type="url" name="social_website" class="wc-input" value="${social.website || ''}" placeholder="https://...">
                    </div>
                </div>

                <h3 class="wc-section-title">Promoción para Miembros</h3>
                <div class="wc-form-group">
                    <label class="wc-label">Descripción del Beneficio</label>
                    <textarea name="promotion_details" class="wc-input" style="min-height:100px;" placeholder="Ej: 15% de descuento en consultas generales y 10% en farmacia.">${center.promotion_details || ''}</textarea>
                </div>

                <div style="margin-top:30px;">
                    <button type="submit" id="btn-save-profile" class="wc-btn wc-btn-primary" style="width:100%;">${submitText}</button>
                </div>
            </form>
        `;
    }

    function renderPending(container, center) {
        container.innerHTML = `
            <div class="wc-status-screen wc-status-screen-wide">
                <div class="wc-status-icon">⏳</div>
                <h1 class="wc-title">Solicitud en Revisión</h1>
                <p>¡Hola, ${getCenterDisplayName(center)}! Tu solicitud para ser aliado de Pata Amiga está siendo revisada por nuestro equipo.</p>
                <p>Te notificaremos por correo electrónico una vez que hayamos validado tus datos.</p>
                <div style="margin-top: 30px; padding: 20px; background: #FFFBEB; border-radius: 20px; border: 2px solid #FEF3C7;">
                    <p style="font-size: 0.9rem; color: #92400E;">Mientras tanto, puedes adelantar el llenado de tu información complementaria (logo, redes sociales, ubicación) para agilizar tu aprobación.</p>
                </div>
                <div class="wc-pending-profile-form-section">
                    ${renderEditProfileForm(center, {
                        title: 'Completa la información de tu centro',
                        formId: 'wc-pending-profile-form',
                        showCloseButton: false,
                        submitText: 'Guardar información'
                    })}
                </div>
            </div>
        `;

        bindEditProfileForm(container, center, {
            formSelector: '#wc-pending-profile-form',
            submitText: 'Guardar información',
            onSuccess: () => init()
        });
    }

    function renderRejected(container, center) {
        container.innerHTML = `
            <div class="wc-status-screen">
                <div class="wc-status-icon">❌</div>
                <h1 class="wc-title">Solicitud Rechazada</h1>
                <p>Hola ${center.establishment_name || center.name}, el comité determinó no aceptar tu solicitud de centro de bienestar debido a:</p>
                
                <div class="wc-appeal-box">
                    <p style="${center.rejection_reason ? 'font-weight:bold; color:#E53E3E;' : ''}">${center.rejection_reason || 'No se proporcionó un motivo específico.'}</p>
                </div>

                <div id="appeal-form-container" style="margin-top: 40px;">
                    <h2 class="wc-title" style="font-size:1.2rem;">¿Deseas apelar esta decisión?</h2>
                    <p>Si consideras que hubo un error o tienes nueva información para compartir, descríbelo aquí:</p>
                    <textarea id="wc-appeal-text" placeholder="Escribe tu mensaje de apelación aquí..." style="width:100%; height:120px; padding:15px; border-radius:20px; border:2px solid #000; margin-top:10px; font-family:inherit;"></textarea>
                    <button id="btn-submit-appeal" class="wc-btn wc-btn-primary" style="width:100%; margin-top:15px;">Enviar Apelación</button>
                </div>
            </div>
        `;

        container.querySelector('#btn-submit-appeal').addEventListener('click', async () => {
            const message = container.querySelector('#wc-appeal-text').value;
            if (!message.trim()) {
                alert('Por favor escribe un mensaje de apelación.');
                return;
            }

            const btn = container.querySelector('#btn-submit-appeal');
            btn.disabled = true;
            btn.innerText = 'Enviando...';

            const result = await submitAppeal(center.memberstack_id, message);
            if (result.success) {
                renderAppealed(container, { ...center, status: 'appealed' });
            } else {
                alert('Error al enviar la apelación. Intenta de nuevo.');
                btn.disabled = false;
                btn.innerText = 'Enviar Apelación';
            }
        });
    }

    function renderAppealed(container, center) {
        container.innerHTML = `
            <div class="wc-status-screen">
                <div class="wc-status-icon">📩</div>
                <h1 class="wc-title">Apelación en Revisión</h1>
                <p>Hemos recibido tu apelación, ${center.name}.</p>
                <p>Nuestro equipo revisará nuevamente tu caso y los comentarios proporcionados.</p>
                <div style="margin-top: 30px; padding: 20px; background: #F0F9FF; border-radius: 20px; border: 2px solid #E0F2FE;">
                    <p style="font-size: 0.9rem; color: #0369A1;">Te avisaremos por correo lo antes posible. ¡Gracias por tu paciencia!</p>
                </div>
            </div>
        `;
    }

    function renderDashboard(container, center) {
        currentCenter = center;
        const social = center.social_links || {};

        container.innerHTML = `
            <div class="wellness-widget-content">
                <div class="wc-card">
                    <div class="wc-status-badge status-${center.status}">${center.status === 'approved' ? 'Aliado Activo' : 'En Revisión'}</div>
                    <h1 class="wc-title">¡Hola, ${center.establishment_name}!</h1>
                    <p>Bienvenido a tu panel de control de Pata Amiga.</p>
                </div>

                <div class="wc-grid">
                    <div class="wc-card">
                        <h2 class="wc-title" style="font-size:1.5rem;">Solicitudes y Citas</h2>
                        <p>Gestiona las solicitudes de atención y tu calendario.</p>
                        <button id="btn-view-appointments" class="wc-btn wc-btn-secondary">Gestionar Citas</button>
                    </div>

                    <div class="wc-card">
                        <h2 class="wc-title" style="font-size:1.5rem;">Apoyo Económico</h2>
                        <p>Beneficios económicos y pagos recibidos.</p>
                        <button id="btn-view-payments" class="wc-btn wc-btn-secondary">Ver Historial</button>
                    </div>
                </div>

                <div class="wc-card">
                    <h2 class="wc-title" style="font-size:1.5rem; margin-bottom: 0;">Información del Centro</h2>
                    
                    <div class="wc-info-card-content">
                        <div class="wc-info-header">
                            ${center.logo_url 
                                ? `<img src="${center.logo_url}" class="wc-info-logo-large" alt="Logo de ${center.establishment_name}">`
                                : `<div class="wc-info-placeholder-logo">${(center.establishment_name || center.name || 'C').charAt(0).toUpperCase()}</div>`
                            }
                            <div class="wc-info-header-text">
                                <h3 class="wc-title" style="font-size:1.6rem; margin-bottom: 5px;">${center.establishment_name || 'Sin nombre comercial'}</h3>
                                <p style="margin: 0; color: #718096; font-size: 0.95rem;">Razón Social / Nombre: ${center.name || 'No especificado'}</p>
                            </div>
                        </div>

                        <div class="wc-info-grid">
                            <div class="wc-info-section">
                                <h4 class="wc-info-section-title">📍 Datos de Contacto</h4>
                                <div class="wc-info-item">
                                    <span class="wc-info-icon">📞</span>
                                    <div>
                                        <strong>Teléfono:</strong> 
                                        ${center.phone 
                                            ? `<a href="tel:${center.phone}" style="color: inherit; text-decoration: none;">${center.phone}</a>` 
                                            : '<span style="color:#718096; font-style:italic;">No registrado</span>'
                                        }
                                    </div>
                                </div>
                                <div class="wc-info-item">
                                    <span class="wc-info-icon">✉️</span>
                                    <div>
                                        <strong>Email:</strong> 
                                        ${center.email 
                                            ? `<a href="mailto:${center.email}" style="color: inherit; text-decoration: none;">${center.email}</a>` 
                                            : '<span style="color:#718096; font-style:italic;">No registrado</span>'
                                        }
                                    </div>
                                </div>
                                <div class="wc-info-item">
                                    <span class="wc-info-icon">🏠</span>
                                    <div>
                                        <strong>Ubicaciones:</strong>
                                        ${renderLocationsSummary(center)}
                                    </div>
                                </div>
                            </div>

                            <div class="wc-info-section">
                                <h4 class="wc-info-section-title">🎁 Beneficio para Miembros</h4>
                                <div class="wc-info-promo-box">
                                    <strong>Beneficio Especial:</strong><br>
                                    ${center.promotion_details || '<span style="color:#718096; font-style:italic;">No se ha configurado la promoción para los miembros de Pata Amiga.</span>'}
                                </div>

                                <h4 class="wc-info-section-title" style="margin-top: 15px;">🌐 Redes Sociales</h4>
                                <div class="wc-info-socials">
                                    ${social.instagram 
                                        ? `<a href="${social.instagram}" target="_blank" class="wc-info-social-btn instagram" title="Instagram">${INSTAGRAM_SVG}</a>` 
                                        : ''
                                    }
                                    ${social.facebook 
                                        ? `<a href="${social.facebook}" target="_blank" class="wc-info-social-btn facebook" title="Facebook">${FACEBOOK_SVG}</a>` 
                                        : ''
                                    }
                                    ${social.tiktok 
                                        ? `<a href="${social.tiktok}" target="_blank" class="wc-info-social-btn tiktok" title="TikTok">${TIKTOK_SVG}</a>` 
                                        : ''
                                    }
                                    ${social.website 
                                        ? `<a href="${social.website}" target="_blank" class="wc-info-social-btn website" title="Sitio Web">${WEBSITE_SVG}</a>` 
                                        : ''
                                    }
                                    ${(!social.instagram && !social.facebook && !social.tiktok && !social.website) 
                                        ? '<span style="color:#718096; font-size:0.9rem; font-style:italic;">Ninguna red social agregada</span>' 
                                        : ''
                                    }
                                </div>
                            </div>
                        </div>

                        <div class="wc-info-actions">
                            <button id="btn-edit-profile" class="wc-btn wc-btn-secondary">Editar Información</button>
                        </div>
                    </div>
                </div>

                <div style="text-align: right; margin-top: 50px;">
                    <button id="wc-btn-exit" class="wc-btn" style="background:none; border:none; color:#888; text-decoration:underline;">Deseo salir de la manada</button>
                </div>
            </div>
        `;

        container.querySelector('#btn-view-appointments').addEventListener('click', () => showAppointmentsModal(container, center));
        container.querySelector('#btn-view-payments').addEventListener('click', () => showPaymentsModal(container, center));
        container.querySelector('#btn-edit-profile').addEventListener('click', () => showEditProfileModal(container, center));
        container.querySelector('#wc-btn-exit').addEventListener('click', () => showExitModal(container, center));

        // Mostrar modal de bienvenida si es necesario
        if (!center.welcome_shown && center.status === 'approved') {
            showWelcomeModal(center);
        }
    }

    function showWelcomeModal(center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        overlay.innerHTML = `
            <div class="wc-modal" style="text-align:center;">
                <div class="wc-status-icon">🎉</div>
                <h2 class="wc-title">Felicidades por unirte a la manada de Pata Amiga</h2>
                <p>Tu solicitud para ser parte de nuestra red de Centros de Bienestar ha sido <strong>aprobada</strong>.</p>
                <p>A partir de este momento ya puedes administrar solicitudes de miembros y gestionar citas desde este panel.</p>
                <button id="btn-welcome-close" class="wc-btn wc-btn-primary" style="width:100%; margin-top:20px;">Comenzar ahora</button>
            </div>
        `;
        
        overlay.querySelector('#btn-welcome-close').addEventListener('click', async () => {
            overlay.remove();
            // Marcar como mostrado en la DB
            await fetch(`${CONFIG.API_BASE_URL}/api/wellness/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    memberstack_id: center.memberstack_id, 
                    welcome_shown: true 
                })
            });
        });

        document.body.appendChild(overlay);
    }

    function showPaymentsModal(center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        
        const paymentsList = (center.payments || []).map(p => `
            <tr>
                <td>${new Date(p.paid_at || p.created_at).toLocaleDateString()}</td>
                <td>Pago de Apoyo Económico</td>
                <td class="wc-amount">$${p.amount.toFixed(2)}</td>
                <td><span class="wc-status-badge status-approved">${p.status}</span></td>
            </tr>
        `).join('');

        overlay.innerHTML = `
            <div class="wc-modal">
                <div class="wc-modal-header">
                    <h2 class="wc-title">Historial de Pagos (Apoyo Económico)</h2>
                    <button class="wc-close-btn">&times;</button>
                </div>
                <p>Estos son los pagos que Pata Amiga ha realizado a tu centro por servicios a nuestros miembros.</p>
                
                <table class="wc-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Concepto</th>
                            <th>Monto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paymentsList.length > 0 ? paymentsList : '<tr><td colspan="4" style="text-align:center; padding:30px;">Aún no tienes pagos registrados.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('.wc-close-btn').addEventListener('click', () => overlay.remove());
    }

    function showAppointmentsModal(center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        
        const apps = center.appointments || [];
        const pending = apps.filter(a => a.status === 'pending');
        const active = apps.filter(a => a.status === 'accepted');
        const history = apps.filter(a => a.status === 'completed' || a.status === 'rejected');

        overlay.innerHTML = `
            <div class="wc-modal">
                <div class="wc-modal-header">
                    <h2 class="wc-title">Gestión de Citas</h2>
                    <button class="wc-close-btn">&times;</button>
                </div>
                
                <p class="wc-modal-description">Aquí podrás gestionar las citas veterinarias solicitadas por los miembros de Pata Amiga.</p>

                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <button class="wc-btn tab-btn active" data-tab="pending">Solicitudes (${pending.length})</button>
                    <button class="wc-btn tab-btn" data-tab="active">Calendario (${active.length})</button>
                    <button class="wc-btn tab-btn" data-tab="history">Historial</button>
                </div>

                <div id="tab-content"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        const tabContent = overlay.querySelector('#tab-content');

        const renderTab = (tabName) => {
            let html = '';
            if (tabName === 'pending') {
                html = `
                    <table class="wc-table">
                        <thead>
                            <tr>
                                <th>Fecha Sugerida</th>
                                <th>Mascota</th>
                                <th>Miembro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pending.map(a => `
                                <tr>
                                    <td>${new Date(a.appointment_date).toLocaleString()}</td>
                                    <td>${a.pet?.name || 'N/A'}</td>
                                    <td>${a.member?.first_name || 'N/A'}</td>
                                    <td>
                                        <button class="wc-btn wc-btn-secondary btn-action" data-id="${a.id}" data-action="accepted">Aceptar</button>
                                        <button class="wc-btn wc-btn-danger btn-action" data-id="${a.id}" data-action="rejected">Rechazar</button>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay solicitudes pendientes.</td></tr>'}
                        </tbody>
                    </table>
                `;
            } else if (tabName === 'active') {
                html = `
                    <table class="wc-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Mascota</th>
                                <th>Miembro</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${active.map(a => `
                                <tr>
                                    <td>${new Date(a.appointment_date).toLocaleString()}</td>
                                    <td>${a.pet?.name || 'N/A'}</td>
                                    <td>${a.member?.first_name || 'N/A'}</td>
                                    <td><span class="wc-status-badge status-approved">Aceptada</span></td>
                                    <td>
                                        <button class="wc-btn wc-btn-secondary btn-action" data-id="${a.id}" data-action="completed">Finalizar</button>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay citas en calendario.</td></tr>'}
                        </tbody>
                    </table>
                `;
            } else if (tabName === 'history') {
                html = `
                    <table class="wc-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Mascota</th>
                                <th>Estado</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.map(a => `
                                <tr>
                                    <td>${new Date(a.appointment_date).toLocaleDateString()}</td>
                                    <td>${a.pet?.name || 'N/A'}</td>
                                    <td><span class="wc-status-badge status-${a.status}">${a.status === 'completed' ? 'Atendido' : 'Rechazado'}</span></td>
                                    <td class="wc-amount">$${(a.amount || 0).toFixed(2)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px;">Historial vacío.</td></tr>'}
                        </tbody>
                    </table>
                `;
            }
            tabContent.innerHTML = html;

            // Re-vincular eventos de acción
            tabContent.querySelectorAll('.btn-action').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const action = btn.getAttribute('data-action');
                    
                    let details = {};
                    if (action === 'rejected') {
                        const reason = prompt('Motivo del rechazo (opcional):') || 'no_availability';
                        details = { rejection_reason: reason };
                    }

                    if (action === 'completed') {
                        const amount = prompt('Monto final del servicio (ej: 350.00):');
                        if (!amount) return;
                        
                        // Crear input de archivo dinámico para la evidencia
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*,application/pdf';
                        
                        const filePromise = new Promise((resolve) => {
                            fileInput.onchange = () => resolve(fileInput.files[0]);
                            // Simular click
                            fileInput.click();
                        });

                        alert('Por favor selecciona la evidencia del servicio (foto o receta).');
                        const file = await filePromise;
                        if (!file) {
                            alert('La evidencia es obligatoria para finalizar el servicio.');
                            return;
                        }

                        btn.disabled = true;
                        btn.innerText = 'Subiendo evidencia...';

                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('appointmentId', id);
                        formData.append('memberstackId', center.memberstack_id);

                        try {
                            const uploadRes = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/appointments/upload-evidence`, {
                                method: 'POST',
                                body: formData
                            });
                            const uploadData = await uploadRes.json();
                            if (!uploadData.success) {
                                alert('Error al subir evidencia: ' + uploadData.error);
                                btn.disabled = false;
                                btn.innerText = 'Finalizar';
                                return;
                            }
                        } catch (err) {
                            alert('Error de conexión al subir archivo');
                            btn.disabled = false;
                            btn.innerText = 'Finalizar';
                            return;
                        }

                        details = { amount: parseFloat(amount) };
                    }

                    btn.disabled = true;
                    btn.innerText = 'Procesando...';
                    
                    const res = await updateAppointmentStatus(id, center.memberstack_id, action, details);
                    if (res.success) {
                        alert('Cita actualizada');
                        overlay.remove();
                        init(); // Recargar datos
                    } else {
                        alert('Error: ' + res.error);
                        btn.disabled = false;
                        btn.innerText = action === 'accepted' ? 'Aceptar' : 'Rechazar';
                    }
                });
            });
        };

        renderTab('pending');

        overlay.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderTab(btn.getAttribute('data-tab'));
            });
        });

        overlay.querySelector('.wc-close-btn').addEventListener('click', () => overlay.remove());
    }

    function showExitModal(container, center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';
        
        const renderStep1 = () => {
            overlay.innerHTML = `
                <div class="wc-modal" style="max-width:500px; text-align:center;">
                    <h2 class="wc-title">Lamentamos que te vayas</h2>
                    <p>¿Por qué has decidido salir de la manada? Tu feedback nos ayuda a mejorar.</p>
                    <div style="margin: 20px 0;">
                        <select id="wc-exit-reason" style="width:100%; padding:10px; border-radius:10px; border:2px solid #000;">
                            <option value="">Selecciona un motivo...</option>
                            <option value="too_many_pets">Demasiada demanda de servicios</option>
                            <option value="payment_delay">Retraso en el pago de beneficios</option>
                            <option value="change_of_business">Cambio de giro de negocio / Cierre</option>
                            <option value="tech_issues">Problemas técnicos con la plataforma</option>
                            <option value="other">Otro motivo</option>
                        </select>
                        <textarea id="wc-exit-details" placeholder="Cuéntanos más... (opcional)" style="width:100%; margin-top:10px; padding:10px; border-radius:10px; border:2px solid #000; min-height:80px;"></textarea>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button id="wc-modal-cancel" class="wc-btn">Quedarme en la Manada</button>
                        <button id="wc-modal-next" class="wc-btn wc-btn-danger">Continuar con la Salida</button>
                    </div>
                </div>
            `;
            overlay.querySelector('#wc-modal-cancel').addEventListener('click', () => overlay.remove());
            overlay.querySelector('#wc-modal-next').addEventListener('click', () => {
                const reason = overlay.querySelector('#wc-exit-reason').value;
                if (!reason) {
                    alert('Por favor selecciona un motivo.');
                    return;
                }
                renderStep2(reason, overlay.querySelector('#wc-exit-details').value);
            });
        };

        const renderStep2 = (reason, details) => {
            overlay.innerHTML = `
                <div class="wc-modal" style="max-width:500px; text-align:center;">
                    <h2 class="wc-title">¡Espera! 🐾</h2>
                    <p>Al salir de la manada, dejarás de recibir solicitudes de nuevos miembros y tu perfil será desactivado.</p>
                    <p style="font-weight:bold; color:#E53E3E;">¿Sabías que podemos ajustar tu capacidad si tienes mucha demanda?</p>
                    <p>Si confirmas la salida, tus datos permanecerán en nuestro sistema pero el acceso será bloqueado.</p>
                    <div style="display:flex; gap:10px; justify-content:center; margin-top:30px;">
                        <button id="wc-modal-back" class="wc-btn">Volver</button>
                        <button id="wc-modal-confirm" class="wc-btn wc-btn-danger">Confirmar Salida Definitiva</button>
                    </div>
                </div>
            `;
            overlay.querySelector('#wc-modal-back').addEventListener('click', renderStep1);
            overlay.querySelector('#wc-modal-confirm').addEventListener('click', async () => {
                const fullReason = `${reason}: ${details}`;
                const result = await cancelAccount(center.memberstack_id, fullReason);
                if (result.success) {
                    overlay.remove();
                    renderBlocked(container);
                } else {
                    alert('Error al procesar la salida. Intenta de nuevo.');
                }
            });
        };

        renderStep1();
        document.body.appendChild(overlay);
    }

    async function handleLogoUpload(center, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('memberstackId', center.memberstack_id);

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload/wellness-logo`, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('Error uploading logo:', error);
            return { success: false, error: 'Error de conexión al subir logo' };
        }
    }

    function bindLocationPhotoInputs(root, center, submitText = 'Guardar Cambios') {
        root.querySelectorAll('[data-location-photo-input]').forEach(input => {
            if (input.dataset.bound) return;

            input.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                event.target.value = '';
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Solo se aceptan imagenes');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('La imagen no puede superar 5MB');
                    return;
                }

                const panel = input.closest('.wc-location-photos-panel');
                const hiddenInput = panel?.querySelector('input[type="hidden"]');
                const preview = panel?.querySelector('[data-location-photo-preview]');
                const saveButton = root.querySelector('#btn-save-profile');
                const originalText = saveButton?.innerText || submitText;

                if (saveButton) {
                    saveButton.disabled = true;
                    saveButton.innerText = 'Subiendo foto...';
                }

                const result = await uploadWellnessLocationPhoto(center, file, input.dataset.locationKey || 'location');
                if (result.success) {
                    const nextUrls = [...parsePhotoUrls(hiddenInput?.value || ''), result.url];
                    if (hiddenInput) hiddenInput.value = serializePhotoUrls(nextUrls);
                    if (preview) preview.innerHTML = renderPhotoPreview(nextUrls);
                    alert('Foto de sucursal subida correctamente');
                } else {
                    alert('Error al subir foto: ' + result.error);
                }

                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.innerText = originalText;
                }
            });

            input.dataset.bound = 'true';
        });
    }

    function bindEditProfileForm(root, center, options = {}) {
        const form = root.querySelector(options.formSelector || '#wc-edit-profile-form');
        if (!form) return;

        const submitText = options.submitText || 'Guardar Cambios';
        const onSuccess = options.onSuccess || (() => init());
        const locationButton = root.querySelector('#btn-get-location');
        const closeButton = root.querySelector('.wc-close-btn');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                const overlay = closeButton.closest('.wc-modal-overlay');
                if (overlay) overlay.remove();
            });
        }

        bindLocationPhotoInputs(root, center, submitText);

        if (locationButton) {
            locationButton.addEventListener('click', () => {
                if ("geolocation" in navigator) {
                    locationButton.innerText = 'Obteniendo...';
                    navigator.geolocation.getCurrentPosition((position) => {
                        root.querySelector('#wc-lat').value = position.coords.latitude.toFixed(8);
                        root.querySelector('#wc-lng').value = position.coords.longitude.toFixed(8);
                        locationButton.innerText = '✅ Ubicación obtenida';
                    }, () => {
                        alert('Error al obtener ubicación. Por favor ingrésala manualmente.');
                        locationButton.innerText = '📍 Intentar de nuevo';
                    });
                } else {
                    alert('Tu navegador no soporta geolocalización.');
                }
            });
        }

        const branchesEditor = form.querySelector('[data-branches-editor]');
        const locationsList = form.querySelector('[data-locations-list]');
        const addLocationButton = form.querySelector('#btn-add-location');
        const branchToggle = form.querySelector('[data-branch-toggle]');

        const refreshBranchTitles = () => {
            if (!locationsList) return;
            const rows = locationsList.querySelectorAll('[data-location-row]');
            rows.forEach((row, index) => {
                const title = row.querySelector('.wc-branch-title');
                if (title) title.innerText = `Sucursal adicional ${index + 1}`;
            });
            if (rows.length === 0) {
                locationsList.innerHTML = '<p class="wc-branches-empty">Agrega las sucursales adicionales que quieras registrar.</p>';
            }
        };

        const bindBranchRow = (row) => {
            const removeButton = row.querySelector('[data-remove-location]');
            const branchLocationButton = row.querySelector('[data-get-branch-location]');

            if (removeButton) {
                removeButton.addEventListener('click', () => {
                    row.remove();
                    refreshBranchTitles();
                });
            }

            if (branchLocationButton) {
                branchLocationButton.addEventListener('click', () => {
                    if (!("geolocation" in navigator)) {
                        alert('Tu navegador no soporta geolocalización.');
                        return;
                    }

                    branchLocationButton.innerText = 'Obteniendo...';
                    navigator.geolocation.getCurrentPosition((position) => {
                        row.querySelector('.wc-location-lat').value = position.coords.latitude.toFixed(8);
                        row.querySelector('.wc-location-lng').value = position.coords.longitude.toFixed(8);
                        branchLocationButton.innerText = 'Ubicación obtenida';
                    }, () => {
                        alert('Error al obtener ubicación. Por favor ingrésala manualmente.');
                        branchLocationButton.innerText = 'Intentar de nuevo';
                    });
                });
            }

            if (window.google && window.google.maps && window.google.maps.places) {
                const addressInput = row.querySelector('.wc-location-address');
                if (addressInput && !addressInput.dataset.autocompleteReady) {
                    const autocomplete = new google.maps.places.Autocomplete(addressInput);
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (place.geometry) {
                            row.querySelector('.wc-location-lat').value = place.geometry.location.lat().toFixed(8);
                            row.querySelector('.wc-location-lng').value = place.geometry.location.lng().toFixed(8);
                        }
                    });
                    addressInput.dataset.autocompleteReady = 'true';
                }
            }
        };

        if (branchToggle && branchesEditor) {
            branchToggle.querySelectorAll('[name="has_branches"]').forEach(input => {
                input.addEventListener('change', () => {
                    branchesEditor.style.display = input.value === 'yes' && input.checked ? '' : 'none';
                });
            });
        }

        if (locationsList) {
            locationsList.querySelectorAll('[data-location-row]').forEach(bindBranchRow);
        }

        if (addLocationButton && locationsList) {
            addLocationButton.addEventListener('click', () => {
                const empty = locationsList.querySelector('.wc-branches-empty');
                if (empty) empty.remove();

                const index = locationsList.querySelectorAll('[data-location-row]').length;
                locationsList.insertAdjacentHTML('beforeend', renderBranchCard({}, index));
                const newRow = locationsList.querySelector('[data-location-row]:last-child');
                if (newRow) bindBranchRow(newRow);
                bindLocationPhotoInputs(root, center, submitText);
            });
        }

        const logoInput = root.querySelector('#wc-logo-input');
        const selectLogoButton = root.querySelector('#btn-select-logo');
        if (logoInput && selectLogoButton) {
            selectLogoButton.addEventListener('click', () => logoInput.click());

            logoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const previewImg = root.querySelector('#logo-preview-img');
                const originalSrc = previewImg.src;
                previewImg.src = URL.createObjectURL(file);

                const btnSave = root.querySelector('#btn-save-profile');
                btnSave.disabled = true;
                btnSave.innerText = 'Subiendo logo...';

                const res = await handleLogoUpload(center, file);
                if (res.success) {
                    center.logo_url = res.url;
                    alert('Logo subido correctamente');
                } else {
                    alert('Error al subir logo: ' + res.error);
                    previewImg.src = originalSrc;
                }
                btnSave.disabled = false;
                btnSave.innerText = submitText;
            });
        }

        if (window.google && window.google.maps && window.google.maps.places) {
            const addressInput = root.querySelector('#wc-address-input');
            const autocomplete = new google.maps.places.Autocomplete(addressInput);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    root.querySelector('#wc-lat').value = place.geometry.location.lat().toFixed(8);
                    root.querySelector('#wc-lng').value = place.geometry.location.lng().toFixed(8);
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const updateData = {
                memberstack_id: center.memberstack_id,
                name: formData.get('name'),
                establishment_name: formData.get('establishment_name'),
                phone: formData.get('phone'),
                bank_name: formData.get('bank_name'),
                bank_clabe: String(formData.get('bank_clabe') || '').replace(/\D/g, '').slice(0, 18),
                bank_holder: formData.get('bank_holder'),
                address: formData.get('address'),
                lat: parseFloat(formData.get('lat')) || null,
                lng: parseFloat(formData.get('lng')) || null,
                locations: collectWellnessLocations(form),
                promotion_details: formData.get('promotion_details'),
                social_links: {
                    instagram: formData.get('social_instagram'),
                    facebook: formData.get('social_facebook'),
                    tiktok: formData.get('social_tiktok'),
                    website: formData.get('social_website')
                }
            };

            const btn = root.querySelector('#btn-save-profile');
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                const result = await response.json();
                if (result.success) {
                    alert('Perfil actualizado con éxito');
                    onSuccess();
                } else {
                    alert('Error al actualizar: ' + result.error);
                    btn.disabled = false;
                    btn.innerText = submitText;
                }
            } catch {
                alert('Error de conexión');
                btn.disabled = false;
                btn.innerText = submitText;
            }
        });
    }

    function showEditProfileModal(container, center) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-modal-overlay';

        overlay.innerHTML = `<div class="wc-modal">${renderEditProfileForm(center)}</div>`;
        document.body.appendChild(overlay);
        bindEditProfileForm(overlay, center, {
            submitText: 'Guardar Cambios',
            onSuccess: () => {
                overlay.remove();
                init();
            }
        });
        return;
        
        const social = center.social_links || {};

        overlay.innerHTML = `
            <div class="wc-modal">
                <div class="wc-modal-header">
                    <h2 class="wc-title">Editar Perfil del Centro</h2>
                    <button class="wc-close-btn">&times;</button>
                </div>
                
                <form id="wc-edit-profile-form">
                    <h3 class="wc-section-title">Marca y Logo</h3>
                    <div class="wc-logo-preview-container">
                        <img src="${center.logo_url || DEFAULT_LOGO_PLACEHOLDER}" class="wc-logo-preview" id="logo-preview-img" alt="Logo del centro">
                        <div style="flex:1;">
                            <p style="font-size:0.8rem; color:#64748b; margin-bottom:10px;">Recomendado: Imagen cuadrada, min 200x200px (PNG o JPG).</p>
                            <input type="file" id="wc-logo-input" accept="image/*" style="display:none;">
                            <button type="button" id="btn-select-logo" class="wc-btn wc-btn-secondary" style="padding:8px 15px; font-size:0.9rem;">Seleccionar Imagen</button>
                        </div>
                    </div>

                    <h3 class="wc-section-title">Información de Contacto</h3>
                    <div class="wc-form-group">
                        <label class="wc-label">Nombre del Establecimiento</label>
                        <input type="text" name="establishment_name" class="wc-input" value="${center.establishment_name || ''}" placeholder="Ej: Clínica Vet Pata Amiga">
                    </div>
                    
                    <div class="wc-form-group">
                        <label class="wc-label">Teléfono de Contacto</label>
                        <input type="tel" name="phone" class="wc-input" value="${center.phone || ''}" placeholder="Ej: 5512345678">
                    </div>

                    <h3 class="wc-section-title">Ubicación y Geolocalización</h3>
                    <div class="wc-form-group">
                        <label class="wc-label">Dirección Completa</label>
                        <textarea name="address" id="wc-address-input" class="wc-input" style="min-height:80px;" placeholder="Calle, número, colonia, CP y ciudad">${center.address || ''}</textarea>
                    </div>

                    <div class="wc-input-row">
                        <div class="wc-form-group">
                            <label class="wc-label">Latitud</label>
                            <input type="number" step="any" name="lat" id="wc-lat" class="wc-input" value="${center.lat || ''}" placeholder="Ej: 19.4326">
                        </div>
                        <div class="wc-form-group">
                            <label class="wc-label">Longitud</label>
                            <input type="number" step="any" name="lng" id="wc-lng" class="wc-input" value="${center.lng || ''}" placeholder="Ej: -99.1332">
                        </div>
                    </div>
                    <button type="button" id="btn-get-location" class="wc-btn" style="width:100%; margin-bottom:20px; font-size:0.9rem;">📍 Obtener mi ubicación actual</button>

                    ${renderBranchesEditor(center)}

                    <h3 class="wc-section-title">Redes Sociales</h3>
                    <div class="wc-input-row">
                        <div class="wc-form-group">
                            <label class="wc-label">Instagram (URL)</label>
                            <input type="url" name="social_instagram" class="wc-input" value="${social.instagram || ''}" placeholder="https://instagram.com/...">
                        </div>
                        <div class="wc-form-group">
                            <label class="wc-label">Facebook (URL)</label>
                            <input type="url" name="social_facebook" class="wc-input" value="${social.facebook || ''}" placeholder="https://facebook.com/...">
                        </div>
                    </div>
                    <div class="wc-input-row">
                        <div class="wc-form-group">
                            <label class="wc-label">TikTok (URL)</label>
                            <input type="url" name="social_tiktok" class="wc-input" value="${social.tiktok || ''}" placeholder="https://tiktok.com/@...">
                        </div>
                        <div class="wc-form-group">
                            <label class="wc-label">Sitio Web</label>
                            <input type="url" name="social_website" class="wc-input" value="${social.website || ''}" placeholder="https://...">
                        </div>
                    </div>

                    <h3 class="wc-section-title">Promoción para Miembros</h3>
                    <div class="wc-form-group">
                        <label class="wc-label">Descripción del Beneficio</label>
                        <textarea name="promotion_details" class="wc-input" style="min-height:100px;" placeholder="Ej: 15% de descuento en consultas generales y 10% en farmacia.">${center.promotion_details || ''}</textarea>
                    </div>

                    <div style="margin-top:30px;">
                        <button type="submit" id="btn-save-profile" class="wc-btn wc-btn-primary" style="width:100%;">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);
        bindWellnessBranchEditor(overlay.querySelector('#wc-edit-profile-form'));

        // Geolocation logic
        overlay.querySelector('#btn-get-location').addEventListener('click', () => {
            if ("geolocation" in navigator) {
                const btn = overlay.querySelector('#btn-get-location');
                btn.innerText = 'Obteniendo...';
                navigator.geolocation.getCurrentPosition((position) => {
                    overlay.querySelector('#wc-lat').value = position.coords.latitude.toFixed(8);
                    overlay.querySelector('#wc-lng').value = position.coords.longitude.toFixed(8);
                    btn.innerText = '✅ Ubicación obtenida';
                }, (error) => {
                    alert('Error al obtener ubicación. Por favor ingrésala manualmente.');
                    btn.innerText = '📍 Intentar de nuevo';
                });
            } else {
                alert('Tu navegador no soporta geolocalización.');
            }
        });

        // Logo upload logic
        const logoInput = overlay.querySelector('#wc-logo-input');
        overlay.querySelector('#btn-select-logo').addEventListener('click', () => logoInput.click());
        
        logoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const previewImg = overlay.querySelector('#logo-preview-img');
            const originalSrc = previewImg.src;
            previewImg.src = URL.createObjectURL(file);

            const btnSave = overlay.querySelector('#btn-save-profile');
            btnSave.disabled = true;
            btnSave.innerText = 'Subiendo logo...';

            const res = await handleLogoUpload(center, file);
            if (res.success) {
                center.logo_url = res.url; // Actualizar localmente
                alert('Logo subido correctamente');
            } else {
                alert('Error al subir logo: ' + res.error);
                previewImg.src = originalSrc;
            }
            btnSave.disabled = false;
            btnSave.innerText = 'Guardar Cambios';
        });

        // Google Places Autocomplete (if script loaded)
        if (window.google && window.google.maps && window.google.maps.places) {
            const addressInput = overlay.querySelector('#wc-address-input');
            const autocomplete = new google.maps.places.Autocomplete(addressInput);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    overlay.querySelector('#wc-lat').value = place.geometry.location.lat().toFixed(8);
                    overlay.querySelector('#wc-lng').value = place.geometry.location.lng().toFixed(8);
                }
            });
        }

        // Form Submission
        overlay.querySelector('#wc-edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const updateData = {
                memberstack_id: center.memberstack_id,
                establishment_name: formData.get('establishment_name'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                lat: parseFloat(formData.get('lat')) || null,
                lng: parseFloat(formData.get('lng')) || null,
                locations: collectWellnessLocations(e.target),
                promotion_details: formData.get('promotion_details'),
                social_links: {
                    instagram: formData.get('social_instagram'),
                    facebook: formData.get('social_facebook'),
                    tiktok: formData.get('social_tiktok'),
                    website: formData.get('social_website')
                }
            };

            const btn = overlay.querySelector('#btn-save-profile');
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                const result = await response.json();
                if (result.success) {
                    alert('Perfil actualizado con éxito');
                    overlay.remove();
                    init(); // Recargar todo
                } else {
                    alert('Error al actualizar: ' + result.error);
                    btn.disabled = false;
                    btn.innerText = 'Guardar Cambios';
                }
            } catch (error) {
                alert('Error de conexión');
                btn.disabled = false;
                btn.innerText = 'Guardar Cambios';
            }
        });

        overlay.querySelector('.wc-close-btn').addEventListener('click', () => overlay.remove());
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    async function init() {
        const target = document.getElementById('pata-wellness-dashboard');
        if (!target) return;

        // Inyectar estilos
        if (!document.getElementById('wc-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'wc-styles';
            styleTag.innerHTML = STYLES;
            document.head.appendChild(styleTag);
        }

        renderLoading(target);

        // Esperar a Memberstack
        if (!window.$memberstackDom) {
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (window.$memberstackDom) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 500);
            });
        }

        const memberResult = await window.$memberstackDom.getCurrentMember();
        if (!memberResult?.data) {
            target.innerHTML = `<p style="text-align:center; padding:50px;">Por favor, inicia sesión para acceder al panel.</p>`;
            return;
        }

        const center = await fetchCenterData(memberResult.data.id);
        if (!center) {
            target.innerHTML = `<p style="text-align:center; padding:50px;">No encontramos un registro de aliado vinculado a esta cuenta.</p>`;
            return;
        }

        if (center.status === 'cancelled') {
            renderBlocked(target);
        } else if (center.status === 'pending') {
            renderPending(target, center);
        } else if (center.status === 'rejected') {
            renderRejected(target, center);
        } else if (center.status === 'appealed') {
            renderAppealed(target, center);
        } else {
            renderDashboard(target, center);
        }
    }

    // Ejecutar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
