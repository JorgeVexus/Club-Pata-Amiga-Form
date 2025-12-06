/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Optimización de imágenes
    images: {
        domains: ['your-supabase-project.supabase.co'], // Actualizar con tu dominio de Supabase
        formats: ['image/avif', 'image/webp'],
    },

    // Headers de seguridad
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    }
                ]
            }
        ]
    },

    // Configuración para embed en Webflow
    async rewrites() {
        return [
            {
                source: '/embed',
                destination: '/',
            },
        ]
    },
}

module.exports = nextConfig
