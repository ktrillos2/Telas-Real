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
            name: 'abandonedSmsSent',
            title: 'SMS Carrito Abandonado Enviado',
            type: 'boolean',
            group: 'details',
            initialValue: false,
            hidden: true,
        }),
        defineField({
            name: 'abandonedEmailSent',
            title: 'Email Carrito Abandonado Enviado',
            type: 'boolean',
            group: 'details',
            initialValue: false,
            hidden: true,
        }),
        defineField({
            name: 'abandonedNotifiedAt',
            title: 'Fecha Notificación Carrito Abandonado',
            type: 'datetime',
            group: 'details',
            hidden: true,
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
            name: 'wompiTransactionId',
            title: 'ID Transacción Wompi',
            type: 'string',
            group: 'details',
            description: 'Identificador único de la transacción en Wompi.'
        }),
        defineField({
            name: 'wompiStatus',
            title: 'Estado Transacción Wompi',
            type: 'string',
            group: 'details',
            description: 'Último estado reportado por Wompi (APPROVED, PENDING, DECLINED, VOIDED, ERROR).'
        }),
        defineField({
            name: 'wompiPaymentMethodType',
            title: 'Método de Pago Wompi',
            type: 'string',
            group: 'details',
            description: 'Tipo de pago usado en Wompi (CARD, NEQUI, PSE, BANCOLOMBIA_TRANSFER, etc.).'
        }),
        defineField({
            name: 'paymentDate',
            title: 'Fecha de Pago Confirmado',
            type: 'datetime',
            group: 'details',
            description: 'Fecha y hora en que Wompi aprobó el pago.'
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
            name: 'email',
            title: 'Email Principal',
            type: 'string',
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
                        { name: 'isCustom', type: 'boolean', title: '¿Diseño Personalizado?', description: 'Indica si este ítem tiene un archivo PDF personalizado subido por el cliente.' },
                        { name: 'designName', type: 'string', title: 'Nombre del Diseño / Archivo PDF' },
                        { 
                            name: 'customDesignUrl', 
                            type: 'url', 
                            title: 'Archivo de Diseño Personalizado (PDF descargable)',
                            description: 'Enlace directo para visualizar o descargar el archivo PDF del diseño.'
                        },
                    ],
                    options: { columns: 2 },
                    preview: {
                        select: {
                            title: 'name',
                            subtitle: 'quantity',
                            imageUrl: 'image',
                            isCustom: 'isCustom',
                            designName: 'designName',
                        },
                        prepare(selection) {
                            const { title, subtitle, imageUrl, isCustom, designName } = selection
                            const customBadge = isCustom ? ' [📄 PDF Personalizado]' : ''
                            const designInfo = designName ? ` • Archivo: ${designName}` : ''
                            return {
                                title: `${title || 'Producto sin nombre'}${customBadge}`,
                                subtitle: `Cantidad: ${subtitle || 0}${designInfo}`,
                                imageUrl: imageUrl
                            }
                        }
                    }
                }
            ]
        }),
        defineField({
            name: 'obsequio',
            title: 'Obsequio (Beneficio Aplicado)',
            type: 'object',
            group: 'items',
            fields: [
                { name: 'product', type: 'reference', to: [{ type: 'product' }], title: 'Producto Obsequiado' },
                { name: 'quantity', type: 'number', title: 'Cantidad (metros)' },
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
