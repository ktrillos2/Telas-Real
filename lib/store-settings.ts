/**
 * Ajustes de la tienda editables en Sanity ("Elementos Globales → Ajustes de la tienda").
 * Lo que antes estaba fijo en el código: rango de contraentrega, enlaces de los menús, asesor IA,
 * botones del carrito y la sección de colecciones del inicio. Si el documento no existe, se usan
 * estos valores por defecto (los mismos que tenía la web).
 */

export interface MenuLink {
  label: string
  url: string
  highlight?: boolean
}

export interface StoreSettings {
  codMin: number
  codMax: number
  interestLinks: MenuLink[]
  aboutLinks: MenuLink[]
  aiEnabled: boolean
  aiWelcome: string
  aiSuggestions: string[]
  showCommercialCollections: boolean
  showWhatsappCheckout: boolean
  showAddedBubble: boolean
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  codMin: 60000,
  codMax: 100000,
  interestLinks: [
    { label: "Preguntas frecuentes", url: "/preguntas-frecuentes", highlight: true },
    { label: "Blogs", url: "/blogs" },
    { label: "Calculadora", url: "/calculadora" },
    { label: "Inspiración textil", url: "/videos" },
  ],
  aboutLinks: [
    { label: "Conócenos", url: "/conocenos" },
    { label: "Establecimientos", url: "/puntos-atencion", highlight: true },
    { label: "Ventas corporativas B2B", url: "/empresas" },
    { label: "Trabaja con nosotros", url: "/trabaja-con-nosotros" },
  ],
  aiEnabled: true,
  aiWelcome: "¡Hola! Soy el asesor de telas de Telas Real 🧵. Cuéntame qué vas a confeccionar y te recomiendo la tela ideal.",
  aiSuggestions: [
    "Tela fresca para uniforme de enfermera",
    "Licra para vestido de baño",
    "Tela suave para pijamas",
    "Tela elegante para vestido de fiesta",
  ],
  showCommercialCollections: false,
  showWhatsappCheckout: true,
  showAddedBubble: true,
}

export const STORE_SETTINGS_QUERY = `*[_id == "storeSettings"][0]{
  codMin, codMax, aiEnabled, aiWelcome, aiSuggestions, showCommercialCollections, showWhatsappCheckout, showAddedBubble,
  "interestLinks": interestLinks[]{ label, url, highlight },
  "aboutLinks": aboutLinks[]{ label, url, highlight }
}`

const cleanLinks = (v: any): MenuLink[] | null =>
  Array.isArray(v) && v.length
    ? v.filter((l) => l?.label && l?.url).map((l) => ({ label: String(l.label), url: String(l.url), highlight: !!l.highlight }))
    : null

export function mergeStoreSettings(doc: any): StoreSettings {
  const d = DEFAULT_STORE_SETTINGS
  if (!doc) return d
  const n = (v: any, fb: number) => (Number(v) > 0 ? Number(v) : fb)
  const b = (v: any, fb: boolean) => (typeof v === "boolean" ? v : fb)
  return {
    codMin: n(doc.codMin, d.codMin),
    codMax: n(doc.codMax, d.codMax),
    interestLinks: cleanLinks(doc.interestLinks) || d.interestLinks,
    aboutLinks: cleanLinks(doc.aboutLinks) || d.aboutLinks,
    aiEnabled: b(doc.aiEnabled, d.aiEnabled),
    aiWelcome: (typeof doc.aiWelcome === "string" && doc.aiWelcome.trim()) || d.aiWelcome,
    aiSuggestions: Array.isArray(doc.aiSuggestions) && doc.aiSuggestions.filter(Boolean).length ? doc.aiSuggestions.filter(Boolean) : d.aiSuggestions,
    showCommercialCollections: b(doc.showCommercialCollections, d.showCommercialCollections),
    showWhatsappCheckout: b(doc.showWhatsappCheckout, d.showWhatsappCheckout),
    showAddedBubble: b(doc.showAddedBubble, d.showAddedBubble),
  }
}
