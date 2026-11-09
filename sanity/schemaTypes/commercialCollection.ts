import { defineArrayMember, defineField, defineType } from 'sanity'
import { LayoutGrid } from 'lucide-react'

/**
 * Colecciones comerciales del inicio (ej. "Telas para Navidad", "Telas para Halloween").
 *
 * Cada tarjeta apunta a una variante de un producto que ya existe, sin duplicar fichas ni
 * inventario: un DISEÑO de una tela sublimada (abre la ficha con ese diseño elegido) o un
 * COLOR de una tela unicolor (abre la ficha con ese color elegido).
 */

const THEMES = [
    { title: 'Navidad (verde y rojo)', value: 'navidad' },
    { title: 'Halloween (negro y naranja)', value: 'halloween' },
    { title: 'Amor y amistad (vino y rosado)', value: 'amor' },
    { title: 'Telas Real (azul de la marca)', value: 'marca' },
    { title: 'Oscuro elegante (negro y dorado)', value: 'oscuro' },
]

export const commercialCollection = defineType({
    name: 'commercialCollection',
    title: 'Colecciones Comerciales',
    type: 'document',
    icon: LayoutGrid,
    groups: [
        { name: 'general', title: 'General', default: true },
        { name: 'banner', title: 'Banner' },
        { name: 'items', title: 'Tarjetas' },
    ],
    fields: [
        defineField({
            name: 'title',
            title: 'Nombre de la colección',
            type: 'string',
            group: 'general',
            description: 'Título del banner (ej. "Telas para Navidad").',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'highlight',
            title: 'Palabra destacada',
            type: 'string',
            group: 'general',
            description: 'Parte del título que va en el color de acento (ej. "Navidad"). Opcional.',
        }),
        defineField({
            name: 'subtitle',
            title: 'Subtítulo',
            type: 'string',
            group: 'general',
            description: 'Ej. "Diseños perfectos para pijamas, sacos, decoración y manualidades".',
        }),
        defineField({
            name: 'slug',
            title: 'Dirección de la página',
            type: 'slug',
            group: 'general',
            description: 'La colección completa queda en telasreal.com/colecciones/<esto>. Pulsa "Generate".',
            options: { source: 'title', maxLength: 80 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'isActive',
            title: 'Activa',
            type: 'boolean',
            group: 'general',
            description: 'Desactívala para ocultarla de la web sin borrarla.',
            initialValue: true,
        }),
        defineField({
            name: 'showOnHome',
            title: 'Mostrar en el inicio',
            type: 'boolean',
            group: 'general',
            description: 'Aparece como primera sección del inicio, debajo del banner principal.',
            initialValue: true,
        }),
        defineField({
            name: 'homeOrder',
            title: 'Orden en el inicio',
            type: 'number',
            group: 'general',
            description: 'Número menor = más arriba (si hay varias colecciones activas).',
            initialValue: 1,
        }),
        defineField({
            name: 'startDate',
            title: 'Mostrar desde (opcional)',
            type: 'datetime',
            group: 'general',
            description: 'Vacío = desde ya. Útil para programar la temporada.',
        }),
        defineField({
            name: 'endDate',
            title: 'Mostrar hasta (opcional)',
            type: 'datetime',
            group: 'general',
            description: 'Vacío = sin fecha de fin.',
            validation: (Rule) =>
                Rule.custom((end, context) => {
                    const start = (context.document as any)?.startDate
                    return end && start && new Date(end as string) <= new Date(start) ? 'Debe ser posterior a "Mostrar desde".' : true
                }),
        }),
        defineField({
            name: 'theme',
            title: 'Colores del banner',
            type: 'string',
            group: 'banner',
            options: { list: THEMES, layout: 'radio' },
            initialValue: 'navidad',
            description: 'Se usan cuando no hay imagen de banner, y para el botón y los detalles de la sección.',
        }),
        defineField({
            name: 'bannerImage',
            title: 'Imagen del banner (escritorio)',
            type: 'image',
            group: 'banner',
            options: { hotspot: true },
            description: 'Diseño de marketing (recomendado 1600 × 220 px). Si no se sube, se arma un banner con el título y los colores elegidos. El título se sigue leyendo para Google.',
            fields: [{ name: 'alt', type: 'string', title: 'Texto alternativo' }],
        }),
        defineField({
            name: 'bannerImageMobile',
            title: 'Imagen del banner (celular, opcional)',
            type: 'image',
            group: 'banner',
            options: { hotspot: true },
            description: 'Recomendado 800 × 300 px. Si no se sube, en celular se usa la de escritorio.',
        }),
        defineField({
            name: 'buttonText',
            title: 'Texto del botón',
            type: 'string',
            group: 'banner',
            initialValue: 'Ver todas las telas',
        }),
        defineField({
            name: 'items',
            title: 'Tarjetas',
            type: 'array',
            group: 'items',
            description: 'Cada tarjeta lleva a la ficha original con la variante ya elegida. Arrástralas para ordenarlas. También se pueden agregar varios diseños a la vez desde la herramienta "Diseños Sublimados".',
            of: [
                defineArrayMember({
                    name: 'collectionItem',
                    title: 'Tarjeta',
                    type: 'object',
                    fields: [
                        defineField({
                            name: 'kind',
                            title: 'Tipo',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Diseño de una tela sublimada', value: 'design' },
                                    { title: 'Color de una tela', value: 'color' },
                                ],
                                layout: 'radio',
                                direction: 'horizontal',
                            },
                            initialValue: 'design',
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                            name: 'product',
                            title: 'Tela',
                            type: 'reference',
                            to: [{ type: 'product' }],
                            weak: true,
                            description: 'Diseño: la tela sublimada (ej. Brush Sublimado). Color: el color exacto (ej. "Satín Rojo").',
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                            name: 'design',
                            title: 'Diseño',
                            type: 'reference',
                            to: [{ type: 'imagenSublimada' }],
                            weak: true,
                            hidden: ({ parent }) => parent?.kind !== 'design',
                            validation: (Rule) =>
                                Rule.custom((value, context) =>
                                    (context.parent as any)?.kind === 'design' && !value ? 'Elige el diseño.' : true
                                ),
                        }),
                        defineField({
                            name: 'title',
                            title: 'Título de la tarjeta',
                            type: 'string',
                            description: 'Ej. "Tela para pijamas navideñas". Vacío = nombre del diseño o del producto.',
                        }),
                        defineField({
                            name: 'subtitle',
                            title: 'Texto pequeño',
                            type: 'string',
                            description: 'Ej. "Diseños variados · Brush Sublimado". Vacío = nombre de la tela.',
                        }),
                        defineField({
                            name: 'image',
                            title: 'Foto de la tarjeta (opcional)',
                            type: 'image',
                            options: { hotspot: true },
                            description: 'Foto de ambiente (pijama, cojín, mantel…). Vacío = imagen del diseño o del producto. Si hay foto, el diseño se muestra en el círculo.',
                        }),
                    ],
                    preview: {
                        select: {
                            title: 'title',
                            designName: 'design.name',
                            productTitle: 'product.title',
                            kind: 'kind',
                            media: 'image',
                            designImage: 'design.image',
                            productImage: 'product.images.0',
                        },
                        prepare({ title, designName, productTitle, kind, media, designImage, productImage }) {
                            return {
                                title: title || designName || productTitle || 'Tarjeta',
                                subtitle: `${kind === 'color' ? 'Color' : 'Diseño'} · ${productTitle || 'sin tela'}`,
                                media: media || designImage || productImage,
                            }
                        },
                    },
                }),
            ],
        }),
    ],
    preview: {
        select: { title: 'title', isActive: 'isActive', showOnHome: 'showOnHome', items: 'items', media: 'bannerImage' },
        prepare({ title, isActive, showOnHome, items, media }) {
            const status = isActive === false ? '⏸ Inactiva' : showOnHome === false ? '✅ Activa (solo su página)' : '✅ En el inicio'
            return { title: title || 'Colección', subtitle: `${status} · ${(items || []).length} tarjetas`, media }
        },
    },
})
