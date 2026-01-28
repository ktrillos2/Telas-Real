
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
    console.error('Missing required environment variables (NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN)')
    process.exit(1)
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

async function migrateData() {
    try {
        console.log('Fetching globalConfig...')
        const globalConfig = await client.fetch('*[_type == "globalConfig"][0]')

        if (!globalConfig) {
            console.log('No globalConfig found to migrate.')
            return
        }

        console.log('Migrating Header...')
        if (globalConfig.header) {
            await client.createOrReplace({
                _id: 'header',
                _type: 'header',
                ticker: globalConfig.header.ticker,
                logo: globalConfig.header.logo,
                menu: globalConfig.header.menu,
            })
            console.log('Header migrated.')
        }

        console.log('Migrating Footer...')
        if (globalConfig.footer) {
            await client.createOrReplace({
                _id: 'footer',
                _type: 'footer',
                copyright: globalConfig.footer.copyright,
                // Map other fields if they existed, currently footer only had copyright
            })
            console.log('Footer migrated.')
        }

        // Initialize HomePage if not exists
        await client.createIfNotExists({
            _id: 'homePage',
            _type: 'homePage',
            title: 'Inicio',
        })
        console.log('HomePage initialized.')

        // Initialize Global Settings if not exists
        await client.createIfNotExists({
            _id: 'globalSettings',
            _type: 'globalSettings',
            whatsappNumber: '+573159021516', // Defaulting to the one seen in footer code
        })
        console.log('Global Settings initialized.')

        console.log('Migration complete!')
    } catch (error) {
        console.error('Migration failed:', error)
    }
}

migrateData()
