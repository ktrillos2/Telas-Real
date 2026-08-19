import { defineField, defineType } from 'sanity'
import { Folder } from 'lucide-react'

export const categoriaSublimada = defineType({
  name: 'categoriaSublimada',
  title: 'Categorías de Sublimación',
  type: 'document',
  icon: Folder,
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre de la Categoría',
      type: 'string',
      description: 'Ejemplo: BRUSH SUBLIMADO, SUAVETINA SUBLIMADA, etc.',
      validation: (Rule) => Rule.required().min(2).error('El nombre de la categoría es obligatorio.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción (Opcional)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'isActive',
      title: 'Activa',
      type: 'boolean',
      description: 'Si está desactivada, los diseños de esta categoría no se mostrarán en la tienda.',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Orden de Prioridad',
      type: 'number',
      description: 'Número para ordenar las categorías (menor número aparece primero).',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      active: 'isActive',
    },
    prepare(selection) {
      const { title, subtitle, active } = selection
      return {
        title: title || 'Sin nombre',
        subtitle: `${active !== false ? '✓ Activa' : '✕ Inactiva'} ${subtitle ? `• ${subtitle}` : ''}`,
      }
    },
  },
})
