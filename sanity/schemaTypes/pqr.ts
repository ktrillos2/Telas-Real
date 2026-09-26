import { defineType, defineField } from 'sanity'
import { LifeBuoy } from 'lucide-react'

export const pqr = defineType({
  name: 'pqr',
  title: 'PQR (Peticiones, Quejas, Reclamos)',
  type: 'document',
  icon: LifeBuoy,
  fields: [
    defineField({
      name: 'radicado',
      title: 'Número de Radicado / Caso',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'tipo',
      title: 'Tipo de PQRS',
      type: 'string',
      options: {
        list: [
          { title: 'Petición', value: 'peticion' },
          { title: 'Queja', value: 'queja' },
          { title: 'Reclamo', value: 'reclamo' },
          { title: 'Sugerencia', value: 'sugerencia' },
          { title: 'Felicitación', value: 'felicitacion' },
        ],
      },
      readOnly: true,
    }),
    defineField({
      name: 'tienda',
      title: 'Tienda o Canal de Atención',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'apellido',
      title: 'Apellido',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'documento',
      title: 'Número de Documento',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'correo',
      title: 'Correo Electrónico',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'celular',
      title: 'Celular / Teléfono',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'asunto',
      title: 'Asunto de la Solicitud',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'mensaje',
      title: 'Mensaje / Descripción del Reclamo',
      type: 'text',
      readOnly: true,
    }),
    defineField({
      name: 'fechaEnvio',
      title: 'Fecha y Hora de Envío',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'evidencias',
      title: 'Evidencias Adjuntas (Fotos, Videos y Documentos en Sanity CDN)',
      description: 'Archivos multimedia subidos por el cliente alojados permanentemente en Sanity CDN.',
      type: 'array',
      of: [
        {
          type: 'file',
          options: {
            accept: 'image/*,video/*,.pdf',
          },
        },
      ],
    }),
    defineField({
      name: 'evidencia',
      title: 'Evidencia Principal (Histórico)',
      type: 'file',
      options: {
        accept: 'image/*,video/*,.pdf',
      },
    }),
    defineField({
      name: 'estado',
      title: 'Estado de Atención',
      type: 'string',
      options: {
        list: [
          { title: '🟡 Pendiente de Revisión', value: 'pendiente' },
          { title: '🔵 En Proceso / En Gestión', value: 'en_proceso' },
          { title: '🟢 Respondido / Resuelto', value: 'resuelto' },
          { title: '🔴 Cerrado / Rechazado', value: 'cerrado' },
        ],
        layout: 'radio',
      },
      initialValue: 'pendiente',
    }),
    defineField({
      name: 'notasInternas',
      title: 'Notas Internas del Equipo SAC',
      type: 'text',
      description: 'Espacio para comentarios y seguimiento interno del equipo de atención al cliente.',
    }),
  ],
  preview: {
    select: {
      radicado: 'radicado',
      tipo: 'tipo',
      tienda: 'tienda',
      title: 'asunto',
      nombre: 'nombre',
      apellido: 'apellido',
      fecha: 'fechaEnvio',
      estado: 'estado',
    },
    prepare({ radicado, tipo, tienda, title, nombre, apellido, fecha, estado }) {
      const estadoEmoji =
        estado === 'resuelto'
          ? '🟢'
          : estado === 'en_proceso'
          ? '🔵'
          : estado === 'cerrado'
          ? '🔴'
          : '🟡'

      const radicadoLabel = radicado ? `[${radicado}] ` : ''
      const tipoLabel = tipo ? `(${tipo.toUpperCase()}) ` : ''
      const solicitante = [nombre, apellido].filter(Boolean).join(' ') || 'Anónimo'
      const tiendaLabel = tienda ? ` • ${tienda}` : ''

      return {
        title: `${estadoEmoji} ${radicadoLabel}${tipoLabel}${title || 'Sin Asunto'}`,
        subtitle: `${solicitante}${tiendaLabel} • ${fecha || 'Fecha no registrada'}`,
      }
    },
  },
})
