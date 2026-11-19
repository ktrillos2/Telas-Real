import { defineArrayMember, defineField, defineType } from 'sanity'
import { SlidersHorizontal } from 'lucide-react'

const menuLink = defineArrayMember({
  type: 'object',
  name: 'menuLink',
  fields: [
    defineField({ name: 'label', title: 'Texto', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'url', title: 'Enlace', type: 'string', description: 'Ruta de la web (ej. /preguntas-frecuentes) o enlace completo.', validation: (R) => R.required() }),
    defineField({ name: 'highlight', title: 'Destacado', type: 'boolean', initialValue: false }),
  ],
  preview: { select: { title: 'label', subtitle: 'url', h: 'highlight' }, prepare: ({ title, subtitle, h }) => ({ title: `${h ? '⭐ ' : ''}${title}`, subtitle }) },
})

/** Ajustes que antes estaban fijos en el código (ver lib/store-settings.ts). */
export const storeSettings = defineType({
  name: 'storeSettings',
  title: 'Ajustes de la tienda',
  type: 'document',
  icon: SlidersHorizontal,
  groups: [
    { name: 'pagos', title: 'Pagos', default: true },
    { name: 'menus', title: 'Menús' },
    { name: 'ia', title: 'Asesor IA' },
    { name: 'web', title: 'Secciones y botones' },
  ],
  fields: [
    defineField({ name: 'codMin', title: 'Contraentrega: compra mínima ($)', type: 'number', group: 'pagos', initialValue: 60000 }),
    defineField({ name: 'codMax', title: 'Contraentrega: compra máxima ($)', type: 'number', group: 'pagos', initialValue: 100000 }),
    defineField({
      name: 'interestLinks',
      title: 'Menú "De tu interés"',
      type: 'array',
      group: 'menus',
      of: [menuLink],
      description: 'Arrastra para ordenar. "Destacado" lo muestra resaltado (como Preguntas frecuentes).',
    }),
    defineField({ name: 'aboutLinks', title: 'Menú "Sobre Nosotros"', type: 'array', group: 'menus', of: [menuLink] }),
    defineField({ name: 'aiEnabled', title: 'Mostrar el botón "Asesor IA"', type: 'boolean', group: 'ia', initialValue: true }),
    defineField({ name: 'aiWelcome', title: 'Saludo del asesor', type: 'text', rows: 3, group: 'ia' }),
    defineField({ name: 'aiSuggestions', title: 'Sugerencias para tocar', type: 'array', of: [{ type: 'string' }], group: 'ia' }),
    defineField({
      name: 'showCommercialCollections',
      title: 'Mostrar colecciones comerciales en el inicio',
      type: 'boolean',
      group: 'web',
      initialValue: false,
      description: 'Ej. "Telas para Navidad". Las colecciones se editan en Promociones y Eventos → Colecciones Comerciales.',
    }),
    defineField({ name: 'showWhatsappCheckout', title: 'Botón "Comprar por WhatsApp" en el carrito', type: 'boolean', group: 'web', initialValue: true }),
    defineField({ name: 'showAddedBubble', title: 'Globito "¡Agregado al carrito!"', type: 'boolean', group: 'web', initialValue: true }),
  ],
  preview: { prepare: () => ({ title: 'Ajustes de la tienda' }) },
})
