"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'

// Interfaces matching the legacy structure to support existing components
interface BannersData {
    mobile: {
        imagen_1_mobile: string
        imagen_2_mobile: string
        imagen_3_mobile: string
        imagen_4_mobile: string
    }
    pc: {
        imagen_1: string
        imagen_2: string
        imagen_3: string
        imagen_4: string
    }
}

interface TextosHeaderData {
    texto_1: string
    texto_2: string
    texto_3: string
    texto_4: string
}

interface ConocenosData {
    imagen: string
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
        imagen_footer: number // Legacy, mostly unused or handled by Footer queries
    }
}

interface HomeDataContextType {
    data: HomeDataResponse | null
    loading: boolean
    error: Error | null
}

const HomeDataContext = createContext<HomeDataContextType | undefined>(undefined)

export function HomeDataProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<HomeDataResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        let isMounted = true

        async function fetchHomeData() {
            try {
                // Fetch full objects with image expansion to get URLs.
                const richQuery = groq`{
                    "banners": *[_type == "homeBanners"][0] {
                        "pc1": desktop1.asset->url,
                        "pc2": desktop2.asset->url,
                        "pc3": desktop3.asset->url,
                        "pc4": desktop4.asset->url,
                        "mob1": mobile1.asset->url,
                        "mob2": mobile2.asset->url,
                        "mob3": mobile3.asset->url,
                        "mob4": mobile4.asset->url
                    },
                    "conocenos": *[_type == "homeConocenos"][0] {
                        title,
                        "description": content, 
                        buttonText,
                        "image": image.asset->url
                    },
                    "services": *[_type == "homeServices"][0] {
                        service1Title, service1Desc,
                        service2Title, service2Desc,
                        service3Title, service3Desc,
                        service4Title, service4Desc
                    },
                    "header": *[_type == "header"][0] {
                        ticker
                    }
                }`

                const richResult = await client.fetch(richQuery)

                if (isMounted) {
                    const mappedData: HomeDataResponse = {
                        acf: {
                            banners: {
                                pc: {
                                    imagen_1: richResult.banners?.pc1 || "",
                                    imagen_2: richResult.banners?.pc2 || "",
                                    imagen_3: richResult.banners?.pc3 || "",
                                    imagen_4: richResult.banners?.pc4 || ""
                                },
                                mobile: {
                                    imagen_1_mobile: richResult.banners?.mob1 || "",
                                    imagen_2_mobile: richResult.banners?.mob2 || "",
                                    imagen_3_mobile: richResult.banners?.mob3 || "",
                                    imagen_4_mobile: richResult.banners?.mob4 || ""
                                }
                            },
                            textos_header: {
                                texto_1: richResult.header?.ticker?.[0] || "",
                                texto_2: richResult.header?.ticker?.[1] || "",
                                texto_3: richResult.header?.ticker?.[2] || "",
                                texto_4: richResult.header?.ticker?.[3] || ""
                            },
                            conocenos: {
                                titulo: richResult.conocenos?.title || "",
                                descripcion: "Ver más",
                                imagen: richResult.conocenos?.image || "",
                                boton: richResult.conocenos?.buttonText || ""
                            },
                            servicios_especiales: {
                                grupo1: { titulo: richResult.services?.service1Title || "", descripcion: richResult.services?.service1Desc || "" },
                                grupo2: { titulo: richResult.services?.service2Title || "", descripcion: richResult.services?.service2Desc || "" },
                                grupo3: { titulo: richResult.services?.service3Title || "", descripcion: richResult.services?.service3Desc || "" },
                                grupo4: { titulo: richResult.services?.service4Title || "", descripcion: richResult.services?.service4Desc || "" }
                            },
                            imagen_footer: 0
                        }
                    }

                    setData(mappedData)
                    setError(null)
                    setLoading(false)
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Error fetching home data'))
                    console.error('Error fetching home data:', err)
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
