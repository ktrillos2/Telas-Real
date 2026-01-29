
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'
import path from 'path'

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

async function migratePersonalizadoHero() {
    try {
        console.log('Migrating Personalizado Hero content...')

        const doc = {
            _id: 'personalizadoHero',
            _type: 'personalizadoHero',
            title: 'Servicio de Sublimación Profesional',
            description: 'Dale vida a tus diseños con nuestro servicio de sublimación de alta calidad. Ideal para proyectos textiles que requieren colores vibrantes, excelente definición y durabilidad.',
            buttonText: 'Cotizar Proyecto',
            buttonLink: '/personalizado#cotizar'
        }

        const result = await client.createOrReplace(doc)

        console.log('Migration successful!')
        console.log('Updated document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migratePersonalizadoHero()
