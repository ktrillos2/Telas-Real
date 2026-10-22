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

/**
 * Completa el slug de los ítems de pedidos que no lo guardaron (pedidos anteriores al cambio
 * o creados por otra vía), a partir del nombre:
 *  - "Tela Satín X Metros | Tela Elegante (Amarillo Pastel)" → tela agrupada por color (Satín)
 *  - "Tela Antifluido Negro" → producto con ese título exacto
 */
export async function withProductSlugs<T extends { name?: string; productSlug?: string }>(items: T[]): Promise<T[]> {
  const list = items || []
  const missing = list.filter((i) => !i?.productSlug && i?.name)
  if (missing.length === 0) return list

  const { UNIFIED_FABRIC_CONFIGS } = await import("@/lib/unified-fabrics")
  const { client } = await import("@/sanity/lib/client")

  const baseName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, "").trim()
  const names = Array.from(new Set(missing.flatMap((i) => [String(i.name).trim(), baseName(String(i.name))])))

  let byTitle = new Map<string, string>()
  try {
    const found: Array<{ title: string; slug: string }> = await client.fetch(
      `*[_type == "product" && title in $names && defined(slug.current)]{ title, "slug": slug.current }`,
      { names }
    )
    byTitle = new Map(found.map((p) => [p.title.trim(), p.slug]))
  } catch (error) {
    console.warn("[review-links] No se pudieron resolver slugs por nombre:", error)
  }

  return list.map((item) => {
    if (item?.productSlug || !item?.name) return item
    const name = String(item.name).trim()
    const base = baseName(name)
    const unified = UNIFIED_FABRIC_CONFIGS.find((c) => c.name.trim() === base || c.name.trim() === name)
    const slug = byTitle.get(name) || byTitle.get(base) || unified?.unifiedSlug
    return slug ? { ...item, productSlug: slug } : item
  })
}
