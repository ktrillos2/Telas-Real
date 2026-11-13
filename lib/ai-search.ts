import { groq } from "next-sanity"
import { cachedClient } from "@/sanity/lib/client"
import { findUnifiedFabricConfig } from "@/lib/unified-fabrics"
import { productPublicPath } from "@/lib/product-url"

/**
 * Buscador con IA (Groq). La IA solo interpreta lo que pide el cliente y elige entre las telas
 * REALES del catálogo (que se le pasan resumidas); los productos y enlaces salen siempre de Sanity,
 * así nunca inventa productos ni precios.
 *
 * Variables de entorno: GROQ_API_KEY (obligatoria) y GROQ_MODEL (opcional).
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
/** Modelo económico y rápido de Groq; se puede cambiar con GROQ_MODEL sin tocar código. */
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b"

export interface AiSearchProduct {
  id: string
  name: string
  href: string
  image?: string
  price?: number
  salePrice?: number
  family: string
}

export interface AiSearchResult {
  answer: string
  products: AiSearchProduct[]
  /** Búsqueda sugerida para "Ver más en el catálogo" */
  searchTerm?: string
  /** Interpretación cuando la búsqueda es ambigua o tiene errores ("Creo que quisiste decir…") */
  didYouMean?: string
  source: "ai" | "fallback"
}

interface Family {
  key: string
  name: string
  usages: string[]
  tones: string[]
  traits: string[]
  priceFrom?: number
  products: any[]
}

// ---------------------------------------------------------------------------------------------
// Catálogo resumido (familias de tela), en memoria por 10 minutos
// ---------------------------------------------------------------------------------------------
let catalogCache: { at: number; families: Family[] } | null = null
const CATALOG_TTL = 10 * 60 * 1000

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()

const IGNORED_CATEGORIES = new Set(["unicolor", "telas unicolor", "productos", "telas sublimadas"])

/** "Rib Pitillo Azul Cielo X Metros | Tela Acanalada" → "Rib Pitillo Azul Cielo · Tela Acanalada" */
const shortTitle = (title: string) => String(title || "").replace(/\s+X\s+Metros?\s*/i, " ").replace(/\s*\|\s*/g, " · ").replace(/\s+/g, " ").trim()

function familyOf(p: any): { key: string; name: string } {
  const slug = String(p.slug || "")
  const isSublimated = /sublimad/i.test(slug) || /sublimad/i.test(p.title || "") || p.designSelectionEnabled
  if (isSublimated) return { key: `p:${p._id}`, name: shortTitle(p.title) + " (con diseños estampados)" }
  const unified = findUnifiedFabricConfig(slug)
  if (unified) return { key: `u:${unified.id}`, name: unified.baseTitle.replace(/^Tela\s+/i, "") }
  if (p.colorGroup && String(p.colorGroup).trim()) return { key: `g:${norm(p.colorGroup)}`, name: String(p.colorGroup).trim() }
  const cat = (p.categories || []).find((c: string) => c && !IGNORED_CATEGORIES.has(norm(c)))
  if (cat) return { key: `c:${norm(cat)}`, name: cat }
  return { key: `p:${p._id}`, name: shortTitle(p.title) }
}

async function getCatalog(): Promise<Family[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL) return catalogCache.families

  const products = await cachedClient.fetch<any[]>(groq`
    *[_type == "product" && !(_id in path("drafts.**")) && stockStatus != "outOfStock" && stock_status != "outofstock" && defined(slug.current)
      && !(title match "*tijera*" || title match "*hilo*")]{
      _id, title, "slug": slug.current, price, "salePrice": coalesce(salePrice, sale_price), colorGroup, designSelectionEnabled,
      "image": images[0].asset->url,
      "categories": categories[]->name,
      "usages": usages[]->title,
      "tones": tones[]->title,
      "attrs": attributes[name in ["Elasticidad", "Tacto", "Gramaje", "Composición", "Ancho"]]{ name, value }
    }
  `)

  const map = new Map<string, Family>()
  for (const p of products || []) {
    const { key, name } = familyOf(p)
    let f = map.get(key)
    if (!f) {
      f = { key, name, usages: [], tones: [], traits: [], products: [] }
      map.set(key, f)
    }
    f.products.push(p)
    for (const u of p.usages || []) if (u && !f.usages.includes(u)) f.usages.push(u)
    for (const t of p.tones || []) if (t && !f.tones.includes(t)) f.tones.push(t)
    for (const a of p.attrs || []) {
      const trait = `${a.name}: ${String(a.value || "").trim()}`
      if (a.value && f.traits.length < 5 && !f.traits.some((x) => x.startsWith(a.name + ":"))) f.traits.push(trait)
    }
    const price = Number(p.salePrice) > 0 ? Number(p.salePrice) : Number(p.price)
    if (price > 0 && (!f.priceFrom || price < f.priceFrom)) f.priceFrom = price
  }

  const families = Array.from(map.values())
  catalogCache = { at: Date.now(), families }
  return families
}

