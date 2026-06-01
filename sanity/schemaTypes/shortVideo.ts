import { defineField, defineType } from 'sanity'
import { Play } from 'lucide-react'

export const shortVideo = defineType({
    name: 'shortVideo',
    title: 'Videos Verticales (Reels)',
    type: 'document',
    icon: Play,
    fields: [
        defineField({
            name: 'title',
            title: 'Título del Video',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Descripción',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'videoFile',
            title: 'Archivo de Video (MP4)',
            type: 'file',
            options: {
                accept: 'video/mp4,video/quicktime,video/*',
            },
            validation: (Rule) => Rule.required(),
            description: 'Sube un video en formato vertical (9:16) optimizado para web.',
        }),
        defineField({
            name: 'thumbnail',
            title: 'Imagen de Portada (Opcional)',
            type: 'image',
            options: { hotspot: true },
            description: 'Se mostrará mientras el video carga.',
        }),
        defineField({
            name: 'relatedProduct',
            title: 'Producto Relacionado',
            type: 'reference',
            to: [{ type: 'product' }],
            description: 'Selecciona una tela para mostrar el botón de "Comprar" sobre el video.',
        }),
        defineField({
            name: 'isActive',
            title: 'Activo',
            type: 'boolean',
            initialValue: true,
            description: 'Si está desactivado, el video no aparecerá en la web.',
        }),
    ],
    preview: {
        select: {
            title: 'title',
            media: 'thumbnail',
            subtitle: 'relatedProduct.title'
        },
        prepare({ title, media, subtitle }) {
            return {
                title,
                media,
                subtitle: subtitle ? `🔗 ${subtitle}` : 'Sin producto',
            }
        }
    }
})
