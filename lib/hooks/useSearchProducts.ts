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

        const baseUrl = getWordPressApiUrl()

        // Dividir la búsqueda en palabras clave (términos)
        // Filtramos palabras cortas (< 2 letras) para evitar ruido irrelevante
        const terms = searchQuery.trim().split(/\s+/).filter(term => term.length >= 2)

        // Si no hay términos válidos después del filtro, no buscamos (o buscamos con el query original si era corto pero el usuario insiste... 
        // pero la validación inicial del useEffect ya retorna si < 2 chars, así que aquí siempre habrá algo a menos que sean puros espacios o letras sueltas)
        let searchTerms: string[] = []
        if (terms.length === 0) {
          // Fallback al query original por si acaso
          searchTerms = [searchQuery]
        } else {
          // Usamos Set para únicos y limitamos a 5 términos para control
          searchTerms = [...new Set(terms)].slice(0, 5)
        }

        // Función para transformar el producto (extraída para reutilizar)
        const transformProduct = (product: any): Product => ({
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
        })

        // Ejecutar búsquedas en paralelo
        const searchPromises = searchTerms.map(term =>
          fetch(`${baseUrl}/wp-json/wc/store/products?search=${encodeURIComponent(term)}&per_page=40`)
            .then(res => res.ok ? res.json() : [])
            .catch(err => {
              console.error(`Error searching term "${term}":`, err)
              return []
            })
        )

        const results = await Promise.all(searchPromises)

        // Combinar resultados y contar coincidencias
        const productMap = new Map<number, { product: any, score: number }>()

        results.flat().forEach(item => {
          if (!productMap.has(item.id)) {
            productMap.set(item.id, { product: item, score: 0 })
          }
          productMap.get(item.id)!.score += 1
        })

        // Convertir a array, ordenar por relevancia y transformar
        const transformedProducts: Product[] = Array.from(productMap.values())
          .sort((a, b) => b.score - a.score) // Ordenar por número de coincidencias
          .map(item => transformProduct(item.product))

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
