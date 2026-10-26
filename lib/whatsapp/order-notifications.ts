import { client } from "@/sanity/lib/client"
import {
  notifyOrderConfirmationViaWhatsApp,
  notifyOrderDeliveredViaWhatsApp,
  notifyOrderDispatchViaWhatsApp,
} from "@/lib/whatsapp/service"

/**
 * Automatizaciones de WhatsApp por pedido, cada una se envía UNA sola vez:
 *  - confirmation: compra confirmada (pago aprobado o contraentrega / pago en tienda)
 *  - dispatch:     pedido enviado (estado "Enviado") o listo para recoger
 *  - survey:       pedido entregado → agradecimiento + encuesta 1 a 5
 *
 * Antes de enviar se "reserva" la marca del pedido en Sanity con ifRevisionId: si dos procesos
 * llegan a la vez (webhook de Wompi + página de confirmación), solo uno envía. Si el envío falla,
 * la marca se libera para que el cron /api/cron/order-whatsapp lo reintente.
 */

export type OrderWhatsAppKind = "confirmation" | "dispatch" | "survey"

const FLAG: Record<OrderWhatsAppKind, "whatsappConfirmationSent" | "whatsappDispatchSent" | "whatsappSurveySent"> = {
  confirmation: "whatsappConfirmationSent",
  dispatch: "whatsappDispatchSent",
  survey: "whatsappSurveySent",
}

const SEND: Record<OrderWhatsAppKind, (order: any) => Promise<{ success: boolean; error?: string }>> = {
  confirmation: notifyOrderConfirmationViaWhatsApp,
  dispatch: notifyOrderDispatchViaWhatsApp,
  survey: notifyOrderDeliveredViaWhatsApp,
}

const freshClient = client.withConfig({ useCdn: false })

/** Marca el pedido como "enviando" solo si nadie lo hizo antes. Devuelve el pedido si lo reservó. */
async function claim(orderId: string, flag: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const order = await freshClient.fetch(`*[_id == $id][0]`, { id: orderId })
    if (!order || order[flag] === true) return null
    try {
      await freshClient.patch(orderId).ifRevisionId(order._rev).set({ [flag]: true }).commit()
      return order
    } catch {
      // Otro proceso modificó el pedido entre la lectura y la escritura: volver a mirar
    }
  }
  return null
}

export async function sendOrderWhatsAppOnce(
  rawOrderId: string,
  kind: OrderWhatsAppKind
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const orderId = String(rawOrderId || "").replace(/^drafts\./, "")
  if (!orderId) return { sent: false, error: "Pedido sin id" }
  const flag = FLAG[kind]

  const order = await claim(orderId, flag)
  if (!order) return { sent: false, skipped: true }

  let result: { success: boolean; error?: string }
  try {
    result = await SEND[kind](order)
  } catch (err: any) {
    result = { success: false, error: err?.message || String(err) }
  }

  if (!result.success) {
    // Liberar la marca para reintentar más tarde (cron), salvo que falte el teléfono: no tiene arreglo
    const permanent = /teléfono|desactivadas/i.test(result.error || "")
    if (!permanent) {
      await freshClient.patch(orderId).set({ [flag]: false }).commit().catch(() => {})
    }
    console.warn(`[WhatsApp] ${kind} del pedido ${order.orderNumber || orderId} no enviado: ${result.error}`)
    return { sent: false, error: result.error }
  }

  console.log(`[WhatsApp] ${kind} enviado para el pedido ${order.orderNumber || orderId}`)
  return { sent: true }
}
