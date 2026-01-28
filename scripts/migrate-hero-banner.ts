
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
    console.error('Missing required environment variables')
    process.exit(1)
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

const IMAGE_PATH = '/Users/keyner/.gemini/antigravity/brain/d3299c47-952f-40c8-be55-69d75406e57f/uploaded_media_1769574804545.png'

async function migrateHero() {
    console.log('Migrating Hero Banner...')

    try {
        const buffer = await fs.readFile(IMAGE_PATH)
        console.log('Uploading image...')
        const asset = await client.assets.upload('image', buffer, {
            filename: 'hero-banner.png'
        })
        console.log(`Image uploaded: ${asset._id}`)

        const banner = {
            _key: uuidv4(),
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: asset._id
            },
            alt: 'Banner Principal - Empezar el año creando'
        }

        console.log('Updating homePage document...')
        await client.patch('homePage')
            .set({
                mainSection: {
                    banners: [banner]
                }
            })
            .commit()

        console.log('Migration successful!')

    } catch (error) {
        console.error('Migration failed:', error)
    }
}

migrateHero()
