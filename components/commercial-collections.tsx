import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import type { CommercialCollection, CollectionCard, CollectionTheme } from "@/lib/commercial-collections"
import { getHomeCollections } from "@/lib/commercial-collections"

/** Colores de cada temporada (banner generado, botón y detalles). */
export const THEME_STYLES: Record<
  CollectionTheme,
  { bg: string; title: string; accent: string; text: string; button: string; ring: string; pattern: string }
> = {
  navidad: {
    bg: "linear-gradient(115deg, #0b3b2b 0%, #14532d 55%, #7f1d1d 130%)",
    title: "text-white",
    accent: "text-[#fca5a5]",
    text: "text-white/85",
    button: "bg-[#b91c1c] hover:bg-[#991b1b] text-white",
    ring: "ring-[#b91c1c]",
    pattern: "rgba(255,255,255,0.12)",
  },
  halloween: {
    bg: "linear-gradient(115deg, #0c0a09 0%, #292524 55%, #7c2d12 130%)",
    title: "text-white",
    accent: "text-[#fb923c]",
    text: "text-white/80",
    button: "bg-[#ea580c] hover:bg-[#c2410c] text-white",
    ring: "ring-[#ea580c]",
    pattern: "rgba(251,146,60,0.14)",
  },
  amor: {
    bg: "linear-gradient(115deg, #4c0519 0%, #881337 60%, #db2777 140%)",
    title: "text-white",
    accent: "text-[#fbcfe8]",
    text: "text-white/85",
    button: "bg-white hover:bg-rose-50 text-[#881337]",
    ring: "ring-[#be123c]",
    pattern: "rgba(255,255,255,0.12)",
  },
  marca: {
    bg: "linear-gradient(115deg, #0f3a5c 0%, #1d6fa3 60%, #5fb0d9 140%)",
    title: "text-white",
    accent: "text-[#bae6fd]",
    text: "text-white/85",
    button: "bg-white hover:bg-sky-50 text-[#0f3a5c]",
    ring: "ring-primary",
    pattern: "rgba(255,255,255,0.12)",
  },
  oscuro: {
    bg: "linear-gradient(115deg, #0a0a0a 0%, #1f1f1f 60%, #3f3f46 140%)",
    title: "text-white",
    accent: "text-[#e9c46a]",
    text: "text-white/80",
    button: "bg-[#d4af37] hover:bg-[#b8962e] text-black",
    ring: "ring-[#d4af37]",
    pattern: "rgba(212,175,55,0.14)",
  },
}

function TitleWithHighlight({ title, highlight, accent }: { title: string; highlight?: string; accent: string }) {
  if (!highlight) return <>{title}</>
  const i = title.toLowerCase().lastIndexOf(highlight.toLowerCase())
  if (i < 0) return <>{title}</>
  return (
    <>
      {title.slice(0, i)}
      <span className={`${accent} font-semibold`}>{title.slice(i, i + highlight.length)}</span>
      {title.slice(i + highlight.length)}
    </>
  )
}

