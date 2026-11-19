"use client"

import { Scale } from "lucide-react"
import { useVolumePricing } from "@/lib/hooks/use-volume-pricing"
import { matchPriceRow, tierForKg, tierTable } from "@/lib/volume-pricing"

/**
 * Tabla "Precio por volumen" de la ficha: precio por metro según cuántos kilos se compran, con su
 * equivalente en metros (rendimiento). Se resalta el nivel que alcanza la cantidad elegida.
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
  const cop = (n: number) => `$${n.toLocaleString("es-CO")}`

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Scale className="h-4 w-4 text-primary" aria-hidden />
        Precio por volumen
        <span className="ml-auto text-[11px] font-normal text-muted-foreground">{y ? `${y} m por kilo` : ""}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-1.5 font-medium">Compra</th>
              <th className="pb-1.5 font-medium">Desde</th>
              <th className="pb-1.5 text-right font-medium">Precio / metro</th>
            </tr>
          </thead>
          <tbody>
            {table.map((t) => {
              const active = t.tier === current
              return (
                <tr key={t.tier} className={active ? "font-semibold text-primary" : ""}>
                  <td className="border-t border-primary/10 py-1.5">{t.label}{active ? " ✓" : ""}</td>
                  <td className="border-t border-primary/10 py-1.5 text-muted-foreground">
                    {t.fromKg === 0 ? "1 metro" : `${t.fromMeters.toLocaleString("es-CO")} m (${t.fromKg} kg)`}
                  </td>
                  <td className="border-t border-primary/10 py-1.5 text-right tabular-nums">{cop(t.pricePerMeter)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Se suman los metros de todos los colores de esta tela en tu carrito. El descuento se aplica solo al pagar.
      </p>
    </div>
  )
}
