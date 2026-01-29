
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

async function migratePersonalizadoRequirements() {
    try {
        console.log('Migrating Personalizado Requirements content...')

        const doc = {
            _id: 'personalizadoRequirements',
            _type: 'personalizadoRequirements',
            title: 'Diseños Personalizados',
            intro: '¿Quieres sublimar tu propio diseño? ¡Perfecto! Solo necesitamos que nos envíes tu arte listo para producción con estas especificaciones:',

            // Card 1: Requisitos
            card1Title: 'Requisitos del Archivo',
            requirements: [
                { _key: 'req1', label: 'Formato:', value: 'PDF' },
                { _key: 'req2', label: 'Medidas:', value: '150 cm de ancho x máximo 1 m de largo' },
                { _key: 'req3', label: 'Tipo de diseño:', value: 'Replicable (que pueda repetirse sin cortes visibles)' },
                { _key: 'req4', label: 'Pedido mínimo:', value: '10 metros en adelante' }
            ],

            // Card 2: Validación
            card2Title: 'Proceso de Validación',
            card2Intro: [
                {
                    _key: 'p1',
                    _type: 'block',
                    style: 'normal',
                    children: [
                        { _type: 'span', text: 'Revisamos tu archivo y realizamos una ' },
                        { _type: 'span', text: 'muestra de 20 × 20 cm', marks: ['strong'] },
                        { _type: 'span', text: '.' }
                    ]
                }
            ],
            validationOptions: ['Foto de la muestra', 'Envío físico (el cliente asume el flete)', 'Recogerla en tienda'],
            card2Note: 'Tras tu aprobación, enviamos a sublimación el total del pedido y te notificamos los tiempos de producción.',

            closingText: 'Tu diseño, personalizado a tu medida.'
        }

        const result = await client.createOrReplace(doc)

        console.log('Migration successful!')
        console.log('Updated document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migratePersonalizadoRequirements()
