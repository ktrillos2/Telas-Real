import { defineField, defineType } from 'sanity'
import { Tag, Sparkles } from 'lucide-react'

export const eventSettings = defineType({
    name: 'eventSettings',
    title: 'Eventos y Descuentos (Metros / KG)',
    type: 'document',
    icon: Sparkles,
    fields: [
        defineField({
            name: 'title',
            title: 'Título Interno',
            type: 'string',
            initialValue: 'Evento de Descuento Especial',
            description: 'Nombre para identificar este evento en el panel de Sanity.'
        }),
        defineField({
            name: 'isActive',
            title: 'Activar Promoción de Descuento',
            type: 'boolean',
            initialValue: false,
            description: 'Si está activo, se aplicará automáticamente el descuento por volumen al carrito y checkout según la unidad seleccionada (metros o kilogramos).'
        }),
        defineField({
            name: 'discountUnit',
            title: 'Tipo de Unidad para el Descuento',
            type: 'string',
            description: 'Elige si el descuento promocional se calculará por METRO o por KILOGRAMO.',
            options: {
                list: [
                    { title: '📏 Descuento por METRO (Recomendado para venta de telas por metro)', value: 'meter' },
                    { title: '⚖️ Descuento por KILOGRAMO (Basado en peso estimado de la tela)', value: 'kg' },
                ],
                layout: 'radio'
            },
            initialValue: 'meter'
        }),
        defineField({
            name: 'discountNoPromo',
            title: 'Monto de Descuento en Productos Sin Oferta Previa ($)',
            type: 'number',
            description: 'Monto en pesos a descontar por cada METRO o KG (según la unidad elegida) en referencias con precio regular (ej: 1000).'
        }),
        defineField({
            name: 'discountPromo',
            title: 'Monto de Descuento en Productos Con Oferta Previa ($)',
            type: 'number',
            description: 'Monto en pesos a descontar por cada METRO o KG en referencias que ya tienen precio de oferta o liquidación (ej: 3000).'
        }),
        defineField({
            name: 'eventTag',
            title: 'Etiqueta del Evento / Badge (Tag)',
            type: 'string',
            description: 'Texto que aparecerá como etiqueta destacada en los productos y carrito (ej: "PROMO POR METRO", "DÍA DEL PADRE", "OFERTA ESPECIAL").'
        }),
        defineField({
            name: 'applicableCategories',
            title: 'Categorías a Aplicar (Opcional)',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            description: 'Selecciona las categorías de producto a las que se aplicará el descuento. Si se deja vacío junto con los productos, se aplicará a TODOS.'
        }),
        defineField({
            name: 'applicableProducts',
            title: 'Productos Específicos a Aplicar (Opcional)',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'product' }] }],
            description: 'Selecciona productos individuales a los que se aplicará el descuento. Si se deja vacío junto con las categorías, se aplicará a TODOS.'
        }),
        defineField({
            name: 'startDate',
            title: 'Fecha de Inicio',
            type: 'datetime',
            description: 'Fecha y hora exactas en que el evento se activa de forma automática.'
        }),
        defineField({
            name: 'endDate',
            title: 'Fecha de Fin',
            type: 'datetime',
            description: 'Fecha y hora exactas en que el evento termina.'
        }),
    ],
    preview: {
        select: {
            title: 'title',
            isActive: 'isActive',
            discountUnit: 'discountUnit',
            eventTag: 'eventTag'
        },
        prepare(selection) {
            const { title, isActive, discountUnit, eventTag } = selection
            const unitLabel = discountUnit === 'kg' ? '⚖️ Por KG' : '📏 Por Metro'
            return {
                title: title || 'Evento de Descuento',
                subtitle: isActive ? `🟢 Activo (${unitLabel})${eventTag ? ` · Tag: ${eventTag}` : ''}` : `🔴 Inactivo (${unitLabel})`,
                media: Tag
            }
        }
    }
})
