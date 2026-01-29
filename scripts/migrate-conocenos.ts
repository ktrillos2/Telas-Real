
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.SANITY_API_TOKEN) {
    console.error('Missing SANITY_API_TOKEN in .env.local')
    process.exit(1)
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-28'

if (!projectId || !dataset) {
    console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET in .env.local')
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

const IMAGE_PATH = '/Users/keyner/.gemini/antigravity/brain/25523de2-2dc3-45f7-9690-bc7786697259/uploaded_media_1769652042456.jpg'

async function migrateConocenos() {
    try {
        console.log('Validating image file...')
        if (!fs.existsSync(IMAGE_PATH)) {
            throw new Error(`Image not found at path: ${IMAGE_PATH}`)
        }

        console.log('Uploading image to Sanity...')
        const imageBuffer = fs.readFileSync(IMAGE_PATH)
        const imageAsset = await client.assets.upload('image', imageBuffer, {
            filename: 'conocenos-bg.jpg'
        })

        console.log(`Image uploaded successfully. Asset ID: ${imageAsset._id}`)

        const doc = {
            _id: 'homeConocenos',
            _type: 'homeConocenos',
            title: '¿SABÍAS QUÉ TENEMOS TIENDAS EN LAS PRINCIPALES CIUDADES DEL PAÍS?',
            buttonText: 'CONÓCELAS',
            buttonLink: '/puntos-atencion',
            image: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAsset._id
                },
                alt: 'Tiendas Telas Real'
            }
        }

        console.log('Creating/Updating homeConocenos document...')
        const result = await client.createOrReplace(doc)

        console.log('Migration completed successfully!')
        console.log('Document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrateConocenos()
