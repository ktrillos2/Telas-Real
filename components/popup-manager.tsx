"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Flame, Eye, ArrowRight, Tag, Sparkles, Gift } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export interface PopupConfigData {
  activePopup?: "none" | "urgency" | "promo"
  delaySeconds?: number
  displayFrequency?: "always" | "session" | "daily"
  position?: "bottom-left" | "bottom-right" | "bottom-center" | "top-right"

  // Urgency Popup Fields
  urgencyMode?: "auto" | "manual"
  urgencyProduct?: {
    _id?: string
    title?: string
    slug?: string
    imageUrl?: string
    price?: number
    salePrice?: number
    inventory?: number
  } | null
  urgencyCustomTitle?: string
  urgencyCustomMessage?: string
  urgencyBadgeText?: string
  urgencyStockRemaining?: number
  urgencyStockUnit?: string
  urgencyCustomImageUrl?: string
  urgencyButtonText?: string
  urgencyButtonUrl?: string
  urgencySocialProofCount?: number
  urgencyAutoStockThreshold?: number
  urgencyAutoBadgeText?: string
  urgencyAutoMessageTemplate?: string
  urgencyThemeColor?: "red" | "amber" | "dark" | "primary"
  urgencyShowProgressBar?: boolean
  urgencyProgressPercent?: number

  // Promo Popup Fields
  promoMode?: "auto" | "manual"
  promoBadgeText?: string
  promoTitle?: string
  promoDescription?: string
  promoImageUrl?: string
  promoButtonText?: string
  promoButtonUrl?: string
  promoDisplayType?: "modal" | "floating-card"
  promoProduct?: {
    _id?: string
    title?: string
    slug?: string
    imageUrl?: string
    price?: number
    salePrice?: number
  } | null
}

interface PopupManagerProps {
  config?: PopupConfigData | null
  fallbackLowStockProducts?: Array<{
    _id: string
    title: string
    slug: string
    imageUrl: string
    price?: number
    salePrice?: number
    inventory?: number
  }>
  fallbackOfferProducts?: Array<{
    _id: string
    name: string
    slug: string
    image: string
    price?: number
    sale_price?: number
  }>
}

