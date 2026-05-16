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
    const CACHE_KEY = 'testimonials_cache'
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

        if (rawData.data && rawData.data.length > 0) {
          // Reviews API returns data[0] as the place object containing reviews
          const place = rawData.data[0];

          // STRICTLY check for reviews_data which contains the array of review objects
          // place.reviews is just the count (number) and should be ignored for the list
          const reviewsArray = place?.reviews_data;

          if (reviewsArray && Array.isArray(reviewsArray)) {
            reviewsArray.filter((r: any) => (r.review_rating || r.rating || 5) >= 4).slice(0, 10).forEach((review: any, index: number) => {
              parsedReviews.push({
                id: index,
                name: review.author_title || review.reviewer || 'Cliente',
                location: "Cliente Verificado",
                rating: review.review_rating || review.rating || 5,
                comment: review.review_text || review.reviewText || 'Gran experiencia!',
                date: review.review_datetime_utc
                  ? new Date(review.review_datetime_utc).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                  : (review.time ? new Date(review.time).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente'),
                profilePhotoUrl: review.author_image || review.review_img_url
              })
            })
          }
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
    <section id="testimonios" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-primary">Qué Dicen Nuestros Clientes</h2>
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
                <Card className="h-full">
                  <CardContent className="p-6">
                    {/* Header with avatar and name */}
                    <div className="flex items-start gap-3 mb-4">
                      {testimonial.profilePhotoUrl ? (
                        <img
                          src={testimonial.profilePhotoUrl}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                          {testimonial.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                          {/* Google verification badge */}
                          <img
                            src="/verified-badge.png"
                            alt="Verified"
                            className="w-4 h-4 flex-shrink-0"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{testimonial.date}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {/* Official Google logo */}
                          <img
                            src="/google-logo.png"
                            alt="Google"
                            className="h-4 w-auto"
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
                    <p className="text-sm text-pretty line-clamp-4 leading-relaxed">{testimonial.comment}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
