"use client"

import { useState } from 'react'
import { Package, ShoppingBag, ChevronRight, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { PaymentButton } from '@/components/account/payment-button'
import { OrderDetailView } from '@/components/account/order-detail-view'
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface OrderListProps {
    orders: any[]
}

export function OrderList({ orders }: OrderListProps) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null)

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No tienes pedidos aún</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                    Explora nuestra colección de telas y encuentra tu próxima inspiración.
                </p>
                <Button asChild>
                    <Link href="/tienda">
                        Ir a la Tienda
                    </Link>
                </Button>
            </div>
        )
    }

    if (selectedOrder) {
        return <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
    }

    return (
        <div className="space-y-4">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Mis Compras
                </CardTitle>
                <CardDescription>
                    Historial de tus pedidos recientes
                </CardDescription>
            </CardHeader>

            {orders.map((order: any) => (
                <div key={order._id} className="border rounded-lg overflow-hidden transition-all hover:shadow-md bg-white">
                    <div className="bg-gray-50/80 p-4 flex flex-wrap gap-4 justify-between items-center border-b">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Pedido <span className="font-mono text-xs ml-1 bg-white px-2 py-0.5 border rounded text-muted-foreground">{order.orderNumber}</span></p>
                            <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">${order.total?.toLocaleString()}</p>
                            <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {
                                    order.status === 'pending' ? 'Pendiente' :
                                        order.status === 'processing' ? 'Procesando' :
                                            order.status === 'shipped' ? 'Enviado' :
                                                order.status === 'delivered' ? 'Entregado' :
                                                    order.status === 'cancelled' ? 'Cancelado' : order.status
                                }
                            </div>
                            {order.status === 'pending' && (
                                <div className="mt-2">
                                    <PaymentButton order={order} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex -space-x-3 overflow-hidden py-2 mb-2">
                            {order.items?.slice(0, 4).map((item: any, i: number) => (
                                <div key={i} className="relative h-10 w-10 rounded-full border-2 border-white ring-1 ring-gray-100 bg-gray-100">
                                    {item.image ? (
                                        <Image src={item.image} alt={item.name} fill className="object-cover rounded-full" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-xs text-gray-400">
                                            <Package className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {order.items?.length > 4 && (
                                <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-500 z-10">
                                    +{order.items.length - 4}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-sm text-muted-foreground">{order.items?.length} artículo(s)</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                                className="text-xs font-medium border-gray-200 hover:!bg-blue hover:text-white hover:border-blue-600 transition-all duration-300 rounded-full px-4 h-8"
                            >
                                Ver detalles <ArrowRight className="h-3 w-3 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
