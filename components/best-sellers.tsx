"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function BestSellers() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBestSellers() {
      try {
        // Fetch products ordered by popularity or a "bestSeller" flag if we add it
        // For now, we'll fetch products with a high price or just the latest as placeholder
        const data = await client.fetch(groq`
          *[_type == "product" && stockStatus != "outOfStock"] | order(_createdAt desc) [0...10] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            salePrice,
            "image": images[0].asset->url,
            "imageAlt": images[0].alt,
            stockStatus
          }
        `)

        const mapped = data.map((p: any) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          pricePerKilo: p.pricePerKilo,
          regular_price: p.price,
          sale_price: p.salePrice,
          image: p.image || "/placeholder.svg",
          imageAlt: p.imageAlt,
          is_in_stock: p.stockStatus !== "outOfStock"
        }))

        setProducts(mapped)
      } catch (error) {
        console.error("Failed to fetch best sellers", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBestSellers()
  }, [])

  if (loading || products.length === 0) return null

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-primary">Lo más vendido</h2>
          <p className="text-lg font-light text-muted-foreground">
            Descubre los textiles preferidos por nuestros clientes
          </p>
        </div>

        <div className="relative px-4 md:px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {products.map((product) => (
                <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <ProductCard
                    {...product}
                    priority={false}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 md:-left-12" />
            <CarouselNext className="right-0 md:-right-12" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
