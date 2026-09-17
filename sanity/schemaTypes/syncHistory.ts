import { defineField, defineType } from 'sanity'
import { History } from 'lucide-react'

export const syncHistory = defineType({
  name: 'syncHistory',
  title: 'Historial de Sincronización y Auditoría',
  type: 'document',
  icon: History,
  fields: [
    defineField({
      name: 'fecha',
      title: 'Fecha y Hora del Evento',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'cliente',
      title: 'Cliente Mayorista',
      type: 'reference',
      to: [{ type: 'clienteMayorista' }],
    }),
    defineField({
      name: 'clienteNombre',
      title: 'Nombre / Razón Social',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'mes',
      title: 'Mes Registrado',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'anio',
      title: 'Año',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'origen',
      title: 'Origen del Cambio',
      type: 'string',
      options: {
        list: [
          { title: 'Sanity Studio (Manual)', value: 'SANITY_STUDIO' },
          { title: 'Google Sheets (Webhook Sync)', value: 'GOOGLE_SHEETS' },
          { title: 'Importación Excel Local', value: 'EXCEL_IMPORT' },
          { title: 'API / Webhook Externo', value: 'API_SYNC' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'usuario',
      title: 'Usuario o Sistema',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'campoModificado',
      title: 'Campo Modificado',
      type: 'string',
      initialValue: 'kgCumplido',
      readOnly: true,
    }),
    defineField({
      name: 'valorAnterior',
      title: 'Valor Anterior',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'valorNuevo',
      title: 'Valor Nuevo',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'estado',
      title: 'Estado del Evento',
      type: 'string',
      options: {
        list: [
          { title: 'Exitoso', value: 'EXITOSO' },
          { title: 'Conflicto Registrado', value: 'CONFLICTO_REGISTRADO' },
          { title: 'Sobrescrito', value: 'SOBRESCRITO' },
          { title: 'Error', value: 'ERROR' },
        ],
      },
      initialValue: 'EXITOSO',
      readOnly: true,
    }),
    defineField({
      name: 'detalle',
      title: 'Detalle o Diagnóstico',
      type: 'text',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Fecha Más Reciente',
      name: 'fechaDesc',
      by: [{ field: 'fecha', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      cliente: 'clienteNombre',
      mes: 'mes',
      anio: 'anio',
      origen: 'origen',
      valorNuevo: 'valorNuevo',
      estado: 'estado',
      fecha: 'fecha',
    },
    prepare({ cliente, mes, anio, origen, valorNuevo, estado, fecha }) {
      const formattedDate = fecha ? new Date(fecha).toLocaleString('es-CO') : ''
      return {
        title: `${cliente || 'Cliente'} • ${mes || ''} ${anio || ''} (${valorNuevo || '0'} KG)`,
        subtitle: `[${origen}] ${estado} • ${formattedDate}`,
        media: History,
      }
    },
  },
})
