import { defineField, defineType } from 'sanity'
import { StarIcon } from 'lucide-react'

export const review = defineType({
  name: 'review',
  title: 'Reseñas de Google',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre del Autor',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Ubicación / Negocio',
      type: 'string',
      initialValue: 'Telas Real',
    }),
    defineField({
      name: 'rating',
      title: 'Calificación (1-5)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({
      name: 'comment',
      title: 'Comentario',
      type: 'text',
    }),
    defineField({
      name: 'date',
      title: 'Fecha de la Reseña',
      type: 'datetime',
    }),
    defineField({
      name: 'profilePhotoUrl',
      title: 'URL Foto de Perfil',
      type: 'url',
    }),
    defineField({
      name: 'link',
      title: 'Enlace de la Reseña',
      type: 'url',
    }),
    defineField({
      name: 'isVisible',
      title: 'Mostrar en la página',
      type: 'boolean',
      description: 'Desactiva esto si quieres ocultar la reseña en el sitio web.',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'rating',
      media: 'icon'
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: `${subtitle} estrellas`,
        media: StarIcon
      }
    }
  }
})
