import { defineType, defineField } from 'sanity'

export const pqr = defineType({
  name: 'pqr',
  title: 'PQR (Peticiones, Quejas, Reclamos)',
  type: 'document',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
    }),
    defineField({
      name: 'apellido',
      title: 'Apellido',
      type: 'string',
    }),
    defineField({
      name: 'documento',
      title: 'Documento',
      type: 'string',
    }),
    defineField({
      name: 'correo',
      title: 'Correo Electrónico',
      type: 'string',
    }),
    defineField({
      name: 'celular',
      title: 'Celular',
      type: 'string',
    }),
    defineField({
      name: 'pais',
      title: 'País',
      type: 'string',
    }),
    defineField({
      name: 'asunto',
      title: 'Asunto',
      type: 'string',
    }),
    defineField({
      name: 'mensaje',
      title: 'Mensaje',
      type: 'text',
    }),
    defineField({
      name: 'fechaEnvio',
      title: 'Fecha y Hora de Envío',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'asunto',
      subtitle: 'nombre',
      date: 'fechaEnvio'
    },
    prepare(selection) {
      const { title, subtitle, date } = selection
      return {
        title: title,
        subtitle: `${subtitle} - ${date ? new Date(date).toLocaleString('es-CO') : ''}`
      }
    }
  }
})
