/**
 * Texto de la etiqueta automática de oferta (sale cuando el producto tiene precio rebajado).
 * Editable por producto y en masa (Edición Masiva). Vacío = "OFERTA"; "-" = no mostrarla.
 */
export const DEFAULT_OFFER_LABEL = "OFERTA"

export function offerLabel(text?: string | null): string | null {
  const t = String(text ?? "").trim()
  if (t === "-") return null
  return t || DEFAULT_OFFER_LABEL
}
