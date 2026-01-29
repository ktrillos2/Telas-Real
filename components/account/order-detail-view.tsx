"use client"

import { ArrowLeft, Package, User, MapPin, Calendar, Receipt, ShoppingBag, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { PaymentButton } from '@/components/account/payment-button'

interface OrderDetailViewProps {
    order: any
    onBack: () => void
}

export function OrderDetailView({ order, onBack }: OrderDetailViewProps) {

    // Status Badge Component (reused)
    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            pending: "bg-amber-50 text-amber-700 border-amber-200",
            processing: "bg-blue-50 text-blue-700 border-blue-200",
            shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
            delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
            cancelled: "bg-red-50 text-red-700 border-red-200",
        }[status] || "bg-gray-50 text-gray-700 border-gray-200"

        const label = {
            pending: 'Pendiente de Pago',
            processing: 'En Proceso',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        }[status] || status

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
                {label}
            </span>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Header / Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full pl-2 pr-4 h-9"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-medium">Volver</span>
                    </Button>
                    <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                                Pedido <span className="font-mono text-gray-400 font-normal">#{order.orderNumber}</span>
                            </h2>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(order.date).toLocaleDateString('es-CO', {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                {/* LEFT COLUMN: Products List */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                            Productos
                        </h3>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                            {order.items?.length} artículo{order.items?.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex gap-6 group p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                {/* Product Image */}
                                <div className="relative h-32 w-32 min-w-[8rem] flex-shrink-0 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                    {item.image ? (
                                        <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-gray-300">
                                            <Package className="h-10 w-10" />
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center py-2">
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <h4 className="text-base font-semibold text-gray-900 line-clamp-2 leading-relaxed group-hover:text-blue-600 transition-colors max-w-[70%]">
                                            {item.name}
                                        </h4>
                                        <p className="font-bold text-gray-900 text-lg whitespace-nowrap">
                                            ${(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>

                                    {item.designName && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge variant="secondary" className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-0 px-2.5">
                                                Diseño: {item.designName}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="font-semibold text-gray-900">{item.quantity}</span>
                                        <span className="mx-1.5 text-gray-300">x</span>
                                        <span>${item.price?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Summary & Details */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Action Card for Pending Orders */}
                    {order.status === 'pending' && (
                        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-[0_2px_8px_-2px_rgba(251,191,36,0.15)] relative overflow-hidden group">
                            <div className="absolute -top-4 -right-4 p-4 opacity-[0.08] transition-opacity group-hover:opacity-[0.12]">
                                <CreditCard className="h-24 w-24 text-amber-500" />
                            </div>
                            <h3 className="font-bold text-amber-900 text-base mb-2 relative z-10 flex items-center gap-2">
                                <Receipt className="h-4 w-4" /> Completar Pago
                            </h3>
                            <p className="text-sm text-amber-800/80 mb-5 relative z-10 leading-relaxed font-medium">
                                Tu pedido está pendiente. Finaliza el pago para procesar tu envío.
                            </p>
                            <div className="relative z-10">
                                <PaymentButton order={order} />
                            </div>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Resumen Financiero</h3>
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span className="font-medium">Subtotal</span>
                                <span>${order.total?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span className="font-medium">Envío</span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded text-xs">Gratis</span>
                            </div>
                            <div className="my-2 border-t border-dashed border-gray-100"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight">${order.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Detalles de Entrega</h3>
                        <div className="space-y-6 pt-2">
                            <div>
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <User className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destinatario</span>
                                </div>
                                <div className="pl-11 space-y-1">
                                    <p className="text-sm font-bold text-gray-900">{order.shippingAddress?.fullName}</p>
                                    <p className="text-xs text-gray-500 font-medium">{order.shippingAddress?.email}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-5">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <MapPin className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</span>
                                </div>
                                <div className="pl-11 space-y-1">
                                    <p className="text-sm font-medium text-gray-900 leading-relaxed">{order.shippingAddress?.address}</p>
                                    <p className="text-xs text-gray-500 font-medium">{order.shippingAddress?.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
