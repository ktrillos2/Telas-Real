
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
        defineField({
            name: 'seoTitle',
            title: 'Título SEO (Opcional)',
            type: 'string',
            description: 'Título personalizado para los motores de búsqueda (ej. Google). Si se deja en blanco, se usará el nombre de la categoría.',
            group: 'seo',
        }),
        defineField({
            name: 'seoDescription',
            title: 'Descripción SEO (Opcional)',
            type: 'text',
            description: 'Descripción para los motores de búsqueda (ideal de 150-160 caracteres).',
            group: 'seo',
        }),
    ],
    groups: [
        {
            name: 'seo',
            title: 'SEO',
        },
    ],
})
