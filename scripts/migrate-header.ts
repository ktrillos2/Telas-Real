import { createClient } from 'next-sanity'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
    console.error('Missing Sanity configuration. Please check .env.local')
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
})

async function fetchWordPressTicker() {
    console.log('Fetching ticker data from WordPress...')
    try {
        // Current WP endpoint used in the app
        const res = await fetch('https://www.telasreal.com/wp-json/wp/v2/secciones_inicio?_fields=acf')
        if (!res.ok) throw new Error(`WP Fetch error: ${res.statusText}`)
        const data = await res.json()

        // Assuming the first item has the data, based on current implementation
        const acf = data[0]?.acf?.textos_header
        if (!acf) return []

        const messages = [
            acf.texto_1,
            acf.texto_2,
            acf.texto_3,
            acf.texto_4,
        ].filter((text) => text && text.trim() !== '')

        console.log(`Found ${messages.length} ticker messages.`)
        return messages
    } catch (error) {
        console.error('Error fetching WP data:', error)
        return []
    }
}

const MENU_STRUCTURE = [
    {
        _key: 'nav1',
        label: 'Quienes Somos',
        link: '/#quienes-somos',
        hasMegaMenu: false,
    },
    {
        _key: 'nav2',
        label: 'Personalizado',
        link: '/personalizado',
        hasMegaMenu: false,
    },
    {
        _key: 'nav3',
        label: 'Telas',
        link: '/tienda',
        hasMegaMenu: true,
        megaMenuColumns: [
            {
                _key: 'col1',
                title: 'Productos',
                links: [
                    { _key: 'l1', label: 'Sublimados', url: '/tienda?categoria=sublimados' },
                    { _key: 'l2', label: 'Unicolor', url: '/tienda?categoria=unicolor' },
                ]
            },
            {
                _key: 'col2',
                title: 'Usos',
                links: [
                    { _key: 'l3', label: 'Accesorios y Mascotas', url: '/tienda?uso=accesorios' },
                    { _key: 'l4', label: 'Deportivos y comodos', url: '/tienda?uso=deportivos' },
                    { _key: 'l5', label: 'Dotaciones', url: '/tienda?uso=dotaciones' },
                    { _key: 'l6', label: 'Elegantes', url: '/tienda?uso=elegantes' },
                    { _key: 'l7', label: 'Moda casual', url: '/tienda?uso=casual' },
                    { _key: 'l8', label: 'Acogedores', url: '/tienda?uso=acogedores' },
                    { _key: 'l9', label: 'Verano', url: '/tienda?uso=verano' },
                    { _key: 'l10', label: 'Pijamas', url: '/tienda?uso=pijamas' },
                ]
            },
            {
                _key: 'col3',
                title: 'Tonos',
                links: [
                    { _key: 'l11', label: 'Amarillos', url: '/tienda?tono=amarillos' },
                    { _key: 'l12', label: 'Azules', url: '/tienda?tono=azules' },
                    { _key: 'l13', label: 'Claros', url: '/tienda?tono=claros' },
                    { _key: 'l14', label: 'Medios', url: '/tienda?tono=medios' },
                    { _key: 'l15', label: 'Oscuros', url: '/tienda?tono=oscuros' },
                    { _key: 'l16', label: 'Rojos', url: '/tienda?tono=rojos' },
                    { _key: 'l17', label: 'Rosados', url: '/tienda?tono=rosados' },
                    { _key: 'l18', label: 'Verdes', url: '/tienda?tono=verdes' },
                    { _key: 'l19', label: 'Neon', url: '/tienda?tono=neon' },
                ]
            },
            {
                _key: 'col4',
                title: 'Ofertas',
                links: []
            }
        ]
    },
    {
        _key: 'nav4',
        label: 'Puntos de atención',
        link: '/puntos-atencion',
        hasMegaMenu: false,
    },
    {
        _key: 'nav5',
        label: 'Blogs',
        link: '/blogs',
        hasMegaMenu: false,
    }
]

async function migrate() {
    const tickerMessages = await fetchWordPressTicker()

    const doc = {
        _id: 'globalConfig',
        _type: 'globalConfig',
        pageName: 'Configuración Global',
        header: {
            ticker: tickerMessages.length > 0 ? tickerMessages : [
                "🎉 No te pierdas nuestras promociones exclusivas",
                "🚚 Envíos a todo el país",
                "✨ Telas premium: calidad que se siente",
                "🧵 Personalización para tus proyectos",
            ],
            menu: MENU_STRUCTURE
        },
        footer: {
            copyright: '© 2024 Telas Real. Todos los derechos reservados.'
        }
    }

    console.log('Creating/Updating globalConfig in Sanity...')

    try {
        const result = await client.createOrReplace(doc)
        console.log('Migration successful!')
        console.log('Document ID:', result._id)
    } catch (err) {
        console.error('Migration failed:', err)
    }
}

migrate()
