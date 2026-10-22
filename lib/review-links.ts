import { SITE_URL } from "@/lib/seo"
import { productPublicPath } from "@/lib/product-url"

/**
 * Enlace para calificar un producto comprado: abre la ficha con el formulario de reseña
 * (components/product-reviews.tsx atiende ?calificar=1). Solo se incluye el primer nombre
 * del cliente para precargar el formulario; nunca el correo ni el teléfono.
 */
export function productReviewUrl(slug: string | null | undefined, customerName?: string): string | undefined {
  if (!slug) return undefined
  const base = `${SITE_URL}${productPublicPath(slug)}`
  const params = new URLSearchParams({ calificar: "1" })
  const firstName = (customerName || "").trim().split(/\s+/)[0]
  if (firstName && !/^cliente$/i.test(firstName)) params.set("nombre", firstName)
  return `${base}${base.includes("?") ? "&" : "?"}${params.toString()}#resenas`
}

/** Un enlace por producto distinto del pedido (sin repetir el mismo slug). */
export function orderReviewLinks(items: Array<{ name?: string; productSlug?: string }>, customerName?: string) {
  const seen = new Set<string>()
  const links: Array<{ name: string; url: string }> = []
  for (const item of items || []) {
    if (!item?.productSlug || seen.has(item.productSlug)) continue
    seen.add(item.productSlug)
    const url = productReviewUrl(item.productSlug, customerName)
    if (url) links.push({ name: item.name || "Producto", url })
  }
  return links
}
