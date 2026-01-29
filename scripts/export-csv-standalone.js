
const fs = require('fs')

const config = {
    projectId: "tbk0k9ou",
    dataset: "production",
    apiVersion: '2024-01-01',
    token: "skER2rV1271qsq9yxGtrTCJgiQnxukdCZBtSd6jJGP3mFKnaeQADxIcNRWLDmoN04yjTXC20Q2gLwrOMxXKFyrUZ02pkT2zBoJtzTs7e2SP37FhsK3uScMK54MZDDPDWAkcmKLozPdUxNVn6kyfT3WpAk0r6hKBbRd6TlqYSZTRGbmAQrYNV"
}

const query = `*[_type == "product"]{
  _id,
  title,
  "slug": slug.current,
  price,
  salePrice,
  stockStatus,
  inventory,
  "categories": categories[]->title,
  "usages": usages[]->title,
  "tones": tones[]->title,
  "tags": tags[]->name,
  description,
  descriptionShort,
  "attributes": attributes[]{name, "value": value},
  "imageUrl": images[0].asset->url
}`

async function exportProducts() {
    try {
        console.log('Fetching products via API...')
        const url = `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${encodeURIComponent(query)}`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const json = await response.json()
        const products = json.result

        console.log(`Found ${products.length} products. Generating CSV...`)

        const headers = [
            "ID", "Title", "Slug", "Price", "Sale Price",
            "Stock Status", "Inventory", "Categories",
            "Usages", "Tones", "Tags", "Attributes",
            "Image URL", "Short Description", "Description"
        ]

        const csvRows = [headers.join(',')]

        for (const p of products) {
            const attributes = p.attributes?.map(a => `${a.name}: ${a.value}`).join(' | ') || ''

            const row = [
                p._id,
                p.title || '',
                p.slug || '',
                p.price || '',
                p.salePrice || '',
                p.stockStatus || '',
                p.inventory || '',
                (p.categories || []).join(', '),
                (p.usages || []).join(', '),
                (p.tones || []).join(', '),
                (p.tags || []).join(', '),
                attributes,
                p.imageUrl || '',
                p.descriptionShort || '',
                p.description || ''
            ].map(field => {
                // Escape quotes and wrap in quotes
                const stringField = String(field || '')
                // If field contains comma, quote or newline, it must be quoted.
                // Also escape existing double quotes by doubling them.
                return `"${stringField.replace(/"/g, '""')}"`
            })

            csvRows.push(row.join(','))
        }

        const csvContent = csvRows.join('\n')
        fs.writeFileSync('products_data.csv', csvContent)
        console.log('Success! Saved to products_data.csv')

    } catch (error) {
        console.error('Error exporting products:', error)
        process.exit(1)
    }
}

exportProducts()
