import { Suspense } from "react"
import { CommercialCollections } from "@/components/commercial-collections"
import { PromoBanner } from "@/components/promo-banner"
import { HeroCarousel } from "@/components/hero-carousel"
import { ProductTabs } from "@/components/product-tabs"
import { ProductTabsSkeleton } from "@/components/product-tabs-skeleton"
import { Testimonials } from "@/components/testimonials"
import { BestSellers } from "@/components/best-sellers"
import { OffersCarousel } from "@/components/offers-carousel"
import { SpecialServices } from "@/components/special-services"
import { ScrollToTop } from "@/components/scroll-to-top"
import type { Metadata } from "next"

export const metadata: Metadata = {
    alternates: { canonical: "/" },
}

/** Sección "Colecciones comerciales" (Telas para Navidad…) en el inicio: oculta de momento. */
const SHOW_COMMERCIAL_COLLECTIONS = false

export default function Home() {

    return (
        <div className="min-h-screen">
            <ScrollToTop />
            <PromoBanner />
            <main>
                <h1 className="sr-only">Telas Real - Tu tienda de telas online</h1>
                <HeroCarousel />
                <SpecialServices />
                {/* Colecciones de temporada (ej. Navidad) administradas en Sanity. Ocultas por ahora:
                    cambiar SHOW_COMMERCIAL_COLLECTIONS a true para mostrarlas de nuevo. */}
                {SHOW_COMMERCIAL_COLLECTIONS && <CommercialCollections />}
                <Suspense fallback={<ProductTabsSkeleton />}>
                    <ProductTabs />
                </Suspense>
                <BestSellers />
                <OffersCarousel />
                <Testimonials />
            </main>
        </div>
    )
}

