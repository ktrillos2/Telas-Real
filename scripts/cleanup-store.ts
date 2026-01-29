
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
const { createClient } = require('next-sanity')
const { apiVersion, dataset, projectId } = require('../sanity/env')

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN // Required for write operations
})

async function run() {
    try {
        console.log("--- Starting Store Cleanup ---")

        if (!process.env.SANITY_API_TOKEN) {
            throw new Error("SANITY_API_TOKEN is missing in .env.local")
        }

        // 1. Fetch Categories
        const categories = await client.fetch(`*[_type == "category"]{_id, name, slug}`)
        if (categories.length === 0) {
            console.log("No categories found.")
            return
        }

        const categoryToKeep = categories[0]
        console.log(`Keeping Category: ${categoryToKeep.name} (${categoryToKeep._id})`)

        // 2. Fetch Products
        const products = await client.fetch(`*[_type == "product"]{_id, name, slug}`)

        // Try to keep the one we've been testing with if possible 'product-2000100530109' or by slug 'camiseta-terry-verde-malva'
        const preferredProduct = products.find((p: any) => p._id === 'product-2000100530109' || p.slug.current === 'camiseta-terry-verde-malva')
        const productToKeep = preferredProduct || products[0]

        if (!productToKeep) {
            console.log("No products found.")
        } else {
            console.log(`Keeping Product: ${productToKeep.name} (${productToKeep._id})`)
        }

        // 3. Delete other categories
        const categoriesToDelete = categories.filter((c: any) => c._id !== categoryToKeep._id)
        console.log(`Deleting ${categoriesToDelete.length} categories...`)

        // Transaction for deletes
        const tx = client.transaction()

        categoriesToDelete.forEach((c: any) => {
            tx.delete(c._id)
        })

        // 4. Delete other products
        if (products.length > 0) {
            const productsToDelete = products.filter((p: any) => p._id !== productToKeep._id)
            console.log(`Deleting ${productsToDelete.length} products...`)
            productsToDelete.forEach((p: any) => {
                tx.delete(p._id)
            })
        }

        // 5. Update the kept product to reference the kept category
        if (productToKeep && categoryToKeep) {
            tx.patch(productToKeep._id, p => p.set({
                categories: [{
                    _type: 'reference',
                    _key: 'cleanup_ref',
                    _ref: categoryToKeep._id
                }]
            }))
            console.log("Updating kept product with kept category reference.")
        }

        await tx.commit()
        console.log("Cleanup complete!")

    } catch (e) {
        console.error("Error during cleanup:", e)
    }
}

run()
