import Image from "next/image"
import Link from "next/link"
import { EventTagBadge } from "./event-tag-badge"

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

  return (
    <Link href={`/producto/${slug || id}`} className="group block">
      <div className="mb-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={image || "/placeholder.svg"}
            alt={imageAlt || name || "Producto"}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${!is_in_stock ? 'opacity-40 grayscale' : ''}`}
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            quality={75}
            placeholder={blurDataURL ? "blur" : undefined}
            blurDataURL={blurDataURL}
          />
          {is_in_stock && (
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
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
        </div>
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground">{name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Show discount when hasDiscount is active, avoiding unit confusion by keeping it aligned with display price */}
          {hasDiscount && (
            <p className="text-xs font-light text-muted-foreground line-through">
              ${regularPrice.toLocaleString("es-CO")}
            </p>
          )}
          <p className="text-sm font-bold text-primary">
            ${displayPrice.toLocaleString("es-CO")}
            <span className="text-xs text-muted-foreground font-light"> /metro</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
