"use client"

import { useState, useEffect } from "react"
import { Scissors, Truck, Palette, Sparkles, X } from "lucide-react"
import { useHomeData } from "@/lib/hooks/useHomeData"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SpecialServices() {
  const { data, loading } = useHomeData()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Default services as fallback
  const defaultServices = [
    {
      icon: Scissors,
      title: "Corte a Medida",
      description: "Cortamos tus telas a la medida exacta, sin desperdicios",
    },
    {
      icon: Truck,
      title: "Envíos Nacionales",
      description: "Enviamos a todo Colombia con los mejores tiempos de entrega",
    },
    {
      icon: Palette,
      title: "Asesoría Personalizada",
      description: "Nuestros expertos te ayudan a elegir la tela perfecta para tu proyecto",
    },
    {
      icon: Sparkles,
      title: "Telas Personalizadas",
      description: "Sublimamos tus diseños en telas de alta calidad",
    },
  ]

  // ... (rest of the logic stays similar but simplified for the thin look)
  const iconMap: Record<string, any> = {
    scissors: Scissors,
    truck: Truck,
    palette: Palette,
    sparkles: Sparkles
  }

  let services = defaultServices

  if (data?.acf?.servicios_especiales?.servicios?.length > 0) {
    services = data.acf.servicios_especiales.servicios.map((s: any) => ({
      icon: iconMap[s.icon] || Scissors,
      title: s.titulo,
      description: s.descripcion,
    }))
  }

  return (
    <section className="py-8 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-light mb-2 text-white">Servicios Especiales</h2>
          <p className="text-sm md:text-base font-light text-white/90">
            Más que una tienda de telas, somos tu aliado en cada proyecto
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-medium text-lg mb-1">{service.title}</h3>
                <p className="text-white/80 text-xs max-w-[200px]">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
