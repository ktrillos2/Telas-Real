"use client"


import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/lib/contexts/CartContext"
import { Truck, Loader2, Clock, Store, MapPin, CheckCircle2, ChevronDown, ShoppingBag, Check, Tag, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getCustomerData } from "@/app/actions/customer"
import { createOrder, updateOrderStatus, saveDraftCheckout } from "@/app/actions/order"
import { useEffect, useState, useRef, useCallback } from "react"
import * as gtag from "@/lib/gtag"
import * as fpixel from "@/lib/fpixel"
import { client } from "@/sanity/lib/client"
import { ShippingDispatchNotice } from "@/components/shipping-dispatch-notice"
import { isUnitProduct } from "@/lib/utils"
import { toast } from "sonner"

// ... imports

import { generateWompiSignature } from "@/app/actions/wompi"

import { 
    getDepartments, 
    getPopulationsByDepartment, 
    findPopulationByDane, 
    findPopulationByCityAndDept 
} from "@/lib/coordinadora/locations"
import type { ShippingQuote } from "@/lib/coordinadora/types"

const MIN_COD_AMOUNT = 50000
const MAX_COD_AMOUNT = 100000 // Configurable limit for Cash on Delivery

export const STORE_PICKUP_OPTION = {
    title: "OPCIÓN - RECOGER EN TIENDA - BOGOTÁ CALLE 12 # 38-65 Telas Real",
    shortTitle: "Recoger en Tienda Bogotá",
    address: "Calle 12 # 38-65 Telas Real",
    city: "Bogota",
    region: "Cundinamarca",
    daneCode: "11001000",
    zipCode: "111611",
    hours: "Lunes a Viernes: 8:30 AM - 5:30 PM",
    schedule: "Lunes a Viernes: 8:30 AM - 5:30 PM",
    badge: "Gratis"
}

