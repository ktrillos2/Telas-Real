"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Clock, ArrowRight, MapPin, Phone, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateOrderStatus, getOrderDetails } from "@/app/actions/order"
import * as fpixel from "@/lib/fpixel"
import * as gtag from "@/lib/gtag"

import { useCart } from "@/lib/contexts/CartContext"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

function ConfirmationContent() {
    const searchParams = useSearchParams()
    const status = searchParams.get("status")
    const transactionId = searchParams.get("id")
    const [orderData, setOrderData] = useState<any>(null)
    const { clearCart } = useCart()

    const [orderStatus, setOrderStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
    const [orderId, setOrderId] = useState<string | null>(null)
    const isSyncingRef = useRef(false)
    const purchaseTracked = useRef(false)

    useEffect(() => {
        // Recuperar datos del pedido solo una vez al montar
        const fetchOrder = async () => {
            const storedOrder = localStorage.getItem("lastOrder")
            if (storedOrder) {
                setOrderData(JSON.parse(storedOrder))
            } else {
                const orderIdParam = searchParams.get("orderId")
                if (orderIdParam) {
                    const fetchedOrder = await getOrderDetails(orderIdParam)
                    if (fetchedOrder) {
                        setOrderData(fetchedOrder)
                    }
                }
            }
        }
        fetchOrder()
    }, [searchParams])

    const orderIdParam = searchParams.get("orderId")

    useEffect(() => {
        // Limpiar carrito si el pago fue aprobado
        if (status === "APPROVED") {
            clearCart()
        }

        const syncOrderStatus = async () => {
            if (orderIdParam && status && !isSyncingRef.current) {
                isSyncingRef.current = true;
                const id = orderIdParam
                if (status === 'APPROVED') {
                    await updateOrderStatus(id, 'paid')
                } else if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
                    await updateOrderStatus(id, 'cancelled')
                }
            }
        }

        syncOrderStatus()
    }, [status, clearCart, orderIdParam])

    useEffect(() => {
        if (orderData && status === "APPROVED" && !purchaseTracked.current) {
            purchaseTracked.current = true
            const totalPrice = orderData.totalPrice || orderData.totalWithIva
            fpixel.event("Purchase", {
                value: totalPrice,
                currency: "COP",
                content_ids: orderData.items?.map((i: any) => i.id || i._id) || [],
                content_type: "product"
            })
            gtag.event("purchase", {
                transaction_id: orderData.orderNumber || transactionId || orderIdParam || Math.random().toString(),
                value: totalPrice,
                currency: "COP",
                items: orderData.items?.map((item: any) => ({
                    item_id: (item.id || item._id).toString(),
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })) || []
            })
        }
    }, [orderData, status])

    if (!orderData) {
        return (
            <div className="min-h-screen flex flex-col">
                <main className="flex-1 container mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
                    <p className="text-muted-foreground">Cargando detalles del pedido...</p>
                    <Button variant="outline" asChild className="mt-4">
                        <Link href="/tienda">Volver a la tienda</Link>
                    </Button>
                </main>
            </div>
        )
    }

    const { items, formData, reference } = orderData
    const totalPrice = orderData.totalPrice || orderData.totalWithIva

    const renderStatusIcon = () => {
        switch (status) {
            case "APPROVED":
                return (
                    <div className="h-24 w-24">
                        <DotLottieReact
                            src="https://lottie.host/6fc7326d-9734-4397-8646-d7fb4a5bd93e/PMmGKqvoEs.lottie"
                            loop={false}
                            autoplay
                        />
                    </div>
                )
            case "DECLINED":
            case "ERROR":
            case "VOIDED":
                return <XCircle className="h-16 w-16 text-red-600" />
            default:
                return <Clock className="h-16 w-16 text-yellow-600" />
        }
    }

    const renderStatusMessage = () => {
        switch (status) {
            case "APPROVED":
                return {
                    title: "¡Gracias por tu compra!",
                    description: "Tu pedido ha sido procesado exitosamente. Hemos enviado un correo electrónico con los detalles.",
                    color: "bg-green-50 text-green-900 border-green-200"
                }
            case "DECLINED":
            case "ERROR":
            case "VOIDED":
                return {
                    title: "Pago Cancelado o Rechazado",
                    description: "Lo sentimos, tu transacción no pudo ser completada. Por favor intenta nuevamente o contacta a tu banco.",
                    color: "bg-red-50 text-red-900 border-red-200"
                }
            default:
                return {
                    title: "En Proceso de Aprobación",
                    description: "Tu pago está siendo validado. Te notificaremos tan pronto como sea aprobado.",
                    color: "bg-yellow-50 text-yellow-900 border-yellow-200"
                }
        }
    }

    const statusInfo = renderStatusMessage()

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <main className="flex-1 container mx-auto px-4 py-8 lg:py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Status Header */}
                    <div className={`rounded-xl border p-8 text-center mb-8 ${statusInfo.color} bg-white shadow-sm`}>
                        <div className="flex justify-center mb-4">
                            {renderStatusIcon()}
                        </div>
                        <h1 className="text-3xl font-light mb-2">{statusInfo.title}</h1>
                        <p className="text-lg opacity-90 mb-4">{statusInfo.description}</p>
                        <div className="text-sm font-mono bg-black/5 inline-block px-3 py-1 rounded">
                            Referencia: {reference}
                        </div>
                        {transactionId && (
                            <div className="text-sm font-mono bg-black/5 inline-block px-3 py-1 rounded ml-2">
                                ID Transacción: {transactionId}
                            </div>
                        )}
                    </div>

                    {/* Order Creation Status */}
                    {status === "APPROVED" && (
                        <div className="mb-8">
                            {orderStatus === 'creating' && (
                                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center text-sm font-medium animate-pulse">
                                    Creando pedido en el sistema...
                                </div>
                            )}
                            {orderStatus === 'success' && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center text-sm font-medium border border-green-200">
                                    ¡Pedido #{orderId} creado exitosamente en el sistema!
                                </div>
                            )}
                            {orderStatus === 'error' && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center text-sm font-medium border border-red-200">
                                    Hubo un error al registrar el pedido en el sistema. Por favor contáctanos.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-center">
                        <p className="text-blue-900">
                            ¿Necesitas actualizar algo de tu pedido? Contáctanos por <a href="https://wa.me/573014453123" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-800">WhatsApp</a> lo antes posible.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Order Details - Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Products List */}
                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                <div className="p-6 border-b bg-muted/30">
                                    <h2 className="font-semibold text-lg">Productos Comprados</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    {items.map((item: any) => (
                                        <div key={item.id} className="flex gap-3 sm:gap-4 items-start">
                                            <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                                                <Image
                                                    src={item.image || "/placeholder.svg"}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                                    <h3 className="font-medium text-sm sm:text-base leading-tight">{item.name}</h3>
                                                    <p className="font-semibold text-sm whitespace-nowrap">
                                                        ${(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="mt-1 space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Cantidad: {item.quantity} {item.quantity === 1 ? 'kilo' : 'kilos'}
                                                    </p>
                                                    {(item.designName || item.isCustom) && (
                                                        <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                                            {item.designName && <span>Diseño: {item.designName}</span>}
                                                            {item.isCustom && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">Personalizado</span>}
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        ${item.price.toLocaleString()} c/u
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-muted/30 border-t">
                                    <div className="flex flex-col sm:flex-row justify-between items-center text-lg font-bold gap-2">
                                        <span>Total Pagado</span>
                                        <span>${totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/tienda" className="flex-1">
                                    <Button size="lg" className="w-full h-14 text-lg font-medium">
                                        Volver a la tienda
                                    </Button>
                                </Link>
                                <Link href="/cuenta" className="flex-1">
                                    <Button variant="outline" size="lg" className="w-full h-14 text-lg font-medium">
                                        Ver mis pedidos
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Customer Info - Right Column */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                <div className="p-6 border-b bg-muted/30">
                                    <h2 className="font-semibold text-lg">Información de Facturación</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                                            <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                                            <p className="text-sm text-muted-foreground">{formData.documentId}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Correo</p>
                                            <p className="text-sm">{formData.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                                            <p className="text-sm">{formData.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                                            <p className="text-sm">{formData.address}</p>
                                            {formData.apartment && <p className="text-sm text-muted-foreground">{formData.apartment}</p>}
                                            <p className="text-sm">{formData.city}, {formData.region}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    )
}
