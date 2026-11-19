"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { useCart } from "@/lib/contexts/CartContext"
import { cn } from "@/lib/utils"
import { useStoreSettings } from "@/components/store-settings-provider"

/**
 * Globito "¡Agregado al carrito!" pegado al ícono del carrito. Aparece cada vez que se agrega un
 * producto y se oculta solo. placement: "below" (header arriba) o "above" (barra inferior del celular).
 */
export function CartAddedBubble({ placement = "below", onClick }: { placement?: "below" | "above"; onClick?: () => void }) {
  const { lastAdded, isCartOpen } = useCart()
  const { showAddedBubble } = useStoreSettings()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!lastAdded) return
    // Recién cargada la página no se muestra (solo cuando se agrega en esta visita)
    if (Date.now() - lastAdded.at > 5000) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 3500)
    return () => clearTimeout(t)
  }, [lastAdded])

  useEffect(() => {
    if (isCartOpen) setVisible(false)
  }, [isCartOpen])

  if (!showAddedBubble || !visible || !lastAdded) return null

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onClick}
      className={cn(
        "absolute right-0 z-[60] w-56 cursor-pointer animate-in fade-in zoom-in-95 duration-200",
        placement === "below" ? "top-full mt-2 slide-in-from-top-1" : "bottom-full mb-3 slide-in-from-bottom-1"
      )}
    >
      <div className="relative rounded-xl bg-emerald-600 px-3 py-2.5 text-left text-white shadow-xl">
        {/* Piquito del globo apuntando al ícono */}
        <span
          aria-hidden
          className={cn(
            "absolute right-3 h-3 w-3 rotate-45 bg-emerald-600",
            placement === "below" ? "-top-1.5" : "-bottom-1.5"
          )}
        />
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-emerald-600">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
          </span>
          ¡Agregado al carrito!
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-white/85">{lastAdded.name}</p>
      </div>
    </div>
  )
}
