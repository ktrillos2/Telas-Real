import { groq } from "next-sanity"
import { cachedClient, client } from "@/sanity/lib/client"
import { urlFor } from "@/sanity/lib/image"
import { productPublicPath } from "@/lib/product-url"

/**
 * Colecciones comerciales de temporada (ej. "Telas para Navidad").
 * Cada tarjeta apunta a una variante de un producto existente (un diseño sublimado o un color),
 * sin duplicar fichas ni inventario.
 */

export type CollectionTheme = "navidad" | "amor" | "marca" | "oscuro"

export interface CollectionCard {
  key: string
  kind: "design" | "color"
  title: string
  subtitle: string
  href: string
  /** Foto principal de la tarjeta (ambiente, diseño o producto) */
  imageUrl: string
  /** Diseño en el círculo (solo cuando la foto principal es de ambiente) */
  circleUrl?: string
  alt: string
}

export interface CommercialCollection {
  id: string
  title: string
  highlight?: string
  subtitle?: string
  slug: string
  theme: CollectionTheme
  buttonText: string
  bannerUrl?: string
  bannerMobileUrl?: string
  bannerAlt?: string
  items: CollectionCard[]
}

const VISIBLE_FILTER = `_type == "commercialCollection" && isActive != false && defined(slug.current)
  && (!defined(startDate) || dateTime(startDate) <= dateTime(now()))
  && (!defined(endDate) || dateTime(endDate) > dateTime(now()))
  && !(_id in path("drafts.**"))`

const PROJECTION = `{
  _id, title, highlight, subtitle, "slug": slug.current, theme, buttonText,
  bannerImage, "bannerAlt": bannerImage.alt, bannerImageMobile,
  "items": items[]{
    _key, kind, title, subtitle, image,
    "product": product->{
      _id, title, "slug": slug.current, stockStatus, stock_status, "image": images[0]
    },
    "design": design->{ _id, name, isActive, image }
  }
}`

const THEMES: CollectionTheme[] = ["navidad", "amor", "marca", "oscuro"]

