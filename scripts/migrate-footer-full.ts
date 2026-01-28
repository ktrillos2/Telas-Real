
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
    console.error('Missing required environment variables')
    process.exit(1)
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

const STORES = [
    {
        name: "Telas Real - Bogotá Centro",
        address: "Calle 12 #8-45, Centro, Bogotá",
        phone: "+57 (1) 234-5678",
        hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.8!2d-74.07!3d4.60!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzYnMDAuMCJOIDc0wrAwNCcxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Bogotá Alquería",
        address: "Calle 43 Sur #52B-25, Alquería, Bogotá",
        phone: "+57 (1) 234-5678",
        hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.9!2d-74.13!3d4.59!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzUnMjQuMCJOIDc0wrAwNyc0OC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Bogotá Policarpa",
        address: "Calle 3 Sur #10-28, Policarpa, Bogotá",
        phone: "+57 (1) 234-5678",
        hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.8!2d-74.08!3d4.58!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzQnNDguMCJOIDc0wrAwNCQ0OC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Medellín",
        address: "Carrera 50 #45-30, El Poblado, Medellín",
        phone: "+57 (4) 345-6789",
        hours: "Lun - Sáb: 9:00 AM - 7:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.2!2d-75.57!3d6.21!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMzYuMCJOIDc1wrAzNCcxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Cali Centro",
        address: "Calle 11 # 8 - 33, Centro, Cali",
        phone: "+57 (2) 456-7890",
        hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.6!2d-76.53!3d3.44!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMjYnMjQuMCJOIDc2wrAzMSc0OC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Barranquilla",
        address: "Carrera 45 #52-30, Miramar, Barranquilla",
        phone: "+57 (5) 567-8901",
        hours: "Lun - Sáb: 9:00 AM - 6:30 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3974.5!2d-74.78!3d10.98!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU4JzQ4LjAiTiA3NMKwNDYnNTIuMCJX!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Bucaramanga",
        address: "Calle 37 # 14-39, Centro, Bucaramanga",
        phone: "+57 (7) 678-9012",
        hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.2!2d-73.12!3d7.12!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN7KwMDcnMTIuMCJOIDczwrAwNywxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Pereira",
        address: "Calle 19 #10-28, Centro, Pereira",
        phone: "+57 (6) 789-0123",
        hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.6!2d-75.69!3d4.81!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwNDgnMzYuMCJOIDc1wrA0MScxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
    {
        name: "Telas Real - Cúcuta",
        address: "Cl. 11 N #6-43, Urbanizacion San Martin, Cúcuta",
        phone: "+57 (7) 571-2345",
        hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.9!2d-72.50!3d7.89!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN7KwNTMnMjQuMCJOIDcywrAzMCcwMC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
    },
]

const COL1_LINKS = [
    { label: 'Quiénes somos', url: '/#quienes-somos' },
    { label: 'Personalizados', url: '/personalizado' },
    { label: 'Puntos de atención', url: '/puntos-atencion' },
    { label: 'Testimonios', url: '/#testimonios' },
    { label: 'Blog', url: '/blogs' },
    { label: 'Conoce nuestras políticas', url: '/politicas' },
]

const COL2_LINKS = [
    { label: 'Tela Brush', url: '/tienda?tipo=brush' },
    { label: 'Tela Satín', url: '/tienda?tipo=satin' },
    { label: 'Tela Rib', url: '/tienda?tipo=rib' },
    { label: 'Tela Jacquar', url: '/tienda?tipo=jacquard' },
    { label: 'Linos', url: '/tienda?tipo=linos' },
    { label: 'Ojalillos', url: '/tienda?tipo=ojalillos' },
    { label: 'Tela Seda Mango', url: '/tienda?tipo=seda-mango' },
]

async function migrate() {
    console.log('Migrating Stores...')
    for (const store of STORES) {
        // Check if store exists by name to avoid duplicates on re-run
        const existing = await client.fetch(`*[_type == "store" && name == $name][0]`, { name: store.name })
        if (!existing) {
            await client.create({
                _type: 'store',
                ...store
            })
            console.log(`Created store: ${store.name}`)
        } else {
            console.log(`Store already exists: ${store.name}`)
        }
    }

    console.log('Updating Footer...')
    await client.createOrReplace({
        _id: 'footer',
        _type: 'footer',
        copyright: '© 2024 Telas Real. Todos los derechos reservados.',
        contactInfo: {
            phone: '+57 315 902 1516',
            email: 'tiendavirtual@telasreal.com'
        },
        column1Links: COL1_LINKS,
        column2Links: COL2_LINKS,
        socials: [
            { platform: 'Instagram', url: 'https://www.instagram.com/telasrealco/' },
            { platform: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61567301410489' },
            { platform: 'TikTok', url: 'https://tiktok.com/@telasreal' }
        ],
        // note: images/payment methods would ideally be uploaded assets, skipping for this script 
        // or we could assume the user will upload them in Studio.
    })

    console.log('Migration complete!')
}

migrate()
