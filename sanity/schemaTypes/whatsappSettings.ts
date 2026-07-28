import { defineField, defineType } from 'sanity'
import { MessageCircle } from 'lucide-react'

export const whatsappSettings = defineType({
    name: 'whatsappSettings',
    title: 'Configuración de WhatsApp',
    type: 'document',
    icon: MessageCircle,
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
    ],
})
