import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { groq } from 'next-sanity'
import { SITE_URL, cleanSlug } from '@/lib/seo'
import { productPublicPath } from '@/lib/seo-server'
import { findUnifiedFabricConfig } from '@/lib/unified-fabrics'

// Disable caching for this route so that the latest products are always fetched
export const revalidate = 0

// Helper to strip HTML tags and normalize text
function cleanDescription(htmlText: string | null | undefined): string {
    if (!htmlText) return ''
    return htmlText
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')    // Collapse extra spaces and newlines
        .trim()
}

// Colores reconocibles en los títulos de producto (de más largo a más corto para
// priorizar nombres compuestos como "Azul Rey" sobre "Azul").
const COLOR_WORDS = [
    'palo de rosa', 'azul rey', 'azul oscuro', 'azul turquí', 'azul cielo', 'azul petróleo', 'azul marino', 'verde militar',
    'verde menta', 'verde esmeralda', 'verde botella', 'verde oliva', 'rosa viejo', 'gris oscuro', 'gris claro', 'gris jaspe',
    'negro', 'blanco', 'azul', 'rojo', 'verde', 'amarillo', 'rosado', 'rosa', 'gris', 'beige', 'café', 'cafe', 'marrón',
    'morado', 'lila', 'lavanda', 'naranja', 'fucsia', 'vino', 'turquesa', 'crudo', 'marfil', 'hueso', 'dorado', 'plateado',
    'coral', 'menta', 'mostaza', 'terracota', 'camel', 'caqui', 'kaki', 'arena', 'nude', 'salmón', 'salmon', 'uva', 'jade',
    'aguamarina', 'celeste', 'chocolate', 'durazno', 'mandarina', 'perla', 'plata', 'oro', 'cobre', 'magenta', 'violeta', 'ocre',
].sort((a, b) => b.length - a.length)

function inferColor(p: any): string {
    const fromAttr = p.attributes?.find((a: any) =>
        a.name?.toLowerCase() === 'color' ||
        a.name?.toLowerCase() === 'tono'
    )?.value
    if (fromAttr) return fromAttr
    if (p.tones && p.tones.length > 0 && p.tones[0]) return p.tones[0]

    const title: string = p.title || ''
    const unified = p.slug ? findUnifiedFabricConfig(cleanSlug(p.slug)) : null
    if (unified) {
        const name = unified.cleanColorName(title)
        if (name && name.toLowerCase() !== unified.baseTitle.toLowerCase()) return name
    }

    const lower = title.toLowerCase()
    const word = COLOR_WORDS.find((c) => new RegExp(`(^|[^a-záéíóúñ])${c}([^a-záéíóúñ]|$)`).test(lower))
    if (word) return word.replace(/(^|\s)\S/g, (ch) => ch.toUpperCase())

    if (/sublimad|estampad|print|flores|floral|animal/i.test(`${title} ${p.slug || ''}`)) return 'Estampado'
    return ''
}