export function CollectionBanner({
  collection,
  headingLevel,
  linkToPage = true,
}: {
  collection: CommercialCollection
  headingLevel: "h1" | "h2"
  /** En la propia página de la colección el banner no enlaza ni muestra botón */
  linkToPage?: boolean
}) {
  const t = THEME_STYLES[collection.theme]
  const href = `/colecciones/${collection.slug}`
  const Heading = headingLevel

  // Banner subido en el admin: la imagen manda; el título queda para lectores de pantalla y Google
  if (collection.bannerUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl shadow-sm">
        <Heading className="sr-only">{collection.title}</Heading>
        <Link
          href={href}
          className={`block ${linkToPage ? "" : "pointer-events-none"}`}
          tabIndex={linkToPage ? undefined : -1}
          aria-label={`${collection.title}: ${collection.buttonText}`}
        >
          <picture>
            {collection.bannerMobileUrl && <source media="(max-width: 767px)" srcSet={collection.bannerMobileUrl} />}
            <img
              src={collection.bannerUrl}
              alt={collection.bannerAlt || collection.title}
              className="block h-auto w-full"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-sm" style={{ background: t.bg }}>
      {/* Textura sutil de puntos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: `radial-gradient(${t.pattern} 1.5px, transparent 1.6px)`, backgroundSize: "22px 22px" }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-white/5" />

      <div className="relative flex flex-col items-start gap-4 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-10 md:py-8">
        <div className="max-w-2xl">
          <Heading className={`text-2xl font-light leading-tight md:text-4xl ${t.title}`}>
            <TitleWithHighlight title={collection.title} highlight={collection.highlight} accent={t.accent} />
          </Heading>
          {collection.subtitle && <p className={`mt-2 text-sm font-light md:text-base ${t.text}`}>{collection.subtitle}</p>}
        </div>
        {linkToPage && (
        <Link
          href={href}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-sm transition-colors ${t.button}`}
        >
          {collection.buttonText}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        )}
      </div>
    </div>
  )
}

export function CollectionCardItem({ card, ring, priority = false }: { card: CollectionCard; ring: string; priority?: boolean }) {
  return (
    <Link href={card.href} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <img
          src={card.imageUrl}
          alt={card.alt}
          width={600}
          height={750}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {card.circleUrl && (
          <img
            src={card.circleUrl}
            alt=""
            aria-hidden
            width={80}
            height={80}
            loading="lazy"
            decoding="async"
            className={`absolute bottom-2 right-2 h-14 w-14 rounded-full object-cover shadow-md ring-2 ring-offset-2 ring-offset-white md:h-16 md:w-16 ${ring}`}
          />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
        {card.title}
      </h3>
      {card.subtitle && <p className="mt-0.5 line-clamp-1 text-xs font-light text-muted-foreground">{card.subtitle}</p>}
    </Link>
  )
}

/** Banner + fila de tarjetas (deslizable en celular, 6 por fila en escritorio). */
export function CollectionShowcase({ collection, maxItems = 12 }: { collection: CommercialCollection; maxItems?: number }) {
  const t = THEME_STYLES[collection.theme]
  const cards = collection.items.slice(0, maxItems)
  const hasMore = collection.items.length > cards.length

  return (
    <div>
      <CollectionBanner collection={collection} headingLevel="h2" />
      <Carousel opts={{ align: "start", loop: false, dragFree: true }} className="mt-6 w-full" aria-label={collection.title}>
        <CarouselContent className="-ml-4">
          {cards.map((card) => (
            <CarouselItem key={card.key} className="basis-[44%] pl-4 sm:basis-[31%] md:basis-1/4 lg:basis-1/6">
              <CollectionCardItem card={card} ring={t.ring} />
            </CarouselItem>
          ))}
          {hasMore && (
            <CarouselItem className="basis-[44%] pl-4 sm:basis-[31%] md:basis-1/4 lg:basis-1/6">
              <Link
                href={`/colecciones/${collection.slug}`}
                className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 p-3 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <ArrowRight className="h-5 w-5" aria-hidden />
                Ver las {collection.items.length} opciones
              </Link>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious className="left-2 top-[38%] hidden h-10 w-10 border-primary/30 bg-white/95 shadow-md disabled:hidden md:flex" />
        <CarouselNext className="right-2 top-[38%] hidden h-10 w-10 border-primary/30 bg-white/95 shadow-md disabled:hidden md:flex" />
      </Carousel>
    </div>
  )
}

/** Primera sección del inicio: colecciones de temporada activas en el admin. */
export async function CommercialCollections() {
  const collections = await getHomeCollections()
  if (collections.length === 0) return null

  return (
    <section className="bg-background pt-10 pb-4 md:pt-14" aria-label="Colecciones de temporada">
      <div className="container mx-auto space-y-12 px-4">
        {collections.map((collection) => (
          <CollectionShowcase key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  )
}
