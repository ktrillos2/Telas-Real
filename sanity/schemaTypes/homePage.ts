import { defineField, defineType } from 'sanity'

export const homePage = defineType({
    name: 'homePage',
    title: 'Página de Inicio',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título de la Página',
            type: 'string',
            initialValue: 'Inicio',
        }),
        defineField({
            name: 'mainSection',
            title: 'Sección Principal',
            type: 'object',
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
            ]
        }),
    ],
})
