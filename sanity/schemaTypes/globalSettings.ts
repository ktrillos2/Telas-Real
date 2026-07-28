import { defineField, defineType } from 'sanity'

export const maxGlobalSettings = defineType({
    name: 'globalSettings',
    title: 'Configuración Global del Sitio',
    type: 'document',
    fields: [

        defineField({
            name: 'supportEmail',
            title: 'Correo de Soporte',
            type: 'string',
        }),
    ],
})
