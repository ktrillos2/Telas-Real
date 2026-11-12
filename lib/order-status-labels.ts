/** Nombres en español de los estados de pedido (correos y notificaciones). */
export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente de pago',
    processing: 'Pagado - En preparación',
    'on-hold': 'En espera',
    shipped: 'Enviado',
    completed: 'Entregado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    failed: 'Pago fallido',
    refunded: 'Reembolsado',
}

export function orderStatusLabel(status: string | undefined | null, paymentMethod?: string): string {
    const s = String(status || '').toLowerCase()
    if (s === 'pending' && paymentMethod === 'cod') return 'Pendiente (contra entrega)'
    return ORDER_STATUS_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Sin estado')
}

/** El primer correo de un pedido es "pendiente"; cualquier otro estado es un cambio sobre un pedido existente. */
export const isOrderStatusUpdate = (status: string | undefined | null) => String(status || '').toLowerCase() !== 'pending'
