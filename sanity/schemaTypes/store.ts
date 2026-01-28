import { defineField, defineType } from 'sanity'

export const store = defineType({
    name: 'store',
    title: 'Tienda (Punto de Atención)',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Nombre de la Tienda',
            type: 'string',
        }),
        defineField({
            name: 'address',
            title: 'Dirección',
            type: 'string',
        }),
        defineField({
            name: 'phone',
            title: 'Teléfono',
            type: 'string',
        }),
        defineField({
            name: 'hours',
            title: 'Horario',
            type: 'string',
        }),
        defineField({
            name: 'mapUrl',
            title: 'URL del Mapa (Embed)',
            type: 'string',
            description: 'URL para el iframe de Google Maps',
        }),
    ],
})
