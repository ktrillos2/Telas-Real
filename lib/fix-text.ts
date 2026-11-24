/**
 * Corrige textos de atributos importados con caracteres dañados ("Composici�n", "Poli�ster", "Tama�o").
 * Se aplica al mostrar los datos; no cambia lo guardado en Sanity.
 */
const NAME_FIXES: Array<[RegExp, string]> = [
  [/^comp(i)?osic[^\s:]*n\s*$/i, "Composición"],
  [/^presentaci�n$/i, "Presentación"],
  [/^tama�o$/i, "Tamaño"],
]

const VALUE_FIXES: Array<[RegExp, string]> = [
  [/poli�ster/gi, "Poliéster"],
  [/\s�\s/g, " – "],
  [/composici�n/gi, "composición"],
  [/presentaci�n/gi, "presentación"],
  [/tama�o/gi, "tamaño"],
]

export function fixAttrName(name: unknown): string {
  const n = String(name ?? "").trim()
  for (const [re, good] of NAME_FIXES) if (re.test(n)) return good
  return n
}

export function fixText(value: unknown): string {
  let v = String(value ?? "")
  for (const [re, good] of VALUE_FIXES) v = v.replace(re, good)
  return v
}

/** Normaliza nombre y valor de cada atributo (mantiene el resto de campos). */
export function fixAttributes<T extends { name?: any; value?: any; terms?: any[] }>(attrs: T[] | null | undefined): T[] {
  return (attrs || []).filter(Boolean).map((a) => ({
    ...a,
    ...(a.name !== undefined ? { name: fixAttrName(a.name) } : {}),
    ...(typeof a.value === "string" ? { value: fixText(a.value) } : {}),
    ...(Array.isArray(a.terms) ? { terms: a.terms.map((t: any) => (t && typeof t.name === "string" ? { ...t, name: fixText(t.name) } : t)) } : {}),
  }))
}
