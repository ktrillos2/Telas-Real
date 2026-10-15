import { defineField, defineType } from 'sanity'
import { Star, MessageSquare } from 'lucide-react'

export const productReview = defineType({
  name: 'productReview',
  title: 'Reseñas de Productos',
  type: 'document',
  icon: MessageSquare,
  fields: [
    defineField({
      name: 'product',
      title: 'Producto Asociado',
      type: 'reference',
      to: [{ type: 'product' }],
      description: 'Producto al que pertenece esta reseña (opcional si se asocia por slug)',
    }),
    defineField({
      name: 'productSlug',
      title: 'Slug del Producto',
      type: 'string',
      description: 'Slug de la URL del producto (ej: tela-brush-piel-de-durazno-colombia)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'productTitle',
      title: 'Nombre del Producto',
      type: 'string',
      description: 'Nombre del producto al momento de dejar la reseña',
    }),
    defineField({
      name: 'productFamilySlug',
      title: 'Slug de Familia Unificada',
      type: 'string',
      description: 'Para telas con múltiples colores (ej: brush, satin), permite compartir reseñas en toda la familia',
    }),
    defineField({
      name: 'colorVariantName',
      title: 'Variante de Color',
      type: 'string',
      description: 'Color seleccionado por el cliente (ej: Azul Rey, Palo de Rosa)',
    }),
    defineField({
      name: 'author',
      title: 'Nombre del Cliente',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'email',
      title: 'Correo Electrónico',
      type: 'string',
      description: 'Uso interno para verificación de compra (no se publica)',
    }),
    defineField({
      name: 'rating',
      title: 'Calificación (1 a 5 estrellas)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
      initialValue: 5,
    }),
    defineField({
      name: 'title',
      title: 'Título / Resumen de la Reseña',
      type: 'string',
    }),
    defineField({
      name: 'comment',
      title: 'Comentario / Experiencia del Cliente',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().min(5),
    }),
    defineField({
      name: 'images',
      title: 'Fotos Adjuntas por el Cliente',
      description: 'Fotografías del producto o prendas confeccionadas',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Descripción / Alt',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'videos',
      title: 'Videos Adjuntos por el Cliente',
      description: 'Videos en Sanity CDN mostrando la textura, caída o confección',
      type: 'array',
      of: [
        {
          type: 'file',
          options: {
            accept: 'video/*',
          },
          fields: [
            {
              name: 'title',
              type: 'string',
              title: 'Título del video',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'isApproved',
      title: 'Visible en la Tienda (Aprobada)',
      type: 'boolean',
      description: 'Activo por defecto para que las reseñas aparezcan automáticamente. Desactívalo para moderar.',
      initialValue: true,
    }),
    defineField({
      name: 'verifiedPurchase',
      title: 'Compra Verificada',
      type: 'boolean',
      description: 'Indica si el cliente realizó una compra confirmada de este producto',
      initialValue: false,
    }),
    defineField({
      name: 'createdAt',
      title: 'Fecha de Publicación',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'author',
      rating: 'rating',
      productTitle: 'productTitle',
      media: 'images.0.asset',
      isApproved: 'isApproved',
    },
    prepare({ title, rating, productTitle, media, isApproved }) {
      const stars = '★'.repeat(rating || 5)
      const approvedStatus = isApproved === false ? ' [Oculta]' : ''
      return {
        title: `${title || 'Cliente'} (${stars})${approvedStatus}`,
        subtitle: productTitle || 'Reseña de producto',
        media: media || Star,
      }
    },
  },
})
