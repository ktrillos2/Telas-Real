"use client"

import { useState, useEffect } from 'react'
import { X, Package, User, MapPin, Calendar, Receipt, ShoppingBag, Truck, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { PaymentButton } from '@/components/account/payment-button'

interface OrderDetailModalProps {
    order: any
    isOpen: boolean
    onClose: () => void
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden' // Prevent scrolling
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300) // Match transition duration
            document.body.style.overflow = 'unset'
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isVisible && !isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Status Badge Component
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
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={handleBackdropClick}
            />

            {/* Modal Container */}
            <div
                className={`
                    relative w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col 
                    max-h-[85vh] overflow-hidden transform transition-all duration-300
                    ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
                `}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-white z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-gray-900">
                                Pedido <span className="font-mono text-gray-500">#{order.orderNumber}</span>
                            </h2>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(order.date).toLocaleDateString('es-CO', {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 text-gray-400 -mr-2">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-gray-50/50">

                    {/* LEFT COLUMN: Products List (Scrollable) - Spans 8 cols */}
                    <div className="md:col-span-8 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-white h-full border-r border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-gray-500" />
                                Lista de Productos
                            </h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                {order.items?.length} artículo{order.items?.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="space-y-6">
                            {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex gap-4 group">
                                    {/* Product Image */}
                                    <div className="relative h-24 w-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                        {item.image ? (
                                            <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full text-gray-300">
                                                <Package className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-4 mb-1">
                                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                                    {item.name}
                                                </h4>
                                                <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                                                    ${(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>

                                            {item.designName && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs font-normal text-gray-500 bg-gray-50/50 border-gray-200">
                                                        Diseño: {item.designName}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-gray-100">
                                            <div className="flex items-center text-xs text-gray-500">
                                                <span className="font-medium text-gray-700">{item.quantity}</span>
                                                <span className="mx-1">x</span>
                                                <span>${item.price?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Summary & Details - Spans 4 cols */}
                    <div className="md:col-span-4 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar flex flex-col gap-6 h-full">

                        {/* Action Card for Pending Orders */}
                        {order.status === 'pending' && (
                            <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <CreditCard className="h-16 w-16 text-amber-500" />
                                </div>
                                <h3 className="font-semibold text-amber-900 text-sm mb-2 relative z-10 flex items-center gap-2">
                                    <Receipt className="h-4 w-4" /> Completar Pago
                                </h3>
                                <p className="text-xs text-amber-700/80 mb-4 relative z-10 leading-relaxed">
                                    Para procesar tu envío, necesitamos confirmar el pago.
                                </p>
                                <div className="relative z-10">
                                    <PaymentButton order={order} />
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen</h3>
                            <div className="bg-white p-5 rounded-xl border border-gray-200/60 shadow-sm space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${order.total?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Envío</span>
                                    <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-xs">Gratis</span>
                                </div>
                                <div className="my-2 border-t border-dashed border-gray-200"></div>
                                <div className="flex justify-between items-center text-base font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>${order.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Entrega</h3>
                            <div className="bg-white p-5 rounded-xl border border-gray-200/60 shadow-sm space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">Destinatario</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 pl-5.5">{order.shippingAddress?.fullName}</p>
                                    <p className="text-xs text-gray-500 pl-5.5">{order.shippingAddress?.email}</p>
                                </div>

                                <div className="border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">Dirección</span>
                                    </div>
                                    <p className="text-sm text-gray-900 pl-5.5 leading-snug">{order.shippingAddress?.address}</p>
                                    <p className="text-xs text-gray-500 pl-5.5 mt-0.5">{order.shippingAddress?.city}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t px-6 py-4 flex justify-end gap-3 z-10">
                    <Button onClick={onClose} variant="outline" className="min-w-[100px] border-gray-200 text-gray-700 hover:bg-gray-50">
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    )
}