export function PopupManager({
  config,
  fallbackLowStockProducts = [],
  fallbackOfferProducts = [],
}: PopupManagerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showPromoBadge, setShowPromoBadge] = useState(false)

  const activeType = config?.activePopup || "none"

  useEffect(() => {
    if (!config || activeType === "none") {
      setIsVisible(false)
      return
    }

    // Comprobación de frecuencia de visualización
    const freq = config.displayFrequency || "session"
    const storageKey = `telasreal_popup_${activeType}_dismissed`

    if (typeof window !== "undefined") {
      if (freq === "session") {
        const dismissed = sessionStorage.getItem(storageKey)
        if (dismissed) {
          if (activeType === "promo" && config.promoDisplayType === "modal") {
            setShowPromoBadge(true)
          }
          return
        }
      } else if (freq === "daily") {
        const lastDismissed = localStorage.getItem(storageKey)
        if (lastDismissed) {
          const hoursPassed = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60)
          if (hoursPassed < 24) {
            if (activeType === "promo" && config.promoDisplayType === "modal") {
              setShowPromoBadge(true)
            }
            return
          }
        }
      }
    }

    const delay = (config.delaySeconds ?? 6) * 1000
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [config, activeType])

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsVisible(false)

    const storageKey = `telasreal_popup_${activeType}_dismissed`
    const freq = config?.displayFrequency || "session"

    if (typeof window !== "undefined") {
      if (freq === "session") {
        sessionStorage.setItem(storageKey, "true")
      } else if (freq === "daily") {
        localStorage.setItem(storageKey, Date.now().toString())
      }
    }

    if (activeType === "promo" && config?.promoDisplayType === "modal") {
      setShowPromoBadge(true)
    }
  }

  // Si no hay popup activo o es "none", no renderizar nada
  if (!config || activeType === "none") {
    return null
  }

  // Posición común para tarjetas flotantes
  const positionClasses = {
    "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
    "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6",
    "top-right": "top-20 right-4 sm:top-24 sm:right-6",
  }[config.position || "bottom-left"]

  // =========================================================================
  // RENDER: POPUP 1 - URGENCIA DE AGOTAMIENTO DE PRODUCTOS
  // =========================================================================
  if (activeType === "urgency") {
    const isAuto = config.urgencyMode === "auto"
    const autoProduct = fallbackLowStockProducts.length > 0 ? fallbackLowStockProducts[0] : null

    let title = "¡Agotándose Rápido!"
    let message = "Quedan pocas unidades disponibles en bodega."
    let badge = config.urgencyBadgeText || "🔥 ¡ÚLTIMAS UNIDADES!"
    let imageUrl = config.urgencyCustomImageUrl || "/placeholder.svg"
    let targetUrl = config.urgencyButtonUrl || "/tienda"
    let stock = config.urgencyStockRemaining ?? 5
    let stockUnit = config.urgencyStockUnit || "metros"
    let socialProof = config.urgencySocialProofCount ?? 14

    if (isAuto && autoProduct) {
      title = autoProduct.title
      badge = config.urgencyAutoBadgeText || "🔥 ¡CASI AGOTADO!"
      imageUrl = autoProduct.imageUrl || imageUrl
      targetUrl = `/producto/${autoProduct.slug}`
      stock = autoProduct.inventory && autoProduct.inventory > 0 ? autoProduct.inventory : 4
      const template = config.urgencyAutoMessageTemplate || "¡Quedan solo {stock} disponibles! Alta demanda hoy."
      message = template.replace("{stock}", `${stock} ${stockUnit}`)
    } else if (!isAuto) {
      if (config.urgencyProduct) {
        title = config.urgencyCustomTitle || config.urgencyProduct.title || title
        imageUrl = config.urgencyCustomImageUrl || config.urgencyProduct.imageUrl || imageUrl
        targetUrl = config.urgencyButtonUrl || `/producto/${config.urgencyProduct.slug}`
        if (config.urgencyProduct.inventory && !config.urgencyStockRemaining) {
          stock = config.urgencyProduct.inventory
        }
      } else {
        title = config.urgencyCustomTitle || title
      }
      if (config.urgencyCustomMessage) {
        message = config.urgencyCustomMessage
      }
    }

    const theme = config.urgencyThemeColor || "red"
    const showProgress = config.urgencyShowProgressBar !== false
    const progressPercent = config.urgencyProgressPercent || Math.min(95, Math.max(65, 100 - stock * 4))
    const buttonText = config.urgencyButtonText || "Ver Producto"

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
            aria-label="Alerta de agotamiento de producto"
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className={`fixed z-40 w-[calc(100vw-2rem)] max-w-sm sm:max-w-[400px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border ${themeStyles.border} ${themeStyles.glow} rounded-2xl p-4 sm:p-4.5 ${positionClasses}`}
          >
            <button
              onClick={handleClose}
              aria-label="Cerrar aviso"
              className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badge superior */}
            <div className="flex items-center gap-2 mb-3 pr-6">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-xs ${themeStyles.badgeBg}`}>
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                <span>{badge}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <Eye className="w-3 h-3 text-red-500 animate-pulse" />
                <span>{socialProof} viendo esto</span>
              </span>
            </div>

            {/* Contenido */}
            <Link href={targetUrl} onClick={() => handleClose()} className="group block">
              <div className="flex items-start gap-3.5">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border group-hover:scale-105 transition-transform duration-300">
                  <Image src={imageUrl} alt={title} fill className="object-cover" sizes="80px" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                    {message}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${themeStyles.pulseColor} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${themeStyles.pulseColor}`} />
                    </span>
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                      ¡Solo quedan {stock} {stockUnit}!
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Barra de progreso */}
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

            {/* Botón CTA */}
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

  // =========================================================================
  // RENDER: POPUP 2 - NUEVAS PROMOCIONES Y OFERTAS
  // =========================================================================
  if (activeType === "promo") {
    const isAutoPromo = config.promoMode === "auto"
    const autoOffer = fallbackOfferProducts.length > 0 ? fallbackOfferProducts[0] : null

    let promoTitle = config.promoTitle || "¡Aprovecha nuestras nuevas promociones!"
    let promoDesc = config.promoDescription || "Descubre descuentos exclusivos en textiles seleccionados por tiempo limitado."
    let promoBadge = config.promoBadgeText || "15% OFF"
    let promoImage = config.promoImageUrl || "/og-image.png"
    let promoBtnText = config.promoButtonText || "Ver Ofertas"
    let promoBtnUrl = config.promoButtonUrl || "/tienda"

    if (isAutoPromo && autoOffer) {
      promoTitle = `¡Oferta Especial en ${autoOffer.name}!`
      promoBadge = "🔥 NUEVA OFERTA"
      promoImage = autoOffer.image || promoImage
      promoBtnUrl = `/producto/${autoOffer.slug}`
      promoDesc = "Lleva este textil con descuento exclusivo antes de que termine la promoción."
    } else if (config.promoProduct) {
      promoTitle = config.promoTitle || config.promoProduct.title || promoTitle
      promoImage = config.promoImageUrl || config.promoProduct.imageUrl || promoImage
      promoBtnUrl = config.promoButtonUrl || `/producto/${config.promoProduct.slug}`
    }

    const isModal = (config.promoDisplayType || "modal") === "modal"

    return (
      <>
        {/* Etiqueta flotante lateral si está minimizado en modo modal */}
        <AnimatePresence>
          {showPromoBadge && !isVisible && isModal && (
            <motion.button
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => setIsVisible(true)}
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "translateY(-50%)",
              }}
              className="fixed right-0 top-1/2 z-50 bg-gradient-to-b from-primary to-primary/90 text-white font-bold py-4 px-2.5 rounded-r-none rounded-l-2xl shadow-[-4px_0_20px_rgba(0,0,0,0.2)] hover:bg-primary/95 flex items-center justify-center transition-all hover:pl-4 border border-r-0 border-white/20"
            >
              <span className="text-xs md:text-sm tracking-widest uppercase flex items-center gap-1.5 whitespace-nowrap">
                <Gift className="w-3.5 h-3.5 mb-1" />
                {promoBadge}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Modal Central o Tarjeta Flotante */}
        <AnimatePresence>
          {isVisible && (
            isModal ? (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleClose}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                  className="relative w-full max-w-[850px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 max-h-[90vh] border border-border"
                >
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-lg"
                    aria-label="Cerrar ventana promocional"
                  >
                    <X size={18} />
                  </button>

                  {/* Imagen Promo */}
                  <div className="w-full md:w-1/2 relative min-h-[220px] sm:min-h-[280px] md:min-h-[460px] bg-muted">
                    <Image
                      src={promoImage}
                      alt={promoTitle}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {promoBadge}
                    </div>
                  </div>

                  {/* Contenido Promo */}
                  <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center overflow-y-auto">
                    <div className="text-center md:text-left mb-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                        {promoTitle}
                      </h3>
                      {promoDesc && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {promoDesc}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 mt-2">
                      <Link
                        href={promoBtnUrl}
                        onClick={handleClose}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-6 rounded-xl transition-all text-sm sm:text-base tracking-wide shadow-md flex items-center justify-center gap-2 group"
                      >
                        <span>{promoBtnText}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <button
                        onClick={handleClose}
                        className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium text-center"
                      >
                        Continuar navegando
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Tarjeta Flotante Esquina */
              <motion.aside
                initial={{ opacity: 0, y: 50, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className={`fixed z-40 w-[calc(100vw-2rem)] max-w-sm sm:max-w-[380px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-primary/30 shadow-xl rounded-2xl p-4 ${positionClasses}`}
              >
                <button
                  onClick={handleClose}
                  aria-label="Cerrar promoción"
                  className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2.5 pr-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary text-primary-foreground shadow-xs">
                    <Tag className="w-3 h-3" />
                    {promoBadge}
                  </span>
                </div>

                <Link href={promoBtnUrl} onClick={handleClose} className="group block">
                  <div className="flex items-start gap-3">
                    <div className="relative w-18 h-18 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border group-hover:scale-105 transition-transform duration-300">
                      <Image src={promoImage} alt={promoTitle} fill className="object-cover" sizes="80px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {promoTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {promoDesc}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="mt-3">
                  <Link
                    href={promoBtnUrl}
                    onClick={handleClose}
                    className="w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-xs group"
                  >
                    <span>{promoBtnText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.aside>
            )
          )}
        </AnimatePresence>
      </>
    )
  }

  return null
}
