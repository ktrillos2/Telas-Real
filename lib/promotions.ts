/**
 * Promoción por metros / kilos (Sanity → "eventSettings").
 *
 * El mismo cálculo se usa en el carrito (components/cart-sidebar.tsx), en el checkout
 * (app/checkout/page.tsx) y al crear el pedido (app/actions/order.ts), para que el total
 * cobrado en Wompi coincida con el "Total a Pagar" que vio el cliente.
 *
 * Este módulo no importa Sanity: es puro y se puede usar en cliente y servidor.
 */

export type PromotionTier = {
  name?: string
  minKg?: number
  maxKg?: number
  discountType?: "percentage" | "fixed"
  discountValue?: number
  requiresCombo?: boolean
  comboCategorySlug?: string
  comboMinQuantity?: number
  description?: string
}

export type PromotionSettings = {
  isActive?: boolean
  title?: string
  campaignName?: string
  discountType?: "percentage" | "fixed"
  discountPercentage?: number
  discountPromoPercentage?: number
  discountUnit?: "meter" | "kg"
  startDate?: string
  endDate?: string
  eventTag?: string
  discountNoPromo?: number
  discountPromo?: number
  termsAndConditions?: string
  applicableCategories?: string[] | null
  applicableProducts?: string[] | null
  tiers?: PromotionTier[] | null
}

export type PromotionCartItem = {
  name?: string
  slug?: string
  categorySlugs?: string[]
  price: number
  quantity: number
  unit?: string
  weightKg?: number
  hasPromo?: boolean
}

export type PromotionResult = {
  /** Descuento total en COP (0 si no hay promoción activa o no aplica) */
  discount: number
  isActive: boolean
  isMeterUnit: boolean
  isPercentagePromo: boolean
  appliedTierName: string
  /** Metros (o kg estimados) de tela participante */
  totalApplicableUnits: number
  totalApplicableKg: number
  threadCount: number
}

/**
 * Promoción activa, publicada (sin borradores) y con la misma forma en cliente y servidor.
 * Si hubiera varias activas, todos toman la editada más recientemente.
 */
export const ACTIVE_PROMOTION_QUERY = `*[_type == "eventSettings" && isActive == true && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{
  isActive,
  title,
  campaignName,
  discountType,
  discountPercentage,
  discountPromoPercentage,
  discountUnit,
  startDate,
  endDate,
  eventTag,
  discountNoPromo,
  discountPromo,
  termsAndConditions,
  "applicableCategories": applicableCategories[]->slug.current,
  "applicableProducts": applicableProducts[]->slug.current,
  "tiers": tiers[]{
    name,
    minKg,
    maxKg,
    discountType,
    discountValue,
    requiresCombo,
    "comboCategorySlug": comboCategory->slug.current,
    comboMinQuantity,
    description
  }
}`

export function isPromotionActive(settings: PromotionSettings | null | undefined, now: Date = new Date()): boolean {
  if (!settings?.isActive) return false
  const start = settings.startDate ? new Date(settings.startDate) : null
  const end = settings.endDate ? new Date(settings.endDate) : null
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

const isThreadItem = (item: PromotionCartItem) =>
  (item.categorySlugs?.some((s) => /hilo/i.test(s)) ?? false) ||
  (item.name?.toLowerCase().includes("hilo") ?? false) ||
  (item.slug?.includes("hilo") ?? false)

export function calculatePromotionDiscount(
  items: PromotionCartItem[],
  settings: PromotionSettings | null | undefined,
  now: Date = new Date()
): PromotionResult {
  const isMeterUnit = settings?.discountUnit !== "kg"
  const isPercentagePromo =
    settings?.discountType === "percentage" ||
    (!settings?.discountType && !settings?.discountNoPromo && !!settings?.discountPercentage)

  const result: PromotionResult = {
    discount: 0,
    isActive: false,
    isMeterUnit,
    isPercentagePromo,
    appliedTierName: "",
    totalApplicableUnits: 0,
    totalApplicableKg: 0,
    threadCount: 0,
  }

  if (!settings || !isPromotionActive(settings, now)) return result
  result.isActive = true

  const applicableCategories = settings.applicableCategories || []
  const applicableProducts = settings.applicableProducts || []
  const hasApplicableCategories = applicableCategories.length > 0
  const hasApplicableProducts = applicableProducts.length > 0

  let unitsNoPromo = 0
  let unitsPromo = 0
  let applicableFabricKg = 0
  let applicableFabricSubtotal = 0
  let threadCount = 0

  for (const item of items || []) {
    const quantity = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    const isThread = isThreadItem(item)
    if (isThread) threadCount += quantity

    const matchesCategory = hasApplicableCategories && (item.categorySlugs?.some((slug) => applicableCategories.includes(slug)) ?? false)
    const matchesProduct = hasApplicableProducts && !!item.slug && applicableProducts.includes(item.slug)
    const matches = (!hasApplicableCategories && !hasApplicableProducts) || matchesCategory || matchesProduct

    if (matches && !isThread) {
      const itemKg = item.unit === "kg" ? quantity : quantity * (Number(item.weightKg) || 0.35)
      applicableFabricKg += itemKg
      applicableFabricSubtotal += price * quantity

      const unitCount = isMeterUnit ? quantity : itemKg
      if (item.hasPromo) unitsPromo += unitCount
      else unitsNoPromo += unitCount
    }
  }

  result.totalApplicableUnits = unitsNoPromo + unitsPromo
  result.totalApplicableKg = applicableFabricKg
  result.threadCount = threadCount

  let discount = 0
  if (isPercentagePromo) {
    const tiers = settings.tiers
    if (tiers && tiers.length > 0) {
      let matchedTier: PromotionTier | null = null

      // Preferencia al tramo combo si se cumple la cantidad de hilos
      for (const tier of tiers) {
        const minKg = tier.minKg ?? 0
        const maxKg = tier.maxKg ?? Infinity
        const withinRange = applicableFabricKg >= minKg && (applicableFabricKg <= maxKg || maxKg === 0)
        if (!withinRange) continue

        if (tier.requiresCombo) {
          if (threadCount >= (tier.comboMinQuantity || 1)) {
            matchedTier = tier
            break
          }
        } else if (!matchedTier) {
          matchedTier = tier
        }
      }

      if (matchedTier) {
        result.appliedTierName = `${matchedTier.name || settings.eventTag || "PROMO"} (${matchedTier.discountValue}${matchedTier.discountType === "fixed" ? "$" : "%"})`
        discount =
          matchedTier.discountType === "fixed"
            ? Math.floor(applicableFabricKg) * (matchedTier.discountValue || 0)
            : Math.round(applicableFabricSubtotal * ((matchedTier.discountValue || 0) / 100))
      } else if (applicableFabricKg >= 1 && settings.discountPercentage) {
        result.appliedTierName = `${settings.eventTag || "PROMO"} (${settings.discountPercentage}%)`
        discount = Math.round(applicableFabricSubtotal * (settings.discountPercentage / 100))
      }
    } else {
      const pct = settings.discountPercentage || 0
      result.appliedTierName = `${settings.eventTag || "PROMO"} (${pct}%)`
      discount = Math.round(applicableFabricSubtotal * (pct / 100))
    }
  } else {
    // Monto fijo por metro / kg
    discount =
      Math.floor(unitsNoPromo) * (settings.discountNoPromo || 0) +
      Math.floor(unitsPromo) * (settings.discountPromo || 0)
  }

  result.discount = Math.max(0, discount)
  return result
}
