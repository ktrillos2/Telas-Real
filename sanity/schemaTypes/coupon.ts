import { defineField, defineType } from 'sanity'
import { TicketPercent } from 'lucide-react'

// Genera un código legible sin caracteres confusos (sin 0/O, 1/I)
function randomCouponCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return `TR-${code}`
}

export const coupon = defineType({
    name: 'coupon',
    title: 'Cupones de Descuento',
    type: 'document',
    icon: TicketPercent,
    fields: [
        defineField({
            name: 'title',
            title: 'Nombre interno',
            type: 'string',
            description: 'Solo para identificarlo en el administrador (ej. "Black Friday Rib 15%").',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'code',
            title: 'Código del cupón',
            type: 'slug',
            description: 'Lo que escribe el cliente en el carrito. Pulsa "Generate" para crear uno aleatorio o escríbelo (se guarda en MAYÚSCULAS, sin espacios).',
            options: {
                source: () => randomCouponCode(),
                maxLength: 32,
                slugify: (input: string) =>
                    input
                        .toUpperCase()
                        .normalize('NFD')
                        .replace(/[̀-ͯ]/g, '')
                        .replace(/[^A-Z0-9-]+/g, '')
                        .slice(0, 32),
            },
            validation: (Rule) =>
                Rule.required().custom((value: any) => {
                    const code = value?.current || ''
                    if (code.length < 3) return 'El código debe tener al menos 3 caracteres.'
                    if (code !== code.toUpperCase() || /[^A-Z0-9-]/.test(code)) {
                        return 'Usa solo MAYÚSCULAS, números y guiones (pulsa "Generate" o vuelve a escribirlo).'
                    }
                    return true
                }),
        }),
        defineField({
            name: 'discountPercent',
            title: 'Descuento (%)',
            type: 'number',
            description: 'Porcentaje de descuento sobre los productos que aplican (ej. 10 = 10%).',
            validation: (Rule) => Rule.required().min(1).max(100),
        }),
        defineField({
            name: 'isActive',
            title: 'Activo',
            type: 'boolean',
            description: 'Desactívalo para pausar el cupón sin borrarlo.',
            initialValue: true,
        }),
        defineField({
            name: 'startDate',
            title: 'Válido desde',
            type: 'datetime',
            description: 'Opcional. Si se deja vacío, aplica desde ya.',
        }),
        defineField({
            name: 'endDate',
            title: 'Válido hasta',
            type: 'datetime',
            description: 'Opcional. Si se deja vacío, no vence.',
            validation: (Rule) =>
                Rule.custom((end, context) => {
                    const start = (context.document as any)?.startDate
                    if (end && start && new Date(end as string) <= new Date(start)) {
                        return 'La fecha "hasta" debe ser posterior a la fecha "desde".'
                    }
                    return true
                }),
        }),
        defineField({
            name: 'scope',
            title: 'Aplica a',
            type: 'string',
            options: {
                list: [
                    { title: 'Toda la tienda', value: 'all' },
                    { title: 'Productos específicos', value: 'products' },
                    { title: 'Categorías', value: 'categories' },
                    { title: 'Usos', value: 'usages' },
                    { title: 'Colores', value: 'tones' },
                    { title: 'Combinado (categorías, productos, usos y/o colores)', value: 'mixed' },
                ],
                layout: 'radio',
            },
            initialValue: 'products',
            description: 'Con "Combinado" el cupón aplica a un producto si cumple CUALQUIERA de las listas (ej. categorías Wafer y Suavetina + productos Rib Pitillo y Rib 2x2).',
            validation: (Rule) =>
                Rule.required().custom((scope, context) => {
                    const doc = context.document as any
                    if (scope !== 'mixed') return true
                    const total = ['products', 'categories', 'usages', 'tones'].reduce((n, k) => n + ((doc?.[k] as any[])?.length || 0), 0)
                    return total > 0 ? true : 'Con "Combinado" agrega al menos una categoría, producto, uso o color.'
                }),
        }),
        defineField({
            name: 'products',
            title: 'Productos',
            description: 'Si eliges un color de una tela con varios colores (ej. "Rib Pitillo Negro"), el cupón aplica a TODOS los colores de esa tela.',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'product' }] }],
            hidden: ({ document }) => document?.scope !== 'products' && document?.scope !== 'mixed',
            validation: (Rule) =>
                Rule.custom((value, context) =>
                    (context.document as any)?.scope === 'products' && (!value || (value as any[]).length === 0)
                        ? 'Selecciona al menos un producto.'
                        : true
                ),
        }),
        defineField({
            name: 'categories',
            title: 'Categorías',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            hidden: ({ document }) => document?.scope !== 'categories' && document?.scope !== 'mixed',
            validation: (Rule) =>
                Rule.custom((value, context) =>
                    (context.document as any)?.scope === 'categories' && (!value || (value as any[]).length === 0)
                        ? 'Selecciona al menos una categoría.'
                        : true
                ),
        }),
        defineField({
            name: 'usages',
            title: 'Usos',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'usage' }] }],
            hidden: ({ document }) => document?.scope !== 'usages' && document?.scope !== 'mixed',
            validation: (Rule) =>
                Rule.custom((value, context) =>
                    (context.document as any)?.scope === 'usages' && (!value || (value as any[]).length === 0)
                        ? 'Selecciona al menos un uso.'
                        : true
                ),
        }),
        defineField({
            name: 'tones',
            title: 'Colores',
            description: 'El cupón aplica a los productos que tengan alguno de estos tonos asignados.',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'tone' }] }],
            hidden: ({ document }) => document?.scope !== 'tones' && document?.scope !== 'mixed',
            validation: (Rule) =>
                Rule.custom((value, context) =>
                    (context.document as any)?.scope === 'tones' && (!value || (value as any[]).length === 0)
                        ? 'Selecciona al menos un color.'
                        : true
                ),
        }),
    ],
    preview: {
        select: {
            title: 'title',
            code: 'code.current',
            percent: 'discountPercent',
            isActive: 'isActive',
            startDate: 'startDate',
            endDate: 'endDate',
        },
        prepare({ title, code, percent, isActive, startDate, endDate }) {
            const now = new Date()
            const notStarted = startDate && new Date(startDate) > now
            const expired = endDate && new Date(endDate) < now
            const status = !isActive ? '⏸ Inactivo' : expired ? '⌛ Vencido' : notStarted ? '🕒 Programado' : '✅ Vigente'
            return {
                title: `${code || 'SIN CÓDIGO'} · ${percent || 0}%`,
                subtitle: `${status} — ${title || ''}`,
            }
        },
    },
})
