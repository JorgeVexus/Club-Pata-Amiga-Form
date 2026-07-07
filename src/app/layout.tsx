import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import '@/styles/fonts.css';
import Script from 'next/script';
import MetaPixel from '@/components/Analytics/MetaPixel';
import GoogleTagManager, { GoogleTagManagerNoScript } from '@/components/Analytics/GoogleTagManager';

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
});

export const metadata: Metadata = {
    title: 'Registro de Membresía - Protección para tu Mascota',
    description: 'Únete a nuestra manada y protege a tu mascota con beneficios exclusivos y apoyo económico',
    keywords: ['mascotas', 'membresía', 'seguro mascotas', 'protección animal', 'veterinaria'],
    authors: [{ name: 'Pet Membership' }],
    openGraph: {
        title: 'Registro de Membresía - Protección para tu Mascota',
        description: 'Únete a nuestra manada y protege a tu mascota',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={outfit.variable} suppressHydrationWarning>
            <head>
                <Script
                    id="memberstack-session-storage-guard"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
(function () {
  try {
    var sessionKeys = ['_ms-mid', '_ms-mem'];
    if (window.__pataMemberstackSessionStorageGuard) return;
    window.__pataMemberstackSessionStorageGuard = true;

    var hasSessionCookie = document.cookie.indexOf('pata_session_active=') > -1;

    if (!hasSessionCookie) {
      var hadPersistentToken = Boolean(localStorage.getItem('_ms-mid'));

      sessionKeys.forEach(function (key) {
        localStorage.removeItem(key);
      });

      document.cookie = "pata_session_active=true; path=/; SameSite=Lax" + (location.protocol === 'https:' ? '; Secure' : '');

      if (hadPersistentToken) {
        var attempts = 0;
        var expireLegacySession = setInterval(function () {
          attempts += 1;
          if (window.$memberstackDom && typeof window.$memberstackDom.logout === 'function') {
            clearInterval(expireLegacySession);
            window.$memberstackDom.logout().catch(function () {});
          } else if (attempts >= 20) {
            clearInterval(expireLegacySession);
          }
        }, 100);
      }
    } else {
      document.cookie = "pata_session_active=true; path=/; SameSite=Lax" + (location.protocol === 'https:' ? '; Secure' : '');
    }
  } catch (error) {
    console.warn('[Pata Amiga] No se pudo activar la politica de sesion temporal.', error);
  }
})();
                        `,
                    }}
                />
                {/* Memberstack Script */}
                <Script
                    id="memberstack-script"
                    data-memberstack-app={process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID}
                    src="https://static.memberstack.com/scripts/v2/memberstack.js"
                    strategy="beforeInteractive"
                />
            </head>
            <body>
                {/* Google Tag Manager (noscript) - Después de la etiqueta body */}
                <GoogleTagManagerNoScript gtmId="GTM-N3WV4GPT" />

                {/* Google Places API */}
                <Script
                    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDX-vCWYQ2_Lh1g5QQbybLpW6g0ugJdux4&libraries=places&language=es&loading=async"
                    strategy="afterInteractive"
                />

                <MetaPixel />
                <GoogleTagManager gtmId="GTM-N3WV4GPT" />
                {children}
            </body>
        </html>
    );
}
