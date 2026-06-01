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
      name: 'title',
      title: 'Título Principal',
      type: 'string',
      description: 'Ej: 10% de descuento en tu primera compra',
      initialValue: '10% de descuento en tu primera compra',
    }),
    defineField({
      name: 'description',
      title: 'Descripción (Opcional)',
      type: 'text',
      description: 'Texto adicional informativo o condiciones.',
      initialValue: 'Ingresa el cupón BIENVENIDA al momento de pagar para obtener tu descuento.',
    }),
    defineField({
      name: 'buttonText',
      title: 'Texto del Botón',
      type: 'string',
      description: 'Ej: Entendido, Aprovechar promoción, etc.',
      initialValue: 'Entendido',
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
