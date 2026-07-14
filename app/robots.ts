import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://telasreal.com'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/checkout/', '/cuenta/', '/carrito/', '/_next/'],
            },
            {
                // Explicitly welcoming AI Bots and Search Engines for better catalog visibility
                userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'anthropic-ai', 'Claude-Web', 'PerplexityBot', 'Googlebot', 'Bingbot', 'Applebot', 'DuckDuckBot'],
                allow: '/',
                disallow: ['/api/', '/admin/', '/checkout/', '/cuenta/', '/carrito/', '/_next/'],
            }
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
