import { NextRequest, NextResponse } from "next/server"
import { client } from "@/sanity/lib/client"
import { sendOrderWhatsAppOnce, type OrderWhatsAppKind } from "@/lib/whatsapp/order-notifications"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Automatizaciones de WhatsApp por estado del pedido (cada 10 minutos, ver vercel.json).
 *
 * Cuando el equipo cambia el estado en Sanity (Enviado, Entregado) no se ejecuta código en la web,
 * así que este cron busca los pedidos con mensajes pendientes y los envía una sola vez:
 *  - Enviado   → aviso de despacho con guía (o "listo para recoger" si es recogida en tienda)
 *  - Entregado → agradecimiento + encuesta de satisfacción 1 a 5
 *  - Pagado / En proceso sin confirmación → reintento de la confirmación de compra
 *
 * Solo mira pedidos modificados en los últimos días (no escribe a pedidos antiguos) y solo envía
 * entre 7:00 a. m. y 8:59 p. m. de Colombia.
 */

const MAX_PER_KIND = 15
const PAUSE_MS = 1500

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`
  return (req.headers.get("user-agent") || "").includes("vercel-cron")
}

function bogotaHour(): number {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/Bogota" }).format(new Date())) % 24
}

const QUERIES: Record<OrderWhatsAppKind, string> = {
  dispatch: `*[_type == "order" && !(_id in path("drafts.**")) && status == "shipped" && whatsappDispatchSent != true && dateTime(_updatedAt) > dateTime($since3d)] | order(_updatedAt asc)[0...${MAX_PER_KIND}]._id`,
  survey: `*[_type == "order" && !(_id in path("drafts.**")) && status == "delivered" && whatsappSurveySent != true && dateTime(_updatedAt) > dateTime($since3d)] | order(_updatedAt asc)[0...${MAX_PER_KIND}]._id`,
  confirmation: `*[_type == "order" && !(_id in path("drafts.**")) && status in ["paid", "processing"] && whatsappConfirmationSent != true && dateTime(_createdAt) > dateTime($since2d)] | order(_createdAt asc)[0...${MAX_PER_KIND}]._id`,
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const hour = bogotaHour()
  if (hour < 7 || hour >= 21) {
    return NextResponse.json({ skipped: true, reason: `Fuera de horario (${hour}:00 en Colombia)` })
  }

  const now = Date.now()
  const params = {
    since3d: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    since2d: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
  const fresh = client.withConfig({ useCdn: false })
  const summary: Record<string, { sent: number; failed: number; skipped: number }> = {}

  for (const kind of Object.keys(QUERIES) as OrderWhatsAppKind[]) {
    summary[kind] = { sent: 0, failed: 0, skipped: 0 }
    const ids: string[] = await fresh.fetch(QUERIES[kind], params).catch(() => [])
    for (const id of ids || []) {
      const result = await sendOrderWhatsAppOnce(id, kind)
      if (result.sent) summary[kind].sent++
      else if (result.skipped) summary[kind].skipped++
      else summary[kind].failed++
      await new Promise((r) => setTimeout(r, PAUSE_MS))
    }
  }

  return NextResponse.json({ success: true, summary })
}
