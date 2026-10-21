import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin, Phone, Clock, ArrowRight, Truck, Scissors, Palette, Building2 } from "lucide-react"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { absoluteUrl, breadcrumbJsonLd, cleanSlug, groupStoresByCity, storeJsonLd } from "@/lib/seo"

export const revalidate = 3600

type Props = {
  params: Promise<{ ciudad: string }>
}

async function getCityData(ciudad: string) {
  const [stores, categories] = await Promise.all([
    client.fetch(groq`*[_type == "store"] | order(name asc) { _id, name, address, phone, hours, mapUrl, coordinates }`),
    client.fetch(groq`
      *[_type == "category" && defined(slug.current) && coalesce(isActive, true) == true && !(slug.current in ["tijeras", "hilos", "insumos", "sudaderas", "sudadera", "telas-para-sudaderas-sweaters"])] {
        name,
        "slug": slug.current,
        "count": count(*[_type == "product" && references(^._id) && stockStatus != "outOfStock" && stock_status != "outofstock"])
      } | order(count desc) [0...8]
    `),
  ])
  const groups = groupStoresByCity(stores || [])
  const group = groups.find((g) => g.slug === ciudad)
  return { group, groups, categories: (categories || []).filter((c: any) => c.count > 0) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad } = await params
  const { group } = await getCityData(ciudad)
  if (!group) return { title: "Ciudad no encontrada", robots: { index: false, follow: true } }

  const count = group.stores.length
  const path = `/puntos-atencion/${group.slug}`
  const description = `${count === 1 ? "Tienda" : `${count} tiendas`} de Telas Real en ${group.city}: dirección, teléfono y horarios. Telas por metro, sublimación y venta mayorista en ${group.city}.`
  return {
    title: `Tienda de Telas en ${group.city} | Direcciones y Horarios`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `Telas Real en ${group.city}`,
      description,
      url: path,
      type: "website",
    },
  }
}

