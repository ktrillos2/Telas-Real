"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductDetailTabs } from "@/components/product-detail-tabs"
import { ProductCard } from "@/components/product-card"
import { DesignSelector } from "@/components/design-selector"
import Image from "next/image"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/lib/contexts/CartContext"
import { toast } from "sonner"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { InlineCalculator } from "@/components/inline-calculator"
import * as fpixel from "@/lib/fpixel"
import * as gtag from "@/lib/gtag"

interface ProductProps {
    product: any
    featuredProducts: any[]
}

export default function ClientProductView({ product, featuredProducts }: ProductProps) {
    const [quantity, setQuantity] = useState(1)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)

    useEffect(() => {
        if (product && product.id) {
            fpixel.event('ViewContent', {
                content_ids: [product.id],
                content_name: product.name,
                content_type: 'product',
                value: product.sale_price || product.regular_price || 0,
                currency: 'COP'
            })
            gtag.event('view_item', {
                currency: 'COP',
                value: product.sale_price || product.regular_price || 0,
                items: [{
                    item_id: product.id.toString(),
                    item_name: product.name,
                    price: product.sale_price || product.regular_price || 0
                }]
            })
        }
    }, [product])

    // State for selected design
    const [selectedDesign, setSelectedDesign] = useState<{
        category: string;
        design: string;
        isCustom: boolean
    } | null>(null)

    const { addItem } = useCart()
    const whatsappNumber = "573014453123"

    // Función para detectar si es producto de sublimado
    const isSublimadoProduct = () => {
        if (!product) return false
        if (product.designSelectionEnabled) return true

        const hasSublimadoCategory = product.categories?.some((cat: any) =>
            (cat.slug && cat.slug.includes('sublimado')) || (cat.name && cat.name.toLowerCase().includes('sublimado'))
        )
        return hasSublimadoCategory || (product.name && product.name.toLowerCase().includes('sublimado'))
    }

    // Handler para cuando se selecciona un diseño
    const handleDesignSelect = (category: string, design: string, isCustom: boolean) => {
        setSelectedDesign({ category, design, isCustom })
    }

    const getWhatsappMessage = () => {
        if (!product) return ""

        const price = product.sale_price || product.price || 0
        const unit = "metros"

        let message = `Hola, me gustaría información sobre:\n` +
            `Producto: ${product.name}\n` +
            `Cantidad: ${quantity} ${unit}\n` +
            `Precio: $${price.toLocaleString()}`

        if (product.pricePerKilo) {
            message += `\n(Precio por Kilo)`
        }

        if (selectedDesign) {
            message += `\nDiseño: ${selectedDesign.category}\nURL: ${selectedDesign.isCustom ? 'Diseño Personalizado' : selectedDesign.design}`
        }

        return encodeURIComponent(message)
    }

    const handleAddToCart = () => {
        if (!product) return

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

        // Validación de cantidad mínima para diseños personalizados
        if (selectedDesign?.isCustom && quantity < 10) {
            toast.custom((t: any) => (
                <div className="flex items-center gap-3 w-full bg-white dark:bg-zinc-900 border border-border p-4 rounded-xl shadow-lg animate-fade-in border-l-4 border-l-red-500">
                    <div className="h-12 w-12 flex-shrink-0">
                        <DotLottieReact
                            src="https://lottie.host/9e419811-9656-4299-b1d5-c967d287310d/lRB2z0i9Oq.lottie"
                            loop={false}
                            autoplay
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">Cantidad Insuficiente</span>
                        <span className="text-xs text-muted-foreground">
                            Para diseños personalizados, la cantidad mínima es de 10 metros.
                        </span>
                    </div>
                </div>
            ), { duration: 4000, position: "top-right" })
            return
        }

        let designName = ""
        if (selectedDesign) {
            if (selectedDesign.isCustom) {
                designName = "Diseño Personalizado"
            } else {
                const parts = selectedDesign.design.split('/')
                designName = parts[parts.length - 1]
            }
        }

        addItem({
            id: product.id,
            name: selectedDesign ? `${product.name} - ${selectedDesign.category}` : product.name,
            price: product.sale_price || product.price,
            image: selectedDesign?.design || product.images[0]?.src || product.image || "/placeholder.svg",
            slug: product.slug,
            designName: designName,
            designUrl: selectedDesign?.design,
            isCustom: selectedDesign?.isCustom
        }, quantity)

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

        setQuantity(1)
    }

    const mainImageSrc = selectedDesign?.design ||
        (product.images && product.images[selectedImageIndex]?.src) ||
        (product.image) ||
        "/placeholder.svg";

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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Product Images */}
                        <div className="flex flex-col lg:flex-row gap-4 h-fit lg:sticky" style={{ top: '8.5rem' }}>
                            {product.images && product.images.length > 1 && (
                                <div className="hidden lg:flex flex-col gap-4 w-20 flex-shrink-0">
                                    {product.images.map((image: any, index: number) => (
                                        <button
                                            key={image.id || index}
                                            onClick={() => {
                                                setSelectedImageIndex(index)
                                                setSelectedDesign(null)
                                            }}
                                            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 w-20 ${selectedImageIndex === index && !selectedDesign
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-border hover:border-muted-foreground"
                                                }`}
                                        >
                                            <Image
                                                src={image.thumbnail || image.src || "/placeholder.svg"}
                                                alt={image.alt || `${product.name || "Producto"} - Vista ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Mobile thumbnails (horizontal) */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-2 mb-4 lg:hidden w-full order-2 lg:order-none">
                                    {product.images.map((image: any, index: number) => (
                                        <button
                                            key={image.id || index}
                                            onClick={() => {
                                                setSelectedImageIndex(index)
                                                setSelectedDesign(null)
                                            }}
                                            className={`relative h-20 w-20 aspect-square overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 ${selectedImageIndex === index && !selectedDesign
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-border hover:border-muted-foreground"
                                                }`}
                                        >
                                            <Image
                                                src={image.thumbnail || image.src || "/placeholder.svg"}
                                                alt={image.alt || `${product.name || "Producto"} - Vista ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex-1 relative w-full h-auto aspect-square overflow-hidden rounded-2xl bg-muted order-1 lg:order-none">
                                <Image
                                    src={mainImageSrc}
                                    alt={
                                        selectedDesign
                                            ? `${product.name} - ${selectedDesign.category}`
                                            : (product.images && product.images[selectedImageIndex]?.alt)
                                                ? product.images[selectedImageIndex].alt
                                                : (product.name || "Producto")
                                    }
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                            </div>
                        </div>

                        {/* Product Info */}
                        <div>
                            <h1 className="text-4xl font-light mb-4">{product.name}</h1>

                            {product.categories && product.categories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {product.categories.map((category: any) => (
                                        <Link
                                            key={category.id}
                                            href={`/tienda?categoria=${category.slug}`}
                                            className="text-xs px-3 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div className="mb-6">
                                {product.sale_price > 0 && product.sale_price < product.regular_price ? (
                                    <div>
                                        <p className="text-4xl font-normal md:text-3xl md:font-light text-primary">
                                            ${product.sale_price.toLocaleString("es-CO")}
                                            <span className="text-base md:text-sm text-muted-foreground font-light"> /metro</span>
                                        </p>
                                        <p className="text-xl md:text-lg font-light text-muted-foreground line-through">
                                            ${product.regular_price.toLocaleString("es-CO")}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-4xl font-normal md:text-3xl md:font-light text-primary">
                                            ${(product.price || 0).toLocaleString("es-CO")}
                                            <span className="text-base md:text-sm text-muted-foreground font-light"> /metro</span>
                                        </p>

                                        {product.pricePerKilo && (
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                <p>• Facturación en kilo</p>
                                                <p>• Rendimiento: {
                                                    product.attributes?.find((a: any) => a.name.toLowerCase().includes('rendimiento'))?.value ||
                                                    ((product.pricePerKilo && (product.price || product.regular_price))
                                                        ? `${(product.pricePerKilo / (product.price || product.regular_price)).toFixed(1).replace('.', ',')} m / kilo`
                                                        : '')
                                                }</p>
                                                <p>• Precio por kilo: ${product.pricePerKilo.toLocaleString("es-CO")}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                {product.is_in_stock ? (
                                    <p className="text-sm text-green-600">
                                        ✓ Disponible {product.stock_quantity > 0 && `(${product.stock_quantity} en stock)`}
                                    </p>
                                ) : (
                                    <p className="text-sm text-red-600">Agotado</p>
                                )}
                            </div>

                            {/* Usages (Usos) */}
                            {product.usages && product.usages.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold mb-2">Ideal para:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.usages.map((usage: any) => (
                                            <span key={usage.slug || usage.title} className="text-xs px-2 py-1 border border-border rounded-md">
                                                {usage.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tones (Tonos) */}
                            {product.tones && product.tones.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold mb-2">Tonos disponibles:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tones.map((tone: any) => (
                                            <span key={tone.slug || tone.title} className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded-md">
                                                {tone.value && <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: tone.value }}></span>}
                                                {tone.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.short_description && (
                                <div
                                    className="text-sm font-light text-muted-foreground mb-6"
                                    dangerouslySetInnerHTML={{ __html: product.short_description }}
                                />
                            )}

                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="quantity" className="text-base font-normal mb-2 block">
                                        Metros:
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
                                    <p className="text-3xl font-bold mt-4 mb-2 text-black">
                                        Total: ${((product.sale_price || product.price || 0) * quantity).toLocaleString("es-CO")}
                                    </p>
                                    {product.pricePerKilo > 0 && (
                                        <InlineCalculator 
                                            pricePerKilo={product.pricePerKilo}
                                            pricePerMeter={product.sale_price || product.price || product.regular_price || 0}
                                        />
                                    )}
                                </div>

                                {isSublimadoProduct() && (
                                    <DesignSelector
                                        onDesignSelect={handleDesignSelect}
                                        category={product.designCategory}
                                    />
                                )}

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

                                {/* Product Attributes (Detailed) */}
                                {product.attributes && product.attributes.length > 0 && (
                                    <div className="border-t border-border pt-6">
                                        <h3 className="text-lg font-normal mb-4">Detalles del Producto</h3>
                                        <div className="space-y-3 text-sm font-light">
                                            {product.attributes.map((attr: any, idx: number) => (
                                                attr.visible && (
                                                    <div key={idx} className="flex justify-between border-b border-border pb-2">
                                                        <span className="text-muted-foreground">{attr.name}:</span>
                                                        <span className="font-normal">
                                                            {attr.value}
                                                        </span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {product.description && (
                        <div className="mt-16">
                            <ProductDetailTabs
                                description={product.description}
                                attributes={product.attributes}
                                weight={product.weight}
                                dimensions={product.dimensions}
                            />
                        </div>
                    )}

                    {/* Featured Products */}
                    <div className="mt-20 border-t border-border pt-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-light mb-4">Productos Destacados</h2>
                            <p className="text-lg font-light text-muted-foreground max-w-2xl mx-auto">
                                Descubre otros productos populares de nuestra colección
                            </p>
                        </div>

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
                                        imageAlt={featuredProduct.imageAlt}
                                        slug={featuredProduct.slug}
                                        priority={index < 3}
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                        is_in_stock={featuredProduct.is_in_stock}
                                        pricePerKilo={featuredProduct.pricePerKilo}
                                    />
                                ))}
                        </div>

                        <div className="text-center mt-10">
                            <Link href="/tienda">
                                <Button size="lg" variant="outline" className="font-light bg-transparent">
                                    Ver Todos los Productos
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
