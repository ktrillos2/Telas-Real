"use client"

import React, { useMemo } from "react"
import {
  Printer,
  CheckCircle2,
  Truck,
  Palette,
  FileText,
  BadgeCheck,
  Droplets,
  Download,
  ZoomIn,
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
    specSheetImage?: {
      url: string
      alt?: string
      width?: number
      height?: number
    } | null
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Documento HTML autónomo (A4) para imprimir o guardar como PDF la ficha técnica. */
export function buildPrintableSpecSheet(data: {
  name: string
  url: string
  logoUrl: string
  rows: Array<[string, string]>
  careTips: string[]
  careTitle: string
  sheetImage: string | null
}): string {
  const date = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
  const rowsHtml = data.rows
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join("")
  const careHtml = data.careTips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Ficha técnica - ${escapeHtml(data.name)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; color: #1f2937; font-size: 11pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0f766e; padding-bottom: 10px; margin-bottom: 18px; }
  header img { height: 44px; }
  header .meta { text-align: right; font-size: 9pt; color: #6b7280; }
  header .meta strong { display: block; font-size: 12pt; color: #0f766e; letter-spacing: .08em; text-transform: uppercase; }
  h1 { font-size: 20pt; font-weight: 600; margin: 0 0 4px; color: #111827; }
  .subtitle { color: #6b7280; font-size: 9.5pt; margin: 0 0 18px; }
  h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: .06em; color: #0f766e; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db; }
  table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th, td { text-align: left; vertical-align: top; padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  th { width: 34%; font-weight: 600; color: #374151; background: #f3f4f6; }
  ul { margin: 0; padding-left: 18px; }
  li { margin: 3px 0; }
  .sheet { margin-top: 8px; text-align: center; page-break-inside: avoid; }
  .sheet img { max-width: 100%; max-height: 210mm; border: 1px solid #e5e7eb; }
  .note { margin-top: 20px; padding: 10px 12px; border-left: 4px solid #0f766e; background: #f0fdfa; font-size: 9.5pt; color: #374151; page-break-inside: avoid; }
  footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #d1d5db; font-size: 8.5pt; color: #6b7280; display: flex; justify-content: space-between; gap: 12px; }
</style>
</head>
<body>
  <header>
    <img src="${escapeHtml(data.logoUrl)}" alt="Telas Real">
    <div class="meta"><strong>Ficha técnica</strong>Emitida el ${escapeHtml(date)}</div>
  </header>

  <h1>${escapeHtml(data.name)}</h1>
  <p class="subtitle">Parámetros técnicos y especificaciones del tejido · Telas Real S.A.S.</p>

  ${rowsHtml ? `<h2>Especificaciones técnicas</h2><table>${rowsHtml}</table>` : ""}

  ${careHtml ? `<h2>${escapeHtml(data.careTitle)}</h2><ul>${careHtml}</ul>` : ""}

  ${data.sheetImage ? `<h2>Ficha del fabricante</h2><div class="sheet"><img src="${escapeHtml(data.sheetImage)}" alt="Ficha técnica de ${escapeHtml(data.name)}"></div>` : ""}

  <div class="note">
    <strong>Nota de calidad textil:</strong> los datos de esta ficha corresponden a las especificaciones físicas y químicas del tejido.
    Los rendimientos en metros por kilo son aproximados y pueden presentar variaciones mínimas normales de lote según las condiciones
    de hilatura y fijación del tinte.
  </div>

  <footer>
    <span>Telas Real S.A.S. · NIT 901232650-1 · Calle 12 # 38-65, Bogotá</span>
    <span>telasreal.com · WhatsApp +57 315 902 1516</span>
  </footer>
  ${data.url ? `<p style="font-size:8pt;color:#9ca3af;margin-top:6px;word-break:break-all">${escapeHtml(data.url)}</p>` : ""}
</body>
</html>`
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

  // Imprime / guarda como PDF un documento propio de la ficha técnica (A4, estructurado),
  // en lugar de imprimir toda la página del producto.
  const handlePrint = () => {
    if (typeof window === "undefined") return

    const attributeRows = visibleAttributes.map((attr) => [
      attr.name,
      String(attr.value || (attr.terms && attr.terms.length > 0 ? attr.terms.map((t) => t.name).join(", ") : "")),
    ])
    const hasAttr = (re: RegExp) => visibleAttributes.some((a) => re.test(a.name))
    const rows: Array<[string, string]> = [
      ...(attributeRows as Array<[string, string]>),
      ...(rendimiento && !hasAttr(/^rendimiento/i)
        ? [["Rendimiento estimado", String(rendimiento).includes("m") ? String(rendimiento) : `${rendimiento} m / kilo aprox.`] as [string, string]]
        : []),
      ...(estimatedGsm ? [["Gramaje estimado", `${estimatedGsm} g/m² aprox. (calculado con ancho y rendimiento)`] as [string, string]] : []),
      ...(pricePerKilo && pricePerKilo > 0 ? [["Precio por kilo", `$${pricePerKilo.toLocaleString("es-CO")} COP`] as [string, string]] : []),
      ...(usages.length > 0 ? [["Usos y aplicaciones", usages.map((u) => u.title).join(", ")] as [string, string]] : []),
      ...(categories.length > 0 ? [["Familia / categoría", categories.map((c) => c.name).join(", ")] as [string, string]] : []),
      ...(product.designSelectionEnabled ? [["Estampación digital", "Apto para sublimación y estampación personalizada"] as [string, string]] : []),
      ...(weightKg ? [["Peso unitario estimado", `${weightKg} kg`] as [string, string]] : []),
      ...(dimensionsStr ? [["Dimensiones de embalaje", dimensionsStr] as [string, string]] : []),
    ].filter(([, v]) => v && v.trim() !== "")

    const html = buildPrintableSpecSheet({
      name: product.name,
      url: typeof window !== "undefined" ? window.location.href.split("#")[0] : "",
      logoUrl: `${window.location.origin}/logo-loading.png`,
      rows,
      careTips,
      careTitle: cuidadosAttr ? "Cuidados de la tela" : "Recomendaciones generales de cuidado",
      sheetImage: product.specSheetImage?.url ? `${product.specSheetImage.url}?auto=format&w=1600&q=90` : null,
    })

    // Iframe oculto: no abre ventanas nuevas (evita bloqueadores) y no cambia la página actual
    const iframe = document.createElement("iframe")
    iframe.setAttribute("aria-hidden", "true")
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;"
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    if (!doc || !iframe.contentWindow) {
      window.print()
      return
    }
    doc.open()
    doc.write(html)
    doc.close()

    const printWhenReady = () => {
      const images = Array.from(doc.images)
      Promise.all(
        images.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r })))
      ).then(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => iframe.remove(), 1500)
      })
    }
    if (doc.readyState === "complete") printWhenReady()
    else iframe.onload = printWhenReady
  }

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
            <span>Imprimir / Descargar PDF</span>
          </Button>
        </div>
      </div>

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
                      En la tienda en línea se paga el precio por metro publicado (corte a la medida).
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

      {/* Imagen de la ficha técnica (cargada desde Sanity / Edición Masiva) */}
      {product.specSheetImage?.url && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg md:text-xl font-light text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Ficha Técnica del Fabricante</span>
          </h3>
          <a
            href={`${product.specSheetImage.url}?auto=format`}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl border border-border bg-white hover:border-primary/40 transition-colors"
            title="Ver ficha técnica en tamaño completo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${product.specSheetImage.url}?auto=format&w=1200&q=85`}
              alt={product.specSheetImage.alt || `Ficha técnica de ${product.name}`}
              width={product.specSheetImage.width || undefined}
              height={product.specSheetImage.height || undefined}
              loading="lazy"
              className="w-full h-auto"
            />
          </a>
          <div className="flex flex-wrap gap-3 no-print">
            <a
              href={`${product.specSheetImage.url}?auto=format`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary hover:underline"
            >
              <ZoomIn className="w-4 h-4" /> Ver en tamaño completo
            </a>
            <a
              href={`${product.specSheetImage.url}?dl=`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary hover:underline"
            >
              <Download className="w-4 h-4" /> Descargar ficha técnica
            </a>
          </div>
        </div>
      )}

      {/* Nota técnica de pie */}
      <div className="p-4 sm:p-5 rounded-xl bg-muted/30 border border-border/60 text-sm sm:text-base text-muted-foreground font-light leading-relaxed flex items-start gap-3">
        <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-base sm:text-lg font-medium text-foreground mb-1">
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
