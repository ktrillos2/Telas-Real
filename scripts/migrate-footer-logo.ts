
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

const LOGO_FILENAME = 'logo.png'

async function migrateFooterLogo() {
    try {
        console.log('Migrating Footer Logo...')

        const filePath = path.join(process.cwd(), 'public', LOGO_FILENAME)

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${LOGO_FILENAME}`)
            process.exit(1)
        }

        console.log(`Uploading ${LOGO_FILENAME}...`)
        const buffer = fs.readFileSync(filePath)
        const asset = await client.assets.upload('image', buffer, {
            filename: 'footer-logo.png'
        })

        const result = await client
            .patch('footer')
            .set({
                footerLogo: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id
                    }
                }
            })
            .commit()

        console.log('Footer logo migration successful!')
        console.log('Updated document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrateFooterLogo()
