"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Flame, AlertTriangle, Eye, ArrowRight, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export interface UrgencyPopupConfig {
  isActive?: boolean
  mode?: "manual" | "auto"
  delaySeconds?: number
  displayFrequency?: "always" | "session" | "daily"
  position?: "bottom-left" | "bottom-right" | "bottom-center" | "top-right"
  
  // Manual
  product?: {
    _id?: string
    title?: string
    slug?: string
    imageUrl?: string
    price?: number
    salePrice?: number
    inventory?: number
  } | null
  customTitle?: string
  customMessage?: string
  badgeText?: string
  stockRemaining?: number
  stockUnit?: string
  customImageUrl?: string
  buttonText?: string
  buttonUrl?: string
  socialProofCount?: number

  // Auto
  autoStockThreshold?: number
  autoBadgeText?: string
  autoMessageTemplate?: string
  autoProducts?: Array<{
    _id: string
    title: string
    slug: string
    imageUrl: string
    price?: number
    salePrice?: number
    inventory?: number
  }>

  // Visual
  themeColor?: "red" | "amber" | "dark" | "primary"
  showProgressBar?: boolean
  progressPercent?: number
  showSocialProof?: boolean
}

interface UrgencyPopupProps {
  config?: UrgencyPopupConfig | null
  fallbackAutoProducts?: Array<{
    _id: string
    title: string
    slug: string
    imageUrl: string
    price?: number
    salePrice?: number
    inventory?: number
  }>
}

