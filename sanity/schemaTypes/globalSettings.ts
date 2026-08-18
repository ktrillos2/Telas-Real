import { defineField, defineType } from 'sanity'
import { Bell, Mail, Clock } from 'lucide-react'

export const maxGlobalSettings = defineType({
    name: 'globalSettings',
    title: 'Configuración Global del Sitio',
    type: 'document',
    fields: [
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
            description: 'Correo electrónico donde se recibirán las alertas automáticas a las 10:00 AM y 3:00 PM con las horas y minutos restantes para despachar pedidos.',
            initialValue: 'tiendavirtual@telasreal.com'
        }),
        defineField({
            name: 'enableDispatchReminders',
            title: 'Activar Recordatorios de Despacho',
            type: 'boolean',
            description: 'Activar o desactivar el envío automático de notificaciones internas de despacho (10:00 AM y 3:00 PM COT).',
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

