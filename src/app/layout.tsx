import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import '@/styles/fonts.css';
import Script from 'next/script';
import MetaPixel from '@/components/Analytics/MetaPixel';

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
});

export const metadata: Metadata = {
    title: 'Registro de Membresía - Protección para tu Mascota',
    description: 'Únete a nuestra manada y protege a tu mascota con beneficios exclusivos y fondo solidario',
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
                {/* Google Places API - Cargar después de que la página sea interactiva */}
                <Script
                    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAei8wBZ0fQRWGY9nInhuCep5K8cHkDtqs&libraries=places&loading=async"
                    strategy="afterInteractive"
                />
                <MetaPixel />
                {children}
            </body>
        </html>
    );
}
