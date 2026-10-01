"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { client } from "@/sanity/lib/client"
import { urlFor } from "@/sanity/lib/image"

interface Banner {
  id: string
  image: string
  mobileImage?: string
  videoUrl?: string
  link?: string
  title: string | null
  subtitle: string | null
  alt?: string
  width?: number
  height?: number
  mobileWidth?: number
  mobileHeight?: number
}

// In-memory cache for hero banners to prevent loading flashes and loops on client-side navigation
let cachedHeroBanners: Banner[] | null = null

export function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>(() => cachedHeroBanners || [])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(() => !cachedHeroBanners)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Touch swipe handling for mobile devices (Rule 15)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const isSwipingRef = useRef(false)

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

  // Fetch banners from Sanity with dimensions for perfect aspect ratio matching
  useEffect(() => {
    async function fetchBanners() {
      try {
        const homeData = await client.fetch(`*[_type == "homeBanners"][0]{
          banners[] {
            _key,
            asset-> {
              url,
              metadata {
                dimensions {
                  width,
                  height,
                  aspectRatio
                }
              }
            },
            alt,
            mobileImage {
              asset-> {
                url,
                metadata {
                  dimensions {
                    width,
                    height,
                    aspectRatio
                  }
                }
              }
            },
            link,
            videoFile {
              asset->{
                url
              }
            }
          }
        }`)

        const rawBanners = homeData?.banners || []

        const validBanners = rawBanners.map((b: any) => ({
          id: b._key,
          image: b.asset?.url ? `${b.asset.url}?auto=format&w=1920&q=80` : (b.asset ? urlFor(b.asset).width(1920).format('webp').quality(80).url() : ''),
          mobileImage: b.mobileImage?.asset?.url ? `${b.mobileImage.asset.url}?auto=format&w=800&q=80` : (b.mobileImage ? urlFor(b.mobileImage).width(800).format('webp').quality(80).url() : undefined),
          videoUrl: b.videoFile?.asset?.url || undefined,
          link: b.link,
          title: null,
          subtitle: null,
          alt: b.alt,
          width: b.asset?.metadata?.dimensions?.width,
          height: b.asset?.metadata?.dimensions?.height,
          mobileWidth: b.mobileImage?.asset?.metadata?.dimensions?.width,
          mobileHeight: b.mobileImage?.asset?.metadata?.dimensions?.height,
        })).filter((b: Banner) => b.image || b.videoUrl)

        if (validBanners.length > 0) {
          cachedHeroBanners = validBanners
          setBanners(validBanners)
        }
      } catch (error) {
        console.error("Error fetching hero banners:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  // Auto-play (pauses on hover)
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [banners.length, isHovered])

  const nextSlide = () => {
    if (banners.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    if (banners.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }

  // Mobile swipe touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    isSwipingRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = touchStartXRef.current - currentX
    const diffY = touchStartYRef.current - currentY

    if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      isSwipingRef.current = true
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return
    const currentX = e.changedTouches[0].clientX
    const currentY = e.changedTouches[0].clientY
    const diffX = touchStartXRef.current - currentX
    const diffY = touchStartYRef.current - currentY

    // Horizontal swipe threshold of 40px
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }

    touchStartXRef.current = null
    touchStartYRef.current = null

    // Prevent immediate synthetic click from triggering navigation on swipe
    setTimeout(() => {
      isSwipingRef.current = false
    }, 150)
  }

  const handleSlideClick = (e: React.MouseEvent) => {
    if (isSwipingRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // Calculate dynamic aspect ratio to prevent cropping and adjust height perfectly
  const activeBanner = banners[currentSlide]
  
  // Default fallback matching current banner dimensions (5953x1569 ~ 3.794)
  const desktopAspect = activeBanner?.width && activeBanner?.height
    ? activeBanner.width / activeBanner.height
    : 3.794;

  const mobileAspect = activeBanner?.mobileWidth && activeBanner?.mobileHeight
    ? activeBanner.mobileWidth / activeBanner.mobileHeight
    : desktopAspect;

  const currentAspect = mounted && isMobile && activeBanner?.mobileImage ? mobileAspect : desktopAspect;

  if (loading && banners.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] md:aspect-[3.794] overflow-hidden bg-muted/20 animate-pulse flex items-center justify-center">
        <div className="w-full h-full bg-slate-200/50 dark:bg-slate-800/50" />
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <div 
      className="relative w-full overflow-hidden bg-transparent transition-[aspect-ratio] duration-500 ease-in-out select-none"
      style={{ aspectRatio: currentAspect ? `${currentAspect}` : undefined }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, index) => {
        const isCurrent = index === currentSlide;
        const cleanLink = banner.link?.trim();

        const BannerContent = (
          <>
            {banner.videoUrl ? (
              <div className="relative w-full h-full">
                <video 
                  src={banner.videoUrl}
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="object-cover w-full h-full pointer-events-none"
                />
              </div>
            ) : (
              <>
                {/* Mobile Image (shown on small screens) */}
                {banner.mobileImage && (
                  <div className="relative w-full h-full md:hidden">
                    <Image
                      src={banner.mobileImage}
                      alt={banner.alt || "Banner Telas Real"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                )}

                {/* Desktop Image (shown on medium+ screens, or all if no mobile image) */}
                <div className={`relative w-full h-full ${banner.mobileImage ? 'hidden md:block' : 'block'}`}>
                  <Image
                    src={banner.image}
                    alt={banner.alt || "Banner Telas Real"}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </>
            )}

            {/* Optional Overlay */}
            {(banner.title || banner.subtitle) && (
              <div className="absolute inset-0 bg-black/20 pointer-events-none z-15">
                <div className="container mx-auto px-4 h-full flex items-center">
                  <div className="max-w-2xl text-white">
                    {banner.title && (
                      index === 0
                        ? <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">{banner.title}</h1>
                        : <h2 className="text-4xl md:text-6xl font-bold mb-4 text-balance">{banner.title}</h2>
                    )}
                    {banner.subtitle && <p className="text-xl md:text-2xl mb-6 text-pretty">{banner.subtitle}</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )

        if (cleanLink) {
          const isExternal =
            (cleanLink.startsWith("http://") || cleanLink.startsWith("https://")) &&
            !cleanLink.includes("telasreal.com") &&
            !cleanLink.includes("localhost");

          return (
            <Link 
              href={cleanLink} 
              key={banner.id} 
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onClick={handleSlideClick}
              aria-label={`Ver banner: ${banner.alt || banner.title || 'Promoción Telas Real'}`}
              className={`absolute inset-0 w-full h-full block transition-opacity duration-1000 ${
                isCurrent ? "opacity-100 z-10 cursor-pointer" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {BannerContent}
            </Link>
          )
        }

        return (
          <div 
            key={banner.id} 
            className={`absolute inset-0 w-full h-full block transition-opacity duration-1000 ${
              isCurrent ? "opacity-100 z-10 cursor-default" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {BannerContent}
          </div>
        )
      })}

      {/* Navigation Buttons */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-20"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              prevSlide()
            }}
            aria-label="Banner anterior"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-20"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              nextSlide()
            }}
            aria-label="Banner siguiente"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCurrentSlide(index)
                }}
                aria-label={`Ir al banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
