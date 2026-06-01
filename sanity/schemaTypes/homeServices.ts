import { defineArrayMember, defineField, defineType } from 'sanity'

export const homeServices = defineType({
    name: 'homeServices',
    title: 'Servicios Especiales',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título de la Sección',
            type: 'string',
            initialValue: 'Servicios Especiales'
        }),
        defineField({
            name: 'description',
            title: 'Descripción Corta',
            type: 'string',
            initialValue: 'Más que una tienda de telas, somos tu aliado en cada proyecto'
        }),
        defineField({
            name: 'services',
            title: 'Lista de Servicios',
            type: 'array',
            of: [
                defineArrayMember({
                    type: 'object',
                    fields: [
                        defineField({
                            name: 'title',
                            title: 'Título',
                            type: 'string',
                        }),
                        defineField({
                            name: 'description',
                            title: 'Descripción',
                            type: 'text',
                            rows: 2,
                        }),
                        defineField({
                            name: 'icon',
                            title: 'Icono',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Tijeras (Corte)', value: 'scissors' },
                                    { title: 'Camión (Envíos)', value: 'truck' },
                                    { title: 'Paleta (Asesoría)', value: 'palette' },
                                    { title: 'Destellos (Sublimación)', value: 'sparkles' },
                                ]
                            }
                        })
                    ]
                })
            ]
        })
    ],
    preview: {
        select: {
            title: 'title',
        },
        prepare(selection) {
            return {
                title: 'Servicios Especiales',
                subtitle: selection.title
            }
        }
    }
})
