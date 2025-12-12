/**
 * Convierte un ID de attachment de WordPress a la URL de la imagen
 * @param attachmentId - ID del attachment en WordPress
 * @returns Promise con la URL de la imagen o null si falla
 */
// Cache LRU simple en memoria para esta sesión
const memoryCache = new Map<string, string>()
const CACHE_PREFIX = 'wp_media_'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

export async function getWordPressImageUrl(attachmentId: number | string): Promise<string | null> {
  try {
    // Si ya es una URL válida, retornarla inmediatamente
    if (typeof attachmentId === 'string') {
      if (attachmentId.startsWith('http://') || attachmentId.startsWith('https://')) {
        return attachmentId
      }
      // Si es un string pero no es URL, podría ser un ID en string
      const numId = parseInt(attachmentId, 10)
      if (isNaN(numId)) {
        return null
      }
      // Continuar con el ID numérico
    }

    const cacheKey = `${CACHE_PREFIX}${attachmentId}`

    // 1. Revisar memoria
    if (memoryCache.has(String(attachmentId))) {
      return memoryCache.get(String(attachmentId))!
    }

    // 2. Revisar localStorage (si estamos en cliente)
    if (typeof window !== 'undefined') {
      try {
        const cachedItem = localStorage.getItem(cacheKey)
        if (cachedItem) {
          const { url, timestamp } = JSON.parse(cachedItem)
          if (Date.now() - timestamp < CACHE_DURATION) {
            memoryCache.set(String(attachmentId), url)
            return url
          }
        }
      } catch (e) {
        // Ignorar errores de storage
      }
    }

    // Si es un ID, hacer fetch al endpoint de media de WordPress
    const response = await fetch(
      `https://www.telasreal.com/wp-json/wp/v2/media/${attachmentId}`,
      {
        cache: 'force-cache', // Cachear URLs de imágenes
        next: { revalidate: 86400 } // Revalidar cada 24 horas
      }
    )

    if (!response.ok) {
      console.warn(`Failed to fetch image with ID ${attachmentId}`)
      return null
    }

    const data = await response.json()

    // WordPress devuelve la URL en diferentes tamaños, usar 'full' o 'source_url'
    const imageUrl = data.source_url || data.guid?.rendered || null

    if (imageUrl) {
      // Guardar en caché
      memoryCache.set(String(attachmentId), imageUrl)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            url: imageUrl,
            timestamp: Date.now()
          }))
        } catch (e) {
          // Fallo silencioso en storage quota
        }
      }
    }

    return imageUrl
  } catch (error) {
    console.error(`Error fetching WordPress image ${attachmentId}:`, error)
    return null
  }
}

/**
 * Convierte múltiples IDs de attachments a URLs en paralelo (más rápido)
 * @param attachmentIds - Array de IDs o URLs
 * @returns Promise con array de URLs (filtra nulls)
 */
export async function getWordPressImageUrls(
  attachmentIds: (number | string | null | undefined)[]
): Promise<string[]> {
  const validIds = attachmentIds.filter((id): id is number | string =>
    id != null && id !== ''
  )

  // Procesar todas las promesas en paralelo para mayor velocidad
  const promises = validIds.map(id => getWordPressImageUrl(id))
  const results = await Promise.all(promises)

  return results.filter((url): url is string => url !== null)
}
