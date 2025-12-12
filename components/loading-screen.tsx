'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLoadingContext } from '@/lib/contexts/LoadingContext'

const MAX_LOADING_TIME = 5000 // Máximo 5 segundos de loading

export function LoadingScreen() {
  const { isFullyLoaded } = useLoadingContext()
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Check if user has already visited in this session
    const hasVisited = sessionStorage.getItem('hasVisited')
    if (hasVisited) {
      setIsVisible(false)
      return
    }

    // Timeout de seguridad: si pasa mucho tiempo, quitar el loading de todos modos
    const maxTimer = setTimeout(() => {
      if (isVisible && !isFading) {
        console.warn('Loading timeout reached, forcing fade out')
        setIsFading(true)
        setTimeout(() => {
          setIsVisible(false)
          sessionStorage.setItem('hasVisited', 'true')
        }, 500)
      }
    }, MAX_LOADING_TIME)

    return () => clearTimeout(maxTimer)
  }, [isVisible, isFading])

  useEffect(() => {
    // Esperar a que TODO el contenido esté cargado (datos + URLs de imágenes obtenidas)
    if (isFullyLoaded) {
      // If already visited (handled by first effect), don't delay
      if (sessionStorage.getItem('hasVisited')) {
        setIsVisible(false)
        return
      }

      const timer = setTimeout(() => {
        setIsFading(true)
        // Esperar a que termine la animación de fade antes de remover del DOM
        const fadeTimer = setTimeout(() => {
          setIsVisible(false)
          sessionStorage.setItem('hasVisited', 'true')
        }, 500)
        return () => clearTimeout(fadeTimer)
      }, 200) // Delay mínimo para suavidad

      return () => clearTimeout(timer)
    }
  }, [isFullyLoaded])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-white flex items-center justify-center z-[9999] transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'
      }`}>
      {/* Contenedor con animación de escala y opacidad */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ripple opacity-75"></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ripple opacity-50" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ripple opacity-25" style={{ animationDelay: '0.6s' }}></div>

          {/* Logo estático sin rotación */}
          <Image
            src="/images/design-mode/image.png"
            alt="Telas Real"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Puntos de carga animados */}
        <div className="flex gap-2 items-center">
          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Texto de carga */}
        <p className="text-slate-600 font-medium text-sm mt-2">Cargando...</p>
      </div>
    </div>
  )
}
