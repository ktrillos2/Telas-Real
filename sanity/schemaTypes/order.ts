import { defineField, defineType } from 'sanity'
import {
    ShoppingBag,
    Clock,
    CheckCircle2,
    Package,
    Truck,
    Home,
    XCircle,
    User,
    MapPin,
    Receipt
} from 'lucide-react'

export const order = defineType({
    name: 'order',
    title: 'Pedidos',
    type: 'document',
    icon: ShoppingBag,
    groups: [
        { name: 'details', title: 'Detalles del Pedido', icon: Receipt },
        { name: 'customer', title: 'Cliente y Envío', icon: User },
        { name: 'items', title: 'Productos', icon: ShoppingBag },
    ],
    fields: [
        defineField({
            name: 'orderNumber',
            title: 'Número de Orden',
            type: 'string',
            group: 'details',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'date',
            title: 'Fecha',
            type: 'datetime',
            group: 'details',
            initialValue: () => new Date().toISOString(),
        }),
        defineField({
            name: 'status',
            title: 'Estado',
            type: 'string',
            group: 'details',
            options: {
                list: [
                    { title: 'Pendiente', value: 'pending' },
                    { title: 'Pagado', value: 'paid' },
                    { title: 'Procesando', value: 'processing' },
                    { title: 'Enviado', value: 'shipped' },
                    { title: 'Entregado', value: 'delivered' },
                    { title: 'Cancelado', value: 'cancelled' },
                ],
                layout: 'dropdown'
            },
            initialValue: 'pending'
        }),
        defineField({
            name: 'paymentMethod',
            title: 'Método de Pago',
            type: 'string',
            group: 'details',
            options: {
                list: [
                    { title: 'Wompi', value: 'wompi' },
                    { title: 'Contraentrega', value: 'cod' },
                ],
                layout: 'dropdown'
            },
            initialValue: 'wompi'
        }),
        defineField({
            name: 'total',
            title: 'Total',
            type: 'number',
            group: 'details',
        }),
        defineField({
            name: 'user',
            title: 'Usuario',
            type: 'reference',
            to: [{ type: 'user' }],
            group: 'customer',
        }),

        defineField({
            name: 'shippingAddress',
            title: 'Información de Envío y Facturación',
            type: 'object',
            group: 'customer',
            fields: [
                { name: 'fullName', type: 'string', title: 'Nombre Completo', validation: (Rule) => Rule.required() },
                { name: 'documentId', type: 'string', title: 'Documento de Identidad', validation: (Rule) => Rule.required() },
                { name: 'country', type: 'string', title: 'País / Región', initialValue: 'Colombia', validation: (Rule) => Rule.required() },
                { name: 'department', type: 'string', title: 'Departamento', validation: (Rule) => Rule.required() },
                { name: 'city', type: 'string', title: 'Población / Ciudad', validation: (Rule) => Rule.required() },
                { name: 'address', type: 'string', title: 'Dirección de la calle', validation: (Rule) => Rule.required() },
                { name: 'apartment', type: 'string', title: 'Apartamento, habitación, etc. (opcional)' },
                { name: 'zipCode', type: 'string', title: 'Código postal / ZIP (opcional)' },
                { name: 'phone', type: 'string', title: 'Celular', validation: (Rule) => Rule.required() },
                { name: 'company', type: 'string', title: 'Nombre de la compañía (opcional)' },
                { name: 'email', type: 'string', title: 'Email de Contacto' },
            ],
            options: { collapsible: true, collapsed: false, columns: 2 }
        }),
        defineField({
            name: 'items',
            title: 'Productos',
            type: 'array',
            group: 'items',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'name', type: 'string', title: 'Producto' },
                        {
                            name: 'product',
                            type: 'reference',
                            to: [{ type: 'product' }],
                            title: 'Producto Referencia'
                        },
                        { name: 'quantity', type: 'number', title: 'Cantidad' },
                        { name: 'price', type: 'number', title: 'Precio' },
                        { name: 'image', type: 'string', title: 'Imagen URL' },
                    ],
                    options: { columns: 2 },
                    preview: {
                        select: {
                            title: 'name',
                            subtitle: 'quantity',
                            imageUrl: 'image'
                        },
                        prepare(selection) {
                            const { title, subtitle, imageUrl } = selection
                            return {
                                title: title || 'Producto sin nombre',
                                subtitle: `Cantidad: ${subtitle || 0}`,
                                imageUrl: imageUrl
                            }
                        }
                    }
                }
            ]
        }),
    ],
    preview: {
        select: {
            title: 'orderNumber',
            subtitle: 'user.name',
            date: 'date',
            status: 'status',
            total: 'total',
            paymentMethod: 'paymentMethod'
        },
        prepare(selection) {
            const { title, subtitle, date, status, total, paymentMethod } = selection

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

            const paymentLabel = paymentMethod === 'cod' ? 'Contraentrega' : 'Wompi'
            const formattedDate = date ? new Date(date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

            return {
                title: `Pedido ${title || 'Sin Número'} - $${total || 0}`,
                subtitle: `${formattedDate} | ${statusLabels[status as keyof typeof statusLabels] || status} | ${paymentLabel}`,
                media: statusIcons[status as keyof typeof statusIcons] || ShoppingBag
            }
        }
    }
})
