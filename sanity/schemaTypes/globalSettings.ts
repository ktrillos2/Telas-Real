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
    ],
})
