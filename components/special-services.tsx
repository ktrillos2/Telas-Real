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
      description: "Cortamos tus telas a la medida exacta que necesitas, sin desperdicios.",
    },
    {
      icon: Truck,
      title: "Envíos Nacionales",
      description: "Enviamos a todo Colombia con los mejores tiempos de entrega.",
    },
    {
      icon: Palette,
      title: "Asesoría Personalizada",
      description: "Nuestros expertos te ayudan a elegir la tela perfecta para tu proyecto.",
    },
    {
      icon: Sparkles,
      title: "Servicio de Sublimación",
      description: "Sublimamos tus diseños en telas de alta calidad.",
      details: (
        <div className="space-y-6 text-left">
          <p className="text-muted-foreground">
            Dale vida a tus diseños con nuestro servicio de sublimación de alta calidad, ideal para proyectos textiles que requieren colores vibrantes, excelente definición y durabilidad.
          </p>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Condiciones del Servicio</h4>
            <p className="text-sm text-muted-foreground">
              En este servicio, <span className="font-medium text-foreground">el cliente trae su propia tela</span>, la cual debe ser a base de poliéster.
            </p>
            <p className="text-xs text-muted-foreground italic">
              * No trabajamos con materiales naturales como algodón o lino, ya que no permiten una correcta fijación del color.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <span className="text-xl">💰</span> Tarifas por metro sublimado
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b pb-1">
                <span>De 1 a 100 metros:</span>
                <span className="font-medium">$7.900 / metro</span>
              </li>
              <li className="flex justify-between border-b pb-1">
                <span>Desde 1000 metros:</span>
                <span className="font-medium">$7.000 / metro</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Nuestro proceso garantiza un acabado profesional, perfecto para marcas de moda, emprendimientos textiles o producciones a gran escala.
          </p>

          <div className="pt-4 text-center space-y-4">
            <p className="font-medium flex items-center justify-center gap-2">
              Imprime, crea y transforma tus ideas
            </p>
            <Button className="w-full" asChild>
              <Link href="/personalizado">
                Cotizar Proyecto
              </Link>
            </Button>
          </div>
        </div>
      )
    },
  ]

  // If loading or no data, show defaults (or skeleton)
  // We'll use defaults for smoother transition or if API fails
  let services = defaultServices

  if (data?.acf?.servicios_especiales) {
    const { grupo1, grupo2, grupo3, grupo4 } = data.acf.servicios_especiales
    // Merge API data but keep our hardcoded details for Sublimation if title matches closely
    services = [
      {
        icon: Scissors,
        title: grupo1.titulo,
        description: grupo1.descripcion,
      },
      {
        icon: Truck,
        title: grupo2.titulo,
        description: grupo2.descripcion,
      },
      {
        icon: Palette,
        title: grupo3.titulo,
        description: grupo3.descripcion,
      },
      {
        icon: Sparkles,
        title: grupo4.titulo,
        description: grupo4.descripcion,
        details: grupo4.titulo.toLowerCase().includes('sublima') ? defaultServices[3].details : undefined
      },
    ]
  }

  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance text-white">Servicios Especiales</h2>
          <p className="text-lg font-light text-white/90 text-pretty max-w-2xl mx-auto">
            Más que una tienda de telas, somos tu aliado en cada proyecto
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon

            const CardContent = (
              <div className={`text-center p-6 h-full transition-all duration-300 ${service.details ? 'cursor-pointer hover:bg-white/10 rounded-xl' : ''}`}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-light text-xl mb-2 text-white">{service.title}</h3>
                <p className="text-white/90 text-sm font-light text-pretty">{service.description}</p>
              </div>
            )

            if (service.details && isMounted) {
              return (
                <Sheet key={index}>
                  <SheetTrigger asChild>
                    {CardContent}
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="text-2xl font-light">{service.title}</SheetTitle>
                      <SheetDescription>
                        Información detallada sobre nuestro servicio
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-8">
                      {service.details}
                    </div>
                  </SheetContent>
                </Sheet>
              )
            }

            return <div key={index}>{CardContent}</div>
          })}
        </div>
      </div>
    </section>
  )
}
