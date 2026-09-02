import { defineField, defineType } from 'sanity'
import { HardDrive } from 'lucide-react'

export const wholesaleDriveSettings = defineType({
  name: 'wholesaleDriveSettings',
  title: 'Configuración Conexión Google Drive',
  type: 'document',
  icon: HardDrive,
  fields: [
    defineField({
      name: 'webhookUrl',
      title: 'URL de la Aplicación Web (Google Apps Script)',
      type: 'url',
      description: 'Pega aquí la URL que obtuviste al implementar tu Google Sheet como aplicación web.',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'spreadsheetName',
      title: 'Nombre de la Hoja de Drive',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'autoSyncEnabled',
      title: '¿Sincronizar automáticamente al abrir el CRM?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'lastSyncAt',
      title: 'Última Sincronización',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'lastSyncStats',
      title: 'Resultado de la Última Sincronización',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'detectedSheets',
      title: 'Pestañas Detectadas en el Excel de Drive',
      type: 'array',
      of: [{ type: 'string' }],
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      webhookUrl: 'webhookUrl',
      spreadsheetName: 'spreadsheetName',
      lastSyncAt: 'lastSyncAt',
    },
    prepare({ webhookUrl, spreadsheetName, lastSyncAt }) {
      return {
        title: spreadsheetName ? `Drive: ${spreadsheetName}` : 'Conexión Google Drive',
        subtitle: webhookUrl ? (lastSyncAt ? `Última sinc: ${new Date(lastSyncAt).toLocaleString()}` : '🟢 Conectado') : '🔴 Sin configurar',
        media: HardDrive,
      }
    },
  },
})
