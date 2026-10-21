"use client"

import React, { useMemo } from "react"
import {
  Ruler,
  Scissors,
  Scale,
  Sparkles,
  Package,
  Layers,
  Printer,
  CheckCircle2,
  Truck,
  Palette,
  FileText,
  BadgeCheck,
  Zap,
  Weight,
  Droplets,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ProductSpecSheetProps {
  product: {
    id?: string
    name: string
    title?: string
    slug?: string
    price?: number
    sale_price?: number
    pricePerKilo?: number
    rendimiento?: string | null
    attributes?: Array<{
      id?: string | number
      name: string
      value: string
      visible?: boolean
      terms?: Array<{ name: string }>
    }>
    categories?: Array<{
      id?: string
      name: string
      slug?: string | { current: string }
      rendimiento?: string
      pricePerKilo?: number
    }>
    usages?: Array<{
      title: string
      slug?: string | { current: string }
    }>
    shipping?: {
      weightKg?: number
      heightCm?: number
      widthCm?: number
      lengthCm?: number
    } | null
    weight?: string | number
    dimensions?: {
      length: string | number
      width: string | number
      height: string | number
    }
    designSelectionEnabled?: boolean
    stockStatus?: string
    stock_status?: string
    is_in_stock?: boolean
    short_description?: string
  }
}

// Convierte "1.55 metros", "1,50 m" o "150 cm" a metros
function parseWidthMeters(value?: string): number | null {
  if (!value) return null
  const match = value.replace(",", ".").match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const num = parseFloat(match[1])
  if (!num) return null
  return /cm/i.test(value) || num > 10 ? num / 100 : num
}

function parseNumber(value?: string | number | null): number | null {
  if (value === null || value === undefined) return null
  const match = String(value).replace(",", ".").match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) || null : null
}

// Recomendaciones generales de cuidado según la composición declarada
function careRecommendations(composicion?: string, sublimable?: boolean): string[] {
  const comp = (composicion || "").toLowerCase()
  const tips: string[] = []
  if (/algod[oó]n|lino|viscosa|ray[oó]n/.test(comp)) {
    tips.push("Lavar en agua fría o tibia con colores similares; puede presentar un leve encogimiento en el primer lavado.")
  } else {
    tips.push("Lavar a mano o en ciclo delicado con agua fría y colores similares.")
  }
  tips.push("No usar blanqueador ni cloro; usar detergente suave.")
  if (/spandex|elastano|lycra|licra/.test(comp)) {
    tips.push("Evitar secadora y calor directo para conservar la elasticidad; secar a la sombra.")
  } else {
    tips.push("Secar a la sombra y evitar la exposición prolongada al sol para conservar el color.")
  }
  if (/poli[eé]ster|nylon|nail[oó]n|poliamida/.test(comp) || sublimable) {
    tips.push("Planchar a baja temperatura, por el revés de la tela.")
  } else {
    tips.push("Planchar a temperatura media, por el revés de la tela.")
  }
  tips.push("Antes de confeccionar, se recomienda prelavar una muestra para verificar el comportamiento del tejido.")
  return tips
}

