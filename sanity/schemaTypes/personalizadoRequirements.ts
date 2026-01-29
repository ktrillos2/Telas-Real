import { defineArrayMember, defineField, defineType } from 'sanity'

export const personalizadoRequirements = defineType({
    name: 'personalizadoRequirements',
    title: 'Requisitos y Validación',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título Principal',
            type: 'string',
            initialValue: 'Diseños Personalizados'
        }),
        defineField({
            name: 'intro',
            title: 'Introducción',
            type: 'text',
            rows: 3,
            initialValue: '¿Quieres sublimar tu propio diseño? ¡Perfecto! Solo necesitamos que nos envíes tu arte listo para producción con estas especificaciones:'
        }),

        // Card 1: Requisitos
        defineField({
            name: 'card1Title',
            title: 'Título Tarjeta 1 (Requisitos)',
            type: 'string',
            initialValue: 'Requisitos del Archivo'
        }),
        defineField({
            name: 'requirements',
            title: 'Lista de Requisitos',
            type: 'array',
            of: [
                defineArrayMember({
                    type: 'object',
                    fields: [
                        defineField({ name: 'label', title: 'Etiqueta (Negrita)', type: 'string' }),
                        defineField({ name: 'value', title: 'Valor', type: 'string' })
                    ]
                })
            ]
        }),

        // Card 2: Validación
        defineField({
            name: 'card2Title',
            title: 'Título Tarjeta 2 (Validación)',
            type: 'string',
            initialValue: 'Proceso de Validación'
        }),
        defineField({
            name: 'card2Intro',
            title: 'Intro Tarjeta 2',
            type: 'array',
            of: [
                defineArrayMember({
                    type: 'block',
                    styles: [{ title: 'Normal', value: 'normal' }],
                    marks: {
                        decorators: [{ title: 'Strong', value: 'strong' }]
                    }
                })
            ]
        }),
        defineField({
            name: 'validationOptions',
            title: 'Opciones de Validación',
            type: 'array',
            of: [defineArrayMember({ type: 'string' })]
        }),
        defineField({
            name: 'card2Note',
            title: 'Nota Final Validación',
            type: 'text',
            rows: 2,
            initialValue: 'Tras tu aprobación, enviamos a sublimación el total del pedido y te notificamos los tiempos de producción.'
        }),

        defineField({
            name: 'closingText',
            title: 'Texto de Cierre',
            type: 'string',
            initialValue: 'Tu diseño, personalizado a tu medida.'
        })
    ],
    preview: {
        select: {
            title: 'title',
        },
        prepare(selection) {
            return {
                title: selection.title,
                subtitle: 'Requisitos y Validación'
            }
        }
    }
})
