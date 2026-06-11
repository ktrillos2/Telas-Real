import { PromoBanner } from "@/components/promo-banner"
import { HeroCarousel } from "@/components/hero-carousel"
import { ProductTabs } from "@/components/product-tabs"
import { Testimonials } from "@/components/testimonials"
import { BestSellers } from "@/components/best-sellers"
import { SpecialServices } from "@/components/special-services"
import { ScrollToTop } from "@/components/scroll-to-top"

export default function Home() {

    return (
        <div className="min-h-screen">
            <ScrollToTop />
            <PromoBanner />
            <main>
                <h1 className="sr-only">Telas Real - Tu tienda de telas online</h1>
                <HeroCarousel />
                <SpecialServices />
                <ProductTabs />
                <BestSellers />
                <Testimonials />
            </main>
        </div>
    )
}

