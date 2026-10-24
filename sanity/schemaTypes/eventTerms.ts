import { defineArrayMember, defineField, defineType } from 'sanity'
import { ScrollText } from 'lucide-react'

/**
 * Términos y condiciones de eventos y concursos. Cada documento es una página pública en
 * /terminos-eventos/<slug>, editable desde "Promociones y Eventos → Términos de Eventos".
 */
export const eventTerms = defineType({
    name: 'eventTerms',
    title: 'Términos de Eventos',
    type: 'document',
    icon: ScrollText,
    fields: [
        defineField({
            name: 'title',
            title: 'Nombre del evento',
            type: 'string',
            description: 'Título de la página (ej. "I Gran Concurso de Disfraces Telas Real").',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Dirección de la página',
            type: 'slug',
            description: 'La página queda en telasreal.com/terminos-eventos/<esto>. Pulsa "Generate" para crearla desde el nombre. Si la cambias, el enlace anterior deja de funcionar.',
            options: { source: 'title', maxLength: 96 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'isActive',
            title: 'Publicada en la web',
            type: 'boolean',
            description: 'Desactívalo para ocultar la página sin borrarla.',
            initialValue: true,
        }),
        defineField({
            name: 'intro',
            title: 'Descripción corta',
            type: 'text',
            rows: 2,
            description: 'Aparece bajo el título y en Google.',
        }),
        defineField({
            name: 'lastUpdated',
            title: 'Texto de vigencia / actualización',
            type: 'string',
            description: 'Ej. "Octubre 2026".',
        }),
        defineField({
            name: 'sections',
            title: 'Secciones',
            type: 'array',
            description: 'Cada sección es un punto numerado (Organizador, Vigencia, Mecánica...). Arrástralas para cambiar el orden.',
            of: [
                defineArrayMember({
                    name: 'termsSection',
                    title: 'Sección',
                    type: 'object',
                    fields: [
                        defineField({ name: 'title', title: 'Título', type: 'string', validation: (Rule) => Rule.required() }),
                        defineField({
                            name: 'content',
                            title: 'Contenido',
                            type: 'array',
                            of: [
                                defineArrayMember({
                                    type: 'block',
                                    styles: [{ title: 'Normal', value: 'normal' }],
                                    lists: [
                                        { title: 'Viñetas', value: 'bullet' },
                                        { title: 'Numerada', value: 'number' },
                                    ],
                                    marks: {
                                        decorators: [
                                            { title: 'Negrita', value: 'strong' },
                                            { title: 'Cursiva', value: 'em' },
                                        ],
                                    },
                                }),
                            ],
                        }),
                    ],
                    preview: {
                        select: { title: 'title' },
                    },
                }),
            ],
        }),
    ],
    preview: {
        select: { title: 'title', slug: 'slug.current', isActive: 'isActive' },
        prepare({ title, slug, isActive }) {
            return {
                title: title || 'Sin nombre',
                subtitle: `${isActive === false ? '⏸ Oculta' : '✅ Publicada'} — /terminos-eventos/${slug || ''}`,
            }
        },
    },
})
