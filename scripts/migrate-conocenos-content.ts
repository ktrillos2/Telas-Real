
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

async function migrateContent() {
    try {
        console.log('Migrating Conócenos content...')

        const doc = {
            _id: 'homeConocenos',
            _type: 'homeConocenos',
            title: 'Conócenos',
            buttonText: 'Conoce nuestras tiendas',
            // Preserving the existing image if possible, or just updating text fields. 
            // createOrReplace replaces everything, so we should patch or fetch first.
            // Since we know the ID, we can use patch to update only specific fields.
        }

        const content = [
            {
                _type: 'block',
                children: [
                    { _type: 'span', text: 'Telas Real', marks: ['strong'] },
                    { _type: 'span', text: ' es una empresa familiar con más de ' },
                    { _type: 'span', text: '6 años de experiencia', marks: ['strong'] },
                    { _type: 'span', text: ' en el mercado textil colombiano, especializada en telas de ' },
                    { _type: 'span', text: 'alta calidad para la confección de prendas de vestir', marks: ['strong'] },
                    { _type: 'span', text: '.' }
                ],
                markDefs: [],
                style: 'normal'
            },
            {
                _type: 'block',
                children: [
                    { _type: 'span', text: 'Nos enfocamos en brindar una ' },
                    { _type: 'span', text: 'experiencia de compra confiable y ágil', marks: ['strong'] },
                    { _type: 'span', text: ', ofreciendo un portafolio cuidadosamente seleccionado, ' },
                    { _type: 'span', text: 'precios competitivos', marks: ['strong'] },
                    { _type: 'span', text: ' y un ' },
                    { _type: 'span', text: 'servicio al cliente cercano y experto', marks: ['strong'] },
                    { _type: 'span', text: ', que acompaña a cada cliente en la elección de la tela ideal para su proyecto.' }
                ],
                markDefs: [],
                style: 'normal'
            },
            {
                _type: 'block',
                children: [
                    { _type: 'span', text: 'Contamos con ' },
                    { _type: 'span', text: '11 puntos de venta físicos', marks: ['strong'] },
                    { _type: 'span', text: ' estratégicamente ubicados en las principales ciudades del país, donde nuestro equipo capacitado está listo para asesorarte y ayudarte a tomar la mejor decisión según tus necesidades de confección.' }
                ],
                markDefs: [],
                style: 'normal'
            },
            {
                _type: 'block',
                children: [
                    { _type: 'span', text: 'En ' },
                    { _type: 'span', text: 'Telas Real', marks: ['strong'] },
                    { _type: 'span', text: ', la satisfacción de nuestros clientes es nuestra prioridad. Trabajamos de la mano con ' },
                    { _type: 'span', text: 'proveedores nacionales e internacionales', marks: ['strong'] },
                    { _type: 'span', text: ', garantizando ' },
                    { _type: 'span', text: 'variedad, calidad constante y excelente relación precio–beneficio', marks: ['strong'] },
                    { _type: 'span', text: ', para impulsar el crecimiento de marcas, talleres y confeccionistas en todo Colombia.' }
                ],
                markDefs: [],
                style: 'normal'
            }
        ]

        const result = await client
            .patch('homeConocenos')
            .set({
                title: 'Conócenos',
                buttonText: 'Conoce nuestras tiendas',
                content: content
            })
            .commit()

        console.log('Content migration successful!')
        console.log('Updated document ID:', result._id)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrateContent()
