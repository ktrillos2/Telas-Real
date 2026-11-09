/**
 * Etiqueta (badge) de producto con fechas opcionales de activación y desactivación.
 * Se usa dentro de las consultas GROQ: devuelve la etiqueta solo dentro de su vigencia.
 * (Ej. "CYBER DAY" del 10 al 12 de noviembre; sin fechas = siempre visible.)
 */
export const ACTIVE_BADGE_PROJECTION = `"badge": select(
  defined(badge) && (!defined(badgeStartDate) || dateTime(badgeStartDate) <= dateTime(now())) && (!defined(badgeEndDate) || dateTime(badgeEndDate) > dateTime(now())) => badge,
  null
)`
