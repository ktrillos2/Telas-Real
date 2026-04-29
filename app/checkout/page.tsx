"use client"


import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/lib/contexts/CartContext"
import { Shield, Lock, Truck, DollarSign, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getCustomerData } from "@/app/actions/customer"
import { createOrder, updateOrderStatus } from "@/app/actions/order"
import { useEffect, useState, useRef } from "react"
import * as gtag from "@/lib/gtag"
import * as fpixel from "@/lib/fpixel"

// ... imports

import { generateWompiSignature } from "@/app/actions/wompi"

import { colombianDepartments, citiesByDepartment } from "@/lib/locations"

const MIN_COD_AMOUNT = 50000
const MAX_COD_AMOUNT = 100000 // Configurable limit for Cash on Delivery

export default function CheckoutPage() {
    const router = useRouter()
    const { items, totalPrice } = useCart()
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("wompi")
    const [savedCustomer, setSavedCustomer] = useState<any>(null)
    const [useSavedAddress, setUseSavedAddress] = useState("none")
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("")
    const [wompiLoaded, setWompiLoaded] = useState(false)
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
    const isTransactionProcessing = useRef(false)

    // Reset Order ID if cart changes
    useEffect(() => {
        setCurrentOrderId(null)
    }, [items, totalPrice])

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
        }
    }, [items, totalPrice])

    // ... existing useState code ...

    // ...

    const handleWompiPayment = async () => {
        // Check if Wompi script is loaded
        if (!wompiLoaded || !(window as any).WidgetCheckout) {
            alert('El sistema de pago aún se está cargando. Por favor, espera un momento e intenta de nuevo.')
            return
        }

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' })

        setIsLoading(true)
        setLoadingMessage("Creando tu pedido en el sistema...")

        try {
            // Updated logic: Create order in WordPress FIRST (or reuse existing)
            let reference = ""

            if (currentOrderId) {
                reference = currentOrderId
            } else {
                const orderResult = await createOrder(formData, items, "wompi", createAccount);

                if (!orderResult.success || !orderResult.orderId) {
                    console.error("Order creation failed:", orderResult.error);
                    alert('Hubo un error al crear el pedido. Por favor intenta nuevamente.');
                    setIsLoading(false);
                    return;
                }

                // Store the new Order ID using orderNumber to make it short (5 digits)
                const shortReference = String(orderResult.orderNumber || orderResult.orderId)
                setCurrentOrderId(shortReference)
                reference = shortReference
            }
            const amountInCents = totalPrice * 100
            const signature = await generateWompiSignature(reference, amountInCents)

            setLoadingMessage("Conectando con Wompi...")

            // Guardar datos del pedido temporalmente para la página de confirmación
            localStorage.setItem('lastOrder', JSON.stringify({
                items,
                formData,
                totalWithIva: totalPrice, // Assuming totalPrice already includes IVA
                reference
            }))
            const checkout = new (window as any).WidgetCheckout({
                currency: 'COP',
                amountInCents: amountInCents,
                reference: reference, // Using the real WooCommerce Order ID
                publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
                signature: { integrity: signature },
                // redirectUrl: `${window.location.origin}/confirmation`, // Usamos callback para mejor control
                extraParameters: {
                    items: JSON.stringify(items.map(item => ({
                        product_id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        total: (item.price * item.quantity).toString()
                    })))
                },
                customerData: {
                    email: formData.email,
                    fullName: `${formData.firstName} ${formData.lastName}`,
                    phoneNumber: formData.phone,
                    phoneNumberPrefix: '+57',
                    legalId: formData.documentId,
                    legalIdType: 'CC'
                }
            })

            isTransactionProcessing.current = false

            checkout.open(async (result: any) => {
                isTransactionProcessing.current = true
                const transaction = result.transaction
                console.log('Transaction result:', transaction)

                setLoadingMessage("Verificando estado del pago...")

                // Update order status based on Wompi result
                if (transaction.status === 'APPROVED') {
                    await updateOrderStatus(reference, 'paid')
                } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR' || transaction.status === 'VOIDED') {
                    await updateOrderStatus(reference, 'cancelled')
                }

                // Redirigir a confirmación con el estado
                router.push(`/confirmation?status=${transaction.status}&id=${transaction.id}&orderId=${reference}`)
            })


        } catch (error) {
            console.error('Error initiating Wompi payment:', error)
            alert('Error al iniciar el pago con Wompi')
        } finally {
            // Keep loading active for a bit to ensure smooth transition if widget opens fast,
            // or turn it off. Since widget acts as overlay, we can turn off our overlay.
            setIsLoading(false)
            setLoadingMessage("")
        }
    }

    const [createAccount, setCreateAccount] = useState(false)

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        company: "",
        address: "",
        apartment: "",
        city: "Bogotá",
        region: "Cundinamarca",
        zipCode: "",
        phone: "",
        email: "",
        documentId: "",
    })

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

        return () => {
            // Cleanup script on unmount
            const existingScript = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]')
            if (existingScript) {
                document.body.removeChild(existingScript)
            }
        }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!acceptTerms) {
            alert("Debes aceptar los términos y condiciones")
            return
        }

        if (!formData.documentId || formData.documentId.trim() === "") {
            alert("Por favor ingresa tu documento de identidad")
            return
        }

        if (paymentMethod === "wompi") {
            await handleWompiPayment()
        } else if (paymentMethod === "cod") {
            // Lógica para Pago Contraentrega

            setIsLoading(true)
            setLoadingMessage("Procesando tu pedido...")

            try {
                // Crear orden en WooCommerce
                const orderResult = await createOrder(formData, items, "cod", createAccount);

                if (!orderResult.success || !orderResult.orderId) {
                    throw new Error(orderResult.error || "Error creando el pedido");
                }

                // Usamos el ID corto o el UUID si no está disponible
                const reference = String(orderResult.orderNumber || orderResult.orderId)

                // Opcional: Actualizar el estado a 'processing' de una vez si lo deseamos, 
                // pero la página de confirmación lo hará si pasamos status=APPROVED
                // await updateOrderStatus(orderResult.orderId, 'processing')

                // Guardar datos del pedido temporalmente
                localStorage.setItem('lastOrder', JSON.stringify({
                    items,
                    formData,
                    totalWithIva: totalPrice,
                    reference,
                    paymentMethod: 'cod'
                }))

                // Redirigir a confirmación
                // Pasamos orderId y status=APPROVED para que la página de confirmation ejecute updateOrderStatus('processing')
                router.push(`/confirmation?status=APPROVED&payment_method=cod&id=${reference}&orderId=${reference}`)

            } catch (error) {
                console.error('Error processing COD order:', error)
                alert('Error al procesar el pedido. Por favor intenta nuevamente.')
                setIsLoading(false)
            }
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
            setFormData(prev => ({
                ...prev,
                firstName: savedCustomer.billing.first_name || prev.firstName,
                lastName: savedCustomer.billing.last_name || prev.lastName,
                company: savedCustomer.billing.company || prev.company,
                address: savedCustomer.billing.address_1 || prev.address,
                apartment: savedCustomer.billing.address_2 || prev.apartment,
                city: savedCustomer.billing.city || prev.city,
                region: savedCustomer.billing.state || prev.region,
                zipCode: savedCustomer.billing.postcode || prev.zipCode,
                phone: savedCustomer.billing.phone || prev.phone,
                email: savedCustomer.billing.email || prev.email,
            }))
        } else if (value === "shipping" && savedCustomer?.shipping) {
            setFormData(prev => ({
                ...prev,
                firstName: savedCustomer.shipping.first_name || prev.firstName,
                lastName: savedCustomer.shipping.last_name || prev.lastName,
                company: savedCustomer.shipping.company || prev.company,
                address: savedCustomer.shipping.address_1 || prev.address,
                apartment: savedCustomer.shipping.address_2 || prev.apartment,
                city: savedCustomer.shipping.city || prev.city,
                region: savedCustomer.shipping.state || prev.region,
                zipCode: savedCustomer.shipping.postcode || prev.zipCode,
            }))
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
                                        const cities = citiesByDepartment[value] || []
                                        setFormData({
                                            ...formData,
                                            region: value,
                                            city: cities.length > 0 ? cities[0] : ""
                                        })
                                    }}
                                    required
                                >
                                    <SelectTrigger className="w-full bg-white">
                                        <SelectValue placeholder="Selecciona tu departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colombianDepartments.map((dept) => (
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
                                    value={formData.city}
                                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                                    required
                                >
                                    <SelectTrigger className="w-full bg-white">
                                        <SelectValue placeholder="Selecciona tu ciudad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(citiesByDepartment[formData.region] || []).map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
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
                                                    <p className="font-medium text-sm flex-shrink-0">${(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-1">Cantidad: {item.quantity} {item.quantity === 1 ? 'kilo' : 'kilos'}</p>
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

                                <div className="flex justify-between pt-2">
                                    <span className="font-medium">Subtotal</span>
                                    <span className="font-medium">${totalPrice.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between text-lg font-bold border-t pt-4">
                                    <span>Total</span>
                                    <span>${totalPrice.toLocaleString()}</span>
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
                                    <div className={`border rounded-lg p-4 ${totalPrice > MAX_COD_AMOUNT || totalPrice < MIN_COD_AMOUNT ? 'opacity-60 bg-gray-50' : ''}`}>
                                        <div className="flex items-center space-x-2 mb-3">
                                            <RadioGroupItem
                                                value="cod"
                                                id="cod"
                                                disabled={totalPrice > MAX_COD_AMOUNT || totalPrice < MIN_COD_AMOUNT}
                                            />
                                            <Label htmlFor="cod" className="flex-1 cursor-pointer font-bold">
                                                Pago Contraentrega
                                            </Label>
                                        </div>
                                        <div className="pl-6">
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Paga en efectivo al recibir tu pedido.
                                            </p>
                                            {(totalPrice > MAX_COD_AMOUNT || totalPrice < MIN_COD_AMOUNT) && (
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

                            {/* Shipping Disclaimer */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm flex gap-3">
                                <Truck className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                <p className="text-yellow-900">
                                    <strong>Nota sobre el envío:</strong> El costo del domicilio puede variar dependiendo de la ubicación exacta y el peso del paquete, este costo sera asumido por el cliente. Si hay un costo adicional, nos comunicaremos contigo.
                                </p>
                            </div>

                            {/* Privacy Notice */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
                                <p className="text-blue-900">
                                    Tus datos personales se utilizarán para procesar tu pedido, mejorar tu experiencia en esta web
                                    y otros propósitos descritos en nuestra política de privacidad.
                                </p>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-start space-x-2 mb-6">
                                <Checkbox
                                    id="terms"
                                    checked={acceptTerms}
                                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                />
                                <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                                    He leído y acepto los términos y condiciones del sitio web *
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
                                disabled={!acceptTerms || isLoading}
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
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
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
