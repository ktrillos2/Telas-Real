"use client"

import type React from "react"
import { Home, Tag, ShoppingCart, User, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { CartSidebar } from "@/components/cart-sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { type HeaderConfig } from "@/components/header"
import { MobileMenuItem } from "@/components/mobile-menu-item"

interface MobileNavProps {
  config?: HeaderConfig
  usages?: any[]
  tones?: any[]
  offers?: any[]
  sublimatedProducts?: any[]
}

export function MobileNav({ config, usages, tones, offers, sublimatedProducts }: MobileNavProps) {
  const pathname = usePathname()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavigation = () => {
    setIsMenuOpen(false)
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
                {config?.menu?.map((item) => {
                  const label = item.label.toLowerCase();
                  if (label.includes('calculadora') || label === 'ubicaciones' || label.includes('puntos')) return null;
                  return (
                    <MobileMenuItem
                      key={item._key}
                      item={item}
                      onNavigate={handleNavigation}
                      usages={usages || []}
                      tones={tones || []}
                      offers={offers || []}
                      sublimatedProducts={sublimatedProducts || []}
                    />
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <CartSidebar open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  )
}
