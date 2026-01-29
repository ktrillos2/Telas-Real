
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-28'
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
    console.error('Missing environment variables')
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
})

const WP_API_URL = "https://admin.telasreal.com/wp-json/wc/store/products"

async function fetchWP(endpoint: string) {
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.statusText}`)
    return res.json()
}

async function startMigration() {
    try {
        console.log('Starting migration...')

        // 1. Fetch Categories
        console.log('Fetching categories...')
        const categories = await fetchWP("https://admin.telasreal.com/wp-json/wc/store/products/categories")

        const categoryIdMap = new Map()

        for (const cat of categories) {
            console.log(`Processing category: ${cat.name}`)

            // Upload category image if exists
            let imageId = null
            if (cat.image?.src) {
                try {
                    const imageRes = await fetch(cat.image.src)
                    if (imageRes.ok) {
                        const buffer = await imageRes.arrayBuffer()
                        const asset = await client.assets.upload('image', Buffer.from(buffer), {
                            filename: `cat-${cat.slug}.jpg`
                        })
                        imageId = asset._id
                    }
                } catch (e) {
                    console.warn(`Failed to upload image for category ${cat.name}`, e)
                }
            }

            const catDoc = {
                _type: 'category',
                _id: `cat-${cat.id}`, // Deterministic ID
                name: cat.name,
                slug: { _type: 'slug', current: cat.slug },
                description: cat.description,
                ...(imageId && {
                    image: { _type: 'image', asset: { _type: 'reference', _ref: imageId } }
                })
            }

            const createdCat = await client.createOrReplace(catDoc)
            categoryIdMap.set(cat.id, createdCat._id)
        }

        // 2. Fetch Products
        console.log('Fetching products...')
        // Fetch just one page to be safe, or loop if needed. User asked for at least 1 product.
        const products = await fetchWP("https://admin.telasreal.com/wp-json/wc/store/products?per_page=20")

        console.log(`Found ${products.length} products.`)

        for (const product of products) {
            console.log(`Processing product: ${product.name}`)

            // Upload images
            const sanityImages = []
            for (const img of product.images) {
                try {
                    const imgRes = await fetch(img.src)
                    if (imgRes.ok) {
                        const buffer = await imgRes.arrayBuffer()
                        const asset = await client.assets.upload('image', Buffer.from(buffer), {
                            filename: `prod-${product.slug}-${img.id}.jpg`
                        })
                        sanityImages.push({
                            _type: 'image',
                            _key: img.id.toString(),
                            asset: { _type: 'reference', _ref: asset._id }
                        })
                    }
                } catch (e) {
                    console.warn(`Failed to upload image ${img.src} for product ${product.name}`)
                }
            }

            // Map categories
            const productCategories = product.categories.map((c: any) => ({
                _type: 'reference',
                _key: c.id.toString(),
                _ref: `cat-${c.id}`
            }))

            // Map attributes
            const attributes = product.attributes.map((attr: any) => ({
                _type: 'object',
                _key: attr.id.toString(),
                name: attr.name,
                value: attr.terms.map((t: any) => t.name).join(', ')
            }))

            // Parse price
            const price = parseInt(product.prices.price) || 0
            const regularPrice = parseInt(product.prices.regular_price) || 0
            const salePrice = parseInt(product.prices.sale_price) || 0

            const doc = {
                _type: 'product',
                _id: `product-${product.id}`,
                name: product.name,
                slug: { _type: 'slug', current: product.slug },
                price: price,
                sale_price: salePrice > 0 ? salePrice : 0,
                stock_status: product.is_in_stock ? 'instock' : 'outofstock',
                short_description: product.short_description.replace(/<[^>]+>/g, ''), // Strip HTML for now or use block? user schema has text for short
                // For full description we need blocks. Simple fallback:
                description: [
                    {
                        _type: 'block',
                        children: [{ _type: 'span', text: product.description.replace(/<[^>]+>/g, '') }]
                    }
                ],
                images: sanityImages,
                categories: productCategories,
                attributes: attributes
            }

            await client.createOrReplace(doc)
        }

        console.log('Migration finished successfully.')

    } catch (error) {
        console.error('Migration failed:', error)
    }
}

startMigration()
