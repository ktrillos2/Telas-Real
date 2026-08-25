"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { generateWompiSignature } from '@/app/actions/wompi'
import { updateOrderStatus } from '@/app/actions/order'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface PaymentButtonProps {
    order: {
        _id: string;
        orderNumber: string;
        total: number;
        shippingAddress: {
            fullName: string;
            phone: string;
            email: string;
            documentId?: string; // Optional if not stored
        };
        items: any[];
    }
}

export function PaymentButton({ order }: PaymentButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [wompiLoaded, setWompiLoaded] = useState(false)
    const isTransactionProcessing = useRef(false)

    // Load Wompi script
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://checkout.wompi.co/widget.js'
        script.async = true
        script.onload = () => {
            setWompiLoaded(true)
        }
        document.body.appendChild(script)

        return () => {
            const existingScript = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]')
            if (existingScript) {
                document.body.removeChild(existingScript)
            }
        }
    }, [])

    const handlePay = async () => {
        if (!wompiLoaded || !(window as any).WidgetCheckout) {
            alert('El sistema de pago está cargando. Intenta de nuevo en unos segundos.')
            return
        }

        setIsLoading(true)

        try {
            const amountInCents = order.total * 100
            const reference = order._id // Use ID as reference
            const signature = await generateWompiSignature(reference, amountInCents)

            const checkout = new (window as any).WidgetCheckout({
                currency: 'COP',
                amountInCents: amountInCents,
                reference: reference,
                publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
                signature: { integrity: signature },
                redirectUrl: `${window.location.origin}/confirmation`, // Fallback
                customerData: {
                    email: order.shippingAddress.email,
                    fullName: order.shippingAddress.fullName,
                    phoneNumber: order.shippingAddress.phone,
                    phoneNumberPrefix: '+57',
                    legalId: order.shippingAddress.documentId || '123456789', // Fallback if missing
                    legalIdType: 'CC'
                }
            })

            isTransactionProcessing.current = false

            checkout.open(async (result: any) => {
                isTransactionProcessing.current = true
                const transaction = result?.transaction || {}
                console.log('Transaction result:', transaction)

                const wompiDetails = {
                    transactionId: transaction.id || undefined,
                    wompiStatus: transaction.status || (transaction.id ? 'APPROVED' : undefined),
                    paymentMethodType: transaction.payment_method_type || transaction.paymentMethodType || (transaction.payment_method ? transaction.payment_method.type : undefined),
                    paymentDate: transaction.status === 'APPROVED' ? new Date().toISOString() : undefined
                }

                try {
                    if (transaction.id) {
                        await fetch(`/api/wompi/verify?id=${encodeURIComponent(transaction.id)}&orderId=${encodeURIComponent(order._id)}`).catch(console.error)
                    }
                    if (transaction.status === 'APPROVED') {
                        await updateOrderStatus(order._id, 'paid', wompiDetails)
                    } else if (transaction.status === 'DECLINED' || transaction.status === 'VOIDED') {
                        await updateOrderStatus(order._id, 'cancelled', wompiDetails)
                    }
                } catch (e) {
                    console.error("Error updating order status in payment button:", e)
                }

                // Redirect to Confirmation
                router.push(`/confirmation?status=${transaction.status || ''}&id=${transaction.id || ''}&orderId=${order._id}`)
                setIsLoading(false)
            })

        } catch (error) {
            console.error('Payment initialization error:', error)
            alert('Error al iniciar Wompi')
            setIsLoading(false)
        }
    }

    return (
        <Button onClick={handlePay} disabled={isLoading} size="sm" className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? 'Procesando...' : 'Pagar Ahora'}
        </Button>
    )
}
