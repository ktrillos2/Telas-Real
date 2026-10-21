import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { TiendaServerPage } from "@/app/tienda/tienda-server"
import { usageSlug } from "@/lib/seo"

// Landings por uso/proyecto ("telas para pijamas", "telas para uniformes"...):
// cada una tiene título, H1, canonical y datos estructurados propios sobre el catálogo filtrado.
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getUsage(slug: string) {
  return client.fetch(
    groq`*[_type == "usage" && slug.current in $slugs][0]{
      title,
      "slug": slug.current,
      "count": count(*[_type == "product" && references(^._id) && stockStatus != "outOfStock" && stock_status != "outofstock"])
    }`,
    { slugs: [slug, `/usos/${slug}`] }
  )
}

// "Pijamas" → "Telas para Pijamas"; "Telas para vestidos" se mantiene
function usageHeading(title: string): string {
  const value = title.trim()
  return /^telas?\b/i.test(value) ? value : `Telas para ${value}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const usage = await getUsage(slug)
  if (!usage) return { title: "Uso no encontrado", robots: { index: false, follow: true } }

  const heading = usageHeading(usage.title)
  const description = `${heading} por metro en Telas Real: ${usage.count} referencias con ancho, composición y precio, y envíos a toda Colombia.`
  const path = `/usos/${usageSlug(usage.slug)}`
  return {
    title: `${heading} por Metro en Colombia`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${heading} | Telas Real`, description, url: path, type: "website" },
    // Sin productos disponibles la página queda accesible desde el menú, pero no se indexa
    ...(usage.count === 0 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function UsoPage({ params, searchParams }: Props) {
  const { slug } = await params
  const usage = await getUsage(slug)
  if (!usage) notFound()

  const heading = usageHeading(usage.title)
  return TiendaServerPage({
    params: Promise.resolve({ slug: [] }),
    searchParams,
    landing: {
      heading,
      intro: `Selección de telas recomendadas para ${usage.title.toLowerCase()}. Compara ancho, composición, elasticidad y precio por metro en cada ficha técnica, y recibe tu pedido en cualquier ciudad de Colombia.`,
      path: `/usos/${usageSlug(usage.slug)}`,
      breadcrumbName: heading,
      uso: usage.slug,
    },
  })
}
