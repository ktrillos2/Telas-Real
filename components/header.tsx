"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingCart, User, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CartSidebar } from "@/components/cart-sidebar"
import { SearchModal } from "@/components/search-modal"
import { useHomeData } from "@/lib/hooks/useHomeData"
import { useCart } from "@/lib/contexts/CartContext"

// ✅ TICKER COMPLETO
function TopTicker() {
  const { data } = useHomeData()

  // Mensajes por defecto mientras carga o si falla
  const defaultMessages = [
    "🎉 No te pierdas nuestras promociones exclusivas",
    "🚚 Envíos a todo el país",
    "✨ Telas premium: calidad que se siente",
    "🧵 Personalización para tus proyectos",
  ]

  // Extraer textos del API y filtrar los vacíos
  const apiMessages = data?.acf?.textos_header
    ? [
      data.acf.textos_header.texto_1,
      data.acf.textos_header.texto_2,
      data.acf.textos_header.texto_3,
      data.acf.textos_header.texto_4,
    ].filter((text) => text && text.trim() !== '')
    : []

  // Usar mensajes del API si existen, sino usar los por defecto
  const messages = apiMessages.length > 0 ? apiMessages : defaultMessages

  // Duplicamos el contenido 4 veces para asegurar que cubra pantallas grandes
  // y el loop sea imperceptible.
  const track = [...messages, ...messages, ...messages, ...messages]

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

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { totalItems } = useCart()

  const handleNavigation = () => {
    setIsMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      {/* ✅ BLOQUE STICKY: TICKER + HEADER JUNTOS */}
      <div className="sticky top-0 z-50 w-full">
        {/* TICKER */}
        <TopTicker />

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
                <Link
                  href="/#quienes-somos"
                  onClick={handleNavigation}
                  className="text-sm font-light hover:text-primary transition-colors"
                >
                  Quienes Somos
                </Link>
                <Link
                  href="/personalizado"
                  onClick={handleNavigation}
                  className="text-sm font-light hover:text-primary transition-colors"
                >
                  Personalizado
                </Link>

                {/* MEGA MENU */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                  onMouseLeave={() => setIsMegaMenuOpen(false)}
                >
                  <Link
                    href="/tienda"
                    onClick={handleNavigation}
                    className="flex items-center gap-1 text-sm font-light hover:text-primary transition-colors"
                  >
                    Telas <ChevronDown className="h-4 w-4" />
                  </Link>

                  {isMegaMenuOpen && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                    >
                      <div className="w-[800px] bg-background border border-border rounded-lg shadow-lg p-6">
                        <div className="grid grid-cols-4 gap-8">
                          {/* Columna 1 */}
                          <div>
                            <h3 className="font-medium mb-3 text-foreground">Productos</h3>
                            <div className="space-y-2">
                              <Link href="/tienda?categoria=sublimados" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Sublimados</Link>
                              <Link href="/tienda?categoria=unicolor" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Unicolor</Link>
                            </div>
                          </div>

                          {/* Columna 2 */}
                          <div>
                            <h3 className="font-medium mb-3 text-foreground">Usos</h3>
                            <div className="space-y-2">
                              <Link href="/tienda?uso=accesorios" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Accesorios y Mascotas</Link>
                              <Link href="/tienda?uso=deportivos" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Deportivos y comodos</Link>
                              <Link href="/tienda?uso=dotaciones" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Dotaciones</Link>
                              <Link href="/tienda?uso=elegantes" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Elegantes</Link>
                              <Link href="/tienda?uso=casual" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Moda casual</Link>
                              <Link href="/tienda?uso=acogedores" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Acogedores</Link>
                              <Link href="/tienda?uso=verano" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Verano</Link>
                              <Link href="/tienda?uso=pijamas" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Pijamas</Link>
                            </div>
                          </div>

                          {/* Columna 3 */}
                          <div>
                            <h3 className="font-medium mb-3 text-foreground">Tonos</h3>
                            <div className="space-y-2">
                              <Link href="/tienda?tono=amarillos" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Amarillos</Link>
                              <Link href="/tienda?tono=azules" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Azules</Link>
                              <Link href="/tienda?tono=claros" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Claros</Link>
                              <Link href="/tienda?tono=medios" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Medios</Link>
                              <Link href="/tienda?tono=oscuros" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Oscuros</Link>
                              <Link href="/tienda?tono=rojos" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Rojos</Link>
                              <Link href="/tienda?tono=rosados" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Rosados</Link>
                              <Link href="/tienda?tono=verdes" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Verdes</Link>
                              <Link href="/tienda?tono=neon" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary">Neon</Link>
                            </div>
                          </div>

                          {/* Columna 4 */}
                          <div>
                            <h3 className="font-medium mb-3 text-foreground">Ofertas</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/puntos-atencion" onClick={handleNavigation} className="text-sm font-light hover:text-primary">Puntos de atención</Link>
                <Link href="/blogs" onClick={handleNavigation} className="text-sm font-light hover:text-primary">Blogs</Link>
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
                    <nav className="flex flex-col gap-4 mt-8">
                      <Link href="/#quienes-somos" onClick={handleNavigation} className="text-lg font-light hover:text-primary">Quienes Somos</Link>
                      <Link href="/personalizado" onClick={handleNavigation} className="text-lg font-light hover:text-primary">Personalizado</Link>
                      <Link href="/tienda" onClick={handleNavigation} className="text-lg font-light hover:text-primary">Tienda</Link>
                      <Link href="/puntos-atencion" onClick={handleNavigation} className="text-lg font-light hover:text-primary">Puntos de atención</Link>
                      <Link href="/blogs" onClick={handleNavigation} className="text-lg font-light hover:text-primary">Blogs</Link>
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
