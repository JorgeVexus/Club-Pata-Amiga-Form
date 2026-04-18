/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Optimización de imágenes
    images: {
        domains: [
            'your-supabase-project.supabase.co',
            'hjvhntxjkuuobgfslzlf.supabase.co',
            'cdn.prod.website-files.com'
        ],
        formats: ['image/avif', 'image/webp'],
    },

    // Configuración para embed en Webflow
    async rewrites() {
        return [
            {
                source: '/embed',
                destination: '/usuarios/registro',
            },
        ]
    },
}

module.exports = nextConfig
