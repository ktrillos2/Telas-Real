import { client } from "@/sanity/lib/client"
import { ACTIVE_PROMOTION_QUERY, effectiveSalePrice, isPromotionActive, type PromotionSettings } from "@/lib/promotions"

/**
 * Precios para Google Merchant y el catálogo de Meta: los mismos que muestra y cobra la web
 * (oferta manual + % del evento activo), para que Google no rechace productos por precio distinto.
 */
export async function getActivePromotion(): Promise<PromotionSettings | null> {
  try {
    const promo = await client.fetch<PromotionSettings | null>(ACTIVE_PROMOTION_QUERY)
    return promo && isPromotionActive(promo) ? promo : null
  } catch (error) {
    console.error("[feed] No se pudo leer la promoción activa:", error)
    return null
  }
}

export interface FeedPrice {
  /** Precio rebajado (0 = sin rebaja) */
  sale: number
  /** "inicio/fin" en ISO cuando la rebaja depende del evento (Google la quita sola al terminar) */
  effectiveDate?: string
}

export function feedSalePrice(
  p: { price?: number; salePrice?: number; slug?: string; categorySlugs?: string[] | null },
  promo: PromotionSettings | null
): FeedPrice {
  const regular = Number(p.price) || 0
  const manual = Number(p.salePrice) || 0
  const manualOnly = manual > 0 && manual < regular ? manual : 0
  const sale = effectiveSalePrice(regular, manual, { slug: p.slug, categorySlugs: p.categorySlugs || [] }, promo)
  if (!sale) return { sale: 0 }
  // Si el evento cambió el precio, la rebaja vale solo durante el evento
  const fromEvent = sale !== manualOnly && promo?.startDate && promo?.endDate
  return {
    sale,
    effectiveDate: fromEvent ? `${new Date(promo!.startDate!).toISOString()}/${new Date(promo!.endDate!).toISOString()}` : undefined,
  }
}
