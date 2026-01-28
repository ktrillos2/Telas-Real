"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCacheData, setCacheData } from '@/lib/cache'
import { getWordPressApiUrl } from '@/lib/utils/api'

// Define interfaces directly here or import if they were shared (currently locals in hooks)
// Duplicating interfaces for clarity and separation, ensuring they match usage.
interface BannersData {
    mobile: {
        imagen_1_mobile: string | number
        imagen_2_mobile: string | number
        imagen_3_mobile: string | number
        imagen_4_mobile: string | number
    }
    pc: {
        imagen_1: string | number
        imagen_2: string | number
        imagen_3: string | number
        imagen_4: string | number
    }
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

interface HomeDataContextType {
    data: HomeDataResponse | null
    loading: boolean
    error: Error | null
}

const HomeDataContext = createContext<HomeDataContextType | undefined>(undefined)

const BASE_URL = getWordPressApiUrl()
const WORDPRESS_API_URL = `${BASE_URL}/wp-json/wp/v2/secciones_inicio?_fields=acf`
const CACHE_KEY = 'home_data_v3' // Updated cache key
const CACHE_MAX_AGE = 3600000 // 1 hour

export function HomeDataProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<HomeDataResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        let isMounted = true

        async function fetchHomeData() {
            try {
                // Try to get from cache first
                const cachedData = getCacheData<HomeDataResponse>(CACHE_KEY, CACHE_MAX_AGE)

                if (cachedData) {
                    if (isMounted) {
                        setData(cachedData)
                        setError(null)
                        setLoading(false)
                    }
                } else {
                    // No cache, fetch from API
                    setLoading(true)
                    const response = await fetch(WORDPRESS_API_URL, {
                        next: { revalidate: 60 },
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    const result = await response.json()
                    const homeData = Array.isArray(result) ? result[0] : result

                    // Save to cache
                    setCacheData(CACHE_KEY, homeData)

                    if (isMounted) {
                        setData(homeData)
                        setError(null)
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Error fetching home data'))
                    console.error('Error fetching home data:', err)
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
    }, [])

    return (
        <HomeDataContext.Provider value={{ data, loading, error }}>
            {children}
        </HomeDataContext.Provider>
    )
}

export function useHomeDataContext() {
    const context = useContext(HomeDataContext)
    if (context === undefined) {
        throw new Error('useHomeDataContext must be used within a HomeDataProvider')
    }
    return context
}

export type { HomeDataResponse, BannersData }
