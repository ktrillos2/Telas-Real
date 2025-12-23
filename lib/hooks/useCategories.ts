import useSWR from "swr"

export interface Category {
  id: number
  name: string
  slug: string
  count: number
  description: string
  parent: number
  image: {
    id: number
    src: string
  } | null
}

interface UseCategoriesResult {
  categories: Category[]
  loading: boolean
  error: string | null
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Error al obtener categorías")
  }
  const data = await response.json()
  // Filtrar solo categorías principales (sin parent o con productos)
  return data.filter((cat: Category) => cat.count > 0)
}

export function useCategories(): UseCategoriesResult {
  const baseUrl = typeof window !== 'undefined' ? '/api/proxy' : (process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://admin.telasreal.com');
  const url = `${baseUrl}/wp-json/wc/store/products/categories?per_page=100`

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 300000, // 5 minutos
    // Persistencia en localStorage
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(url, JSON.stringify({
            data,
            timestamp: Date.now()
          }))
        } catch (e) {
          console.warn('Error saving categories to localStorage', e)
        }
      }
    },
    fallbackData: typeof window !== 'undefined' ? (() => {
      try {
        const item = localStorage.getItem(url)
        if (item) {
          const parsed = JSON.parse(item)
          // Validar expiración (ej. 24 horas para categorías)
          if (Date.now() - parsed.timestamp < 86400000) {
            return parsed.data
          }
        }
        return undefined
      } catch (e) {
        return undefined
      }
    })() : undefined
  })

  return {
    categories: data || [],
    loading: isLoading,
    error: error ? error.message : null
  }
}
