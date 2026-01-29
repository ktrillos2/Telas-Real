import { defineField, defineType } from 'sanity'

export const footer = defineType({
    name: 'footer',
    title: 'Pie de Página (Footer)',
    type: 'document',
    fields: [
        defineField({
            name: 'footerLogo',
            title: 'Logo Secundario (Footer)',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'copyright',
            title: 'Texto de Copyright',
            type: 'string',
        }),
        defineField({
            name: 'socials',
            title: 'Redes Sociales',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        defineField({ name: 'platform', type: 'string', title: 'Plataforma' }),
                        defineField({ name: 'url', type: 'url', title: 'Enlace' }),
                    ],
                },
            ],
        }),
        // New Fields
        defineField({
            name: 'contactInfo',
            title: 'Información de Contacto',
            type: 'object',
            fields: [
                defineField({ name: 'phone', title: 'Teléfono', type: 'string' }),
                defineField({ name: 'email', title: 'Email', type: 'string' }),
            ]
        }),
        defineField({
            name: 'column1Links',
            title: 'Enlaces Columna 1',
            type: 'array',
            of: [{
                type: 'object',
                fields: [
                    defineField({ name: 'label', title: 'Etiqueta', type: 'string' }),
                    defineField({ name: 'url', title: 'URL', type: 'string' }),
                ]
            }]
        }),
        defineField({
            name: 'column2Links',
            title: 'Enlaces Columna 2',
            type: 'array',
            of: [{
                type: 'object',
                fields: [
                    defineField({ name: 'label', title: 'Etiqueta', type: 'string' }),
                    defineField({ name: 'url', title: 'URL', type: 'string' }),
                ]
            }]
        }),
        defineField({
            name: 'paymentMethods',
            title: 'Métodos de Pago (Imágenes)',
            type: 'array',
            of: [{ type: 'image', options: { hotspot: true } }]
        })
    ],
})
