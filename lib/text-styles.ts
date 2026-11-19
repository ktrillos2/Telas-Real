import type { CSSProperties } from "react"

/**
 * Tipografías y efectos de texto editables desde Sanity (cinta superior, popups).
 * Las fuentes se cargan en app/layout.tsx como variables CSS (sin precarga: solo se descargan si se usan).
 */
export const FONT_OPTIONS = [
  { title: "Por defecto de la web (Questrial)", value: "default" },
  { title: "Moderna (Montserrat)", value: "modern" },
  { title: "Titular alta (Bebas Neue)", value: "display" },
  { title: "Elegante (Playfair Display)", value: "elegant" },
  { title: "Manuscrita (Pacifico)", value: "script" },
  { title: "Neón (Tilt Neon)", value: "neon" },
] as const

export type FontKey = (typeof FONT_OPTIONS)[number]["value"]

const FONT_FAMILY: Record<string, string> = {
  modern: "var(--font-modern), system-ui, sans-serif",
  display: "var(--font-display), Impact, sans-serif",
  elegant: "var(--font-elegant), Georgia, serif",
  script: "var(--font-script), cursive",
  neon: "var(--font-neon), system-ui, sans-serif",
}

export function fontFamilyFor(font?: string | null): string | undefined {
  return font && font !== "default" ? FONT_FAMILY[font] : undefined
}

export const EFFECT_OPTIONS = [
  { title: "Ninguno", value: "none" },
  { title: "Neón (brillo)", value: "neon" },
  { title: "Resaltado (fondo de color)", value: "highlight" },
  { title: "Sombra suave", value: "shadow" },
] as const

const HEX = /^#[0-9a-fA-F]{6}$/
export const isColor = (c?: string | null): c is string => !!c && HEX.test(c)

/** Estilo de un texto con color, fuente y efecto. El color de neón por defecto es el del texto. */
export function textStyle(opts: {
  color?: string | null
  font?: string | null
  effect?: string | null
  effectColor?: string | null
  bold?: boolean | null
  italic?: boolean | null
}): CSSProperties {
  const s: CSSProperties = {}
  if (isColor(opts.color)) s.color = opts.color
  const ff = fontFamilyFor(opts.font)
  if (ff) s.fontFamily = ff
  if (opts.bold) s.fontWeight = 700
  if (opts.italic) s.fontStyle = "italic"
  const glow = isColor(opts.effectColor) ? opts.effectColor : isColor(opts.color) ? opts.color : "#ff2bd6"
  switch (opts.effect) {
    case "neon":
      s.textShadow = `0 0 2px #fff, 0 0 6px ${glow}, 0 0 12px ${glow}, 0 0 22px ${glow}`
      break
    case "highlight":
      s.backgroundColor = glow
      s.padding = "1px 6px"
      s.borderRadius = 4
      s.boxDecorationBreak = "clone"
      break
    case "shadow":
      s.textShadow = "0 1px 2px rgba(0,0,0,.35)"
      break
  }
  return s
}

export interface TextSegment {
  _key?: string
  text?: string
  color?: string
  bold?: boolean
  italic?: boolean
  font?: string
  effect?: string
  effectColor?: string
}
