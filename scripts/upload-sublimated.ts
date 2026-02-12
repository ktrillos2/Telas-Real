
import { createClient } from '@sanity/client'
import { readdirSync, statSync, createReadStream } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
    console.error('Missing Sanity configuration in .env.local')
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2024-02-11',
    useCdn: false,
})

const BASE_DIR = 'SUBLIMADOS'

async function uploadImage(filePath: string, category: string, subcategory: string | null) {
    const filename = path.basename(filePath)
    console.log(`Processing: ${filename} (Cat: ${category}, Sub: ${subcategory})`)

    try {
        // 1. Upload Asset
        const imageAsset = await client.assets.upload('image', createReadStream(filePath), {
            filename: filename
        })

        // 2. Create Document
        const doc = {
            _type: 'imagenSublimada',
            name: filename,
            image: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAsset._id
                }
            },
            category: category,
            subcategory: subcategory
        }

        await client.create(doc)
        console.log(`✅ Uploaded and created document for: ${filename}`)

    } catch (error) {
        console.error(`❌ Error uploading ${filename}:`, error)
    }
}

async function traverseDirectory(currentPath: string, category: string | null = null, subcategory: string | null = null) {
    const files = readdirSync(currentPath)

    for (const file of files) {
        if (file.startsWith('.')) continue // Skip hidden files

        const filePath = join(currentPath, file)
        const stats = statSync(filePath)

        if (stats.isDirectory()) {
            // Determine category logic
            // If we are at BASE_DIR, this new dir is a Category
            // If we are already in a Category, this is a Subcategory
            let newCategory = category
            let newSubcategory = subcategory

            if (!category) {
                newCategory = file
            } else if (!subcategory) {
                newSubcategory = file
            }

            await traverseDirectory(filePath, newCategory, newSubcategory)

        } else if (stats.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                if (category) {
                    await uploadImage(filePath, category, subcategory)
                } else {
                    console.warn(`Skipping ${file} - not in a category folder`)
                }
            }
        }
    }
}

async function main() {
    const rootDir = join(process.cwd(), BASE_DIR)

    try {
        statSync(rootDir)
    } catch (e) {
        console.error(`Folder '${BASE_DIR}' not found in root directory!`)
        process.exit(1)
    }

    console.log(`Starting upload from ${rootDir}...`)
    await traverseDirectory(rootDir)
    console.log('Done!')
}

main()
