"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react"
import { EventTagBadge } from "./event-tag-badge"
import { isUnitProduct } from "@/lib/utils"
import { useCart } from "@/lib/contexts/CartContext"
import { toast } from "sonner"

interface ProductCardProps {
  id: string | number
  slug: string
  name: string
  price: number
  regularPrice?: number
  regular_price?: number
  salePrice?: number
  sale_price?: number
  image: string
  imageAlt?: string
  category?: string
  priority?: boolean
  sizes?: string
  is_in_stock?: boolean
  blurDataURL?: string
  pricePerKilo?: number
  badge?: string
  categorySlugs?: string[]
}

export function ProductCard({
  id,
  slug,
  name,
  price,
  regularPrice: regularPriceProp,
  regular_price: regular_price_legacy,
  salePrice: salePriceProp,
  sale_price: sale_price_legacy,
  image,
  imageAlt,
  category,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  is_in_stock = true,
  blurDataURL,
  pricePerKilo,
  badge,
  categorySlugs
}: ProductCardProps) {
  const router = useRouter()
  const { items, addItem, updateQuantity, removeItem } = useCart()

  const salePrice = salePriceProp ?? sale_price_legacy
  const regularPrice = regularPriceProp ?? regular_price_legacy

  // Determinar si hay descuento
  const hasDiscount = !!(salePrice && regularPrice && salePrice > 0 && salePrice < regularPrice)
  const displayPrice = hasDiscount ? salePrice : price
  const badges: string[] = []
  if (hasDiscount) {
    badges.push("OFERTA")
  }
  if (badge) {
    const customBadges = badge.split(',').map(b => b.trim()).filter(b => b.length > 0)
    customBadges.forEach(cb => {
      if (!badges.some(b => b.toLowerCase() === cb.toLowerCase())) {
        badges.push(cb)
      }
    })
  }

  // Detect if product requires pattern/design customization (Sublimado)
  const isSublimado = Boolean(
    categorySlugs?.some(c => c?.toLowerCase().includes('sublimado')) ||
    name?.toLowerCase().includes('sublimado') ||
    slug?.toLowerCase().includes('sublimado')
  )

  // Check if product is sold per unit (hilos, tijeras, insumos)
  const isUnit = isUnitProduct({ categorySlugs, name, slug })

  // Find if this item is currently in the cart
  const cartItem = items.find(
    (item) => String(item.id) === String(id) || (item.slug && item.slug === slug)
  )
  const cartQuantity = cartItem?.quantity || 0

  const handleInitialAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!is_in_stock) return

    if (isSublimado) {
      toast.info("Este producto requiere seleccionar un estampado. Abriendo producto...", {
        duration: 2500,
      })
      router.push(`/producto/${slug || id}`)
      return
    }

    addItem({
      id: id,
      name: name,
      price: displayPrice,
      image: image || "/placeholder.svg",
      slug: slug || String(id),
      hasPromo: hasDiscount,
      regularPrice: regularPrice || price,
      categorySlugs: categorySlugs || []
    }, 1)
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!cartItem) {
      handleInitialAdd(e)
      return
    }

    updateQuantity(cartItem.uniqueId, cartQuantity + 1)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!cartItem) return

    if (cartQuantity <= 1) {
      removeItem(cartItem.uniqueId)
    } else {
      updateQuantity(cartItem.uniqueId, cartQuantity - 1)
    }
  }

  return (
    <Link href={`/producto/${slug || id}`} className="group block h-full select-none">
      <div className="mb-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted shadow-xs">
          <Image
            src={image || "/placeholder.svg"}
            alt={imageAlt || name || "Producto"}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!is_in_stock ? 'opacity-40 grayscale' : ''}`}
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            quality={75}
            placeholder={blurDataURL ? "blur" : undefined}
            blurDataURL={blurDataURL}
          />
          {is_in_stock && (
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end pointer-events-none">
              {badges.map((b, idx) => (
                <span key={idx} className="bg-[#E50914] text-white text-[11px] px-3 py-1 rounded-full font-bold shadow-md uppercase tracking-wide">
                  {b}
                </span>
              ))}
              <EventTagBadge productCategories={categorySlugs} productSlug={slug} />
            </div>
          )}
          {!is_in_stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span style={{ background: "rgba(255, 0.832, 0.141, 0.8)", paddingInline: "5px", paddingBlock: "2px" }} className="!bg-red text-white text-[10px] !px-3 py-1 rounded-full font-bold shadow-xl uppercase tracking-wide">
                Agotado
              </span>
            </div>
          )}

          {/* Quick Add / Interactive Quantity Counter */}
          {is_in_stock && (
            <div className="absolute bottom-2.5 right-2.5 z-20">
              {cartQuantity > 0 ? (
                // Expansión interactiva con botones + y -
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="flex items-center rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-primary/30 shadow-lg p-1 gap-1 text-foreground transition-all duration-300 animate-in zoom-in-75 origin-bottom-right"
                >
                  <button
                    type="button"
                    onClick={handleDecrement}
                    aria-label={`Disminuir cantidad de ${name}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all duration-200 active:scale-85 cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
                  </button>

                  <span className="px-1.5 min-w-[28px] sm:min-w-[36px] text-center text-xs sm:text-sm font-bold text-foreground select-none">
                    {isUnit ? cartQuantity : `${cartQuantity} m`}
                  </span>

                  <button
                    type="button"
                    onClick={handleIncrement}
                    aria-label={`Aumentar cantidad de ${name}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all duration-200 active:scale-85 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                // Botón inicial circular para añadir
                <button
                  type="button"
                  onClick={handleInitialAdd}
                  aria-label={isSublimado ? `Elegir diseño para ${name}` : `Agregar ${name} al carrito`}
                  title={isSublimado ? "Elegir diseño" : "Añadir al carrito"}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 text-slate-800 hover:bg-primary hover:text-white hover:shadow-xl shadow-md backdrop-blur-xs border border-white/60 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer animate-in fade-in"
                >
                  {isSublimado ? (
                    <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  ) : (
                    <ShoppingBag className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Show discount when hasDiscount is active */}
          {hasDiscount && (
            <p className="text-xs font-light text-muted-foreground line-through">
              ${regularPrice.toLocaleString("es-CO")}
            </p>
          )}
          <p className="text-sm font-bold text-primary">
            ${displayPrice.toLocaleString("es-CO")}
            <span className="text-xs text-muted-foreground font-light">
              {isUnit ? ' /unidad' : ' /metro'}
            </span>
          </p>
        </div>
      </div>
    </Link>
  )
}
