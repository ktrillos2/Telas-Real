import { defineField, defineType } from 'sanity'

export const personalizadoHero = defineType({
    name: 'personalizadoHero',
    title: 'Hero Personalizado',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título Principal',
            type: 'string',
            initialValue: 'Servicio de Sublimación Profesional'
        }),
        defineField({
            name: 'description',
            title: 'Descripción',
            type: 'text',
            rows: 3,
            initialValue: 'Dale vida a tus diseños con nuestro servicio de sublimación de alta calidad. Ideal para proyectos textiles que requieren colores vibrantes, excelente definición y durabilidad.'
        }),
        defineField({
            name: 'buttonText',
            title: 'Texto del Botón',
            type: 'string',
            initialValue: 'Cotizar Proyecto'
        }),
        defineField({
            name: 'buttonLink',
            title: 'Enlace del Botón',
            type: 'string',
            initialValue: '/personalizado#cotizar'
        })
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'description'
        },
        prepare(selection) {
            return {
                title: 'Hero Personalizado',
                subtitle: selection.subtitle
            }
        }
    }
})
