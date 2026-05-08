import { MetadataRoute } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://telasreal.com'

    // Fetch all products
    const products = await client.fetch(groq`
    *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock"] {
      "slug": slug.current,
      _updatedAt
    }
  `)

    // Fetch all categories (optional but good for SEO)
    // Assuming the category page structure is /tienda?categoria=slug
    // Actually, standard sitemaps prefer static-looking URLs. 
    // If we have dynamic routes for categories (e.g. /categoria/[slug]), we should add them.
    // Current app uses query params for categories in /tienda.
    // So we just point to the main pages.

    const productUrls = products.map((product: any) => ({
        url: `${baseUrl}/producto/${product.slug}`,
        lastModified: new Date(product._updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const staticRoutes = [
        '',
        '/tienda',
        '/puntos-atencion',
        '/contacto',
        '/politicas/privacidad', // Assuming these exist or will exist
        '/politicas/terminos',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.9,
    }))

    return [...staticRoutes, ...productUrls]
}
