import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  id: number
  name: string
  price: number
  regularPrice?: number
  salePrice?: number
  image: string
  category?: string
  priority?: boolean
  sizes?: string
  is_in_stock?: boolean
  blurDataURL?: string
  pricePerKilo?: number
}

export function ProductCard({
  id,
  name,
  price,
  regularPrice,
  salePrice,
  image,
  category,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  is_in_stock = true,
  blurDataURL,
  pricePerKilo
}: ProductCardProps) {
  // Determinar si hay descuento (only applying to meter price logic for now)
  const hasDiscount = salePrice && regularPrice && salePrice > 0 && salePrice < regularPrice
  const displayPrice = hasDiscount ? salePrice : price

  return (
    <Link href={`/producto/${id}`} className="group block">
      <div className="mb-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={image || "/placeholder.svg"}
            alt={name || "Producto"}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${!is_in_stock ? 'opacity-40 grayscale' : ''}`}
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            quality={75}
            placeholder={blurDataURL ? "blur" : undefined}
            blurDataURL={blurDataURL}
          />
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
          {/* Show discount only if NOT using pricePerKilo, strictly to avoid unit confusion */}
          {hasDiscount && !pricePerKilo && (
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
