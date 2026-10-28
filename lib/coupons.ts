import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { findUnifiedFabricConfig } from "@/lib/unified-fabrics"
import { colorGroupKey } from "@/lib/color-groups"
import { isUnitProduct } from "@/lib/utils"

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
  name?: string
  categorySlugs?: string[]
  price: number
  quantity: number
}

import { couponAllowsPayment, PAYMENT_METHOD_LABEL, type CouponPaymentMethods } from "@/lib/coupon-rules"
export { couponAllowsPayment, PAYMENT_METHOD_LABEL, type CouponPaymentMethods }

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
      /** Formas de pago permitidas (el carrito aún no sabe cuál usará el cliente) */
      paymentMethods: CouponPaymentMethods
      /** Mínimo de metros configurado (0 = sin mínimo) y metros que aplican en el carrito */
      minMeters: number
      eligibleMeters: number
    }
  | {
      ok: false
      code: string
      error: string
      reason: "NOT_FOUND" | "INACTIVE" | "NOT_STARTED" | "EXPIRED" | "NO_ELIGIBLE_ITEMS" | "EMPTY" | "MIN_METERS" | "PAYMENT_METHOD"
    }

// Sin CDN: activar/desactivar un cupón en Sanity debe reflejarse de inmediato
const freshClient = client.withConfig({ useCdn: false })

export function normalizeCouponCode(code: unknown): string {
  return String(code ?? "").trim().toUpperCase().replace(/\s+/g, "")
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })
}

type CouponProduct = { _id: string; slug?: string; colorGroup?: string; categoryIds?: string[]; usageIds?: string[]; toneIds?: string[] }

/** Tela a la que pertenece un producto: configuración de colores (Rib Pitillo, Rib 2x2...) o grupo de colores. */
function familyKey(slug?: string, colorGroup?: string): string | null {
  const config = slug ? findUnifiedFabricConfig(slug) : null
  if (config) return `tela:${config.id}`
  if (colorGroup && String(colorGroup).trim()) return `grupo:${colorGroupKey(colorGroup)}`
  return null
}

const itemKey = (item: CouponCartItem) => String(item.uniqueId ?? item.id ?? item.slug ?? "")
const cleanId = (id: unknown) => String(id ?? "").replace(/^drafts\./, "")

export async function evaluateCoupon(
  rawCode: unknown,
  items: CouponCartItem[],
  now: Date = new Date(),
  /** Forma de pago elegida en el checkout ("wompi" o "cod"); sin ella no se valida la forma de pago */
  options: { paymentMethod?: string } = {}
): Promise<CouponResult> {
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
      "productFamilies": products[]->{ "slug": slug.current, colorGroup },
      "categoryIds": categories[]._ref,
      "usageIds": usages[]._ref,
      "toneIds": tones[]._ref,
      fabrics,
      colorGroups,
      paymentMethods,
      minMeters
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
    const products: CouponProduct[] = await freshClient.fetch(
      groq`*[_type == "product" && (_id in $ids || slug.current in $slugs)]{
        _id,
        "slug": slug.current,
        colorGroup,
        "categoryIds": categories[]._ref,
        "usageIds": usages[]._ref,
        "toneIds": tones[]._ref
      }`,
      { ids, slugs }
    )

    const allowedSet = (refs?: string[]) => new Set<string>((refs || []).map(cleanId))
    const productIds = allowedSet(coupon.productIds)
    // Telas con varios colores: elegir un color en el cupón incluye todos los colores de esa tela
    const productFamilies = new Set<string>(
      ((coupon.productFamilies || []) as Array<{ slug?: string; colorGroup?: string }>)
        .map((p) => familyKey(p?.slug, p?.colorGroup))
        .filter((k): k is string => Boolean(k))
    )
    // Telas (subcategorías): configuraciones fijas (Rib Pitillo, Rib 2x2...) y grupos de colores
    const fabricFamilies = new Set<string>([
      ...((coupon.fabrics || []) as string[]).map((id) => `tela:${id}`),
      ...((coupon.colorGroups || []) as string[]).filter(Boolean).map((g) => `grupo:${colorGroupKey(g)}`),
    ])
    const categoryIds = allowedSet(coupon.categoryIds)
    const usageIds = allowedSet(coupon.usageIds)
    const toneIds = allowedSet(coupon.toneIds)
    const hasAny = (refs: string[] | undefined, allowed: Set<string>) => (refs || []).some((ref) => allowed.has(cleanId(ref)))

    const rules: Record<string, (p: CouponProduct, item: CouponCartItem) => boolean> = {
      products: (p, item) => {
        if (productIds.has(cleanId(p._id))) return true
        const family = familyKey(p.slug || item.slug, p.colorGroup)
        return Boolean(family && productFamilies.has(family))
      },
      fabrics: (p, item) => {
        const family = familyKey(p.slug || item.slug, p.colorGroup)
        return Boolean(family && fabricFamilies.has(family))
      },
      categories: (p) => hasAny(p.categoryIds, categoryIds),
      usages: (p) => hasAny(p.usageIds, usageIds),
      tones: (p) => hasAny(p.toneIds, toneIds),
    }
    // "Combinado": aplica si el producto cumple cualquiera de las listas
    const active = coupon.scope === "mixed" ? Object.values(rules) : rules[coupon.scope] ? [rules[coupon.scope]] : []

    eligible = validItems.filter((item) => {
      const product = products.find((p) => cleanId(p._id) === cleanId(item.id) || (item.slug && p.slug === item.slug))
      return product ? active.some((rule) => rule(product, item)) : false
    })
  }

  if (eligible.length === 0) {
    return { ok: false, code, reason: "NO_ELIGIBLE_ITEMS", error: "Ningún producto de tu carrito aplica para este cupón." }
  }

  const paymentMethods: CouponPaymentMethods = ["online", "cod"].includes(coupon.paymentMethods) ? coupon.paymentMethods : "all"
  if (options.paymentMethod && !couponAllowsPayment(paymentMethods, options.paymentMethod)) {
    const label = PAYMENT_METHOD_LABEL[paymentMethods as Exclude<CouponPaymentMethods, "all">]
    return { ok: false, code, reason: "PAYMENT_METHOD", error: `Este cupón solo aplica con ${label}.` }
  }

  // Mínimo de metros: solo telas que aplican al cupón (hilos y tijeras se venden por unidad y no suman)
  const minMeters = Math.max(0, Number(coupon.minMeters) || 0)
  const eligibleMeters = Math.round(
    eligible.filter((i) => !isUnitProduct({ slug: i.slug, name: i.name, categorySlugs: i.categorySlugs })).reduce((sum, i) => sum + Number(i.quantity), 0) * 100
  ) / 100
  if (minMeters > 0 && eligibleMeters < minMeters) {
    return {
      ok: false,
      code,
      reason: "MIN_METERS",
      error: `Este cupón aplica desde ${minMeters} m de tela${eligibleMeters > 0 ? ` (llevas ${eligibleMeters} m de telas que aplican)` : ""}.`,
    }
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
    paymentMethods,
    minMeters,
    eligibleMeters,
  }
}
