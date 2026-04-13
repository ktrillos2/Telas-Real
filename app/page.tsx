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

import { client } from "@/sanity/lib/client"
import { useState } from "react"

export default function Home() {
    const [stores, setStores] = useState<any[]>([])

    // Scroll al top cuando se carga la página
    useEffect(() => {
        window.scrollTo(0, 0)

        // Fetch stores from Sanity
        async function fetchStores() {
            try {
                const data = await client.fetch(`
                    *[_type == "store"] {
                        _id,
                        name,
                        address,
                        phone,
                        hours,
                        coordinates
                    }
                `, {}, { next: { revalidate: 3600 } })
                setStores(data.map((s: any) => ({
                    id: s._id,
                    name: s.name,
                    address: s.address,
                    phone: s.phone,
                    hours: s.hours,
                    coordinates: s.coordinates
                })))
            } catch (error) {
                console.error("Error fetching stores:", error)
            }
        }
        fetchStores()
    }, [])

    return (
        <div className="min-h-screen">
            <PromoBanner />
            <main>
                <h1 className="sr-only">Telas Real - Tu tienda de telas online</h1>
                <HeroCarousel />
                <ProductTabs />
                <Testimonials />
                <AboutUs />
                <StoreLocations 
                    hideTitle={false} 
                    title="Acércate a nuestras tiendas" 
                    showViewMore 
                    limit={4} 
                    stores={stores.length > 0 ? stores : undefined}
                />
                <SpecialServices />
            </main>
        </div>
    )
}
