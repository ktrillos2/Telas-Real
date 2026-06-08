"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

interface CustomerReview {
  id: number
  name: string
  location: string
  rating: number
  comment: string
  date: string
  profilePhotoUrl?: string
  link?: string
}

import { type CarouselApi } from "@/components/ui/carousel"

export function Testimonials() {
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }

    const intervalId = setInterval(() => {
      api.scrollNext()
    }, 4000)

    return () => clearInterval(intervalId)
  }, [api])

  useEffect(() => {
    // Cambiamos la clave del caché a v3 para que cargue la ubicación real
    const CACHE_KEY = 'testimonials_cache_v3'
    const CACHE_DURATION = 3600000 // 1 hour

    const checkCache = () => {
      try {
        const cachedItem = localStorage.getItem(CACHE_KEY)
        if (cachedItem) {
          const { data, timestamp } = JSON.parse(cachedItem)
          if (Date.now() - timestamp < CACHE_DURATION) {
            setReviews(data)
            setLoading(false)
            return true
          }
        }
      } catch (error) {
        console.error("Error reading cache:", error)
      }
      return false
    }

    if (checkCache()) {
      return
    }

      fetch('/api/telas-real-reviews')
      .then(res => res.json())
      .then((rawData: any) => {
        const parsedReviews: CustomerReview[] = []

        if (rawData.data && Array.isArray(rawData.data)) {
          const reviewsArray = rawData.data;

          reviewsArray.forEach((review: any, index: number) => {
            parsedReviews.push({
              id: review._id || index,
              name: review.name || 'Cliente',
              location: review.location || 'Telas Real',
              rating: review.rating || 5,
              comment: review.comment || 'Gran experiencia!',
              date: review.date
                ? new Date(review.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Reciente',
              profilePhotoUrl: review.profilePhotoUrl,
              link: review.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Telas Real Medellín')}`
            })
          })
        }

        if (parsedReviews.length > 0) {
          setReviews(parsedReviews)
          // Save to cache
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: parsedReviews,
              timestamp: Date.now()
            }))
          } catch (error) {
            console.error("Error saving to cache:", error)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <section id="testimonios" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Cargando reseñas...</p>
        </div>
      </section>
    )
  }

  if (reviews.length === 0) {
    return null // Or show a fallback
  }

  return (
    <section id="testimonios" className="py-10 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-balance text-primary">Qué Dicen Nuestros Clientes</h2>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Valoraciones reales de clientes satisfechos en todo Colombia
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold">4.9</span>
            <span className="text-muted-foreground">de 5 estrellas</span>
          </div>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full overflow-hidden"
        >
          <CarouselContent>
            {reviews.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/5">
                <a 
                  href={testimonial.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block h-full group"
                >
                  <Card className="h-full transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/30 p-3">
                    <CardContent className="p-4 md:p-5">
                      {/* Header with avatar and name */}
                      <div className="flex items-start gap-3 mb-3">
                        {testimonial.profilePhotoUrl ? (
                          <img
                            src={testimonial.profilePhotoUrl}
                            alt={testimonial.name}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 items-center justify-center text-primary font-bold flex-shrink-0"
                          style={{ display: testimonial.profilePhotoUrl ? 'none' : 'flex' }}
                        >
                          {testimonial.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{testimonial.name}</p>
                            {/* Google verification badge */}
                            <img
                              src="/verified-badge.png"
                              alt="Verified"
                              className="w-4 h-4 flex-shrink-0"
                            />
                          </div>
                          <p className="text-xs font-medium text-foreground/80 truncate mb-0.5" title={testimonial.location}>{testimonial.location}</p>
                          <p className="text-[11px] text-muted-foreground">{testimonial.date}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {/* Official Google logo */}
                            <img
                              src="/google-logo.png"
                              alt="Google"
                              className="h-3.5 w-auto"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stars - larger and more prominent */}
                      <div className="flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-6 w-6 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                          />
                        ))}
                      </div>

                      {/* Review text */}
                      <p className="text-sm text-pretty line-clamp-4 leading-relaxed group-hover:text-foreground/90 transition-colors">{testimonial.comment}</p>
                    </CardContent>
                  </Card>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
