import { defineField, defineType } from 'sanity'

export const storeAvatar = defineType({
  name: 'storeAvatar',
  title: 'Avatares de la Tienda',
  type: 'document',
  fields: [
    defineField({
      name: 'isActive',
      title: 'Activo en la Tienda',
      type: 'boolean',
      description: 'Si se desactiva, este avatar no se mostrará en el carrusel de la tienda.',
      initialValue: true,
    }),
    defineField({
      name: 'title',
      title: 'Nombre / Título del Avatar',
      type: 'string',
      description: 'Nombre visible debajo del avatar (ej: Deportivo, Lino, Mascotas, etc.)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagen del Avatar',
      type: 'image',
      description: 'Imagen o ilustración del avatar en formato WebP o PNG.',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto Alternativo (Alt)',
          type: 'string',
          description: 'Descripción breve para accesibilidad y SEO.',
        }),
      ],
    }),
    defineField({
      name: 'filterType',
      title: 'Tipo de Filtro',
      type: 'string',
      description: 'Define cómo filtrará los productos este avatar al hacer clic.',
      initialValue: 'usage',
      options: {
        list: [
          { title: 'Por Uso (Uso vinculado en Sanity)', value: 'usage' },
          { title: 'Por Categoría (Categoría vinculada en Sanity)', value: 'category' },
          { title: 'Personalizado / Búsqueda (Texto o palabra clave)', value: 'custom' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'usage',
      title: 'Uso Vinculado',
      type: 'reference',
      to: [{ type: 'usage' }],
      description: 'Selecciona el Uso correspondiente.',
      hidden: ({ parent }) => parent?.filterType && parent.filterType !== 'usage',
    }),
    defineField({
      name: 'category',
      title: 'Categoría Vinculada',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Selecciona la Categoría correspondiente.',
      hidden: ({ parent }) => parent?.filterType && parent.filterType !== 'category',
    }),
    defineField({
      name: 'customFilter',
      title: 'Filtro o Término Personalizado',
      type: 'string',
      description: 'Término de búsqueda o identificador (ej: lino, ojalillo, infantil, casual).',
      hidden: ({ parent }) => parent?.filterType && parent.filterType !== 'custom',
    }),
    defineField({
      name: 'order',
      title: 'Orden de Visualización',
      type: 'number',
      description: 'Posición en el carrusel de izquierda a derecha (1, 2, 3...).',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      filterType: 'filterType',
      usageTitle: 'usage.title',
      categoryName: 'category.name',
      customFilter: 'customFilter',
      order: 'order',
      isActive: 'isActive',
    },
    prepare({ title, media, filterType, usageTitle, categoryName, customFilter, order, isActive }) {
      let target = customFilter || 'Sin configurar'
      if (filterType === 'usage' && usageTitle) target = `Uso: ${usageTitle}`
      if (filterType === 'category' && categoryName) target = `Cat: ${categoryName}`
      const status = isActive === false ? '❌ Inactivo' : '✅ Activo'
      return {
        title: title || 'Sin título',
        subtitle: `#${order ?? 0} | ${status} | ${target}`,
        media,
      }
    },
  },
})
