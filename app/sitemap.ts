import { MetadataRoute } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { UNIFIED_FABRICS } from "@/lib/unified-fabrics"
import { productPublicPath } from "@/lib/seo-server"
import { cleanSlug, groupStoresByCity, usageSlug } from "@/lib/seo"

// Categorías que /tienda excluye del listado de telas (no deben competir en el sitemap)
const EXCLUDED_CATEGORY_SLUGS = ["sudaderas", "sudadera", "telas-para-sudaderas-sweaters"]

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

    // Solo categorías activas que tengan al menos un producto disponible
    // (las categorías vacías generan páginas "thin" sin productos).
    const categories = await client.fetch(groq`
    *[_type == "category" && defined(slug.current) && coalesce(isActive, true) == true && !(slug.current in $excluded) && count(*[_type == "product" && references(^._id) && stockStatus != "outOfStock" && stock_status != "outofstock"]) > 0] {
      "slug": slug.current,
      _updatedAt
    }
  `, { excluded: EXCLUDED_CATEGORY_SLUGS })

    // Las categorías de sublimación (categoriaSublimada) agrupan diseños, no productos:
    // /tienda/<slug> no las resuelve y su canonical apuntaba a /tienda, por eso no se incluyen.

    const stores = await client.fetch(groq`*[_type == "store"]{ name, address }`)

    // Landings por uso con productos disponibles
    const usages = await client.fetch(groq`
    *[_type == "usage" && defined(slug.current) && !(title match "*sudadera*" || slug.current match "*sudadera*") && count(*[_type == "product" && references(^._id) && stockStatus != "outOfStock" && stock_status != "outofstock"]) > 0] {
      "slug": slug.current,
      _updatedAt
    }
  `)

    // Las variantes de color de telas unificadas se publican en su URL canónica (/producto/<maestra>?color=<slug>)
    const productUrls = products
        .filter((product: any) => cleanSlug(product.slug))
        .map((product: any) => ({
            url: `${baseUrl}${productPublicPath(product.slug)}`,
            lastModified: new Date(product._updatedAt || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))

    const postUrls = posts
        .filter((post: any) => cleanSlug(post.slug))
        .map((post: any) => ({
            url: `${baseUrl}/blog/${encodeURIComponent(cleanSlug(post.slug))}`,
            lastModified: new Date(post._updatedAt || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

    const categoryUrls = categories
        .filter((cat: any) => cleanSlug(cat.slug))
        .map((cat: any) => ({
            url: `${baseUrl}/tienda/${encodeURIComponent(cleanSlug(cat.slug))}`,
            lastModified: new Date(cat._updatedAt || new Date()),
            changeFrequency: 'daily' as const,
            priority: 0.85,
        }))

    const usageUrls = (usages || [])
        .filter((u: any) => usageSlug(u.slug))
        .map((u: any) => ({
            url: `${baseUrl}/usos/${encodeURIComponent(usageSlug(u.slug))}`,
            lastModified: new Date(u._updatedAt || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))

    const cityUrls = groupStoresByCity(stores || []).map((group) => ({
        url: `${baseUrl}/puntos-atencion/${group.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
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
        '/blogs',
        '/pqr',
        '/conocenos',
        '/personalizado',
        '/trabaja-con-nosotros',
        '/preguntas-frecuentes',
        '/politica-de-privacidad',
        '/politica-de-envios',
        '/terminos-y-condiciones',
        '/terminos-eventos',
        '/politicas',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' || route === '/tienda' ? 'daily' as const : 'weekly' as const,
        priority: route === '' ? 1.0 : (route === '/tienda' ? 0.9 : 0.8),
    }))

    // Eliminar duplicados (p. ej. una variante cuyo slug coincide con otra URL ya listada)
    const seen = new Set<string>()
    return [...staticRoutes, ...cityUrls, ...categoryUrls, ...usageUrls, ...unifiedRoutes, ...productUrls, ...postUrls].filter((entry) => {
        if (seen.has(entry.url)) return false
        seen.add(entry.url)
        return true
    })
}
