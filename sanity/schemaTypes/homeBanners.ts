import { defineField, defineType } from 'sanity'

export const homeBanners = defineType({
    name: 'homeBanners',
    title: 'Banners Principales',
    type: 'document',
    fields: [
        defineField({
            name: 'banners',
            title: 'Banners',
            type: 'array',
            of: [
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Texto Alternativo',
                            type: 'string'
                        }),
                        defineField({
                            name: 'mobileImage',
                            title: 'Imagen para Móvil (Opcional)',
                            type: 'image',
                            options: { hotspot: true }
                        }),
                        defineField({
                            name: 'videoFile',
                            title: 'Archivo de Video (Opcional)',
                            type: 'file',
                            options: { accept: 'video/*' },
                            description: 'Sube un video corto (MP4 recomendado). Si se incluye, reemplazará a la imagen principal del banner.'
                        }),
                        defineField({
                            name: 'selectedProducts',
                            title: 'Telas / Productos Específicos (Opcional)',
                            type: 'array',
                            of: [{ type: 'reference', to: [{ type: 'product' }] }],
                            description: 'Selecciona las telas o productos que aparecerán en la tienda al hacer clic en este banner.'
                        }),
                        defineField({
                            name: 'selectedCategories',
                            title: 'Categorías (Opcional)',
                            type: 'array',
                            of: [{ type: 'reference', to: [{ type: 'category' }] }],
                            description: 'Selecciona una o más categorías de telas para filtrar la página de destino del banner.'
                        }),
                        defineField({
                            name: 'collectionTitle',
                            title: 'Título de la Página de Destino (Opcional)',
                            type: 'string',
                            description: 'Título personalizado (H1) que se mostrará en la página de la tienda al ingresar desde este banner (ej: "Siembra la Idea: Colección Especial", "Telas para Vestidos").'
                        }),
                        defineField({
                            name: 'link',
                            title: 'Enlace de Redirección Manual (Opcional)',
                            type: 'string',
                            description: 'URL o ruta fija (ej: /tienda o https://...). NOTA: Si seleccionas Telas o Categorías arriba, este enlace manual NO se usará y el banner redirigirá automáticamente a la página con los productos seleccionados.'
                        })
                    ]
                }
            ]
        })
    ],
    preview: {
        select: {
            banners: 'banners'
        },
        prepare(selection) {
            const { banners } = selection
            return {
                title: 'Banners Principales',
                subtitle: `${banners ? banners.length : 0} banners activos`,
                media: banners && banners[0]
            }
        }
    }
})
