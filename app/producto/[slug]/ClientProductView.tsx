"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductDetailTabs } from "@/components/product-detail-tabs"
import { ProductCard } from "@/components/product-card"
import { DesignSelector } from "@/components/design-selector"
import { EventTagBadge } from "@/components/event-tag-badge"
import Image from "next/image"
import { Minus, Plus, ShoppingCart, CreditCard, Info, Search, Truck, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/contexts/CartContext"
import { useHomeDataContext } from "@/lib/contexts/HomeDataContext"
import { toast } from "sonner"
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { InlineCalculator } from "@/components/inline-calculator"
import { ShippingDispatchNotice } from "@/components/shipping-dispatch-notice"
import { isUnitProduct } from "@/lib/utils"
import { getWhatsAppUrl } from "@/lib/utils/whatsapp"
import * as fpixel from "@/lib/fpixel"
import * as gtag from "@/lib/gtag"

interface ProductProps {
    product: any
    featuredProducts: any[]
}

export default function ClientProductView({ product, featuredProducts }: ProductProps) {
    const isDemoProduct = Boolean(product?.isDemo || product?.id === 'satin-colores-prueba' || product?.slug === 'satin-colores-prueba' || product?.isPurchasable === false);
    const [quantity, setQuantity] = useState(1)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const router = useRouter()

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
        isCustom: boolean;
        name?: string;
    } | null>(null)

    // State for color variant search & family filter
    const [colorSearch, setColorSearch] = useState("")
    const [selectedToneFilter, setSelectedToneFilter] = useState("Todos")

    // Filter only in-stock color variants (hide all out of stock variations)
    const inStockColorVariants = useMemo(() => {
        if (!product.colorVariants || product.colorVariants.length === 0) return []
        return product.colorVariants.filter((v: any) => 
            v.stockStatus !== 'outOfStock' && 
            v.stockStatus !== 'outofstock' &&
            v.stock_status !== 'outOfStock' &&
            v.stock_status !== 'outofstock'
        )
    }, [product.colorVariants])

    // State for selected color variant (for grouped fabrics like Brush or Satin)
    const initialVariant = useMemo(() => {
        const variants = inStockColorVariants.length > 0 ? inStockColorVariants : (product.colorVariants || [])
        if (variants.length === 0) return null
        if (product.selectedColorSlug) {
            const found = variants.find(
                (v: any) => v.slug === product.selectedColorSlug || v.id === product.selectedColorSlug || v.name?.toLowerCase() === product.selectedColorSlug.toLowerCase()
            )
            if (found) return found
        }
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const colorParam = params.get('color')
            if (colorParam) {
                const found = variants.find(
                    (v: any) => v.slug === colorParam || v.id === colorParam || v.name?.toLowerCase() === colorParam.toLowerCase()
                )
                if (found) return found
            }
        }
        return variants.find((v: any) => v.stockStatus === 'inStock') || variants[0]
    }, [product, inStockColorVariants])

    const [selectedColorVariant, setSelectedColorVariant] = useState<any>(initialVariant)

    useEffect(() => {
        if (initialVariant) {
            setSelectedColorVariant(initialVariant)
        }
    }, [initialVariant])

    const handleSelectVariant = (variant: any) => {
        setSelectedColorVariant(variant)
        setSelectedImageIndex(0)
        setSelectedDesign(null)
        if (typeof window !== 'undefined' && variant?.slug) {
            const url = new URL(window.location.href)
            url.searchParams.set('color', variant.slug)
            window.history.replaceState({}, '', url.toString())
            if (variant.name) {
                document.title = `Tela Brush ${variant.name} X Metros | Piel de Durazno - Telas Real Colombia`
            }
        }
    }

    const availableToneFamilies = useMemo(() => {
        const variants = inStockColorVariants.length > 0 ? inStockColorVariants : (product.colorVariants || [])
        if (variants.length === 0) return ["Todos"]
        const tones = new Set<string>()
        variants.forEach((v: any) => {
            if (v.toneTitle) tones.add(v.toneTitle)
        })
        return ["Todos", ...Array.from(tones)]
    }, [inStockColorVariants, product.colorVariants])

    const filteredColorVariants = useMemo(() => {
        const variants = inStockColorVariants.length > 0 ? inStockColorVariants : (product.colorVariants || [])
        if (variants.length === 0) return []
        return variants.filter((v: any) => {
            const matchesSearch = !colorSearch.trim() || 
                v.name.toLowerCase().includes(colorSearch.toLowerCase()) ||
                (v.fullName && v.fullName.toLowerCase().includes(colorSearch.toLowerCase()))
            const matchesTone = selectedToneFilter === "Todos" || v.toneTitle === selectedToneFilter
            return matchesSearch && matchesTone
        })
    }, [inStockColorVariants, product.colorVariants, colorSearch, selectedToneFilter])

    const activePrice = selectedColorVariant?.price || product.price || 0
    const activeSalePrice = selectedColorVariant?.sale_price || product.sale_price
    const activeRegularPrice = selectedColorVariant?.price || product.regular_price || product.regularPrice || activePrice
    const hasActivePromo = activeSalePrice > 0 && activeSalePrice < activeRegularPrice
    const isCurrentVariantInStock = isDemoProduct
        ? false
        : selectedColorVariant
        ? (selectedColorVariant.stockStatus !== 'outOfStock' && selectedColorVariant.stockStatus !== 'outofstock')
        : product.is_in_stock

    const { addItem } = useCart()
    const { data: homeData } = useHomeDataContext()
    const whatsappNumber = homeData?.whatsappSettings?.whatsappNumber || "573159021516"

    const eventSettings = homeData?.eventSettings
    const isEventActive = () => {
        if (!eventSettings?.isActive) return false;
        const now = new Date();
        const start = eventSettings.startDate ? new Date(eventSettings.startDate) : null;
        const end = eventSettings.endDate ? new Date(eventSettings.endDate) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;

        const hasApplicableCategories = eventSettings.applicableCategories && eventSettings.applicableCategories.length > 0;
        const hasApplicableProducts = eventSettings.applicableProducts && eventSettings.applicableProducts.length > 0;

        if (hasApplicableCategories || hasApplicableProducts) {
            let matchesCategory = false;
            let matchesProduct = false;

            if (hasApplicableCategories) {
                matchesCategory = product.categories?.some((cat: any) => 
                    eventSettings.applicableCategories?.includes(cat.slug)
                ) ?? false;
            }

            if (hasApplicableProducts) {
                matchesProduct = eventSettings.applicableProducts?.includes(product.slug) ?? false;
            }

            if (!matchesCategory && !matchesProduct) return false;
        }

        return true;
    }

    const hasPromo = product.sale_price > 0 && product.sale_price < product.regular_price;
    const applicableDiscount = hasPromo ? eventSettings?.discountPromo : eventSettings?.discountNoPromo;

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
    const handleDesignSelect = (category: string, design: string, isCustom: boolean, fileName?: string) => {
        setSelectedDesign({ category, design, isCustom, name: fileName })
    }

    const isUnit = isUnitProduct(product)

    // Extraer el rendimiento y precio por kilo (priorizando el producto individual, con fallback a su categoría)
    const categoryWithDetails = isUnit ? null : product?.categories?.find((c: any) => c.rendimiento || c.pricePerKilo);
    const rendimientoAttr = isUnit ? undefined : (product?.rendimiento || categoryWithDetails?.rendimiento);
    const pricePerKilo = isUnit ? undefined : (product?.pricePerKilo || categoryWithDetails?.pricePerKilo);

    let yieldValueFromSanity: number | undefined = undefined;
    if (rendimientoAttr) {
        // Asumiendo que el formato puede ser "3,2", "3.2", "3.2 m/kg" o "3.2 m / kilo"
        const numericMatch = String(rendimientoAttr).replace(',', '.').match(/[\d.]+/);
        if (numericMatch) {
            yieldValueFromSanity = parseFloat(numericMatch[0]);
        }
    }

    const getWhatsappMessage = () => {
        if (!product) return ""

        const price = selectedColorVariant?.sale_price || selectedColorVariant?.price || product.sale_price || product.price || 0
        const unit = isUnit ? (quantity === 1 ? "unidad" : "unidades") : "metros"
        const variantText = selectedColorVariant ? `\nColor: ${selectedColorVariant.name}` : ""

        let message = `Hola, me gustaría información sobre:\n` +
            `Producto: ${product.name}${variantText}\n` +
            `Cantidad: ${quantity} ${unit}\n` +
            `Precio: $${price.toLocaleString()}`

        if (pricePerKilo && !isUnit) {
            message += `\n(Precio por Kilo)`
        }

        if (selectedDesign) {
            message += `\nDiseño: ${selectedDesign.category}\nURL: ${selectedDesign.isCustom ? 'Diseño Personalizado' : selectedDesign.design}`
        }

        return encodeURIComponent(message)
    }

    const handleAddToCart = (redirect: boolean = false) => {
        if (!product) return

        if (isDemoProduct || !product.is_in_stock) {
            toast.error("Este producto es una muestra de demostración y no se encuentra disponible para la compra.")
            return
        }

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
                designName = selectedDesign.name || "Diseño Personalizado"
            } else {
                const parts = selectedDesign.design.split('/')
                designName = selectedDesign.name || parts[parts.length - 1]
            }
        }

        const finalName = selectedDesign
            ? `${product.name} - ${selectedDesign.isCustom ? 'Diseño Personalizado' : selectedDesign.category}`
            : selectedColorVariant
            ? `${product.name} (${selectedColorVariant.name})`
            : product.name

        const finalImage = selectedDesign?.isCustom
            ? (product.images[0]?.src || product.image || "/placeholder.svg")
            : (selectedDesign?.design || selectedColorVariant?.image || product.images[0]?.src || product.image || "/placeholder.svg")

        const finalPrice = selectedColorVariant?.sale_price || selectedColorVariant?.price || product.sale_price || product.price
        const finalRegularPrice = selectedColorVariant?.price || product.regular_price || product.regularPrice || product.price

        addItem({
            id: selectedColorVariant?.id || product.id,
            name: finalName,
            price: finalPrice,
            image: finalImage,
            slug: selectedColorVariant?.slug || product.slug,
            designName: designName,
            designUrl: selectedDesign?.design,
            isCustom: selectedDesign?.isCustom,
            hasPromo: !!((finalPrice && finalRegularPrice && Number(finalPrice) > 0 && Number(finalPrice) < Number(finalRegularPrice))),
            regularPrice: finalRegularPrice,
            categorySlugs: [
                ...(product.categories?.map((c: any) => c.slug?.current || c.slug) || []),
                ...(isUnit ? (/tijera/i.test(product.name || product.slug || '') ? ['tijeras'] : ['hilos']) : [])
            ]
        }, quantity)

        if (redirect) {
            router.push('/checkout')
        } else {
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
                            {finalName} se añadió al carrito
                        </span>
                    </div>
                </div>
            ), { duration: 3000, position: "top-right" })

            setQuantity(1)
        }
    }

    const activeImages = (selectedColorVariant?.images && selectedColorVariant.images.length > 0)
        ? selectedColorVariant.images
        : (product.images || [])

    const mainImageSrc = selectedDesign?.isCustom ?
        ((activeImages && activeImages[selectedImageIndex]?.src) || (product.image) || "/placeholder.svg")
        : (selectedDesign?.design ||
        (activeImages && activeImages[selectedImageIndex]?.src) ||
        (selectedColorVariant?.image) ||
        (product.image) ||
        "/placeholder.svg");

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
                            {activeImages && activeImages.length > 1 && (
                                <div className="hidden lg:flex flex-col gap-4 w-20 flex-shrink-0">
                                    {activeImages.map((image: any, index: number) => (
                                        <button
                                            key={image.id || index}
                                            onClick={() => {
                                                setSelectedImageIndex(index)
                                                setSelectedDesign(null)
                                            }}
                                            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 w-20 cursor-pointer ${selectedImageIndex === index && !selectedDesign
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
                            {activeImages && activeImages.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-2 mb-4 lg:hidden w-full order-2 lg:order-none">
                                    {activeImages.map((image: any, index: number) => (
                                        <button
                                            key={image.id || index}
                                            onClick={() => {
                                                setSelectedImageIndex(index)
                                                setSelectedDesign(null)
                                            }}
                                            className={`relative h-20 w-20 aspect-square overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 cursor-pointer ${selectedImageIndex === index && !selectedDesign
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
                                    unoptimized={mainImageSrc.startsWith('blob:')}
                                />

                                {/* Badges overlaying the image */}
                                {(() => {
                                    const hasDiscount = !!(product.sale_price && product.regular_price && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.regular_price));
                                    const badges: string[] = [];
                                    if (hasDiscount) badges.push("OFERTA");
                                    if (product.badge) {
                                        const customBadges = product.badge.split(',').map((b: string) => b.trim()).filter((b: string) => b.length > 0);
                                        customBadges.forEach((cb: string) => {
                                            if (!badges.some(b => b.toLowerCase() === cb.toLowerCase())) {
                                                badges.push(cb);
                                            }
                                        });
                                    }

                                    return (
                                        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                                            {badges.map((b, idx) => (
                                                <span key={idx} className="bg-[#E50914] text-white text-[12px] px-4 py-1.5 rounded-full font-bold shadow-md uppercase tracking-wide">
                                                    {b}
                                                </span>
                                            ))}
                                            <EventTagBadge productCategories={product.categories?.map((c: any) => c.slug)} productSlug={product.slug} />
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div>
                            <h1 className="text-4xl font-light mb-4">{product.name}</h1>

                            {product.categories && product.categories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {product.categories.map((category: any) => {
                                        const catSlug = typeof category.slug === 'string' ? category.slug : category.slug?.current;
                                        const targetSlug = /hilo/i.test(catSlug || category.name || '') ? 'hilos' : /tijera/i.test(catSlug || category.name || '') ? 'tijeras' : catSlug;
                                        return (
                                            <Link
                                                key={category.id || category._id || catSlug}
                                                href={`/tienda?categoria=${targetSlug}`}
                                                className="text-xs px-3 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                                            >
                                                {category.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}

                        {/* Badges moved to image overlay */}

                            <div className="mb-6">
                                {hasActivePromo ? (
                                    <div>
                                        <p className="text-4xl font-normal md:text-3xl md:font-light text-primary">
                                            ${activeSalePrice.toLocaleString("es-CO")}
                                            <span className="text-base md:text-sm text-muted-foreground font-light">{isUnit ? ' /unidad' : ' /metro'}</span>
                                        </p>
                                        <p className="text-xl md:text-lg font-light text-muted-foreground line-through">
                                            ${activeRegularPrice.toLocaleString("es-CO")}
                                        </p>
                                        {!isUnit && (pricePerKilo > 0 || rendimientoAttr) && (
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                {pricePerKilo > 0 && <p>• Facturación en kilo</p>}
                                                {rendimientoAttr ? (
                                                    <p>• Rendimiento: {
                                                        String(rendimientoAttr).includes('m') || String(rendimientoAttr).includes('kilo')
                                                            ? rendimientoAttr
                                                            : `${rendimientoAttr} m / kilo aprox.`
                                                    }</p>
                                                ) : (pricePerKilo && activeSalePrice) ? (
                                                    <p>• Rendimiento: {(pricePerKilo / activeSalePrice).toFixed(1).replace('.', ',')} m / kilo aprox.</p>
                                                ) : null}
                                                {pricePerKilo > 0 && <p>• Precio por kilo: ${pricePerKilo.toLocaleString("es-CO")}</p>}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-4xl font-normal md:text-3xl md:font-light text-primary">
                                            ${(activePrice || 0).toLocaleString("es-CO")}
                                            <span className="text-base md:text-sm text-muted-foreground font-light">{isUnit ? ' /unidad' : ' /metro'}</span>
                                        </p>

                                        {!isUnit && (pricePerKilo > 0 || rendimientoAttr) && (
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                {pricePerKilo > 0 && <p>• Facturación en kilo</p>}
                                                {rendimientoAttr ? (
                                                    <p>• Rendimiento: {
                                                        String(rendimientoAttr).includes('m') || String(rendimientoAttr).includes('kilo')
                                                            ? rendimientoAttr
                                                            : `${rendimientoAttr} m / kilo aprox.`
                                                    }</p>
                                                ) : (pricePerKilo && activeRegularPrice) ? (
                                                    <p>• Rendimiento: {(pricePerKilo / activeRegularPrice).toFixed(1).replace('.', ',')} m / kilo aprox.</p>
                                                ) : null}
                                                {pricePerKilo > 0 && <p>• Precio por kilo: ${pricePerKilo.toLocaleString("es-CO")}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isEventActive() && applicableDiscount && applicableDiscount > 0 && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h3 className="text-sm font-bold text-green-800 flex items-center gap-2 mb-1">
                                        <span className="bg-[#E50914] text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{eventSettings?.eventTag || 'OFERTA'}</span>
                                    </h3>
                                    <p className="text-sm text-green-700">
                                        Lleva un descuento adicional de <strong>${applicableDiscount.toLocaleString("es-CO")}</strong> por cada {isUnit ? 'unidad' : 'Kg'} en este producto.
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
                                {isDemoProduct ? (
                                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-900">Muestra de Demostración</p>
                                            <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                                                Esta tela es exclusivamente una muestra de visualización y no se encuentra disponible para la compra al público.
                                            </p>
                                        </div>
                                    </div>
                                ) : isCurrentVariantInStock ? (
                                    <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        ✓ Disponible {selectedColorVariant ? `en color ${selectedColorVariant.name}` : ''} {product.stock_quantity > 0 && `(${product.stock_quantity} en stock)`}
                                    </p>
                                ) : (
                                    <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                                        <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                                        ✕ Agotado temporalmente {selectedColorVariant ? `en color ${selectedColorVariant.name}` : ''}
                                    </p>
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

                            {/* Color Variants Selector (Grouped fabrics) */}
                            {inStockColorVariants.length > 0 && (
                                <div className="mb-6 p-4 md:p-5 bg-muted/30 rounded-2xl border border-border">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                                        <div>
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                                Variación de Color
                                            </Label>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="w-5 h-5 rounded-md overflow-hidden relative border border-black/15 shadow-2xs flex-shrink-0 bg-muted">
                                                    {selectedColorVariant?.thumbnail ? (
                                                        <Image
                                                            src={selectedColorVariant.thumbnail}
                                                            alt={selectedColorVariant.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="20px"
                                                        />
                                                    ) : (
                                                        <span
                                                            className="w-full h-full block"
                                                            style={{ backgroundColor: selectedColorVariant?.toneHex || "#e2e8f0" }}
                                                        />
                                                    )}
                                                </div>
                                                <span className="font-bold text-foreground text-lg">
                                                    {selectedColorVariant?.name || "Selecciona un color"}
                                                </span>
                                                {selectedColorVariant && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                                                        Disponible
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground bg-background px-2.5 py-1 rounded-full border font-medium">
                                                {inStockColorVariants.length} colores disponibles
                                            </span>
                                        </div>
                                    </div>

                                    {/* Search input & Tone family filter */}
                                    <div className="space-y-2.5 mb-3.5">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="Buscar tono (ej: Negro, Lila, Menta, Mostaza)..."
                                                value={colorSearch}
                                                onChange={(e) => setColorSearch(e.target.value)}
                                                className="pl-8 h-9 text-xs bg-background"
                                            />
                                            {colorSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setColorSearch("")}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {/* Tone category pills */}
                                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
                                            {availableToneFamilies.map((family: string) => (
                                                <button
                                                    key={family}
                                                    type="button"
                                                    onClick={() => setSelectedToneFilter(family)}
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                                                        selectedToneFilter === family
                                                            ? "bg-primary text-primary-foreground shadow-xs"
                                                            : "bg-background border hover:bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    {family}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Swatches Grid */}
                                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1 py-1 items-center">
                                        {filteredColorVariants.map((variant: any) => {
                                            const isSelected = selectedColorVariant?.id === variant.id
                                            return (
                                                <button
                                                    key={variant.id}
                                                    type="button"
                                                    onClick={() => handleSelectVariant(variant)}
                                                    className={`group relative flex items-center rounded-full border text-sm font-medium transition-all duration-300 ease-out cursor-pointer overflow-hidden h-10 ${
                                                        isSelected
                                                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs pr-4.5"
                                                            : "border-border/80 bg-background hover:border-primary/50 text-foreground hover:shadow-xs w-10 hover:w-auto hover:pr-4.5"
                                                    }`}
                                                    title={`${variant.name} ($${(variant.price || 0).toLocaleString()})`}
                                                >
                                                    {/* Imagen de la variante: 100% redonda */}
                                                    <div className="relative h-10 w-10 aspect-square rounded-full overflow-hidden flex-shrink-0 bg-muted">
                                                        {variant.thumbnail ? (
                                                            <Image
                                                                src={variant.thumbnail}
                                                                alt={variant.name}
                                                                fill
                                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                                sizes="40px"
                                                            />
                                                        ) : (
                                                            <span
                                                                className="w-full h-full block"
                                                                style={{ backgroundColor: variant.toneHex || "#e2e8f0" }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Nombre con animación side right y tipografía más grande */}
                                                    <div
                                                        className={`overflow-hidden transition-all duration-300 ease-out flex items-center whitespace-nowrap min-w-0 ${
                                                            isSelected
                                                                ? "max-w-[220px] opacity-100 pl-3.5"
                                                                : "max-w-0 opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 group-hover:pl-3.5"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`truncate text-sm font-semibold tracking-normal transition-transform duration-300 ease-out inline-block ${
                                                                isSelected
                                                                    ? "translate-x-0 text-primary"
                                                                    : "-translate-x-2 group-hover:translate-x-0"
                                                            }`}
                                                        >
                                                            {variant.name}
                                                        </span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                        {filteredColorVariants.length === 0 && (
                                            <p className="text-xs text-muted-foreground py-3 text-center w-full">
                                                No se encontraron colores disponibles con ese filtro.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="quantity" className="text-base font-normal mb-2 block">
                                        {isUnit ? "Unidades:" : "Metros:"}
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="h-12 w-12"
                                            disabled={!isCurrentVariantInStock || isDemoProduct}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                                            className="w-24 text-center h-12"
                                            disabled={!isCurrentVariantInStock || isDemoProduct}
                                            min="1"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="h-12 w-12"
                                            disabled={!isCurrentVariantInStock || isDemoProduct}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-4 mb-2">
                                        {hasActivePromo ? (
                                            <div className="flex flex-col">
                                                <p className="text-3xl font-bold text-red-600">
                                                    Total: ${(activeSalePrice * quantity).toLocaleString("es-CO")}
                                                </p>
                                                <p className="text-lg text-muted-foreground line-through">
                                                    Antes: ${(activeRegularPrice * quantity).toLocaleString("es-CO")}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-3xl font-bold text-black">
                                                Total: ${((activePrice || 0) * quantity).toLocaleString("es-CO")}
                                            </p>
                                        )}
                                    </div>
                                    {!isUnit && (pricePerKilo > 0 || yieldValueFromSanity) && (
                                        <InlineCalculator 
                                            pricePerKilo={pricePerKilo || ((activeSalePrice || activePrice) * (yieldValueFromSanity || 1))}
                                            pricePerMeter={activeSalePrice || activePrice}
                                            yieldValue={yieldValueFromSanity}
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
                                    ) : isDemoProduct ? (
                                        <Button
                                            size="lg"
                                            className="w-full h-14 text-base gap-2 bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed font-medium hover:bg-gray-100"
                                            disabled={true}
                                        >
                                            <ShoppingCart className="h-5 w-5 text-gray-400" />
                                            No Apto para Compra (Solo Demostración)
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                                            <Button
                                                size="lg"
                                                className="w-full sm:w-1/2 h-14 text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                                                disabled={!isCurrentVariantInStock}
                                                onClick={() => handleAddToCart(false)}
                                            >
                                                <ShoppingCart className="h-5 w-5" />
                                                {isCurrentVariantInStock ? "Añadir al Carrito" : "Color Agotado"}
                                            </Button>
                                            <Button
                                                size="lg"
                                                className="w-full sm:w-1/2 h-14 text-base gap-2 bg-[#10b981] hover:bg-[#059669] text-white"
                                                disabled={!isCurrentVariantInStock}
                                                onClick={() => handleAddToCart(true)}
                                            >
                                                <CreditCard className="h-5 w-5" />
                                                {isCurrentVariantInStock ? "Comprar Ahora" : "No Disponible"}
                                            </Button>
                                        </div>
                                    )}

                                    <Link
                                        href={getWhatsAppUrl(whatsappNumber, decodeURIComponent(getWhatsappMessage()))}
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

                                    {/* GEO Colombia Delivery Badge */}
                                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-emerald-950">
                                        <Truck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-xs space-y-0.5">
                                            <p className="font-semibold text-emerald-900">
                                                🚚 Envíos a toda Colombia vía Coordinadora
                                            </p>
                                            <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                                                Despachos seguros a Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Pereira y más de 1.100 municipios del país. Cotización de flete exacta al checkout.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping and Dispatch Schedule Notice */}
                                <ShippingDispatchNotice variant="product" className="mt-6 mb-2" />

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
                                        regularPrice={featuredProduct.regularPrice}
                                        salePrice={featuredProduct.salePrice}
                                        image={featuredProduct.image}
                                        imageAlt={featuredProduct.imageAlt}
                                        slug={featuredProduct.slug}
                                        priority={index < 3}
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                        is_in_stock={featuredProduct.is_in_stock}
                                        pricePerKilo={featuredProduct.pricePerKilo}
                                        categorySlugs={featuredProduct.categories?.map((c: any) => c.slug?.current || c.slug) || []}
                                        badge={featuredProduct.badge}
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
