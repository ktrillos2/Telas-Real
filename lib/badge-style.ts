import type { CSSProperties } from "react"
import { textStyle, isColor } from "./text-styles"

/**
 * Estilo de la etiqueta (badge) de un producto, editable por producto y desde la Edición Masiva.
 * Sin estilo se ve como siempre: píldora roja (#E50914), letra blanca en negrita y mayúsculas.
 */
export interface BadgeStyle {
  bgColor?: string | null
  textColor?: string | null
  font?: string | null
  effect?: string | null
  effectColor?: string | null
  shape?: "pill" | "rounded" | "square" | null
}

export const DEFAULT_BADGE_BG = "#E50914"
export const DEFAULT_BADGE_TEXT = "#ffffff"

export const BADGE_SHAPES = [
  { title: "Píldora", value: "pill" },
  { title: "Redondeada", value: "rounded" },
  { title: "Recta", value: "square" },
] as const

/** Estilos en línea de la etiqueta (fondo, color, tipografía, efecto y forma). */
export function badgeInlineStyle(style?: BadgeStyle | null): CSSProperties {
  const s = style || {}
  const bg = isColor(s.bgColor) ? s.bgColor : DEFAULT_BADGE_BG
  const color = isColor(s.textColor) ? s.textColor : DEFAULT_BADGE_TEXT
  // "Resaltado" en la etiqueta = borde de color; el fondo ya es la etiqueta
  const effect = s.effect === "highlight" ? "none" : s.effect
  const text = textStyle({ color, font: s.font, effect, effectColor: s.effectColor })
  const out: CSSProperties = {
    ...text,
    backgroundColor: bg,
    borderRadius: s.shape === "square" ? 3 : s.shape === "rounded" ? 8 : 9999,
  }
  if (s.effect === "highlight") {
    out.boxShadow = `0 0 0 2px ${isColor(s.effectColor) ? s.effectColor : "#ffffff"}, 0 2px 6px rgba(0,0,0,.25)`
  }
  if (s.effect === "neon") {
    const glow = isColor(s.effectColor) ? s.effectColor : bg
    out.boxShadow = `0 0 6px ${glow}, 0 0 14px ${glow}`
  }
  return out
}

/** ¿Tiene algún estilo propio? (si no, se usa el estilo de siempre) */
export const hasBadgeStyle = (s?: BadgeStyle | null) =>
  !!s && !!(s.bgColor || s.textColor || (s.font && s.font !== "default") || (s.effect && s.effect !== "none") || (s.shape && s.shape !== "pill"))
