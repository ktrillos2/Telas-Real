import { defineField, defineType } from 'sanity'
import { ShoppingCart } from 'lucide-react'

/**
 * Recuperación automática de carritos abandonados (cron cada hora: /api/cron/abandoned-cart).
 * Dos mensajes: el primero ~1 hora después y el segundo ~24 horas después, con un cupón pequeño.
 */
export const abandonedCartSettings = defineType({
  name: 'abandonedCartSettings',
  title: 'Recuperación de carritos',
  type: 'document',
  icon: ShoppingCart,
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'messages', title: 'Mensajes' },
  ],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Envío automático activado',
      type: 'boolean',
      group: 'general',
      initialValue: true,
      description: 'Apágalo para pausar todos los recordatorios.',
    }),
    defineField({
      name: 'channel',
      title: 'Canal',
      type: 'string',
      group: 'general',
      initialValue: 'whatsapp_sms',
      options: {
        list: [
          { title: 'WhatsApp (si falla o no tiene WhatsApp, SMS)', value: 'whatsapp_sms' },
          { title: 'Solo WhatsApp', value: 'whatsapp' },
          { title: 'Solo SMS (LabsMobile)', value: 'sms' },
        ],
        layout: 'radio',
      },
    }),
    defineField({ name: 'sendEmail', title: 'Enviar también correo', type: 'boolean', group: 'general', initialValue: true }),
    defineField({
      name: 'firstDelayHours',
      title: '1er mensaje: horas después de abandonar',
      type: 'number',
      group: 'general',
      initialValue: 1,
      validation: (Rule) => Rule.min(0.5).max(12),
    }),
    defineField({
      name: 'secondDelayHours',
      title: '2º mensaje: horas después de abandonar',
      type: 'number',
      group: 'general',
      initialValue: 24,
      validation: (Rule) => Rule.min(6).max(72),
    }),
    defineField({
      name: 'incentivePercent',
      title: 'Incentivo: % de descuento',
      type: 'number',
      group: 'general',
      initialValue: 5,
      description: 'Se crea un cupón único por cliente (ej. VUELVE-10450). 0 = sin incentivo.',
      validation: (Rule) => Rule.min(0).max(30),
    }),
    defineField({
      name: 'incentiveOn',
      title: '¿En qué mensaje va el incentivo?',
      type: 'string',
      group: 'general',
      initialValue: 'second',
      options: {
        list: [
          { title: 'Solo en el 2º mensaje (recomendado)', value: 'second' },
          { title: 'En los dos mensajes', value: 'both' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'couponValidHours',
      title: 'Vigencia del cupón (horas)',
      type: 'number',
      group: 'general',
      initialValue: 48,
      validation: (Rule) => Rule.min(6).max(168),
    }),
    defineField({
      name: 'message1',
      title: 'Mensaje 1 (WhatsApp / SMS)',
      type: 'text',
      rows: 5,
      group: 'messages',
      description: 'Variables: {nombre} {productos} {total} {link} {cupon} {descuento}. En SMS se envía una versión corta automáticamente.',
      initialValue:
        'Hola {nombre} 👋 Vimos que dejaste tus telas en el carrito de Telas Real:\n{productos}\n\nTotal: {total}. Las guardamos para ti, termina tu compra aquí 👉 {link}',
    }),
    defineField({
      name: 'message2',
      title: 'Mensaje 2 (WhatsApp / SMS)',
      type: 'text',
      rows: 5,
      group: 'messages',
      description: 'Variables: {nombre} {productos} {total} {link} {cupon} {descuento}.',
      initialValue:
        'Hola {nombre}, tus telas siguen esperándote 🧵 Para que te animes, te regalamos {descuento} de descuento con el cupón *{cupon}* (válido por poco tiempo). Ya está aplicado en este enlace 👉 {link}',
    }),
  ],
  preview: {
    select: { enabled: 'enabled', pct: 'incentivePercent' },
    prepare({ enabled, pct }) {
      return { title: 'Recuperación de carritos', subtitle: `${enabled === false ? '⏸ Pausada' : '✅ Activa'} · incentivo ${pct ?? 5}%` }
    },
  },
})
