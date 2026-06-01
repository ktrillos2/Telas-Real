import React from 'react'
import { defineField, defineType } from 'sanity'

export const tone = defineType({
    name: 'tone',
    title: 'Tonos',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Nombre del Tono',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'value',
            title: 'Valor Hex (Color)',
            type: 'string',
            description: 'Código de color (ej. #FF0000)',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
    ],
    preview: {
        select: {
            title: 'title',
            color: 'value',
        },
        prepare(selection: any) {
            const { title, color } = selection;
            return {
                title: title,
                subtitle: color || 'Sin color',
                media: () => React.createElement('div', {
                    style: {
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: color || '#eee',
                        border: '1px solid #ccc'
                    }
                }),
            };
        },
    },
})
