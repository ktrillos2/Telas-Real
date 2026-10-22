/**
 * Grupos de colores automáticos por nombre.
 *
 * Telas que no están en las configuraciones fijas de lib/unified-fabrics.ts (Brush, Satín, Rib...)
 * se agrupan con el campo `colorGroup` del producto en Sanity. La herramienta
 * "Agrupar Colores" del admin lo propone a partir del nombre:
 *   "Jacquard Fit Negro X Metros | Tela Texturizada"  →  grupo "Jacquard Fit", color "Negro"
 *   "Lino Poliester Crudo PFD X Metros"               →  grupo "Lino Poliester PFD", color "Crudo"
 */

// Colores base (sin tildes, en minúscula)
const COLOR_WORDS = new Set([
  "negro", "blanco", "crudo", "hueso", "marfil", "beige", "arena", "camel", "kaki", "caqui", "nude",
  "rojo", "vino", "vinotinto", "tinto", "guinda", "cereza", "coral", "salmon", "durazno", "melon",
  "naranja", "mandarina", "amarillo", "mostaza", "ocre", "dorado", "oro", "plata", "plateado",
  "verde", "oliva", "militar", "menta", "esmeralda", "jade", "lima", "pistacho", "biche", "botella",
  "azul", "celeste", "turquesa", "aguamarina", "petroleo", "marino", "navy", "indigo", "cielo", "agua",
  "morado", "lila", "lavanda", "purpura", "violeta", "uva", "berenjena", "magenta", "fucsia",
  "rosado", "rosa", "palo", "chicle", "bebe",
  "cafe", "chocolate", "marron", "tabaco", "terracota", "ladrillo", "cobre", "mocca", "moka", "taupe",
  "gris", "grafito", "plomo", "ratón", "raton", "humo", "perla", "acero", "carbon",
  "neon", "pastel", "claro", "oscuro", "medio", "rey", "fluorescente", "jaspe", "jaspeado", "quemado",
  "new", "brillante", "intenso",
])

// Palabras que solo cuentan como color si van junto a un color (ej. "Azul Rey", "Rosa Palo")
const MODIFIER_WORDS = new Set(["rey", "palo", "claro", "oscuro", "medio", "pastel", "neon", "bebe", "agua", "botella", "brillante", "intenso", "quemado"])

// Productos que nunca se agrupan por color
const EXCLUDED = /\b(hilos?|tijeras?|sublimad[oa]s?|kits?|agujas?|cintas?|botones|cremalleras?|elasticos?|reatas?|marquillas?|muestrario|tarjeta|bono)\b/i

export function normalizeText(text: unknown): string {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Clave para comparar grupos sin importar mayúsculas, tildes ni espacios. */
export function colorGroupKey(group: unknown): string {
  return normalizeText(group)
}

function splitTitle(title: string): { head: string; tail: string } {
  const clean = title.replace(/\s+/g, " ").trim()
  const xMetros = clean.match(/\s+x\s+metros?\b/i)
  if (xMetros && xMetros.index !== undefined) {
    return { head: clean.slice(0, xMetros.index), tail: clean.slice(xMetros.index) }
  }
  const pipe = clean.indexOf("|")
  if (pipe >= 0) return { head: clean.slice(0, pipe).trim(), tail: " " + clean.slice(pipe) }
  return { head: clean, tail: "" }
}

export type ColorGroupSuggestion = { group: string; color: string }

/**
 * Propone grupo y color a partir del nombre. Devuelve null si el producto no se debe agrupar
 * (hilos, tijeras, sublimados...) o si en el nombre no se reconoce un color.
 * `toneTitles`: tonos asignados en Sanity; si el nombre contiene uno, se usa como color.
 */
export function suggestColorGroup(title: unknown, toneTitles: unknown[] = []): ColorGroupSuggestion | null {
  const raw = String(title ?? "").trim()
  if (!raw || EXCLUDED.test(normalizeText(raw))) return null

  const { head } = splitTitle(raw)
  const words = head.replace(/^tela\s+/i, "").split(" ").filter(Boolean)
  if (words.length < 2) return null
  const norm = words.map((w) => normalizeText(w).replace(/[^a-z0-9]/g, ""))

  // 1. Tono de Sanity escrito en el nombre (ej. "Verde Oliva")
  for (const tone of toneTitles) {
    const toneWords = normalizeText(tone).split(" ").filter(Boolean)
    if (toneWords.length === 0) continue
    for (let i = 1; i + toneWords.length <= norm.length; i++) {
      if (toneWords.every((tw, j) => norm[i + j] === tw)) {
        return build(words, i, i + toneWords.length)
      }
    }
  }

  // 2. Secuencia más larga de palabras de color (nunca la primera palabra: es el nombre de la tela)
  let best: [number, number] | null = null
  for (let i = 1; i < norm.length; i++) {
    if (!COLOR_WORDS.has(norm[i])) continue
    let j = i
    while (j < norm.length && COLOR_WORDS.has(norm[j])) j++
    // Una secuencia solo de modificadores ("Rey", "Claro") no es un color
    const run = norm.slice(i, j)
    if (run.every((w) => MODIFIER_WORDS.has(w))) { i = j; continue }
    if (!best || j - i > best[1] - best[0]) best = [i, j]
    i = j
  }
  if (!best) return null
  return build(words, best[0], best[1])
}

function build(words: string[], from: number, to: number): ColorGroupSuggestion | null {
  const color = words.slice(from, to).join(" ")
  const group = [...words.slice(0, from), ...words.slice(to)].join(" ").replace(/\s+/g, " ").trim()
  if (!group || !color) return null
  return { group: titleCase(group), color: titleCase(color) }
}

function titleCase(text: string): string {
  return text
    .split(" ")
    .map((w) => (/^[A-Z0-9]{2,}$/.test(w) || /\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ")
}

/**
 * Nombre de la tarjeta del grupo: el del producto quitando el color
 * ("Jacquard Fit Negro X Metros | Tela Texturizada" → "Jacquard Fit X Metros | Tela Texturizada").
 */
export function colorGroupDisplayName(group: string, sampleTitle?: string): string {
  const { head, tail } = splitTitle(String(sampleTitle || ""))
  const prefix = /^tela\s/i.test(head) && !/^tela\s/i.test(group) ? "Tela " : ""
  return `${prefix}${group}${tail || " X Metros"}`.replace(/\s+/g, " ").trim()
}

/**
 * Color de un producto dentro de su grupo: el nombre sin las palabras del grupo ni "X Metros...".
 */
export function colorNameInGroup(title: string, group: string, fallback = "Color"): string {
  const { head } = splitTitle(String(title || ""))
  const groupWords = new Set(normalizeText(group).split(" "))
  const rest = head
    .replace(/^tela\s+/i, "")
    .split(" ")
    .filter((w) => w && !groupWords.has(normalizeText(w)))
    .join(" ")
    .trim()
  return rest || fallback
}
