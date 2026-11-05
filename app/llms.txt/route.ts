import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { SITE_URL, cleanSlug, groupStoresByCity, usageSlug } from "@/lib/seo"
import { UNIFIED_FABRIC_CONFIGS } from "@/lib/unified-fabrics"

// Resumen para asistentes y buscadores con IA (https://llmstxt.org).
// Solo incluye datos verificables publicados en el propio sitio.
export const revalidate = 3600

export async function GET() {
  const [categories, posts, stores, usages, eventTerms] = await Promise.all([
    client.fetch(groq`
      *[_type == "category" && !(_id in path("drafts.**")) && defined(slug.current) && coalesce(isActive, true) == true && !(slug.current in ["sudaderas", "sudadera", "telas-para-sudaderas-sweaters"]) && count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id) && stockStatus != "outOfStock" && stock_status != "outofstock"]) > 0] | order(name asc) {
        name, "slug": slug.current, seoDescription
      }
    `),
    client.fetch(groq`
      *[_type == "post" && !(_id in path("drafts.**")) && defined(slug.current) && (!defined(publishedAt) || publishedAt <= now())] | order(coalesce(publishedAt, _createdAt) desc) [0...25] {
        title, "slug": slug.current, metaDescription
      }
    `),
    client.fetch(groq`*[_type == "store" && !(_id in path("drafts.**"))]{ name, address, phone, hours }`),
    client.fetch(groq`
      *[_type == "usage" && !(_id in path("drafts.**")) && defined(slug.current) && !(title match "*sudadera*" || slug.current match "*sudadera*") && count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id) && stockStatus != "outOfStock" && stock_status != "outofstock"]) > 0] | order(title asc) {
        title, "slug": slug.current
      }
    `),
    client.fetch(groq`*[_type == "eventTerms" && isActive != false && defined(slug.current) && !(_id in path("drafts.**"))] | order(_createdAt desc) { title, "slug": slug.current, intro }`),
  ])

  const cityGroups = groupStoresByCity(stores || [])

  const lines: string[] = [
    "# Telas Real",
    "",
    "> Telas Real S.A.S. (NIT 901232650-1) es una tienda colombiana de telas por metro, textiles para confección y sublimación personalizada, con tiendas físicas en varias ciudades y envíos a toda Colombia desde Bogotá D.C.",
    "",
    "## Datos clave",
    "",
    `- Sitio oficial: ${SITE_URL}`,
    "- Sede principal: Calle 12 # 38-65, Bogotá D.C., Colombia",
    "- Atención y WhatsApp: +57 315 902 1516 — tiendavirtual@telasreal.com",
    "- Envíos: despachos desde Bogotá a todo el país con Coordinadora, Interrapidísimo y Movipack; alistamiento de 24 a 48 horas hábiles y entrega de 1 a 3 días hábiles en ciudades principales (3 a 5 en municipios intermedios, hasta 7 en zonas de difícil acceso).",
    "- Venta en línea por metros; la lista de precios e-commerce incluye un margen del 5 % por la diferencia entre metros y peso real del corte, sin cobros adicionales posteriores.",
    "- Pagos en línea mediante la pasarela Wompi.",
    "- Retracto: 5 días hábiles tras la entrega (con excepciones legales para telas cortadas a medida o sublimadas). Garantía de calidad: 5 días desde la entrega.",
    "",
    "## Páginas principales",
    "",
    `- [Tienda de telas](${SITE_URL}/tienda): catálogo completo con precios y disponibilidad.`,
    `- [Preguntas frecuentes](${SITE_URL}/preguntas-frecuentes): compra mínima, metros vs. kilos, envíos, pagos, cambios y garantías.`,
    `- [Puntos de atención](${SITE_URL}/puntos-atencion): direcciones, teléfonos y horarios de las tiendas físicas.`,
    `- [Sublimación personalizada](${SITE_URL}/personalizado): estampado de diseños propios sobre telas aptas para sublimar.`,
    `- [Ventas a empresas](${SITE_URL}/empresas): canal B2B y mayorista.`,
    `- [Calculadora de telas](${SITE_URL}/calculadora): conversión de kilos a metros y precio estimado.`,
    `- [Conócenos](${SITE_URL}/conocenos): historia de la marca.`,
    "",
    "## Políticas",
    "",
    `- [Política de envíos](${SITE_URL}/politica-de-envios)`,
    `- [Términos y condiciones](${SITE_URL}/terminos-y-condiciones)`,
    `- [Política de privacidad y tratamiento de datos](${SITE_URL}/politica-de-privacidad)`,
    `- [Centro de políticas](${SITE_URL}/politicas)`,
    `- [PQRS](${SITE_URL}/pqr)`,
  ]

  if (cityGroups.length > 0) {
    lines.push("", "## Tiendas físicas por ciudad", "")
    for (const group of cityGroups) {
      lines.push(`- [Telas en ${group.city}](${SITE_URL}/puntos-atencion/${group.slug}): ${group.stores.map((s) => [s.name, s.address].filter(Boolean).join(", ")).join(" | ")}`)
    }
  }

  // Telas principales: una ficha por tela con todos sus colores, ancho y composición
  const fabrics = UNIFIED_FABRIC_CONFIGS.filter((c) => !/hilo/i.test(c.id))
  if (fabrics.length > 0) {
    lines.push("", "## Telas principales (ficha con todos los colores)", "")
    for (const cfg of fabrics) {
      const specs = cfg.attributes
        .filter((a) => /ancho|composici/i.test(a.name))
        .map((a) => `${a.name.toLowerCase()} ${a.value}`)
        .join("; ")
      const uses = cfg.usages.slice(0, 4).map((u) => u.title.toLowerCase()).join(", ")
      lines.push(`- [${cfg.name.split("|")[0].trim()}](${SITE_URL}/producto/${cfg.unifiedSlug})${specs ? `: ${specs}` : ""}${uses ? `. Usos: ${uses}.` : ""}`)
    }
  }

  if (usages?.length > 0) {
    lines.push("", "## Telas por uso", "")
    for (const u of usages) {
      const slug = usageSlug(u.slug)
      if (!slug) continue
      lines.push(`- [${u.title}](${SITE_URL}/usos/${encodeURIComponent(slug)}): telas por metro recomendadas para ${String(u.title).toLowerCase()}`)
    }
  }

  if (categories?.length > 0) {
    lines.push("", "## Categorías de telas", "")
    for (const cat of categories) {
      const slug = cleanSlug(cat.slug)
      if (!slug) continue
      lines.push(`- [${cat.name}](${SITE_URL}/tienda/${encodeURIComponent(slug)})${cat.seoDescription ? `: ${cat.seoDescription}` : ""}`)
    }
  }

  if (posts?.length > 0) {
    lines.push("", "## Guías y artículos", "")
    for (const post of posts) {
      const slug = cleanSlug(post.slug)
      if (!slug) continue
      lines.push(`- [${post.title}](${SITE_URL}/blog/${encodeURIComponent(slug)})${post.metaDescription ? `: ${post.metaDescription}` : ""}`)
    }
  }

  if (eventTerms?.length > 0) {
    lines.push("", "## Eventos y promociones", "")
    for (const e of eventTerms) {
      lines.push(`- [${e.title}](${SITE_URL}/terminos-eventos/${encodeURIComponent(e.slug)})${e.intro ? `: ${e.intro}` : ""}`)
    }
  }

  lines.push("", "## Opcional", "", `- [Sitemap XML](${SITE_URL}/sitemap.xml)`)

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
