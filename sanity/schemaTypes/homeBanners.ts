import { defineField, defineType } from 'sanity'

export const homeBanners = defineType({
    name: 'homeBanners',
    title: 'Banners Principales',
    type: 'document',
    fields: [
        defineField({
            name: 'banners',
            title: 'Banners',
            type: 'array',
            of: [
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Texto Alternativo',
                            type: 'string'
                        }),
                        defineField({
                            name: 'mobileImage',
                            title: 'Imagen para Móvil (Opcional)',
                            type: 'image',
                            options: { hotspot: true }
                        }),
                        defineField({
                            name: 'videoFile',
                            title: 'Archivo de Video (Opcional)',
                            type: 'file',
                            options: { accept: 'video/*' },
                            description: 'Sube un video corto (MP4 recomendado). Si se incluye, reemplazará a la imagen principal del banner.'
                        })
                    ]
                }
            ]
        })
    ],
    preview: {
        select: {
            banners: 'banners'
        },
        prepare(selection) {
            const { banners } = selection
            return {
                title: 'Banners Principales',
                subtitle: `${banners ? banners.length : 0} banners activos`,
                media: banners && banners[0]
            }
        }
    }
})
