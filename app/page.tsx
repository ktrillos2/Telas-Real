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
import { getStoreSettings } from "@/lib/store-settings-server"
import { HomeSeoText } from "@/components/home-seo-text"

export const metadata: Metadata = {
    alternates: { canonical: "/" },
}

export default async function Home() {
    // "Mostrar colecciones comerciales en el inicio": Elementos Globales → Ajustes de la tienda
    const storeSettings = await getStoreSettings()
    const SHOW_COMMERCIAL_COLLECTIONS = storeSettings.showCommercialCollections

    return (
        <div className="min-h-screen">
            <ScrollToTop />
            <PromoBanner />
            <main>
                <h1 className="sr-only">Telas por metro y rollo en Colombia - Telas Real, tienda de telas en Bogotá</h1>
                <HeroCarousel />
                <SpecialServices />
                {/* Colecciones de temporada (ej. Navidad) administradas en Sanity. Ocultas por ahora:
                    se activan en Sanity: Elementos Globales → Ajustes de la tienda. */}
                {SHOW_COMMERCIAL_COLLECTIONS && <CommercialCollections />}
                <Suspense fallback={<ProductTabsSkeleton />}>
                    <ProductTabs />
                </Suspense>
                <BestSellers />
                <OffersCarousel />
                <Testimonials />
                {/* Texto SEO "telas por metro y rollo" (Ajustes de la tienda → Texto SEO del inicio) */}
                <HomeSeoText settings={storeSettings} />
            </main>
        </div>
    )
}

