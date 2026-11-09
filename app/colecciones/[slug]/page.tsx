import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CollectionBanner, CollectionCardItem, THEME_STYLES } from "@/components/commercial-collections"
import { JsonLd, ORGANIZATION_REF } from "@/components/json-ld"
import { getCollection } from "@/lib/commercial-collections"
import { absoluteUrl, breadcrumbJsonLd, metaDescription, pageTitle } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollection(decodeURIComponent(slug))
  if (!collection) return { title: "Colección no encontrada", robots: { index: false } }
  const description = metaDescription(
    collection.subtitle
      ? `${collection.title}: ${collection.subtitle}. Compra por metro en Telas Real con envíos a toda Colombia.`
      : `${collection.title}: ${collection.items.length} diseños y colores elegidos para la temporada. Compra por metro en Telas Real con envíos a toda Colombia.`
  )
  const image = collection.bannerUrl || collection.items[0]?.imageUrl
  return {
    title: pageTitle(collection.title),
    description,
    alternates: { canonical: `/colecciones/${collection.slug}` },
    openGraph: {
      title: collection.title,
      description,
      url: `/colecciones/${collection.slug}`,
      images: image ? [{ url: image, alt: collection.title }] : undefined,
    },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const collection = await getCollection(decodeURIComponent(slug))
  if (!collection || collection.items.length === 0) notFound()

  const t = THEME_STYLES[collection.theme]
  const pagePath = `/colecciones/${collection.slug}`

  return (
    <main className="bg-background">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: collection.title,
            description: collection.subtitle || undefined,
            url: absoluteUrl(pagePath),
            isPartOf: { "@type": "WebSite", url: absoluteUrl("/") },
            publisher: ORGANIZATION_REF,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: collection.items.length,
              itemListElement: collection.items.map((card, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: card.subtitle ? `${card.title} - ${card.subtitle}` : card.title,
                url: absoluteUrl(card.href),
                image: card.imageUrl,
              })),
            },
          },
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: collection.title, path: pagePath },
          ]),
        ]}
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <nav aria-label="Ruta de navegación" className="mb-4 text-xs font-light text-muted-foreground">
          <Link href="/" className="hover:text-primary">Inicio</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{collection.title}</span>
        </nav>

        <CollectionBanner collection={collection} headingLevel="h1" linkToPage={false} />

        <p className="mt-6 text-sm font-light text-muted-foreground">
          {collection.items.length} {collection.items.length === 1 ? "opción" : "opciones"}. Toca una tarjeta para ver la tela con ese diseño o color ya elegido.
        </p>

        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {collection.items.map((card, i) => (
            <li key={card.key}>
              <CollectionCardItem card={card} ring={t.ring} priority={i < 6} />
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Link
            href="/tienda"
            className="inline-flex items-center rounded-full border border-primary px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Ver todo el catálogo de telas
          </Link>
        </div>
      </div>
    </main>
  )
}
