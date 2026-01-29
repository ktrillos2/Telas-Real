
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

async function migrateServices() {
    try {
        console.log('Migrating Special Services content...')

        const doc = {
            _id: 'homeServices',
            _type: 'homeServices',
            title: 'Servicios Especiales',
            description: 'Más que una tienda de telas, somos tu aliado en cada proyecto',
            services: [
                {
                    _key: 'service1',
                    title: 'Corte a Medida',
                    description: 'Cortamos tus telas a la medida exacta, sin desperdicios',
                    icon: 'scissors'
                },
                {
                    _key: 'service2',
                    title: 'Envíos Nacionales',
                    description: 'Enviamos a todo Colombia con los mejores tiempos de entrega',
                    icon: 'truck'
                },
                {
                    _key: 'service3',
                    title: 'Asesoría Personalizada',
                    description: 'Nuestros expertos te ayudan a elegir la tela perfecta para tu proyecto',
                    icon: 'palette'
                },
                {
                    _key: 'service4',
                    title: 'Telas Personalizadas',
                    description: 'Sublimamos tus diseños en telas de alta calidad',
                    icon: 'sparkles'
                }
            ]
        }

        const result = await client.createOrReplace(doc)

        console.log('Services migration successful!')
        console.log('Updated document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrateServices()
