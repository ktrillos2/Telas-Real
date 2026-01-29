import { defineArrayMember, defineField, defineType } from 'sanity'

export const personalizadoInfo = defineType({
    name: 'personalizadoInfo',
    title: 'Info y Tarifas',
    type: 'document',
    fields: [
        // Group 1: Conditions
        defineField({
            name: 'conditionsTitle',
            title: 'Título Condiciones',
            type: 'string',
            initialValue: 'Condiciones del Servicio'
        }),
        defineField({
            name: 'conditionsContent',
            title: 'Contenido Condiciones',
            type: 'array',
            of: [
                defineArrayMember({
                    type: 'block',
                    styles: [{ title: 'Normal', value: 'normal' }],
                    lists: [{ title: 'Bullet', value: 'bullet' }],
                    marks: {
                        decorators: [
                            { title: 'Strong', value: 'strong' },
                        ]
                    }
                })
            ]
        }),

        // Group 2: Pricing
        defineField({
            name: 'pricingTitle',
            title: 'Título Tarifas',
            type: 'string',
            initialValue: 'Tarifas por Metro'
        }),
        defineField({
            name: 'pricingItems',
            title: 'Lista de Precios',
            type: 'array',
            of: [
                defineArrayMember({
                    type: 'object',
                    fields: [
                        defineField({ name: 'label', title: 'Rango/Etiqueta', type: 'string' }),
                        defineField({ name: 'price', title: 'Precio', type: 'string' }),
                        defineField({ name: 'unit', title: 'Unidad', type: 'string', initialValue: '/m' }),
                    ]
                })
            ]
        }),
        defineField({
            name: 'pricingNote',
            title: 'Nota de Precios',
            type: 'string',
            initialValue: '* Precios sujetos a cambios sin previo aviso. Aplican condiciones.'
        })
    ],
    preview: {
        prepare() {
            return {
                title: 'Info y Tarifas'
            }
        }
    }
})
