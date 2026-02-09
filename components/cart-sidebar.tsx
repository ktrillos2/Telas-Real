"use client"

import { Minus, Plus, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useCart } from "@/lib/contexts/CartContext"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"

interface CartSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartSidebar({ open, onOpenChange }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart()
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await client.fetch(groq`
              *[_type == "product" && (stock_status == "instock" || stockStatus == "inStock")] | order(_createdAt desc) [0...6] {
                 _id,
                 "name": title,
                 "slug": slug.current,
                 price,
                 "image": images[0].asset->url
              }
            `)
        setFeaturedProducts(data.map((p: any) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          image: p.image || "/placeholder.svg",
          images: [{ src: p.image || "/placeholder.svg" }]
        })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingFeatured(false)
      }
    }
    fetchFeatured()
  }, [])

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
    // En un caso real, esto llamaría a una API
    setTimeout(() => {
      const validCoupons = ["TELAS10", "BIENVENIDO", "DESCUENTO2024"]

      if (validCoupons.includes(couponCode.toUpperCase())) {
        setCouponSuccess("¡Cupón aplicado correctamente!")
        // Aquí se actualizaría el total del carrito
      } else {
        setCouponError("El código de cupón no es válido o ha expirado")
      }
      setIsValidating(false)
    }, 1500)
  }

  const handleUpdateQuantity = (uniqueId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(uniqueId)
    } else {
      updateQuantity(uniqueId, newQuantity)
    }
  }

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return

    const message = `Hola, me gustaría hacer un pedido:\n\n${items
      .map((item) => `• ${item.name}\n  Cantidad: ${item.quantity}\n  Precio: $${item.price.toLocaleString()}\n  Subtotal: $${(item.price * item.quantity).toLocaleString()}`)
      .join("\n\n")}\n\nTotal: $${totalPrice.toLocaleString()}`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/573104569875?text=${encodedMessage}`, "_blank")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <SheetTitle className="text-xl font-light">Revisa tu carrito ({items.length})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-48 border-r border-border bg-muted/30 p-4 overflow-y-auto hidden lg:block">
            <h3 className="text-sm font-medium mb-4">Productos Destacados</h3>
            {loadingFeatured ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">Cargando...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {featuredProducts.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    href={`/producto/${product.slug}`}
                    className="block group"
                    onClick={() => onOpenChange(false)}
                  >
                    <Image
                      src={product.images[0]?.src || product.image || "/placeholder.svg"}
                      alt={product.name || "Producto destacado"}
                      width={160}
                      height={160}
                      className="rounded-lg object-cover mb-2 group-hover:opacity-80 transition-opacity"
                    />
                    <h4 className="text-xs font-light mb-1 line-clamp-2">{product.name}</h4>
                    <p className="text-xs font-medium">${product.price.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <p className="text-sm font-light text-muted-foreground">Tu carrito está vacío</p>
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Ir a la tienda
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-6 mb-6">
                  {items.map((item) => (
                    <div key={item.uniqueId || item.id} className="flex gap-4 pb-6 border-b border-border">
                      <Link href={`/producto/${item.slug}`} onClick={() => onOpenChange(false)}>
                        <Image
                          src={decodeURIComponent(item.image || "/placeholder.svg")}
                          alt={item.name || "Producto en carrito"}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                          unoptimized
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/producto/${item.slug}`} onClick={() => onOpenChange(false)}>
                            <h4 className="text-sm font-normal mb-1 hover:text-primary transition-colors">
                              {item.name}
                            </h4>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.uniqueId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-3 mb-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent flex-shrink-0"
                            onClick={() => handleUpdateQuantity(item.uniqueId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-light text-center flex-shrink-0 min-w-[3rem] px-2">{item.quantity} {item.quantity === 1 ? 'kilo' : 'kilos'}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent flex-shrink-0"
                            onClick={() => handleUpdateQuantity(item.uniqueId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium">${(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-xs font-light text-muted-foreground">
                            ${item.price.toLocaleString()} c/u
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <button
                    onClick={() => setShowCoupon(!showCoupon)}
                    className="flex items-center justify-between w-full text-sm font-light mb-2"
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
                          className="flex-1"
                          disabled={isValidating}
                        />
                        <Button
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

                <div className="border-t border-border pt-4 mb-4 space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2 text-blue-900">Métodos de Pago</h3>
                    <p className="text-xs font-light text-blue-800 mb-2">
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

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs font-light text-amber-900">
                      <span className="font-medium">Nota sobre envío:</span> El valor del envío lo calcula la transportadora según el peso del paquete y el destino, este monto es asumido por el cliente.
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-base font-medium">
                    <span>Subtotal</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-light text-muted-foreground">
                    Donaremos un % a la fundación One Tree Planted
                  </p>

                  {process.env.NEXT_PUBLIC_ENABLE_PURCHASES === 'false' ? (
                    <Button className="w-full mt-4" size="lg" disabled>
                      Compras Deshabilitadas
                    </Button>
                  ) : (
                    <Button className="w-full mt-4" size="lg" asChild>
                      <Link href="/checkout" onClick={() => onOpenChange(false)}>
                        Finalizar compra
                      </Link>
                    </Button>
                  )}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="w-full text-center text-sm font-light text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Continuar comprando
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
