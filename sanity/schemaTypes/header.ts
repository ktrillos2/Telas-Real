import { defineField, defineType } from 'sanity'
import { colorField, fontField, effectField } from './styleFields'

export const header = defineType({
    name: 'header',
    title: 'Encabezado (Header)',
    type: 'document',
    fieldsets: [
        { name: 'tickerDesign', title: '🎨 Diseño de la cinta (colores, tipografía, neón)', options: { collapsible: true, collapsed: false } },
        { name: 'countdownDesign', title: '⏳ Diseño de la cuenta regresiva (colores, tipografía, neón)', options: { collapsible: true, collapsed: false } },
    ],
    fields: [
        defineField({
            name: 'ticker',
            title: 'Barra de Anuncios (Ticker)',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'Textos simples de la barra superior (usan el estilo general de abajo). Si agregas "Mensajes con estilos", se muestran esos en lugar de estos.',
        }),
        defineField({
            name: 'tickerRich',
            title: 'Mensajes con estilos (varios colores, tipografías y neón)',
            type: 'array',
            of: [{ type: 'tickerMessage' }],
            description: 'Opcional. Cada mensaje puede combinar trozos de texto con distinto color, tipografía y efecto. Si hay alguno, reemplaza los textos simples.',
        }),
        colorField('tickerBgColor', 'Color de fondo de la cinta', { fieldset: 'tickerDesign', description: 'Vacío = blanco.' }),
        colorField('tickerTextColor', 'Color del texto', { fieldset: 'tickerDesign', description: 'Vacío = gris oscuro.' }),
        fontField('tickerFont', 'Tipografía', { fieldset: 'tickerDesign' }),
        effectField('tickerEffect', 'Efecto del texto', { fieldset: 'tickerDesign' }),
        colorField('tickerEffectColor', 'Color del brillo / resaltado', {
            fieldset: 'tickerDesign',
            description: 'Neón: color del brillo (queda mejor con fondo oscuro). Resaltado: color de fondo detrás del texto.',
            hidden: ({ parent }: any) => !parent?.tickerEffect || parent?.tickerEffect === 'none' || parent?.tickerEffect === 'shadow',
        }),
        defineField({
            name: 'tickerFontSize',
            title: 'Tamaño del texto',
            type: 'string',
            fieldset: 'tickerDesign',
            options: { list: [{ title: 'Pequeño', value: 'sm' }, { title: 'Mediano', value: 'md' }, { title: 'Grande', value: 'lg' }], layout: 'radio', direction: 'horizontal' },
            initialValue: 'sm',
        }),
        defineField({
            name: 'tickerSpeed',
            title: 'Velocidad (segundos por vuelta)',
            type: 'number',
            fieldset: 'tickerDesign',
            description: 'Menos segundos = más rápido. Por defecto 40.',
            validation: (r) => r.min(8).max(200),
        }),
        defineField({
            name: 'isAnimated',
            title: '¿Barra animada?',
            type: 'boolean',
            description: 'Activar si deseas que el texto de la barra se mueva.',
            initialValue: true,
        }),
        defineField({
            name: 'hasCountdown',
            title: '¿Incluir Contador Regresivo?',
            type: 'boolean',
            description: 'Muestra una cuenta regresiva en la barra superior.',
            initialValue: false,
        }),
        defineField({
            name: 'countdownTextLeft',
            title: 'Texto a la izquierda del contador',
            type: 'string',
            description: 'Texto opcional que aparece antes del tiempo. Ejemplo: "¡Terminamos en:"',
            hidden: ({ parent }) => !parent?.hasCountdown,
        }),
        defineField({
            name: 'countdownTarget',
            title: 'Fecha y Hora del Contador',
            type: 'datetime',
            hidden: ({ parent }) => !parent?.hasCountdown,
        }),
        colorField('countdownBgColor', 'Color de fondo', { fieldset: 'countdownDesign', description: 'Vacío = azul de la marca.', hidden: ({ parent }: any) => !parent?.hasCountdown }),
        colorField('countdownBgColor2', 'Segundo color de fondo (degradado, opcional)', { fieldset: 'countdownDesign', description: 'Si lo llenas, el fondo pasa del primer color a este.', hidden: ({ parent }: any) => !parent?.hasCountdown }),
        colorField('countdownTextColor', 'Color del texto', { fieldset: 'countdownDesign', description: 'Vacío = blanco.', hidden: ({ parent }: any) => !parent?.hasCountdown }),
        colorField('countdownTimeColor', 'Color del tiempo (7d 12h 40m)', { fieldset: 'countdownDesign', description: 'Vacío = igual al texto.', hidden: ({ parent }: any) => !parent?.hasCountdown }),
        fontField('countdownFont', 'Tipografía', { fieldset: 'countdownDesign', hidden: ({ parent }: any) => !parent?.hasCountdown }),
        effectField('countdownEffect', 'Efecto del texto', { fieldset: 'countdownDesign', hidden: ({ parent }: any) => !parent?.hasCountdown }),
        colorField('countdownEffectColor', 'Color del brillo / resaltado', {
            fieldset: 'countdownDesign',
            hidden: ({ parent }: any) => !parent?.hasCountdown || !parent?.countdownEffect || parent?.countdownEffect === 'none' || parent?.countdownEffect === 'shadow',
        }),
        defineField({
            name: 'countdownFontSize',
            title: 'Tamaño',
            type: 'string',
            fieldset: 'countdownDesign',
            options: { list: [{ title: 'Pequeño', value: 'sm' }, { title: 'Mediano', value: 'md' }, { title: 'Grande', value: 'lg' }], layout: 'radio', direction: 'horizontal' },
            initialValue: 'md',
            hidden: ({ parent }) => !parent?.hasCountdown,
        }),
        defineField({
            name: 'logo',
            title: 'Logo Principal',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'menu',
            title: 'Menú Principal',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'navItem',
                    title: 'Elemento de Menú',
                    fields: [
                        defineField({ name: 'label', type: 'string', title: 'Etiqueta' }),
                        defineField({ name: 'link', type: 'string', title: 'Enlace (URL)' }),
                        defineField({
                            name: 'hasMegaMenu',
                            type: 'boolean',
                            title: '¿Tiene Mega Menú?',
                            initialValue: false,
                        }),
                        defineField({
                            name: 'megaMenuColumns',
                            title: 'Columnas del Mega Menú',
                            type: 'array',
                            hidden: ({ parent }) => !parent?.hasMegaMenu,
                            of: [
                                {
                                    type: 'object',
                                    title: 'Columna',
                                    fields: [
                                        defineField({ name: 'title', type: 'string', title: 'Título de Columna' }),
                                        defineField({
                                            name: 'contentType',
                                            title: 'Tipo de Contenido',
                                            type: 'string',
                                            options: {
                                                list: [
                                                    { title: 'Enlaces Manuales', value: 'manual' },
                                                    { title: 'Catálogo de Usos', value: 'usage' },
                                                    { title: 'Catálogo de Tonos', value: 'tone' },
                                                    { title: 'Ofertas', value: 'offer' },
                                                ],
                                                layout: 'radio'
                                            },
                                            initialValue: 'manual'
                                        }),
                                        defineField({
                                            name: 'links',
                                            title: 'Enlaces',
                                            type: 'array',
                                            hidden: ({ parent }) => parent?.contentType !== 'manual' && parent?.contentType !== undefined,
                                            of: [
                                                {
                                                    type: 'object',
                                                    fields: [
                                                        defineField({ name: 'label', type: 'string', title: 'Etiqueta' }),
                                                        defineField({ name: 'url', type: 'string', title: 'URL' }),
                                                    ],
                                                },
                                            ],
                                        }),
                                    ],
                                },
                            ],
                        }),
                    ],
                },
            ],
        }),
    ],
})