export async function GET(request: Request) {
    try {
        // Siempre se usa el dominio canónico (no el host de la petición) para los enlaces del feed
        const requestUrl = new URL(request.url)
        const baseUrl = SITE_URL
        const wantsReport = requestUrl.searchParams.has('diagnostico')

        // Fetch products from Sanity
        const products = await client.fetch(groq`*[_type == "product"]{
            _id,
            title,
            "slug": slug.current,
            price,
            salePrice,
            stockStatus,
            description,
            descriptionShort,
            images,
            "categories": categories[]->name,
            "usages": usages[]->title,
            "tones": tones[]->title,
            "attributes": attributes[]{name, value}
        }`)

        // Meta Ads (Facebook Catalog) Feed standard headers
        const headers = [
            "id",
            "title",
            "description",
            "availability",
            "condition",
            "identifier_exists",
            "item_group_id",
            "price",
            "sale_price",
            "link",
            "image_link",
            "additional_image_link",
            "brand",
            "google_product_category",
            "product_type",
            "gender",
            "age_group",
            "material",
            "color"
        ]

        const csvRows = [headers.join(',')]
        const excluded: Array<{ id: string; title: string; reason: string }> = []
        const incomplete: Array<{ id: string; title: string; missing: string[] }> = []

        for (const p of products) {
            const slug = cleanSlug(p.slug)
            if (!slug) {
                excluded.push({ id: p._id, title: p.title, reason: 'sin slug' })
                continue
            }

            // Find brand from attributes, fallback to "Telas Real"
            const brand = p.attributes?.find((a: any) => 
                a.name?.toLowerCase() === 'marca' || 
                a.name?.toLowerCase() === 'brand'
            )?.value || 'Telas Real'

            // Availability mapping
            let availability = 'out of stock'
            if (p.stockStatus === 'inStock') {
                availability = 'in stock'
            } else if (p.stockStatus === 'onBackorder') {
                availability = 'available for order'
            }

            // Clean description
            const rawDesc = p.descriptionShort || p.description || p.title || ''
            const description = cleanDescription(rawDesc)

            // Prices
            const price = p.price ? `${p.price} COP` : ''
            const salePrice = p.salePrice > 0 ? `${p.salePrice} COP` : ''

            // Link and Images
            const link = `${baseUrl}${productPublicPath(slug)}`
            
            // Build image URLs
            const imageUrls = (p.images || [])
                .map((img: any) => {
                    try {
                        return urlFor(img).url()
                    } catch (e) {
                        return ''
                    }
                })
                .filter(Boolean)

            const imageLink = imageUrls[0] || ''
            const additionalImageLink = imageUrls.slice(1, 10).join(',')

            // Merchant Center rechaza productos sin imagen: se excluyen y se reportan en ?diagnostico
            if (!imageLink) {
                excluded.push({ id: p._id, title: p.title, reason: 'sin imagen' })
                continue
            }

            const unifiedConfig = findUnifiedFabricConfig(slug)
            const itemGroupId = unifiedConfig && unifiedConfig.unifiedSlug !== slug ? unifiedConfig.unifiedSlug : ''

            // Product Type (category tree)
            const productType = p.categories && p.categories.length > 0
                ? p.categories.join(' > ')
                : 'Telas'

            // Extra fields for fabric catalog quality
            const material = p.attributes?.find((a: any) => 
                a.name?.toLowerCase().includes('composición') || 
                a.name?.toLowerCase().includes('composicion') || 
                a.name?.toLowerCase().includes('material')
            )?.value || ''

            const color = inferColor(p)

            const missing = [!color && 'color', !material && 'material', !price && 'price', !description && 'description'].filter(Boolean) as string[]
            if (missing.length > 0) incomplete.push({ id: p._id, title: p.title, missing })

            const row = [
                p._id,
                p.title || '',
                description,
                availability,
                "new", // condition
                "no", // identifier_exists (telas propias sin GTIN)
                itemGroupId,
                price,
                salePrice,
                link,
                imageLink,
                additionalImageLink,
                brand,
                "6081", // google_product_category (Fabric category)
                productType,
                "unisex", // gender
                "adult",  // age_group
                material,
                color
            ].map(field => {
                // Escape double quotes and wrap field in double quotes
                const stringField = String(field || '')
                return `"${stringField.replace(/"/g, '""')}"`
            })

            csvRows.push(row.join(','))
        }

        if (wantsReport) {
            return NextResponse.json({
                total: products.length,
                published: csvRows.length - 1,
                excludedCount: excluded.length,
                incompleteCount: incomplete.length,
                excluded,
                incomplete,
            }, { headers: { 'Cache-Control': 'no-store' } })
        }

        const csvContent = csvRows.join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'inline; filename="meta_catalog_feed.csv"',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'X-Feed-Excluded': String(excluded.length),
            },
        })
    } catch (error) {
        console.error('Error generating Meta catalog feed:', error)
        return NextResponse.json({ error: 'Failed to generate product feed' }, { status: 500 })
    }
}
