
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-02-05',
    useCdn: false,
})

function parseCSV(csvText: string) {
    const lines = csvText.split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const obj: any = {};
        let currentline = line;

        // Simple regex to handle quoted fields with commas
        // This is a basic parser and might not handle all edge cases (like escaped quotes)
        const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const values = currentline.split(re).map(v => v.trim().replace(/^"|"$/g, '').trim());

        if (values.length < 2) continue; // Skip partial lines

        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        result.push(obj);
    }
    return result;
}

async function seedProducts() {
    const csvFilePath = path.join(process.cwd(), 'calculadora.csv')

    if (!fs.existsSync(csvFilePath)) {
        console.error("CSV file not found:", csvFilePath)
        return
    }

    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const products = parseCSV(csvContent)

    console.log(`Found ${products.length} products in CSV.`)

    for (const row of products) {
        const name = row['REFERENCIA']
        const priceStr = row['PRECIO X KILO']

        if (!name || !priceStr || priceStr === 'N/A' || priceStr === '') {
            console.log(`Skipping invalid row: ${name}`)
            continue
        }

        // Clean price string: "$ 56,250 " -> 56250
        const pricePerKilo = parseInt(priceStr.replace(/[^0-9]/g, ''), 10)

        if (isNaN(pricePerKilo)) {
            console.log(`Invalid price for ${name}: ${priceStr}`)
            continue
        }

        const slug = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')

        console.log(`Processing: ${name} - $${pricePerKilo}/kg`)

        const productDoc = {
            _type: 'product',
            title: name,
            slug: { _type: 'slug', current: slug },
            price: 0,
            pricePerKilo: pricePerKilo,
            description: `Producto especial para sublimación: ${name}. Precio por kilo.`,
            designSelectionEnabled: true,
            stockStatus: 'inStock',
            inventory: 1000,
            isVisible: true,
        }

        try {
            const docId = `product-${slug}`
            await client.createOrReplace({
                _id: docId,
                ...productDoc
            })
            console.log(`✅ Upserted ${name}`)
        } catch (err) {
            console.error(`❌ Error uploading ${name}:`, err)
        }
    }
}

seedProducts()