export default function CheckoutPage() {
    const router = useRouter()
    const { items, totalPrice, clearCart } = useCart()
    const [paymentMethod, setPaymentMethod] = useState("wompi")
    const [savedCustomer, setSavedCustomer] = useState<any>(null)
    const [useSavedAddress, setUseSavedAddress] = useState("none")
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("")
    const [wompiLoaded, setWompiLoaded] = useState(false)
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
    const currentOrderIdRef = useRef<string | null>(null)
    const isSavingDraftRef = useRef<boolean>(false)
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
    const [kgDiscountSettings, setKgDiscountSettings] = useState<any>(null)
    const isTransactionProcessing = useRef(false)

    // Delivery Method State: 'shipping' (Envío a domicilio) vs 'pickup' (Recoger en tienda)
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping')
    const [pickupNotes, setPickupNotes] = useState("")
    const [savedHomeAddress, setSavedHomeAddress] = useState({
        address: "",
        apartment: "",
        city: "Bogota",
        region: "Cundinamarca",
        daneCode: "11001000",
        zipCode: ""
    })

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        company: "",
        address: "",
        apartment: "",
        city: "Bogota",
        region: "Cundinamarca",
        daneCode: "11001000",
        zipCode: "",
        phone: "",
        email: "",
        documentId: "",
    })

    const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null)
    const [isQuotingShipping, setIsQuotingShipping] = useState<boolean>(false)
    const [shippingError, setShippingError] = useState<string | null>(null)

    const handleDeliveryMethodChange = (method: 'shipping' | 'pickup') => {
        if (method === deliveryMethod) return
        setDeliveryMethod(method)

        if (method === 'pickup') {
            setSavedHomeAddress({
                address: formData.address,
                apartment: formData.apartment,
                city: formData.city,
                region: formData.region,
                daneCode: formData.daneCode,
                zipCode: formData.zipCode
            })
            const updatedForm = {
                ...formData,
                address: STORE_PICKUP_OPTION.address,
                apartment: "Recoger en Tienda",
                city: STORE_PICKUP_OPTION.city,
                region: STORE_PICKUP_OPTION.region,
                daneCode: STORE_PICKUP_OPTION.daneCode,
                zipCode: STORE_PICKUP_OPTION.zipCode,
            }
            setFormData(updatedForm)
            setShippingQuote(null)
            setShippingError(null)
            setIsQuotingShipping(false)
            triggerAutoSave({ ...updatedForm, deliveryMethod: 'pickup' })
        } else {
            const updatedForm = {
                ...formData,
                address: savedHomeAddress.address,
                apartment: savedHomeAddress.apartment,
                city: savedHomeAddress.city,
                region: savedHomeAddress.region,
                daneCode: savedHomeAddress.daneCode,
                zipCode: savedHomeAddress.zipCode,
            }
            setFormData(updatedForm)
            triggerAutoSave({ ...updatedForm, deliveryMethod: 'shipping' })
        }
    }

    // Load active draft order ID from session if exists
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('telas_draft_order_id')
            if (stored) {
                currentOrderIdRef.current = stored
                setCurrentOrderId(stored)
            }
        } catch (e) {}
    }, [])

    // Fetch KG discount event settings
    useEffect(() => {
        client.fetch(`*[_type == "eventSettings"][0]{
            ...,
            title,
            "applicableCategories": applicableCategories[]->slug.current,
            "applicableProducts": applicableProducts[]->slug.current,
            "tiers": tiers[]{
                ...,
                "comboCategorySlug": comboCategory->slug.current
            }
        }`).then((settings) => {
            setKgDiscountSettings(settings)
        }).catch(console.error)
    }, [])

    // Reset draft reference only when cart is completely emptied
    useEffect(() => {
        if (items.length === 0) {
            setCurrentOrderId(null)
            currentOrderIdRef.current = null
            try {
                sessionStorage.removeItem('telas_draft_order_id')
            } catch (e) {}
        }
    }, [items.length])

    const checkoutTracked = useRef(false)
    const shippingTracked = useRef(false)
    const paymentMethodTracked = useRef<string | null>(null)

    // Track begin_checkout event
    useEffect(() => {
        if (items.length > 0 && !checkoutTracked.current) {
            checkoutTracked.current = true

            fpixel.event('InitiateCheckout', {
                value: totalPrice,
                currency: 'COP',
                content_ids: items.map(item => item.id),
                num_items: items.reduce((sum, item) => sum + item.quantity, 0)
            })

            gtag.event('begin_checkout', {
                currency: 'COP',
                value: totalPrice,
                items: items.map(item => ({
                    item_id: item.id.toString(),
                    item_name: item.name,
                    currency: 'COP',
                    price: item.price,
                    quantity: item.quantity
                }))
            })

            // Track internally for Sanity Dashboard metrics
            fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'checkout_started' })
            }).catch(console.error);
        }
    }, [items, totalPrice])

    // Track add_shipping_info when Coordinadora quote is received
    useEffect(() => {
        if (shippingQuote && items.length > 0 && !shippingTracked.current) {
            shippingTracked.current = true
            gtag.event('add_shipping_info', {
                currency: 'COP',
                value: totalPrice,
                shipping_tier: 'Coordinadora',
                items: items.map(item => ({
                    item_id: item.id.toString(),
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            })
        }
    }, [shippingQuote, items, totalPrice])

    // Track add_payment_info when payment method changes
    useEffect(() => {
        if (items.length > 0 && paymentMethodTracked.current !== paymentMethod) {
            paymentMethodTracked.current = paymentMethod
            gtag.event('add_payment_info', {
                currency: 'COP',
                value: totalPrice,
                payment_type: paymentMethod === 'wompi' ? 'Wompi (Tarjeta/PSE/Nequi)' : 'Contraentrega',
                items: items.map(item => ({
                    item_id: item.id.toString(),
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            })
        }
    }, [paymentMethod, items, totalPrice])

    // Calculate Volume Discounts (Meters, KG, Price or Percentage)
    let totalKgDiscount = 0
    let discountNoPromo = 0
    let discountPromo = 0
    const isMeterUnit = kgDiscountSettings?.discountUnit !== 'kg'
    let totalApplicableUnits = 0
    let totalApplicableKg = 0
    let appliedTierName = ""
    const isPercentagePromo = kgDiscountSettings?.discountType === 'percentage' || (!kgDiscountSettings?.discountType && !kgDiscountSettings?.discountNoPromo && !!kgDiscountSettings?.discountPercentage)
    
    const isEventActive = () => {
        if (!kgDiscountSettings?.isActive) return false;
        
        const now = new Date();
        const start = kgDiscountSettings.startDate ? new Date(kgDiscountSettings.startDate) : null;
        const end = kgDiscountSettings.endDate ? new Date(kgDiscountSettings.endDate) : null;
        
        if (start && now < start) return false;
        if (end && now > end) return false;
        
        return true;
    }

    if (isEventActive() && kgDiscountSettings) {
        let unitsNoPromo = 0
        let unitsPromo = 0
        let applicableFabricKg = 0
        let applicableFabricSubtotal = 0
        let threadCount = 0

        items.forEach((item: any) => {
            const isThread = item.categorySlugs?.some((s: string) => /hilo/i.test(s)) ||
                             item.name?.toLowerCase().includes('hilo') ||
                             item.slug?.includes('hilo');

            if (isThread) {
                threadCount += item.quantity;
            }

            const hasApplicableCategories = kgDiscountSettings.applicableCategories && kgDiscountSettings.applicableCategories.length > 0;
            const hasApplicableProducts = kgDiscountSettings.applicableProducts && kgDiscountSettings.applicableProducts.length > 0;

            let matchesCategory = false;
            let matchesProduct = false;

            if (hasApplicableCategories) {
                matchesCategory = item.categorySlugs?.some((slug: string) => kgDiscountSettings.applicableCategories.includes(slug)) ?? false;
            }

            if (hasApplicableProducts) {
                matchesProduct = kgDiscountSettings.applicableProducts.includes(item.slug);
            }

            const matches = (!hasApplicableCategories && !hasApplicableProducts) || matchesCategory || matchesProduct;

            if (matches && !isThread) {
                const itemKg = item.unit === 'kg' ? item.quantity : (item.quantity * (item.weightKg || 0.35));
                applicableFabricKg += itemKg;
                applicableFabricSubtotal += (item.price * item.quantity);

                const unitCount = isMeterUnit ? item.quantity : itemKg;
                if (item.hasPromo) {
                    unitsPromo += unitCount
                } else {
                    unitsNoPromo += unitCount
                }
            }
        })

        totalApplicableUnits = unitsNoPromo + unitsPromo
        totalApplicableKg = applicableFabricKg

        if (isPercentagePromo) {
            const tiers = kgDiscountSettings.tiers;
            if (tiers && tiers.length > 0) {
                let matchedTier: any = null;

                for (const tier of tiers) {
                    const minKg = tier.minKg ?? 0;
                    const maxKg = tier.maxKg ?? Infinity;
                    const withinRange = applicableFabricKg >= minKg && (applicableFabricKg <= maxKg || maxKg === 0);

                    if (withinRange) {
                        if (tier.requiresCombo) {
                            const requiredQty = tier.comboMinQuantity || 1;
                            if (threadCount >= requiredQty) {
                                matchedTier = tier;
                                break;
                            }
                        } else if (!matchedTier) {
                            matchedTier = tier;
                        }
                    }
                }

                if (matchedTier) {
                    appliedTierName = `${matchedTier.name || kgDiscountSettings.eventTag || 'PROMO'} (${matchedTier.discountValue}${matchedTier.discountType === 'fixed' ? '$' : '%'})`;
                    if (matchedTier.discountType === 'fixed') {
                        totalKgDiscount = Math.floor(applicableFabricKg) * (matchedTier.discountValue || 0);
                    } else {
                        totalKgDiscount = Math.round(applicableFabricSubtotal * ((matchedTier.discountValue || 0) / 100));
                    }
                } else if (applicableFabricKg >= 1 && kgDiscountSettings.discountPercentage) {
                    appliedTierName = `${kgDiscountSettings.eventTag || 'PROMO'} (${kgDiscountSettings.discountPercentage}%)`;
                    totalKgDiscount = Math.round(applicableFabricSubtotal * (kgDiscountSettings.discountPercentage / 100));
                }
            } else {
                const pct = kgDiscountSettings.discountPercentage || 0;
                appliedTierName = `${kgDiscountSettings.eventTag || 'PROMO'} (${pct}%)`;
                totalKgDiscount = Math.round(applicableFabricSubtotal * (pct / 100));
            }
        } else {
            discountNoPromo = Math.floor(unitsNoPromo) * (kgDiscountSettings.discountNoPromo || 0)
            discountPromo = Math.floor(unitsPromo) * (kgDiscountSettings.discountPromo || 0)
            totalKgDiscount = discountNoPromo + discountPromo
        }
    }

    const shippingCost = shippingQuote?.amount || 0
    const finalPriceToPay = Math.max(0, totalPrice - totalKgDiscount)

    // Si el método de pago seleccionado es COD pero el monto queda fuera de los límites permitidos ($50.000 - $100.000 COP), restablecer a Wompi
    useEffect(() => {
        if (paymentMethod === 'cod' && (finalPriceToPay < MIN_COD_AMOUNT || finalPriceToPay > MAX_COD_AMOUNT)) {
            setPaymentMethod('wompi')
        }
    }, [finalPriceToPay, paymentMethod])

    // ... existing useState code ...

    // ...

    const ensureWompiLoaded = async (): Promise<boolean> => {
        if (typeof window === 'undefined') return false
        if ((window as any).WidgetCheckout) {
            setWompiLoaded(true)
            return true
        }

        return new Promise((resolve) => {
            let script = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]') as HTMLScriptElement
            if (!script) {
                script = document.createElement('script')
                script.src = 'https://checkout.wompi.co/widget.js'
                script.async = true
                document.body.appendChild(script)
            }
            const timer = setTimeout(() => resolve(!!(window as any).WidgetCheckout), 6000)
            script.onload = () => {
                clearTimeout(timer)
                setWompiLoaded(true)
                resolve(true)
            }
            script.onerror = () => {
                clearTimeout(timer)
                resolve(false)
            }
        })
    }

    const handleWompiPayment = async (orderFormData?: any) => {
        const dataToUse = orderFormData || formData;
        setIsLoading(true)
        setLoadingMessage("Conectando con la pasarela segura Wompi...")

        let isLoaded = wompiLoaded || (typeof window !== 'undefined' && !!(window as any).WidgetCheckout)
        if (!isLoaded) {
            isLoaded = await ensureWompiLoaded()
        }

        if (!isLoaded || !(window as any).WidgetCheckout) {
            toast.error("El sistema de pago Wompi está tardando en cargar. Por favor verifica tu conexión o intenta de nuevo.")
            setIsLoading(false)
            isTransactionProcessing.current = false
            return
        }

        try {
            setLoadingMessage("Creando tu pedido en el sistema...")

            // Finalize existing draft order or create if none
            const orderResult = await createOrder(dataToUse, items, "wompi", createAccount, currentOrderIdRef.current || currentOrderId);

            if (!orderResult.success || !orderResult.orderId) {
                console.error("Order creation failed:", orderResult.error);
                toast.error(orderResult.error || 'Hubo un error al crear el pedido. Por favor intenta nuevamente.');
                setIsLoading(false);
                isTransactionProcessing.current = false;
                return;
            }

            // Store the new Order ID using orderNumber to make it short (5 digits)
            const reference = String(orderResult.orderNumber || orderResult.orderId)
            currentOrderIdRef.current = reference
            setCurrentOrderId(reference)

            // Keep the draft order ID in session storage so retries/payment method toggles reuse this order
            try {
                sessionStorage.setItem('telas_draft_order_id', reference)
            } catch (e) {}
            const confirmedTotal = typeof orderResult.total === 'number' ? orderResult.total : finalPriceToPay
            const amountInCents = Math.round(confirmedTotal * 100)
            const signature = await generateWompiSignature(reference, amountInCents)

            setLoadingMessage("Abriendo pasarela de pago...")

            // Guardar datos del pedido temporalmente para la página de confirmación
            localStorage.setItem('lastOrder', JSON.stringify({
                items,
                formData: dataToUse,
                deliveryMethod,
                totalWithIva: confirmedTotal,
                shippingCost: deliveryMethod === 'pickup' ? 0 : (orderResult.shippingCost ?? shippingCost),
                reference,
                totalKgDiscount
            }))

            // Sanitize phone (last 10 digits without prefix) and legal ID (alphanumeric only)
            const cleanPhone = (dataToUse.phone || '').replace(/\D/g, '').replace(/^57/, '').slice(-10)
            const cleanDoc = (dataToUse.documentId || '').replace(/[^\w]/g, '')

            const checkoutConfig: any = {
                currency: 'COP',
                amountInCents: amountInCents,
                reference: reference,
                publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
                signature: { integrity: signature },
                extraParameters: {
                    items: JSON.stringify(items.map(item => ({
                        product_id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        total: (item.price * item.quantity).toString()
                    })))
                },
                customerData: {
                    email: dataToUse.email.trim().toLowerCase(),
                    fullName: `${dataToUse.firstName.trim()} ${dataToUse.lastName.trim()}`,
                    phoneNumber: cleanPhone,
                    phoneNumberPrefix: '+57',
                    legalId: cleanDoc,
                    legalIdType: 'CC'
                }
            }

            if (window.location.protocol === 'https:') {
                checkoutConfig.redirectUrl = `${window.location.origin}/confirmation`
            }

            const checkout = new (window as any).WidgetCheckout(checkoutConfig)

            isTransactionProcessing.current = false

            checkout.open(async (result: any) => {
                isTransactionProcessing.current = true
                const transaction = result?.transaction

                // Si el usuario cerró la ventana de Wompi sin completar una transacción, no lo expulsamos del checkout
                if (!transaction || !transaction.id) {
                    console.log('Wompi modal closed without transaction')
                    isTransactionProcessing.current = false
                    setIsLoading(false)
                    setLoadingMessage("")
                    toast.info("No se completó el pago en Wompi. Tu carrito sigue guardado para intentar de nuevo.")
                    return
                }

                console.log('Transaction result:', transaction)
                setLoadingMessage("Verificando estado del pago...")

                const wompiDetails = {
                    transactionId: transaction.id || undefined,
                    wompiStatus: transaction.status || (transaction.id ? 'APPROVED' : undefined),
                    paymentMethodType: transaction.payment_method_type || transaction.paymentMethodType || (transaction.payment_method ? transaction.payment_method.type : undefined),
                    paymentDate: transaction.status === 'APPROVED' ? new Date().toISOString() : undefined
                }

                try {
                    if (transaction.id) {
                        await fetch(`/api/wompi/verify?id=${encodeURIComponent(transaction.id)}&orderId=${encodeURIComponent(reference)}`).catch(console.error)
                    }
                    if (transaction.status === 'APPROVED') {
                        clearCart()
                        try {
                            sessionStorage.removeItem('telas_draft_order_id')
                        } catch (e) {}
                        await updateOrderStatus(reference, 'paid', wompiDetails)
                    } else if (transaction.status === 'DECLINED' || transaction.status === 'VOIDED') {
                        await updateOrderStatus(reference, 'cancelled', wompiDetails)
                    } else if (transaction.id) {
                        await updateOrderStatus(reference, 'pending', wompiDetails)
                    }
                } catch (e) {
                    console.error("Error updating order post-checkout:", e)
                }

                // Redirigir a confirmación con el estado
                router.push(`/confirmation?status=${transaction.status || ''}&id=${transaction.id || ''}&orderId=${reference}`)
            })


        } catch (error) {
            console.error('Error initiating Wompi payment:', error)
            toast.error('Error al iniciar el pago con Wompi. Por favor intenta de nuevo.')
            isTransactionProcessing.current = false
        } finally {
            setIsLoading(false)
            setLoadingMessage("")
        }
    }
    const [createAccount, setCreateAccount] = useState(false)

    // Cotización reactiva de envío con Coordinadora
    useEffect(() => {
        if (deliveryMethod === 'pickup') {
            setShippingQuote(null)
            setShippingError(null)
            setIsQuotingShipping(false)
            return
        }

        if (!formData.daneCode || items.length === 0) {
            setShippingQuote(null)
            setShippingError(null)
            setIsQuotingShipping(false)
            return
        }

        setIsQuotingShipping(true)
        setShippingError(null)

        const timer = setTimeout(async () => {
            try {
                const res = await fetch('/api/shipping/coordinadora/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        destinationDane: formData.daneCode,
                        items: items.map(item => ({
                            productId: String(item.id || ''),
                            slug: item.slug,
                            quantity: item.quantity
                        }))
                    })
                })

                const data = await res.json()

                if (data.success && data.quote) {
                    setShippingQuote(data.quote)
                    setShippingError(null)
                } else {
                    setShippingQuote(null)
                    setShippingError(data.message || "No pudimos calcular automáticamente el envío para esta dirección. Revisa la ciudad seleccionada o intenta nuevamente.")
                }
            } catch (err) {
                console.error("Error quoting shipping:", err)
                setShippingQuote(null)
                setShippingError("No pudimos calcular automáticamente el envío para esta dirección. Revisa la ciudad seleccionada o intenta nuevamente.")
            } finally {
                setIsQuotingShipping(false)
            }
        }, 400)

        return () => clearTimeout(timer)
    }, [formData.daneCode, items, deliveryMethod])

    const [couponCode, setCouponCode] = useState("")
    const [showCoupon, setShowCoupon] = useState(false)
    const [showShippingInfo, setShowShippingInfo] = useState(false)
    const [showPickupInfo, setShowPickupInfo] = useState(false)
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [couponError, setCouponError] = useState("")
    const [couponSuccess, setCouponSuccess] = useState("")

    const handleApplyCoupon = async () => {
        if (!couponCode) return

        setIsValidating(true)
        setCouponError("")
        setCouponSuccess("")

        // Simulación de validación de cupón
        setTimeout(() => {
            const validCoupons = ["TELAS10", "BIENVENIDO", "DESCUENTO2024"]

            if (validCoupons.includes(couponCode.toUpperCase())) {
                setCouponSuccess("¡Cupón aplicado correctamente!")
            } else {
                setCouponError("El código de cupón no es válido o ha expirado")
            }
            setIsValidating(false)
        }, 1500)
    }

    // Load Wompi script
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).WidgetCheckout) {
            setWompiLoaded(true)
            return
        }

        const existingScript = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]') as HTMLScriptElement
        if (existingScript) {
            if ((window as any).WidgetCheckout) {
                setWompiLoaded(true)
            } else {
                existingScript.addEventListener('load', () => setWompiLoaded(true))
            }
            return
        }

        const script = document.createElement('script')
        script.src = 'https://checkout.wompi.co/widget.js'
        script.async = true
        script.onload = () => {
            console.log('Wompi script loaded successfully')
            setWompiLoaded(true)
        }
        script.onerror = () => {
            console.error('Failed to load Wompi script')
        }
        document.body.appendChild(script)
    }, [])

    // Auto-save draft checkout in Sanity whenever customer inputs email & phone,
    // so if they leave without paying, abandoned cart email & SMS are sent automatically.
    const triggerAutoSave = (updatedForm: any) => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

        if (updatedForm.email && updatedForm.email.includes('@') && items.length > 0) {
            autoSaveTimerRef.current = setTimeout(async () => {
                if (isSavingDraftRef.current) return
                isSavingDraftRef.current = true
                try {
                    const activeDraftId = currentOrderIdRef.current || currentOrderId
                    const formToSave = {
                        ...updatedForm,
                        deliveryMethod: updatedForm.deliveryMethod || deliveryMethod,
                        pickupAuthorizedPerson: updatedForm.pickupAuthorizedPerson || pickupNotes || undefined
                    }
                    const draftRes = await saveDraftCheckout(formToSave, items, activeDraftId)
                    if (draftRes.success) {
                        const idToSet = String(draftRes.orderNumber || draftRes.orderId || '')
                        if (idToSet) {
                            currentOrderIdRef.current = idToSet
                            setCurrentOrderId(idToSet)
                            try {
                                sessionStorage.setItem('telas_draft_order_id', idToSet)
                            } catch (e) {}
                        }
                    }
                } catch (err) {
                    console.error("Auto-save draft checkout error:", err)
                } finally {
                    isSavingDraftRef.current = false
                }
            }, 1000)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newForm = {
            ...formData,
            [e.target.name]: e.target.value,
        }
        setFormData(newForm)
        triggerAutoSave(newForm)
    }



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validaciones amigables con Toast y auto-scroll
        if (!formData.firstName || formData.firstName.trim() === "") {
            toast.error("Por favor ingresa tu nombre")
            document.getElementById('firstName')?.focus()
            return
        }

        if (!formData.lastName || formData.lastName.trim() === "") {
            toast.error("Por favor ingresa tu apellido")
            document.getElementById('lastName')?.focus()
            return
        }

        if (deliveryMethod === 'shipping') {
            if (!formData.address || formData.address.trim() === "") {
                toast.error("Por favor ingresa la dirección de entrega")
                document.getElementById('address')?.focus()
                return
            }

            if (!formData.region || formData.region.trim() === "") {
                toast.error("Por favor selecciona tu departamento")
                return
            }

            if (!formData.daneCode || !formData.city || formData.city.trim() === "") {
                toast.error("Por favor selecciona tu ciudad o población")
                return
            }
        }

        if (!formData.phone || formData.phone.trim() === "") {
            toast.error("Por favor ingresa tu número de celular")
            document.getElementById('phone')?.focus()
            return
        }

        const cleanDigits = formData.phone.replace(/\D/g, '')
        if (cleanDigits.length < 7) {
            toast.error("Por favor ingresa un número de celular válido (ej: 3001234567)")
            document.getElementById('phone')?.focus()
            return
        }

        if (!formData.email || formData.email.trim() === "" || !formData.email.includes('@')) {
            toast.error("Por favor ingresa un correo electrónico válido")
            document.getElementById('email')?.focus()
            return
        }

        if (!formData.documentId || formData.documentId.trim() === "") {
            toast.error("Por favor ingresa tu documento de identidad (C.C. o NIT)")
            document.getElementById('documentId')?.focus()
            return
        }

        if (isLoading || isTransactionProcessing.current) return;
        isTransactionProcessing.current = true;

        const isPickup = deliveryMethod === 'pickup';
        const finalFormData = {
            ...formData,
            deliveryMethod,
            address: isPickup ? STORE_PICKUP_OPTION.address : formData.address,
            apartment: isPickup ? (pickupNotes ? `Nota/Autorizado: ${pickupNotes}` : "Recoger en Tienda") : formData.apartment,
            city: isPickup ? STORE_PICKUP_OPTION.city : formData.city,
            region: isPickup ? STORE_PICKUP_OPTION.region : formData.region,
            daneCode: isPickup ? STORE_PICKUP_OPTION.daneCode : formData.daneCode,
            zipCode: isPickup ? STORE_PICKUP_OPTION.zipCode : formData.zipCode,
            notes: pickupNotes || undefined,
            pickupAuthorizedPerson: pickupNotes || undefined
        };

        // GA4: track the moment the user actually clicks "Pagar" (checkout_attempt)
        gtag.event('checkout_attempt', {
            currency: 'COP',
            value: finalPriceToPay,
            payment_type: paymentMethod === 'wompi' ? 'Wompi' : (isPickup ? 'Pago en Tienda al Recoger' : 'Contraentrega'),
            shipping_tier: isPickup ? 'Recoger en Tienda (Bogota Calle 12 # 38-65)' : 'Coordinadora',
            items: items.map(item => ({
                item_id: item.id.toString(),
                item_name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        })

        try {
            if (paymentMethod === "wompi") {
                await handleWompiPayment(finalFormData)
            } else if (paymentMethod === "cod") {
                if (finalPriceToPay < MIN_COD_AMOUNT || finalPriceToPay > MAX_COD_AMOUNT) {
                    toast.error(
                        deliveryMethod === 'pickup'
                            ? `El pago en tienda al retirar solo está disponible para pedidos entre $${MIN_COD_AMOUNT.toLocaleString('es-CO')} y $${MAX_COD_AMOUNT.toLocaleString('es-CO')} COP.`
                            : `El pago contraentrega solo está disponible para pedidos entre $${MIN_COD_AMOUNT.toLocaleString('es-CO')} y $${MAX_COD_AMOUNT.toLocaleString('es-CO')} COP.`
                    )
                    isTransactionProcessing.current = false
                    return
                }

                // Lógica para Pago Contraentrega / Pago en tienda al recoger
                setIsLoading(true)
                setLoadingMessage(isPickup ? "Confirmando pedido para retiro en tienda..." : "Procesando tu pedido...")

                // Finalize existing draft order or create if none
                const orderResult = await createOrder(finalFormData, items, "cod", createAccount, currentOrderIdRef.current || currentOrderId);

                if (!orderResult.success || !orderResult.orderId) {
                    throw new Error(orderResult.error || "Error creando el pedido");
                }

                try {
                    sessionStorage.removeItem('telas_draft_order_id')
                } catch (e) {}

                // Usamos el ID corto o el UUID si no está disponible
                const reference = String(orderResult.orderNumber || orderResult.orderId)

                // Limpiar carrito y borrador ya que el pedido Contraentrega está confirmado
                clearCart()
                try {
                    sessionStorage.removeItem('telas_draft_order_id')
                } catch (e) {}

                const confirmedTotal = typeof orderResult.total === 'number' ? orderResult.total : finalPriceToPay

                // Guardar datos del pedido temporalmente
                localStorage.setItem('lastOrder', JSON.stringify({
                    items,
                    formData: finalFormData,
                    deliveryMethod,
                    totalWithIva: confirmedTotal,
                    shippingCost: isPickup ? 0 : (orderResult.shippingCost ?? shippingCost),
                    reference,
                    paymentMethod: 'cod'
                }))

                // Redirigir a confirmación con status=PROCESSING y payment_method=cod
                router.push(`/confirmation?status=PROCESSING&payment_method=cod&id=${reference}&orderId=${reference}`)
            }
        } catch (error: any) {
            console.error('Error processing checkout:', error)
            toast.error(error?.message || 'Error al procesar el pedido. Por favor intenta nuevamente.')
            setIsLoading(false)
            isTransactionProcessing.current = false
        }
    }

    useEffect(() => {
        const fetchCustomer = async () => {
            const customer = await getCustomerData()
            if (customer) {
                setSavedCustomer(customer)
                // Pre-fill email if available
                setFormData(prev => ({ ...prev, email: customer.email || prev.email }))
            }
        }
        fetchCustomer()
    }, [])

    const handleAddressSelect = (value: string) => {
        setUseSavedAddress(value)
        if (value === "billing" && savedCustomer?.billing) {
            const savedCity = savedCustomer.billing.city || formData.city
            const savedState = savedCustomer.billing.state || formData.region
            const pob = findPopulationByCityAndDept(savedCity, savedState)
            const updatedForm = {
                ...formData,
                firstName: savedCustomer.billing.first_name || formData.firstName,
                lastName: savedCustomer.billing.last_name || formData.lastName,
                company: savedCustomer.billing.company || formData.company,
                address: savedCustomer.billing.address_1 || formData.address,
                apartment: savedCustomer.billing.address_2 || formData.apartment,
                city: pob ? pob.displayName : savedCity,
                region: pob ? pob.departamento : savedState,
                daneCode: pob ? pob.dane : (formData.daneCode || "11001000"),
                zipCode: savedCustomer.billing.postcode || formData.zipCode,
                phone: savedCustomer.billing.phone || formData.phone,
                email: savedCustomer.billing.email || formData.email,
                documentId: savedCustomer.billing.documentId || (savedCustomer as any).documentId || formData.documentId,
            }
            setFormData(updatedForm)
            triggerAutoSave(updatedForm)
        } else if (value === "shipping" && savedCustomer?.shipping) {
            const savedCity = savedCustomer.shipping.city || formData.city
            const savedState = savedCustomer.shipping.state || formData.region
            const pob = findPopulationByCityAndDept(savedCity, savedState)
            const updatedForm = {
                ...formData,
                firstName: savedCustomer.shipping.first_name || formData.firstName,
                lastName: savedCustomer.shipping.last_name || formData.lastName,
                company: savedCustomer.shipping.company || formData.company,
                address: savedCustomer.shipping.address_1 || formData.address,
                apartment: savedCustomer.shipping.address_2 || formData.apartment,
                city: pob ? pob.displayName : savedCity,
                region: pob ? pob.departamento : savedState,
                daneCode: pob ? pob.dane : (formData.daneCode || "11001000"),
                zipCode: savedCustomer.shipping.postcode || formData.zipCode,
                documentId: savedCustomer.shipping.documentId || (savedCustomer as any).documentId || formData.documentId,
            }
            setFormData(updatedForm)
            triggerAutoSave(updatedForm)
        }
    }

    // ... rest of the component

    return (
        <div className="min-h-screen">
            <main className="container mx-auto px-4 py-8 lg:py-12">
                <h1 className="text-3xl font-light mb-6 sm:mb-8">Finalizar Compra</h1>

                <form id="checkout-form" onSubmit={handleSubmit}>
                    {/* Resumen de Pedido Superior Móvil (Estilo La Poción / Shopify) */}
                    <div className="lg:hidden mb-6 rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                            className="w-full flex items-center justify-between p-4 bg-muted/25 hover:bg-muted/40 transition-colors text-left"
                            aria-expanded={mobileSummaryOpen}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-primary flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4 text-primary" />
                                    <span>Resumen del pedido</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileSummaryOpen ? 'rotate-180' : ''}`} />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1.5 text-right">
                                <span className="text-xs text-muted-foreground font-medium">COP</span>
                                <span className="font-bold text-base text-foreground tracking-tight">
                                    ${finalPriceToPay.toLocaleString('es-CO')}
                                </span>
                            </div>
                        </button>

                        {mobileSummaryOpen && (
                            <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Lista de productos con miniatura y badge numérico de cantidad */}
                                <div className="space-y-3.5 max-h-[340px] overflow-y-auto pt-2 pr-2 pb-1">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <div className="relative shrink-0 pt-1.5 pr-1.5">
                                                <div className="w-14 h-14 rounded-xl border border-border/70 overflow-hidden bg-muted/40 relative">
                                                    <Image
                                                        src={item.image || "/placeholder.svg"}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span className="absolute top-0 right-0 z-10 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-bold min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-neutral-900 leading-none">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">{item.name}</h4>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {isUnitProduct(item)
                                                        ? (item.quantity === 1 ? '1 unidad' : `${item.quantity} unidades`)
                                                        : `${item.quantity} m (${(item.quantity * 0.35).toFixed(2)} kg)`}
                                                    {item.designName ? ` · ${item.designName}` : ''}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">${item.price.toLocaleString('es-CO')} c/u</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-semibold text-xs sm:text-sm text-foreground">
                                                    ${(item.price * item.quantity).toLocaleString('es-CO')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input cupón dentro de resumen móvil */}
                                <div className="pt-2 border-t border-border/60">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Código de descuento o regalo"
                                            value={couponCode}
                                            onChange={(e) => {
                                                setCouponCode(e.target.value)
                                                setCouponError("")
                                                setCouponSuccess("")
                                            }}
                                            className="bg-white text-xs sm:text-sm h-10"
                                            disabled={isValidating}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={!couponCode || isValidating || !!couponSuccess}
                                            size="sm"
                                            variant="secondary"
                                            className="h-10 px-4 shrink-0 font-medium"
                                        >
                                            {isValidating ? "..." : "Aplicar"}
                                        </Button>
                                    </div>
                                    {couponError && <p className="text-[11px] text-destructive mt-1 font-light">{couponError}</p>}
                                    {couponSuccess && <p className="text-[11px] text-emerald-600 mt-1 font-light">{couponSuccess}</p>}
                                </div>

                                {/* Desglose de totales */}
                                <div className="pt-2 border-t border-border/60 space-y-2 text-xs sm:text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="text-foreground font-medium">${totalPrice.toLocaleString('es-CO')}</span>
                                    </div>

                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Envío</span>
                                        <span className="text-foreground font-medium">
                                            {deliveryMethod === 'pickup' 
                                                ? "Gratis (Retiro en tienda)" 
                                                : (shippingQuote ? `~$${shippingQuote.amount.toLocaleString('es-CO')} (Aprox)` : "Cotización contraentrega")}
                                        </span>
                                    </div>

                                    {totalKgDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-medium">
                                            <div className="flex flex-col">
                                                <span>{appliedTierName || "Descuento aplicado"}</span>
                                                {isPercentagePromo && totalApplicableKg > 0 && (
                                                    <span className="text-[10px] text-emerald-700/80 font-normal">
                                                        ({totalApplicableKg.toFixed(1)} kg de tela participante)
                                                    </span>
                                                )}
                                            </div>
                                            <span>- ${totalKgDiscount.toLocaleString('es-CO')}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-baseline pt-2 border-t border-border/60">
                                        <span className="text-sm sm:text-base font-bold text-foreground">Total</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[11px] text-muted-foreground">COP</span>
                                            <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                                ${finalPriceToPay.toLocaleString('es-CO')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón [ FINALIZAR COMPRA ] en resumen móvil */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full h-11 text-sm font-semibold tracking-wide"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "PROCESANDO..." : (
                                        paymentMethod === "wompi" 
                                            ? "IR A PAGAR CON WOMPI" 
                                            : (deliveryMethod === 'pickup' ? "CONFIRMAR PEDIDO PARA RETIRO" : "FINALIZAR COMPRA")
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Delivery Method Selection */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
                                <span>¿Cómo deseas recibir tu pedido?</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Option 1: Envío a Domicilio */}
                            <button
                                type="button"
                                onClick={() => handleDeliveryMethodChange('shipping')}
                                className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                                    deliveryMethod === 'shipping'
                                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary'
                                        : 'border-border bg-white hover:border-muted-foreground/30 hover:bg-muted/20'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    deliveryMethod === 'shipping'
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="font-semibold text-sm sm:text-base text-foreground">
                                            Envío a Domicilio
                                        </span>
                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                            deliveryMethod === 'shipping' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                                        }`}>
                                            {deliveryMethod === 'shipping' && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Despacho nacional a tu dirección a través de Coordinadora Mercantil.
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Recoger en Tienda */}
                            <button
                                type="button"
                                onClick={() => handleDeliveryMethodChange('pickup')}
                                className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                                    deliveryMethod === 'pickup'
                                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-600'
                                        : 'border-border bg-white hover:border-muted-foreground/30 hover:bg-muted/20'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    deliveryMethod === 'pickup'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                    <Store className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold text-sm sm:text-base text-foreground">
                                                Recoger en Tienda
                                            </span>
                                            <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                                Gratis
                                            </span>
                                        </div>
                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                            deliveryMethod === 'pickup' ? 'border-emerald-600 bg-emerald-600' : 'border-muted-foreground/40'
                                        }`}>
                                            {deliveryMethod === 'pickup' && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Retira sin costo de envío en nuestra sede principal Bogotá.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Notice when pickup is active */}
                        {deliveryMethod === 'pickup' && (
                            <div className="mt-3.5 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-950 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <p className="truncate">
                                        <strong>Sede Bogotá:</strong> Calle 12 # 38-65 · {STORE_PICKUP_OPTION.schedule}
                                    </p>
                                </div>
                                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                    Gratis
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Billing Details / Contact Details */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-light">
                                {deliveryMethod === 'pickup' ? "Datos de quien retira el pedido" : "Detalles de facturación y entrega"}
                            </h2>
                            {deliveryMethod === 'shipping' && savedCustomer && (
                                <div className="w-64">
                                    <Select value={useSavedAddress} onValueChange={handleAddressSelect}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Usar dirección guardada" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nueva dirección</SelectItem>
                                            {savedCustomer.billing?.address_1 && (
                                                <SelectItem value="billing">Facturación: {savedCustomer.billing.address_1}</SelectItem>
                                            )}
                                            {savedCustomer.shipping?.address_1 && (
                                                <SelectItem value="shipping">Envío: {savedCustomer.shipping.address_1}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">Nombre *</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Apellido *</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="documentId">
                                    Documento de identidad (C.C. o NIT) *
                                </Label>
                                <Input
                                    id="documentId"
                                    name="documentId"
                                    value={formData.documentId}
                                    onChange={handleInputChange}
                                    onBlur={() => triggerAutoSave(formData)}
                                    placeholder="Número de cédula o NIT"
                                    className="bg-white"
                                    required
                                />
                                {deliveryMethod === 'pickup' && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Presentar este documento al momento de retirar tus telas en la tienda.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Celular *</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="Ej: 3001234567"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        onBlur={() => triggerAutoSave(formData)}
                                        className="bg-white"
                                        required
                                    />
                                    {deliveryMethod === 'pickup' && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Te avisaremos por WhatsApp cuando tu pedido esté empacado.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="email">Correo electrónico *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        onBlur={() => triggerAutoSave(formData)}
                                        className="bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="company">Nombre de la compañía (opcional)</Label>
                                <Input
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    className="bg-white"
                                />
                            </div>

                            {/* Additional field for pickup authorization */}
                            {deliveryMethod === 'pickup' && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <Label htmlFor="pickupAuthorizedPerson">
                                            Persona o mensajería autorizada para recoger (opcional)
                                        </Label>
                                        <Input
                                            id="pickupAuthorizedPerson"
                                            name="pickupAuthorizedPerson"
                                            placeholder="Ej: Mensajero / Pedro Pérez - C.C. 12345678"
                                            value={pickupNotes}
                                            onChange={(e) => setPickupNotes(e.target.value)}
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Si enviarás a otra persona o transporte a retirar, indica su nombre y documento aquí.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs sm:text-sm space-y-1 text-muted-foreground">
                                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                                            <Store className="w-4 h-4 text-emerald-600" />
                                            Punto de recogida asignado:
                                        </p>
                                        <p className="font-medium text-foreground">
                                            Telas Real · Sede Bogotá Calle 12 # 38-65
                                        </p>
                                        <p>Bogotá, Cundinamarca, Colombia</p>
                                        <p className="text-xs text-muted-foreground pt-0.5">
                                            Horario continuo: {STORE_PICKUP_OPTION.schedule}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Shipping address fields only if deliveryMethod is shipping */}
                            {deliveryMethod === 'shipping' && (
                                <div className="space-y-6 pt-2">
                                    <div>
                                        <Label htmlFor="country">País / Región *</Label>
                                        <Input
                                            id="country"
                                            value="Colombia"
                                            disabled
                                            className="bg-white"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="address">Dirección de la calle *</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="bg-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="apartment">Apartamento, habitación, escalera, etc. (opcional)</Label>
                                        <Input
                                            id="apartment"
                                            name="apartment"
                                            value={formData.apartment}
                                            onChange={handleInputChange}
                                            className="bg-white"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="region">Departamento *</Label>
                                        <Select
                                            value={formData.region}
                                            onValueChange={(value) => {
                                                const deptCities = getPopulationsByDepartment(value)
                                                const firstCity = deptCities.length > 0 ? deptCities[0] : null
                                                const updatedForm = {
                                                    ...formData,
                                                    region: value,
                                                    city: firstCity ? firstCity.displayName : "",
                                                    daneCode: firstCity ? firstCity.dane : ""
                                                }
                                                setFormData(updatedForm)
                                                triggerAutoSave(updatedForm)
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Selecciona tu departamento" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getDepartments().map((dept) => (
                                                    <SelectItem key={dept} value={dept}>
                                                        {dept}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="city">Población / Ciudad *</Label>
                                        <Select
                                            value={formData.daneCode || ""}
                                            onValueChange={(daneVal) => {
                                                const pob = findPopulationByDane(daneVal)
                                                const updatedForm = {
                                                    ...formData,
                                                    daneCode: daneVal,
                                                    city: pob ? pob.displayName : formData.city
                                                }
                                                setFormData(updatedForm)
                                                triggerAutoSave(updatedForm)
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Selecciona tu ciudad">
                                                    {formData.city || "Selecciona tu ciudad"}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getPopulationsByDepartment(formData.region).map((p) => (
                                                    <SelectItem key={p.dane} value={p.dane}>
                                                        {p.displayName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="zipCode">Código postal / ZIP (opcional)</Label>
                                        <Input
                                            id="zipCode"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="bg-muted/30 rounded-2xl p-6 sticky top-24 border border-border/60">
                            <h2 className="text-xl sm:text-2xl font-light mb-5">Tu Orden</h2>

                            {/* Product items list with Shopify style thumbnail and quantity badge */}
                            <div className="space-y-3.5 mb-5 max-h-[380px] overflow-y-auto pt-2 pr-2 pb-1">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-border/50 last:border-b-0 last:pb-0">
                                        <div className="relative shrink-0 pt-1.5 pr-1.5">
                                            <div className="w-14 h-14 rounded-xl border border-border/70 overflow-hidden bg-muted/40 relative">
                                                <Image
                                                    src={item.image || "/placeholder.svg"}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <span className="absolute top-0 right-0 z-10 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-bold min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-neutral-900 leading-none">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-medium text-xs sm:text-sm text-foreground truncate">{item.name}</p>
                                                <span className="font-semibold text-xs sm:text-sm text-foreground shrink-0">
                                                    ${(item.price * item.quantity).toLocaleString('es-CO')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {isUnitProduct(item)
                                                    ? (item.quantity === 1 ? '1 unidad' : `${item.quantity} unidades`)
                                                    : `${item.quantity} m (${(item.quantity * 0.35).toFixed(2)} kg)`}
                                                {item.designName ? ` · ${item.designName}` : ''}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">${item.price.toLocaleString('es-CO')} c/u</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Subtotal & Savings */}
                            {(() => {
                                const originalTotal = items.reduce((sum, item) => sum + (item.regularPrice || item.price) * item.quantity, 0);
                                const totalSavings = originalTotal > totalPrice ? originalTotal - totalPrice : 0;
                                return (
                                    <div className="space-y-2 py-3 border-t border-border/60 text-xs sm:text-sm">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <div className="text-right">
                                                {totalSavings > 0 && (
                                                    <span className="text-xs text-muted-foreground line-through mr-2">
                                                        ${originalTotal.toLocaleString('es-CO')}
                                                    </span>
                                                )}
                                                <span className="text-foreground font-medium">${totalPrice.toLocaleString('es-CO')}</span>
                                            </div>
                                        </div>
                                        {totalSavings > 0 && (
                                            <div className="flex justify-between text-emerald-600 font-medium text-xs">
                                                <span>Ahorro total</span>
                                                <span>-${totalSavings.toLocaleString('es-CO')}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}

                            {/* Shipping Line & Collapsible Info */}
                            <div className="py-3 border-t border-border/60">
                                {deliveryMethod === 'pickup' ? (
                                    <div>
                                        <div className="flex items-center justify-between text-xs sm:text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                                <Store className="w-4 h-4 text-emerald-600" />
                                                Recoger en Tienda
                                            </span>
                                            <span className="font-semibold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                                                $0 COP (Gratis)
                                            </span>
                                        </div>

                                        {/* Desplegable información retiro en tienda */}
                                        <div className="mt-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setShowPickupInfo(!showPickupInfo)}
                                                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-emerald-950 dark:text-emerald-200 hover:bg-emerald-100/40 transition-colors text-left"
                                                aria-expanded={showPickupInfo}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Store className="w-4 h-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
                                                    <span>Información sobre retiro en tienda</span>
                                                </span>
                                                <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 transition-transform duration-200 ${showPickupInfo ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showPickupInfo && (
                                                <div className="px-3.5 pb-3.5 pt-1 text-xs text-muted-foreground space-y-2 border-t border-emerald-200/50 dark:border-emerald-800/40 bg-background/50 animate-in fade-in duration-200">
                                                    <div className="flex items-start gap-2 pt-1.5">
                                                        <span className="text-emerald-600 font-bold">•</span>
                                                        <div>
                                                            <strong className="text-foreground font-medium">Punto de entrega:</strong> Calle 12 # 38-65, Bogotá, Cundinamarca (Telas Real).
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-emerald-600 font-bold">•</span>
                                                        <div>
                                                            <strong className="text-foreground font-medium">Horario de atención:</strong> {STORE_PICKUP_OPTION.schedule}.
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-emerald-600 font-bold">•</span>
                                                        <div>
                                                            <strong className="text-foreground font-medium">Condiciones:</strong> Te avisaremos por WhatsApp y correo cuando tu tela esté cortada y empacada para que pases a retirarla presentando documento o número de orden.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between text-xs sm:text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                                <Truck className="w-4 h-4 text-primary" />
                                                Envío Coordinadora
                                            </span>
                                            <div className="text-right">
                                                {!formData.daneCode ? (
                                                    <span className="text-xs text-muted-foreground italic">Selecciona tu ciudad</span>
                                                ) : isQuotingShipping ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-primary animate-pulse font-medium">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cotizando...
                                                    </span>
                                                ) : shippingQuote ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                                                            ~${shippingQuote.amount.toLocaleString('es-CO')} COP
                                                        </span>
                                                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                                                            Pago al recibir (flete)
                                                        </span>
                                                    </div>
                                                ) : shippingError ? (
                                                    <span className="text-xs text-amber-700 dark:text-amber-400">A calcular en destino</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Selecciona tu ciudad</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Desplegable información sobre tu envío */}
                                        <div className="mt-2.5 rounded-xl border border-border/80 bg-muted/20 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setShowShippingInfo(!showShippingInfo)}
                                                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors text-left"
                                                aria-expanded={showShippingInfo}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Truck className="w-4 h-4 text-primary shrink-0" />
                                                    <span>Información sobre tu envío</span>
                                                </span>
                                                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showShippingInfo ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showShippingInfo && (
                                                <div className="px-3.5 pb-3.5 pt-1 text-xs text-muted-foreground space-y-2 border-t border-border/40 bg-background/50 animate-in fade-in duration-200">
                                                    <div className="flex items-start gap-2 pt-1.5">
                                                        <span className="text-primary font-bold">•</span>
                                                        <div>
                                                            <strong className="text-foreground font-medium">Cotización aproximada:</strong> El valor cotizado {shippingQuote ? `(~$${shippingQuote.amount.toLocaleString('es-CO')} COP)` : ''} es un cálculo estimado de Coordinadora Mercantil según el peso y destino. <strong className="text-foreground font-medium">No se cobra en este pedido;</strong> el flete se abona directamente a la transportadora al momento de recibir tus telas.
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-primary font-bold">•</span>
                                                        <div>
                                                            <strong className="text-foreground font-medium">Peso estimado del pedido:</strong> ~{(items.reduce((acc: number, item: any) => acc + (item.quantity * 0.35), 0)).toFixed(2)} kg (* Se calcula con base a un promedio de 350g por metro o unidad).
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-primary font-bold">•</span>
                                                        <div>
                                                            <strong className="text-foreground font-medium">Condiciones de Coordinadora:</strong> Despacho nacional puerta a puerta. Pedidos antes de la 1:00 PM se despachan el mismo día; después de la 1:00 PM al día siguiente. Tiempo estimado de entrega: {shippingQuote?.estimatedBusinessDays ? `${shippingQuote.estimatedBusinessDays} días hábiles` : '1 a 3 días hábiles'} según la ciudad. El número de guía se enviará a tu WhatsApp y correo.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Descuentos promocionales si aplican */}
                            {totalKgDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 py-2 border-t border-border/60 text-xs sm:text-sm font-medium">
                                    <div className="flex flex-col">
                                        <span>{appliedTierName || kgDiscountSettings?.eventTag || (isMeterUnit ? "Descuento por Metros" : "Descuento por KG")}</span>
                                        {isPercentagePromo && totalApplicableKg > 0 && (
                                            <span className="text-[11px] text-emerald-700/80 font-normal">
                                                ({totalApplicableKg.toFixed(1)} kg de tela participante)
                                            </span>
                                        )}
                                    </div>
                                    <span>- ${totalKgDiscount.toLocaleString('es-CO')}</span>
                                </div>
                            )}

                            {/* Cupón desplegable cerrado por defecto */}
                            <div className="my-3 border-t border-b border-border/80 py-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCoupon(!showCoupon)}
                                    className="flex items-center justify-between w-full text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors text-left"
                                    aria-expanded={showCoupon}
                                >
                                    <span className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-primary shrink-0" />
                                        <span>¿Tienes un cupón de descuento?</span>
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showCoupon ? 'rotate-180' : ''}`} />
                                </button>
                                {showCoupon && (
                                    <div className="space-y-2 mt-3 animate-in fade-in duration-200">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Código de cupón o regalo"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value)
                                                    setCouponError("")
                                                    setCouponSuccess("")
                                                }}
                                                className="flex-1 bg-white text-xs sm:text-sm h-10"
                                                disabled={isValidating}
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode || isValidating || !!couponSuccess}
                                                size="sm"
                                                variant="secondary"
                                                className="h-10 px-4 font-medium shrink-0"
                                            >
                                                {isValidating ? "..." : "Aplicar"}
                                            </Button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-destructive font-light">{couponError}</p>
                                        )}
                                        {couponSuccess && (
                                            <p className="text-xs text-emerald-600 font-light">{couponSuccess}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Total a Pagar */}
                            <div className="py-3 border-b border-border/60">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-base sm:text-lg font-bold text-foreground">Total a Pagar</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xs text-muted-foreground font-medium">COP</span>
                                        <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                                            ${finalPriceToPay.toLocaleString('es-CO')}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground text-right mt-1">
                                    {deliveryMethod === 'pickup'
                                        ? "* Sin costo de flete por retiro en tienda física."
                                        : "* Flete de envío Coordinadora se cancela contraentrega al recibir."}
                                </p>
                            </div>

                            {/* Métodos de Pago Simplificados */}
                            <div className="my-5">
                                <h3 className="font-semibold text-sm sm:text-base mb-3 text-foreground">Método de pago</h3>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                                    {/* Wompi Option */}
                                    <div
                                        onClick={() => setPaymentMethod('wompi')}
                                        className={`border rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer ${
                                            paymentMethod === 'wompi'
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                                                : 'border-border bg-white hover:border-muted-foreground/30'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <RadioGroupItem value="wompi" id="wompi" className="mt-1" />
                                            <div className="flex-1 min-w-0">
                                                <Label htmlFor="wompi" className="cursor-pointer font-bold text-sm sm:text-base text-foreground block">
                                                    Pago en línea con Wompi
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Nequi · Daviplata · Bancolombia · PSE · Visa · Mastercard
                                                </p>
                                                {paymentMethod === 'wompi' && (
                                                    <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-primary/10">
                                                        Paga de forma 100% segura con tus medios de pago favoritos a través de Wompi Bancolombia.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contraentrega / Pago en Tienda Option */}
                                    {(() => {
                                        const isPickup = deliveryMethod === 'pickup'
                                        const isOutOfRange = finalPriceToPay > MAX_COD_AMOUNT || finalPriceToPay < MIN_COD_AMOUNT

                                        return (
                                            <div
                                                onClick={() => {
                                                    if (isOutOfRange) {
                                                        toast.info(`El pago contraentrega está disponible para pedidos entre $${MIN_COD_AMOUNT.toLocaleString('es-CO')} y $${MAX_COD_AMOUNT.toLocaleString('es-CO')} COP.`)
                                                        return
                                                    }
                                                    setPaymentMethod('cod')
                                                }}
                                                className={`border rounded-xl p-3.5 sm:p-4 transition-all ${
                                                    isOutOfRange ? 'opacity-60 bg-muted/20 cursor-pointer' : 'cursor-pointer'
                                                } ${
                                                    paymentMethod === 'cod'
                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                                                        : 'border-border bg-white hover:border-muted-foreground/30'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <RadioGroupItem
                                                        value="cod"
                                                        id="cod"
                                                        disabled={isOutOfRange}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <Label htmlFor="cod" className={`cursor-pointer font-bold text-sm sm:text-base block ${isOutOfRange ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                            {isPickup ? "Pagar en tienda al retirar" : "Pago contraentrega"}
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {isPickup ? "Efectivo, tarjeta o transferencia en tienda" : "Efectivo al recibir"}
                                                        </p>

                                                        {/* CONDICIONES PARTICULARES: SOLO APARECEN CUANDO EL CLIENTE SELECCIONE ESTE MÉTODO */}
                                                        {paymentMethod === 'cod' && (
                                                            <div className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-2 animate-in fade-in duration-200">
                                                                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-lg text-amber-950 dark:text-amber-100 leading-relaxed">
                                                                    <div className="flex gap-2 items-start">
                                                                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                                        <div>
                                                                            <p className="font-semibold text-xs">Condición del método contraentrega:</p>
                                                                            <p className="text-[11px] mt-0.5 leading-relaxed">
                                                                                Disponible para pedidos entre ${MIN_COD_AMOUNT.toLocaleString('es-CO')} y ${MAX_COD_AMOUNT.toLocaleString('es-CO')} COP.
                                                                                {isPickup 
                                                                                    ? " Cancelarás el valor de tus productos directamente al retirar en nuestra sede de Bogotá."
                                                                                    : " Pagas el valor del pedido en efectivo directamente al mensajero de Coordinadora al recibir el paquete."}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </RadioGroup>
                            </div>

                            {/* Botón de Pago Principal */}
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-12 text-sm sm:text-base font-semibold tracking-wide shadow-sm mt-5"
                                disabled={isLoading}
                            >
                                {isLoading ? "PROCESANDO..." : (
                                    paymentMethod === "wompi" 
                                        ? "IR A PAGAR CON WOMPI" 
                                        : (deliveryMethod === 'pickup' ? "CONFIRMAR PEDIDO PARA RETIRO" : "FINALIZAR COMPRA")
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Full Screen Loader Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-8 max-w-sm w-full text-center border border-border">
                        <div className="relative w-48 h-16 mx-auto mb-8 mt-4">
                            <style dangerouslySetInnerHTML={{__html: `
                                @keyframes logoFillClip {
                                    0% { clip-path: inset(100% 0 0 0); }
                                    100% { clip-path: inset(0% 0 0 0); }
                                }
                            `}} />
                            <Image src="/logo-loading.png" alt="Cargando..." fill className="object-contain opacity-20 grayscale" />
                            <div className="absolute inset-0" style={{ animation: 'logoFillClip 6s cubic-bezier(0.1, 0.7, 0.1, 1) forwards' }}>
                                <Image src="/logo-loading.png" alt="Cargando..." fill className="object-contain" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Un momento por favor</h3>
                        <p className="text-muted-foreground animate-pulse mb-6">
                            {loadingMessage || "Procesando tu solicitud..."}
                        </p>
                    </div>
                </div>
            )}
        </main>
    </div>
)
}
