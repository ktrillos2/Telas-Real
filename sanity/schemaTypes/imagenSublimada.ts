
import { defineField, defineType } from 'sanity'
import { Image } from 'lucide-react'
import { CategorySublimadaInput } from '../components/CategorySublimadaInput'

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
            title: 'Categoría (Tela Sublimada)',
            type: 'string',
            description: 'Selecciona o escribe el tipo de tela sublimada para este diseño',
            components: {
                input: CategorySublimadaInput,
            },
        }),
        defineField({
            name: 'subcategory',
            title: 'Subcategoría',
            type: 'string',
        }),
        defineField({
            name: 'isActive',
            title: 'Activo',
            description: 'Activa o desactiva este diseño para que sea visible (o no).',
            type: 'boolean',
            initialValue: true,
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
