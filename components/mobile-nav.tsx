"use client"

import type React from "react"
import { Home, Tag, ShoppingCart, User, Menu, Store, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { CartSidebar } from "@/components/cart-sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { type HeaderConfig } from "@/components/header"
import { MobileMenuItem } from "@/components/mobile-menu-item"
import { useSession } from "next-auth/react"
import { AuthDrawer } from "@/components/auth-drawer"
import { useCart } from "@/lib/contexts/CartContext"

interface MobileNavProps {
  config?: HeaderConfig
  usages?: any[]
  tones?: any[]
  offers?: any[]
  sublimatedProducts?: any[]
}

export function MobileNav({ config, usages, tones, offers, sublimatedProducts }: MobileNavProps) {
  const pathname = usePathname()
  const { isCartOpen, setIsCartOpen } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  const handleNavigation = () => {
    setIsMenuOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Force the menu structure according to requirements (same as PC)
  const safeLabel = (m: any) => (m?.label || '').toLowerCase().trim();

  let telasItem = config?.menu?.find((m: any) => safeLabel(m).includes('tela') || safeLabel(m).includes('tienda'));
  let personalizadoItem = config?.menu?.find((m: any) => safeLabel(m).includes('personaliz'));
  let sobreNosotrosItem = config?.menu?.find((m: any) => safeLabel(m).includes('nosotros') || safeLabel(m).includes('conocenos') || safeLabel(m).includes('conócenos'));

  // Fallbacks just in case the Sanity structure is entirely different
  if (!telasItem && (config?.menu?.length ?? 0) > 0) telasItem = config?.menu?.[0];
  if (!personalizadoItem && (config?.menu?.length ?? 0) > 1) personalizadoItem = config?.menu?.[1];
  
  if (!sobreNosotrosItem) {
    sobreNosotrosItem = {
      _key: "sobre-nosotros",
      label: "Sobre Nosotros",
      link: "/conocenos",
      hasMegaMenu: false
    };
  }

  // Find or create Insumos item (with dropdown Tijeras and Hilos)
  const defaultInsumosLinks = [
    { label: "Todos los insumos", url: "/tienda?categoria=insumos" },
    { label: "Hilos", url: "/tienda?categoria=hilos" },
    { label: "Tijeras", url: "/tienda?categoria=tijeras" },
  ];

  let insumosItem = config?.menu?.find(m => safeLabel(m).includes('insumo'));
  if (!insumosItem) {
    insumosItem = {
      _key: "insumos",
      label: "Insumos",
      link: "/tienda?categoria=insumos",
      hasMegaMenu: true,
      megaMenuColumns: [
        {
          title: "",
          contentType: "manual",
          links: defaultInsumosLinks
        }
      ]
    };
  } else {
    insumosItem = {
      ...insumosItem,
      link: "/tienda?categoria=insumos",
      hasMegaMenu: true,
      megaMenuColumns: [
        {
          title: "",
          contentType: "manual",
          links: defaultInsumosLinks
        }
      ]
    };
  }

  const deTuInteresItem = {
    _key: "de-tu-interes",
    label: "De tu Interés",
    hasMegaMenu: true,
    megaMenuColumns: [
      {
        title: "",
        contentType: "links",
        links: [
          { label: "Blogs", url: "/blogs" },
          { label: "Calculadora", url: "/calculadora" },
          { label: "Videos", url: "/videos" },
        ]
      }
    ]
  };

  const customMenu = [];
  if (personalizadoItem) customMenu.push(personalizadoItem);
  if (insumosItem) customMenu.push(insumosItem as any);
  if (telasItem && (!personalizadoItem || telasItem._key !== personalizadoItem._key)) customMenu.push(telasItem);
  customMenu.push(deTuInteresItem as any);
  if (sobreNosotrosItem && (!telasItem || sobreNosotrosItem._key !== telasItem._key) && (!personalizadoItem || sobreNosotrosItem._key !== personalizadoItem._key)) customMenu.push(sobreNosotrosItem);

  const modifiedConfig = {
    ...config,
    menu: customMenu
  };

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Inicio",
      onClick: (e?: React.MouseEvent) => {
        if (pathname === "/" || pathname === "") {
          e?.preventDefault()
          window.scrollTo({ top: 0, behavior: "smooth" })
          return
        }
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
      href: "/tienda",
      icon: Store,
      label: "Tienda",
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
            const isActive = item.href && (
              item.href === "/"
                ? (pathname === "/" || pathname === "")
                : item.href === "/tienda"
                ? (pathname === "/tienda" || pathname.startsWith("/tienda/"))
                : pathname === item.href
            )

            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive ? "text-primary font-medium" : "text-slate-300 hover:text-white",
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
                  isActive ? "text-primary font-medium" : "text-slate-300 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-light">{item.label}</span>
              </button>
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
                {/* Mi Cuenta en el Menú */}
                <div className="mb-3 pb-4 border-b border-border/60">
                  {session ? (
                    <Link
                      href="/cuenta"
                      onClick={handleNavigation}
                      className="flex items-center gap-3.5 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all text-foreground"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {session.user?.name || "Mi Cuenta"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user?.email || "Ver mi perfil y pedidos"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ) : (
                    <AuthDrawer>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 border border-border transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Mi Cuenta / Iniciar Sesión
                          </p>
                          <p className="text-xs text-muted-foreground">Accede a tus pedidos y perfil</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </AuthDrawer>
                  )}
                </div>

                {modifiedConfig?.menu?.map((item) => {
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
