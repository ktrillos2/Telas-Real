"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductDetailTabs } from "@/components/product-detail-tabs"
import { ProductCard } from "@/components/product-card"
import { DesignSelector } from "@/components/design-selector"
import Image from "next/image"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { useCart } from "@/lib/contexts/CartContext"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export default function ProductoPage() {
  const params = useParams()
  // Ensure we decode the slug in case it comes encoded
  const productId = decodeURIComponent(params.slug as string)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // State for selected design
  const [selectedDesign, setSelectedDesign] = useState<{
    category: string;
    design: string;
    isCustom: boolean
  } | null>(null)

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  // Fetch Product
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      console.log("Fetching product with slug:", productId)
      try {
        // Search by slug OR by _id to handle legacy links or ID-based navigation
        const data = await client.fetch(groq`
                *[_type == "product" && (slug.current == $slug || _id == $slug)][0] {
                    _id,
                    name,
                    "slug": slug.current,
                    price,
                    sale_price,
                    "image": images[0].asset->url,
                    "images": images[]{ "src": asset->url, "id": _key },
                    "categories": categories[]->{ "id": _id, name, "slug": slug.current },
                    "attributes": attributes[]{ name, "terms": [{ "name": value }] },
                    stock_status,
                    short_description,
                    description,
                    weight,
                    tags
                }
            `, { slug: productId })

        console.log("Fetch result:", data ? "Found" : "Not Found")

        if (!data) {
          setError("Producto no encontrado")
        } else {
          const mapped = {
            id: data._id,
            name: data.name,
            slug: data.slug,
            price: data.price,
            regular_price: data.price,
            sale_price: data.sale_price,
            image: data.image || "/placeholder.svg",
            images: data.images || [],
            categories: data.categories || [],
            attributes: data.attributes || [],
            is_in_stock: data.stock_status === 'instock',
            short_description: data.short_description || "",
            description: data.description || "", // Portable Text requires processing usually, but if schema has it as array ok. 
            // Note: Schema definition for product description was array of blocks. 
            // Current frontend renders HTML. We need backend mapping or frontend update.
            // For now, let's map it assuming we might have simple structure or need portable text component.
            weight: data.weight,
            tags: []
          }
          setProduct(mapped)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  // Fetch Featured
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await client.fetch(groq`
                *[_type == "product"][0...7] {
                    _id,
                    name,
                    "slug": slug.current,
                    price,
                    sale_price,
                    "image": images[0].asset->url,
                    "images": images[]{ "src": asset->url, "id": _key },
                    stock_status
                }
             `)

        const mapped = data.map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          regular_price: p.price,
          sale_price: p.sale_price,
          image: p.image || "/placeholder.svg",
          is_in_stock: p.stock_status === 'instock'
        }))
        setFeaturedProducts(mapped)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingFeatured(false)
      }
    }
    fetchFeatured()
  }, [])

  const { addItem } = useCart()

  const whatsappNumber = "573014453123"

  // Función para detectar si es producto de sublimado
  const isSublimadoProduct = () => {
    if (!product) return false
    const hasSublimadoCategory = product.categories?.some(cat =>
      cat.slug.includes('sublimado') || cat.name.toLowerCase().includes('sublimado')
    )
    return hasSublimadoCategory || product.name.toLowerCase().includes('sublimado')
  }

  // Handler para cuando se selecciona un diseño
  const handleDesignSelect = (category: string, design: string, isCustom: boolean) => {
    setSelectedDesign({ category, design, isCustom })
  }

  const getWhatsappMessage = () => {
    if (!product) return ""

    let message = `Hola, me gustaría información sobre:\n` +
      `Producto: ${product.name}\n` +
      `Cantidad: ${quantity} metros\n` +
      `Precio: $${product.price.toLocaleString()}`

    // Agregar información del diseño si existe
    if (selectedDesign) {
      message += `\nDiseño: ${selectedDesign.category}\nURL: ${selectedDesign.isCustom ? 'Diseño Personalizado' : selectedDesign.design}`
    }

    return encodeURIComponent(message)
  }

  const handleAddToCart = () => {
    if (!product) return

    // Validar que se haya seleccionado un diseño si es producto sublimado
    if (isSublimadoProduct() && !selectedDesign) {
      toast.custom((t: any) => (
        <div className="flex items-center gap-3 w-full bg-white dark:bg-zinc-900 border border-border p-4 rounded-xl shadow-lg animate-fade-in border-l-4 border-l-yellow-500">
          <div className="h-12 w-12 flex-shrink-0">
            <DotLottieReact
              src="https://lottie.host/ac6ad0c5-8b24-465a-b623-12ec409c2759/z2FvT0JUzy.lottie"
              loop={false}
              autoplay
            />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Atención</span>
            <span className="text-xs text-muted-foreground">
              Por favor selecciona un diseño antes de agregar al carrito
            </span>
          </div>
        </div>
      ), { duration: 4000, position: "top-right" })
      return
    }

    // Extract filename for reference if not custom
    let designName = ""
    if (selectedDesign) {
      if (selectedDesign.isCustom) {
        designName = "Diseño Personalizado"
      } else {
        // Extract filename from URL
        const parts = selectedDesign.design.split('/')
        designName = parts[parts.length - 1]
      }
    }

    addItem({
      id: product.id,
      name: selectedDesign ? `${product.name} - ${selectedDesign.category}` : product.name,
      price: product.sale_price > 0 && product.sale_price < product.regular_price
        ? product.sale_price
        : product.price,
      image: selectedDesign?.design || product.images[0]?.src || product.image,
      slug: product.slug,
      designName: designName,
      designUrl: selectedDesign?.design,
      isCustom: selectedDesign?.isCustom
    }, quantity)

    // Success Notification
    toast.custom((t: any) => (
      <div className="flex items-center gap-3 w-full bg-white dark:bg-zinc-900 border border-border p-4 rounded-xl shadow-lg animate-fade-in border-l-4 border-l-green-500">
        <div className="h-12 w-12 flex-shrink-0">
          <DotLottieReact
            src="https://lottie.host/6fc7326d-9734-4397-8646-d7fb4a5bd93e/PMmGKqvoEs.lottie"
            loop={false}
            autoplay
          />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm">¡Producto añadido!</span>
          <span className="text-xs text-muted-foreground">
            {product.name} se añadió al carrito
          </span>
        </div>
      </div>
    ), { duration: 3000, position: "top-right" })

    // Resetear cantidad a 1
    setQuantity(1)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <main className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Cargando producto...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen">
        <main className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg font-light text-muted-foreground mb-4">
              {error || "Producto no encontrado"}
            </p>
            <Link href="/tienda">
              <Button>Volver a la tienda</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Determine main image to show
  // If a design is selected, show that. Otherwise show product image.
  const mainImageSrc = selectedDesign?.design || product.images[selectedImageIndex]?.src || product.image

  return (
    <div className="min-h-screen">
      <main className="py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-8 text-sm font-light">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Inicio
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <Link href="/tienda" className="text-muted-foreground hover:text-foreground">
              Tienda
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>{product.name}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="flex gap-4 h-fit">
              {/* Thumbnail gallery - Left side */}
              {product.images.length > 1 && (
                <div className="flex flex-col gap-4 w-20">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        setSelectedImageIndex(index)
                        setSelectedDesign(null)
                      }}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 ${selectedImageIndex === index && !selectedDesign
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground"
                        }`}
                    >
                      <Image
                        src={image.thumbnail || image.src}
                        alt={`${product.name} - Vista ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image - Right side */}
              <div className="flex-1 relative w-full max-w-[600px] aspect-square overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={mainImageSrc}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Product Info */}
            < div >
              <h1 className="text-4xl font-light mb-4">{product.name}</h1>

              {/* Categories */}
              {
                product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/tienda?categoria=${category.slug}`}
                        className="text-xs px-3 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )
              }

              {/* Price */}
              <div className="mb-6">
                {product.sale_price > 0 && product.sale_price < product.regular_price ? (
                  <div>
                    <p className="text-3xl font-light text-primary">
                      ${product.sale_price.toLocaleString("es-CO")}
                      <span className="text-sm text-muted-foreground"> /metro</span>
                    </p>
                    <p className="text-lg font-light text-muted-foreground line-through">
                      ${product.regular_price.toLocaleString("es-CO")}
                    </p>
                  </div>
                ) : (
                  <p className="text-3xl font-light">
                    ${product.price.toLocaleString("es-CO")}
                    <span className="text-sm text-muted-foreground"> /metro</span>
                  </p>
                )}
              </div>

              {/* Stock status */}
              <div className="mb-6">
                {product.is_in_stock ? (
                  <p className="text-sm text-green-600">✓ Disponible</p>
                ) : (
                  <p className="text-sm text-red-600">Agotado</p>
                )}
              </div>

              {/* Short description */}
              {
                product.short_description && (
                  <div
                    className="text-sm font-light text-muted-foreground mb-6"
                    dangerouslySetInnerHTML={{ __html: product.short_description }}
                  />
                )
              }

              <div className="space-y-6">
                {/* Quantity */}
                <div>
                  <Label htmlFor="quantity" className="text-base font-normal mb-2 block">
                    Cantidad (metros)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-12 w-12"
                      disabled={!product.is_in_stock}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      className="w-24 text-center h-12"
                      disabled={!product.is_in_stock}
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-12 w-12"
                      disabled={!product.is_in_stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total: ${(product.price * quantity).toLocaleString("es-CO")}
                  </p>
                </div>

                {/* Selector de Diseño - Solo para productos sublimados */}
                {isSublimadoProduct() && (
                  <DesignSelector onDesignSelect={handleDesignSelect} />
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {process.env.NEXT_PUBLIC_ENABLE_PURCHASES === 'false' ? (
                    <Button
                      size="lg"
                      className="w-full h-14 text-base gap-2"
                      disabled={true}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Compras Deshabilitadas
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full h-14 text-base gap-2"
                      disabled={!product.is_in_stock}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Añadir al Carrito
                    </Button>
                  )}

                  <Link
                    href={`https://wa.me/${whatsappNumber}?text=${getWhatsappMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-14 text-base bg-transparent"
                    >
                      Solicitar Cotización por WhatsApp
                    </Button>
                  </Link>
                </div>

                {/* Product Attributes */}
                {product.attributes.length > 0 && (
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-normal mb-4">Detalles del Producto</h3>
                    <div className="space-y-3 text-sm font-light">
                      {product.attributes.map((attr) => (
                        <div key={attr.id} className="flex justify-between border-b border-border pb-2">
                          <span className="text-muted-foreground">{attr.name}:</span>
                          <span className="font-normal">
                            {attr.terms.map(term => term.name).join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div >
          </div >

          {/* Product Tabs (Description, Additional Info, etc.) */}
          {
            product.description && (
              <div className="mt-16">
                <ProductDetailTabs
                  description={product.description}
                  attributes={product.attributes}
                  weight={product.weight}
                  dimensions={product.dimensions}
                />
              </div>
            )
          }

          {/* Featured Products Section */}
          <div className="mt-20 border-t border-border pt-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light mb-4">Productos Destacados</h2>
              <p className="text-lg font-light text-muted-foreground max-w-2xl mx-auto">
                Descubre otros productos populares de nuestra colección
              </p>
            </div>

            {loadingFeatured ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                {featuredProducts
                  .filter(p => p.id !== product.id)
                  .slice(0, 6)
                  .map((featuredProduct, index) => (
                    <ProductCard
                      key={featuredProduct.id}
                      id={featuredProduct.id}
                      name={featuredProduct.name}
                      price={featuredProduct.price}
                      regularPrice={featuredProduct.regular_price}
                      salePrice={featuredProduct.sale_price}
                      image={featuredProduct.image}
                      priority={index < 3}
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      is_in_stock={featuredProduct.is_in_stock}
                    />
                  ))}
              </div>
            )}

            <div className="text-center mt-10">
              <Link href="/tienda">
                <Button size="lg" variant="outline" className="font-light bg-transparent">
                  Ver Todos los Productos
                </Button>
              </Link>
            </div>
          </div>
        </div >
      </main >
    </div >
  )
}
