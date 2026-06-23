import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'eventConfig',
  title: 'Configuración de Eventos',
  type: 'document',
  fields: [
    defineField({
      name: 'isActive',
      title: 'Evento Activo',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'title',
      title: 'Título del Evento',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
    }),
    defineField({
      name: 'formLink',
      title: 'Enlace al Formulario',
      type: 'url',
    }),
    defineField({
      name: 'startDate',
      title: 'Fecha de Inicio',
      type: 'datetime',
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha de Fin',
      type: 'datetime',
    }),
  ],
})
