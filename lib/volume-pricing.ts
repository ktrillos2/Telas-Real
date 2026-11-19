/**
 * Precios por volumen (lista "PRECIOS WEB"): cada referencia de tela tiene precio por metro en 4 niveles
 * según los kilos que se compran (Retail, Medio, Alto, Premium). Como se vende por metro, los kilos se
 * calculan con el rendimiento (m/kg): kg = metros ÷ rendimiento. Así el descuento es el mismo pidiendo
 * en metros o en kilos.
 *
 * Funciones puras: las usan el carrito, el checkout, la ficha y el servidor (createOrder) con los mismos datos.
 */

export type VolumeTierKey = "retail" | "medio" | "alto" | "premium"

export interface PriceListRow {
  _id?: string
  reference?: string
  name: string
  /** sublimado | colores | blanco | crudo */
  tipo: string
  /** Rendimiento en metros por kilo */
  yieldPerKg?: number | null
  retail?: number | null
  medio?: number | null
  alto?: number | null
  premium?: number | null
  /** Palabras que debe tener el nombre del producto ("a|b" = cualquiera, "!x" = no debe tener x) */
  matchTerms?: string[]
  /** Productos asignados a mano (ids) que usan esta fila aunque el nombre no coincida */
  extraProductIds?: string[]
  /** Productos que NO deben usar esta fila */
  excludedProductIds?: string[]
  isActive?: boolean
}

export interface VolumeSettings {
  enabled: boolean
  medioFromKg: number
  altoFromKg: number
  premiumFromKg: number
  /** ¿Se suma con las promociones por metros/kg? Si no, se aplica el mayor de los dos */
  stackWithPromotions: boolean
  showTableOnProduct: boolean
  labels: Record<VolumeTierKey, string>
}

export const DEFAULT_VOLUME_SETTINGS: VolumeSettings = {
  enabled: true,
  medioFromKg: 25,
  altoFromKg: 80,
  premiumFromKg: 400,
  stackWithPromotions: false,
  showTableOnProduct: true,
  labels: { retail: "Por cortes", medio: "Mayorista", alto: "Alto volumen", premium: "Premium" },
}

export const TIER_ORDER: VolumeTierKey[] = ["retail", "medio", "alto", "premium"]

export function mergeVolumeSettings(doc: any): VolumeSettings {
  const s = { ...DEFAULT_VOLUME_SETTINGS, labels: { ...DEFAULT_VOLUME_SETTINGS.labels } }
  if (!doc) return s
  if (typeof doc.enabled === "boolean") s.enabled = doc.enabled
  for (const k of ["medioFromKg", "altoFromKg", "premiumFromKg"] as const) {
    if (Number(doc[k]) > 0) s[k] = Number(doc[k])
  }
  if (typeof doc.stackWithPromotions === "boolean") s.stackWithPromotions = doc.stackWithPromotions
  if (typeof doc.showTableOnProduct === "boolean") s.showTableOnProduct = doc.showTableOnProduct
  for (const k of TIER_ORDER) {
    const v = doc[`label_${k}`] ?? doc.labels?.[k]
    if (typeof v === "string" && v.trim()) s.labels[k] = v.trim()
  }
  return s
}

