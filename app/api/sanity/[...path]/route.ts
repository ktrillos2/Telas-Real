import { NextRequest } from "next/server"
import { dataset, projectId } from "@/sanity/env"

/**
 * Proxy de solo lectura para las consultas GROQ del navegador (ver sanity/lib/client.ts).
 * Reenvía a la API CDN de Sanity sin token y guarda la respuesta en la caché de Vercel,
 * así muchas visitas comparten una sola consulta a Sanity.
 */

const CACHE_SECONDS = 120

function sanityQueryUrl(path: string[], search: string): string | null {
  // Solo /v{versión}/data/query/{dataset}: nada de mutaciones, assets ni otros endpoints
  const [version, data, endpoint, ds, ...rest] = path
  if (rest.length > 0 || !/^v[\d-]+$/.test(version || "") || data !== "data" || endpoint !== "query" || ds !== dataset) {
    return null
  }
  return `https://${projectId}.apicdn.sanity.io/${version}/data/query/${ds}${search}`
}

function respond(body: string, status: number, cacheable: boolean) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheable ? `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600` : "no-store",
    },
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const url = sanityQueryUrl((await params).path, req.nextUrl.search)
  if (!url) return respond(JSON.stringify({ error: "NOT_FOUND" }), 404, false)
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: CACHE_SECONDS } })
    return respond(await res.text(), res.status, res.ok)
  } catch {
    return respond(JSON.stringify({ error: "SANITY_UNREACHABLE" }), 502, false)
  }
}

// Consultas muy largas (> 11 KB) el cliente las manda por POST: se reenvían sin caché
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const url = sanityQueryUrl((await params).path, req.nextUrl.search)
  if (!url) return respond(JSON.stringify({ error: "NOT_FOUND" }), 404, false)
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: await req.text(),
      cache: "no-store",
    })
    return respond(await res.text(), res.status, false)
  } catch {
    return respond(JSON.stringify({ error: "SANITY_UNREACHABLE" }), 502, false)
  }
}
