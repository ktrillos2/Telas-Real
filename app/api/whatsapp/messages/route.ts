import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { getWhatsAppMessages } from "@/lib/whatsapp/messages"

export const dynamic = "force-dynamic"

/** Textos de las respuestas del bot (editables en Sanity). Solo para el bot, con WHATSAPP_API_SECRET. */
export async function GET(req: NextRequest) {
  const secret = (process.env.WHATSAPP_API_SECRET || "").trim()
  const provided = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim()
  const ok =
    Boolean(secret && provided) &&
    crypto.timingSafeEqual(crypto.createHash("sha256").update(provided).digest(), crypto.createHash("sha256").update(secret).digest())
  if (!ok) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const messages = await getWhatsAppMessages()
  const botMessages = Object.fromEntries(Object.entries(messages).filter(([key]) => key.startsWith("bot")))
  return NextResponse.json({ messages: botMessages }, { headers: { "Cache-Control": "no-store" } })
}