// ---------------------------------------------------------------------------------------------
// Producto → fila de la lista
// ---------------------------------------------------------------------------------------------
export function normalizeText(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/jaquard|juquard/g, "jacquard")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Nombre del producto sin "X Metros" ni el descriptor "| Tela Deportiva", "| Tela Liviana"… */
function productText(name: string): string {
  const t = String(name || "")
    .replace(/\|\s*tela\s+[^|(]*/i, " ")
    .replace(/\s+x\s+metros?/i, " ")
  return ` ${normalizeText(t)} `
}

const STRONG_WORDS = ["licrado", "uniforme", "standard", "neon", "crudo", "terry", "pro", "perla", "crispo", "pitillo", "rayas", "conejo"]

export interface MatchableProduct {
  id?: string
  name: string
  slug?: string
  isSublimated?: boolean
}

export function isSublimatedProduct(p: { name?: string; slug?: string; designSelectionEnabled?: boolean; isSublimated?: boolean }): boolean {
  return Boolean(p.isSublimated || p.designSelectionEnabled || /sublimad/i.test(`${p.name || ""} ${p.slug || ""}`))
}

/** Fila de la lista que corresponde al producto (o null si no hay). */
export function matchPriceRow(rows: PriceListRow[], product: MatchableProduct): PriceListRow | null {
  const id = String(product.id || "").replace(/^drafts\./, "")
  const active = rows.filter((r) => r.isActive !== false)
  if (id) {
    const manual = active.find((r) => r.extraProductIds?.includes(id))
    if (manual) return manual
  }
  const text = productText(product.name)
  const sub = isSublimatedProduct(product)
  let best: { score: number; row: PriceListRow } | null = null
  for (const row of active) {
    if (id && row.excludedProductIds?.includes(id)) continue
    if ((row.tipo === "sublimado") !== sub) continue
    const terms = row.matchTerms || []
    if (terms.length === 0) continue
    let ok = true
    const words: string[] = []
    for (const term of terms) {
      if (term.startsWith("!")) {
        if (text.includes(` ${term.slice(1)} `)) ok = false
        continue
      }
      const alts = term.split("|").map((a) => a.trim()).filter(Boolean)
      if (!alts.some((a) => text.includes(` ${a} `))) ok = false
      words.push(...alts)
    }
    if (!ok) continue
    let penalty = 0
    for (const q of [...STRONG_WORDS, "blanco"]) {
      if (text.includes(` ${q} `) && !words.includes(q)) penalty += STRONG_WORDS.includes(q) ? 3 : 1
    }
    const score = terms.filter((t) => !t.startsWith("!")).length * 10 - penalty
    if (!best || score > best.score) best = { score, row }
  }
  return best?.row || null
}

// ---------------------------------------------------------------------------------------------
// Niveles
// ---------------------------------------------------------------------------------------------
export function tierForKg(kg: number, s: VolumeSettings): VolumeTierKey {
  if (kg >= s.premiumFromKg) return "premium"
  if (kg >= s.altoFromKg) return "alto"
  if (kg >= s.medioFromKg) return "medio"
  return "retail"
}

/** Precio por metro del nivel; si el nivel no tiene precio, usa el nivel anterior que sí tenga. */
export function priceForTier(row: PriceListRow, tier: VolumeTierKey): number | null {
  for (let i = TIER_ORDER.indexOf(tier); i >= 0; i--) {
    const v = Number(row[TIER_ORDER[i]])
    if (v > 0) return v
  }
  return null
}

/** Tabla para mostrar en la ficha: precio por metro y desde cuántos metros / kilos aplica cada nivel. */
export function tierTable(row: PriceListRow, s: VolumeSettings, yieldOverride?: number | null) {
  const y = Number(row.yieldPerKg || yieldOverride) || 0
  const fromKg: Record<VolumeTierKey, number> = { retail: 0, medio: s.medioFromKg, alto: s.altoFromKg, premium: s.premiumFromKg }
  return TIER_ORDER.map((tier) => {
    const price = Number(row[tier]) || 0
    return {
      tier,
      label: s.labels[tier],
      pricePerMeter: price,
      pricePerKg: price && y ? Math.round(price * y) : 0,
      fromKg: fromKg[tier],
      fromMeters: y ? Math.ceil(fromKg[tier] * y) : 0,
    }
  }).filter((t) => t.pricePerMeter > 0)
}

// ---------------------------------------------------------------------------------------------
// Descuento del carrito
// ---------------------------------------------------------------------------------------------
export interface VolumeCartItem {
  id?: string | number
  name: string
  slug?: string
  price: number
  quantity: number
  isUnit?: boolean
  isSublimated?: boolean
  designSelectionEnabled?: boolean
}

export interface VolumeGroup {
  rowName: string
  kg: number
  meters: number
  tier: VolumeTierKey
  tierLabel: string
  discount: number
  /** Metros que faltan para el siguiente nivel (para animar a comprar más) */
  metersToNext?: number
  nextTierLabel?: string
}

export interface VolumeResult {
  discount: number
  groups: VolumeGroup[]
}

/**
 * Se suman los metros de todos los colores de la misma referencia (ej. 30 kg en distintos colores
 * de Brush cuentan juntos) y se aplica el precio del nivel alcanzado a cada línea.
 */
export function calculateVolumeDiscount(items: VolumeCartItem[], rows: PriceListRow[], s: VolumeSettings): VolumeResult {
  const result: VolumeResult = { discount: 0, groups: [] }
  if (!s.enabled || !rows?.length || !items?.length) return result

  const byRow = new Map<PriceListRow, VolumeCartItem[]>()
  for (const item of items) {
    if (item.isUnit || !(Number(item.quantity) > 0)) continue
    const row = matchPriceRow(rows, {
      id: item.id != null ? String(item.id) : undefined,
      name: item.name,
      slug: item.slug,
      isSublimated: isSublimatedProduct(item),
    })
    if (!row || !(Number(row.yieldPerKg) > 0)) continue
    if (!byRow.has(row)) byRow.set(row, [])
    byRow.get(row)!.push(item)
  }

  for (const [row, lines] of byRow) {
    const meters = lines.reduce((sum, it) => sum + Number(it.quantity), 0)
    const kg = meters / Number(row.yieldPerKg)
    const tier = tierForKg(kg, s)
    const tierPrice = priceForTier(row, tier)
    let discount = 0
    if (tier !== "retail" && tierPrice) {
      for (const it of lines) {
        const diff = Number(it.price) - tierPrice
        if (diff > 0) discount += diff * Number(it.quantity)
      }
    }
    discount = Math.round(discount)
    const next = TIER_ORDER[TIER_ORDER.indexOf(tier) + 1]
    const nextKg = next === "medio" ? s.medioFromKg : next === "alto" ? s.altoFromKg : next === "premium" ? s.premiumFromKg : 0
    const group: VolumeGroup = { rowName: row.name, kg, meters, tier, tierLabel: s.labels[tier], discount }
    if (next && nextKg && Number(row[next]) > 0) {
      group.metersToNext = Math.max(0, Math.ceil(nextKg * Number(row.yieldPerKg) - meters))
      group.nextTierLabel = s.labels[next]
    }
    result.groups.push(group)
    result.discount += discount
  }
  return result
}

/** Promoción por metros/kg y precio por volumen: se suman o se aplica solo el mayor (según la configuración). */
export function combineWithPromotion(promoDiscount: number, volumeDiscount: number, s: VolumeSettings) {
  if (s.stackWithPromotions) return { promo: promoDiscount, volume: volumeDiscount }
  return volumeDiscount > promoDiscount ? { promo: 0, volume: volumeDiscount } : { promo: promoDiscount, volume: 0 }
}

export const PRICE_LIST_QUERY = `{
  "rows": *[_type == "priceListItem" && !(_id in path("drafts.**")) && isActive != false]{
    _id, reference, name, tipo, yieldPerKg, retail, medio, alto, premium, matchTerms, isActive,
    "extraProductIds": extraProducts[]._ref, "excludedProductIds": excludedProducts[]._ref
  },
  "settings": *[_id == "volumePricingSettings"][0]
}`