/** Una línea por familia: lo único que ve la IA (≈30 tokens por tela). */
function catalogForPrompt(families: Family[]): string {
  return families
    .map((f, i) => {
      const parts = [
        `${i + 1}. ${f.name}`,
        f.usages.length ? `usos: ${f.usages.slice(0, 6).join(", ")}` : "",
        f.traits.length ? f.traits.join("; ") : "",
        f.tones.length ? `tonos: ${f.tones.slice(0, 8).join(", ")}` : "",
        f.priceFrom ? `desde $${Math.round(f.priceFrom).toLocaleString("es-CO")}/m` : "",
        `${f.products.length} ${f.products.length === 1 ? "referencia" : "colores/referencias"}`,
      ]
      return parts.filter(Boolean).join(" | ")
    })
    .join("\n")
}

const SYSTEM_PROMPT = `Eres el asesor experto de Telas Real, tienda de telas por metro en Colombia. Tu trabajo es SIEMPRE ayudar al cliente a encontrar una tela del catálogo.
Recibes la pregunta del cliente y el catálogo de telas disponibles (numeradas).
Responde SOLO con un JSON válido con esta forma:
{"answer": "texto", "picks": [números], "colors": ["color"], "searchTerm": "palabra", "didYouMean": "texto o vacío", "offTopic": false}
Reglas:
- Todo lo relacionado con coser, confeccionar, manualidades, emprendimientos textiles, ropa, uniformes, disfraces, accesorios, mascotas o decoración del hogar (cojines, cortinas, manteles, cobijas, fundas, cubrelechos, tapetes) ES sobre telas: recomienda siempre.
- Guía rápida: decoración/hogar (cojines, cortinas, manteles) → telas de cuerpo, poca o nula elasticidad, buen gramaje (lino, jacquard, satín, plush, piel de conejo, antifluido). Pijamas y cobijas → suaves (brush, piel de conejo, suavetina, plush). Deportivo y vestidos de baño → licras con elasticidad alta. Uniformes → antifluido, granito, telas rígidas. Vestidos y blusas → crepe, satín, rib, lino. Si quieren estampados o diseños → telas sublimadas.
- "picks": de 3 a 6 números del catálogo, de la más a la menos recomendada. Solo números que existan.
- Si la búsqueda es ambigua, muy corta o tiene errores de escritura, NO digas que no sabes: escribe en "didYouMean" lo que crees que quiso decir (ej. "telas para cojines decorativos") y recomienda igual. Si es clara, "didYouMean": "".
- "offTopic": true solo si no tiene NADA que ver con telas o costura (ej. el clima). Aun así recomienda 3 telas populares y en "answer" invítalo amablemente a contarte qué quiere confeccionar.
- "colors": colores que pidió el cliente (ej. "rojo", "azul cielo"); [] si no pidió color.
- "answer": máximo 2 frases cortas en español de Colombia, tono cercano y vendedor. Explica por qué esas telas sirven (tacto, elasticidad, uso). Nunca respondas solo "solo puedo ayudarte con telas". No inventes precios, telas ni datos que no estén en el catálogo.
- "searchTerm": 1 a 3 palabras para buscar en la tienda (ej. "lino").`

