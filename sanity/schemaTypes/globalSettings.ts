import { defineField, defineType } from 'sanity'
import { MessageCircle } from 'lucide-react'

export const maxGlobalSettings = defineType({
    name: 'globalSettings',
    title: 'Configuración Global del Sitio',
    type: 'document',
    fields: [
        defineField({
            name: 'whatsappNumber',
            title: 'Número de WhatsApp de Contacto / Ventas',
            type: 'string',
            description: 'Número oficial de WhatsApp utilizado en todos los botones de la web (ej: +57 315 902 1516 o 573159021516).',
            initialValue: '+57 315 902 1516'
        }),
        defineField({
            name: 'whatsappMessage',
            title: 'Mensaje Predeterminado de WhatsApp',
            type: 'string',
            description: 'Mensaje predeterminado para asesoría general.',
            initialValue: '¡Hola! Vengo desde su página web y me gustaría recibir asesoría para encontrar la tela ideal para mis diseños.'
        }),
        defineField({
            name: 'supportEmail',
            title: 'Correo de Soporte',
            type: 'string',
            description: 'Correo principal de atención y soporte para los clientes',
            initialValue: 'tiendavirtual@telasreal.com'
        }),
        defineField({
            name: 'reminderEmail',
            title: 'Correo de Recordatorios de Despacho (Notificaciones Internas)',
            type: 'string',
            description: 'Correo electrónico donde se recibirán las alertas automáticas a las 10:00 AM y 3:00 PM (Lunes a Viernes no festivos) con las horas y minutos restantes para despachar pedidos.',
            initialValue: 'tiendavirtual@telasreal.com'
        }),
        defineField({
            name: 'enableDispatchReminders',
            title: 'Activar Recordatorios de Despacho',
            type: 'boolean',
            description: 'Activar o desactivar el envío automático de notificaciones internas de despacho (10:00 AM y 3:00 PM COT, únicamente de lunes a viernes, excluyendo fines de semana y festivos en Colombia).',
            initialValue: true
        }),
        defineField({
            name: 'dispatchCutoffHour',
            title: 'Hora de Corte de Despacho Mismo Día (Formato 24h)',
            type: 'number',
            description: 'Hora límite para despachos el mismo día (por defecto: 13 = 1:00 PM).',
            initialValue: 13
        }),
    ],
})
