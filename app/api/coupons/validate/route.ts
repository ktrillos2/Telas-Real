import { NextResponse } from "next/server"
import { evaluateCoupon } from "@/lib/coupons"

export const dynamic = "force-dynamic"

/** Valida un cupón contra los ítems del carrito y devuelve el descuento calculado en el servidor. */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items.slice(0, 200) : []
    const result = await evaluateCoupon(body?.code, items)
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (error: any) {
    console.error("[coupons/validate] Error:", error)
    return NextResponse.json({ ok: false, error: "No se pudo validar el cupón. Intenta de nuevo." }, { status: 500 })
  }
}
