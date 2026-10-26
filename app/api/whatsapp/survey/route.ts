import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { client } from "@/sanity/lib/client"
import resend from "@/lib/resend"

export const dynamic = "force-dynamic"

/**
 * Respuestas de la encuesta de satisfacción por WhatsApp (las envía el bot de Railway).
 * Guarda la calificación (1 a 5) o el comentario en el pedido más reciente de ese teléfono
 * al que se le envió la encuesta. Si la calificación es de 3 o menos, avisa por correo.
 */

const ALERT_EMAIL = process.env.SURVEY_ALERT_EMAIL || "tiendavirtual@telasreal.com"

function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.WHATSAPP_API_SECRET || "").trim()
  const provided = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim()
  if (!secret || !provided) return false
  const a = crypto.createHash("sha256").update(provided).digest()
  const b = crypto.createHash("sha256").update(secret).digest()
  return crypto.timingSafeEqual(a, b)
}

const last10 = (phone: unknown) => String(phone ?? "").replace(/\D/g, "").slice(-10)
const escapeHtml = (text: unknown) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { phone, rating, comment, text } = await req.json().catch(() => ({}))
  const phone10 = last10(phone)
  const score = Number(rating)
  const hasRating = Number.isInteger(score) && score >= 1 && score <= 5
  const cleanComment = String(comment ?? "").trim().slice(0, 1000)
  if (phone10.length < 7 || (!hasRating && !cleanComment)) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 })
  }

  const fresh = client.withConfig({ useCdn: false })
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const candidates: any[] = await fresh.fetch(
    `*[_type == "order" && !(_id in path("drafts.**")) && whatsappSurveySent == true && dateTime(_updatedAt) > dateTime($since)] | order(_updatedAt desc)[0...200]{
      _id, orderNumber, surveyRating, "phone": coalesce(shippingAddress.phone, phone), "name": shippingAddress.fullName, total
    }`,
    { since }
  )
  const order = candidates.find((o) => last10(o.phone) === phone10)
  if (!order) {
    console.warn(`[Encuesta] Respuesta sin pedido asociado (•••${phone10.slice(-2)})`)
    return NextResponse.json({ success: false, error: "ORDER_NOT_FOUND" }, { status: 404 })
  }

  const patch: Record<string, unknown> = {}
  if (hasRating) {
    patch.surveyRating = score
    patch.surveyAnsweredAt = new Date().toISOString()
    if (text) patch.surveyRawAnswer = String(text).slice(0, 200)
  }
  if (cleanComment) patch.surveyComment = cleanComment
  await fresh.patch(order._id).set(patch).commit()

  const finalRating = hasRating ? score : order.surveyRating
  if (finalRating && finalRating <= 3 && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "Telas Real <tiendavirtual@telasreal.com>",
        to: ALERT_EMAIL,
        subject: cleanComment
          ? `Comentario de cliente insatisfecho · Pedido #${order.orderNumber}`
          : `⚠️ Calificación ${finalRating}/5 · Pedido #${order.orderNumber}`,
        html: `<p>El cliente <strong>${escapeHtml(order.name || "")}</strong> (pedido <strong>#${escapeHtml(order.orderNumber)}</strong>) calificó su experiencia con <strong>${finalRating}/5</strong> en la encuesta de WhatsApp.</p>${
          cleanComment ? `<p><strong>Comentario:</strong> ${escapeHtml(cleanComment)}</p>` : "<p>Se le pidió que cuente qué pasó; si responde, llegará otro correo con el comentario.</p>"
        }<p>Teléfono: ${escapeHtml(order.phone || "")}</p><p>Revisa el pedido en el admin y contáctalo para ofrecerle una solución.</p>`,
      })
    } catch (err) {
      console.error("[Encuesta] No se pudo enviar el aviso por correo:", err)
    }
  }

  return NextResponse.json({ success: true })
}
