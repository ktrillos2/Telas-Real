import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { ProductCardRef } from './product-card-ref'

interface ProductCarouselProps {
  products: any[]
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  if (!products || products.length === 0) return null

  // Si por alguna razón llega solo 1, lo renderizamos normal
  if (products.length === 1 && products[0]?.product) {
    return <ProductCardRef value={products[0].product} />
  }

  return (
    <div className="my-10 mx-auto max-w-4xl relative group/carousel">
      <div className="mb-4 text-center">
        <h4 className="text-xl font-light text-primary">Colección Destacada</h4>
        <p className="text-sm font-light text-muted-foreground mt-1 text-balance">
          Desliza para ver más productos recomendados personalizados.
        </p>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {products.map((item, index) => {
            if (!item?.product) return null
            return (
              <CarouselItem key={item._key || index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <ProductCardRef value={item.product} variant="compact" />
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <div className="hidden sm:block opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
          <CarouselPrevious className="absolute left-0 -ml-12 top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute right-0 -mr-12 top-1/2 -translate-y-1/2" />
        </div>
      </Carousel>
    </div>
  )
}
