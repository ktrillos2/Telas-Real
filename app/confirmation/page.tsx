"use client"

import { Suspense, useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import Script from "next/script"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Clock, ArrowRight, MapPin, Phone, Mail, User, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateOrderStatus, getOrderDetails } from "@/app/actions/order"
import * as fpixel from "@/lib/fpixel"
import * as gtag from "@/lib/gtag"

import { useCart } from "@/lib/contexts/CartContext"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { client } from "@/sanity/lib/client"
import { PollaModal } from "@/components/polla-modal"
import { isUnitProduct } from "@/lib/utils"

function ConfirmationContent() {
    const searchParams = useSearchParams()
    const env = searchParams.get("env")
    const transactionId = searchParams.get("id")
    
    const [status, setStatus] = useState<string | null>(searchParams.get("status"))
    const [orderIdParam, setOrderIdParam] = useState<string | null>(searchParams.get("orderId"))
    const [isFetchingWompi, setIsFetchingWompi] = useState(!!transactionId)
    const [isPolling, setIsPolling] = useState(false)
    const [pollCount, setPollCount] = useState(0)

    const [orderData, setOrderData] = useState<any>(null)
    const [eventData, setEventData] = useState<any>(null)
    const { clearCart } = useCart()

    const [orderStatus, setOrderStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
    const [orderId, setOrderId] = useState<string | null>(null)
    const isSyncingRef = useRef(false)
    const purchaseTracked = useRef(false)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Verify transaction via secure server API endpoint
    const verifyTransaction = useCallback(async (isManual: boolean = false) => {
        if (!transactionId && !orderIdParam) return

        if (isManual) {
            setIsPolling(true)
        }

        try {
            const params = new URLSearchParams()
            if (transactionId) params.append("id", transactionId)
            if (orderIdParam) params.append("orderId", orderIdParam)
            if (env) params.append("env", env)

            const res = await fetch(`/api/wompi/verify?${params.toString()}`)
            const data = await res.json()

            if (data && data.success) {
                const currentStatus = data.status || (data.order && data.order.status === 'paid' ? 'APPROVED' : 'PENDING')
                setStatus(currentStatus)

                if (data.transaction?.reference) {
                    setOrderIdParam(data.transaction.reference)
                }

                // Sync full transaction metadata
                if (data.transaction) {
                    const tx = data.transaction
                    const targetRef = tx.reference || orderIdParam || transactionId
                    if (targetRef) {
                        const targetStatus = currentStatus === 'APPROVED' ? 'paid' : (currentStatus === 'DECLINED' || currentStatus === 'VOIDED' ? 'cancelled' : 'pending')
                        await updateOrderStatus(targetRef, targetStatus, {
                            transactionId: tx.id,
                            wompiStatus: tx.status,
                            paymentMethodType: tx.payment_method_type,
                            paymentDate: tx.status === 'APPROVED' ? new Date().toISOString() : undefined
                        }).catch(console.error)
                    }
                }

                // If approved, stop polling and clear cart
                if (currentStatus === "APPROVED") {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current)
                        pollingIntervalRef.current = null
                    }
                    clearCart()
                }
            }
        } catch (error) {
            console.error("Error verifying Wompi transaction:", error)
        } finally {
            setIsFetchingWompi(false)
            if (isManual) {
                setIsPolling(false)
            }
        }
    }, [transactionId, orderIdParam, env, clearCart])

    // Initial Verification on Mount
    useEffect(() => {
        verifyTransaction()
    }, [verifyTransaction])

    // Start Polling if Status is PENDING (e.g. PSE / Nequi / Bank transfer)
    useEffect(() => {
        if (status === "PENDING" && transactionId) {
            let count = 0
            const maxPolls = 15 // Poll every 4 seconds up to 60 seconds

            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
            }

            pollingIntervalRef.current = setInterval(() => {
                count++
                setPollCount(count)
                verifyTransaction()

                if (count >= maxPolls) {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current)
                        pollingIntervalRef.current = null
                    }
                }
            }, 4000)

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current)
                }
            }
        }
    }, [status, transactionId, verifyTransaction])

    // Load Order Data
    useEffect(() => {
        const fetchOrder = async () => {
            const storedOrder = localStorage.getItem("lastOrder")
            if (storedOrder) {
                try {
                    const parsed = JSON.parse(storedOrder)
                    setOrderData(parsed)
                } catch (e) {
                    console.error("Failed to parse stored order:", e)
                }
            }
            
            if (orderIdParam) {
                const fetchedOrder = await getOrderDetails(orderIdParam)
                if (fetchedOrder) {
                    setOrderData((prev: any) => ({
                        ...prev,
                        ...fetchedOrder,
                        items: fetchedOrder.items || prev?.items || [],
                        formData: prev?.formData || {
                            firstName: fetchedOrder.shippingAddress?.fullName?.split(" ")[0] || "",
                            lastName: fetchedOrder.shippingAddress?.fullName?.split(" ").slice(1).join(" ") || "",
                            email: fetchedOrder.email || fetchedOrder.shippingAddress?.email || "",
                            phone: fetchedOrder.shippingAddress?.phone || "",
                            address: fetchedOrder.shippingAddress?.address || "",
                            city: fetchedOrder.shippingAddress?.city || "",
                            region: fetchedOrder.shippingAddress?.department || "",
                            documentId: fetchedOrder.shippingAddress?.documentId || "",
                        },
                        reference: fetchedOrder.orderNumber || fetchedOrder._id || orderIdParam,
                        totalPrice: fetchedOrder.total || prev?.totalPrice || 0
                    }))
                }
            }
        }
        fetchOrder()

        const fetchEvent = async () => {
            try {
                const result = await client.fetch(`*[_type == "eventConfig"][0]`)
                setEventData(result)
            } catch (error) {
                console.error("Error fetching eventConfig:", error)
            }
        }
        fetchEvent()
    }, [orderIdParam])

    // Sync status if approved or explicitly declined
    useEffect(() => {
        if (status === "APPROVED") {
            clearCart()
        }

        const syncOrderStatus = async () => {
            if ((orderIdParam || transactionId) && status && !isSyncingRef.current) {
                isSyncingRef.current = true
                const id = orderIdParam || transactionId
                const wompiDetails = {
                    transactionId: transactionId || undefined,
                    wompiStatus: status,
                    paymentDate: status === 'APPROVED' ? new Date().toISOString() : undefined
                }
                if (status === 'APPROVED') {
                    await updateOrderStatus(id, 'paid', wompiDetails)
                } else if (status === 'DECLINED' || status === 'VOIDED') {
                    await updateOrderStatus(id, 'cancelled', wompiDetails)
                }
            }
        }

        syncOrderStatus()
    }, [status, clearCart, orderIdParam, transactionId])

    // Purchase tracking pixels (Google Analytics & Meta Pixel)
    useEffect(() => {
        const isApproved = status === "APPROVED" || orderData?.status === "paid" || orderData?.status === "processing";
        const canonicalOrderId = orderData?.orderNumber 
            ? String(orderData.orderNumber) 
            : (orderIdParam && !orderIdParam.includes('-') ? String(orderIdParam) : null);

        if (orderData && isApproved && canonicalOrderId && !purchaseTracked.current && orderData.items && orderData.items.length > 0) {
            // Check session storage deduplication key to prevent duplicates on refresh
            const trackedKey = `ga_purchase_tracked_${canonicalOrderId}`;
            if (typeof window !== 'undefined' && sessionStorage.getItem(trackedKey)) {
                console.log(`[Analytics] Order #${canonicalOrderId} already tracked in this session. Skipping.`);
                purchaseTracked.current = true;
                return;
            }

            purchaseTracked.current = true;
            try {
                sessionStorage.setItem(trackedKey, 'true');
            } catch (e) {}

            const totalPrice = Number(orderData.total || orderData.totalPrice || orderData.totalWithIva || 0);

            console.log(`[Analytics] Tracking Purchase for Order #${canonicalOrderId} - Total: $${totalPrice}`);

            fpixel.event("Purchase", {
                value: totalPrice,
                currency: "COP",
                content_ids: orderData.items?.map((i: any) => i.id || i._id || i.name) || [],
                content_type: "product"
            });

            gtag.event("purchase", {
                transaction_id: String(canonicalOrderId),
                value: totalPrice,
                currency: "COP",
                items: orderData.items?.map((item: any) => ({
                    item_id: (item.id || item._id || item.name).toString(),
                    item_name: item.name,
                    price: Number(item.price || 0),
                    quantity: Number(item.quantity || 1)
                })) || []
            });
            
            // Internal metrics
            fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'purchase_completed' })
            }).catch(console.error);
        }
    }, [orderData, status, orderIdParam])

    // Google Customer Reviews Opt-In
    useEffect(() => {
        if (orderData && status === "APPROVED") {
            const estimatedDate = new Date()
            estimatedDate.setDate(estimatedDate.getDate() + 5)
            const estimatedDeliveryStr = estimatedDate.toISOString().split("T")[0]

            const gtinProducts = orderData.items?.map((i: any) => ({
                gtin: i.gtin || i.barcode || ""
            })).filter((p: any) => p.gtin) || []

            ;(window as any).renderOptIn = function() {
                ;(window as any).gapi.load('surveyoptin', function() {
                    ;(window as any).gapi.surveyoptin.render({
                        "merchant_id": 5742019662,
                        "order_id": orderData.reference || orderData.orderNumber || orderIdParam || "N/A",
                        "email": orderData.formData?.email || orderData.email || "",
                        "delivery_country": "CO",
                        "estimated_delivery_date": estimatedDeliveryStr,
                        ...(gtinProducts.length > 0 ? { "products": gtinProducts } : {})
                    });
                });
            }
        }
    }, [orderData, status, orderIdParam])

    if (!orderData && isFetchingWompi) {
        return (
            <div className="min-h-screen flex flex-col">
                <main className="flex-1 container mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground font-medium">Verificando estado del pago con Wompi...</p>
                </main>
            </div>
        )
    }

    const items = orderData?.items || []
    const formData = orderData?.formData || {}
    const reference = orderData?.reference || orderData?.orderNumber || orderIdParam || "N/A"
    const totalPrice = orderData?.totalPrice || orderData?.totalWithIva || 0

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
            case "VOIDED":
            case "ERROR":
                return <XCircle className="h-16 w-16 text-red-600" />
            default:
                return <Clock className="h-16 w-16 text-yellow-600 animate-pulse" />
        }
    }

    const renderStatusMessage = () => {
        switch (status) {
            case "APPROVED":
                return {
                    title: "¡Gracias por tu compra!",
                    description: "Tu pago ha sido confirmado y tu pedido ha sido procesado exitosamente. Hemos enviado un correo con los detalles.",
                    color: "bg-green-50 text-green-900 border-green-200"
                }
            case "DECLINED":
            case "VOIDED":
                return {
                    title: "Pago Cancelado o Rechazado",
                    description: "Lo sentimos, tu transacción no pudo ser completada por la entidad bancaria. Por favor intenta nuevamente o elige otro método.",
                    color: "bg-red-50 text-red-900 border-red-200"
                }
            default:
                return {
                    title: "Pago en Proceso de Aprobación",
                    description: "Tu transacción está siendo validada por tu entidad bancaria (PSE / Nequi / Banco). Esta pantalla se actualizará automáticamente en unos segundos.",
                    color: "bg-yellow-50 text-yellow-900 border-yellow-200"
                }
        }
    }

    const statusInfo = renderStatusMessage()

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {/* Polla Modal */}
            <PollaModal eventData={eventData} orderData={orderData} />

            {status === "APPROVED" && (
                <Script
                    src="https://apis.google.com/js/platform.js?onload=renderOptIn"
                    strategy="afterInteractive"
                    async
                    defer
                />
            )}
            <main className="flex-1 container mx-auto px-4 py-8 lg:py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Status Header */}
                    <div className={`rounded-xl border p-8 text-center mb-8 ${statusInfo.color} bg-white shadow-sm transition-all duration-300`}>
                        <div className="flex justify-center mb-4">
                            {renderStatusIcon()}
                        </div>
                        <h1 className="text-3xl font-light mb-2">{statusInfo.title}</h1>
                        <p className="text-base opacity-90 mb-4 max-w-xl mx-auto">{statusInfo.description}</p>
                        
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                            <div className="text-sm font-mono bg-black/5 px-3 py-1 rounded">
                                Orden: {reference}
                            </div>
                            {transactionId && (
                                <div className="text-sm font-mono bg-black/5 px-3 py-1 rounded">
                                    ID Transacción: {transactionId}
                                </div>
                            )}
                        </div>

                        {/* Pending re-verification button */}
                        {status === "PENDING" && (
                            <div className="mt-4 pt-4 border-t border-yellow-200 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Button
                                    onClick={() => verifyTransaction(true)}
                                    disabled={isPolling}
                                    variant="outline"
                                    className="bg-white border-yellow-300 hover:bg-yellow-50 text-yellow-900 font-semibold"
                                >
                                    {isPolling ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    {isPolling ? "Comprobando con Wompi..." : "Verificar estado ahora"}
                                </Button>
                                <span className="text-xs text-yellow-800 font-medium">
                                    Comprobando automáticamente cada 4s...
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-center">
                        <p className="text-blue-900 text-sm">
                            ¿Necesitas ayuda o actualizar algo de tu pedido? Contáctanos por{" "}
                            <a href="https://wa.me/573159021516" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-800">
                                WhatsApp (+57 315 902 1516)
                            </a>{" "}
                            lo antes posible.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Order Details - Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Products List */}
                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                <div className="p-6 border-b bg-muted/30">
                                    <h2 className="font-semibold text-lg">Productos del Pedido</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    {items.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">Cargando productos del pedido...</p>
                                    ) : (
                                        items.map((item: any, idx: number) => (
                                            <div key={item.id || idx} className="flex gap-3 sm:gap-4 items-start">
                                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                                                    <Image
                                                        src={item.image || "/placeholder.svg"}
                                                        alt={item.name || "Tela"}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                                        <h3 className="font-medium text-sm sm:text-base leading-tight">{item.name}</h3>
                                                        <p className="font-semibold text-sm whitespace-nowrap">
                                                            ${Number(item.price * item.quantity || 0).toLocaleString('es-CO')}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 space-y-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            Cantidad: {item.quantity} {(() => {
                                                                const isUnit = isUnitProduct(item)
                                                                return isUnit ? (item.quantity === 1 ? 'unidad' : 'unidades') : (item.quantity === 1 ? 'metro' : 'metros')
                                                            })()}
                                                        </p>
                                                        {(item.designName || item.isCustom) && (
                                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                                                                {item.designName && <span>Diseño: {item.designName}</span>}
                                                                {item.isCustom && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">Personalizado</span>}
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">
                                                            ${Number(item.price || 0).toLocaleString('es-CO')} c/u
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-6 bg-muted/30 border-t">
                                    <div className="flex flex-col sm:flex-row justify-between items-center text-lg font-bold gap-2">
                                        <span>Total</span>
                                        <span>${Number(totalPrice).toLocaleString('es-CO')}</span>
                                    </div>
                                    {items.length > 0 && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground mt-2 border-t border-border/50 pt-2">
                                            <span>Peso aproximado del pedido</span>
                                            <span>~{(items.reduce((acc: number, item: any) => acc + (item.quantity * 0.35), 0)).toFixed(2)} kg</span>
                                        </div>
                                    )}
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
                                    <h2 className="font-semibold text-lg">Información de Entrega</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                                            <p className="font-medium">{formData.firstName || "Cliente"} {formData.lastName || ""}</p>
                                            {formData.documentId && <p className="text-sm text-muted-foreground">{formData.documentId}</p>}
                                        </div>
                                    </div>

                                    {formData.email && (
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Correo</p>
                                                <p className="text-sm">{formData.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.phone && (
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                                                <p className="text-sm">{formData.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.address && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                                                <p className="text-sm">{formData.address}</p>
                                                {formData.apartment && <p className="text-sm text-muted-foreground">{formData.apartment}</p>}
                                                <p className="text-sm">{formData.city}, {formData.region}</p>
                                            </div>
                                        </div>
                                    )}
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
