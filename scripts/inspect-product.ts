
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
const { client } = require('../sanity/lib/client')

async function run() {
    const target = "product-2000100530109"
    console.log(`Searching for product with slug or ID: ${target}`)

    try {
        // Try finding by slug
        const bySlug = await client.fetch(`*[_type == "product" && slug.current == $slug][0]`, { slug: target })
        if (bySlug) {
            console.log("Found by slug:", bySlug.name)
        } else {
            console.log("Not found by generic slug query.")
        }

        // Try finding by ID (draft or published)
        // Note: Sanity IDs don't usually look like that unless custom, but maybe it's part of an ID?
        // Or maybe it's the SKU?
        // Let's search broadly
        const searchAll = await client.fetch(`*[_type == "product"]{name, "slug": slug.current, _id}`)
        console.log("Scanning all products for similar values...")
        searchAll.forEach(p => {
            if (JSON.stringify(p).includes("2000100530109")) {
                console.log("MATCH FOUND in generic scan:", p)
            }
        })

    } catch (e) {
        console.error(e)
    }
}

run()
