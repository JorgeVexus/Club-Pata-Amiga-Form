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

// Interruptor temporal: el proyecto de Google Cloud dueño de la API key aun no
// tiene billing habilitado, lo que hace que Google muestre un dialogo de error
// visible a los usuarios ("Esta pagina no puede cargar Google Maps
// correctamente"). Todo el codigo que usa window.google ya verifica que exista
// antes de usarlo, asi que no cargar el script aqui degrada limpiamente
// (sin autocompletado, sin errores). Volver a poner en true cuando se active
// el billing.
const GOOGLE_MAPS_ENABLED = false;

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
                {GOOGLE_MAPS_ENABLED && (
                    <Script
                        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=es&loading=async`}
                        strategy="afterInteractive"
                    />
                )}

                <MetaPixel />
                <GoogleTagManager gtmId="GTM-N3WV4GPT" />
                {children}
            </body>
        </html>
    );
}
