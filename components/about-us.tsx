"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useHomeData } from "@/lib/hooks/useHomeData"
import { PortableText } from "next-sanity"

export function AboutUs() {
  const { data, loading } = useHomeData()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")

  useEffect(() => {
    if (data?.acf?.conocenos?.imagen) {
      setImageUrl(data.acf.conocenos.imagen)
    }
  }, [data])

  if (loading || !data?.acf?.conocenos) {
    return null
  }

  const { titulo, descripcion, boton } = data.acf.conocenos

  return (
    <section id="quienes-somos" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-[500px] lg:h-[700px] rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={titulo || "Tienda Telas Real"}
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">{titulo}</h2>
            <div className="prose prose-lg text-muted-foreground">
              <PortableText value={descripcion} />
            </div>
            <div className="mt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/puntos-atencion">
                  {boton}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
