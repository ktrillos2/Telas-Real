"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Search, ShoppingCart, User, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CartSidebar } from "@/components/cart-sidebar"
import { SearchModal } from "@/components/search-modal"
import { useCart } from "@/lib/contexts/CartContext"
import { type SanityDocument } from "next-sanity"
import { cn } from "@/lib/utils"
import { MobileMenuItem } from "@/components/mobile-menu-item"

export interface NavLink {
  label: string
  url: string
}

export interface NavColumn {
  title: string
  contentType?: 'manual' | 'usage' | 'tone' | 'offer'
  links: NavLink[]
}

export interface NavItem {
  _key: string
  label: string
  link?: string
  hasMegaMenu?: boolean
  megaMenuColumns?: NavColumn[]
}

export interface HeaderConfig {
  ticker?: string[]
  menu?: NavItem[]
}

interface HeaderProps {
  config?: HeaderConfig | null
  usages?: any[]
  tones?: any[]
  offers?: any[]
  sublimatedProducts?: any[]
}

// ✅ TICKER COMPLETO
function TopTicker({ messages = [] }: { messages?: string[] }) {
  // Mensajes por defecto
  const defaultMessages = [
    "🎉 No te pierdas nuestras promociones exclusivas",
    "🚚 Envíos a todo el país",
    "✨ Telas premium: calidad que se siente",
    "🧵 Personalización para tus proyectos",
  ]

  const trackMessages = messages.length > 0 ? messages : defaultMessages

  // Duplicamos el contenido 4 veces para asegurar que cubra pantallas grandes
  // y el loop sea imperceptible.
  const track = [...trackMessages, ...trackMessages, ...trackMessages, ...trackMessages]


  // Duplicamos el contenido 4 veces para asegurar que cubra pantallas grandes
  // y el loop sea imperceptible.
  return (
    <div className="relative w-full h-10 bg-white overflow-hidden border-b border-border/30">
      {/* ✅ DESVANECIMIENTO IZQUIERDA */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "120px",
          background: "linear-gradient(to right, white 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* ✅ DESVANECIMIENTO DERECHA */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "120px",
          background: "linear-gradient(to left, white 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* ✅ CONTENEDOR DEL TRACK */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          whiteSpace: "nowrap",
        }}
      >
        <div className="marquee" style={{ display: "inline-flex" }}>
          {track.map((text, i) => (
            <span
              key={i}
              style={{
                padding: "0 40px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#334155",
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ✅ Animación */}
      <style jsx>{`
        .marquee {
          /* Duración ajustada para ser suave con más contenido */
          animation: marquee 40s linear infinite;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            /* Movemos solo el 25% porque tenemos 4 copias. 
               Al mover 25%, el inicio de la copia 2 estará exactamente donde estaba el inicio de la copia 1. */
            transform: translateX(-25%);
          }
        }
      `}</style>
    </div>
  )
}

export function Header({ config, usages = [], tones = [], offers = [], sublimatedProducts = [] }: HeaderProps) {
  console.log("DEBUG: Header Tones:", tones);
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { totalItems } = useCart()
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) {
    return null
  }

  const handleNavigation = () => {
    setIsMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      {/* ✅ BLOQUE STICKY: TICKER + HEADER JUNTOS */}
      <div className="sticky top-0 z-50 w-full">
        {/* TICKER */}
        <TopTicker messages={config?.ticker} />

        {/* HEADER */}
        <header className="w-full border-b border-border/50 bg-[#E8F4F8] backdrop-blur">
          <div className="container mx-auto px-4">
            {/* MOBILE SEARCH */}
            <div className="lg:hidden py-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-background rounded-full border border-border/50"
              >
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-light text-muted-foreground">Buscar telas...</span>
              </button>
            </div>

            {/* DESKTOP HEADER */}
            <div className="hidden lg:flex h-20 items-center justify-between relative">
              <Link href="/" onClick={handleNavigation} className="flex items-center gap-2">
                <Image
                  src="/images/design-mode/image.png"
                  alt="Telas Real"
                  width={180}
                  height={60}
                  priority
                  className="h-12 w-auto"
                />
              </Link>

              {/* CENTERED NAV */}
              <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
                {config?.menu?.map((item) => {
                  if (item.hasMegaMenu) {
                    return (
                      <div
                        key={item._key}
                        className="relative"
                        onMouseEnter={() => setIsMegaMenuOpen(true)}
                        onMouseLeave={() => setIsMegaMenuOpen(false)}
                      >
                        <Link
                          href={
                            item.label.toLowerCase() === 'telas' || item.label.toLowerCase() === 'tela' 
                              ? '/tienda' 
                              : item.label.toLowerCase() === 'conócenos' || item.label.toLowerCase() === 'conocenos' || item.label.toLowerCase() === 'quienes somos' || item.label.toLowerCase() === 'quiénes somos'
                              ? '/conocenos'
                              : (item.link || '#')
                          }
                          onClick={(e) => {
                            const label = item.label.toLowerCase();
                            const isRedirectItem = label === 'telas' || label === 'tela' || label === 'conócenos' || label === 'conocenos' || label === 'quienes somos' || label === 'quiénes somos';
                            
                            if (isRedirectItem) {
                              handleNavigation();
                            } else if (item.hasMegaMenu) {
                              e.preventDefault();
                            }
                          }}
                          className="flex items-center gap-1 text-sm font-light hover:text-primary transition-colors cursor-pointer"
                        >
                          {item.label} <ChevronDown className="h-4 w-4" />
                        </Link>

                        {isMegaMenuOpen && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                            <div className="w-[1000px] bg-background border border-border rounded-lg shadow-lg p-6">
                              <div className="grid grid-cols-5 gap-8">
                                {item.megaMenuColumns?.map((col, idx) => (
                                  <div key={idx} className={cn("col-span-1", (col.contentType === 'offer' || col.title.toLowerCase().includes('oferta')) && "col-span-2")}>
                                    <h3 className="font-medium mb-3 text-foreground">{col.title}</h3>

                                    {/* LOGICA DINAMICA */}
                                    {col.title.toLowerCase().includes('uso') ? (
                                      /* USOS - Always render if title matches 'uso', even if empty */
                                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {usages?.length > 0 ? (
                                          usages.map((usage) => (
                                            <Link
                                              key={usage._id}
                                              href={`/tienda?uso=${usage.slug.current}`}
                                              onClick={handleNavigation}
                                              className="block text-sm font-light text-muted-foreground hover:text-primary transition-colors hover:underline"
                                            >
                                              {usage.title}
                                            </Link>
                                          ))
                                        ) : (
                                          <p className="text-xs text-muted-foreground italic">No hay usos disponibles</p>
                                        )}
                                      </div>
                                    ) : col.title.toLowerCase().includes('tono') ? (
                                      /* TONOS - Always render if title matches 'tono', even if empty */
                                      <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {tones?.length > 0 ? (
                                          tones.map((tone) => (
                                            <Link
                                              key={tone._id}
                                              href={`/tienda?tono=${tone.slug.current}`}
                                              onClick={handleNavigation}
                                              className="flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-primary transition-colors group"
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
                                              <span className="truncate group-hover:underline">{tone.title}</span>
                                            </Link>
                                          ))
                                        ) : (
                                          <p className="text-xs text-muted-foreground italic col-span-2">No hay tonos disponibles</p>
                                        )}
                                      </div>
                                    ) : col.title.toLowerCase().includes('sublimad') ? (
                                      /* SUBLIMADOS - Render fetched sublimated products */
                                      <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {sublimatedProducts?.length > 0 ? (
                                          sublimatedProducts.map((product) => (
                                            <Link
                                              key={product._id}
                                              href={`/producto/${product.slug}`}
                                              onClick={handleNavigation}
                                              className="flex gap-3 group bg-muted/30 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                                <Image
                                                  src={product.image || "/placeholder.svg"}
                                                  alt={product.name || "Producto"}
                                                  fill
                                                  className="object-cover"
                                                />
                                              </div>
                                              <div className="flex flex-col justify-center min-w-0">
                                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                                                  {product.name}
                                                </p>
                                              </div>
                                            </Link>
                                          ))
                                        ) : (
                                          <p className="text-xs text-muted-foreground italic col-span-2">No hay productos disponibles</p>
                                        )}
                                      </div>
                                    ) : (col.contentType === 'offer' || (col.title.toLowerCase().includes('oferta') && offers?.length > 0)) ? (
                                      <div className="grid grid-cols-2 gap-4">
                                        {offers.map((offer) => (
                                          <Link
                                            key={offer._id}
                                            href={`/producto/${offer.slug}`}
                                            onClick={handleNavigation}
                                            className="flex gap-3 group bg-muted/30 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                          >
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                              <Image
                                                src={offer.image || "/placeholder.svg"}
                                                alt={offer.name || "Oferta"}
                                                fill
                                                className="object-cover"
                                              />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">
                                                {offer.name || "Nombre del Producto"}
                                              </p>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-red-500">
                                                  ${offer.sale_price?.toLocaleString()}
                                                </span>
                                                {offer.price > offer.sale_price && (
                                                  <span className="text-[10px] text-muted-foreground line-through">
                                                    ${offer.price?.toLocaleString()}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </Link>
                                        ))}
                                      </div>
                                    ) : (
                                      /* FALLBACK DEFAULT LINKS */
                                      <div className="space-y-2">
                                        {col.links?.map((link, lIdx) => (
                                          <Link
                                            key={lIdx}
                                            href={link.url}
                                            onClick={handleNavigation}
                                            className="block text-sm font-light text-muted-foreground hover:text-primary"
                                          >
                                            {link.label}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={item._key}
                      href={
                        item.label.toLowerCase() === 'telas' || item.label.toLowerCase() === 'tela' 
                          ? '/tienda' 
                          : item.label.toLowerCase() === 'conócenos' || item.label.toLowerCase() === 'conocenos' || item.label.toLowerCase() === 'quienes somos' || item.label.toLowerCase() === 'quiénes somos'
                          ? '/conocenos'
                          : (item.link || '#')
                      }
                      onClick={() => handleNavigation()}
                      className="text-sm font-light hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* ICONOS DERECHA */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="hidden md:flex hover:bg-primary/10">
                  <Search className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" className="relative hover:bg-primary/10" onClick={() => setIsCartOpen(true)}>
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Button>

                <Link href="/cuenta">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>

                {/* MENU MÓVIL */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <nav className="flex flex-col mt-8 h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
                      {config?.menu?.map((item) => (
                        <MobileMenuItem
                          key={item._key}
                          item={item}
                          onNavigate={handleNavigation}
                          usages={usages}
                          tones={tones}
                          offers={offers}
                        />
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* MODALES */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartSidebar open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  )
}
