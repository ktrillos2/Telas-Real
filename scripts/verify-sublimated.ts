
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-02-11',
    useCdn: false,
})

async function verify() {
    const count = await client.fetch(`count(*[_type == "imagenSublimada"])`)
    const docs = await client.fetch(`*[_type == "imagenSublimada"][0...5]{name, category, subcategory}`)

    console.log(`Total documents: ${count}`)
    console.log('Sample documents:', docs)
}

verify()
