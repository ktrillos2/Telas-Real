import { defineField, defineType } from 'sanity'
import { ColorStringInput } from '../components/ColorStringInput'
import { FONT_OPTIONS, EFFECT_OPTIONS } from '../../lib/text-styles'

/** Campos reutilizables de diseño (color, tipografía, efecto) para la cinta y los popups. */
export const colorField = (name: string, title: string, extra: Record<string, any> = {}) =>
  defineField({
    name,
    title,
    type: 'string',
    components: { input: ColorStringInput },
    validation: (r) =>
      r.custom((v) => (!v || /^#[0-9a-fA-F]{6}$/.test(String(v)) ? true : 'Usa un color tipo #5B9BAF')),
    ...extra,
  })

export const fontField = (name: string, title: string, extra: Record<string, any> = {}) =>
  defineField({
    name,
    title,
    type: 'string',
    options: { list: FONT_OPTIONS.map((f) => ({ title: f.title, value: f.value })) },
    initialValue: 'default',
    ...extra,
  })

export const effectField = (name: string, title: string, extra: Record<string, any> = {}) =>
  defineField({
    name,
    title,
    type: 'string',
    options: { list: EFFECT_OPTIONS.map((f) => ({ title: f.title, value: f.value })), layout: 'radio', direction: 'horizontal' },
    initialValue: 'none',
    ...extra,
  })

/** Un trozo de texto con su propio estilo: permite combinar varios colores en un mismo mensaje. */
export const textSegment = defineType({
  name: 'textSegment',
  title: 'Trozo de texto',
  type: 'object',
  fields: [
    defineField({ name: 'text', title: 'Texto', type: 'string', validation: (r) => r.required() }),
    colorField('color', 'Color del texto'),
    defineField({ name: 'bold', title: 'Negrita', type: 'boolean', initialValue: false }),
    defineField({ name: 'italic', title: 'Cursiva', type: 'boolean', initialValue: false }),
    fontField('font', 'Tipografía (opcional)'),
    effectField('effect', 'Efecto'),
    colorField('effectColor', 'Color del brillo / resaltado', {
      description: 'Para Neón es el color del brillo; para Resaltado, el color de fondo.',
      hidden: ({ parent }: any) => !parent?.effect || parent?.effect === 'none' || parent?.effect === 'shadow',
    }),
  ],
  preview: {
    select: { title: 'text', color: 'color', effect: 'effect' },
    prepare: ({ title, color, effect }) => ({
      title: title || '(vacío)',
      subtitle: [color, effect && effect !== 'none' ? effect : ''].filter(Boolean).join(' · '),
    }),
  },
})

/** Mensaje de la cinta con varios estilos (ej. "🎉 Black Days" en neón + "hasta 30% OFF" en amarillo). */
export const tickerMessage = defineType({
  name: 'tickerMessage',
  title: 'Mensaje con estilos',
  type: 'object',
  fields: [
    defineField({
      name: 'segments',
      title: 'Partes del mensaje',
      type: 'array',
      of: [{ type: 'textSegment' }],
      description: 'Agrega varias partes para combinar colores, tipografías o neón en un mismo mensaje.',
      validation: (r) => r.min(1),
    }),
    defineField({ name: 'link', title: 'Enlace al hacer clic (opcional)', type: 'string', description: 'Ej: /tienda?sort=sale' }),
  ],
  preview: {
    select: { segments: 'segments' },
    prepare: ({ segments }) => ({
      title: (segments || []).map((s: any) => s?.text || '').join(' ') || 'Mensaje con estilos',
      subtitle: 'Mensaje con estilos',
    }),
  },
})
