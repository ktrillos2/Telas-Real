const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
const { client } = require('../sanity/lib/client')
// Need to handle env vars if client imports them from process.env

async function run() {
    try {
        console.log("Fetching products...")
        const products = await client.fetch(`*[_type == "product"]{ name, "slug": slug.current, _id }`)
        console.log("Found products:", products.length)
        products.forEach((p: any) => {
            console.log(`- ${p.name} (Slug: ${p.slug})`)
        })
    } catch (e) {
        console.error("Error:", e)
    }
}

run()
