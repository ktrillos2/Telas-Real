"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus, X, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useCart } from "@/lib/contexts/CartContext"

// Tipo para las imágenes
interface DesignImage {
  id: string
  url: string
  name: string
  folder: string
}

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  // Calculate totals
  // Assuming totalPrice from context is the subtotal before tax if tax is added later, 
  // or if prices include tax, we need to adjust.
  // Usually in Colombia prices include VAT (IVA) or it's added.
  // The previous hardcoded example calculated IVA as 19% of subtotal.
  // Let's assume the store prices are base prices and we add IVA.
  const subtotal = totalPrice
  const iva = subtotal * 0.19
  const total = subtotal + iva

  const [designImages, setDesignImages] = useState<DesignImage[]>([])
  const [loadingDesigns, setLoadingDesigns] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Fetch designs logic (kept from original)
  const fetchImagesInBatches = async (batchSize: number, offset: number, folder: string): Promise<DesignImage[]> => {
    const response = await fetch(
      `/api/designs?limit=${batchSize}&offset=${offset}&folder=${folder}`
    )
    if (!response.ok) {
      // Silently fail or return empty if API doesn't exist yet
      return []
    }
    const data = await response.json()
    return data.images
  }

  useEffect(() => {
    const loadInitialImages = async () => {
      setLoadingDesigns(true)
      try {
        const images = await fetchImagesInBatches(5, 0, "TM")
        setDesignImages(images)
      } catch (error) {
        console.error("Error al cargar las imágenes iniciales:", error)
      } finally {
        setLoadingDesigns(false)
      }
    }
    loadInitialImages()
  }, [])

  const handleWompiPayment = async () => {
    setIsProcessingPayment(true)
    try {
      const reference = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const amountInCents = Math.round(total * 100) // Wompi expects cents
      const currency = "COP"
      const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY

      if (!publicKey) {
        alert("Error de configuración: Falta la llave pública de Wompi")
        return
      }

      // Get integrity signature
      const response = await fetch('/api/wompi/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amount: amountInCents, currency })
      })

      if (!response.ok) {
        throw new Error('Error generando firma')
      }

      const { signature } = await response.json()

      // Prepare items for extra data
      const itemsData = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))

      // Construct Wompi URL
      const wompiUrl = new URL('https://checkout.wompi.co/p/')
      wompiUrl.searchParams.append('public-key', publicKey)
      wompiUrl.searchParams.append('currency', currency)
      wompiUrl.searchParams.append('amount-in-cents', amountInCents.toString())
      wompiUrl.searchParams.append('reference', reference)
      wompiUrl.searchParams.append('signature-integrity', signature)
      // wompiUrl.searchParams.append('redirect-url', `${window.location.origin}/confirmacion`) // Optional: Create confirmation page
      wompiUrl.searchParams.append('tax-in-cents', Math.round(iva * 100).toString())

      // Pass items in extra param
      wompiUrl.searchParams.append('extra-items', JSON.stringify(itemsData))

      // Redirect
      window.location.href = wompiUrl.toString()

    } catch (error) {
      console.error('Payment error:', error)
      alert('Hubo un error al procesar el pago. Por favor intenta nuevamente.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <main className="flex-1 container mx-auto px-4 py-8 mb-20 lg:mb-0 w-full max-w-7xl">
        <h1 className="text-3xl font-light mb-8">Carrito de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-light text-muted-foreground mb-6">Tu carrito está vacío</p>
            <Link href="/tienda">
              <Button size="lg">Ir a la Tienda</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.uniqueId || item.id} className="flex gap-4 p-4 bg-background border border-border rounded-lg">
                  <div className="relative h-24 w-24 flex-shrink-0">
                    <Image
                      src={decodeURIComponent(item.image || "/placeholder.svg")}
                      alt={item.name}
                      fill
                      className="rounded-lg object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1">
                        <h3 className="font-light text-lg">{item.name}</h3>
                        {/* <p className="text-sm font-light text-muted-foreground">Código: {item.slug}</p> */}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removeItem(item.uniqueId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm font-light text-muted-foreground mb-3">
                      ${item.price.toLocaleString()} / unidad
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent flex-shrink-0"
                          onClick={() => updateQuantity(item.uniqueId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-light w-16 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent flex-shrink-0"
                          onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-lg font-medium">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-background border border-border rounded-lg p-6 sticky top-24 space-y-6">
                <h2 className="text-xl font-light">Resumen del Pedido</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2 text-blue-900">Métodos de Pago</h3>
                  <p className="text-xs font-light text-blue-800 mb-3">
                    Estos son todos nuestros métodos de pago:
                  </p>
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
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs font-light text-amber-900">
                  <span className="font-medium">Nota sobre envío:</span> El valor del envío es asumido por el cliente
                  según su ubicación.
                </p>
              </div>

              <div className="space-y-3 border-t border-border pt-6">
                <div className="flex justify-between text-sm font-light">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-light">
                  <span>IVA (19%)</span>
                  <span>${iva.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleWompiPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Pagar con Wompi"
                )}
              </Button>

              <Link href="/tienda" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Continuar Comprando
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Sección para mostrar las imágenes de la categoría TM */}
        {designImages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-light mb-4">Diseños de la categoría TM</h2>
            <div className="grid grid-cols-3 gap-4">
              {designImages.map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            {loadingDesigns && <p className="text-muted-foreground mt-4">Cargando diseños...</p>}
          </div>
        )}
      </main>
    </div>
  )
}
