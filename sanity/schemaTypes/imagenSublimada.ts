
import { defineField, defineType } from 'sanity'
import { Image } from 'lucide-react'

export const imagenSublimada = defineType({
    name: 'imagenSublimada',
    title: 'Imágenes Sublimadas',
    type: 'document',
    icon: Image,
    fields: [
        defineField({
            name: 'name',
            title: 'Nombre del Archivo',
            type: 'string',
        }),
        defineField({
            name: 'image',
            title: 'Imagen',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'category',
            title: 'Categoría',
            type: 'string',
        }),
        defineField({
            name: 'subcategory',
            title: 'Subcategoría',
            type: 'string',
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'category',
            media: 'image',
        },
    },
})
