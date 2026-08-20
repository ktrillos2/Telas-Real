import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
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

export async function ProductTabs() {
  let products: any[] = []
  let selectedProducts: { selectedSublimados: any[], selectedUnicolor: any[] } = { selectedSublimados: [], selectedUnicolor: [] }

  try {
    const [productsData, configData, ofertasData] = await Promise.all([
      client.fetch(groq`
        *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
          references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) ||
          title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
        )] | order(_createdAt desc) [0...300] {
          _id,
          "name": title,
          "slug": slug.current,
          price,
          pricePerKilo,
          "salePrice": coalesce(salePrice, sale_price),
          "image": images[0].asset->url + "?auto=format&w=600&h=600&fit=crop&q=80",
          "imageAlt": images[0].alt,
          "categories": categories[]->{ "slug": slug.current },
          stockStatus,
          stock_status,
          badge,
          "categorySlugs": categories[]->slug.current
        }
      `, {}, { next: { revalidate: 3600 } }),
      client.fetch(groq`
        *[_type == "homeStore"][0] {
          "sublimados": sublimadosProducts[stockStatus != "outOfStock" && stock_status != "outofstock"]-> {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            "salePrice": coalesce(salePrice, sale_price),
            "image": images[0].asset->url + "?auto=format&w=600&h=600&fit=crop&q=80",
            "imageAlt": images[0].alt,
            "categories": categories[]->{ "slug": slug.current },
            stockStatus,
            stock_status,
            badge,
            "categorySlugs": categories[]->slug.current
          },
          "unicolor": unicolorProducts[stockStatus != "outOfStock" && stock_status != "outofstock"]-> {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            "salePrice": coalesce(salePrice, sale_price),
            "image": images[0].asset->url + "?auto=format&w=600&h=600&fit=crop&q=80",
            "imageAlt": images[0].alt,
            "categories": categories[]->{ "slug": slug.current },
            stockStatus,
            stock_status,
            badge,
            "categorySlugs": categories[]->slug.current
          }
        }
      `, {}, { next: { revalidate: 3600 } }),
      client.fetch(groq`
        *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
          references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) ||
          title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
        ) && (
          (defined(salePrice) && salePrice > 0) ||
          (defined(sale_price) && sale_price > 0) ||
          badge match "*oferta*" ||
          badge match "*OFERTA*" ||
          badge match "*Oferta*" ||
          count((categories[]->slug.current)[@ match "*oferta*"]) > 0
        )] | order(_createdAt desc) [0...50] {
          _id,
          "name": title,
          "slug": slug.current,
          price,
          pricePerKilo,
          "salePrice": coalesce(salePrice, sale_price),
          "image": images[0].asset->url + "?auto=format&w=600&h=600&fit=crop&q=80",
          "imageAlt": images[0].alt,
          "categories": categories[]->{ "slug": slug.current },
          stockStatus,
          stock_status,
          badge,
          "categorySlugs": categories[]->slug.current
        }
      `, {}, { next: { revalidate: 3600 } })
    ])

    const mapProduct = (p: any) => {
      const status = (p.stockStatus || p.stock_status || '').toLowerCase();
      const isOutOfStock = status === 'outofstock' || status === 'agotado' || status === 'exhausted';
      
      return {
        id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        pricePerKilo: p.pricePerKilo,
        regularPrice: p.price,
        regular_price: p.price,
        salePrice: p.salePrice || p.sale_price,
        sale_price: p.salePrice || p.sale_price,
        image: p.image || "/placeholder.svg",
        imageAlt: p.imageAlt,
        categories: p.categories || [],
        is_in_stock: !isOutOfStock,
        badge: p.badge,
        categorySlugs: p.categorySlugs
      }
    }

    products = productsData.map(mapProduct)
    const fetchedOfertas = (ofertasData || []).map(mapProduct)

    selectedProducts = {
      selectedSublimados: configData?.sublimados?.map(mapProduct) || [],
      selectedUnicolor: configData?.unicolor?.map(mapProduct) || [],
      selectedOfertas: fetchedOfertas
    } as any
  } catch (error) {
    console.error("Failed to fetch products for tabs", error)
  }

  if (products.length === 0) return null

  // Definir las pestañas específicas que quiere el usuario
  const customTabs = [
    { name: "UNICOLOR", slug: "unicolor" },
    { name: "SUBLIMADOS", slug: "sublimados" },
    { name: "OFERTAS", slug: "ofertas" },
    { name: "PERSONALIZA TU DISEÑO", slug: "personaliza-tu-diseno" },
  ]

  return (
    <section className="py-16 pb-0! bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-primary">Nuestra Tienda</h2>
          <p className="text-lg font-light text-muted-foreground">
            Explora nuestro catálogo completo de telas de alta calidad
          </p>
        </div>

        <Tabs defaultValue={customTabs[0].slug} className="w-full">
          <TabsList className="w-full flex flex-wrap justify-center gap-2 h-auto bg-transparent p-0 mb-8">
            {customTabs.map((tab) => {
              if (tab.slug === "personaliza-tu-diseno") {
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
            if (tab.slug === "personaliza-tu-diseno") return null;

            // Filtrar productos por categoría o usar los seleccionados
            let categoryProducts: any[] = []

            if (tab.slug === "sublimados" && selectedProducts.selectedSublimados.length > 0) {
              categoryProducts = selectedProducts.selectedSublimados
            } else if (tab.slug === "unicolor" && selectedProducts.selectedUnicolor.length > 0) {
              categoryProducts = selectedProducts.selectedUnicolor
            } else if (tab.slug === "ofertas") {
              const isOffer = (p: any) => {
                const hasSalePrice = Boolean((p.salePrice && Number(p.salePrice) > 0) || (p.sale_price && Number(p.sale_price) > 0));
                const isBadgeOffer = Boolean(p.badge && /oferta/i.test(p.badge));
                const isCategoryOffer = Boolean(p.categorySlugs?.some((cat: string) => /oferta/i.test(cat)));
                return hasSalePrice || isBadgeOffer || isCategoryOffer;
              }
              const fetchedOffers = (selectedProducts as any).selectedOfertas || [];
              const filterOffers = products.filter(isOffer);
              
              const mergedMap = new Map();
              [...fetchedOffers, ...filterOffers].forEach(p => {
                if (p.id && !mergedMap.has(p.id)) {
                  mergedMap.set(p.id, p);
                }
              });
              categoryProducts = Array.from(mergedMap.values());
            } else {
              categoryProducts = products.filter((product) =>
                product.categories?.some((cat: any) =>
                  cat.slug === tab.slug ||
                  cat.slug.includes(tab.slug) ||
                  (tab.slug === "sublimados" && cat.slug.includes("sublimado")) ||
                  (tab.slug === "unicolor" && cat.slug.includes("unicolor"))
                )
              )
            }

            return (
              <TabsContent key={tab.slug} value={tab.slug} className="mt-6">
                {/* PRODUCTS CAROUSEL */}
                <div className="relative px-4 md:px-12">
                  {categoryProducts.length > 0 ? (
                    <>
                      {/* MOBILE 2x2 CAROUSEL */}
                      <div className="md:hidden w-full relative">
                        <Carousel
                          opts={{ align: "start", loop: false }}
                          className="w-full"
                        >
                          <CarouselContent className="-ml-4">
                            {Array.from({ length: Math.ceil(categoryProducts.length / 4) }).map((_, chunkIndex) => {
                              const chunk = categoryProducts.slice(chunkIndex * 4, chunkIndex * 4 + 4)
                              return (
                                <CarouselItem key={chunkIndex} className="pl-4 basis-full">
                                  <div className="grid grid-cols-2 gap-4">
                                    {chunk.map((product, index) => (
                                      <div key={product.id} className="w-full">
                                        <ProductCard
                                          id={product.id}
                                          slug={product.slug}
                                          name={product.name}
                                          price={product.price}
                                          regularPrice={product.regularPrice}
                                          salePrice={product.salePrice}
                                          image={product.image}
                                          imageAlt={product.imageAlt}
                                          priority={chunkIndex === 0 && index < 4}
                                          sizes="(max-width: 768px) 50vw"
                                          is_in_stock={product.is_in_stock}
                                          pricePerKilo={product.pricePerKilo}
                                          badge={product.badge}
                                          categorySlugs={product.categorySlugs}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </CarouselItem>
                              )
                            })}
                          </CarouselContent>
                          <div className="flex justify-center gap-6 mt-10 pb-0">
                            <CarouselPrevious className="static transform-none h-10 w-10 border-primary bg-background hover:bg-muted shadow-sm flex items-center justify-center" />
                            <CarouselNext className="static transform-none h-10 w-10 border-primary bg-background hover:bg-muted shadow-sm flex items-center justify-center" />
                          </div>
                        </Carousel>
                      </div>

                      {/* DESKTOP CAROUSEL */}
                      <Carousel
                        opts={{
                          align: "start",
                          loop: false,
                        }}
                        className="hidden md:block w-full"
                      >
                        <CarouselContent className="-ml-4">
                          {categoryProducts.slice(0, 12).map((product, index) => (
                            <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                              <ProductCard
                                id={product.id}
                                slug={product.slug}
                                name={product.name}
                                price={product.price}
                                regularPrice={product.regularPrice}
                                salePrice={product.salePrice}
                                image={product.image}
                                imageAlt={product.imageAlt}
                                priority={index < 6}
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                is_in_stock={product.is_in_stock}
                                pricePerKilo={product.pricePerKilo}
                                badge={product.badge}
                                categorySlugs={product.categorySlugs}
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-0 md:-left-12" />
                        <CarouselNext className="right-0 md:-right-12" />
                      </Carousel>
                    </>
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

        <div className="text-center mt-6">
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
