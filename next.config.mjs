/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    '@react-email/components',
    '@react-email/render',
    'resend',
    'jsdom',
    'isomorphic-dompurify'
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.telasreal.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'telasreal.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'admin.telasreal.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.admin.telasreal.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 días de caché
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://admin.telasreal.com/:path*',
      },
    ]
  },
  async redirects() {
    // Rutas antiguas (WordPress/WooCommerce y enlaces previos) → páginas vigentes.
    // 301 permanentes para consolidar autoridad en las URLs nuevas.
    const legacy = {
      '/privacidad': '/politica-de-privacidad',
      '/politica-privacidad': '/politica-de-privacidad',
      '/politicas-de-privacidad': '/politica-de-privacidad',
      '/politica-de-privacidad-2': '/politica-de-privacidad',
      '/politica-de-tratamiento-de-datos': '/politica-de-privacidad',
      '/politica-de-tratamiento-de-datos-personales': '/politica-de-privacidad',
      '/tratamiento-de-datos': '/politica-de-privacidad',
      '/habeas-data': '/politica-de-privacidad',
      '/terminos': '/terminos-y-condiciones',
      '/terminos-condiciones': '/terminos-y-condiciones',
      '/terminos-de-uso': '/terminos-y-condiciones',
      '/condiciones': '/terminos-y-condiciones',
      '/politica-de-devoluciones': '/terminos-y-condiciones',
      '/devoluciones': '/terminos-y-condiciones',
      '/cambios-y-devoluciones': '/terminos-y-condiciones',
      '/politica-de-envio': '/politica-de-envios',
      '/politicas-de-envio': '/politica-de-envios',
      '/politicas-de-envios': '/politica-de-envios',
      '/envios': '/politica-de-envios',
      '/politica': '/politicas',
      '/faq': '/preguntas-frecuentes',
      '/faqs': '/preguntas-frecuentes',
      '/preguntas': '/preguntas-frecuentes',
      '/nosotros': '/conocenos',
      '/quienes-somos': '/conocenos',
      '/tiendas': '/puntos-atencion',
      '/sedes': '/puntos-atencion',
      '/blog': '/blogs',
      '/shop': '/tienda',
    }

    return [
      ...Object.entries(legacy).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      // Categorías WooCommerce (incluidas subcategorías: se usa el último segmento)
      ...['categoria-producto', 'product-category'].flatMap((base) => [
        { source: `/${base}/:slug`, destination: '/tienda/:slug', permanent: true },
        { source: `/${base}/:parent/:slug`, destination: '/tienda/:slug', permanent: true },
      ]),
      {
        source: '/product/:slug',
        destination: '/producto/:slug',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
