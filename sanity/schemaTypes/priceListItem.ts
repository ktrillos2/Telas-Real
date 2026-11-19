import { defineField, defineType } from 'sanity'
import { Scale } from 'lucide-react'

/** Una referencia de la lista de precios por volumen (ej. "BRUSH COLORES PREMIUM"). */
export const priceListItem = defineType({
  name: 'priceListItem',
  title: 'Precio por volumen',
  type: 'document',
  icon: Scale,
  groups: [
    { name: 'precios', title: 'Precios', default: true },
    { name: 'productos', title: 'Productos que la usan' },
  ],
  fields: [
    defineField({ name: 'isActive', title: 'Activa', type: 'boolean', group: 'precios', initialValue: true }),
    defineField({ name: 'name', title: 'Nombre (como en la lista)', type: 'string', group: 'precios', validation: (R) => R.required() }),
    defineField({ name: 'reference', title: 'Referencia', type: 'string', group: 'precios' }),
    defineField({
      name: 'tipo',
      title: 'Tipo',
      type: 'string',
      group: 'precios',
      options: {
        list: [
          { title: 'Colores (lisa)', value: 'colores' },
          { title: 'Sublimado', value: 'sublimado' },
          { title: 'Blanco', value: 'blanco' },
          { title: 'Crudo', value: 'crudo' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'colores',
    }),
    defineField({
      name: 'yieldPerKg',
      title: 'Rendimiento (metros por kilo)',
      type: 'number',
      group: 'precios',
      description: 'Con esto se convierten los metros del carrito a kilos para saber qué precio aplica.',
    }),
    defineField({ name: 'retail', title: 'Precio por metro · Retail (por cortes)', type: 'number', group: 'precios', description: 'Precio web normal.' }),
    defineField({ name: 'medio', title: 'Precio por metro · Medio', type: 'number', group: 'precios', description: 'Desde los kilos del nivel Medio (25 kg por defecto). Vacío = sin descuento en este nivel.' }),
    defineField({ name: 'alto', title: 'Precio por metro · Alto', type: 'number', group: 'precios', description: 'Desde 80 kg por defecto.' }),
    defineField({ name: 'premium', title: 'Precio por metro · Premium', type: 'number', group: 'precios', description: 'Desde 400 kg por defecto.' }),
    defineField({
      name: 'matchTerms',
      title: 'Palabras para reconocer los productos',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'productos',
      description:
        'El producto usa esta fila si su nombre tiene TODAS estas palabras. "a|b" = cualquiera de las dos (ej. "durazno|brush"); "!palabra" = que NO la tenga (ej. "!standard"). Los sublimados solo usan filas de tipo Sublimado.',
    }),
    defineField({
      name: 'extraProducts',
      title: 'Productos asignados a mano',
      type: 'array',
      group: 'productos',
      of: [{ type: 'reference', to: [{ type: 'product' }], options: { disableNew: true } }],
      description: 'Para productos cuyo nombre no coincide con las palabras de arriba.',
    }),
    defineField({
      name: 'excludedProducts',
      title: 'Productos excluidos',
      type: 'array',
      group: 'productos',
      of: [{ type: 'reference', to: [{ type: 'product' }], options: { disableNew: true } }],
    }),
    defineField({ name: 'sheetStatus', title: 'Estado en la hoja', type: 'string', group: 'precios', readOnly: true }),
    defineField({ name: 'notes', title: 'Observaciones', type: 'text', rows: 2, group: 'precios' }),
  ],
  orderings: [{ title: 'Nombre', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { name: 'name', tipo: 'tipo', retail: 'retail', premium: 'premium', isActive: 'isActive', y: 'yieldPerKg' },
    prepare({ name, tipo, retail, premium, isActive, y }) {
      const cop = (n?: number) => (n ? `$${Number(n).toLocaleString('es-CO')}` : '—')
      return {
        title: `${isActive === false ? '⏸ ' : ''}${name} · ${tipo || ''}`,
        subtitle: `${cop(retail)} → ${cop(premium)} /m · ${y ? `${y} m/kg` : 'sin rendimiento'}`,
      }
    },
  },
})

/** Rangos de kilos y reglas generales de los precios por volumen. */
export const volumePricingSettings = defineType({
  name: 'volumePricingSettings',
  title: 'Configuración de precios por volumen',
  type: 'document',
  icon: Scale,
  fields: [
    defineField({ name: 'enabled', title: 'Descuentos por volumen activos', type: 'boolean', initialValue: true }),
    defineField({ name: 'medioFromKg', title: 'Nivel Medio desde (kg)', type: 'number', initialValue: 25 }),
    defineField({ name: 'altoFromKg', title: 'Nivel Alto desde (kg)', type: 'number', initialValue: 80 }),
    defineField({ name: 'premiumFromKg', title: 'Nivel Premium desde (kg)', type: 'number', initialValue: 400 }),
    defineField({
      name: 'stackWithPromotions',
      title: 'Sumar con las promociones por metros / kg',
      type: 'boolean',
      initialValue: false,
      description: 'Apagado: si hay una promoción activa, se aplica solo el descuento más alto de los dos.',
    }),
    defineField({ name: 'showTableOnProduct', title: 'Mostrar la tabla de precios por volumen en la ficha', type: 'boolean', initialValue: true }),
    defineField({ name: 'label_retail', title: 'Nombre del nivel Retail', type: 'string', initialValue: 'Por cortes' }),
    defineField({ name: 'label_medio', title: 'Nombre del nivel Medio', type: 'string', initialValue: 'Mayorista' }),
    defineField({ name: 'label_alto', title: 'Nombre del nivel Alto', type: 'string', initialValue: 'Alto volumen' }),
    defineField({ name: 'label_premium', title: 'Nombre del nivel Premium', type: 'string', initialValue: 'Premium' }),
  ],
  preview: { prepare: () => ({ title: 'Configuración de precios por volumen' }) },
})
