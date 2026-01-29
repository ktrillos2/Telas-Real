
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

async function migratePersonalizadoFeatures() {
    try {
        console.log('Migrating Personalizado Features content...')

        const doc = {
            _id: 'personalizadoFeatures',
            _type: 'personalizadoFeatures',
            features: [
                {
                    _key: 'feature1',
                    title: 'Diseños Ilimitados',
                    description: 'Crea cualquier diseño que imagines, sin restricciones de colores o patrones.',
                    icon: 'palette'
                },
                {
                    _key: 'feature2',
                    title: 'Alta Calidad',
                    description: 'Sublimación de última generación para colores vibrantes, excelente definición y durabilidad.',
                    icon: 'sparkles'
                },
                {
                    _key: 'feature3',
                    title: 'Entrega Rápida',
                    description: 'Producción eficiente, perfecto para marcas de moda o producciones a gran escala.',
                    icon: 'zap'
                },
                {
                    _key: 'feature4',
                    title: 'Acabado Profesional',
                    description: 'Ideal para emprendimientos textiles que buscan diferenciarse en el mercado.',
                    icon: 'heart'
                }
            ]
        }

        const result = await client.createOrReplace(doc)

        console.log('Migration successful!')
        console.log('Updated document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migratePersonalizadoFeatures()
