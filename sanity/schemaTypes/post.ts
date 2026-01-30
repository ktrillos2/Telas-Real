import { defineField, defineType } from 'sanity'

export const post = defineType({
    name: 'post',
    title: 'Blog Post',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'author',
            title: 'Author',
            type: 'string', // Simple string for now as requested in plan
        }),
        defineField({
            name: 'mainImage',
            title: 'Main image',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string', // Simple string for now
        }),
        defineField({
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            rows: 3
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
        }),
        defineField({
            name: 'content',
            title: 'Body',
            type: 'blockContent', // We might need to define blockContent or just use array of blocks
        }),
        defineField({
            name: 'ctaTitle',
            title: 'CTA Title',
            type: 'string',
            description: 'Optional: Title for the Call to Action box',
        }),
        defineField({
            name: 'ctaDescription',
            title: 'CTA Description',
            type: 'text',
            rows: 2,
            description: 'Optional: Description text for the CTA',
        }),
        defineField({
            name: 'ctaButtonText',
            title: 'CTA Button Text',
            type: 'string',
            description: 'Optional: Text for the CTA button',
        }),
        defineField({
            name: 'ctaUrl',
            title: 'CTA URL',
            type: 'url',
            description: 'Optional: Where the CTA button should link to',
        }),
    ],
})
