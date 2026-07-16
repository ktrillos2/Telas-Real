import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { groq } from 'next-sanity'

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

export async function GET(request: Request) {
    try {
        // Construct the base URL dynamically from the request headers/url
        const requestUrl = new URL(request.url)
        const baseUrl = requestUrl.origin

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

        for (const p of products) {
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
            const link = p.slug ? `${baseUrl}/producto/${p.slug}` : ''
            
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

            const color = p.attributes?.find((a: any) => 
                a.name?.toLowerCase() === 'color' || 
                a.name?.toLowerCase() === 'tono'
            )?.value || (p.tones && p.tones.length > 0 ? p.tones[0] : '')

            const row = [
                p._id,
                p.title || '',
                description,
                availability,
                "new", // condition
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

        const csvContent = csvRows.join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'inline; filename="meta_catalog_feed.csv"',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
        })
    } catch (error) {
        console.error('Error generating Meta catalog feed:', error)
        return NextResponse.json({ error: 'Failed to generate product feed' }, { status: 500 })
    }
}
