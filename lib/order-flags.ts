import { createClient } from "next-sanity"
import { apiVersion, dataset, projectId } from "@/sanity/env"

/**
 * Marcas "una sola vez" en el pedido (ej. confirmationEmailSent). Varios procesos pueden intentar
 * lo mismo a la vez (webhook de Wompi, verificación del checkout, página de confirmación): solo el
 * que reserva la marca con ifRevisionId lo hace. Si falla, se libera para reintentar.
 */

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_TOKEN })

/** Reserva la marca; devuelve el pedido si este proceso la obtuvo, o null si ya estaba puesta. */
export async function claimOrderFlag(rawOrderId: string, flag: string): Promise<any | null> {
  const orderId = String(rawOrderId || "").replace(/^drafts\./, "")
  if (!orderId) return null
  for (let attempt = 0; attempt < 4; attempt++) {
    const order = await client.fetch(`*[_id == $id][0]`, { id: orderId })
    if (!order || order[flag] === true) return null
    try {
      await client.patch(orderId).ifRevisionId(order._rev).set({ [flag]: true }).commit()
      return order
    } catch {
      // Otro proceso modificó el pedido entre la lectura y la escritura: volver a mirar
    }
  }
  return null
}

/** Libera la marca (el envío falló) para que se pueda reintentar. */
export async function releaseOrderFlag(rawOrderId: string, flag: string): Promise<void> {
  const orderId = String(rawOrderId || "").replace(/^drafts\./, "")
  if (!orderId) return
  await client.patch(orderId).set({ [flag]: false }).commit().catch(() => {})
}
