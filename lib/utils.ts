import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determina si un producto o ítem pertenece a una categoría que se vende por unidad
 * (como Hilos y Tijeras) en lugar de venderse por metro.
 */
export function isUnitProduct(item?: {
  categorySlugs?: string[] | null
  categories?: any[] | null
  slug?: string | null
  title?: string | null
  name?: string | null
} | null): boolean {
  if (!item) return false

  // 1. Revisar slugs de categorías
  if (item.categorySlugs && Array.isArray(item.categorySlugs)) {
    if (item.categorySlugs.some((s) => typeof s === 'string' && /hilo|tijera/i.test(s))) return true
  }

  // 2. Revisar array de categorías (objetos con slug, name, title, id, _id)
  if (item.categories && Array.isArray(item.categories)) {
    const hasMatch = item.categories.some((c: any) => {
      const slug = typeof c === 'string' ? c : (c?.slug?.current || c?.slug || '')
      const name = c?.name || c?.title || ''
      const id = c?._id || c?.id || ''
      return (
        /hilo|tijera/i.test(slug) ||
        /hilo|tijera/i.test(name) ||
        id === 'cat-hilos' ||
        id === 'cat-tijeras' ||
        /hilo|tijera/i.test(id)
      )
    })
    if (hasMatch) return true
  }

  // 3. Revisar slug del producto
  if (item.slug && /hilo|tijera/i.test(item.slug)) return true

  // 4. Revisar nombre o título del producto
  const productName = item.name || item.title || ''
  if (/hilo|tijera/i.test(productName)) return true

  return false
}
