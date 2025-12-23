import { useState, useEffect } from 'react'
import { getCacheData, setCacheData } from '@/lib/cache'
import { getWordPressApiUrl } from '@/lib/utils/api'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  regular_price?: number
  sale_price?: number
  images: Array<{
    id: number
    src: string
    name: string
    alt: string
  }>
}

export function useSearchProducts(searchQuery: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Solo buscar si hay al menos 2 caracteres
    if (searchQuery.trim().length < 2) {
      setProducts([])
      setLoading(false)
      return
    }

    const fetchProducts = async () => {
      try {
        const cacheKey = `telasreal_search_${searchQuery.toLowerCase().trim()}`

        // Intentar obtener datos del caché (5 minutos)
        const cachedData = getCacheData<Product[]>(cacheKey, 5)
        if (cachedData) {
          setProducts(cachedData)
          setLoading(false)
          return
        }

        // Hacer la petición a la API
        const baseUrl = getWordPressApiUrl()
        const url = `${baseUrl}/wp-json/wc/store/products?search=${encodeURIComponent(searchQuery)}&per_page=10`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Error al buscar productos')
        }

        const data = await response.json()

        // Transformar los datos
        const transformedProducts: Product[] = data.map((product: any) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number.parseInt(product.prices.price),
          regular_price: product.prices.regular_price
            ? Number.parseInt(product.prices.regular_price)
            : undefined,
          sale_price: product.prices.sale_price
            ? Number.parseInt(product.prices.sale_price)
            : undefined,
          images: product.images || []
        }))

        setProducts(transformedProducts)
        setCacheData(cacheKey, transformedProducts)
        setLoading(false)
      } catch (err) {
        console.error('Error buscando productos:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setProducts([])
        setLoading(false)
      }
    }

    // Activar loading inmediatamente
    setLoading(true)
    setError(null)

    // Debounce de 300ms
    const timeoutId = setTimeout(fetchProducts, 300)
    return () => {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }, [searchQuery])

  return { products, loading, error }
}
