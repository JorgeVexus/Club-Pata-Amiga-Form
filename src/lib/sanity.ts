import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

/**
 * Cliente de Sanity para consumir contenido del CMS
 * 
 * Para usar esto necesitas:
 * 1. Crear un proyecto en sanity.io
 * 2. Obtener el Project ID y Dataset
 * 3. Agregar las variables de entorno
 */
export const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'tu-project-id',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: true, // true para producción, false para desarrollo
});

// Helper para construir URLs de imágenes de Sanity
const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
    return builder.image(source);
}

/**
 * Tipos de contenido que marketing puede editar
 */
export interface HomepageContent {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: any;
    ctaButtonText: string;
    ctaButtonLink: string;

    // Sección de beneficios
    benefitsTitle: string;
    benefits: {
        icon: string;
        title: string;
        description: string;
    }[];

    // Sección de planes
    plansTitle: string;
    plansSubtitle: string;

    // Testimonios
    testimonialsTitle: string;
    testimonials: {
        name: string;
        petName: string;
        image: any;
        quote: string;
    }[];

    // Footer
    footerTagline: string;
}

/**
 * Función para obtener el contenido del homepage
 */
export async function getHomepageContent(): Promise<HomepageContent | null> {
    try {
        const content = await sanityClient.fetch(`
            *[_type == "homepage"][0] {
                heroTitle,
                heroSubtitle,
                heroImage,
                ctaButtonText,
                ctaButtonLink,
                benefitsTitle,
                benefits[] {
                    icon,
                    title,
                    description
                },
                plansTitle,
                plansSubtitle,
                testimonialsTitle,
                testimonials[] {
                    name,
                    petName,
                    image,
                    quote
                },
                footerTagline
            }
        `);
        return content;
    } catch (error) {
        console.error('Error fetching Sanity content:', error);
        return null;
    }
}
