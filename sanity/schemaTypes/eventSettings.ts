import { defineField, defineType } from 'sanity'

export const eventSettings = defineType({
    name: 'eventSettings',
    title: 'Eventos y Descuentos',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título Interno',
            type: 'string',
            initialValue: 'Evento de Descuento',
            description: 'Nombre para identificar este evento en el panel de Sanity.'
        }),
        defineField({
            name: 'isActive',
            title: 'Activar Evento por KG',
            type: 'boolean',
            initialValue: false,
            description: 'Si está activo, se aplicará un descuento adicional al finalizar la compra basado en el peso estimado (kg).'
        }),
        defineField({
            name: 'applicableCategories',
            title: 'Categorías a Aplicar',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            description: 'Selecciona las categorías de producto a las que se aplicará el evento. Si se deja vacío junto con los productos, se aplicará a TODOS.'
        }),
        defineField({
            name: 'applicableProducts',
            title: 'Productos a Aplicar',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'product' }] }],
            description: 'Selecciona productos individuales a los que se aplicará el evento. Si se deja vacío junto con las categorías, se aplicará a TODOS.'
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
            description: 'Texto que aparecerá como una etiqueta (ej: "DÍA DEL PADRE"). Si se deja vacío, no aparecerá ninguna etiqueta.'
        })
    ],
    preview: {
        select: {
            title: 'title',
            isActive: 'isActive'
        },
        prepare(selection) {
            const { title, isActive } = selection
            return {
                title: title || 'Evento de Descuento',
                subtitle: isActive ? 'Activo' : 'Inactivo'
            }
        }
    }
})
