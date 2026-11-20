"use client"

import { Minus, Plus, X, Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useCart } from "@/lib/contexts/CartContext"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { useHomeDataContext } from "@/lib/contexts/HomeDataContext"
import { ShippingDispatchNotice } from "@/components/shipping-dispatch-notice"
import { isUnitProduct } from "@/lib/utils"
import * as fpixel from '@/lib/fpixel'
import * as gtag from '@/lib/gtag'

import { openWhatsAppTracked, type WhatsAppCustomer } from "@/lib/whatsapp-origin"
import { WhatsAppOrderDialog } from "@/components/whatsapp-order-dialog"
import { productPublicPath } from "@/lib/product-url"
import { CouponBox, CouponDiscountLine } from "@/components/coupon-box"
import { calculatePromotionDiscount } from "@/lib/promotions"
import { calculateVolumeDiscount, combineWithPromotion } from "@/lib/volume-pricing"
import { useVolumePricing } from "@/lib/hooks/use-volume-pricing"
import { useStoreSettings } from "@/components/store-settings-provider"

interface CartSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartSidebar({ open, onOpenChange }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, totalPrice, clearCart, couponDiscount } = useCart()
  const { data: homeData } = useHomeDataContext()
  const eventSettings = homeData?.eventSettings
  const whatsappSettings = homeData?.whatsappSettings

  const originalTotal = items.reduce((sum, item) => {
    return sum + (item.regularPrice || item.price) * item.quantity;
  }, 0);
  const totalSavings = originalTotal > totalPrice ? originalTotal - totalPrice : 0;

  // Promoción por metros / kg: mismo cálculo que el checkout y createOrder (lib/promotions.ts)
  const promotion = calculatePromotionDiscount(items, eventSettings)
  // Precio por volumen (kilos = metros ÷ rendimiento): mismo cálculo que el checkout y createOrder
  const volumePricing = useVolumePricing()
  const storeSettings = useStoreSettings()
  const volume = calculateVolumeDiscount(
    items.map((i) => ({ id: i.id, name: i.name, slug: i.slug, price: i.price, quantity: i.quantity, isUnit: isUnitProduct(i) })),
    volumePricing.rows,
    volumePricing.settings
  )
  const combinedDiscounts = combineWithPromotion(promotion.discount, volume.discount, volumePricing.settings)
  const totalEventDiscount = combinedDiscounts.promo
  const volumeDiscount = combinedDiscounts.volume
  // Sugerencia: cuánto falta para el siguiente nivel de precio en la referencia más cercana
  const volumeHint = volume.groups
    .filter((g) => g.metersToNext && g.metersToNext > 0 && g.metersToNext <= Math.max(10, g.meters))
    .sort((a, b) => (a.metersToNext || 0) - (b.metersToNext || 0))[0]
  const { isMeterUnit, isPercentagePromo, appliedTierName, totalApplicableUnits, totalApplicableKg } = promotion

  // Entre 10 y 20 kg sin los hilos del combo: invitar a completarlo
  let upsellMessage = ""
  if (promotion.isActive && isPercentagePromo && (eventSettings?.tiers?.length ?? 0) > 0 &&
      totalApplicableKg >= 10 && totalApplicableKg <= 20 && promotion.threadCount < 3) {
      const needed = 3 - promotion.threadCount
      upsellMessage = `KI LOVERS DUO: ¡Agrega ${needed} hilo(s) más para obtener el 5% de descuento en tus telas!`
  }

  const finalPriceToPay = Math.max(0, totalPrice - totalEventDiscount - volumeDiscount - couponDiscount)

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  useEffect(() => {
    if (!open || featuredProducts.length > 0) return;

    const fetchFeatured = async () => {
      try {
        const data = await client.fetch(groq`
              *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && salePrice > 0] | order(_createdAt desc) [0...12] {
                 _id,
                 "name": title,
                 "slug": slug.current,
                 price,
                 "salePrice": coalesce(salePrice, sale_price),
                 "image": images[0].asset->url + "?auto=format&w=400&h=400&fit=crop&q=80"
              }
            `)
        setFeaturedProducts(data.map((p: any) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.salePrice || p.price,
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
  }, [open, featuredProducts.length])

  // Track view_cart event when the sidebar is opened
  useEffect(() => {
    if (open && items.length > 0) {
      fpixel.event('view_cart', {
        content_name: 'Shopping Cart',
        currency: 'COP',
        value: finalPriceToPay,
        content_type: 'product',
        content_ids: items.map(i => i.id.toString()),
        contents: items.map(i => ({ id: i.id, quantity: i.quantity }))
      })

      gtag.event('view_cart', {
        currency: 'COP',
        value: finalPriceToPay,
        items: items.map(item => ({
          item_id: item.id.toString(),
          item_name: item.name,
          currency: 'COP',
          price: item.price,
          quantity: item.quantity
        }))
      })
    }
  }, [open]) // Only track when 'open' state changes to true

  const handleUpdateQuantity = (uniqueId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(uniqueId)
    } else {
      updateQuantity(uniqueId, newQuantity)
    }
  }

  // "Comprar por WhatsApp": primero se piden los datos del cliente para que el pedido llegue completo al admin
  const [waDialogOpen, setWaDialogOpen] = useState(false)
  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return
    setWaDialogOpen(true)
  }

  const sendWhatsAppOrder = (customer: WhatsAppCustomer) => {
    setWaDialogOpen(false)
    if (items.length === 0) return
    const datos = [
      `Nombre: ${customer.fullName}`,
      customer.email ? `Correo: ${customer.email}` : "",
      customer.phone ? `Celular: ${customer.phone}` : "",
      customer.city ? `Ciudad: ${customer.city}` : "",
      customer.address ? `Dirección: ${customer.address}` : "",
    ].filter(Boolean).join("\n")

    const message = `Hola, me gustaría hacer un pedido:\n\n${items
      .map((item) => `• ${item.name}\n  Cantidad: ${item.quantity}\n  Precio: $${item.price.toLocaleString("es-CO")}\n  Subtotal: $${(item.price * item.quantity).toLocaleString("es-CO")}`)
      .join("\n\n")}\n\nTotal: $${finalPriceToPay.toLocaleString("es-CO")}\n\nMis datos:\n${datos}`

    const waNumber = whatsappSettings?.whatsappNumber || "573159021516"
    // Se crea el pedido "WhatsApp" en el admin y su número + código de origen van en el mensaje
    openWhatsAppTracked({
      phone: waNumber,
      message,
      source: "cart",
      total: finalPriceToPay,
      customer,
      items: items.map((item) => ({
        id: String(item.id),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        slug: item.slug,
        designName: (item as any).designName,
        isCustom: (item as any).isCustom,
      })),
    })
  }

  return (
    <>
    <WhatsAppOrderDialog open={waDialogOpen} onOpenChange={setWaDialogOpen} onConfirm={sendWhatsAppOrder} />
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
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={productPublicPath(product.slug)}
                    className="block group"
                    onClick={() => onOpenChange(false)}
                  >
                    <Image
                      src={product.images[0]?.src || product.image || "/placeholder.svg"}
                      alt={product.name || "Producto destacado"}
                      width={160}
                      height={160}
                      className="rounded-lg object-cover mb-2 group-hover:opacity-80 transition-opacity aspect-square w-full"
                    />
                    <h4 className="text-xs font-light mb-1 line-clamp-2">{product.name}</h4>
                    <p className="text-xs font-medium">${product.price.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col px-4 sm:px-6 pt-6 overflow-y-auto">
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
                      <Link href={productPublicPath(item.slug)} onClick={() => onOpenChange(false)}>
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
                          <Link href={productPublicPath(item.slug)} onClick={() => onOpenChange(false)}>
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
                          <span className="text-sm font-light text-center flex-shrink-0 min-w-[3rem] px-2">
                            {item.quantity} {(() => {
                              const isUnit = isUnitProduct(item)
                              return isUnit ? (item.quantity === 1 ? 'unidad' : 'unidades') : (item.quantity === 1 ? 'metro' : 'metros')
                            })()}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent flex-shrink-0"
                            onClick={() => handleUpdateQuantity(item.uniqueId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-col">
                          {item.regularPrice && item.regularPrice > item.price ? (
                            <div className="flex items-center gap-2">
                              <p className="text-base font-medium text-red-600">${(item.price * item.quantity).toLocaleString()}</p>
                              <p className="text-sm font-medium text-muted-foreground line-through">${(item.regularPrice * item.quantity).toLocaleString()}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="text-base font-medium">${(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                          )}
                          <p className="text-xs font-light text-muted-foreground">
                            ${item.price.toLocaleString()} c/u
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <CouponBox />
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

                  <ShippingDispatchNotice variant="cart" />
                </div>

            {/* MOBILE FEATURED PRODUCTS */}
            <div className="lg:hidden mt-4 mb-6 border-t border-border pt-6 pb-2">
              <h3 className="text-sm font-medium mb-4">Ofertas Destacadas</h3>
              {loadingFeatured ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Cargando...</p>
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory hide-scrollbar">
                  {featuredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={productPublicPath(product.slug)}
                      className="block group w-[120px] flex-none snap-start"
                      onClick={() => onOpenChange(false)}
                    >
                      <Image
                        src={product.images[0]?.src || product.image || "/placeholder.svg"}
                        alt={product.name || "Producto destacado"}
                        width={120}
                        height={120}
                        className="rounded-lg object-cover mb-2 group-hover:opacity-80 transition-opacity aspect-square w-full"
                      />
                      <h4 className="text-[11px] font-light mb-1 line-clamp-2 leading-tight">{product.name}</h4>
                      <p className="text-[11px] font-medium">${product.price.toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-base font-medium">
                    <span>Subtotal</span>
                    <div className="text-right">
                      {totalSavings > 0 && (
                        <p className="text-sm font-medium text-muted-foreground line-through">
                          ${originalTotal.toLocaleString()}
                        </p>
                      )}
                      <p className="text-xl font-bold text-primary">
                        ${totalPrice.toLocaleString()}
                      </p>
                      {totalSavings > 0 && (
                        <p className="text-xs font-medium text-red-600 mt-1">
                          Ahorraste: ${totalSavings.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {totalEventDiscount > 0 && (
                      <div className="flex justify-between text-green-600 pt-2 border-t border-border mt-2">
                          <div className="flex flex-col">
                              <span className="font-medium text-xs sm:text-sm">
                                {appliedTierName || eventSettings?.eventTag || (isMeterUnit ? "Descuento por Metros" : "Descuento por KG")}
                              </span>
                              <span className="text-[11px] text-green-700 dark:text-green-400 font-light">
                                {isPercentagePromo ? `(${totalApplicableKg.toFixed(1)} kg de tela participante)` : `(${Math.floor(totalApplicableUnits)} ${isMeterUnit ? 'metros aplicables' : 'kg estimados'})`}
                              </span>
                          </div>
                          <span className="font-medium">- ${totalEventDiscount.toLocaleString()}</span>
                      </div>
                  )}

                  {volumeDiscount > 0 && (
                      <div className="flex justify-between text-green-600 pt-2 border-t border-border mt-2">
                          <div className="flex flex-col">
                              <span className="font-medium text-xs sm:text-sm">Precio por volumen</span>
                              <span className="text-[11px] text-green-700 dark:text-green-400 font-light">
                                {volume.groups.filter((g) => g.discount > 0).map((g) => `${g.rowName.toLowerCase()}: ${g.tierLabel} (${g.kg.toFixed(1)} kg)`).join(' · ')}
                              </span>
                          </div>
                          <span className="font-medium">- ${volumeDiscount.toLocaleString('es-CO')}</span>
                      </div>
                  )}

                  {volumeHint && (
                      <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-xs text-sky-900 dark:text-sky-200 leading-snug flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>Agrega {volumeHint.metersToNext} m más de {volumeHint.rowName.toLowerCase()} y obtienes precio {volumeHint.nextTierLabel}.</span>
                      </div>
                  )}

                  <CouponDiscountLine className="pt-2 border-t border-border mt-2" />

                  {upsellMessage && (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-snug flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{upsellMessage}</span>
                      </div>
                  )}

                  <p className="text-xs font-light text-muted-foreground mt-2">
                    Donaremos un % a la fundación One Tree Planted
                  </p>
                </div>

                {/* Total y botón de compra fijos abajo: siempre visibles mientras se revisa el carrito */}
                <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 mt-4 border-t border-border bg-background/95 px-4 sm:px-6 pt-3 pb-4 shadow-[0_-10px_24px_-14px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-background/85">
                  <div className="flex items-baseline justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${finalPriceToPay.toLocaleString()}</span>
                  </div>

                  {process.env.NEXT_PUBLIC_ENABLE_PURCHASES === 'false' ? (
                    <Button className="w-full mt-3" size="lg" disabled>
                      Compras Deshabilitadas
                    </Button>
                  ) : (
                    <Button className="w-full mt-3" size="lg" asChild>
                      <Link href="/checkout" onClick={() => onOpenChange(false)}>
                        Finalizar compra
                      </Link>
                    </Button>
                  )}
                  {process.env.NEXT_PUBLIC_ENABLE_PURCHASES !== 'false' && storeSettings.showWhatsappCheckout && (
                    <Button
                      variant="outline"
                      className="mt-2 w-full gap-2 border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 hover:text-[#128C7E]"
                      onClick={handleWhatsAppCheckout}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.3-1.96 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2.01.89 2.16.07.15.12.32.02.51-.1.2-.15.32-.29.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.71.81 2.01.95.29.15.49.22.56.34.07.12.07.7-.17 1.38Z" /></svg>
                      Comprar por WhatsApp
                    </Button>
                  )}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="w-full text-center text-sm font-light text-muted-foreground hover:text-foreground transition-colors pt-2"
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
    </>
  )
}
