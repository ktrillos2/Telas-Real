import { defineArrayMember, defineField, defineType } from 'sanity'
import { LayoutGrid } from 'lucide-react'
import { colorField } from './styleFields'

/**
 * Colecciones comerciales del inicio (ej. "Telas para Navidad").
 *
 * Cada tarjeta apunta a una variante de un producto que ya existe, sin duplicar fichas ni
 * inventario: un DISEÑO de una tela sublimada (abre la ficha con ese diseño elegido) o un
 * COLOR de una tela unicolor (abre la ficha con ese color elegido).
 */

const THEMES = [
    { title: 'Navidad (verde y rojo)', value: 'navidad' },
    { title: 'Amor y amistad (vino y rosado)', value: 'amor' },
    { title: 'Telas Real (azul de la marca)', value: 'marca' },
    { title: 'Oscuro elegante (negro y dorado)', value: 'oscuro' },
]

const BANNER_STYLES = [
    { title: 'Muestrario: abanico de retazos de tus telas (Navidad)', value: 'muestrario' },
    { title: 'Guirnalda: banderines de tus telas sobre luces (Navidad)', value: 'guirnalda' },
    { title: 'Regalo: envuelto en cuadro búfalo con cinta y etiqueta (Navidad)', value: 'regalo' },
    { title: 'Imagen de fondo: sube tu foto y el texto va encima', value: 'imagen' },
    { title: 'Solo colores: degradado del tema o colores propios', value: 'clasico' },
]

