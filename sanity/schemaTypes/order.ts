
import { defineField, defineType } from 'sanity'
import { ShoppingBag } from 'lucide-react'

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
            title: 'Dirección de Envío',
            type: 'object',
            fields: [
                { name: 'fullName', type: 'string', title: 'Nombre Completo' },
                { name: 'address', type: 'string', title: 'Dirección' },
                { name: 'city', type: 'string', title: 'Ciudad' },
                { name: 'phone', type: 'string', title: 'Teléfono' },
            ]
        }),
    ],
    preview: {
        select: {
            title: 'orderNumber',
            subtitle: 'user.name',
            date: 'date',
            status: 'status'
        },
        prepare(selection) {
            const { title, subtitle, date, status } = selection
            return {
                title: `${title} - $${status}`,
                subtitle: `${subtitle} - ${new Date(date).toLocaleDateString()}`
            }
        }
    }
})
