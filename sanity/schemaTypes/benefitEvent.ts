import { defineField, defineType } from 'sanity'

export const benefitEvent = defineType({
    name: 'benefitEvent',
    title: 'Beneficio de Obsequio',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título del Beneficio',
            type: 'string',
            initialValue: 'Beneficio Liquidación',
            description: 'Nombre interno para este beneficio.',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'isActive',
            title: 'Activar Beneficio',
            type: 'boolean',
            initialValue: false,
            description: 'Si está activo, los clientes que cumplan los requisitos recibirán un obsequio automático.',
        }),
        defineField({
            name: 'endDate',
            title: 'Fecha de Fin',
            type: 'datetime',
            description: 'El beneficio será válido hasta esta fecha (ej: 20 de julio). Si se deja vacío, aplica indefinidamente mientras esté activo.',
        }),
        defineField({
            name: 'liquidationProducts',
            title: 'Productos en Liquidación (Obsequios)',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'product' }] }],
            description: 'Selecciona las telas específicas que se pueden dar de obsequio.',
            validation: (Rule) => Rule.unique(),
        }),
        defineField({
            name: 'liquidationCategories',
            title: 'Tipos de Tela en Liquidación (Categorías)',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            description: 'Opcional. Selecciona categorías (tipos de tela) de obsequio. Se elegirá un producto al azar de estas categorías.',
            validation: (Rule) => Rule.unique(),
        }),
    ],
    preview: {
        select: {
            title: 'title',
            isActive: 'isActive'
        },
        prepare(selection) {
            const { title, isActive } = selection
            return {
                title: title || 'Beneficio',
                subtitle: isActive ? 'Activo' : 'Inactivo'
            }
        }
    }
})
