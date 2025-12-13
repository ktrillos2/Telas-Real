"use client"

import type React from "react"

import { Home, Tag, ShoppingCart, User, Menu, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { CartSidebar } from "@/components/cart-sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export function MobileNav() {
  const pathname = usePathname()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isTelasExpanded, setIsTelasExpanded] = useState(false)

  const handleNavigation = () => {
    setIsMenuOpen(false)
    setIsTelasExpanded(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Inicio",
      onClick: () => {
        handleNavigation()
      },
    },
    {
      href: "/tienda?ofertas=true",
      icon: Tag,
      label: "Ofertas",
      onClick: () => {
        handleNavigation()
      },
    },
    {
      icon: ShoppingCart,
      label: "Carrito",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        setIsCartOpen(true)
      },
    },
    {
      href: "/cuenta",
      icon: User,
      label: "Mi cuenta",
      onClick: () => {
        handleNavigation()
      },
    },
  ]

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href && pathname === item.href

            return (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    isActive ? "text-primary" : "text-slate-300 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-light">{item.label}</span>
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    isActive ? "text-primary" : "text-slate-300 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-light">{item.label}</span>
                </button>
              )
            )
          })}

          {/* Menu Sidebar Trigger */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center justify-center gap-1 transition-colors text-slate-300 hover:text-white"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs font-light">Menú</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full p-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b px-6 py-6">
                <SheetTitle className="text-2xl font-semibold">Menú</SheetTitle>
                <p className="text-sm text-muted-foreground mt-1">Explora nuestras opciones</p>
              </div>

              {/* Navigation */}
              <nav className="flex flex-col p-6 gap-2 overflow-y-auto h-[calc(100vh-120px)]">
                <Link
                  href="/#quienes-somos"
                  onClick={handleNavigation}
                  className="text-lg font-light hover:text-primary py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                >
                  Quienes Somos
                </Link>

                <Link
                  href="/personalizado"
                  onClick={handleNavigation}
                  className="text-lg font-light hover:text-primary py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                >
                  Personalizado
                </Link>

                {/* Telas Mega Menu */}
                <div className="rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/tienda"
                      onClick={handleNavigation}
                      className="flex-1 text-lg font-light py-3 px-4 hover:bg-muted transition-colors"
                    >
                      Telas
                    </Link>
                    <button
                      onClick={() => setIsTelasExpanded(!isTelasExpanded)}
                      className="py-3 px-4 hover:bg-muted transition-colors"
                    >
                      {isTelasExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {isTelasExpanded && (
                    <div className="bg-muted/30 p-4 space-y-6 max-h-[50vh] overflow-y-auto">
                      {/* Productos */}
                      <div>
                        <h3 className="font-semibold text-sm mb-3 text-primary">Productos</h3>
                        <div className="space-y-2 pl-2">
                          <Link href="/tienda?categoria=sublimados" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Sublimados
                          </Link>
                          <Link href="/tienda?categoria=unicolor" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Unicolor
                          </Link>
                        </div>
                      </div>

                      {/* Usos */}
                      <div>
                        <h3 className="font-semibold text-sm mb-3 text-primary">Usos</h3>
                        <div className="space-y-2 pl-2">
                          <Link href="/tienda?uso=accesorios" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Accesorios y Mascotas
                          </Link>
                          <Link href="/tienda?uso=deportivos" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Deportivos
                          </Link>
                          <Link href="/tienda?uso=dotaciones" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Dotaciones
                          </Link>
                          <Link href="/tienda?uso=elegantes" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Elegantes
                          </Link>
                          <Link href="/tienda?uso=casual" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Casual
                          </Link>
                        </div>
                      </div>

                      {/* Tonos */}
                      <div>
                        <h3 className="font-semibold text-sm mb-3 text-primary">Tonos</h3>
                        <div className="space-y-2 pl-2">
                          <Link href="/tienda?tono=amarillos" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Amarillos
                          </Link>
                          <Link href="/tienda?tono=azules" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Azules
                          </Link>
                          <Link href="/tienda?tono=claros" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Claros
                          </Link>
                          <Link href="/tienda?tono=oscuros" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Oscuros
                          </Link>
                          <Link href="/tienda?tono=rojos" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Rojos
                          </Link>
                        </div>
                      </div>

                      {/* Ofertas */}
                      <div>
                        <h3 className="font-semibold text-sm mb-3 text-primary">Ofertas</h3>
                        <div className="pl-2">
                          <Link href="/tienda?ofertas=true" onClick={handleNavigation} className="block text-sm font-light text-muted-foreground hover:text-primary py-1">
                            Ver todas las ofertas
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/puntos-atencion"
                  onClick={handleNavigation}
                  className="text-lg font-light hover:text-primary py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                >
                  Puntos de atención
                </Link>

                <Link
                  href="/blogs"
                  onClick={handleNavigation}
                  className="text-lg font-light hover:text-primary py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                >
                  Blogs
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <CartSidebar open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  )
}