export const commercialCollection = defineType({
    name: 'commercialCollection',
    title: 'Colecciones Comerciales',
    type: 'document',
    icon: LayoutGrid,
    groups: [
        { name: 'general', title: 'General', default: true },
        { name: 'banner', title: 'Banner' },
        { name: 'home', title: 'Tarjetas del inicio' },
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
            name: 'showBanner',
            title: 'Mostrar el banner',
            type: 'boolean',
            group: 'banner',
            initialValue: true,
            description: 'Apágalo para ocultar el banner (en el inicio y en la página de la colección). Las tarjetas se siguen mostrando.',
        }),
        defineField({
            name: 'useBackgroundPhoto',
            title: 'Usar mi foto de fondo',
            type: 'boolean',
            group: 'banner',
            initialValue: false,
            description: 'Encendido: el banner usa la foto de "Imagen de fondo" (abajo) con el texto encima, sin importar el estilo elegido. Apagado: se usa el estilo.',
        }),
        defineField({
            name: 'bannerStyle',
            title: 'Estilo del banner',
            type: 'string',
            group: 'banner',
            options: { list: BANNER_STYLES, layout: 'radio' },
            initialValue: 'muestrario',
            description:
                'Muestrario, Guirnalda y Regalo están pensados para Navidad y usan sus propios colores (los "Colores propios" de abajo aplican a Imagen de fondo y Solo colores). Vacío = Muestrario, o Imagen de fondo si hay una subida.',
        }),
        defineField({
            name: 'bannerEyebrow',
            title: 'Texto pequeño sobre el título (opcional)',
            type: 'string',
            group: 'banner',
            description: 'Ej. "Colección de temporada · 2026". Vacío = "Colección de temporada · <año>" (en Regalo: "Para ti · de Telas Real"). Escribe "-" para ocultarlo.',
        }),
        defineField({
            name: 'bannerDesigns',
            title: 'Telas del banner (opcional)',
            type: 'array',
            group: 'banner',
            of: [defineArrayMember({ type: 'reference', to: [{ type: 'imagenSublimada' }], weak: true })],
            validation: (Rule) => Rule.max(13).unique(),
            description:
                'Diseños que salen en el abanico (Muestrario, usa los 9 primeros) o en los banderines (Guirnalda, hasta 13). Vacío = los primeros diseños de "Tarjetas". Mejor diseños sin el código impreso en el centro. Cada retazo lleva a su tela si el diseño está en las tarjetas.',
        }),
        // Marcas internas de las cargas automáticas (sin ellas el admin las muestra como "campo desconocido")
        defineField({ name: 'homeCardsSeed', type: 'string', hidden: true, readOnly: true }),
        defineField({ name: 'bannerStyleSeed', type: 'string', hidden: true, readOnly: true }),
        defineField({
            name: 'showDecor',
            title: 'Decoración dibujada (ya no se usa)',
            type: 'boolean',
            group: 'banner',
            hidden: true,
        }),
        defineField({
            name: 'bannerBackground',
            title: 'Imagen de fondo del banner (con textos encima)',
            type: 'image',
            group: 'banner',
            options: { hotspot: true },
            description: 'Sube aquí tu foto (ej. ramas y adornos de Navidad) y enciende "Usar mi foto de fondo", o elige el estilo "Imagen de fondo". Encima se muestran el título, el subtítulo y el botón. Recomendado 1600 × 300 px.',
        }),
        defineField({
            name: 'bannerOverlay',
            title: 'Oscurecer la imagen de fondo (%)',
            type: 'number',
            group: 'banner',
            initialValue: 35,
            validation: (Rule) => Rule.min(0).max(90),
            description: 'Para que los textos se lean bien sobre la foto. 0 = sin oscurecer.',
            hidden: ({ document }: any) => !document?.bannerBackground,
        }),
        colorField('bgColor', 'Color de fondo (propio)', { group: 'banner', description: 'Reemplaza los colores del tema. Vacío = colores del tema.' }),
        colorField('bgColor2', 'Segundo color de fondo (degradado, opcional)', { group: 'banner' }),
        colorField('titleColor', 'Color del título', { group: 'banner' }),
        colorField('accentColor', 'Color de la palabra destacada', { group: 'banner' }),
        colorField('textColor', 'Color del subtítulo', { group: 'banner' }),
        colorField('buttonBg', 'Color del botón', { group: 'banner' }),
        colorField('buttonTextColor', 'Color del texto del botón', { group: 'banner' }),
        defineField({
            name: 'buttonLink',
            title: 'Enlace del botón y del banner (opcional)',
            type: 'string',
            group: 'banner',
            description: 'Ej. /tienda/... o /producto/... Vacío = la página de la colección con todas sus variantes.',
        }),
        defineField({
            name: 'bannerImage',
            title: 'Imagen del banner completa (escritorio)',
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
            name: 'homeCards',
            title: 'Tarjetas del inicio (fotos de ambiente)',
            type: 'array',
            group: 'home',
            description: 'Opcional. Si agregas tarjetas aquí, el inicio muestra estas fotos de ambiente (ej. "Tela para pijamas navideñas") en vez de las variantes; las variantes siguen en la página de la colección. Arrástralas para ordenarlas.',
            of: [
                defineArrayMember({
                    name: 'homeCard',
                    title: 'Tarjeta del inicio',
                    type: 'object',
                    fields: [
                        defineField({
                            name: 'image',
                            title: 'Foto (cuadrada)',
                            type: 'image',
                            options: { hotspot: true },
                            description: 'Recomendado 900 × 900 px. Puede traer el círculo con el diseño incluido.',
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({ name: 'title', title: 'Título', type: 'string', description: 'Ej. "Tela para pijamas navideñas".', validation: (Rule) => Rule.required() }),
                        defineField({ name: 'subtitle', title: 'Texto pequeño', type: 'string', description: 'Ej. "Diseños variados · Brush Sublimado".' }),
                        defineField({
                            name: 'link',
                            title: 'Enlace (opcional)',
                            type: 'string',
                            description: 'A dónde lleva al hacer clic, ej. /producto/... o /tienda/... Vacío = la página de la colección con todas sus variantes.',
                        }),
                    ],
                    preview: {
                        select: { title: 'title', subtitle: 'subtitle', media: 'image' },
                    },
                }),
            ],
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