async function callGroq(query: string, catalog: string, history: string[] = []): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY no configurada")
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL

  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_completion_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `CATÁLOGO:\n${catalog}\n\n${history.length ? `MENSAJES ANTERIORES DEL CLIENTE (contexto): ${history.join(" | ")}\n` : ""}CLIENTE: ${query}`,
      },
    ],
  }
  // Los modelos gpt-oss razonan antes de responder: se pide poco razonamiento para ahorrar tokens
  if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = "low"

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const data = await res.json()
    const content: string = data?.choices?.[0]?.message?.content || ""
    const json = content.match(/\{[\s\S]*\}/)?.[0]
    if (!json) throw new Error("Respuesta de Groq sin JSON")
    return JSON.parse(json)
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------------------------
// Selección de productos (siempre desde Sanity)
// ---------------------------------------------------------------------------------------------
const toProduct = (p: any, family: Family, colorMatched: boolean): AiSearchProduct => {
  const unified = findUnifiedFabricConfig(p.slug)
  // Si el cliente pidió color, se enlaza ese color; si no, la ficha general de la tela
  const href = unified && !colorMatched ? `/producto/${unified.unifiedSlug}` : productPublicPath(p.slug)
  return {
    id: p._id,
    name: unified && !colorMatched ? family.name : shortTitle(p.title),
    href,
    image: p.image ? `${p.image}?auto=format&w=300&h=300&fit=crop&q=70` : undefined,
    price: Number(p.price) || undefined,
    salePrice: Number(p.salePrice) > 0 ? Number(p.salePrice) : undefined,
    family: family.name,
  }
}

function pickProducts(families: Family[], picks: number[], colors: string[], max = 8): AiSearchProduct[] {
  const wanted = colors.map(norm).filter(Boolean)
  const out: AiSearchProduct[] = []
  const seen = new Set<string>()
  for (const n of picks) {
    const family = families[n - 1]
    if (!family) continue
    let chosen: any[] = []
    let colorMatched = false
    if (wanted.length) {
      chosen = family.products.filter((p) => {
        const text = norm(`${p.title} ${(p.tones || []).join(" ")}`)
        return wanted.some((c) => text.includes(c) || c.split(/\s+/).every((w) => text.includes(w)))
      })
      colorMatched = chosen.length > 0
    }
    if (!colorMatched) chosen = [family.products.find((p) => p.image) || family.products[0]]
    for (const p of chosen.slice(0, colorMatched ? 2 : 1)) {
      const item = toProduct(p, family, colorMatched)
      if (seen.has(item.href)) continue
      seen.add(item.href)
      out.push(item)
      if (out.length >= max) return out
    }
  }
  return out
}

