import { defineArrayMember, defineField, defineType } from 'sanity'

export const personalizadoFeatures = defineType({
    name: 'personalizadoFeatures',
    title: 'Grilla de Características',
    type: 'document',
    fields: [
        defineField({
            name: 'features',
            title: 'Características',
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
                            rows: 3,
                        }),
                        defineField({
                            name: 'icon',
                            title: 'Icono',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Paleta (Diseños Ilimitados)', value: 'palette' },
                                    { title: 'Destellos (Alta Calidad)', value: 'sparkles' },
                                    { title: 'Rayo (Entrega Rápida)', value: 'zap' },
                                    { title: 'Corazón (Acabado Profesional)', value: 'heart' },
                                ]
                            }
                        })
                    ]
                })
            ]
        })
    ],
    preview: {
        prepare() {
            return {
                title: 'Grilla de Características'
            }
        }
    }
})
