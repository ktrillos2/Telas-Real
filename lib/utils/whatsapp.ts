/**
 * Utilidad centralizada para formatear enlaces y números de WhatsApp obtenidos desde Sanity.
 */

export const DEFAULT_WHATSAPP_NUMBER = '573159021516'
export const DEFAULT_WHATSAPP_DISPLAY = '+57 315 902 1516'

/**
 * Limpia cualquier formato de teléfono (+, espacios, guiones) y asegura
 * que tenga el prefijo de país de Colombia (57) si es un número de 10 dígitos.
 */
export function cleanWhatsAppNumber(phone?: string | null): string {
  if (!phone) return DEFAULT_WHATSAPP_NUMBER
  
  let cleaned = String(phone).replace(/\D/g, '')
  if (!cleaned) return DEFAULT_WHATSAPP_NUMBER

  // Si tiene 10 dígitos y empieza por 3 (número celular estándar colombiano), agregar 57
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '57' + cleaned
  }

  return cleaned
}

/**
 * Genera un enlace seguro a wa.me usando el número y mensaje opcional.
 */
export function getWhatsAppUrl(phone?: string | null, message?: string | null): string {
  const number = cleanWhatsAppNumber(phone)
  const query = message ? `?text=${encodeURIComponent(message.trim())}` : ''
  return `https://wa.me/${number}${query}`
}

/**
 * Formatea el número para mostrar en texto en la interfaz (ej: "+57 315 902 1516").
 */
export function formatWhatsAppDisplay(phone?: string | null): string {
  if (!phone) return DEFAULT_WHATSAPP_DISPLAY
  const s = String(phone).trim()
  if (s.startsWith('+')) return s
  const cleaned = cleanWhatsAppNumber(phone)
  if (cleaned.startsWith('57') && cleaned.length === 12) {
    return `+57 ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`
  }
  return `+${cleaned}`
}
