"use client"


import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/lib/contexts/CartContext"
import { Shield, Lock, Truck, DollarSign, Loader2, Clock } from "lucide-react"
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

const MIN_COD_AMOUNT = 20000
const MAX_COD_AMOUNT = 100000 // Configurable limit for Cash on Delivery

export default function CheckoutPage() {
    const router = useRouter()
    const { items, totalPrice, clearCart } = useCart()
    const [acceptTerms, setAcceptTerms] = useState(true)
    const [acceptDataPolicy, setAcceptDataPolicy] = useState(true)
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
            "applicableProducts": applicableProducts[]->slug.current
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

    // Calculate Volume Discounts (Meters or KG)
    let totalKgDiscount = 0
    let discountNoPromo = 0
    let discountPromo = 0
    const isMeterUnit = kgDiscountSettings?.discountUnit !== 'kg'
    let totalApplicableUnits = 0
    
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

        items.forEach((item: any) => {
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

            if (matches) {
                const unitCount = isMeterUnit ? item.quantity : (item.quantity * 0.35);
                if (item.hasPromo) {
                    unitsPromo += unitCount
                } else {
                    unitsNoPromo += unitCount
                }
            }
        })

        totalApplicableUnits = unitsNoPromo + unitsPromo
        discountNoPromo = Math.floor(unitsNoPromo) * (kgDiscountSettings.discountNoPromo || 0)
        discountPromo = Math.floor(unitsPromo) * (kgDiscountSettings.discountPromo || 0)
        totalKgDiscount = discountNoPromo + discountPromo
    }

    const shippingCost = shippingQuote?.amount || 0
    // El envío es una cotizadora informativa (aproximado) y NO se suma al total del pedido a pagar en línea
    const finalPriceToPay = Math.max(0, totalPrice - totalKgDiscount)

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

    const handleWompiPayment = async () => {
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
            const orderResult = await createOrder(formData, items, "wompi", createAccount, currentOrderIdRef.current || currentOrderId);

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
                formData,
                totalWithIva: confirmedTotal,
                shippingCost: orderResult.shippingCost ?? shippingCost,
                reference,
                totalKgDiscount
            }))

            // Sanitize phone (last 10 digits without prefix) and legal ID (alphanumeric only)
            const cleanPhone = (formData.phone || '').replace(/\D/g, '').replace(/^57/, '').slice(-10)
            const cleanDoc = (formData.documentId || '').replace(/[^\w]/g, '')

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
                    email: formData.email.trim().toLowerCase(),
                    fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
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
    }, [formData.daneCode, items])

    const [couponCode, setCouponCode] = useState("")
    const [showCoupon, setShowCoupon] = useState(false)
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
    const triggerAutoSave = (updatedForm: typeof formData) => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

        if (updatedForm.email && updatedForm.email.includes('@') && items.length > 0) {
            autoSaveTimerRef.current = setTimeout(async () => {
                if (isSavingDraftRef.current) return
                isSavingDraftRef.current = true
                try {
                    const activeDraftId = currentOrderIdRef.current || currentOrderId
                    const draftRes = await saveDraftCheckout(updatedForm, items, activeDraftId)
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

        if (!acceptTerms) {
            toast.error("Debes aceptar los términos y condiciones del sitio web para continuar")
            document.getElementById('terms')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        if (!acceptDataPolicy) {
            toast.error("Debes aceptar la política de tratamiento de datos para continuar")
            document.getElementById('data-policy')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        if (isLoading || isTransactionProcessing.current) return;
        isTransactionProcessing.current = true;

        try {
            if (paymentMethod === "wompi") {
                await handleWompiPayment()
            } else if (paymentMethod === "cod") {
                // Lógica para Pago Contraentrega
                setIsLoading(true)
                setLoadingMessage("Procesando tu pedido...")

                // Finalize existing draft order or create if none
                const orderResult = await createOrder(formData, items, "cod", createAccount, currentOrderIdRef.current || currentOrderId);

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
                    formData,
                    totalWithIva: confirmedTotal,
                    shippingCost: orderResult.shippingCost ?? shippingCost,
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
                {/* ... title */}

                <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Billing Details */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-light">Detalles de facturación</h2>
                            {savedCustomer && (
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

                        <div className="space-y-8">
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
                                <Label htmlFor="company">Nombre de la compañía (opcional)</Label>
                                <Input
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    className="bg-white"
                                />
                            </div>

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

                            <div>
                                <Label htmlFor="phone">Celular *</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    onBlur={() => triggerAutoSave(formData)}
                                    className="bg-white"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">Correo *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    onBlur={() => triggerAutoSave(formData)}
                                    className="bg-white"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="documentId">Documento de identidad *</Label>
                                <Input
                                    id="documentId"
                                    name="documentId"
                                    value={formData.documentId}
                                    onChange={handleInputChange}
                                    onBlur={() => triggerAutoSave(formData)}
                                    className="bg-white"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="bg-muted/30 rounded-lg p-6 sticky top-4">
                            <h2 className="text-2xl font-light mb-6">Tu Orden</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm font-medium border-b pb-2">
                                    <span>Producto</span>
                                    <span>Subtotal</span>
                                </div>

                                {items.map((item) => (
                                    <div key={item.id} className="border-b pb-4">
                                        <div className="flex gap-3 items-start">
                                            <Image
                                                src={item.image || "/placeholder.svg"}
                                                alt={item.name}
                                                width={60}
                                                height={60}
                                                className="rounded-md object-cover flex-shrink-0 self-center"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <p className="font-medium text-sm">{item.name}</p>
                                                    <div className="flex flex-col items-end flex-shrink-0">
                                                        {item.regularPrice && item.regularPrice > item.price ? (
                                                            <>
                                                                <p className="font-medium text-sm text-red-600">${(item.price * item.quantity).toLocaleString()}</p>
                                                                <p className="text-xs text-muted-foreground line-through">${(item.regularPrice * item.quantity).toLocaleString()}</p>
                                                            </>
                                                        ) : (
                                                            <p className="font-medium text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Cantidad: {item.quantity} {(() => {
                                                        const isUnit = isUnitProduct(item)
                                                        return isUnit ? (item.quantity === 1 ? 'unidad' : 'unidades') : (item.quantity === 1 ? 'metro' : 'metros')
                                                    })()}{!isUnitProduct(item) ? ` (${(item.quantity * 0.35).toFixed(2)} kg)` : ''}
                                                </p>
                                                {(item.designName || item.isCustom) && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.designName && <p>Diseño: {item.designName}</p>}
                                                        {item.isCustom && <p>Producto personalizado</p>}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">${item.price.toLocaleString()} c/u</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(() => {
                                    const originalTotal = items.reduce((sum, item) => sum + (item.regularPrice || item.price) * item.quantity, 0);
                                    const totalSavings = originalTotal > totalPrice ? originalTotal - totalPrice : 0;
                                    return (
                                        <div className="flex justify-between pt-2">
                                            <span className="font-medium">Subtotal</span>
                                            <div className="text-right">
                                                {totalSavings > 0 && (
                                                    <p className="text-sm font-medium text-muted-foreground line-through">
                                                        ${originalTotal.toLocaleString()}
                                                    </p>
                                                )}
                                                <p className="font-medium text-primary">${totalPrice.toLocaleString()}</p>
                                                {totalSavings > 0 && (
                                                    <p className="text-xs font-medium text-red-600 mt-1">
                                                        Ahorraste: ${totalSavings.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })()}

                                <div className="pt-3 border-t">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-bold text-[15px] sm:text-base flex items-center gap-2 text-foreground">
                                                <Truck className="w-5 h-5 text-primary shrink-0" />
                                                Cotización de Envío Coordinadora
                                            </span>
                                            <span className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                Cotización aproximada · Pago al recibir (contraentrega)
                                            </span>
                                            {shippingQuote && shippingQuote.estimatedBusinessDays && (
                                                <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 shrink-0" />
                                                    Entrega estimada: {shippingQuote.estimatedBusinessDays} {shippingQuote.estimatedBusinessDays === 1 ? 'día hábil' : 'días hábiles'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 bg-muted/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none shrink-0">
                                            {!formData.daneCode ? (
                                                <span className="text-xs sm:text-sm text-muted-foreground italic">
                                                    Selecciona tu ciudad para cotizar
                                                </span>
                                            ) : isQuotingShipping ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary animate-pulse font-medium">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Cotizando flete...
                                                </span>
                                            ) : shippingQuote ? (
                                                <div className="flex items-center sm:items-end justify-between sm:justify-start sm:flex-col w-full sm:w-auto gap-2 sm:gap-1">
                                                    <span className="font-bold text-base sm:text-lg text-foreground tracking-tight whitespace-nowrap">
                                                        ~${shippingQuote.amount.toLocaleString()} COP
                                                    </span>
                                                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-300/80 dark:border-amber-700/60 whitespace-nowrap">
                                                        Valor aproximado
                                                    </span>
                                                </div>
                                            ) : shippingError ? (
                                                <span className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 block text-left sm:text-right max-w-full sm:max-w-[240px]">
                                                    {shippingError}
                                                </span>
                                            ) : (
                                                <span className="text-xs sm:text-sm text-muted-foreground italic">
                                                    Selecciona tu ciudad para cotizar
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {shippingQuote && (
                                        <div className="mt-3 p-3.5 sm:p-4 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs sm:text-sm text-blue-950 dark:text-blue-100 leading-relaxed shadow-xs">
                                            <div className="flex items-start gap-2.5">
                                                <span className="text-base sm:text-lg shrink-0 leading-none pt-0.5 select-none">📦</span>
                                                <p>
                                                    <strong className="font-semibold text-blue-900 dark:text-blue-200">Cotizador de envío:</strong> Este valor es un aproximado calculado por Coordinadora según el peso y destino. <strong className="font-semibold text-blue-900 dark:text-blue-200">No se cobra en este pedido;</strong> el flete se paga directamente a la transportadora al recibir tus telas.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-start gap-4 pt-4 border-t mt-2">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Peso estimado del pedido</span>
                                        <span className="text-xs text-muted-foreground leading-tight max-w-[220px]">
                                            * Se calcula con base a un promedio de 350g por metro/unidad.
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium whitespace-nowrap">
                                        ~{(items.reduce((acc: number, item: any) => acc + (item.quantity * 0.35), 0)).toFixed(2)} kg
                                    </span>
                                </div>

                                {totalKgDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 pt-2 border-t mt-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {kgDiscountSettings?.eventTag || (isMeterUnit ? "Descuento por Metros" : "Descuento por KG")}
                                            </span>
                                            <span className="text-xs text-green-700 dark:text-green-400 font-light">
                                                ({Math.floor(totalApplicableUnits)} {isMeterUnit ? 'metros aplicables' : 'kg estimados'})
                                            </span>
                                        </div>
                                        <span className="font-medium">- ${totalKgDiscount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="border-t mt-4 pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total a Pagar</span>
                                        <span>${finalPriceToPay.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right mt-1.5">
                                        * Solo productos. El flete cotizado es aproximado y se abona contraentrega al recibir.
                                    </p>
                                </div>
                            </div>


                            {/* Coupon Section */}
                            <div className="mb-6 border-t border-b border-border py-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCoupon(!showCoupon)}
                                    className="flex items-center justify-between w-full text-sm font-medium mb-2"
                                >
                                    <span>¿Tienes un código de descuento?</span>
                                    <span className="text-lg">{showCoupon ? "−" : "+"}</span>
                                </button>
                                {showCoupon && (
                                    <div className="space-y-2 mt-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Código de cupón"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value)
                                                    setCouponError("")
                                                    setCouponSuccess("")
                                                }}
                                                className="flex-1 bg-white"
                                                disabled={isValidating}
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode || isValidating || !!couponSuccess}
                                            >
                                                {isValidating ? "Validando..." : "Aplicar"}
                                            </Button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-destructive font-light">{couponError}</p>
                                        )}
                                        {couponSuccess && (
                                            <p className="text-xs text-green-600 font-light">{couponSuccess}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Payment Methods */}
                            <div className="mb-6">
                                <h3 className="font-medium mb-4">Método de pago</h3>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <div className="border rounded-lg p-4 mb-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <RadioGroupItem value="wompi" id="wompi" />
                                            <Label htmlFor="wompi" className="flex-1 cursor-pointer font-bold">
                                                Pagar con Wompi
                                            </Label>
                                        </div>

                                        <div className="pl-6 mb-3">
                                            <p className="text-sm text-muted-foreground mb-2">Estos son todos nuestros métodos de pago:</p>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <div className="bg-white p-1 border rounded h-8 w-12 flex items-center justify-center relative">
                                                    <Image src="/nequi-logo.png" alt="Nequi" fill className="object-contain p-2" />
                                                </div>
                                                <div className="bg-white p-1 border rounded h-8 w-12 flex items-center justify-center relative">
                                                    <Image src="/daviplata-logo.png" alt="Daviplata" fill className="object-contain p-1" />
                                                </div>
                                                <div className="bg-white p-1 border rounded h-8 w-12 flex items-center justify-center relative">
                                                    <Image src="/bancolombia-logo.png" alt="Bancolombia" fill className="object-contain p-1" />
                                                </div>
                                                <div className="bg-white p-1 border rounded h-8 w-12 flex items-center justify-center relative">
                                                    <Image src="/pse-logo.png" alt="PSE" fill className="object-contain p-1" />
                                                </div>
                                                <div className="bg-white p-1 border rounded h-8 w-12 flex items-center justify-center relative">
                                                    <Image src="/visa-logo.png" alt="Visa" fill className="object-contain p-2" />
                                                </div>
                                                <div className="bg-white p-1 border rounded h-8 w-12 flex items-center justify-center relative">
                                                    <Image src="/mastercard-logo.png" alt="Mastercard" fill className="object-contain p-2" />
                                                </div>
                                            </div>
                                        </div>

                                        {paymentMethod === "wompi" && (
                                            <div className="mt-3 text-sm text-muted-foreground pl-6">
                                                <p>Paga de forma segura con tus medios de pago favoritos a través de Wompi.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pago Contraentrega Option */}
                                    <div className={`border rounded-lg p-4 ${finalPriceToPay > MAX_COD_AMOUNT || finalPriceToPay < MIN_COD_AMOUNT ? 'opacity-60 bg-gray-50' : ''}`}>
                                        <div className="flex items-center space-x-2 mb-3">
                                            <RadioGroupItem
                                                value="cod"
                                                id="cod"
                                                disabled={finalPriceToPay > MAX_COD_AMOUNT || finalPriceToPay < MIN_COD_AMOUNT}
                                            />
                                            <Label htmlFor="cod" className="flex-1 cursor-pointer font-bold">
                                                Pago Contraentrega
                                            </Label>
                                        </div>
                                        <div className="pl-6">
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Paga en efectivo al recibir tu pedido.
                                            </p>
                                            {(finalPriceToPay > MAX_COD_AMOUNT || finalPriceToPay < MIN_COD_AMOUNT) && (
                                                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 flex gap-2 items-start">
                                                    <span className="text-lg leading-none">⚠️</span>
                                                    <p>
                                                        El pago contraentrega solo está disponible para pedidos entre ${MIN_COD_AMOUNT.toLocaleString()} y ${MAX_COD_AMOUNT.toLocaleString()}.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Shipping Disclaimer & Dispatch Schedule */}
                            <ShippingDispatchNotice variant="checkout" className="mb-4" />

                            {/* Privacy Notice */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
                                <p className="text-blue-900">
                                    Tus datos personales se utilizarán para procesar tu pedido, mejorar tu experiencia en esta web
                                    y otros propósitos descritos en nuestra política de privacidad.
                                </p>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-start space-x-2 mb-3">
                                <Checkbox
                                    id="terms"
                                    checked={acceptTerms}
                                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                />
                                <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                                    He leído y acepto los <span className="font-semibold text-foreground">términos y condiciones</span> del sitio web *
                                </Label>
                            </div>

                            {/* Data Treatment Policy */}
                            <div className="flex items-start space-x-2 mb-6">
                                <Checkbox
                                    id="data-policy"
                                    checked={acceptDataPolicy}
                                    onCheckedChange={(checked) => setAcceptDataPolicy(checked as boolean)}
                                />
                                <Label htmlFor="data-policy" className="text-sm cursor-pointer leading-relaxed">
                                    He leído y acepto la <span className="font-semibold text-foreground">política de tratamiento de datos</span> *
                                </Label>
                            </div>

                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-3 items-start">
                                <span className="text-lg leading-none mt-0.5">⚠️</span>
                                <div>
                                    <p className="font-bold">Importante</p>
                                    <p>
                                        Por favor no cierres ni recargues esta página hasta que el pedido sea completado.
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Procesando..." : (paymentMethod === "wompi" ? "IR A PAGAR CON WOMPI" : "REALIZAR EL PEDIDO")}
                            </Button>
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

                {/* Trust Badges - Below Checkout */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                    <div className="bg-muted/30 rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-4">Tu información</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Protegemos tu privacidad</p>
                                    <p className="text-xs text-muted-foreground">100% de tus datos están encriptados y protegidos con los más altos estándares de seguridad</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Verificados</p>
                                    <p className="text-xs text-muted-foreground">Empresa certificada y verificada. Cumplimos con todas las normativas de comercio electrónico</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Tu información está segura con nosotros</p>
                                    <p className="text-xs text-muted-foreground">Nunca compartimos tus datos personales con terceros. Tu confianza es nuestra prioridad</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-4">¿Por Qué Comprar Con Nosotros?</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Compras 100% seguras</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Toda la información que envíe aquí está 100% encriptada. Se trata de un pago encriptado SSL de 120 bits.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <DollarSign className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Mejores precios</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Garantizamos la calidad de nuestros productos a precios muy competitivos. Tenemos un índice de satisfacción del cliente del 95%.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Envío rápido</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Trabajamos duro para garantizarle una entrega puntual. Y cumplir con nuestras fechas estimadas de envío.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
