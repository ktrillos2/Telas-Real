import { NextRequest, NextResponse } from "next/server"
import { aiSearch } from "@/lib/ai-search"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Límite simple por IP para cuidar el consumo de la API de Groq
const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 12

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "anon"
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Demasiadas búsquedas seguidas. Intenta de nuevo en un minuto." }, { status: 429 })
  }

  let query = ""
  let history: string[] = []
  try {
    const body = await req.json()
    query = String(body?.query || "").trim()
    history = Array.isArray(body?.history) ? body.history.map(String).slice(-3) : []
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }
  if (query.length < 3 || query.length > 200) {
    return NextResponse.json({ error: "Escribe entre 3 y 200 caracteres." }, { status: 400 })
  }

  try {
    const result = await aiSearch(query, history)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/ai-search]", error)
    return NextResponse.json({ error: "No pudimos completar la búsqueda." }, { status: 500 })
  }
}
