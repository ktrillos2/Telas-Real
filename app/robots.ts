import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Rutas privadas o transaccionales sin valor de búsqueda.
// Importante: NO bloquear /_next/ — Googlebot necesita JS/CSS para renderizar las páginas.
const PRIVATE_PATHS = [
    '/api/',
    '/admin/',
    '/checkout',
    '/cuenta',
    '/carrito',
    '/my-orders',
    '/login',
    '/register',
    '/change-password',
    '/confirmation',
]

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: PRIVATE_PATHS,
            },
            {
                // Buscadores y asistentes de IA permitidos explícitamente para visibilidad del catálogo (GEO)
                userAgent: [
                    'Googlebot', 'Google-Extended', 'Bingbot', 'Applebot', 'Applebot-Extended', 'DuckDuckBot',
                    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
                    'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'Claude-Web',
                    'PerplexityBot', 'Perplexity-User',
                ],
                allow: '/',
                disallow: PRIVATE_PATHS,
            }
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}
