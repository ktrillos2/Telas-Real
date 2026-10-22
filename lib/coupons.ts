import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"

/**
 * Cupones de descuento (Sanity → "Promociones y Eventos → Cupones de Descuento").
 *
 * La misma función valida el cupón en el carrito (/api/coupons/validate) y al crear el pedido
 * (app/actions/order.ts), para que el total cobrado en Wompi coincida con lo que vio el cliente.
 */

export type CouponCartItem = {
  uniqueId?: string
  id?: string | number
  slug?: string
  price: number
  quantity: number
}

export type CouponResult =
  | {
      ok: true
      code: string
      title: string
      percent: number
      discount: number
      eligibleSubtotal: number
      /** uniqueId (o id) de los ítems del carrito a los que aplica */
      eligibleItems: string[]
    }
  | { ok: false; code: string; error: string; reason: "NOT_FOUND" | "INACTIVE" | "NOT_STARTED" | "EXPIRED" | "NO_ELIGIBLE_ITEMS" | "EMPTY" }

// Sin CDN: activar/desactivar un cupón en Sanity debe reflejarse de inmediato
const freshClient = client.withConfig({ useCdn: false })

export function normalizeCouponCode(code: unknown): string {
  return String(code ?? "").trim().toUpperCase().replace(/\s+/g, "")
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })
}

const itemKey = (item: CouponCartItem) => String(item.uniqueId ?? item.id ?? item.slug ?? "")
const cleanId = (id: unknown) => String(id ?? "").replace(/^drafts\./, "")

export async function evaluateCoupon(rawCode: unknown, items: CouponCartItem[], now: Date = new Date()): Promise<CouponResult> {
  const code = normalizeCouponCode(rawCode)
  if (!code) return { ok: false, code, reason: "EMPTY", error: "Escribe un código de cupón." }

  const coupon = await freshClient.fetch(
    groq`*[_type == "coupon" && code.current == $code && !(_id in path("drafts.**"))][0]{
      title,
      discountPercent,
      isActive,
      startDate,
      endDate,
      scope,
      "productIds": products[]._ref,
      "categoryIds": categories[]._ref,
      "usageIds": usages[]._ref
    }`,
    { code }
  )

  if (!coupon) return { ok: false, code, reason: "NOT_FOUND", error: "El código de cupón no existe." }
  if (coupon.isActive === false) return { ok: false, code, reason: "INACTIVE", error: "Este cupón no está activo." }
  if (coupon.startDate && now < new Date(coupon.startDate)) {
    return { ok: false, code, reason: "NOT_STARTED", error: `Este cupón es válido a partir del ${formatDate(coupon.startDate)}.` }
  }
  if (coupon.endDate && now > new Date(coupon.endDate)) {
    return { ok: false, code, reason: "EXPIRED", error: `Este cupón venció el ${formatDate(coupon.endDate)}.` }
  }

  const percent = Math.min(100, Math.max(0, Number(coupon.discountPercent) || 0))
  const validItems = (items || []).filter((i) => Number(i.price) > 0 && Number(i.quantity) > 0)
  let eligible: CouponCartItem[] = validItems

  if (coupon.scope && coupon.scope !== "all") {
    const ids = Array.from(new Set(validItems.map((i) => cleanId(i.id)).filter(Boolean)))
    const slugs = Array.from(new Set(validItems.map((i) => String(i.slug ?? "")).filter(Boolean)))
    const products: Array<{ _id: string; slug?: string; categoryIds?: string[]; usageIds?: string[] }> = await freshClient.fetch(
      groq`*[_type == "product" && (_id in $ids || slug.current in $slugs)]{
        _id,
        "slug": slug.current,
        "categoryIds": categories[]._ref,
        "usageIds": usages[]._ref
      }`,
      { ids, slugs }
    )

    const allowed = new Set<string>(
      ((coupon.scope === "products" ? coupon.productIds : coupon.scope === "categories" ? coupon.categoryIds : coupon.usageIds) || []).map(cleanId)
    )
    const matches = (p: { _id: string; categoryIds?: string[]; usageIds?: string[] }) => {
      if (coupon.scope === "products") return allowed.has(cleanId(p._id))
      const refs = coupon.scope === "categories" ? p.categoryIds : p.usageIds
      return (refs || []).some((ref) => allowed.has(cleanId(ref)))
    }

    eligible = validItems.filter((item) => {
      const product = products.find((p) => cleanId(p._id) === cleanId(item.id) || (item.slug && p.slug === item.slug))
      return product ? matches(product) : false
    })
  }

  if (eligible.length === 0) {
    return { ok: false, code, reason: "NO_ELIGIBLE_ITEMS", error: "Ningún producto de tu carrito aplica para este cupón." }
  }

  const eligibleSubtotal = eligible.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
  const discount = Math.round(eligibleSubtotal * (percent / 100))

  return {
    ok: true,
    code,
    title: coupon.title || code,
    percent,
    discount,
    eligibleSubtotal,
    eligibleItems: eligible.map(itemKey),
  }
}
