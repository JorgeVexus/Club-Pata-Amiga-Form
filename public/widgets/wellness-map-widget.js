/**
 * 🗺️ Widget Mapa Interactivo de Centros de Bienestar - Club Pata Amiga
 * Integración para Webflow
 */

(function () {
    'use strict';

    const CONFIG = {
        API_BASE_URL: window.PATA_AMIGA_CONFIG?.API_BASE_URL || 'https://app.pataamiga.mx',
        CONTAINER_ID: 'wellness-map-container',
        LEAFLET_VERSION: '1.9.4',
        MEXICO_CENTER: [23.6345, -102.5528],
        DEFAULT_ZOOM: 5
    };

    const STYLES = `
        #${CONFIG.CONTAINER_ID} {
            width: 100%;
            height: 500px;
            border-radius: 30px;
            border: 3px solid #000;
            overflow: hidden;
            box-shadow: 10px 10px 0px rgba(0,0,0,0.05);
            font-family: 'Outfit', sans-serif;
            background: #f8f9fa;
        }

        .wc-map-popup {
            padding: 5px;
            text-align: center;
        }

        .wc-map-popup-title {
            font-family: 'Fraiche', sans-serif;
            font-size: 1.1rem;
            margin-bottom: 5px;
            color: #1E293B;
        }

        .wc-map-popup-address {
            font-size: 0.85rem;
            color: #64748B;
            margin-bottom: 8px;
        }

        .wc-map-popup-logo {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            object-fit: cover;
            margin-bottom: 10px;
            border: 2px solid #000;
        }

        .wc-map-photo-strip {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            margin-bottom: 10px;
        }

        .wc-map-photo {
            width: 100%;
            aspect-ratio: 1.4;
            object-fit: cover;
            border-radius: 10px;
            border: 1px solid #CBD5E1;
            background: #F8FAFC;
        }

        .wc-map-popup-phone {
            font-size: 0.9rem;
            color: #00BBB4;
            font-weight: bold;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            text-decoration: none;
            border: 2px solid #000;
            padding: 8px 12px;
            border-radius: 50px;
            background: #fff;
            justify-content: center;
            transition: all 0.2s ease;
            font-family: 'Outfit', sans-serif;
        }

        .wc-map-popup-phone:hover {
            background: #00BBB4;
            color: #fff;
        }

        .wc-map-popup-phone span {
            margin-right: 8px;
            font-size: 1.1rem;
        }

        .wc-map-badge {
            display: inline-block;
            padding: 2px 8px;
            background: #D1FAE5;
            color: #065F46;
            border-radius: 50px;
            font-size: 0.7rem;
            font-weight: bold;
            margin-right: 5px;
            margin-bottom: 5px;
            border: 1px solid #065F46;
        }

        .leaflet-popup-content-wrapper {
            border-radius: 20px !important;
            border: 2px solid #000 !important;
            box-shadow: 5px 5px 0px rgba(0,0,0,0.1) !important;
        }

        .leaflet-popup-tip {
            border: 2px solid #000 !important;
        }

        @media (max-width: 768px) {
            #${CONFIG.CONTAINER_ID} {
                height: 400px;
                border-radius: 20px;
            }
            .leaflet-popup-content {
                width: 220px !important;
                margin: 15px !important;
            }
        }
    `;

    function loadDependencies() {
        return new Promise((resolve, reject) => {
            if (window.L) {
                resolve();
                return;
            }

            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://unpkg.com/leaflet@${CONFIG.LEAFLET_VERSION}/dist/leaflet.css`;
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement('script');
            script.src = `https://unpkg.com/leaflet@${CONFIG.LEAFLET_VERSION}/dist/leaflet.js`;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function injectStyles() {
        const styleTag = document.createElement('style');
        styleTag.innerHTML = STYLES;
        document.head.appendChild(styleTag);
    }

    async function fetchLocations() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/wellness/locations`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('❌ Error fetching wellness locations:', error);
            return [];
        }
    }

    function createPopupContent(center) {
        const servicesHtml = (center.services || [])
            .slice(0, 3)
            .map(s => `<span class="wc-map-badge">${s}</span>`)
            .join('');
        const locationPhotosHtml = (center.photo_urls || [])
            .slice(0, 4)
            .map(url => `<img src="${url}" class="wc-map-photo" alt="Foto de ${center.establishment_name}">`)
            .join('');

        return `
            <div class="wc-map-popup">
                ${center.logo_url ? `<img src="${center.logo_url}" class="wc-map-popup-logo" alt="${center.establishment_name}">` : ''}
                ${locationPhotosHtml ? `<div class="wc-map-photo-strip">${locationPhotosHtml}</div>` : ''}
                <div class="wc-map-popup-title">${center.establishment_name}</div>
                <div class="wc-map-popup-address">${center.address || 'Ubicación física'}</div>
                
                ${center.phone ? `
                    <a href="tel:${center.phone.replace(/\s+/g, '')}" class="wc-map-popup-phone">
                        <span>📞</span> ${center.phone}
                    </a>
                ` : ''}

                <div class="wc-map-services">${servicesHtml}</div>
                ${center.promotion_details ? `<p style="font-size: 0.8rem; margin-top: 8px; color: #FE8F15; font-weight: bold;">🎁 ${center.promotion_details}</p>` : ''}
            </div>
        `;
    }

    async function init() {
        const container = document.getElementById(CONFIG.CONTAINER_ID);
        if (!container) {
            if (CONFIG.DEBUG) console.warn(`Wellness Map: Container #${CONFIG.CONTAINER_ID} not found.`);
            return;
        }

        try {
            await loadDependencies();
            injectStyles();

            const map = L.map(CONFIG.CONTAINER_ID).setView(CONFIG.MEXICO_CENTER, CONFIG.DEFAULT_ZOOM);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            const locations = await fetchLocations();

            const markers = L.featureGroup();

            locations.forEach(loc => {
                if (!loc.lat || !loc.lng) return;

                const marker = L.marker([loc.lat, loc.lng], {
                    title: loc.establishment_name
                });

                marker.bindPopup(createPopupContent(loc), {
                    maxWidth: 250,
                    className: 'wc-leaflet-popup'
                });

                // Desktop Hover interaction
                marker.on('mouseover', function (e) {
                    // Solo abrir en hover si no es dispositivo táctil
                    if (!window.matchMedia("(pointer: coarse)").matches) {
                        this.openPopup();
                    }
                });

                // Mobile/Click interaction (handled by bindPopup default, but making sure it works)
                marker.on('click', function (e) {
                    this.openPopup();
                });

                markers.addLayer(marker);
            });

            markers.addTo(map);

            // If there are markers, fit bounds
            if (locations.length > 0) {
                if (locations.length === 1) {
                    // Si solo hay uno, centrar con zoom 5 para mantener vista de México
                    map.setView([locations[0].lat, locations[0].lng], 5);
                } else {
                    // Si hay varios, ajustar con un zoom máximo de 7 para no entrar demasiado
                    map.fitBounds(markers.getBounds(), { padding: [70, 70], maxZoom: 7 });
                }
            }

        } catch (error) {
            console.error('❌ Wellness Map Initialization Error:', error);
            container.innerHTML = `<div style="padding: 20px; text-align: center;">Error al cargar el mapa de centros de bienestar.</div>`;
        }
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
