import { defineField, defineType } from 'sanity'

export const header = defineType({
    name: 'header',
    title: 'Encabezado (Header)',
    type: 'document',
    fields: [
        defineField({
            name: 'ticker',
            title: 'Barra de Anuncios (Ticker)',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'Textos que aparecen en la barra superior animada (envíos, promociones, etc.)',
        }),
        defineField({
            name: 'logo',
            title: 'Logo Principal',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'menu',
            title: 'Menú Principal',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'navItem',
                    title: 'Elemento de Menú',
                    fields: [
                        defineField({ name: 'label', type: 'string', title: 'Etiqueta' }),
                        defineField({ name: 'link', type: 'string', title: 'Enlace (URL)' }),
                        defineField({
                            name: 'hasMegaMenu',
                            type: 'boolean',
                            title: '¿Tiene Mega Menú?',
                            initialValue: false,
                        }),
                        defineField({
                            name: 'megaMenuColumns',
                            title: 'Columnas del Mega Menú',
                            type: 'array',
                            hidden: ({ parent }) => !parent?.hasMegaMenu,
                            of: [
                                {
                                    type: 'object',
                                    title: 'Columna',
                                    fields: [
                                        defineField({ name: 'title', type: 'string', title: 'Título de Columna' }),
                                        defineField({
                                            name: 'contentType',
                                            title: 'Tipo de Contenido',
                                            type: 'string',
                                            options: {
                                                list: [
                                                    { title: 'Enlaces Manuales', value: 'manual' },
                                                    { title: 'Catálogo de Usos', value: 'usage' },
                                                    { title: 'Catálogo de Tonos', value: 'tone' },
                                                    { title: 'Ofertas', value: 'offer' },
                                                ],
                                                layout: 'radio'
                                            },
                                            initialValue: 'manual'
                                        }),
                                        defineField({
                                            name: 'links',
                                            title: 'Enlaces',
                                            type: 'array',
                                            hidden: ({ parent }) => parent?.contentType !== 'manual' && parent?.contentType !== undefined,
                                            of: [
                                                {
                                                    type: 'object',
                                                    fields: [
                                                        defineField({ name: 'label', type: 'string', title: 'Etiqueta' }),
                                                        defineField({ name: 'url', type: 'string', title: 'URL' }),
                                                    ],
                                                },
                                            ],
                                        }),
                                    ],
                                },
                            ],
                        }),
                    ],
                },
            ],
        }),
    ],
})
