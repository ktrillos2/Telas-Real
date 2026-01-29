import { defineField, defineType } from 'sanity'

export const homeConocenos = defineType({
    name: 'homeConocenos',
    title: 'Sección Conócenos',
    type: 'document',
    fields: [
        defineField({
            name: 'image',
            title: 'Imagen de Fondo',
            type: 'image',
            options: { hotspot: true },
            fields: [
                defineField({
                    name: 'alt',
                    title: 'Texto Alternativo',
                    type: 'string',
                    initialValue: 'Tiendas Telas Real'
                })
            ]
        }),
        defineField({
            name: 'title',
            title: 'Título Principal',
            type: 'string',
            initialValue: 'Conócenos'
        }),
        defineField({
            name: 'content',
            title: 'Contenido',
            type: 'array',
            of: [{
                type: 'block',
                styles: [{ title: 'Normal', value: 'normal' }],
                lists: [],
                marks: {
                    decorators: [
                        { title: 'Strong', value: 'strong' },
                    ]
                }
            }]
        }),
        defineField({
            name: 'buttonText',
            title: 'Texto del Botón',
            type: 'string',
            initialValue: 'Conoce nuestras tiendas'
        }),
        defineField({
            name: 'buttonLink',
            title: 'Enlace del Botón',
            type: 'string',
            initialValue: '/puntos-atencion'
        })
    ],
    preview: {
        select: {
            title: 'title',
            media: 'image'
        },
        prepare(selection) {
            return {
                title: 'Sección Conócenos',
                subtitle: selection.title,
                media: selection.media
            }
        }
    }
})