export default async function CiudadPage({ params }: Props) {
  const { ciudad } = await params
  const { group, groups, categories } = await getCityData(ciudad)
  if (!group) notFound()

  const { city, stores } = group
  const pageUrl = absoluteUrl(`/puntos-atencion/${group.slug}`)
  const isBogota = group.slug === "bogota"
  const otherCities = groups.filter((g) => g.slug !== group.slug)

  const faqs = [
    {
      question: `¿Dónde comprar telas en ${city}?`,
      answer: `Telas Real tiene ${stores.length === 1 ? "una tienda física" : `${stores.length} tiendas físicas`} en ${city}: ${stores.map((s) => `${s.name}${s.address ? ` (${s.address})` : ""}`).join("; ")}. También puedes comprar en línea en telasreal.com con envío a ${city}.`,
    },
    {
      question: `¿Cuál es el horario de Telas Real en ${city}?`,
      answer: stores.map((s) => `${s.name}: ${s.hours || "consulta el horario por WhatsApp al +57 315 902 1516"}`).join(". ") + ".",
    },
    {
      question: `¿Hacen envíos de telas a ${city}?`,
      answer: isBogota
        ? "Sí. Los pedidos del sitio web se despachan desde nuestro centro de distribución en Bogotá D.C. El alistamiento toma normalmente de 24 a 48 horas hábiles y la entrega en ciudades principales de 1 a 3 días hábiles."
        : `Sí. Los pedidos del sitio web se despachan desde Bogotá D.C. a ${city} con Coordinadora, Interrapidísimo o Movipack. El alistamiento toma normalmente de 24 a 48 horas hábiles; la entrega en ciudades principales tarda de 1 a 3 días hábiles y en municipios intermedios de 3 a 5. El costo se calcula en el checkout.`,
    },
    {
      question: `¿Cómo se venden las telas en ${city}?`,
      answer: "En la tienda en línea las telas se seleccionan por metros. Para compras por kilo, por rollo cerrado o al por mayor, consulta disponibilidad en la sede o en el canal de ventas a empresas.",
    },
  ]

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@graph": stores.map((s, idx) => storeJsonLd(s, `store-${idx + 1}`, pageUrl)),
    },
    breadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Puntos de atención", path: "/puntos-atencion" },
      { name: city, path: `/puntos-atencion/${group.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ]

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="py-14 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <nav aria-label="Ruta de navegación" className="text-xs text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/puntos-atencion" className="hover:text-primary">Puntos de atención</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{city}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-light mb-4 text-balance">Tienda de telas en {city}</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            {stores.length === 1 ? "Visita nuestra tienda" : `Visita nuestras ${stores.length} tiendas`} en {city} y
            encuentra telas por metro para confección, uniformes, ropa deportiva, decoración y sublimación.
            {isBogota
              ? " Además, desde Bogotá despachamos los pedidos en línea a toda Colombia."
              : ` Si prefieres comprar en línea, te enviamos el pedido a ${city} desde Bogotá.`}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-light mb-8 text-center">
            {stores.length === 1 ? "Dirección y horario" : `Nuestras sedes en ${city}`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {stores.map((store) => {
              const query = encodeURIComponent(`${store.name} ${store.address}`)
              return (
                <article key={store._id || store.name} className="bg-background rounded-xl border border-primary/10 overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps?q=${query}&output=embed`}
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Mapa de ${store.name}`}
                  />
                  <div className="p-6 space-y-3">
                    <h3 className="font-light text-xl">{store.name}</h3>
                    {store.address && (
                      <p className="flex items-start gap-3 text-sm text-muted-foreground">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{store.address}</span>
                      </p>
                    )}
                    {store.phone && (
                      <p className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                        <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary">{store.phone}</a>
                      </p>
                    )}
                    {store.hours && (
                      <p className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{store.hours}</span>
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${query}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      Cómo llegar en Google Maps <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-light mb-8 text-center">Qué encuentras en Telas Real {city}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-background rounded-xl border p-5">
              <Scissors className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium mb-1">Telas por metro</h3>
              <p className="text-sm text-muted-foreground">Unicolor, estampadas, deportivas y para uniformes.</p>
            </div>
            <Link href="/personalizado" className="bg-background rounded-xl border p-5 hover:border-primary/40 transition-colors">
              <Palette className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium mb-1">Sublimación personalizada</h3>
              <p className="text-sm text-muted-foreground">Estampa tus diseños sobre telas aptas para sublimar.</p>
            </Link>
            <Link href="/empresas" className="bg-background rounded-xl border p-5 hover:border-primary/40 transition-colors">
              <Building2 className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium mb-1">Ventas a empresas</h3>
              <p className="text-sm text-muted-foreground">Precios por volumen y abastecimiento para confeccionistas.</p>
            </Link>
            <Link href="/politica-de-envios" className="bg-background rounded-xl border p-5 hover:border-primary/40 transition-colors">
              <Truck className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium mb-1">Envíos a {city}</h3>
              <p className="text-sm text-muted-foreground">Despachos desde Bogotá; entrega de 1 a 3 días hábiles en ciudades principales.</p>
            </Link>
          </div>

          {categories.length > 0 && (
            <>
              <h3 className="text-lg font-light mb-4 text-center">Categorías más buscadas</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat: any) => (
                  <Link
                    key={cat.slug}
                    href={`/tienda/${cleanSlug(cat.slug)}`}
                    className="px-4 py-2 rounded-full border border-border bg-background text-sm hover:border-primary hover:text-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-light mb-6 text-center">Preguntas frecuentes en {city}</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="border rounded-xl p-5">
                <h3 className="font-medium mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-6">
            ¿Tienes otra duda? Revisa las <Link href="/preguntas-frecuentes" className="text-primary underline">preguntas frecuentes</Link> o
            la <Link href="/politica-de-envios" className="text-primary underline">política de envíos</Link>.
          </p>
        </div>
      </section>

      {otherCities.length > 0 && (
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl font-light mb-4">Telas Real en otras ciudades</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {otherCities.map((g) => (
                <Link
                  key={g.slug}
                  href={`/puntos-atencion/${g.slug}`}
                  className="px-4 py-2 rounded-full border border-border bg-background text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  Telas en {g.city}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
