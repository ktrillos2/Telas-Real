
import { defineField, defineType } from 'sanity'

export const usage = defineType({
    name: 'usage',
    title: 'Usos',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Título del Uso',
            type: 'string',
            validation: (Rule) => Rule.required(),
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
})
