
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

const PAYMENT_ICONS = [
    'nequi-logo.png',
    'daviplata-logo.png',
    'bancolombia-logo.png',
    'pse-logo.png',
    'visa-logo.png',
    'mastercard-logo.png'
]

async function migrateImages() {
    console.log('Starting payment icons migration...')

    const paymentMethods = []

    for (const filename of PAYMENT_ICONS) {
        try {
            const filePath = path.join(process.cwd(), 'public', filename)
            const buffer = await fs.readFile(filePath)

            console.log(`Uploading ${filename}...`)
            const asset = await client.assets.upload('image', buffer, {
                filename: filename
            })

            paymentMethods.push({
                _key: uuidv4(),
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: asset._id
                }
            })

            console.log(`Uploaded ${filename} (ID: ${asset._id})`)
        } catch (err) {
            console.error(`Failed to upload ${filename}:`, err)
        }
    }

    if (paymentMethods.length > 0) {
        console.log('Updating footer document...')
        await client.patch('footer')
            .set({ paymentMethods })
            .commit()
        console.log('Footer updated with payment methods.')
    } else {
        console.log('No images uploaded.')
    }
}

migrateImages()
