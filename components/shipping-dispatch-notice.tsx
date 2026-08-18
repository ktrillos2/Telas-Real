"use client"

import { Truck, Clock, MapPin, Sparkles, AlertCircle } from "lucide-react"

interface ShippingDispatchNoticeProps {
  variant?: "product" | "cart" | "checkout" | "compact"
  className?: string
  showCostNote?: boolean
}

export function ShippingDispatchNotice({
  variant = "product",
  className = "",
  showCostNote = true,
}: ShippingDispatchNoticeProps) {
  if (variant === "compact") {
    return (
      <div
        className={`bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-lg p-3 text-xs text-amber-950 dark:text-amber-200 ${className}`}
      >
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Despacho de Pedidos:
            </p>
            <p className="font-light leading-relaxed">
              • <strong className="font-semibold">Antes de la 1:00 PM:</strong> Se envía el mismo día.
              <br />
              • <strong className="font-semibold">Después de la 1:00 PM:</strong> Se envía al día siguiente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "cart" || variant === "checkout") {
    return (
      <div
        className={`bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/40 dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900 border border-amber-200/90 dark:border-amber-800/50 rounded-xl p-4 space-y-3 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-medium text-xs sm:text-sm">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300">
            <Truck className="w-4 h-4" />
          </div>
          <span>Horario de Despacho de Pedidos</span>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 rounded-lg p-2.5 border border-amber-100 dark:border-amber-900/30 space-y-1.5 text-xs">
          <div className="flex items-start gap-2">
            <span className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-1.5 py-0.5 rounded text-[10px] mt-0.5 flex-shrink-0">
              Mismo Día
            </span>
            <p className="text-zinc-700 dark:text-zinc-300 leading-snug">
              Pedidos confirmados <strong className="font-semibold text-zinc-900 dark:text-zinc-100">antes de la 1:00 PM</strong> se envían el mismo día.
            </p>
          </div>
          <div className="flex items-start gap-2 pt-1 border-t border-amber-100/60 dark:border-zinc-800">
            <span className="inline-flex items-center justify-center bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold px-1.5 py-0.5 rounded text-[10px] mt-0.5 flex-shrink-0">
              Día Siguiente
            </span>
            <p className="text-zinc-700 dark:text-zinc-300 leading-snug">
              Pedidos confirmados <strong className="font-semibold text-zinc-900 dark:text-zinc-100">después de la 1:00 PM</strong> se envían al día siguiente.
            </p>
          </div>
        </div>

        {showCostNote && (
          <div className="space-y-1 text-[11px] sm:text-xs text-amber-900/90 dark:text-amber-300/90 leading-tight">
            <p className="font-light">
              <span className="font-medium">Nota sobre envío:</span> El valor del envío lo calcula la transportadora según el peso y destino, asumido por el cliente.
            </p>
            <p className="font-medium flex items-center gap-1 text-amber-950 dark:text-amber-200">
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              Los pedidos salen desde Bogotá hacia todo el país.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Default: "product" page variant
  return (
    <div
      className={`bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-amber-50/60 dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-900/60 border border-amber-200/90 dark:border-amber-800/50 rounded-xl p-4 sm:p-5 transition-all shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-medium text-sm sm:text-base">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span>Despacho y Envío de Pedidos</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          Corte 1:00 PM
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {/* Antes de la 1PM */}
        <div className="bg-white/85 dark:bg-zinc-900/85 p-3 rounded-lg border border-amber-200/70 dark:border-amber-900/40 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Antes de la 1:00 PM
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Se despacha y envía el <span className="text-emerald-600 dark:text-emerald-400 font-bold">mismo día</span>.
          </p>
        </div>

        {/* Después de la 1PM */}
        <div className="bg-white/85 dark:bg-zinc-900/85 p-3 rounded-lg border border-amber-200/70 dark:border-amber-900/40 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Después de la 1:00 PM
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Se despacha y envía al <span className="text-amber-700 dark:text-amber-400 font-bold">día siguiente</span>.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-amber-900 dark:text-amber-300">
        <p className="flex items-center gap-1 font-medium">
          <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          Envíos a todo el país desde Bogotá.
        </p>
        <p className="text-[11px] font-light text-zinc-600 dark:text-zinc-400">
          Flete contraentrega / asumido por el cliente.
        </p>
      </div>
    </div>
  )
}
