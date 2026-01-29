const fs = require('fs');
const path = require('path');

// Robust Env Loading
function loadEnv() {
    try {
        require('dotenv').config({ path: '.env.local' });
    } catch (e) {
        console.warn('dotenv not found, loading .env.local manually');
        try {
            const envPath = path.join(process.cwd(), '.env.local');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf-8');
                envContent.split('\n').forEach(line => {
                    const match = line.match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        let value = match[2].trim();
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                        process.env[key] = value;
                    }
                });
            }
        } catch (err) {
            console.error('Failed to load .env.local', err);
        }
    }
}
loadEnv();

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const CSV_PATH = path.join(process.cwd(), 'products.csv');
const OUTPUT_PATH = path.join(process.cwd(), 'products.json');

// Helper: Slugify
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
};

// Helper: Transform HTML to Text (Strip tags)
const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};

const truncateText = (text, maxLength = 160) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
};

// Helper: Custom CSV Parser
function parseCSV(text) {
    const records = [];
    let row = [];
    let current = '';
    let inQuote = false;

    // Normalize line endings
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalizedText.length; i++) {
        const char = normalizedText[i];
        const next = normalizedText[i + 1];

        if (inQuote) {
            if (char === '"' && next === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else if (char === '"') {
                // End of quote
                inQuote = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                row.push(current);
                current = '';
            } else if (char === '\n') {
                row.push(current);
                records.push(row);
                row = [];
                current = '';
            } else {
                current += char;
            }
        }
    }
    // Push last row if exists
    if (current || row.length > 0) {
        row.push(current);
        records.push(row);
    }
    return records;
}

async function getSanityClient() {
    let createClient;
    try {
        const mod = await import('next-sanity');
        createClient = mod.createClient;
    } catch (e) {
        try {
            const mod = await import('sanity');
            createClient = mod.createClient;
        } catch (e2) {
            try {
                const mod = await import('@sanity/client');
                createClient = mod.createClient;
            } catch (e3) {
                if (DRY_RUN) {
                    console.warn("Sanity client missing. Dry run will simulate.");
                    return { transaction: () => ({ createOrReplace: () => { }, commit: () => { } }) };
                }
                throw new Error("Could not load Sanity client packages.");
            }
        }
    }

    return createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: '2024-01-01',
        token: process.env.SANITY_API_TOKEN,
        useCdn: false,
    });
}

// Image upload helper
async function uploadImage(client, url, filename) {
    if (DRY_RUN) return { _id: `DRY_RUN_ASSET_ID_${filename}` };

    try {
        // console.log(`Downloading ${url}...`); 
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
        const buffer = await res.arrayBuffer();

        // console.log(`Uploading ${filename}...`);
        const asset = await client.assets.upload('image', Buffer.from(buffer), {
            filename: filename
        });
        return asset;
    } catch (error) {
        console.error(`Error processing image ${url}:`, error.message);
        return null; // Return null to skip image or handle failure
    }
}

// Main Migration Function
async function migrate() {
    console.log(`Reading CSV from ${CSV_PATH}...`);

    let client;
    if (!DRY_RUN) {
        try {
            client = await getSanityClient();
            console.log("Sanity client initialized.");
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    }

    try {
        const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const rawRecords = parseCSV(fileContent);

        if (rawRecords.length < 2) {
            console.error("CSV file is empty or has no data.");
            process.exit(1);
        }

        // Map headers
        const headers = rawRecords[0];
        const records = rawRecords.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                const key = header.trim();
                obj[key] = row[index] || '';
            });
            return obj;
        });

        console.log(`Found ${records.length} records. Processing...`);

        const sanityDocuments = [];
        let processedCount = 0;

        // Process one by one to handle async image uploads properly
        for (const record of records) {
            const id = record['ID']?.trim();
            if (!id) continue;

            const name = record['Nombre'];
            let slug = name ? slugify(name) : '';

            // Attributes
            const attributes = [];
            for (let i = 1; i <= 4; i++) {
                const nameKey = `Nombre del atributo ${i}`;
                const valueKey = `Valor(es) del atributo ${i}`;
                const visibleKey = `Atributo visible ${i}`;
                const globalKey = `Atributo global ${i}`;

                if (record[nameKey] && record[valueKey]) {
                    attributes.push({
                        name: record[nameKey],
                        value: record[valueKey],
                        visible: record[visibleKey] === '1',
                        global: record[globalKey] === '1',
                        _key: `attr_${i}_${id}`
                    });
                }
            }

            // Images
            const imageUrls = record['Imágenes'] ? record['Imágenes'].split(',').map(url => url.trim()).filter(url => url) : [];
            const images = [];

            for (let i = 0; i < imageUrls.length; i++) {
                const url = imageUrls[i];
                const filename = `product-${id}-${i}.jpg`;

                let assetId = null;
                if (DRY_RUN) {
                    // Placeholder for dry run
                    assetId = `DRY_RUN_ASSET_ID_${i}`;
                } else {
                    const asset = await uploadImage(client, url, filename);
                    if (asset) assetId = asset._id;
                }

                if (assetId) {
                    images.push({
                        _type: 'image',
                        asset: {
                            _type: 'reference',
                            _ref: assetId
                        },
                        _key: `img_${id}_${i}`
                    });
                }
            }

            const inStock = record['¿Existencias?'] === '1';

            sanityDocuments.push({
                _id: id,
                _type: 'product',
                title: record['Nombre'],
                slug: { _type: 'slug', current: slug },
                description: record['Descripción'], // Keep original HTML in description
                descriptionShort: record['Descripción corta'] || truncateText(stripHtml(record['Descripción']), 150),
                seoTitle: record['Meta: _aioseo_title'] || `${record['Nombre']} | Telas Real`,
                seoDescription: record['Meta: _aioseo_description'] || truncateText(stripHtml(record['Descripción']), 160),
                price: record['Precio normal'] ? parseFloat(record['Precio normal']) : 0,
                salePrice: record['Precio rebajado'] ? parseFloat(record['Precio rebajado']) : 0,

                // Tax Fields Removed as per request

                stockStatus: inStock ? 'inStock' : 'outOfStock',
                inventory: record['Inventario'] ? parseInt(record['Inventario'], 10) : 0,
                attributes: attributes,
                images: images,
            });

            processedCount++;
            if (processedCount % 10 === 0 && !DRY_RUN) {
                process.stdout.write(`Processed ${processedCount}/${records.length}...\r`);
            }
        }

        console.log(`\nProcessed ${sanityDocuments.length} valid documents.`);

        if (DRY_RUN) {
            console.log(`--dry-run enabled. Writing to ${OUTPUT_PATH} and skipping upload.`);
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sanityDocuments, null, 2));
            console.log('Done.');
        } else {
            console.log('Starting document upload to Sanity...');
            const CHUNK_SIZE = 50;
            for (let i = 0; i < sanityDocuments.length; i += CHUNK_SIZE) {
                const chunk = sanityDocuments.slice(i, i + CHUNK_SIZE);
                const tx = client.transaction();
                chunk.forEach(doc => {
                    tx.createOrReplace(doc);
                });
                console.log(`Committing batch ${i / CHUNK_SIZE + 1} / ${Math.ceil(sanityDocuments.length / CHUNK_SIZE)}...`);
                await tx.commit();
            }

            console.log('Migration complete.');
        }

    } catch (error) {
        console.error('Error migration:', error);
        process.exit(1);
    }
}

migrate();
