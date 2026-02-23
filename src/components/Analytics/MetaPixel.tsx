'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

// Meta Pixel IDs - Múltiples cuentas
const PIXEL_IDS = [
    '205003538845205',  // Pixel principal (registros)
    '881661401454063',  // Pixel secundario
];

// Extend Window interface for fbq
declare global {
    interface Window {
        fbq: any;
        _fbq: any;
    }
}

export default function MetaPixel() {
    const pathname = usePathname();

    useEffect(() => {
        // Track pageview on route change
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [pathname]);

    return (
        <>
            {/* Meta Pixel Code - Múltiples IDs */}
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            ${PIXEL_IDS.map(id => `fbq('init', '${id}');`).join('\n            ')}
            fbq('track', 'PageView');
          `,
                }}
            />
            {/* Noscript tags para cada Pixel ID */}
            {PIXEL_IDS.map((id) => (
                <noscript key={id}>
                    <img
                        height="1"
                        width="1"
                        style={{ display: 'none' }}
                        src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
                        alt=""
                    />
                </noscript>
            ))}
        </>
    );
}

// Helper functions for tracking custom events
// Estas funciones envían eventos a TODOS los pixeles inicializados
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, params);
    }
};

// Predefined events for common use cases
export const trackLead = (params?: Record<string, any>) => {
    trackEvent('Lead', params);
};

export const trackCompleteRegistration = (params?: Record<string, any>) => {
    trackEvent('CompleteRegistration', params);
};

export const trackSubmitApplication = (params?: Record<string, any>) => {
    trackEvent('SubmitApplication', params);
};

export const trackContact = (params?: Record<string, any>) => {
    trackEvent('Contact', params);
};

// Funciones para trackear eventos en pixeles específicos (si se necesita)
export const trackEventForPixel = (pixelId: string, eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackSingle', pixelId, eventName, params);
    }
};

// Función para trackear solo en el pixel principal
export const trackForPrimaryPixel = (eventName: string, params?: Record<string, any>) => {
    trackEventForPixel(PIXEL_IDS[0], eventName, params);
};

// Función para trackear solo en el pixel secundario
export const trackForSecondaryPixel = (eventName: string, params?: Record<string, any>) => {
    trackEventForPixel(PIXEL_IDS[1], eventName, params);
};
