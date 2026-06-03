'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

// Extender interfaz global para window.dataLayer
declare global {
    interface Window {
        dataLayer: any[];
    }
}

interface GoogleTagManagerProps {
    gtmId: string;
}

export default function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
    const pathname = usePathname();

    // 1. Capturar parámetros UTM de la URL y guardarlos en localStorage/sessionStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
                let hasUrlParams = false;

                utmFields.forEach(field => {
                    const value = urlParams.get(field);
                    if (value) {
                        localStorage.setItem(field, value);
                        sessionStorage.setItem(field, value);
                        console.log(`📡 [UTM Capture] ${field} = ${value}`);
                        hasUrlParams = true;
                    }
                });

                // Si no hay parámetros UTM en la URL, y no hay UTMs guardadas previamente, detectamos Orgánico / Social / Referido / Directo
                if (!hasUrlParams && !localStorage.getItem('utm_source')) {
                    const referrer = document.referrer;
                    let source = 'direct';
                    let medium = 'none';
                    let campaign = 'organic_fallback';

                    if (referrer) {
                        try {
                            const refUrl = new URL(referrer);
                            const host = refUrl.hostname.toLowerCase();

                            // Ignorar visitas desde el propio dominio para evitar auto-referidos
                            const currentHost = window.location.hostname.toLowerCase();
                            if (host !== currentHost) {
                                // Detectar buscadores comunes
                                if (host.includes('google.') || host.includes('bing.') || host.includes('yahoo.') || host.includes('duckduckgo.') || host.includes('baidu.')) {
                                    source = host.replace('www.', '').split('.')[0]; // google, bing, etc.
                                    medium = 'organic';
                                } else if (host.includes('facebook.') || host.includes('instagram.') || host.includes('t.co') || host.includes('twitter.') || host.includes('linkedin.') || host.includes('pinterest.')) {
                                    // Redes sociales orgánicas
                                    source = host.replace('www.', '');
                                    medium = 'social';
                                } else {
                                    // Cualquier otro sitio de referencia
                                    source = host.replace('www.', '');
                                    medium = 'referral';
                                }
                            } else {
                                // Es navegación interna, no hacemos nada para no sobreescribir la sesión inicial
                                return;
                            }
                        } catch (e) {
                            // Error al parsear referrer
                        }
                    }

                    localStorage.setItem('utm_source', source);
                    sessionStorage.setItem('utm_source', source);
                    localStorage.setItem('utm_medium', medium);
                    sessionStorage.setItem('utm_medium', medium);
                    localStorage.setItem('utm_campaign', campaign);
                    sessionStorage.setItem('utm_campaign', campaign);

                    console.log(`📡 [UTM Fallback] source = ${source}, medium = ${medium}, campaign = ${campaign}`);
                }
            } catch (err) {
                console.warn('❌ Error capturing UTM parameters:', err);
            }
        }
    }, []);

    // 2. Enviar evento de page_view virtual al cambiar de ruta (Soporte SPA para GTM/GA4)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'page_view',
                page_path: pathname,
                page_title: document.title,
            });
            console.log(`📊 [GTM PageView] ${pathname}`);
        }
    }, [pathname]);

    return (
        <>
            {/* Google Tag Manager - Script en el head */}
            <Script
                id="gtm-script"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${gtmId}');
                    `,
                }}
            />
        </>
    );
}

// Componente para el noscript (iframe) que va en el body
export function GoogleTagManagerNoScript({ gtmId }: GoogleTagManagerProps) {
    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
            />
        </noscript>
    );
}

/**
 * Envía un evento personalizado al dataLayer de Google Tag Manager
 */
export const trackGTMEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: eventName,
            ...params
        });
        console.log(`📊 [GTM Event] ${eventName}:`, params);
    }
};

/**
 * Registra un evento de compra (purchase) compatible con GA4 E-commerce en GTM
 */
export const trackGTMPurchase = (params: {
    transactionId: string;
    value: number;
    planName: string;
    referralCode?: string;
}) => {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        
        // Limpiar el objeto de e-commerce previo para evitar mezclar datos
        window.dataLayer.push({ ecommerce: null });
        
        // Purgar y empujar el nuevo evento de e-commerce
        window.dataLayer.push({
            event: 'purchase',
            ecommerce: {
                transaction_id: params.transactionId,
                value: params.value,
                tax: 0,
                shipping: 0,
                currency: 'MXN',
                coupon: params.referralCode || '',
                items: [
                    {
                        item_id: params.planName.toLowerCase().replace(/\s+/g, '-'),
                        item_name: params.planName,
                        price: params.value,
                        quantity: 1,
                        item_category: 'membership'
                    }
                ]
            }
        });
        console.log('💰 [GTM Purchase] Evento registrado:', params);
    }
};

