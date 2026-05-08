"use client"

import type React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useEffect, useRef, useState } from "react"

interface FabricUse {
  id: string
  name: string
  image: string
}

interface FabricUsesCarouselProps {
  category: string
  fabricUses?: FabricUse[]
}

export function FabricUsesCarousel({ category, fabricUses = [] }: FabricUsesCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Si no hay usos definidos, no renderizamos el carrusel
  if (!fabricUses || fabricUses.length === 0) {
    return null;
  }
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const uses = fabricUses || []

  useEffect(() => {
    if (!carouselRef.current || uses.length === 0 || isDragging) return

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % uses.length)
    }, 3000) // Change slide every 3 seconds

    return () => clearInterval(intervalId)
  }, [uses.length, isDragging])

  useEffect(() => {
    if (!carouselRef.current) return

    const itemWidth = 192 // w-40 = 160px + gap-8 = 32px = 192px
    carouselRef.current.scrollTo({
      left: currentIndex * itemWidth,
      behavior: "smooth",
    })
  }, [currentIndex])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - carouselRef.current.offsetLeft)
    setScrollLeft(carouselRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 2
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    if (!isDragging || !carouselRef.current) return
    setIsDragging(false)

    // Snap to nearest item
    const itemWidth = 192
    const newIndex = Math.round(carouselRef.current.scrollLeft / itemWidth)
    setCurrentIndex(Math.max(0, Math.min(newIndex, uses.length - 1)))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft)
    setScrollLeft(carouselRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 2
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    if (!isDragging || !carouselRef.current) return
    setIsDragging(false)

    const itemWidth = 192
    const newIndex = Math.round(carouselRef.current.scrollLeft / itemWidth)
    setCurrentIndex(Math.max(0, Math.min(newIndex, uses.length - 1)))
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? uses.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % uses.length)
  }

  if (uses.length === 0) return null

  return (
    <div className="mb-8 overflow-hidden relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 backdrop-blur-sm border-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div
        ref={carouselRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide py-6 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {uses.map((use) => (
          <div key={use.id} className="flex-shrink-0 w-40 text-center">
            <div className="mb-3 flex items-center justify-center">
              <img
                src={use.image || "/placeholder.svg"}
                alt={use.name}
                className="w-32 h-40 object-contain"
                onError={(e) => {
                  e.currentTarget.src = `/placeholder.svg`
                }}
              />
            </div>
            <p className="text-xs font-light text-foreground leading-tight">{use.name}</p>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 backdrop-blur-sm border-0"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
