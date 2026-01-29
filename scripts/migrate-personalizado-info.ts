
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

async function migratePersonalizadoInfo() {
    try {
        console.log('Migrating Personalizado Info content...')

        const doc = {
            _id: 'personalizadoInfo',
            _type: 'personalizadoInfo',
            conditionsTitle: 'Condiciones del Servicio',
            conditionsContent: [
                {
                    _key: 'p1',
                    _type: 'block',
                    style: 'normal',
                    children: [
                        { _type: 'span', text: 'En este servicio, ' },
                        { _type: 'span', text: 'el cliente trae su propia tela', marks: ['strong'] },
                        { _type: 'span', text: '.' }
                    ]
                },
                {
                    _key: 'p2',
                    _type: 'block',
                    style: 'normal',
                    children: [
                        { _type: 'span', text: 'Para garantizar una correcta fijación del color y la calidad del estampado, la tela debe cumplir con el siguiente requisito indispensable:' }
                    ]
                },
                {
                    _key: 'l1',
                    _type: 'block',
                    style: 'normal',
                    listItem: 'bullet',
                    children: [
                        { _type: 'span', text: 'La tela debe ser ' },
                        { _type: 'span', text: 'base poliéster', marks: ['strong'] },
                        { _type: 'span', text: '.' }
                    ]
                },
                {
                    _key: 'l2',
                    _type: 'block',
                    style: 'normal',
                    listItem: 'bullet',
                    children: [
                        { _type: 'span', text: 'No trabajamos con materiales naturales (algodón, lino, etc.).' }
                    ]
                }
            ],
            pricingTitle: 'Tarifas por Metro',
            pricingItems: [
                { _key: 'price1', label: 'De 1 a 100 metros', price: '$7.900', unit: '/m' },
                { _key: 'price2', label: 'Desde 1000 metros', price: '$7.000', unit: '/m' }
            ],
            pricingNote: '* Precios sujetos a cambios sin previo aviso. Aplican condiciones.'
        }

        const result = await client.createOrReplace(doc)

        console.log('Migration successful!')
        console.log('Updated document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migratePersonalizadoInfo()
