import { defineField, defineType } from 'sanity'

export const eventSettings = defineType({
    name: 'eventSettings',
    title: 'Eventos y Descuentos',
    type: 'document',
    fields: [
        defineField({
            name: 'isActive',
            title: 'Activar Evento por KG',
            type: 'boolean',
            initialValue: false,
            description: 'Si está activo, se aplicará un descuento adicional al finalizar la compra basado en el peso estimado (kg).'
        }),
        defineField({
            name: 'discountNoPromo',
            title: 'Descuento por KG (Sin Promoción)',
            type: 'number',
            description: 'Monto a descontar por cada KG en referencias que NO tienen precio de oferta (ej: 1000).'
        }),
        defineField({
            name: 'discountPromo',
            title: 'Descuento por KG (Con Promoción)',
            type: 'number',
            description: 'Monto a descontar por cada KG en referencias que YA tienen precio de oferta (ej: 3000).'
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
        defineField({
            name: 'eventTag',
            title: 'Etiqueta del Evento (Tag)',
            type: 'string',
            description: 'Texto que aparecerá como una etiqueta (ej: "DÍA DEL PADRE") en los productos mientras el evento esté activo.'
        })
    ],
})
