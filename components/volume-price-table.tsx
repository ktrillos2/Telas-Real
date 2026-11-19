"use client"

import { Scale } from "lucide-react"
import { useVolumePricing } from "@/lib/hooks/use-volume-pricing"
import { matchPriceRow, tierForKg, tierTable } from "@/lib/volume-pricing"

/**
 * Aviso de precio preferencial en la ficha (texto editable en Sanity): desde cuántos kilos / metros
 * cambia el precio. Si la cantidad elegida ya alcanza un nivel, lo confirma.
 */
export function VolumePriceTable({
  productId,
  name,
  slug,
  isSublimated,
  meters,
  yieldFallback,
}: {
  productId?: string
  name: string
  slug?: string
  isSublimated?: boolean
  meters: number
  yieldFallback?: number | null
}) {
  const { rows, settings } = useVolumePricing()
  if (!settings.enabled || !settings.showTableOnProduct || rows.length === 0) return null
  const row = matchPriceRow(rows, { id: productId, name, slug, isSublimated })
  if (!row) return null
  const table = tierTable(row, settings, yieldFallback)
  if (table.length < 2) return null // solo precio retail: no hay descuento que mostrar
  const y = Number(row.yieldPerKg || yieldFallback) || 0
  const current = y ? tierForKg(meters / y, settings) : "retail"
  const first = table.find((t) => t.fromKg > 0)
  if (!first) return null
  const reached = current !== "retail"
  const text = reached
    ? `¡Con esta cantidad ya tienes precio preferencial (${settings.labels[current]})! Se aplica en el carrito.`
    : settings.productNotice
        .replaceAll("{kg}", String(first.fromKg))
        .replaceAll("{metros}", first.fromMeters ? first.fromMeters.toLocaleString("es-CO") : "")
        .replace(/\s*\(unos\s+m de esta tela\)/, "")

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
      <Scale className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className={reached ? "font-semibold text-primary" : ""}>{text}</p>
    </div>
  )
}
