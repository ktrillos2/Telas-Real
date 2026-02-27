import { createClient } from '@sanity/client'
import { FABRIC_DATA } from '../lib/calculator-data'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

if (!projectId || !token) {
    console.error('Missing SANITY_PROJECT_ID or SANITY_API_TOKEN')
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    useCdn: false,
    apiVersion: '2024-01-01',
    token,
})

async function seedData() {
    console.log(`Seeding calculator data to project: ${projectId}, dataset: ${dataset}`)
    try {
        const fabrics = FABRIC_DATA.map(f => ({
            _key: Math.random().toString(36).substring(7),
            name: f.name,
            yield: f.yield,
            pricePerKilo: f.pricePerKilo,
            pricePerMeter: f.pricePerMeter,
            pricePerRoll: f.pricePerRoll
        }))

        const doc = {
            _type: 'calculadoraSettings',
            _id: 'calculadoraSettings',
            fabrics: fabrics
        }

        // Use createOrReplace to ensure it creates the singleton
        const result = await client.createOrReplace(doc)
        console.log('Successfully seeded calculator data!', result._id)
    } catch (error) {
        console.error('Error seeding data:', error)
    }
}

seedData()
