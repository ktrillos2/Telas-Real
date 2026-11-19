"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/contexts/CartContext"

/**
 * Enlace de los recordatorios de carrito abandonado: vuelve a poner las telas en el carrito, aplica
 * el cupón de incentivo (si viene) y lleva directo al checkout.
 */
function RecoverCart() {
  const router = useRouter()
  const params = useSearchParams()
  const { addItem, clearCart, applyCoupon, items } = useCart()
  // El cupón se aplica cuando el carrito ya tiene las telas (applyCoupon usa los ítems actuales)
  const [pendingCoupon, setPendingCoupon] = useState<string | null>(null)
  const [state, setState] = useState<"loading" | "done" | "error" | "completed">("loading")
  const [message, setMessage] = useState("")
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const p = params.get("p") || ""
    const t = params.get("t") || ""
    const coupon = params.get("c") || ""
    ;(async () => {
      try {
        const res = await fetch(`/api/cart/recover?p=${encodeURIComponent(p)}&t=${encodeURIComponent(t)}`)
        const data = await res.json()
        if (data?.alreadyCompleted) {
          setState("completed")
          return
        }
        if (!res.ok || !Array.isArray(data?.items) || data.items.length === 0) throw new Error(data?.error || "No encontramos tu carrito")
        clearCart()
        for (const item of data.items) {
          const { quantity, ...rest } = item
          addItem(rest, quantity)
        }
        if (coupon) {
          setPendingCoupon(coupon)
        } else {
          setState("done")
          setTimeout(() => router.replace("/checkout"), 300)
        }
      } catch (e: any) {
        setMessage(e?.message || "No encontramos tu carrito")
        setState("error")
      }
    })()
  }, [params, addItem, clearCart, router])

  useEffect(() => {
    if (!pendingCoupon || items.length === 0) return
    const code = pendingCoupon
    setPendingCoupon(null)
    applyCoupon(code).then((r) => {
      if (!r.ok) setMessage(r.error || "")
      setState("done")
      setTimeout(() => router.replace("/checkout"), 600)
    })
  }, [pendingCoupon, items, applyCoupon, router])

  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      {state === "loading" || state === "done" ? (
        <>
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" aria-hidden />
          <h1 className="text-2xl font-light">Recuperando tu carrito…</h1>
          <p className="mt-2 text-sm text-muted-foreground">Te llevamos al pago con tus telas{params.get("c") ? " y tu descuento" : ""}.</p>
          {message && <p className="mt-2 text-xs text-amber-600">{message}</p>}
        </>
      ) : state === "completed" ? (
        <>
          <ShoppingCart className="mb-4 h-8 w-8 text-primary" aria-hidden />
          <h1 className="text-2xl font-light">¡Este pedido ya fue completado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gracias por tu compra. Si quieres más telas, sigue explorando la tienda.</p>
          <Link href="/tienda" className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Ir a la tienda</Link>
        </>
      ) : (
        <>
          <ShoppingCart className="mb-4 h-8 w-8 text-muted-foreground" aria-hidden />
          <h1 className="text-2xl font-light">No pudimos recuperar tu carrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}. Puedes volver a elegir tus telas en la tienda.</p>
          <Link href="/tienda" className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Ir a la tienda</Link>
        </>
      )}
    </main>
  )
}

export default function RecoverCartPage() {
  return (
    <Suspense fallback={null}>
      <RecoverCart />
    </Suspense>
  )
}
