import { defineField, defineType } from 'sanity'
import { Activity } from 'lucide-react'

export const dailyMetrics = defineType({
  name: 'dailyMetrics',
  title: 'Métricas Diarias',
  type: 'document',
  icon: Activity,
  fields: [
    defineField({
      name: 'date',
      title: 'Fecha',
      type: 'date',
      description: 'Día de la métrica (YYYY-MM-DD)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'addsToCart',
      title: 'Añadidos al Carrito',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'checkoutsStarted',
      title: 'Inicios de Checkout',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'purchases',
      title: 'Compras Finalizadas',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'date',
      adds: 'addsToCart',
      checkouts: 'checkoutsStarted',
      purchases: 'purchases',
    },
    prepare({ title, adds, checkouts, purchases }) {
      return {
        title: `Métricas del ${title}`,
        subtitle: `Añadidos: ${adds} | Checkouts: ${checkouts} | Compras: ${purchases}`,
      }
    },
  },
})
