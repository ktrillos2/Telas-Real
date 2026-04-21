import { defineType, defineArrayMember, defineField } from 'sanity'

export const blockContent = defineType({
    title: 'Block Content',
    name: 'blockContent',
    type: 'array',
    of: [
        defineArrayMember({
            title: 'Block',
            type: 'block',
            styles: [
                { title: 'Normal', value: 'normal' },
                { title: 'H1', value: 'h1' },
                { title: 'H2', value: 'h2' },
                { title: 'H3', value: 'h3' },
                { title: 'H4', value: 'h4' },
                { title: 'Quote', value: 'blockquote' },
            ],
            lists: [
                { title: 'Bullet', value: 'bullet' },
                { title: 'Numbered', value: 'number' }
            ],
            marks: {
                decorators: [
                    { title: 'Strong', value: 'strong' },
                    { title: 'Emphasis', value: 'em' },
                ],
                annotations: [
                    {
                        title: 'URL',
                        name: 'link',
                        type: 'object',
                        fields: [
                            {
                                title: 'URL',
                                name: 'href',
                                type: 'url',
                            },
                        ],
                    },
                ],
            },
        }),
        defineArrayMember({
            type: 'image',
            options: { hotspot: true },
            fields: [
                defineField({
                    name: 'alt',
                    type: 'string',
                    title: 'Texto alternativo (Alt)',
                    description: 'Importante para SEO y accesibilidad.',
                }),
                defineField({
                    name: 'alignment',
                    type: 'string',
                    title: 'Alineación',
                    description: '¿Cómo quieres posicionar la imagen?',
                    options: {
                        list: [
                            { title: '◀ Izquierda', value: 'left' },
                            { title: '■ Centro', value: 'center' },
                            { title: '▶ Derecha', value: 'right' },
                        ],
                        layout: 'radio',
                    },
                    initialValue: 'center',
                }),
                defineField({
                    name: 'size',
                    type: 'string',
                    title: 'Tamaño',
                    description: '¿Qué tan grande quieres ver la imagen?',
                    options: {
                        list: [
                            { title: 'Pequeño (30%)', value: 'small' },
                            { title: 'Mediano (60%)', value: 'medium' },
                            { title: 'Grande (80%)', value: 'large' },
                            { title: 'Completo (100%)', value: 'full' },
                        ],
                        layout: 'radio',
                    },
                    initialValue: 'full',
                }),
                defineField({
                    name: 'aspectRatio',
                    type: 'string',
                    title: 'Relación de aspecto',
                    description: 'Forma de la imagen al recortarla',
                    options: {
                        list: [
                            { title: '□ Cuadrada (1:1)', value: 'square' },
                            { title: '▬ Panorámica (16:9)', value: 'wide' },
                            { title: '▭ Clásica (4:3)', value: 'classic' },
                            { title: '↕ Original (sin recorte)', value: 'auto' },
                        ],
                        layout: 'radio',
                    },
                    initialValue: 'auto',
                }),
            ]
        }),
        defineArrayMember({
            title: 'Video',
            name: 'video',
            type: 'object',
            fields: [
                defineField({
                    name: 'url',
                    type: 'url',
                    title: 'Video URL',
                    description: 'E.g. YouTube or Vimeo URL',
                })
            ]
        }),
        defineArrayMember({
            title: 'Product Reference',
            name: 'productReference',
            type: 'reference',
            to: [{ type: 'product' }],
            options: {
                disableNew: true, // We usually don't create products directly from the blog text
            },
            preview: {
                select: {
                    title: 'title',
                    media: 'mainImage',
                    price: 'price',
                },
                prepare(selection) {
                    const { title, media, price } = selection
                    return {
                        title: title || 'Unnamed product',
                        subtitle: price ? `$${price}` : 'No price',
                        media: media,
                    }
                }
            }
        })
    ],
})