/** Respaldo sin IA: coincidencia por palabras en nombre, usos, tonos y características. */
function keywordFallback(families: Family[], query: string): { picks: number[]; colors: string[] } {
  const HINTS: Record<string, string> = {
    cojin: "lino jacquard satin plush hogar accesorios", cojines: "lino jacquard satin plush hogar accesorios",
    cortina: "lino jacquard satin hogar", cortinas: "lino jacquard satin hogar", mantel: "antifluido lino jacquard hogar",
    manteles: "antifluido lino jacquard hogar", pijama: "brush piel conejo suavetina pijamas", pijamas: "brush piel conejo suavetina pijamas",
    cobija: "piel conejo plush brush", cobijas: "piel conejo plush brush", disfraz: "satin licra brush", disfraces: "satin licra brush",
    uniforme: "antifluido granito uniformes", uniformes: "antifluido granito uniformes", deportivo: "licra deportiva wafer camiseta",
    bano: "licra vestidos bano", vestido: "crepe satin vestidos", blusa: "crepe lino camisetas blusas",
  }
  const expanded = norm(query)
    .split(/[^a-z0-9ñ]+/)
    .map((w) => HINTS[w] ? `${w} ${HINTS[w]}` : w)
    .join(" ")
  const words = expanded
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length > 2 && !["tela", "telas", "para", "que", "con", "una", "los", "las", "del", "por", "metro", "metros"].includes(w))
  const scored = families
    .map((f, i) => {
      const text = norm(`${f.name} ${f.usages.join(" ")} ${f.traits.join(" ")} ${f.products.map((p) => p.title).join(" ")}`)
      const score = words.reduce((s, w) => s + (text.includes(w) ? (norm(f.name).includes(w) ? 3 : 1) : 0), 0)
      return { n: i + 1, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  const toneWords = ["rojo", "azul", "verde", "negro", "blanco", "amarillo", "rosado", "morado", "naranja", "gris", "beige", "vino", "fucsia", "crudo"]
  return { picks: scored.slice(0, 6).map((x) => x.n), colors: words.filter((w) => toneWords.some((t) => w.startsWith(t))) }
}

/** Telas con más colores/referencias disponibles (recomendación de respaldo). */
function popularPicks(families: Family[], n = 4): number[] {
  return families
    .map((f, i) => ({ n: i + 1, count: f.products.length, sublimated: f.key.startsWith("p:") }))
    .filter((x) => !x.sublimated)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map((x) => x.n)
}

// ---------------------------------------------------------------------------------------------
// Caché de respuestas (misma pregunta = 0 tokens) y búsqueda principal
// ---------------------------------------------------------------------------------------------
const answerCache = new Map<string, { at: number; result: AiSearchResult }>()
const ANSWER_TTL = 6 * 60 * 60 * 1000
const MAX_CACHE = 500

export async function aiSearch(rawQuery: string, rawHistory: string[] = []): Promise<AiSearchResult> {
  const query = String(rawQuery || "").replace(/\s+/g, " ").trim().slice(0, 200)
  // Conversación del chat: últimos mensajes del cliente como contexto (ej. "y en color rojo?")
  const history = (Array.isArray(rawHistory) ? rawHistory : [])
    .map((h) => String(h || "").replace(/\s+/g, " ").trim().slice(0, 200))
    .filter(Boolean)
    .slice(-3)
  const cacheKey = norm([...history, query].join(" || ")).replace(/[^a-z0-9ñ| ]/g, "")
  const cached = answerCache.get(cacheKey)
  if (cached && Date.now() - cached.at < ANSWER_TTL) return cached.result

  const families = await getCatalog()
  let result: AiSearchResult

  // Si la IA no elige nada, se completa con coincidencias por palabras y, en último caso, con las telas más surtidas
  const ensurePicks = (picks: number[], text: string): { picks: number[]; colors: string[]; usedPopular: boolean } => {
    if (picks.length) return { picks, colors: [], usedPopular: false }
    const kw = keywordFallback(families, text)
    if (kw.picks.length) return { picks: kw.picks, colors: kw.colors, usedPopular: false }
    return { picks: popularPicks(families), colors: [], usedPopular: true }
  }

  try {
    const ai = await callGroq(query, catalogForPrompt(families), history)
    const aiPicks = (Array.isArray(ai?.picks) ? ai.picks : []).map(Number).filter((n: number) => Number.isInteger(n) && n >= 1 && n <= families.length)
    const aiColors = (Array.isArray(ai?.colors) ? ai.colors : []).map(String).slice(0, 4)
    const filled = ensurePicks(aiPicks, [...history, query].join(" "))
    const didYouMean = String(ai?.didYouMean || "").trim().slice(0, 80)
    let answer = String(ai?.answer || "").trim().slice(0, 400)
    if (!answer || (!aiPicks.length && filled.usedPopular)) {
      answer = ai?.offTopic
        ? "Te ayudo con gusto a elegir tela. Cuéntame qué quieres confeccionar; mientras tanto, estas son de las más pedidas:"
        : "No estoy seguro de qué buscas, pero estas telas son de las más pedidas. Cuéntame un poco más y te afino la recomendación:"
    }
    result = {
      answer,
      products: pickProducts(families, filled.picks, aiColors.length ? aiColors : filled.colors),
      searchTerm: String(ai?.searchTerm || "").trim().slice(0, 40) || undefined,
      didYouMean: didYouMean && norm(didYouMean) !== norm(query) ? didYouMean : undefined,
      source: "ai",
    }
  } catch (error) {
    console.error("[ai-search] Groq no respondió, se usa búsqueda por palabras:", error)
    const filled = ensurePicks([], [...history, query].join(" "))
    result = {
      answer: filled.usedPopular
        ? "No encontré coincidencias exactas, pero te recomiendo estas telas populares:"
        : "Estas telas coinciden con lo que buscas:",
      products: pickProducts(families, filled.picks, filled.colors),
      searchTerm: query.split(" ").slice(0, 3).join(" "),
      source: "fallback",
    }
    return result // el respaldo no se guarda en caché: la próxima vez se reintenta con IA
  }

  if (answerCache.size >= MAX_CACHE) answerCache.delete(answerCache.keys().next().value as string)
  answerCache.set(cacheKey, { at: Date.now(), result })
  return result
}

// Exportados para pruebas
export const __test = { getCatalog, catalogForPrompt, pickProducts, keywordFallback, familyOf }
