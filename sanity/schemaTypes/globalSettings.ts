import { defineField, defineType } from 'sanity'

export const maxGlobalSettings = defineType({
    name: 'globalSettings',
    title: 'Configuraciones Generales',
    type: 'document',
    fields: [
        defineField({
            name: 'whatsappNumber',
            title: 'Número de WhatsApp',
            type: 'string',
            description: 'Número para el botón flotante y contacto (ej: +573001234567)',
        }),
        defineField({
            name: 'supportEmail',
            title: 'Correo de Soporte',
            type: 'string',
        }),
    ],
})
