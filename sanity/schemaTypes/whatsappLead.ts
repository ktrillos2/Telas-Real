import { defineField, defineType } from 'sanity'
import { MessageCircle } from 'lucide-react'

/**
 * Cada vez que alguien abre WhatsApp desde la web queda un registro con el código de origen que va
 * en el mensaje (ej. WEB-7KQ2M). Así se sabe qué conversaciones y ventas vienen del sitio.
 */
export const whatsappLead = defineType({
  name: 'whatsappLead',
  title: 'Contactos WhatsApp desde la web',
  type: 'document',
  icon: MessageCircle,
  fields: [
    defineField({ name: 'code', title: 'Código de origen', type: 'string', readOnly: true, description: 'Aparece al final del mensaje de WhatsApp del cliente.' }),
    defineField({
      name: 'source',
      title: 'Botón',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: 'Botón flotante', value: 'floating' },
          { title: 'Ficha de producto', value: 'product' },
          { title: 'Comprar por WhatsApp (carrito)', value: 'cart' },
          { title: 'Otro', value: 'other' },
        ],
      },
    }),
    defineField({ name: 'page', title: 'Página', type: 'string', readOnly: true }),
    defineField({ name: 'productName', title: 'Producto', type: 'string', readOnly: true }),
    defineField({ name: 'total', title: 'Valor del carrito', type: 'number', readOnly: true }),
    defineField({ name: 'order', title: 'Pedido creado', type: 'reference', to: [{ type: 'order' }], weak: true, readOnly: true }),
    defineField({
      name: 'converted',
      title: '¿Compró?',
      type: 'boolean',
      initialValue: false,
      description: 'Márcalo cuando la conversación termine en venta (para medir ventas que vienen de la web).',
    }),
    defineField({ name: 'saleValue', title: 'Valor de la venta', type: 'number', hidden: ({ document }) => !document?.converted }),
    defineField({ name: 'notes', title: 'Notas', type: 'text', rows: 2 }),
  ],
  orderings: [{ title: 'Más recientes', name: 'createdDesc', by: [{ field: '_createdAt', direction: 'desc' }] }],
  preview: {
    select: { code: 'code', source: 'source', productName: 'productName', total: 'total', converted: 'converted', createdAt: '_createdAt' },
    prepare({ code, source, productName, total, converted, createdAt }) {
      const labels: Record<string, string> = { floating: 'Botón flotante', product: 'Producto', cart: 'Carrito', other: 'Otro' }
      const date = createdAt ? new Date(createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : ''
      return {
        title: `${converted ? '✅ ' : ''}${code || 'Sin código'} · ${labels[source] || source || ''}`,
        subtitle: [date, productName, total ? `$${Number(total).toLocaleString('es-CO')}` : ''].filter(Boolean).join(' · '),
      }
    },
  },
})
