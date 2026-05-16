import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { type NavItem } from "@/components/header"

interface MobileMenuItemProps {
    item: NavItem
    onNavigate: () => void
    usages: any[]
    tones: any[]
    offers: any[]
    sublimatedProducts?: any[]
}

export function MobileMenuItem({ item, onNavigate, usages, tones, offers, sublimatedProducts = [] }: MobileMenuItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    if (!item.hasMegaMenu) {
        return (
            <Link
                href={
                    item.label.toLowerCase() === 'telas' || item.label.toLowerCase() === 'tela' 
                      ? '/tienda' 
                      : item.label.toLowerCase() === 'conócenos' || item.label.toLowerCase() === 'conocenos' || item.label.toLowerCase() === 'quienes somos' || item.label.toLowerCase() === 'quiénes somos'
                      ? '/conocenos'
                      : (item.link || '#')
                }
                onClick={onNavigate}
                className="text-lg font-light hover:text-primary py-3 block border-b border-border/40"
            >
                {item.label}
            </Link>
        )
    }

    return (
        <div className="border-b border-border/40">
            <div className="flex items-center justify-between w-full py-3 text-lg font-light hover:text-primary border-b border-border/40">
                <Link
                    href={
                        item.label.toLowerCase() === 'telas' || item.label.toLowerCase() === 'tela' 
                          ? '/tienda' 
                          : item.label.toLowerCase() === 'conócenos' || item.label.toLowerCase() === 'conocenos' || item.label.toLowerCase() === 'quienes somos' || item.label.toLowerCase() === 'quiénes somos'
                          ? '/conocenos'
                          : (item.link || '#')
                    }
                    onClick={onNavigate}
                    className="flex-1 text-left hover:text-primary text-foreground"
                >
                    {item.label}
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 -mr-2 text-foreground/70 hover:text-primary transition-colors focus:outline-none"
                    aria-label="Toggle submenu"
                >
                    <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
            </div>

            {isOpen && (
                <div className="pl-2 pb-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {item.megaMenuColumns?.map((col, idx) => (
                        <div key={idx} className="space-y-3">
                            {col.title && <h4 className="font-medium text-sm text-foreground/80 border-b border-border/20 pb-1">{col.title}</h4>}

                            {col.title.toLowerCase().includes('uso') ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {usages?.length > 0 ? (
                                        usages.map((usage: any) => (
                                            <Link
                                                key={usage._id}
                                                href={`/tienda?uso=${usage.slug.current}`}
                                                onClick={onNavigate}
                                                className="block text-sm text-muted-foreground hover:text-primary pl-2"
                                            >
                                                {usage.title}
                                            </Link>
                                        ))
                                    ) : <span className="text-xs italic text-muted-foreground pl-2">No hay usos</span>}
                                </div>
                            ) : col.title.toLowerCase().includes('tono') ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {tones?.length > 0 ? (
                                        tones.map((tone: any) => (
                                            <Link
                                                key={tone._id}
                                                href={`/tienda?tono=${tone.slug.current}`}
                                                onClick={onNavigate}
                                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary pl-2"
                                            >
                                                <div
                                                    style={{ 
                                                        width: '16px', 
                                                        height: '16px', 
                                                        borderRadius: '50%', 
                                                        border: '1px solid #e2e8f0',
                                                        backgroundColor: (typeof tone.value === 'string' 
                                                            ? tone.value.trim().substring(0, 7) 
                                                            : tone.value?.hex) || 'red',
                                                        flexShrink: 0
                                                    }}
                                                />
                                                <span className="truncate">{tone.title}</span>
                                            </Link>
                                        ))
                                    ) : <span className="text-xs italic text-muted-foreground pl-2">No hay tonos</span>}
                                </div>
                            ) : col.title.toLowerCase().includes('sublimad') ? (
                                <div className="py-2">
                                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x hide-scrollbar">
                                        {sublimatedProducts && sublimatedProducts.length > 0 ? (
                                            sublimatedProducts.map((product: any) => (
                                                <Link
                                                    key={product._id}
                                                    href={`/producto/${product.slug}`}
                                                    onClick={onNavigate}
                                                    className="flex-shrink-0 w-32 bg-background border border-border/50 rounded-lg shadow-sm overflow-hidden snap-center group"
                                                >
                                                    <div className="relative w-full h-32 bg-muted">
                                                        <Image
                                                            src={product.image || "/placeholder.svg"}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-xs font-medium line-clamp-2 leading-tight text-foreground/90">{product.name}</p>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="text-xs italic text-muted-foreground pl-2">No hay productos</span>
                                        )}
                                    </div>
                                </div>
                            ) : (col.contentType === 'offer' || (col.title.toLowerCase().includes('oferta') && offers?.length > 0)) ? (
                                <div className="py-2">
                                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x hide-scrollbar">
                                        {offers.map((offer: any) => (
                                            <Link
                                                key={offer._id}
                                                href={`/producto/${offer.slug}`}
                                                onClick={onNavigate}
                                                className="flex-shrink-0 w-36 bg-background border border-border/50 rounded-lg shadow-sm overflow-hidden snap-center group"
                                            >
                                                <div className="relative w-full h-36 bg-muted">
                                                    <Image
                                                        src={offer.image || "/placeholder.svg"}
                                                        alt={offer.name}
                                                        fill
                                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    <div className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                                                        OFERTA
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-xs font-medium line-clamp-2 min-h-[2.5em] mb-1 leading-tight text-foreground/90">{offer.name}</p>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-red-600">${offer.sale_price?.toLocaleString()}</span>
                                                        {offer.price > offer.sale_price && (
                                                            <span className="text-[10px] text-muted-foreground line-through decoration-red-300/50">${offer.price?.toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                        <Link
                                            href="/tienda?ofertas=true"
                                            onClick={onNavigate}
                                            className="flex-shrink-0 w-36 bg-muted/30 border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors snap-center p-4 text-center group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                                <ChevronDown className="h-5 w-5 -rotate-90 text-foreground/70" />
                                            </div>
                                            <span className="text-xs font-medium">Ver todas las ofertas</span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {col.links?.map((link, lIdx) => (
                                        <Link
                                            key={lIdx}
                                            href={link.url}
                                            onClick={onNavigate}
                                            className="block text-sm text-muted-foreground hover:text-primary pl-2"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
