import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { getCampaign } from '@/lib/landings';

type Params = { params: Promise<{ campaign: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { campaign } = await params;
    const c = getCampaign(campaign);
    return {
        title: c ? `${c.headline} · Club Pata Amiga` : 'Club Pata Amiga',
        description: c?.subheadline,
        robots: { index: false },
    };
}

export default async function CampaignLandingPage({ params }: Params) {
    const { campaign: slug } = await params;
    const campaign = getCampaign(slug);

    if (!campaign || !campaign.active) {
        notFound();
    }

    return (
        <div style={{ minHeight: '100vh', background: '#1cbcad', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Contenedor donde se inyectará el Widget */}
            <div id="pata-campaign-gift-widget" style={{ width: '100%' }}></div>

            {/* Configurar la API y la campaña de forma dinámica en la ventana */}
            <Script id="campaign-config" strategy="beforeInteractive">
                {`
                    window.PATA_AMIGA_CONFIG = {
                        apiUrl: window.location.origin,
                        campaign: '${campaign.slug}'
                    };
                `}
            </Script>

            {/* Cargar el script del widget de manera diferida */}
            <Script src="/widgets/campaign-gift-widget.js" strategy="afterInteractive" />
        </div>
    );
}