export function UrgencyPopup({ config, fallbackAutoProducts = [] }: UrgencyPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeProductIndex, setActiveProductIndex] = useState(0)

  useEffect(() => {
    if (!config || config.isActive === false) return

    // Verificar frecuencia de visualización
    const freq = config.displayFrequency || "session"
    if (typeof window !== "undefined") {
      if (freq === "session") {
        const closedInSession = sessionStorage.getItem("telasreal_urgency_closed")
        if (closedInSession) return
      } else if (freq === "daily") {
        const lastClosed = localStorage.getItem("telasreal_urgency_last_closed")
        if (lastClosed) {
          const hoursPassed = (Date.now() - parseInt(lastClosed, 10)) / (1000 * 60 * 60)
          if (hoursPassed < 24) return
        }
      }
    }

    const delay = (config.delaySeconds ?? 6) * 1000
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [config])

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsVisible(false)

    if (typeof window !== "undefined") {
      const freq = config?.displayFrequency || "session"
      if (freq === "session") {
        sessionStorage.setItem("telasreal_urgency_closed", "true")
      } else if (freq === "daily") {
        localStorage.setItem("telasreal_urgency_last_closed", Date.now().toString())
      }
    }
  }

  if (!config || config.isActive === false) return null

  const isAuto = config.mode === "auto"
  const autoProductsList = config.autoProducts?.length ? config.autoProducts : fallbackAutoProducts
  const currentAutoProduct = autoProductsList.length > 0 ? autoProductsList[activeProductIndex % autoProductsList.length] : null

  // Determinar datos a mostrar según modo manual o automático
  let title = "¡Agotándose Rápido!"
  let message = "Quedan pocas unidades disponibles en bodega."
  let badge = config.badgeText || "🔥 ¡ÚLTIMAS UNIDADES!"
  let imageUrl = config.customImageUrl || "/placeholder.svg"
  let targetUrl = config.buttonUrl || "/tienda"
  let stock = config.stockRemaining ?? 6
  let stockUnit = config.stockUnit || "metros"
  let socialProof = config.socialProofCount ?? 12

  if (isAuto && currentAutoProduct) {
    title = currentAutoProduct.title
    badge = config.autoBadgeText || "🔥 ¡CASI AGOTADO!"
    imageUrl = currentAutoProduct.imageUrl || imageUrl
    targetUrl = `/producto/${currentAutoProduct.slug}`
    stock = currentAutoProduct.inventory && currentAutoProduct.inventory > 0 ? currentAutoProduct.inventory : 5
    const template = config.autoMessageTemplate || "¡Quedan solo {stock} disponibles! Alta demanda hoy."
    message = template.replace("{stock}", `${stock} ${stockUnit}`)
  } else if (!isAuto) {
    if (config.product) {
      title = config.customTitle || config.product.title || title
      imageUrl = config.customImageUrl || config.product.imageUrl || imageUrl
      targetUrl = config.buttonUrl || `/producto/${config.product.slug}`
      if (config.product.inventory && !config.stockRemaining) {
        stock = config.product.inventory
      }
    } else {
      title = config.customTitle || title
    }
    if (config.customMessage) {
      message = config.customMessage
    }
  }

  const theme = config.themeColor || "red"
  const showProgress = config.showProgressBar !== false
  const progressPercent = config.progressPercent || Math.min(95, Math.max(65, 100 - (stock * 4)))
  const showSocialProof = config.showSocialProof !== false
  const buttonText = config.buttonText || "Ver Producto"

  // Estilos de posición
  const positionClasses = {
    "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
    "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6",
    "top-right": "top-20 right-4 sm:top-24 sm:right-6",
  }[config.position || "bottom-left"]

  // Variantes de color
  const themeStyles = {
    red: {
      border: "border-red-500/40 dark:border-red-500/50",
      badgeBg: "bg-red-600 text-white",
      progressBg: "bg-gradient-to-r from-amber-500 to-red-600",
      pulseColor: "bg-red-500",
      buttonBg: "bg-red-600 hover:bg-red-700 text-white",
      glow: "shadow-[0_10px_30px_rgba(220,38,38,0.25)]",
    },
    amber: {
      border: "border-amber-500/40 dark:border-amber-500/50",
      badgeBg: "bg-amber-500 text-amber-950 font-bold",
      progressBg: "bg-gradient-to-r from-yellow-400 to-amber-500",
      pulseColor: "bg-amber-500",
      buttonBg: "bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold",
      glow: "shadow-[0_10px_30px_rgba(245,158,11,0.25)]",
    },
    dark: {
      border: "border-zinc-700 dark:border-zinc-600",
      badgeBg: "bg-zinc-900 text-zinc-100 border border-zinc-700",
      progressBg: "bg-gradient-to-r from-zinc-500 to-zinc-200",
      pulseColor: "bg-white",
      buttonBg: "bg-zinc-900 hover:bg-zinc-800 text-white",
      glow: "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
    },
    primary: {
      border: "border-primary/40",
      badgeBg: "bg-primary text-primary-foreground",
      progressBg: "bg-gradient-to-r from-primary/70 to-primary",
      pulseColor: "bg-primary",
      buttonBg: "bg-primary hover:bg-primary/90 text-primary-foreground",
      glow: "shadow-[0_10px_30px_rgba(0,0,0,0.2)]",
    },
  }[theme]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          aria-label="Alerta de producto en agotamiento"
          initial={{ opacity: 0, y: 50, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className={`fixed z-40 w-[calc(100vw-2rem)] max-w-sm sm:max-w-[400px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border ${themeStyles.border} ${themeStyles.glow} rounded-2xl p-4 sm:p-4.5 ${positionClasses}`}
        >
          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            aria-label="Cerrar aviso de urgencia"
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge de Urgencia superior */}
          <div className="flex items-center gap-2 mb-3 pr-6">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-xs ${themeStyles.badgeBg}`}>
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>{badge}</span>
            </span>

            {showSocialProof && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <Eye className="w-3 h-3 text-red-500 animate-pulse" />
                <span>{socialProof} viendo esto</span>
              </span>
            )}
          </div>

          {/* Cuerpo Principal: Imagen + Info */}
          <Link href={targetUrl} onClick={() => handleClose()} className="group block">
            <div className="flex items-start gap-3.5">
              {/* Imagen del producto */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Textos */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                  {message}
                </p>

                {/* Indicador de stock restante */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${themeStyles.pulseColor} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${themeStyles.pulseColor}`}></span>
                  </span>
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                    ¡Solo quedan {stock} {stockUnit}!
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Barra de progreso de stock vendido */}
          {showProgress && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                <span>Stock vendido:</span>
                <span className="font-bold text-foreground">{progressPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${themeStyles.progressBg}`}
                />
              </div>
            </div>
          )}

          {/* Botón CTA de Acción Rápida */}
          <div className="mt-3.5">
            <Link
              href={targetUrl}
              onClick={() => handleClose()}
              className={`w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all shadow-xs group ${themeStyles.buttonBg}`}
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
