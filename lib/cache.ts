/**
 * Utilidades para cachear datos de WordPress en localStorage
 */

const CACHE_PREFIX = 'telasreal_'
const CACHE_VERSION = 'v1'

interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string
}

/**
 * Guarda datos en localStorage con timestamp
 */
export function setCacheData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    }
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
  } catch (error) {
    console.warn('Failed to save cache:', error)
  }
}

/**
 * Obtiene datos de localStorage si no han expirado
 */
export function getCacheData<T>(key: string, maxAge: number = 3600000): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)
    
    // Verificar versión
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    // Verificar si expiró
    const age = Date.now() - entry.timestamp
    if (age > maxAge) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    return entry.data
  } catch (error) {
    console.warn('Failed to read cache:', error)
    return null
  }
}

/**
 * Limpia todo el caché de la aplicación
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Failed to clear cache:', error)
  }
}

/**
 * Cachea las URLs de imágenes del carousel
 */
export function cacheCarouselImages(imageUrls: string[]): void {
  setCacheData('carousel_images', imageUrls)
}

/**
 * Obtiene las URLs de imágenes del carousel desde caché
 * @param maxAge Edad máxima en ms (default: 1 hora)
 */
export function getCachedCarouselImages(maxAge: number = 3600000): string[] | null {
  return getCacheData<string[]>('carousel_images', maxAge)
}
