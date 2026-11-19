"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { useCart } from "@/lib/contexts/CartContext"
import { isUnitProduct } from "@/lib/utils"

/**
 * Cambiar cantidad o quitar un producto desde el resumen "Tu Orden" del checkout,
 * sin volver al carrito. El envío y los descuentos se recalculan solos al cambiar el carrito.
 */
export function CheckoutItemControls({ item }: { item: any }) {
  const { updateQuantity, removeItem } = useCart()
  const unit = isUnitProduct(item) ? "und" : "m"
  const set = (q: number) => {
    if (!Number.isFinite(q)) return
    if (q < 1) {
      if (window.confirm(`¿Quitar "${item.name}" del pedido?`)) removeItem(item.uniqueId)
      return
    }
    updateQuantity(item.uniqueId, Math.min(9999, Math.round(q)))
  }
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="inline-flex h-7 items-center overflow-hidden rounded-lg border border-border bg-background">
        <button
          type="button"
          onClick={() => set(item.quantity - 1)}
          className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Quitar 1 ${unit} de ${item.name}`}
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={item.quantity}
          onChange={(e) => {
            const q = parseInt(e.target.value, 10)
            if (q >= 1) set(q)
          }}
          className="h-full w-11 border-x border-border bg-transparent text-center text-xs font-medium [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label={`Cantidad de ${item.name}`}
        />
        <button
          type="button"
          onClick={() => set(item.quantity + 1)}
          className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Agregar 1 ${unit} de ${item.name}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <span className="text-[11px] text-muted-foreground">{unit}</span>
      <button
        type="button"
        onClick={() => set(0)}
        className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        aria-label={`Quitar ${item.name} del pedido`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Quitar
      </button>
    </div>
  )
}
