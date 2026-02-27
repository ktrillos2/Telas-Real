import { defineField, defineType } from 'sanity'

export const calculadoraSettings = defineType({
    name: 'calculadoraSettings',
    title: 'Configuraciones de Calculadora',
    type: 'document',
    fields: [
        defineField({
            name: 'fabrics',
            title: 'Telas (Equivalencias)',
            type: 'array',
            description: 'Añade y edita los rendimientos y precios de las telas utilizadas en la calculadora.',
            of: [
                {
                    type: 'object',
                    fields: [
                        defineField({
                            name: 'name',
                            title: 'Nombre de Referencia',
                            type: 'string',
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                            name: 'yield',
                            title: 'Rendimiento (Metros por Kilo)',
                            type: 'number',
                            validation: (Rule) => Rule.required().positive(),
                        }),
                        defineField({
                            name: 'pricePerKilo',
                            title: 'Precio por Kilo ($)',
                            type: 'number',
                            validation: (Rule) => Rule.min(0),
                        }),
                        defineField({
                            name: 'pricePerMeter',
                            title: 'Precio por Metro ($)',
                            type: 'number',
                            validation: (Rule) => Rule.min(0),
                        }),
                        defineField({
                            name: 'pricePerRoll',
                            title: 'Precio por Rollo ($) (Opcional)',
                            type: 'number',
                            validation: (Rule) => Rule.min(0),
                        }),
                    ],
                    preview: {
                        select: {
                            title: 'name',
                            yieldAmt: 'yield',
                            priceKilo: 'pricePerKilo'
                        },
                        prepare(selection) {
                            const { title, yieldAmt, priceKilo } = selection
                            return {
                                title: title,
                                subtitle: `Rendimiento: ${yieldAmt}m/kg | Precio kg: $${priceKilo}`
                            }
                        }
                    }
                }
            ]
        })
    ]
})
