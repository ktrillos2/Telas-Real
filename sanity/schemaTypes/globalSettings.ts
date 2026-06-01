import { defineField, defineType } from 'sanity'

export const maxGlobalSettings = defineType({
    name: 'globalSettings',
    title: 'Configuración Global del Sitio',
    type: 'document',
    fields: [
        defineField({
            name: 'whatsappNumber',
            title: 'WhatsApp de Contacto',
            type: 'string',
            description: 'Número para el botón flotante y contacto (ej: +573001234567)',
        }),
        defineField({
            name: 'supportEmail',
            title: 'Correo de Soporte',
            type: 'string',
        }),
        defineField({
            name: 'kgDiscountEvent',
            title: 'Evento: Descuentos por KG',
            type: 'object',
            options: { collapsible: true, collapsed: false },
            fields: [
                {
                    name: 'isActive',
                    title: 'Activar Evento',
                    type: 'boolean',
                    initialValue: false,
                    description: 'Si está activo, se aplicará un descuento adicional al finalizar la compra basado en el peso estimado (kg).'
                },
                {
                    name: 'discountNoPromo',
                    title: 'Descuento por KG (Sin Promoción)',
                    type: 'number',
                    description: 'Monto a descontar por cada KG en referencias que NO tienen precio de oferta (ej: 1000).'
                },
                {
                    name: 'discountPromo',
                    title: 'Descuento por KG (Con Promoción)',
                    type: 'number',
                    description: 'Monto a descontar por cada KG en referencias que YA tienen precio de oferta (ej: 3000).'
                }
            ]
        }),
    ],
})
