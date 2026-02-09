import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import Link from "next/link"

export function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await client.fetch(groq`
          *[_type == "product" && stock_status == "instock"] | order(_createdAt desc) [0...8] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            sale_price,
            "image": images[0].asset->url,
            stock_status
          }
        `)

        const mapped = data.map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          pricePerKilo: p.pricePerKilo,
          regular_price: p.price,
          sale_price: p.sale_price,
          image: p.image || "/placeholder.svg",
          is_in_stock: p.stock_status === 'instock'
        }))
        setProducts(mapped)
      } catch (error) {
        console.error("Failed to fetch featured products", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">Productos Destacados</h2>
            <p className="text-lg font-light text-muted-foreground">
              Descubre nuestra selección de telas más populares
            </p>
          </div>
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-4">Productos Destacados</h2>
          <p className="text-lg font-light text-muted-foreground">
            Descubre nuestra selección de telas más populares
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {products.slice(0, 8).map((product, index) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              regularPrice={product.regular_price}
              salePrice={product.sale_price}
              image={product.image}
              priority={index < 4}
              is_in_stock={product.is_in_stock}
              pricePerKilo={product.pricePerKilo}
            />
          ))}
        </div>

        <div className="text-center">
          <Link href="/tienda">
            <Button size="lg" className="font-light">
              Ver Todos los Productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
