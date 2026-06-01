import { defineField, defineType } from 'sanity'
import { Megaphone } from 'lucide-react'

export const promoPopup = defineType({
  name: 'promoPopup',
  title: 'Popup Promocional',
  type: 'document',
  icon: Megaphone,
  fields: [
    defineField({
      name: 'isActive',
      title: 'Activar Popup',
      type: 'boolean',
      description: 'Activa o desactiva el popup promocional en toda la web.',
      initialValue: true,
    }),
    defineField({
      name: 'delaySeconds',
      title: 'Tiempo de espera (Segundos)',
      type: 'number',
      description: 'Tiempo que tarda en aparecer la etiqueta después de cargar la página.',
      initialValue: 5,
      validation: Rule => Rule.min(0).max(60),
    }),
    defineField({
      name: 'badgeText',
      title: 'Texto de la Etiqueta (Badge)',
      type: 'string',
      description: 'Texto vertical que aparece a un costado (Ej: 10% OFF)',
      initialValue: '10% OFF',
    }),
    defineField({
      name: 'image',
      title: 'Imagen del Popup',
      type: 'image',
      options: { hotspot: true },
      description: 'Imagen que se mostrará en el lado izquierdo del popup.',
    }),
    defineField({
      name: 'brandText',
      title: 'Texto de Marca',
      type: 'string',
      description: 'Ej: TELAS REAL',
      initialValue: 'TELAS REAL',
    }),
    defineField({
      name: 'subtitle1',
      title: 'Subtítulo Superior',
      type: 'string',
      description: 'Ej: Regístrate ahora y recibe',
      initialValue: 'Regístrate ahora y recibe',
    }),
    defineField({
      name: 'title',
      title: 'Título Principal',
      type: 'string',
      description: 'Ej: 10% de descuento',
      initialValue: '10% de descuento',
    }),
    defineField({
      name: 'subtitle2',
      title: 'Subtítulo Inferior',
      type: 'string',
      description: 'Ej: en tu primera compra',
      initialValue: 'en tu primera compra',
    }),
  ],
  preview: {
    select: {
      isActive: 'isActive',
      badgeText: 'badgeText',
    },
    prepare({ isActive, badgeText }) {
      return {
        title: 'Popup Promocional',
        subtitle: `${isActive ? '🟢 Activo' : '🔴 Inactivo'} | ${badgeText}`,
      }
    },
  },
})