export function ProductSpecSheet({ product }: ProductSpecSheetProps) {
  // Extraer atributos visibles reales
  const visibleAttributes = useMemo(() => {
    if (!product?.attributes || !Array.isArray(product.attributes)) return []
    return product.attributes.filter(
      (attr) => attr && attr.visible !== false && attr.name && (attr.value || attr.terms?.length)
    )
  }, [product?.attributes])

  // Helpers para obtener valores específicos de atributos si existen
  const getAttrValue = (regex: RegExp) => {
    const found = visibleAttributes.find((a) => regex.test(a.name.trim()))
    if (!found) return undefined
    if (found.value) return String(found.value).trim()
    if (found.terms && found.terms.length > 0) return found.terms.map((t) => t.name).join(", ")
    return undefined
  }

  const ancho = getAttrValue(/^ancho/i)
  const composicion = getAttrValue(/^composici[oó]n/i)
  const elasticidad = getAttrValue(/^elasticidad/i)
  const tacto = getAttrValue(/^tacto/i)
  const presentacion = getAttrValue(/^presentaci[oó]n/i)
  const tipoHilado = getAttrValue(/^tipo\s+de\s+hilado/i)
  const gramajeAttr = getAttrValue(/^(gramaje|peso\s*(por\s*)?(m2|m²|metro))/i)
  const cuidadosAttr = getAttrValue(/^(cuidado|cuidados|instrucciones\s+de\s+lavado|lavado)/i)

  // Rendimiento y precio por kilo
  const rendimiento =
    product.rendimiento ||
    product.categories?.find((c) => c.rendimiento)?.rendimiento ||
    null

  const pricePerKilo =
    product.pricePerKilo ||
    product.categories?.find((c) => c.pricePerKilo)?.pricePerKilo ||
    null

  // Gramaje: dato registrado o estimación (g/m²) = 1000 / (rendimiento m/kg × ancho m)
  const estimatedGsm = (() => {
    if (gramajeAttr) return null
    const widthM = parseWidthMeters(ancho)
    const yieldMKg = parseNumber(rendimiento)
    if (!widthM || !yieldMKg) return null
    const gsm = Math.round(1000 / (yieldMKg * widthM))
    return gsm > 20 && gsm < 1000 ? gsm : null
  })()
  const gramaje = gramajeAttr || (estimatedGsm ? `${estimatedGsm} g/m² aprox.` : undefined)
  const careTips = cuidadosAttr
    ? cuidadosAttr.split(/\n|;|\. /).map((t) => t.trim()).filter(Boolean)
    : careRecommendations(composicion, product.designSelectionEnabled)

  // Usos reales
  const usages = useMemo(() => {
    if (!product.usages || !Array.isArray(product.usages)) return []
    return product.usages.filter((u) => u && u.title)
  }, [product.usages])

  // Categorías reales
  const categories = useMemo(() => {
    if (!product.categories || !Array.isArray(product.categories)) return []
    return product.categories.filter((c) => c && c.name)
  }, [product.categories])

  // Dimensiones y peso de envío
  const weightKg = product.shipping?.weightKg || (product.weight ? Number(product.weight) : undefined)
  const hasDimensions = Boolean(
    (product.shipping?.lengthCm && product.shipping?.widthCm && product.shipping?.heightCm) ||
    (product.dimensions?.length && product.dimensions?.width && product.dimensions?.height)
  )
  const dimensionsStr = product.shipping?.lengthCm
    ? `${product.shipping.lengthCm} × ${product.shipping.widthCm} × ${product.shipping.heightCm} cm`
    : product.dimensions?.length
    ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`
    : undefined

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  // Tarjetas destacadas superiores (solo si el dato existe)
  const highlightCards = [
    ancho && {
      icon: Ruler,
      label: "Ancho Útil",
      value: ancho.includes("metro") || ancho.includes("m") || ancho.includes("cm") ? ancho : `${ancho} metros`,
      detail: "Ancho total del tejido",
    },
    composicion && {
      icon: Scissors,
      label: "Composición",
      value: composicion,
      detail: "Fibras y estructura textil",
    },
    rendimiento && {
      icon: Scale,
      label: "Rendimiento Aprox.",
      value: String(rendimiento).includes("m") ? rendimiento : `${rendimiento} m / kg`,
      detail: "Metros lineales por cada kilo",
    },
    gramaje && {
      icon: Weight,
      label: "Gramaje",
      value: gramaje,
      detail: gramajeAttr ? "Peso de la tela por metro cuadrado" : "Calculado con ancho y rendimiento",
    },
    elasticidad && {
      icon: Sparkles,
      label: "Elasticidad",
      value: elasticidad,
      detail: "Nivel de elongación y memoria",
    },
    presentacion && {
      icon: Package,
      label: "Presentación",
      value: presentacion,
      detail: "Formato de comercialización",
    },
    tipoHilado && {
      icon: Layers,
      label: "Tipo de Hilado",
      value: tipoHilado,
      detail: "Proceso de hilatura textil",
    },
    tacto && {
      icon: Zap,
      label: "Tacto y Sensación",
      value: tacto,
      detail: "Acabado al contacto",
    },
  ].filter(Boolean) as Array<{
    icon: any
    label: string
    value: string
    detail: string
  }>

  return (
    <section
      aria-label={`Ficha técnica de ${product.name}`}
      className="ficha-tecnica-printable space-y-6 sm:space-y-8 bg-card border border-border/80 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm transition-all"
    >
      {/* Encabezado de la Ficha Técnica */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-border">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider px-2.5 sm:px-3 py-1 bg-primary/10 text-primary rounded-full">
              <FileText className="w-3.5 h-3.5" />
              Ficha Técnica Oficial
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
              Telas Real
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-foreground">
            {product.name}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-light mt-1">
            Parámetros técnicos y especificaciones suministradas directamente por el catálogo textil.
          </p>
        </div>

        {/* Botón de impresión limpia de ficha técnica */}
        <div className="flex-shrink-0 no-print w-full sm:w-auto">
          <Button
            type="button"
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm h-11 sm:h-10 px-4 rounded-xl border-border/80 hover:border-primary/50 hover:bg-muted/50 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha Técnica</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave (Solo las existentes) */}
      {highlightCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          {highlightCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <div
                key={idx}
                className="p-3 sm:p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {card.label}
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base md:text-lg font-medium text-foreground leading-snug break-words">
                    {card.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-light mt-0.5 line-clamp-2">
                    {card.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabla Estructurada de Especificaciones Técnicas (Stack en móvil, 2 columnas en desktop) */}
      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-base sm:text-lg md:text-xl font-light text-foreground flex items-center gap-2">
          <span>Detalle de Especificaciones</span>
        </h3>

        <div className="overflow-hidden border border-border rounded-xl bg-card">
          <table className="w-full text-left text-sm border-collapse">
            <tbody className="divide-y divide-border">
              {/* Atributos Textiles Registrados */}
              {visibleAttributes.map((attr, idx) => {
                const val =
                  attr.value ||
                  (attr.terms && attr.terms.length > 0
                    ? attr.terms.map((t) => t.name).join(", ")
                    : "")
                return (
                  <tr
                    key={attr.id || idx}
                    className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0"
                  >
                    <th
                      scope="row"
                      className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                    >
                      {attr.name}
                    </th>
                    <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                      {val}
                    </td>
                  </tr>
                )
              })}

              {/* Rendimiento (si no estaba en attributes o como complemento técnico) */}
              {rendimiento && (
                <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                  <th
                    scope="row"
                    className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                  >
                    Rendimiento Estimado
                  </th>
                  <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-primary">
                        {String(rendimiento).includes("m")
                          ? rendimiento
                          : `${rendimiento} m / kilo aprox.`}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                        Metros aproximados por kilogramo en ancho útil estándar.
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Precio / Facturación por Kilo (si aplica) */}
              {pricePerKilo && pricePerKilo > 0 && (
                <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                  <th
                    scope="row"
                    className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                  >
                    Facturación por Kilo
                  </th>
                  <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                    <span className="font-medium text-foreground">
                      ${pricePerKilo.toLocaleString("es-CO")} COP / kilo
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground block mt-0.5">
                      Aplica a compras por rollo cerrado y mayoristas. En la tienda en línea se paga el precio por metro publicado (corte a la medida).
                    </span>
                  </td>
                </tr>
              )}

              {/* Gramaje estimado (si no está registrado como atributo) */}
              {estimatedGsm && (
                <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                  <th
                    scope="row"
                    className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                  >
                    Gramaje Estimado
                  </th>
                  <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{estimatedGsm} g/m² aprox.</span>
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                        Calculado a partir del ancho útil y el rendimiento por kilo; puede variar según el lote.
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Usos y Confección recomendada */}
              {usages.length > 0 && (
                <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                  <th
                    scope="row"
                    className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                  >
                    Usos y Aplicaciones
                  </th>
                  <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                    <div className="flex flex-wrap gap-1.5 py-0.5 sm:py-1">
                      {usages.map((u, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-[11px] sm:text-xs font-normal"
                        >
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          {u.title}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {/* Categorías */}
              {categories.length > 0 && (
                <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                  <th
                    scope="row"
                    className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                  >
                    Familia / Categoría
                  </th>
                  <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                    <div className="flex flex-wrap gap-1.5 py-0.5">
                      {categories.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full border border-border text-[11px] sm:text-xs text-muted-foreground"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {/* Sublimación / Estampación Digital */}
              {product.designSelectionEnabled && (
                <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                  <th
                    scope="row"
                    className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                  >
                    Estampación Digital
                  </th>
                  <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Palette className="w-4 h-4 flex-shrink-0" />
                      <span>Apto para Sublimación y Estampación Personalizada</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Logística y Envío */}
              {(weightKg || hasDimensions) && (
                <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                  <th
                    scope="row"
                    className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                  >
                    Datos Logísticos
                  </th>
                  <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                    <div className="flex flex-col gap-1">
                      {weightKg && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Truck className="w-3.5 h-3.5" />
                          Peso unitario estimado: <strong className="text-foreground font-medium">{weightKg} kg</strong>
                        </span>
                      )}
                      {dimensionsStr && (
                        <span className="text-muted-foreground">
                          Dimensiones de embalaje: <strong className="text-foreground font-medium">{dimensionsStr}</strong>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Disponibilidad */}
              <tr className="flex flex-col sm:table-row hover:bg-muted/30 transition-colors py-3 sm:py-0 px-3.5 sm:px-0">
                <th
                  scope="row"
                  className="sm:py-3.5 sm:px-6 sm:w-1/3 text-xs sm:text-sm font-semibold sm:font-medium text-foreground sm:text-muted-foreground sm:bg-muted/10 pb-1 sm:pb-3.5"
                >
                  Disponibilidad de Stock
                </th>
                <td className="sm:py-3.5 sm:px-6 text-xs sm:text-sm font-normal text-muted-foreground sm:text-foreground">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                      product.is_in_stock !== false
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {product.is_in_stock !== false
                      ? "En Stock — Disponible para despacho nacional"
                      : "Agotado temporalmente"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cuidados del tejido */}
      {careTips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg md:text-xl font-light text-foreground flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            <span>{cuidadosAttr ? "Cuidados de la Tela" : "Recomendaciones Generales de Cuidado"}</span>
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {careTips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground font-light p-3 rounded-lg border border-border/60 bg-muted/10"
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nota técnica de pie */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground font-light leading-relaxed flex items-start gap-3">
        <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-0.5">
            Nota de Calidad Textil Telas Real
          </p>
          <p>
            Los datos reflejados en esta ficha técnica corresponden a las especificaciones físicas y
            químicas del tejido. Los rendimientos en metros por kilo son aproximados y pueden presentar
            variaciones mínimas normales de lote según las condiciones de hilatura y fijación del tinte.
          </p>
        </div>
      </div>
    </section>
  )
}
