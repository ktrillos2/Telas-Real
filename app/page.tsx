"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import { PromoBanner } from "@/components/promo-banner"
import { HeroCarousel } from "@/components/hero-carousel"
import { ProductTabsSkeleton } from "@/components/product-tabs-skeleton"

// Dynamic imports for below-the-fold components
const ProductTabs = dynamic(() => import("@/components/product-tabs").then(mod => mod.ProductTabs), {
    ssr: false,
    loading: () => <ProductTabsSkeleton />
})
const Testimonials = dynamic(() => import("@/components/testimonials").then(mod => mod.Testimonials))
const AboutUs = dynamic(() => import("@/components/about-us").then(mod => mod.AboutUs))
const StoreLocations = dynamic(() => import("@/components/store-locations").then(mod => mod.StoreLocations))
const SpecialServices = dynamic(() => import("@/components/special-services").then(mod => mod.SpecialServices))

export default function Home() {
    // Scroll al top cuando se carga la página
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="min-h-screen">
            <PromoBanner />
            <main>
                <HeroCarousel />
                <ProductTabs />
                <Testimonials />
                <AboutUs />
                <StoreLocations hideTitle={false} title="Acércate a nuestras tiendas" showViewMore limit={4} />
                <SpecialServices />
            </main>
        </div>
    )
}
