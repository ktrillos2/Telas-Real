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
  /** Texto SEO visible al final del inicio */
  homeSeoEnabled: boolean
  homeSeoTitle: string
  homeSeoText: string
  homeSeoLinks: MenuLink[]
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
  homeSeoEnabled: true,
  homeSeoTitle: "Telas por metro y por rollo en Colombia",
  homeSeoText: [
    "En Telas Real vendemos telas por metro y por rollo para confección, sublimación, uniformes y decoración. Encuentra rib, brush piel de durazno, crepe, satín, lino, licras deportivas, jacquard, antifluido y más de 40 referencias en todos los colores, con ficha técnica de ancho, gramaje y rendimiento por kilo.",
    "Compra desde 1 metro o lleva rollos completos: si tu pedido supera los 25 kilos de una misma tela, accedes automáticamente a precio mayorista, y a precios aún mejores desde 80 y 400 kilos. Ideal para talleres, confeccionistas, marcas de ropa y empresas de dotación.",
    "Despachamos desde Bogotá a toda Colombia con Coordinadora, o puedes recoger sin costo en nuestra sede principal en Bogotá. Paga en línea con PSE, Nequi, Daviplata o tarjeta, y si tienes dudas te asesoramos por WhatsApp para elegir la tela ideal para tu proyecto.",
  ].join("\n\n"),
  homeSeoLinks: [
    { label: "Tela rib", url: "/tienda/tela-rib-tela-acanalada-colombia" },
    { label: "Brush piel de durazno", url: "/tienda/tela-brush-premium-piel-de-durazno-colombia-" },
    { label: "Tela crepe", url: "/tienda/tela-crepe-tela-liviana" },
    { label: "Tela satín", url: "/tienda/tela-satin-tela-elegante-colombia" },
    { label: "Tela antifluido", url: "/tienda/tela-antifluido-tela-para-uniformes" },
    { label: "Licra deportiva", url: "/tienda/tela-licra-deportiva-tela-licrada-colombia" },
    { label: "Sublimación personalizada", url: "/personalizado" },
    { label: "Ver todas las telas", url: "/tienda" },
  ],
}

export const STORE_SETTINGS_QUERY = `*[_id == "storeSettings"][0]{
  codMin, codMax, aiEnabled, aiWelcome, aiSuggestions, showCommercialCollections, showWhatsappCheckout, showAddedBubble,
  homeSeoEnabled, homeSeoTitle, homeSeoText, "homeSeoLinks": homeSeoLinks[]{ label, url },
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
    homeSeoEnabled: b(doc.homeSeoEnabled, d.homeSeoEnabled),
    homeSeoTitle: (typeof doc.homeSeoTitle === "string" && doc.homeSeoTitle.trim()) || d.homeSeoTitle,
    homeSeoText: (typeof doc.homeSeoText === "string" && doc.homeSeoText.trim()) || d.homeSeoText,
    homeSeoLinks: cleanLinks(doc.homeSeoLinks) || d.homeSeoLinks,
  }
}
