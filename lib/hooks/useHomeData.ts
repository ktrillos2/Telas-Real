"use client"

import { useState, useEffect } from 'react'
import { useLoadingContext } from '@/lib/contexts/LoadingContext'
import { getCacheData, setCacheData } from '@/lib/cache'

interface BannersData {
  imagen_1: string | number
  imagen_2: string | number
  imagen_3: string | number
  imagen_4: string | number
  imagen_1_mobile: string | number
  imagen_2_mobile: string | number
  imagen_3_mobile: string | number
  imagen_4_mobile: string | number
}

interface TextosHeaderData {
  texto_1: string
  texto_2: string
  texto_3: string
  texto_4: string
}

interface ConocenosData {
  imagen: string | number
  titulo: string
  descripcion: string
  boton: string
}

interface ServicioData {
  titulo: string
  descripcion: string
}

interface ServiciosEspecialesData {
  grupo1: ServicioData
  grupo2: ServicioData
  grupo3: ServicioData
  grupo4: ServicioData
}

interface HomeDataResponse {
  acf: {
    banners: BannersData
    textos_header: TextosHeaderData
    conocenos: ConocenosData
    servicios_especiales: ServiciosEspecialesData
    imagen_footer: number
  }
}

interface UseHomeDataReturn {
  data: HomeDataResponse | null
  loading: boolean
  error: Error | null
}

const WORDPRESS_API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://telasreal.com'}/wp-json/wp/v2/secciones_inicio?_fields=acf`
const CACHE_KEY = 'home_data'
const CACHE_MAX_AGE = 3600000 // 1 hora

export function useHomeData(): UseHomeDataReturn {
  const [data, setData] = useState<HomeDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { setDataLoaded } = useLoadingContext()

  useEffect(() => {
    let isMounted = true

    async function fetchHomeData() {
      try {
        // Intentar obtener desde caché primero
        const cachedData = getCacheData<HomeDataResponse>(CACHE_KEY, CACHE_MAX_AGE)

        if (cachedData) {
          // Usar datos cacheados inmediatamente
          if (isMounted) {
            setData(cachedData)
            setError(null)
            setLoading(false)
            setDataLoaded(true)
          }
          // User requested NO re-loading if data exists, so background revalidation receives no call here.
        } else {
          // No hay caché, obtener normalmente
          setLoading(true)
          const response = await fetch(WORDPRESS_API_URL, {
            next: { revalidate: 60 }, // Revalidar cada 60 segundos
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          const homeData = Array.isArray(result) ? result[0] : result

          // Guardar en caché
          setCacheData(CACHE_KEY, homeData)

          if (isMounted) {
            setData(homeData)
            setError(null)
            setDataLoaded(true)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error fetching home data'))
          console.error('Error fetching home data:', err)
          setDataLoaded(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchHomeData()

    return () => {
      isMounted = false
    }
  }, [setDataLoaded])

  return { data, loading, error }
}
