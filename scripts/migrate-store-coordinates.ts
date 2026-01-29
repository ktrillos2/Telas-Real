
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

// Coordenadas aproximadas para las tiendas (basado en ciudades principales si no tenemos datos exactos)
// Si ya hay tiendas creadas, intentaremos actualizarlas basándonos en su nombre o ciudad si está en la dirección.
// Si no, añadiremos un set por defecto.

const defaultStores = [
    {
        name: 'Telas Real - Bogotá Centro',
        address: 'Carrera 12 # 13-45, Bogotá',
        phone: '+57 1 2345678',
        hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
        coordinates: { _type: 'geopoint', lat: 4.6097, lng: -74.0817 }
    },
    {
        name: 'Telas Real - Medellín',
        address: 'Calle 33 # 65C-12, Medellín',
        phone: '+57 4 3214567',
        hours: 'Lunes a Sábado: 9:00 AM - 7:00 PM',
        coordinates: { _type: 'geopoint', lat: 6.2442, lng: -75.5812 }
    },
    {
        name: 'Telas Real - Cali',
        address: 'Avenida 6N # 21-34, Cali',
        phone: '+57 2 8889999',
        hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
        coordinates: { _type: 'geopoint', lat: 3.4516, lng: -76.5320 }
    }
]

async function migrateStoreCoordinates() {
    try {
        console.log('Migrating Store Coordinates...')

        // Fetch existing stores
        const existingStores = await client.fetch('*[_type == "store"]')

        if (existingStores.length === 0) {
            console.log('No existing stores found. Creating default stores...')
            for (const store of defaultStores) {
                await client.create({
                    _type: 'store',
                    ...store
                })
                console.log(`Created store: ${store.name}`)
            }
        } else {
            console.log(`Found ${existingStores.length} existing stores. Updating coordinates...`)

            // Update logic: naive mapping - just adding coordinates if missing, 
            // cycling through defaults to ensure at least some points show on map
            let i = 0;
            for (const store of existingStores) {
                if (!store.coordinates) {
                    // Pick a coordinate set from defaults based on simple round robin or match
                    const defaultStore = defaultStores[i % defaultStores.length];

                    await client.patch(store._id)
                        .set({ coordinates: defaultStore.coordinates })
                        .commit()

                    console.log(`Updated store ${store.name} with coordinates.`)
                    i++;
                } else {
                    console.log(`Store ${store.name} already has coordinates.`)
                }
            }
        }

        console.log('Migration successful!')

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrateStoreCoordinates()
