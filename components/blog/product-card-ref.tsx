import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { ArrowRight, ShoppingBag, Eye } from 'lucide-react'

interface ProductProps {
    title: string
    slug: { current: string }
    price: number
    salePrice?: number
    compareAtPrice?: number
    mainImage: any
}

interface ProductCardRefProps {
    value: ProductProps
    variant?: 'default' | 'compact'
}

export function ProductCardRef({ value, variant = 'default' }: ProductCardRefProps) {
    if (!value?.title || !value?.slug?.current) return null

    const imageUrl = value.mainImage ? urlFor(value.mainImage).url() : '/placeholder.svg'
    const displayPrice = value.salePrice || value.price || 0

    if (variant === 'compact') {
        return (
            <div className="h-full flex flex-col bg-background rounded-2xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <Link href={`/producto/${value.slug.current}`} className="flex flex-col h-full group/product">
                    <div className="relative w-full aspect-square bg-muted flex-shrink-0 overflow-hidden">
                        <Image
                            src={imageUrl}
                            alt={value.mainImage?.alt || value.title}
                            fill
                            className="object-cover group-hover/product:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                        />
                    </div>
                    
                    <div className="p-4 flex flex-col justify-between flex-grow text-center">
                        <div>
                            <h4 className="text-sm font-medium mb-1 text-balance group-hover/product:text-primary transition-colors line-clamp-2">
                                {value.title}
                            </h4>
                            <div className="flex justify-center items-center gap-2 mb-4">
                                <span className="text-sm font-semibold text-primary">
                                    ${displayPrice?.toLocaleString("es-CO")}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-center gap-1.5 text-xs font-medium text-foreground group-hover/product:text-primary transition-colors bg-muted/30 py-2 rounded-lg">
                            <Eye className="w-3.5 h-3.5" /> Ver producto
                        </div>
                    </div>
                </Link>
            </div>
        )
    }

    return (
        <div className="my-8 mx-auto xl:mr-auto xl:ml-0 w-full max-w-2xl bg-gradient-to-r from-primary/5 via-background to-primary/5 rounded-2xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <Link href={`/producto/${value.slug.current}`} className="flex flex-col sm:flex-row group/product">
                <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-muted flex-shrink-0 overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={value.mainImage?.alt || value.title}
                        fill
                        className="object-cover group-hover/product:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                    />
                </div>
                
                <div className="p-6 md:p-8 flex flex-col justify-center flex-grow">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Producto Destacado
                    </div>
                    
                    <h4 className="text-xl md:text-2xl font-light mb-3 text-balance group-hover/product:text-primary transition-colors">
                        {value.title}
                    </h4>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-xl font-medium text-primary">
                            ${displayPrice?.toLocaleString("es-CO")}
                        </span>
                        {value.compareAtPrice && value.compareAtPrice > displayPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                ${value.compareAtPrice.toLocaleString("es-CO")}
                            </span>
                        )}
                    </div>
                    
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground group-hover/product:gap-3 transition-all duration-300">
                        Ver producto <ArrowRight className="w-4 h-4 text-primary" />
                    </span>
                </div>
            </Link>
        </div>
    )
}
