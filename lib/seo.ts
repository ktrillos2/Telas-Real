// Utilidades SEO compartidas (canonicals, slugs limpios y JSON-LD).

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://telasreal.com"
export const SITE_URL = rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path
  if (!path || path === "/") return SITE_URL
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Normaliza un slug para usarlo en URLs públicas: elimina espacios al inicio/fin
 * y reemplaza espacios internos por guiones. Evita URLs como "/tienda/ tela-toalla".
 */
export function cleanSlug(slug: string | null | undefined): string {
  if (!slug) return ""
  return String(slug)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
}

/** decodeURIComponent que no lanza ante secuencias inválidas (p. ej. "100%"). */
export function safeDecode(value: string | null | undefined): string {
  if (!value) return ""
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** True si el slug guardado en Sanity tiene espacios u otros problemas de formato. */
export function isDirtySlug(slug: string | null | undefined): boolean {
  return !!slug && cleanSlug(slug) !== slug
}

export type BreadcrumbItem = { name: string; path: string }

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/** Convierte texto/HTML a texto plano de una sola línea. */
export function stripHtml(text: string | null | undefined): string {
  if (!text) return ""
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// ---------------------------------------------------------------------------
// SEO local: agrupación de tiendas físicas por ciudad
// ---------------------------------------------------------------------------

const KNOWN_CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Pereira", "Cartagena",
  "Santa Marta", "Cúcuta", "Ibagué", "Manizales", "Armenia", "Villavicencio", "Pasto",
  "Neiva", "Montería", "Valledupar", "Tunja", "Popayán", "Sincelejo", "Soacha", "Bello",
  "Itagüí", "Envigado", "Dosquebradas", "Palmira", "Girardot", "Fusagasugá", "Zipaquirá",
  "Chía", "Facatativá", "Sogamoso", "Duitama", "Floridablanca", "Tuluá", "Buenaventura",
  "Riohacha", "Yopal", "Florencia", "Quibdó", "Rionegro", "Cartago", "Buga",
]

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

export function slugifyText(text: string): string {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

/** Deduce la ciudad de una tienda a partir de su nombre o dirección. */
export function getStoreCity(store: { name?: string; address?: string }): string | null {
  const haystack = normalizeText(`${store.name || ""} ${store.address || ""}`)
  // Ciudades de varias palabras primero para evitar coincidencias parciales
  const sorted = [...KNOWN_CITIES].sort((a, b) => b.length - a.length)
  for (const city of sorted) {
    const pattern = new RegExp(`(^|[^a-z])${normalizeText(city)}([^a-z]|$)`)
    if (pattern.test(haystack)) return city
  }
  const lastSegment = store.address?.split(",").pop()?.trim()
  if (lastSegment && !/\d/.test(lastSegment) && lastSegment.length > 2) return lastSegment
  return null
}

export type StoreLike = {
  _id?: string
  name?: string
  address?: string
  phone?: string
  hours?: string
  mapUrl?: string
  coordinates?: { lat?: number; lng?: number }
}

export function groupStoresByCity<T extends StoreLike>(stores: T[]) {
  const groups = new Map<string, { city: string; slug: string; stores: T[] }>()
  for (const store of stores || []) {
    const city = getStoreCity(store)
    if (!city) continue
    const slug = slugifyText(city)
    if (!groups.has(slug)) groups.set(slug, { city, slug, stores: [] })
    groups.get(slug)!.stores.push(store)
  }
  return Array.from(groups.values()).sort((a, b) => b.stores.length - a.stores.length || a.city.localeCompare(b.city))
}

const DAY_CODES: Record<string, string> = {
  lun: "Monday", mar: "Tuesday", mie: "Wednesday", jue: "Thursday",
  vie: "Friday", sab: "Saturday", dom: "Sunday",
}
const DAY_ORDER = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"]

function to24h(hour: string, minutes: string | undefined, meridiem: string | undefined): string {
  let h = parseInt(hour, 10)
  const m = minutes || "00"
  const mer = (meridiem || "").replace(/\./g, "").toLowerCase()
  if (mer === "pm" && h < 12) h += 12
  if (mer === "am" && h === 12) h = 0
  return `${String(h).padStart(2, "0")}:${m}`
}

/**
 * Convierte horarios en texto libre ("Lun - Sáb: 8:00 AM - 6:00 PM") a
 * OpeningHoursSpecification de schema.org. Devuelve [] si no se puede interpretar.
 */
export function parseOpeningHours(hours: string | null | undefined) {
  if (!hours) return []
  const text = normalizeText(hours)
  const day = "(lun|mar|mie|jue|vie|sab|dom)[a-z]*\\.?"
  const time = "(\\d{1,2})(?::(\\d{2}))?\\s*(a\\.?\\s?m\\.?|p\\.?\\s?m\\.?)?"
  const re = new RegExp(`${day}\\s*(?:-|a|al)?\\s*(?:${day})?\\s*:?\\s*${time}\\s*(?:-|a)\\s*${time}`, "g")
  const specs: any[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    const [, fromDay, toDay, h1, m1, mer1, h2, m2, mer2] = match
    const start = DAY_ORDER.indexOf(fromDay)
    const end = toDay ? DAY_ORDER.indexOf(toDay) : start
    if (start < 0 || end < start) continue
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_ORDER.slice(start, end + 1).map((d) => DAY_CODES[d]),
      opens: to24h(h1, m1, mer1?.replace(/\s/g, "")),
      closes: to24h(h2, m2, mer2?.replace(/\s/g, "")),
    })
  }
  return specs
}

export function storeJsonLd(store: StoreLike, idSuffix: string, pageUrl: string) {
  const city = getStoreCity(store)
  return {
    "@type": "Store",
    "@id": `${pageUrl}#${idSuffix}`,
    name: store.name || "Telas Real",
    image: absoluteUrl("/logo-loading.png"),
    url: pageUrl,
    telephone: store.phone || "+57 315 902 1516",
    priceRange: "$$",
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address || "Colombia",
      ...(city ? { addressLocality: city } : {}),
      addressCountry: "CO",
    },
    ...(store.coordinates?.lat && store.coordinates?.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: store.coordinates.lat,
            longitude: store.coordinates.lng,
          },
        }
      : {}),
    ...(parseOpeningHours(store.hours).length > 0
      ? { openingHoursSpecification: parseOpeningHours(store.hours) }
      : {}),
  }
}
