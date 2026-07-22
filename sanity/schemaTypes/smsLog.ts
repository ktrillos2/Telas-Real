import { defineField, defineType } from 'sanity'
import { MessageSquare } from 'lucide-react'

export const smsLog = defineType({
    name: 'smsLog',
    title: 'Historial SMS',
    type: 'document',
    icon: MessageSquare,
    fields: [
        defineField({
            name: 'recipientPhone',
            title: 'Número de Teléfono',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'message',
            title: 'Mensaje Enviado',
            type: 'text',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'type',
            title: 'Tipo de Envío',
            type: 'string',
            options: {
                list: [
                    { title: 'Carrito Abandonado (Automático)', value: 'automated_abandoned_cart' },
                    { title: 'Envío Manual', value: 'manual' },
                ],
                layout: 'radio'
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'status',
            title: 'Estado del Envío',
            type: 'string',
            options: {
                list: [
                    { title: 'Enviado con Éxito', value: 'sent' },
                    { title: 'Error al Enviar', value: 'failed' },
                ],
                layout: 'radio'
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'responseCode',
            title: 'Código de Respuesta (LabsMobile)',
            type: 'string',
        }),
        defineField({
            name: 'sentAt',
            title: 'Fecha de Envío',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
        }),
        defineField({
            name: 'relatedOrder',
            title: 'Pedido Relacionado',
            type: 'reference',
            to: [{ type: 'order' }],
            description: 'Aplica solo para carritos abandonados automatizados.',
        }),
    ],
    preview: {
        select: {
            title: 'recipientPhone',
            subtitle: 'type',
            status: 'status',
            date: 'sentAt'
        },
        prepare(selection) {
            const { title, subtitle, status, date } = selection
            const statusLabel = status === 'sent' ? '✅ Enviado' : '❌ Fallido'
            const typeLabel = subtitle === 'manual' ? 'Manual' : 'Automático'
            const formattedDate = date ? new Date(date).toLocaleString('es-CO') : ''
            
            return {
                title: `${title} - ${statusLabel}`,
                subtitle: `${typeLabel} | ${formattedDate}`,
                media: MessageSquare
            }
        }
    }
})
