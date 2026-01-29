import { defineField, defineType } from 'sanity'

export const personalizadoCTA = defineType({
    name: 'personalizadoCTA',
    title: 'Llamada a la Acción (CTA)',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título Principal',
            type: 'string',
            initialValue: 'Imprime, crea y transforma tus ideas'
        }),
        defineField({
            name: 'description',
            title: 'Descripción',
            type: 'text',
            rows: 3,
            initialValue: 'Nuestro proceso garantiza un acabado profesional para tus diseños únicos.'
        }),
        defineField({
            name: 'buttonText',
            title: 'Texto del Botón',
            type: 'string',
            initialValue: 'Conocer más y Cotizar'
        }),
        defineField({
            name: 'buttonLink',
            title: 'Enlace del Botón',
            description: 'Opcional. Si se deja vacío, usará el enlace de WhatsApp por defecto.',
            type: 'string'
        })
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'description'
        },
        prepare(selection) {
            return {
                title: selection.title,
                subtitle: 'CTA Final'
            }
        }
    }
})
