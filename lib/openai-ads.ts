import { claimOrderFlag, releaseOrderFlag } from "@/lib/order-flags"
import { OPENAI_ADS_PIXEL_ID, orderEventId, toOpenAIAmount } from "@/lib/oaiq"

/**
 * Conversión de compra para OpenAI Ads desde el servidor (API de conversiones), una vez por pedido
 * al confirmarse el pago. Usa el mismo id que el píxel del navegador (order_<número>) para que
 * OpenAI no cuente la compra dos veces. Sin OPENAI_CONVERSIONS_API_KEY no envía nada.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.telasreal.com").replace(/\/$/, "")

export async function sendOpenAIConversionOnce(rawOrderId: string): Promise<{ sent: boolean; error?: string }> {
  const apiKey = (process.env.OPENAI_CONVERSIONS_API_KEY || "").trim()
  if (!apiKey) return { sent: false }

  const order = await claimOrderFlag(rawOrderId, "openaiConversionSent")
  if (!order) return { sent: false }
  const orderId = String(order._id).replace(/^drafts\./, "")
  const orderNumber = order.orderNumber || orderId

  try {
    const res = await fetch(`https://bzr.openai.com/v1/events?pid=${encodeURIComponent(OPENAI_ADS_PIXEL_ID)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        validate_only: false,
        events: [
          {
            id: orderEventId(orderNumber),
            type: "order_created",
            timestamp_ms: new Date(order.paymentDate || order.date || order._createdAt || Date.now()).getTime(),
            source_url: `${SITE_URL}/confirmation?orderId=${encodeURIComponent(orderNumber)}`,
            action_source: "web",
            data: { type: "contents", amount: toOpenAIAmount(order.total || 0), currency: "COP" },
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
    console.log(`[OpenAI Ads] Conversión enviada para el pedido ${orderNumber}`)
    return { sent: true }
  } catch (err: any) {
    await releaseOrderFlag(orderId, "openaiConversionSent")
    console.warn(`[OpenAI Ads] No se pudo enviar la conversión del pedido ${orderNumber}:`, err?.message || err)
    return { sent: false, error: err?.message || String(err) }
  }
}
