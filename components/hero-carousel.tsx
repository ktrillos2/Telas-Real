"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHomeDataContext } from "@/lib/contexts/HomeDataContext"
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
  const { data, loading } = useHomeDataContext()
  const { setImagesLoaded } = useLoadingContext()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [pcBanners, setPcBanners] = useState<Banner[]>([])
  const [mobileBanners, setMobileBanners] = useState<Banner[]>([])
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Detect Mobile Device
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Construir banners desde los datos del API
  useEffect(() => {
    async function fetchBannerImages() {
      if (data?.acf?.banners) {
        setLoadingImages(true)
        const { pc, mobile } = data.acf.banners

        // IDs para PC
        const pcIds = [pc?.imagen_1, pc?.imagen_2, pc?.imagen_3, pc?.imagen_4].filter(id => id);
        // IDs para Mobile
        const mobileIds = [mobile?.imagen_1_mobile, mobile?.imagen_2_mobile, mobile?.imagen_3_mobile, mobile?.imagen_4_mobile].filter(id => id);

        // Fetch all URLs
        const allIds = [...pcIds, ...mobileIds] as number[]
        if (allIds.length === 0) {
          setLoadingImages(false)
          setImagesLoaded(true)
          return
        }

        const imageUrls = await getWordPressImageUrls(allIds)

        // Helper
        const isValidUrl = (url: string) => url && url.length > 0 && !url.includes('placeholder')

        // Maps for PC
        const pcData: Banner[] = []
        pcIds.forEach((id, index) => {
          const url = imageUrls[index]
          if (isValidUrl(url)) {
            pcData.push({ id: index + 1, image: url, title: null, subtitle: null })
          }
        })

        // Maps for Mobile (offset by pcIds length in the flat URL array)
        const mobileData: Banner[] = []
        mobileIds.forEach((id, index) => {
          const url = imageUrls[pcIds.length + index]
          if (isValidUrl(url)) {
            mobileData.push({ id: index + 101, image: url, title: null, subtitle: null }) // distinct IDs
          }
        })

        setPcBanners(pcData)
        setMobileBanners(mobileData)
        setLoadingImages(false)
        setImagesLoaded(true)

        // Cache attempt (optional, simplified)
        if (pcData.length > 0) cacheCarouselImages(pcData.map(b => b.image))

      } else if (data && !data.acf?.banners) {
        setLoadingImages(false)
        setImagesLoaded(true)
      }
    }

    fetchBannerImages()
  }, [data, setImagesLoaded])

  // Select active banners based on device
  // If not mounted yet (SSR), defaulting to PC or empty to avoid mismatch is tricky.
  // We'll render PC by default but hidden or structure agnostic?
  // User asked for "Strict".
  const activeBanners = isMobile ? mobileBanners : pcBanners

  // Filter errors
  const validBanners = activeBanners.filter(banner => !imageErrors.has(banner.image))

  // Reset slide index if it goes out of bounds when switching sets
  useEffect(() => {
    if (currentSlide >= validBanners.length && validBanners.length > 0) {
      setCurrentSlide(0)
    }
  }, [validBanners.length, currentSlide, isMobile])

  // Autoplay
  useEffect(() => {
    if (validBanners.length === 0) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % validBanners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [validBanners.length, currentSlide])

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

  if (loading || loadingImages) {
    return (
      <div className="relative w-full h-[290px] md:h-[390px] overflow-hidden bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (validBanners.length === 0) {
    if (!mounted) return null // Avoid flash
    if (data?.acf?.banners) return null // Loaded but empty?
    return null
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
          <div className="relative w-full h-full">
            <Image
              src={banner.image}
              alt={banner.title || `Banner ${banner.id}`}
              fill
              className="object-[inherit] md:object-cover"
              priority={index === 0}
              quality={85}
              loading={index === 0 ? "eager" : "lazy"}
              onError={() => handleImageError(banner.image)}
            />
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
