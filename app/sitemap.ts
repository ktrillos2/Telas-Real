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

    // Fetch all blog posts
    const posts = await client.fetch(groq`
    *[_type == "post" && defined(slug.current)] {
      "slug": slug.current,
      _updatedAt
    }
  `)

    const productUrls = products.map((product: any) => ({
        url: `${baseUrl}/producto/${product.slug}`,
        lastModified: new Date(product._updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const postUrls = posts.map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    const staticRoutes = [
        '',
        '/tienda',
        '/puntos-atencion',
        '/contacto',
        '/politicas/privacidad',
        '/politicas/terminos',
        '/empresas',
        '/calculadora',
        '/pqr',
        '/conocenos',
        '/personalizado'
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' || route === '/tienda' ? 'daily' as const : 'weekly' as const,
        priority: route === '' ? 1.0 : (route === '/tienda' ? 0.9 : 0.8),
    }))

    return [...staticRoutes, ...productUrls, ...postUrls]
}
