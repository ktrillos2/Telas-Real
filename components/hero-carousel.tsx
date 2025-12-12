"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHomeData } from "@/lib/hooks/useHomeData"
import { getWordPressImageUrls } from "@/lib/wordpress-media"
import { useLoadingContext } from "@/lib/contexts/LoadingContext"
import { getCachedCarouselImages, cacheCarouselImages } from "@/lib/cache"

interface Banner {
  id: number
  image: string
  mobileImage?: string
  title: string | null
  subtitle: string | null
}

export function HeroCarousel() {
  const { data, loading } = useHomeData()
  const { setImagesLoaded } = useLoadingContext()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [banners, setBanners] = useState<Banner[]>([])
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState(true)

  // Construir banners desde los datos del API
  useEffect(() => {
    async function fetchBannerImages() {
      if (data?.acf?.banners) {
        // Intentar obtener desde caché primero
        const cachedUrls = getCachedCarouselImages()
        // Nota: La caché actual solo guarda strings (URLs desktop), necesitaríamos actualizar la estructura de caché
        // para soportar objetos {desktop, mobile}. Por simplicidad y robustez, invalidaremos caché si la estructura cambia
        // o simplemente re-fetcheamos si detectamos que necesitamos imágenes móviles y no están.

        // Para esta implementación, vamos a priorizar la carga fresca para asegurar que tenemos ambas imágenes
        // pero podemos usar la caché de desktop como fallback inicial si se desea.

        setLoadingImages(true)
        const {
          imagen_1, imagen_2, imagen_3, imagen_4,
          imagen_1_mobile, imagen_2_mobile, imagen_3_mobile, imagen_4_mobile
        } = data.acf.banners

        // IDs de imágenes a obtener (desktop y mobile)
        const imageIds = [
          imagen_1, imagen_2, imagen_3, imagen_4,
          imagen_1_mobile, imagen_2_mobile, imagen_3_mobile, imagen_4_mobile
        ]

        const imageUrls = await getWordPressImageUrls(imageIds)

        // Mapear URLs a la estructura de banners
        // imageUrls tendrá 8 elementos: 0-3 desktop, 4-7 mobile
        const bannersData: Banner[] = []

        // Helper para verificar si una URL es válida
        const isValidUrl = (url: string) => url && url.length > 0 && !url.includes('placeholder')

        for (let i = 0; i < 4; i++) {
          const desktopUrl = imageUrls[i]
          const mobileUrl = imageUrls[i + 4]

          if (isValidUrl(desktopUrl)) {
            bannersData.push({
              id: i + 1,
              image: desktopUrl,
              mobileImage: isValidUrl(mobileUrl) ? mobileUrl : desktopUrl, // Fallback a desktop si no hay mobile
              title: null,
              subtitle: null,
            })
          }
        }

        setBanners(bannersData)
        setLoadingImages(false)
        setImagesLoaded(true)

        // Actualizar caché (solo desktop por compatibilidad o actualizar lógica de caché futura)
        if (bannersData.length > 0) {
          cacheCarouselImages(bannersData.map(b => b.image))
        }

      } else if (data && !data.acf?.banners) {
        // Si no hay banners en los datos, marcar como completado
        setLoadingImages(false)
        setImagesLoaded(true)
      }
    }

    fetchBannerImages()
  }, [data, setImagesLoaded])

  // Filtrar banners que no tuvieron error de carga
  const validBanners = banners.filter(banner => !imageErrors.has(banner.image))

  // Autoplay con reinicio cuando se cambia manualmente
  useEffect(() => {
    if (validBanners.length === 0) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % validBanners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [validBanners.length, currentSlide]) // Añadido currentSlide para reiniciar el timer

  const nextSlide = () => {
    if (validBanners.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % validBanners.length)
  }

  const prevSlide = () => {
    if (validBanners.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + validBanners.length) % validBanners.length)
  }

  const handleImageError = (imageUrl: string) => {
    setImageErrors(prev => new Set(prev).add(imageUrl))
  }

  // Mostrar loading o placeholder si no hay banners válidos
  if (loading || loadingImages || validBanners.length === 0) {
    return (
      <div className="relative w-full h-[290px] md:h-[390px] overflow-hidden bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando imágenes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden bg-transparent" style={{ height: '450px' }}>
      {validBanners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          style={{ height: '450px' }}
        >
          {/* Responsive Image using picture tag */}
          <div className="relative w-full h-full">
            <picture>
              <source media="(max-width: 768px)" srcSet={banner.mobileImage || banner.image} />
              <source media="(min-width: 769px)" srcSet={banner.image} />
              <Image
                src={banner.image}
                alt={banner.title || `Banner ${banner.id}`}
                width={1920}
                height={550}
                className="w-full h-full object-[inherit] md:object-cover"
                priority={index === 0}
                quality={85}
                loading={index === 0 ? "eager" : "lazy"}
                onError={() => handleImageError(banner.image)}
                style={{ height: '450px' }}
              />
            </picture>
          </div>

          {(banner.title || banner.subtitle) && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
              <div className="container mx-auto px-4 h-full flex items-center">
                <div className="max-w-2xl text-white">
                  {banner.title && <h2 className="text-4xl md:text-6xl font-bold mb-4 text-balance">{banner.title}</h2>}
                  {banner.subtitle && <p className="text-xl md:text-2xl mb-6 text-pretty">{banner.subtitle}</p>}
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Ver Catálogo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Navigation Buttons */}
      {validBanners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {validBanners.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "w-8" : ""}`}
                style={{ backgroundColor: index === currentSlide ? 'rgb(59, 130, 246)' : 'rgba(147, 197, 253, 0.7)' }}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
