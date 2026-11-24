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

  if ((data?.acf?.servicios_especiales?.servicios?.length ?? 0) > 0 && data?.acf?.servicios_especiales?.servicios) {
    services = data.acf.servicios_especiales.servicios.map((s: any) => ({
      icon: iconMap[s.icon] || Scissors,
      title: s.titulo,
      description: s.descripcion,
    }))
  }

  // Franja compacta: va al final del inicio, debajo de las telas
  return (
    <section className="border-y border-border/60 bg-primary/5 py-6" aria-label="Servicios especiales">
      <div className="container mx-auto px-4">
        <h2 className="sr-only">Servicios Especiales</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <li key={index} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium leading-tight text-foreground">{service.title}</h3>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{service.description}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
