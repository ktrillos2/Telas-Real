import { defineField, defineType } from 'sanity'
import {
    ShoppingBag,
    Clock,
    CheckCircle2,
    Package,
    Truck,
    Home,
    XCircle
} from 'lucide-react'

export const order = defineType({
    name: 'order',
    title: 'Pedidos',
    type: 'document',
    icon: ShoppingBag,
    fields: [
        defineField({
            name: 'orderNumber',
            title: 'Número de Orden',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'user',
            title: 'Usuario',
            type: 'reference',
            to: [{ type: 'user' }],
        }),
        defineField({
            name: 'email',
            title: 'Email de Contacto',
            type: 'string',
            validation: (Rule) => Rule.required().email(),
        }),
        defineField({
            name: 'date',
            title: 'Fecha',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
        }),
        defineField({
            name: 'total',
            title: 'Total',
            type: 'number',
        }),
        defineField({
            name: 'status',
            title: 'Estado',
            type: 'string',
            options: {
                list: [
                    { title: 'Pendiente', value: 'pending' },
                    { title: 'Pagado', value: 'paid' },
                    { title: 'Procesando', value: 'processing' },
                    { title: 'Enviado', value: 'shipped' },
                    { title: 'Entregado', value: 'delivered' },
                    { title: 'Cancelado', value: 'cancelled' },
                ],
                layout: 'radio'
            },
            initialValue: 'pending'
        }),
        defineField({
            name: 'items',
            title: 'Productos',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'name', type: 'string', title: 'Producto' },
                        { name: 'quantity', type: 'number', title: 'Cantidad' },
                        { name: 'price', type: 'number', title: 'Precio' },
                        { name: 'image', type: 'string', title: 'Imagen URL' },
                    ]
                }
            ]
        }),
        defineField({
            name: 'shippingAddress',
            title: 'Información de Envío y Facturación',
            type: 'object',
            fields: [
                { name: 'fullName', type: 'string', title: 'Nombre Completo', validation: (Rule) => Rule.required() },
                { name: 'documentId', type: 'string', title: 'Documento de Identidad', validation: (Rule) => Rule.required() },
                { name: 'company', type: 'string', title: 'Nombre de la compañía (opcional)' },
                { name: 'country', type: 'string', title: 'País / Región', initialValue: 'Colombia', validation: (Rule) => Rule.required() },
                { name: 'address', type: 'string', title: 'Dirección de la calle', validation: (Rule) => Rule.required() },
                { name: 'apartment', type: 'string', title: 'Apartamento, habitación, etc. (opcional)' },
                { name: 'department', type: 'string', title: 'Departamento', validation: (Rule) => Rule.required() },
                { name: 'city', type: 'string', title: 'Población / Ciudad', validation: (Rule) => Rule.required() },
                { name: 'zipCode', type: 'string', title: 'Código postal / ZIP (opcional)' },
                { name: 'phone', type: 'string', title: 'Celular', validation: (Rule) => Rule.required() },
            ]
        }),
    ],
    preview: {
        select: {
            title: 'orderNumber',
            subtitle: 'user.name',
            date: 'date',
            status: 'status',
            total: 'total'
        },
        prepare(selection) {
            const { title, subtitle, date, status, total } = selection

            const statusIcons = {
                pending: Clock,
                paid: CheckCircle2,
                processing: Package,
                shipped: Truck,
                delivered: Home,
                cancelled: XCircle,
            }

            const statusLabels = {
                pending: 'Pendiente',
                paid: 'Pagado',
                processing: 'Procesando',
                shipped: 'Enviado',
                delivered: 'Entregado',
                cancelled: 'Cancelado',
            }

            return {
                title: title,
                subtitle: `${subtitle || 'Sin usuario'} | ${statusLabels[status as keyof typeof statusLabels] || status} | $${total}`,
                media: statusIcons[status as keyof typeof statusIcons] || ShoppingBag
            }
        }
    }
})
