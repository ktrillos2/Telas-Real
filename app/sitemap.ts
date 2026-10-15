import { MetadataRoute } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { UNIFIED_FABRICS } from "@/lib/unified-fabrics"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://telasreal.com'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
    // Fetch all products
    const products = await client.fetch(groq`
    *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock"] {
      "slug": slug.current,
      _updatedAt
    }
  `)

    // Fetch all blog posts
    const posts = await client.fetch(groq`
    *[_type == "post" && defined(slug.current)] {
      "slug": slug.current,
      _updatedAt
    }
  `)

    // Fetch all active categories
    const categories = await client.fetch(groq`
    *[_type == "category" && defined(slug.current) && coalesce(isActive, true) == true] {
      "slug": slug.current,
      _updatedAt
    }
  `)

    // Fetch all active sublimated categories
    const sublimatedCategories = await client.fetch(groq`
    *[_type == "categoriaSublimada" && defined(slug.current) && coalesce(isActive, true) == true] {
      "slug": slug.current,
      _updatedAt
    }
  `)

    const productUrls = products.map((product: any) => ({
        url: `${baseUrl}/producto/${product.slug}`,
        lastModified: new Date(product._updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const postUrls = posts.map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    const categoryUrls = categories.map((cat: any) => ({
        url: `${baseUrl}/tienda/${cat.slug}`,
        lastModified: new Date(cat._updatedAt || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.85,
    }))

    const sublimatedUrls = sublimatedCategories.map((cat: any) => ({
        url: `${baseUrl}/tienda/${cat.slug}`,
        lastModified: new Date(cat._updatedAt || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.85,
    }))

    const unifiedRoutes = UNIFIED_FABRICS.map((fabric: any) => ({
        url: `${baseUrl}/producto/${fabric.unifiedSlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    const staticRoutes = [
        '',
        '/tienda',
        '/puntos-atencion',
        '/empresas',
        '/calculadora',
        '/pqr',
        '/conocenos',
        '/personalizado',
        '/trabaja-con-nosotros',
        '/preguntas-frecuentes',
        '/politica-de-privacidad',
        '/politica-de-envios',
        '/terminos-y-condiciones',
        '/politicas',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' || route === '/tienda' ? 'daily' as const : 'weekly' as const,
        priority: route === '' ? 1.0 : (route === '/tienda' ? 0.9 : 0.8),
    }))

    return [...staticRoutes, ...categoryUrls, ...sublimatedUrls, ...unifiedRoutes, ...productUrls, ...postUrls]
}
