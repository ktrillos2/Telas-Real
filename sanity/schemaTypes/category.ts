
import { defineField, defineType } from 'sanity'

export const category = defineType({
    name: 'category',
    title: 'Categorías de Producto',
    type: 'document',
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
            name: 'description',
            title: 'Descripción',
            type: 'text',
        }),
        defineField({
            name: 'image',
            title: 'Imagen',
            type: 'image',
            options: { hotspot: true }
        }),
    ],
})