/** "N-150A.jpg" → "N-150A"; "TM-7009.2 - copia (1).jpeg" → "TM-7009.2" */
export function cleanDesignName(name?: string): string {
  return String(name || "")
    .replace(/\.(jpe?g|png|webp|gif|tiff?)$/i, "")
    .replace(/(\s*-?\s*copia|\s*\(\d+\)|~\d+)+$/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** "Piel de Durazno Sublimado X Metros | Brush" → "Piel de Durazno Sublimado" */
export function shortProductName(title?: string): string {
  return String(title || "").split(/\s+x\s+metros?/i)[0].split("|")[0].trim()
}

const isSoldOut = (p: any) => p?.stockStatus === "outOfStock" || p?.stock_status === "outofstock"

const img = (source: any, w: number, h?: number): string | undefined => {
  if (!source?.asset) return undefined
  try {
    let b = urlFor(source).width(w)
    if (h) b = b.height(h).fit("crop")
    return b.url()
  } catch {
    return undefined
  }
}

/** Convierte el documento de Sanity en tarjetas listas para pintar (descarta las incompletas o agotadas). */
export function mapCollection(doc: any): CommercialCollection | null {
  if (!doc?.slug || !doc?.title) return null
  const items: CollectionCard[] = []
  const seen = new Set<string>()

  for (const it of doc.items || []) {
    const product = it?.product
    if (!product?.slug || isSoldOut(product)) continue
    const kind: "design" | "color" = it.kind === "color" ? "color" : "design"
    const design = kind === "design" ? it.design : null
    if (kind === "design" && (!design?._id || design.isActive === false || !design.image?.asset)) continue

    const base = productPublicPath(product.slug)
    const href = design ? `${base}${base.includes("?") ? "&" : "?"}diseno=${encodeURIComponent(design._id)}` : base
    if (seen.has(href)) continue
    seen.add(href)

    const lifestyle = img(it.image, 600, 750)
    const variantImage = design ? img(design.image, 600, 750) : img(product.image, 600, 750)
    const imageUrl = lifestyle || variantImage
    if (!imageUrl) continue

    const productName = shortProductName(product.title) || String(product.title || "").trim()
    const designName = cleanDesignName(design?.name)
    const title = String(it.title || (design ? `Diseño ${designName}` : productName)).trim()
    const subtitle = String(it.subtitle || (design ? productName : "Color liso")).trim()

    items.push({
      key: it._key || href,
      kind,
      title,
      subtitle,
      href,
      imageUrl,
      circleUrl: lifestyle && design ? img(design.image, 160, 160) : undefined,
      alt: design ? `Tela ${productName} con diseño ${designName}` : `Tela ${productName}`,
    })
  }

  return {
    id: doc._id,
    title: String(doc.title).trim(),
    highlight: doc.highlight?.trim() || undefined,
    subtitle: doc.subtitle?.trim() || undefined,
    slug: doc.slug,
    theme: THEMES.includes(doc.theme) ? doc.theme : "navidad",
    buttonText: doc.buttonText?.trim() || "Ver todas las telas",
    bannerUrl: img(doc.bannerImage, 1600),
    bannerMobileUrl: img(doc.bannerImageMobile, 800),
    bannerAlt: doc.bannerAlt?.trim() || undefined,
    items,
  }
}

// ---------------------------------------------------------------------------------------------
// Colecciones iniciales: se crean una sola vez (ids fijos + createIfNotExists) cuando aún no hay
// ninguna, para que "Telas para Navidad" aparezca ya armada y se edite desde el admin.
// ---------------------------------------------------------------------------------------------
const SEED_NAVIDAD_ID = "commercialCollection-telas-para-navidad"
// La colección de Halloween creada antes ya no se usa: se borra si sigue vacía (no toca una que se haya llenado)
const OLD_HALLOWEEN_ID = "commercialCollection-telas-para-halloween"
const NAVIDAD_COLOR_SLUGS = ["tela-brush-rojo-cereza-colombia", "tela-brush-verde-oscuro-colombia", "tela-brush-blanco-colombia"]
let seedAttempted = false

const ref = (id: string) => ({ _type: "reference", _ref: id, _weak: true })

async function ensureDefaultCollections(): Promise<boolean> {
  if (seedAttempted) return false
  seedAttempted = true
  try {
    const writer = client.withConfig({ useCdn: false })
    const oldHalloween = await writer.fetch<string[]>(
      groq`*[_id in [$id, "drafts." + $id] && count(coalesce(items, [])) == 0]._id`,
      { id: OLD_HALLOWEEN_ID }
    )
    if (oldHalloween?.length) {
      const tx = writer.transaction()
      oldHalloween.forEach((id) => tx.delete(id))
      await tx.commit().catch((e: any) => console.error("[colecciones] No se pudo borrar Halloween:", e))
    }
    const existing = await writer.fetch<number>(groq`count(*[_type == "commercialCollection"])`)
    if (existing > 0) return false

    const data = await writer.fetch<any>(
      groq`{
        "designs": *[_type == "imagenSublimada" && isActive != false && defined(image.asset) && !(_id in path("drafts.**"))
          && (subcategory match "*navid*" || name match "*navid*")] | order(_createdAt desc)[0...60]{ _id, category },
        "fabrics": *[_type == "product" && !(_id in path("drafts.**")) && defined(designCategory)]{ _id, designCategory, customDesignCategory },
        "colors": *[_type == "product" && !(_id in path("drafts.**")) && slug.current in $colorSlugs]{ _id, "slug": slug.current }
      }`,
      { colorSlugs: NAVIDAD_COLOR_SLUGS }
    )
    const norm = (v?: string) => String(v || "").toLowerCase().trim()
    const fabricFor = (category?: string) =>
      (data?.fabrics || []).find((f: any) => norm(f.designCategory) === norm(category) || norm(f.customDesignCategory) === norm(category))
    const key = () => Math.random().toString(36).slice(2, 12)

    const designItems = (data?.designs || [])
      .map((d: any) => ({ d, fabric: fabricFor(d.category) }))
      .filter((x: any) => x.fabric)
      .map(({ d, fabric }: any) => ({ _key: key(), _type: "collectionItem", kind: "design", product: ref(fabric._id), design: ref(d._id) }))
    const colorItems = NAVIDAD_COLOR_SLUGS.map((slug) => (data?.colors || []).find((c: any) => c.slug === slug))
      .filter(Boolean)
      .map((c: any) => ({ _key: key(), _type: "collectionItem", kind: "color", product: ref(c._id) }))

    // Primero algunos diseños, luego los colores lisos y después el resto de diseños
    const items = [...designItems.slice(0, 5), ...colorItems, ...designItems.slice(5)]

    await writer
      .transaction()
      .createIfNotExists({
        _id: SEED_NAVIDAD_ID,
        _type: "commercialCollection",
        title: "Telas para Navidad",
        highlight: "Navidad",
        subtitle: "Diseños y colores perfectos para pijamas, decoración, manteles y regalos",
        slug: { _type: "slug", current: "telas-para-navidad" },
        isActive: true,
        showOnHome: true,
        homeOrder: 1,
        endDate: "2027-01-07T04:59:00.000Z",
        theme: "navidad",
        buttonText: "Ver todas las telas",
        items,
      })
      .commit()
    return true
  } catch (error) {
    console.error("[colecciones] No se pudieron crear las colecciones iniciales:", error)
    return false
  }
}

/** Colecciones activas marcadas para el inicio, en el orden definido en el admin. */
export async function getHomeCollections(): Promise<CommercialCollection[]> {
  try {
    if (!seedAttempted) {
      const created = await ensureDefaultCollections()
      if (created) {
        const fresh = await client
          .withConfig({ useCdn: false })
          .fetch<any[]>(groq`*[${VISIBLE_FILTER} && showOnHome != false] | order(coalesce(homeOrder, 99) asc, _createdAt desc)[0...4]${PROJECTION}`)
        return (fresh || []).map(mapCollection).filter((c): c is CommercialCollection => !!c && c.items.length > 0)
      }
    }
    const docs = await cachedClient.fetch<any[]>(
      groq`*[${VISIBLE_FILTER} && showOnHome != false] | order(coalesce(homeOrder, 99) asc, _createdAt desc)[0...4]${PROJECTION}`
    )
    return (docs || []).map(mapCollection).filter((c): c is CommercialCollection => !!c && c.items.length > 0)
  } catch (error) {
    console.error("Error fetching commercial collections:", error)
    return []
  }
}

/** Una colección activa (para /colecciones/<slug>). */
export async function getCollection(slug: string): Promise<CommercialCollection | null> {
  try {
    const doc = await cachedClient.fetch<any>(groq`*[${VISIBLE_FILTER} && slug.current == $slug][0]${PROJECTION}`, { slug })
    return mapCollection(doc)
  } catch (error) {
    console.error("Error fetching commercial collection:", error)
    return null
  }
}

/** Slugs de colecciones activas (sitemap). */
export async function listCollectionSlugs(): Promise<Array<{ slug: string; _updatedAt?: string }>> {
  try {
    // Con la sección oculta en el inicio, el mantenimiento (borrar la colección vacía de Halloween) corre desde aquí
    await ensureDefaultCollections()
    return (await cachedClient.fetch<any[]>(groq`*[${VISIBLE_FILTER}]{ "slug": slug.current, _updatedAt }`)) || []
  } catch {
    return []
  }
}
