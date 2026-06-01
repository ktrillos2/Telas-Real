
import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'

export async function GET() {
    try {
        const products = await client.fetch(groq`*[_type == "product"]{
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
    }`)

        const headers = [
            "ID", "Title", "Slug", "Price", "Sale Price",
            "Stock Status", "Inventory", "Categories",
            "Usages", "Tones", "Tags", "Attributes",
            "Image URL", "Short Description", "Description"
        ]

        const csvRows = [headers.join(',')]

        for (const p of products) {
            const attributes = p.attributes?.map((a: any) => `${a.name}: ${a.value}`).join(' | ') || ''

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
                return `"${stringField.replace(/"/g, '""')}"`
            })

            csvRows.push(row.join(','))
        }

        const csvContent = csvRows.join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="products.csv"',
            },
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}
