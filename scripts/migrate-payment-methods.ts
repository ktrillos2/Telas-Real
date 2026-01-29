
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-28'
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

const IMAGES_TO_UPLOAD = [
    'nequi-logo.png',
    'daviplata-logo.png',
    'bancolombia-logo.png',
    'pse-logo.png',
    'visa-logo.png',
    'mastercard-logo.png'
]

async function migratePaymentMethods() {
    try {
        console.log('Migrating Payment Methods...')

        const uploadedAssets = []

        for (const filename of IMAGES_TO_UPLOAD) {
            const filePath = path.join(process.cwd(), 'public', filename)

            if (!fs.existsSync(filePath)) {
                console.warn(`File not found: ${filename}, skipping...`)
                continue
            }

            console.log(`Uploading ${filename}...`)
            const buffer = fs.readFileSync(filePath)
            const asset = await client.assets.upload('image', buffer, {
                filename: filename
            })

            uploadedAssets.push({
                _type: 'image',
                _key: filename, // Use filename as key for uniqueness
                asset: {
                    _type: 'reference',
                    _ref: asset._id
                }
            })
        }

        if (uploadedAssets.length > 0) {
            const result = await client
                .patch('footer') // Assuming 'footer' is the singleton ID, usually it is for singletons
                .set({
                    paymentMethods: uploadedAssets
                })
                .commit()

            console.log('Payment methods migration successful!')
            console.log('Updated document ID:', result._id)
        } else {
            console.log('No images uploaded, skipping patch.')
        }

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migratePaymentMethods()
