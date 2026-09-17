import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Home, ShoppingBag, Sparkles, Flame, Scissors, HelpCircle } from "lucide-react"
import { NotFoundSearch } from "@/components/not-found-search"

export const metadata: Metadata = {
  title: "404 - Página no encontrada | Telas Real",
  description: "La página que buscas no existe o ha sido movida. Explora nuestro catálogo de telas, textiles e insumos en Colombia.",
}

export default function NotFound() {
  return (
    <section className="relative w-full min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-180px)] flex items-center justify-center py-10 sm:py-14 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white dark:bg-zinc-950">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Visual Column: Mascot on fabric roll */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-1">
          <div className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[540px] flex flex-col items-center">
            {/* Playful Floating Badge */}
            <div className="absolute -top-3 sm:-top-4 right-2 sm:right-6 z-20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-zinc-800/95 shadow-md border border-slate-200/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-semibold backdrop-blur-sm transform rotate-3 hover:rotate-0 transition-transform">
              <span className="text-emerald-600 font-bold">404</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
              <span>Rollo equivocado</span>
            </div>

            {/* Mascot Image cleanly displayed without any background or shadow */}
            <div className="relative w-full">
              <Image
                src="/404.png"
                alt="Camaleón mascota de Telas Real descansando sobre un rollo de tela para la página de error 404"
                width={768}
                height={512}
                priority
                className="w-full h-auto object-contain select-none"
                sizes="(max-width: 640px) 320px, (max-width: 1024px) 440px, 540px"
              />
            </div>
          </div>
        </div>

        {/* Content Column: Search and Recovery Actions */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-2">
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Página no encontrada</span>
          </div>

          {/* Single H1 Title for SEO & Semantic Hierarchy */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.18] mb-4">
            ¡Ups! Este rollo de tela se nos desenrolló
          </h1>

          {/* Empathetic Description */}
          <p className="text-slate-600 dark:text-zinc-300 font-light text-base sm:text-lg leading-relaxed max-w-xl mb-6">
            La página que buscas no existe, cambió de lugar o se perdió entre nuestros cortes textiles. Pero no te preocupes, ¡tenemos cientos de opciones listas para confeccionar tus ideas!
          </p>

          {/* Interactive Search Bar */}
          <div className="w-full mb-6 flex justify-center lg:justify-start">
            <NotFoundSearch />
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-8">
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-emerald-600 text-white px-7 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-98 min-h-[48px]"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Explorar catálogo</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2.5 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 px-7 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-98 min-h-[48px]"
            >
              <Home className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              <span>Volver al inicio</span>
            </Link>
          </div>

          {/* Quick Category Chips with Native Touch Scroll for Mobile */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500 mb-3 flex items-center justify-center lg:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Explorar secciones populares</span>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-2 overflow-x-auto scrollbar-hide py-1 -mx-2 px-2 snap-x">
              <Link
                href="/tienda?sort=sale"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-medium transition-colors whitespace-nowrap min-h-[40px] snap-start"
              >
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>Ofertas</span>
              </Link>

              <Link
                href="/tienda?sort=best-sellers"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-medium transition-colors whitespace-nowrap min-h-[40px] snap-start"
              >
                <span>⭐ Más vendidos</span>
              </Link>

              <Link
                href="/personalizado"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-medium transition-colors whitespace-nowrap min-h-[40px] snap-start"
              >
                <span>🎨 Sublimación</span>
              </Link>

              <Link
                href="/tienda?categoria=insumos"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-medium transition-colors whitespace-nowrap min-h-[40px] snap-start"
              >
                <Scissors className="w-3.5 h-3.5 text-slate-500" />
                <span>Insumos y Tijeras</span>
              </Link>
            </div>
          </div>

          {/* Need help footer hint */}
          <div className="mt-6 flex items-center justify-center lg:justify-start gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              ¿Necesitas ayuda con tu compra?{" "}
              <Link
                href="/pqr"
                className="text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium underline underline-offset-4 transition-colors"
              >
                Atención al cliente
              </Link>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
