"use client"

import { useState } from "react"
import { Tag, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart, type AppliedCoupon } from "@/lib/contexts/CartContext"
import { couponAllowsPayment, PAYMENT_METHOD_LABEL } from "@/lib/coupon-rules"

/** Condiciones del cupón para mostrar al cliente (forma de pago y mínimo de metros). */
function couponConditions(coupon: AppliedCoupon): string[] {
  const notes: string[] = []
  if (coupon.paymentMethods && coupon.paymentMethods !== "all") notes.push(`Válido solo con ${PAYMENT_METHOD_LABEL[coupon.paymentMethods]}.`)
  if (coupon.minMeters && coupon.minMeters > 0) notes.push(`Desde ${coupon.minMeters} m de tela que aplique.`)
  return notes
}

/**
 * Campo para aplicar un cupón de descuento (carrito lateral y checkout).
 * El cupón queda guardado en el carrito y su descuento se recalcula al cambiar los productos.
 */
export function CouponBox({ compact = false }: { compact?: boolean }) {
  const { coupon, couponDiscount, couponError, isCouponLoading, applyCoupon, removeCoupon } = useCart()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)

  const handleApply = async () => {
    setError("")
    const result = await applyCoupon(code)
    if (result.ok) setCode("")
    else setError(result.error || "El cupón no es válido.")
  }

  // Cupón aplicado
  if (coupon) {
    return (
      <div className={`rounded-lg border ${couponDiscount > 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"} p-3 space-y-1`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Tag className={`w-4 h-4 shrink-0 ${couponDiscount > 0 ? "text-emerald-600" : "text-amber-600"}`} />
            <span className="text-sm font-medium truncate">
              {coupon.code} {coupon.percent > 0 && <span className="font-normal">· {coupon.percent}% OFF</span>}
            </span>
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
            aria-label="Quitar cupón"
          >
            <X className="w-3.5 h-3.5" /> Quitar
          </button>
        </div>
        {couponConditions(coupon).map((note) => (
          <p key={note} className="text-[11px] text-muted-foreground font-light">{note}</p>
        ))}
        {couponDiscount > 0 ? (
          <p className="text-xs text-emerald-700 font-light">
            Ahorras ${couponDiscount.toLocaleString("es-CO")} en {coupon.eligibleItems.length === 1 ? "1 producto" : `${coupon.eligibleItems.length} productos`}.
          </p>
        ) : (
          <p className="text-xs text-amber-800 font-light">{couponError || "Ningún producto de tu carrito aplica para este cupón."}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full ${compact ? "text-xs" : "text-sm"} font-light`}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> ¿Tienes un código de descuento?</span>
        <span className="text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              placeholder="Código de cupón"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError("") }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (code) handleApply() } }}
              className="flex-1 uppercase"
              disabled={isCouponLoading}
              aria-label="Código de cupón"
            />
            <Button type="button" onClick={handleApply} disabled={!code || isCouponLoading}>
              {isCouponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
            </Button>
          </div>
          {(error || couponError) && <p className="text-xs text-destructive font-light">{error || couponError}</p>}
        </div>
      )}
    </div>
  )
}

/**
 * Línea de descuento por cupón para los resúmenes de totales. En el checkout se pasa la forma de
 * pago elegida: si el cupón no aplica con ella, se avisa en vez de descontar.
 */
export function CouponDiscountLine({ className = "", paymentMethod }: { className?: string; paymentMethod?: string }) {
  const { coupon, couponDiscount } = useCart()
  if (!coupon || couponDiscount <= 0) return null
  if (paymentMethod && !couponAllowsPayment(coupon.paymentMethods, paymentMethod)) {
    return (
      <div className={`flex justify-between text-muted-foreground ${className}`}>
        <span className="text-xs sm:text-sm">
          Cupón {coupon.code}: solo aplica con {PAYMENT_METHOD_LABEL[coupon.paymentMethods as "online" | "cod"]}
        </span>
        <span className="line-through text-xs sm:text-sm">- ${couponDiscount.toLocaleString("es-CO")}</span>
      </div>
    )
  }
  return (
    <div className={`flex justify-between text-green-600 ${className}`}>
      <span className="font-medium text-xs sm:text-sm">Cupón {coupon.code} ({coupon.percent}%)</span>
      <span className="font-medium">- ${couponDiscount.toLocaleString("es-CO")}</span>
    </div>
  )
}
