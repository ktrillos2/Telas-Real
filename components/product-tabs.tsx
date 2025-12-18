"use client"

import { useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/lib/hooks/useProducts"
import { useCategories } from "@/lib/hooks/useCategories"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function ProductTabs() {
  const { categories, loading: loadingCategories } = useCategories()
  const { products, loading: loadingProducts } = useProducts()

  if (loadingCategories || loadingProducts) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">Nuestra Tienda</h2>
            <p className="text-lg font-light text-muted-foreground">
              Explora nuestro catálogo completo de telas de alta calidad
            </p>
          </div>
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  // Definir las pestañas específicas que quiere el usuario
  const customTabs = [
    { name: "SUBLIMADOS", slug: "sublimados" },
    { name: "UNICOLOR", slug: "unicolor" },
    { name: "PERSONALIZACIÓN", slug: "personalizacion" },
    { name: "SERVICIO DE SUBLIMACIÓN", slug: "servicio-de-sublimacion" },
  ]

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-4">Nuestra Tienda</h2>
          <p className="text-lg font-light text-muted-foreground">
            Explora nuestro catálogo completo de telas de alta calidad
          </p>
        </div>

        <Tabs defaultValue={customTabs[0].slug} className="w-full">
          <TabsList className="w-full flex flex-wrap justify-center gap-2 h-auto bg-transparent p-0 mb-8">
            {customTabs.map((tab) => {
              if (tab.slug === "personalizacion") {
                return (
                  <Link
                    key={tab.slug}
                    href="/personalizado#disenos-personalizados"
                    className="rounded-full px-6 border border-muted hover:bg-muted/50 transition-colors text-sm font-medium w-[260px] h-10 flex-none flex justify-center items-center"
                  >
                    {tab.name}
                  </Link>
                )
              }
              if (tab.slug === "servicio-de-sublimacion") {
                return (
                  <Link
                    key={tab.slug}
                    href="/personalizado"
                    className="rounded-full px-6 border border-muted hover:bg-muted/50 transition-colors text-sm font-medium w-[260px] h-10 flex-none flex justify-center items-center"
                  >
                    {tab.name}
                  </Link>
                )
              }
              return (
                <TabsTrigger
                  key={tab.slug}
                  value={tab.slug}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 border border-muted w-[260px] h-10 flex-none"
                >
                  {tab.name}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {customTabs.map((tab) => {
            // Filtrar productos por categoría
            // Nota: Esto asume que los slugs coinciden. Si no, habría que ajustar la lógica de mapeo.
            const categoryProducts = products.filter((product) =>
              product.categories?.some((cat) =>
                cat.slug === tab.slug ||
                cat.slug.includes(tab.slug) ||
                (tab.slug === "sublimados" && cat.slug.includes("sublimado")) ||
                (tab.slug === "unicolor" && cat.slug.includes("unicolor"))
              )
            )

            return (
              <TabsContent key={tab.slug} value={tab.slug} className="mt-6">
                {/* PRODUCTS CAROUSEL */}
                <div className="relative px-4 md:px-12">
                  {categoryProducts.length > 0 ? (
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-4">
                        {categoryProducts.slice(0, 12).map((product, index) => (
                          <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <ProductCard
                              id={product.id}
                              name={product.name}
                              price={product.price}
                              regularPrice={product.regular_price}
                              salePrice={product.sale_price}
                              image={product.image}
                              priority={index < 6}
                              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              is_in_stock={product.is_in_stock}
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-0 md:-left-12" />
                      <CarouselNext className="right-0 md:-right-12" />
                    </Carousel>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No hay productos disponibles en esta categoría por el momento.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        <div className="text-center mt-12">
          <Link href="/tienda">
            <Button variant="outline" size="lg" className="font-light min-w-[200px]">
              Ver Todos los Productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
