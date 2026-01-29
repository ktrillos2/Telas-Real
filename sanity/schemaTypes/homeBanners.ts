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
