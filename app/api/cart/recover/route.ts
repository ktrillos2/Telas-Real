import { NextRequest, NextResponse } from "next/server"
import { isValidRecoverySignature, writeClient } from "@/lib/cart-recovery"

export const dynamic = "force-dynamic"

/** Productos del carrito abandonado (enlace firmado de los recordatorios) para volver a armarlo. */
export async function GET(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get("p") || "").replace(/^drafts\./, "").slice(0, 80)
  const sig = String(req.nextUrl.searchParams.get("t") || "")
  if (!id || !isValidRecoverySignature(id, sig)) {
    return NextResponse.json({ error: "Enlace inválido o vencido" }, { status: 400 })
  }

  const order = await writeClient.fetch(
    `*[_type == "order" && _id == $id][0]{
      status, orderNumber,
      items[]{ name, quantity, price, image, designName, designUrl, isCustom, productSlug, "productId": product._ref }
    }`,
    { id }
  )
  if (!order) return NextResponse.json({ error: "No encontramos tu carrito" }, { status: 404 })
  // Pendiente o pago rechazado: se puede retomar. Pagado / en proceso / enviado: ya está completo
  if (order.status !== "pending" && order.status !== "cancelled") {
    return NextResponse.json({ alreadyCompleted: true, orderNumber: order.orderNumber })
  }

  const items = (order.items || [])
    .filter((it: any) => it?.name && Number(it.quantity) > 0 && !it.isCustom) // los diseños propios (PDF) se vuelven a subir
    .map((it: any) => ({
      id: it.productId || it.productSlug || it.name,
      name: it.name,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      image: it.image || "/placeholder.svg",
      slug: it.productSlug || "",
      designName: it.designName || undefined,
      designUrl: it.designUrl || undefined,
    }))

  return NextResponse.json({ items, orderNumber: order.orderNumber })
}
