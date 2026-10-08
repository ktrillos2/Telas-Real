"use client"

import { useState, useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Minus, ShoppingBag, ArrowRight, Palette, ChevronLeft, ChevronRight } from "lucide-react"
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
  images?: Array<string | { src?: string; url?: string; asset?: any; alt?: string }>
  imageAlt?: string
  category?: string
  priority?: boolean
  sizes?: string
  is_in_stock?: boolean
  blurDataURL?: string
  pricePerKilo?: number
  badge?: string
  categorySlugs?: string[]
  hasColorVariants?: boolean
  variantsCount?: number
  colorPreviewTones?: Array<{ hex?: string; value?: string; title?: string }>
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
  images,
  imageAlt,
  category,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  is_in_stock = true,
  blurDataURL,
  pricePerKilo,
  badge,
  categorySlugs,
  hasColorVariants,
  variantsCount,
  colorPreviewTones,
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
    customBadges.forEach(rawCb => {
      let cb = rawCb.trim()
      // Normalize "MÁS VENDIDO" if it was combined with colors or additional text
      if (/m[aá]s\s+vendido/i.test(cb)) {
        cb = "MÁS VENDIDO"
      } else if (/color(es)?/i.test(cb)) {
        // Discard any badge whose purpose is indicating color count (e.g. "9 COLORES", "50+ COLORES")
        return
      }

      if (!badges.some(b => b.toLowerCase() === cb.toLowerCase())) {
        badges.push(cb)
      }
    })
  }

  // Split product name around '|' (e.g. "Granito de Arroz Blanco X Metros | Tela Texturizada")
  const nameParts = (name || "").split("|")
  const mainTitle = nameParts[0]?.trim() || name
  const subtitle = nameParts.length > 1 ? nameParts.slice(1).join("|").trim() : null

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

    if (hasColorVariants) {
      toast.info(`Explora los ${variantsCount || ""} colores disponibles. Abriendo producto...`, {
        duration: 2500,
      })
      router.push(`/producto/${slug || id}`)
      return
    }

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

  // Normalize image list for swipeable card gallery
  const imageList = useMemo(() => {
    const list: string[] = []
    if (images && Array.isArray(images) && images.length > 0) {
      images.forEach((item) => {
        if (typeof item === 'string' && item) {
          list.push(item)
        } else if (item && typeof item === 'object') {
          const src = item.src || item.url || (item.asset?.url ? `${item.asset.url}?auto=format&w=600&q=75` : '')
          if (src) list.push(src)
        }
      })
    }
    if (image && !list.includes(image)) {
      list.unshift(image)
    }
    const unique = Array.from(new Set(list.filter(Boolean)))
    return unique.length > 0 ? unique : [image || "/placeholder.svg"]
  }, [images, image])

  const [currentIdx, setCurrentIdx] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const isSwipingRef = useRef<boolean>(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (!el || el.clientWidth === 0) return
    const newIndex = Math.round(el.scrollLeft / el.clientWidth)
    if (newIndex !== currentIdx && newIndex >= 0 && newIndex < imageList.length) {
      setCurrentIdx(newIndex)
    }
  }

  const scrollToIndex = (index: number) => {
    if (!sliderRef.current) return
    const targetLeft = index * sliderRef.current.clientWidth
    sliderRef.current.scrollTo({
      left: targetLeft,
      behavior: "smooth"
    })
    setCurrentIdx(index)
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const prevIdx = (currentIdx - 1 + imageList.length) % imageList.length
    scrollToIndex(prevIdx)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const nextIdx = (currentIdx + 1) % imageList.length
    scrollToIndex(nextIdx)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX
      touchStartYRef.current = e.touches[0].clientY
      isSwipingRef.current = false
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && e.touches.length > 0) {
      const diffX = Math.abs(e.touches[0].clientX - touchStartXRef.current)
      if (diffX > 8) {
        isSwipingRef.current = true
      }
    }
  }

  const handleTouchEnd = () => {
    if (isSwipingRef.current) {
      setTimeout(() => {
        isSwipingRef.current = false
      }, 150)
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if (isSwipingRef.current) {
      e.preventDefault()
      e.stopPropagation()
      isSwipingRef.current = false
      return
    }
    router.push(`/producto/${slug || id}`)
  }

  return (
    <div className="group block h-full select-none">
      <div className="mb-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted shadow-xs">
          {imageList.length > 1 ? (
            <div
              ref={sliderRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleImageClick}
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none overscroll-x-contain touch-pan-x cursor-pointer"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {imageList.map((imgSrc, idx) => (
                <div
                  key={idx}
                  className="relative w-full h-full shrink-0 snap-center"
                >
                  <Image
                    src={imgSrc}
                    alt={imageAlt || `${name} - vista ${idx + 1}`}
                    fill
                    className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!is_in_stock ? 'opacity-40 grayscale' : ''}`}
                    sizes={sizes}
                    priority={priority && idx === 0}
                    loading={priority && idx === 0 ? undefined : "lazy"}
                    quality={75}
                    placeholder={idx === 0 && blurDataURL ? "blur" : undefined}
                    blurDataURL={idx === 0 ? blurDataURL : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div onClick={handleImageClick} className="w-full h-full relative cursor-pointer">
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
            </div>
          )}

          {/* Dots Indicator when more than 1 image */}
          {imageList.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs pointer-events-none">
              {imageList.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={`transition-all duration-300 rounded-full ${
                    dotIdx === currentIdx
                      ? "w-2.5 h-1 bg-white"
                      : "w-1 h-1 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Desktop Hover Arrows */}
          {imageList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Imagen anterior"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-800/90 text-foreground shadow-md hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Siguiente imagen"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-800/90 text-foreground shadow-md hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          )}

          {/* Badges */}
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
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
                  aria-label={
                    hasColorVariants
                      ? `Ver ${variantsCount || ""} colores de ${name}`
                      : isSublimado
                      ? `Elegir diseño para ${name}`
                      : `Agregar ${name} al carrito`
                  }
                  title={
                    hasColorVariants
                      ? `Ver ${variantsCount || ""} colores disponibles`
                      : isSublimado
                      ? "Elegir diseño"
                      : "Añadir al carrito"
                  }
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md backdrop-blur-xs border border-white/60 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer animate-in fade-in ${
                    hasColorVariants
                      ? "bg-white/95 text-primary hover:bg-primary hover:text-white hover:shadow-xl"
                      : "bg-white/95 text-slate-800 hover:bg-primary hover:text-white hover:shadow-xl"
                  }`}
                >
                  {hasColorVariants ? (
                    <Palette className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  ) : isSublimado ? (
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
      <Link href={`/producto/${slug || id}`} className="block space-y-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {mainTitle}
        </h3>
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 font-normal -mt-0.5">
            {subtitle}
          </p>
        )}

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
      </Link>
    </div>
  )
}
