
import { defineField, defineType } from 'sanity'
import { Tag } from 'lucide-react'

export const product = defineType({
    name: 'product',
    title: 'Productos',
    type: 'document',
    icon: Tag,
    fields: [
        // 1. Información Básica y SEO
        defineField({
            name: 'title',
            title: 'Título del Producto',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Descripción (HTML)',
            type: 'text', // Using text to store HTML content as string
            rows: 5,
        }),
        defineField({
            name: 'descriptionShort',
            title: 'Descripción Corta',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'seoTitle',
            title: 'Metatítulo (SEO)',
            type: 'string',
        }),
        defineField({
            name: 'seoDescription',
            title: 'Metadescripción (SEO)',
            type: 'text',
            rows: 3,
        }),

        // 2. Precios
        defineField({
            name: 'price',
            title: 'Precio Normal',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'salePrice',
            title: 'Precio Rebajado',
            type: 'number',
            description: 'Dejar en 0 si no hay oferta',
        }),

        // 3. Inventario y Stock
        defineField({
            name: 'stockStatus',
            title: 'Estado de Stock',
            type: 'string',
            options: {
                list: [
                    { title: 'En Stock', value: 'inStock' },
                    { title: 'Agotado', value: 'outOfStock' },
                    { title: 'Bajo Pedido', value: 'onBackorder' },
                ],
                layout: 'radio'
            },
            initialValue: 'inStock'
        }),
        defineField({
            name: 'inventory',
            title: 'Cantidad de Stock',
            type: 'number',
        }),

        // 4. Clasificación (Usos y Tonos)
        defineField({
            name: 'usages',
            title: 'Usos',
            description: 'Selecciona los usos aplicables para este producto',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'usage' } }]
        }),
        defineField({
            name: 'tones',
            title: 'Tonos',
            description: 'Selecciona los tonos disponibles',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'tone' } }]
        }),

        // 5. Atributos y Multimedia
        defineField({
            name: 'attributes',
            title: 'Atributos',
            type: 'array',
            of: [{
                type: 'object',
                fields: [
                    { name: 'name', type: 'string', title: 'Nombre (ej. Ancho)' },
                    { name: 'value', type: 'string', title: 'Valor (ej. 1.55 metros)' },
                    { name: 'visible', type: 'boolean', title: 'Visible', initialValue: true },
                    { name: 'global', type: 'boolean', title: 'Global', initialValue: true }
                ]
            }]
        }),
        defineField({
            name: 'images',
            title: 'Imágenes',
            type: 'array',
            of: [{ type: 'image', options: { hotspot: true } }],
        }),

        defineField({
            name: 'categories',
            title: 'Categorías',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'category' } }]
        }),
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'price',
            media: 'images.0.asset'
        },
        prepare(selection) {
            const { title, subtitle, media } = selection
            return {
                title: title,
                subtitle: subtitle ? `$${subtitle}` : 'Sin precio',
                media: media
            }
        }
    }
})
