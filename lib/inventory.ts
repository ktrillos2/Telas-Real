import { client } from "@/sanity/lib/client"

/**
 * Descuento de inventario al confirmarse el pago de un pedido (una sola vez por pedido).
 *
 * - Solo se descuenta en productos que llevan control de stock: "Cantidad de Stock" mayor a 0.
 *   Los que la tienen vacía o en 0 se manejan a mano y no se tocan.
 * - Si la cantidad llega a 0 o menos, el producto pasa a "Agotado".
 * - La marca `inventoryDeducted` del pedido se reserva con ifRevisionId antes de descontar, así
 *   el webhook de Wompi y la página de confirmación no descuentan dos veces.
 */

const fresh = client.withConfig({ useCdn: false })

// Solo pedidos creados desde que existe este descuento automático: los anteriores ya se ajustaron
// a mano y no deben descontarse al volver a abrir su página de confirmación.
const TRACKING_SINCE = process.env.INVENTORY_TRACKING_SINCE || "2026-10-28T00:00:00-05:00"

const cleanId = (id: unknown) => String(id ?? "").replace(/^drafts\./, "")

async function claimOrder(orderId: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const order = await fresh.fetch(`*[_id == $id][0]{ _id, _rev, _createdAt, orderNumber, status, inventoryDeducted, items }`, { id: orderId })
    if (!order || order.inventoryDeducted === true) return null
    if (new Date(order._createdAt) < new Date(TRACKING_SINCE)) return null
    try {
      await fresh.patch(orderId).ifRevisionId(order._rev).set({ inventoryDeducted: true }).commit()
      return order
    } catch {
      // El pedido cambió entre la lectura y la escritura: volver a intentar
    }
  }
  return null
}

/** Resta `quantity` al producto si lleva control de stock. Reintenta si otro pedido lo modificó a la vez. */
async function deductProduct(productId: string, quantity: number): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const product = await fresh.fetch(`*[_id == $id][0]{ _id, _rev, title, inventory, stockStatus }`, { id: productId })
    if (!product) return `${productId}: no existe`
    const current = Number(product.inventory)
    if (!Number.isFinite(current) || current <= 0) return `${product.title}: sin control de stock`
    const next = Math.round((current - quantity) * 100) / 100
    try {
      await fresh
        .patch(productId)
        .ifRevisionId(product._rev)
        .set(next <= 0 ? { inventory: 0, stockStatus: "outOfStock" } : { inventory: next })
        .commit()
      return `${product.title}: ${current} → ${Math.max(0, next)}${next <= 0 ? " (agotado)" : ""}`
    } catch {
      // Otro pedido descontó al mismo tiempo: leer de nuevo
    }
  }
  return `${productId}: no se pudo descontar`
}

export async function deductInventoryOnce(rawOrderId: string): Promise<{ deducted: boolean; details?: string[] }> {
  const orderId = cleanId(rawOrderId)
  if (!orderId) return { deducted: false }
  const order = await claimOrder(orderId)
  if (!order) return { deducted: false }

  // Cantidad por producto: por el vínculo guardado en la línea o, en pedidos antiguos, por el slug
  const items: any[] = Array.isArray(order.items) ? order.items : []
  const slugs = items.filter((i) => !i?.product?._ref && i?.productSlug).map((i) => String(i.productSlug))
  const bySlug: Array<{ _id: string; slug: string }> = slugs.length
    ? await fresh.fetch(`*[_type == "product" && !(_id in path("drafts.**")) && slug.current in $slugs]{ _id, "slug": slug.current }`, { slugs })
    : []
  const totals = new Map<string, number>()
  for (const item of items) {
    const productId = cleanId(item?.product?._ref) || bySlug.find((p) => p.slug === item?.productSlug)?._id
    const quantity = Number(item?.quantity) || 0
    if (productId && quantity > 0) totals.set(productId, (totals.get(productId) || 0) + quantity)
  }

  const details: string[] = []
  for (const [productId, quantity] of totals) {
    details.push(await deductProduct(productId, quantity))
  }
  console.log(`[Inventario] Pedido ${order.orderNumber || orderId}: ${details.join(" | ") || "sin productos vinculados"}`)
  return { deducted: true, details }
}
