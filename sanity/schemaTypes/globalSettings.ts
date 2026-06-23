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
            name: 'whatsappMessage',
            title: 'Mensaje de WhatsApp',
            type: 'string',
            description: 'Mensaje predeterminado que aparecerá escrito al hacer clic en el botón flotante',
        }),
        defineField({
            name: 'supportEmail',
            title: 'Correo de Soporte',
            type: 'string',
        }),
    ],
})
