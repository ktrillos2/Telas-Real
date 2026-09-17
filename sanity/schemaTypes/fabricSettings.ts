import { defineField, defineType } from 'sanity'
import { Settings2 } from 'lucide-react'

export const fabricSettings = defineType({
  name: 'fabricSettings',
  title: 'Configuración Textil Global (ERP)',
  type: 'document',
  icon: Settings2,
  fields: [
    defineField({
      name: 'rendimientoKgMetro',
      title: 'Rendimiento Textil (Metros por 1 KG)',
      type: 'number',
      description: 'Factor global de conversión de tela (ejemplo: 1 KG = 3.3 metros). Todas las cuotas se calculan con este valor centralizado.',
      initialValue: 3.3,
      validation: (Rule) => Rule.required().positive().precision(2),
    }),
    defineField({
      name: 'precioKgDefault',
      title: 'Precio Base Sugerido por KG (COP)',
      type: 'number',
      description: 'Precio de referencia por KG cuando un cliente no tiene tarifa especial definida (ej: $37.950 COP).',
      initialValue: 37950,
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'precioMtDefault',
      title: 'Precio Base Sugerido por MT (COP)',
      type: 'number',
      description: 'Precio de referencia por MT (ej: $11.500 COP).',
      initialValue: 11500,
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'descripcion',
      title: 'Notas Operativas y Ficha Técnica',
      type: 'text',
      description: 'Documentación interna sobre gramajes, rendimientos por lote o acuerdos generales de confección.',
      initialValue: 'Todas las telas en catálogo mayorista operan bajo el estándar de 3.3 metros por cada kilogramo (ancho estándar 1.50m - 1.60m).',
    }),
    defineField({
      name: 'updatedAt',
      title: 'Última Modificación',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      rendimiento: 'rendimientoKgMetro',
      precioKg: 'precioKgDefault',
    },
    prepare({ rendimiento, precioKg }) {
      return {
        title: `Rendimiento: 1 KG = ${rendimiento || 3.3} Metros`,
        subtitle: `Precio Base: $${(precioKg || 37950).toLocaleString()} COP/KG`,
        media: Settings2,
      }
    },
  },
})
