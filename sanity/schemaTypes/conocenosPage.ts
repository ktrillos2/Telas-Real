import { defineField, defineType } from 'sanity'

export const conocenosPage = defineType({
  name: 'conocenosPage',
  title: 'Página Conócenos',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Sección Hero',
      type: 'object',
      fields: [
        { name: 'title', title: 'Título', type: 'string' },
        { name: 'subtitle', title: 'Subtítulo', type: 'string' },
        { name: 'image', title: 'Imagen de Fondo', type: 'image', options: { hotspot: true } },
      ]
    }),
    defineField({
      name: 'mainContent',
      title: 'Contenido Principal',
      type: 'object',
      fields: [
        { name: 'title', title: 'Título', type: 'string' },
        { name: 'description', title: 'Descripción', type: 'array', of: [{ type: 'block' }] },
        { name: 'bannerImage', title: 'Imagen de Banner (Tiendas)', type: 'image', options: { hotspot: true } },
      ]
    }),
    defineField({
      name: 'mission',
      title: 'Sección Misión',
      type: 'object',
      fields: [
        { name: 'subtitle', title: 'Subtítulo (ej. 01 / Compromiso)', type: 'string' },
        { name: 'title', title: 'Título', type: 'string' },
        { name: 'highlightedText', title: 'Texto Resaltado (Azul)', type: 'string' },
        { name: 'quote', title: 'Frase/Cita', type: 'string' },
        { name: 'description', title: 'Descripción', type: 'text' },
        { name: 'image', title: 'Imagen', type: 'image', options: { hotspot: true } },
      ]
    }),
    defineField({
      name: 'vision',
      title: 'Sección Visión',
      type: 'object',
      fields: [
        { name: 'subtitle', title: 'Subtítulo (ej. 02 / Horizonte)', type: 'string' },
        { name: 'title', title: 'Título', type: 'string' },
        { name: 'highlightedText', title: 'Texto Resaltado (Azul)', type: 'string' },
        { name: 'quote', title: 'Frase/Cita', type: 'string' },
        { name: 'description', title: 'Descripción', type: 'text' },
        { name: 'image', title: 'Imagen', type: 'image', options: { hotspot: true } },
      ]
    }),
    defineField({
      name: 'timeline',
      title: 'Trayectoria (Timeline)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'year', title: 'Año', type: 'string' },
            { name: 'title', title: 'Título', type: 'string' },
            { name: 'description', title: 'Descripción', type: 'text' },
            { name: 'image', title: 'Imagen del Hito', type: 'image', options: { hotspot: true } },
          ]
        }
      ]
    }),
  ],
  preview: {
    select: {
      title: 'hero.title',
    },
    prepare({ title }) {
      return {
        title: title || 'Página Conócenos',
        subtitle: 'Editor de contenido principal'
      }
    }
  }
})
