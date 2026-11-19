import { createClient } from "next-sanity"
import { apiVersion, dataset, projectId } from "@/sanity/env"
import { cachedClient } from "@/sanity/lib/client"
import { PRICE_LIST_QUERY, mergeVolumeSettings, type PriceListRow, type VolumeSettings } from "@/lib/volume-pricing"
import seed from "@/lib/price-list-seed.json"

/**
 * Lista de precios por volumen desde Sanity. La primera vez (si aún no hay filas) se suben las 124
 * referencias de la lista "PRECIOS WEB" (lib/price-list-seed.json) con ids fijos: después todo se
 * edita en el admin (Catálogo → Precios por volumen) y este archivo no se vuelve a usar.
 */

const writeClient = createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_TOKEN })
let seedAttempted = false

async function ensureSeeded(): Promise<boolean> {
  if (seedAttempted || !process.env.SANITY_API_TOKEN) return false
  seedAttempted = true
  try {
    const count = await writeClient.fetch<number>(`count(*[_type == "priceListItem"])`)
    if (count > 0) return false
    const tx = writeClient.transaction()
    for (const r of seed as any[]) {
      tx.createIfNotExists({
        _id: r._id,
        _type: "priceListItem",
        isActive: true,
        reference: r.reference || undefined,
        name: r.name,
        tipo: r.tipo,
        yieldPerKg: r.yieldPerKg ?? undefined,
        retail: r.retail ?? undefined,
        medio: r.medio ?? undefined,
        alto: r.alto ?? undefined,
        premium: r.premium ?? undefined,
        matchTerms: r.matchTerms,
        sheetStatus: r.status || undefined,
        notes: r.notes || undefined,
      })
    }
    tx.createIfNotExists({
      _id: "volumePricingSettings",
      _type: "volumePricingSettings",
      enabled: true,
      medioFromKg: 25,
      altoFromKg: 80,
      premiumFromKg: 400,
      stackWithPromotions: false,
      showTableOnProduct: true,
    })
    await tx.commit()
    console.log(`[precios por volumen] Lista inicial cargada en Sanity (${(seed as any[]).length} referencias)`)
    return true
  } catch (err) {
    console.error("[precios por volumen] No se pudo cargar la lista inicial:", err)
    return false
  }
}

export async function getVolumePricing(opts: { fresh?: boolean } = {}): Promise<{ rows: PriceListRow[]; settings: VolumeSettings }> {
  const created = await ensureSeeded()
  try {
    const data: any = opts.fresh || created ? await writeClient.fetch(PRICE_LIST_QUERY) : await cachedClient.fetch(PRICE_LIST_QUERY)
    return { rows: data?.rows || [], settings: mergeVolumeSettings(data?.settings) }
  } catch (err) {
    console.error("[precios por volumen] Error leyendo la lista:", err)
    return { rows: [], settings: mergeVolumeSettings(null) }
  }
}
