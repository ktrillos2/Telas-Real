
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
            title: 'Categoría (Tela Sublimada)',
            type: 'string',
            description: 'Selecciona o escribe el tipo de tela sublimada para este diseño',
            options: {
                list: [
                    { title: 'BRUSH SUBLIMADO', value: 'BRUSH SUBLIMADO' },
                    { title: 'PIEL DE CONEJO SUBLIMADO', value: 'PIEL DE CONEJO SUBLIMADO' },
                    { title: 'SATIN SUBLIMADO', value: 'SATIN SUBLIMADO' },
                    { title: 'SUAVETINA SUBLIMADA', value: 'SUAVETINA SUBLIMADA' },
                    { title: 'SCUBA SUBLIMADA', value: 'SCUBA SUBLIMADA' },
                    { title: 'CHIFON SUBLIMADO', value: 'CHIFON SUBLIMADO' },
                    { title: 'ANTIFLUIDO SUBLIMADO', value: 'ANTIFLUIDO SUBLIMADO' },
                    { title: 'SEDA SUBLIMADA', value: 'SEDA SUBLIMADA' },
                    { title: 'TERCIOPELO SUBLIMADO', value: 'TERCIOPELO SUBLIMADO' },
                    { title: 'LAFAYETTE SUBLIMADO', value: 'LAFAYETTE SUBLIMADO' },
                    { title: 'LINO SUBLIMADO', value: 'LINO SUBLIMADO' },
                    { title: 'CREPE SUBLIMADO', value: 'CREPE SUBLIMADO' },
                    { title: 'DAKOTA SUBLIMADA', value: 'DAKOTA SUBLIMADA' },
                    { title: 'MICROFIBRA SUBLIMADA', value: 'MICROFIBRA SUBLIMADA' },
                ]
            }
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
