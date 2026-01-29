
import { defineField, defineType } from 'sanity'
import { Tag } from 'lucide-react'

export const product = defineType({
    name: 'product',
    title: 'Productos',
    type: 'document',
    // icon: Tag, // Icons are not directly importable in schema files usually, requires plugin or different struct
    fields: [
        defineField({
            name: 'name',
            title: 'Nombre',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'price',
            title: 'Precio Regular',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'sale_price',
            title: 'Precio de Oferta',
            type: 'number',
            description: 'Dejar en 0 si no hay oferta',
        }),
        defineField({
            name: 'stock_status',
            title: 'Estado de Inventario',
            type: 'string',
            options: {
                list: [
                    { title: 'En Stock', value: 'instock' },
                    { title: 'Agotado', value: 'outofstock' },
                    { title: 'Bajo Pedido', value: 'onbackorder' },
                ],
                layout: 'radio'
            },
            initialValue: 'instock'
        }),
        defineField({
            name: 'short_description',
            title: 'Descripción Corta',
            type: 'text',
            rows: 3
        }),
        defineField({
            name: 'description',
            title: 'Descripción Completa',
            type: 'array',
            of: [{ type: 'block' }]
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
        defineField({
            name: 'attributes',
            title: 'Atributos (Color, Peso, etc.)',
            type: 'array',
            of: [{
                type: 'object',
                fields: [
                    { name: 'name', type: 'string', title: 'Nombre (ej. Color)' },
                    { name: 'value', type: 'string', title: 'Valor (ej. Azul)' }
                ]
            }]
        })
    ],
})
