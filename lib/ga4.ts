import { createHash } from "crypto"
import { claimOrderFlag, releaseOrderFlag } from "@/lib/order-flags"

/**
 * Compras en GA4 desde el servidor (Measurement Protocol), una sola vez por pedido y solo cuando el
 * pedido es real: pago aprobado (Wompi) o contraentrega confirmado. Si después se cancela, se envía
 * el reembolso. Así GA4 cuadra con los pedidos del admin, aunque el cliente cierre la pestaña antes de
 * ver la página de confirmación o la vuelva a abrir.
 *
 * Requiere NEXT_PUBLIC_GA4_ID (ej. G-XXXX) y GA4_API_SECRET (GA4 → Administrar → Flujos de datos →
 * Secretos de la API del Measurement Protocol). Sin GA4_API_SECRET la web sigue usando el evento
 * del navegador como antes.
 */

// La web carga GA4 con NEXT_PUBLIC_GA4_ID o, si no está, con NEXT_PUBLIC_GTAG_ID (hoy G-XT6SXR8FD1):
// se usa la misma propiedad para que las compras del servidor caigan donde están las visitas
const MEASUREMENT_ID = [process.env.NEXT_PUBLIC_GA4_ID, process.env.NEXT_PUBLIC_GTAG_ID]
  .map((v) => (v || "").trim())
  .find((v) => v.startsWith("G-")) || ""
const API_SECRET = (process.env.GA4_API_SECRET || "").trim()

export const isGA4ServerPurchaseEnabled = () => Boolean(MEASUREMENT_ID && API_SECRET)

/** "GA1.1.123456789.1700000000" → "123456789.1700000000" */
export function parseGaClientId(cookie?: string | null): string | undefined {
  const parts = String(cookie || "").split(".")
  return parts.length >= 4 ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}` : undefined
}

/** Cookie de sesión de GA4 en formato GS1 ("GS1.1.1700000000.3...") o GS2 ("GS2.1.s1700000000$o3..."). */
export function parseGaSessionId(cookie?: string | null): string | undefined {
  const value = String(cookie || "")
  const gs2 = value.match(/^GS2\.\d+\.s(\d+)/)
  if (gs2) return gs2[1]
  const parts = value.split(".")
  return value.startsWith("GS1.") && /^\d+$/.test(parts[2] || "") ? parts[2] : undefined
}

/** Lee las cookies de Google Analytics de la visita (para atribuir la compra al mismo usuario y sesión). */
export async function readGaIdentity(): Promise<{ gaClientId?: string; gaSessionId?: string }> {
  try {
    const { cookies } = await import("next/headers")
    const jar = await cookies()
    const gaClientId = parseGaClientId(jar.get("_ga")?.value)
    const suffix = MEASUREMENT_ID.replace(/^G-/, "")
    const gaSessionId = suffix ? parseGaSessionId(jar.get(`_ga_${suffix}`)?.value) : undefined
    return { ...(gaClientId ? { gaClientId } : {}), ...(gaSessionId ? { gaSessionId } : {}) }
  } catch {
    return {}
  }
}

/** Sin cookie (ej. pedido creado por WhatsApp): id estable derivado del pedido. */
function fallbackClientId(orderId: string): string {
  const n = parseInt(createHash("sha256").update(orderId).digest("hex").slice(0, 8), 16)
  return `${n}.${Math.floor(Date.now() / 1000)}`
}

async function sendEvents(order: any, events: any[]): Promise<void> {
  const orderId = String(order._id).replace(/^drafts\./, "")
  const body: Record<string, unknown> = {
    client_id: order.gaClientId || fallbackClientId(orderId),
    events,
  }
  if (order.user?._ref) body.user_id = order.user._ref
  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export function orderTransactionId(order: any): string {
  return String(order.orderNumber || String(order._id).replace(/^drafts\./, ""))
}

/** Compra (una sola vez por pedido). */
export async function sendGA4PurchaseOnce(rawOrderId: string): Promise<{ sent: boolean; error?: string }> {
  if (!isGA4ServerPurchaseEnabled()) return { sent: false }
  const order = await claimOrderFlag(rawOrderId, "ga4PurchaseSent")
  if (!order) return { sent: false }
  const orderId = String(order._id).replace(/^drafts\./, "")
  // Pedidos creados antes de activar el envío por servidor ya los contó el navegador
  if (order.ga4Server !== true) {
    await releaseOrderFlag(orderId, "ga4PurchaseSent")
    return { sent: false }
  }
  try {
    const params: Record<string, unknown> = {
      transaction_id: orderTransactionId(order),
      value: Math.round(Number(order.total || 0)),
      currency: "COP",
      payment_type: order.paymentMethod === "cod" ? "Contraentrega" : order.wompiPaymentMethodType || order.paymentMethod || "wompi",
      items: (order.items || []).slice(0, 200).map((item: any, i: number) => ({
        item_id: String(item.productSlug || item.product?._ref || item.name || `item-${i}`),
        item_name: String(item.name || "Producto"),
        ...(item.designName ? { item_variant: String(item.designName) } : {}),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
      })),
      engagement_time_msec: 1,
    }
    if (order.couponCode) params.coupon = order.couponCode
    if (order.gaSessionId) params.session_id = order.gaSessionId
    await sendEvents(order, [{ name: "purchase", params }])
    console.log(`[GA4] Compra enviada: pedido ${orderTransactionId(order)} por $${params.value}`)
    return { sent: true }
  } catch (err: any) {
    await releaseOrderFlag(orderId, "ga4PurchaseSent")
    console.warn(`[GA4] No se pudo enviar la compra del pedido ${orderTransactionId(order)}:`, err?.message || err)
    return { sent: false, error: err?.message || String(err) }
  }
}

/** Reembolso cuando se cancela un pedido que ya se había contado como compra. */
export async function sendGA4RefundOnce(rawOrderId: string): Promise<{ sent: boolean }> {
  if (!isGA4ServerPurchaseEnabled()) return { sent: false }
  const order = await claimOrderFlag(rawOrderId, "ga4RefundSent")
  if (!order) return { sent: false }
  const orderId = String(order._id).replace(/^drafts\./, "")
  if (order.ga4PurchaseSent !== true) {
    // Nunca se contó como compra: nada que revertir (se libera por si luego se paga y se cancela)
    await releaseOrderFlag(orderId, "ga4RefundSent")
    return { sent: false }
  }
  try {
    await sendEvents(order, [
      {
        name: "refund",
        params: {
          transaction_id: orderTransactionId(order),
          value: Math.round(Number(order.total || 0)),
          currency: "COP",
          ...(order.gaSessionId ? { session_id: order.gaSessionId } : {}),
          engagement_time_msec: 1,
        },
      },
    ])
    console.log(`[GA4] Reembolso enviado: pedido ${orderTransactionId(order)}`)
    return { sent: true }
  } catch (err: any) {
    await releaseOrderFlag(orderId, "ga4RefundSent")
    console.warn(`[GA4] No se pudo enviar el reembolso del pedido ${orderTransactionId(order)}:`, err?.message || err)
    return { sent: false }
  }
}
