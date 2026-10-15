import { StoreLocations } from "@/components/store-locations"
import { MapPin } from "lucide-react"

import { client } from "@/sanity/lib/client"

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Puntos de Atención",
  description: "Encuentra las tiendas de Telas Real más cercanas a ti. Visítanos en nuestras diferentes ubicaciones en Colombia.",
}

export const revalidate = 60

export default async function PuntosAtencionPage() {
  const stores = await client.fetch(`
    *[_type == "store"] {
      _id,
      name,
      address,
      phone,
      hours,
      coordinates
    }
  `)

  const effectiveStores = stores && stores.length > 0 ? stores : [
    { name: "Telas Real - Bogotá Centro", address: "Calle 12 # 38-65, Bogotá", phone: "+57 315 902 1516", hours: "Lun - Vie: 8:30 AM - 5:30 PM" },
    { name: "Telas Real - Bogotá Alquería", address: "Calle 43 Sur #52B-25, Alquería, Bogotá", phone: "+57 315 902 1516", hours: "Lun - Sáb: 8:00 AM - 6:00 PM" },
    { name: "Telas Real - Bogotá Policarpa", address: "Calle 3 Sur #10-28, Policarpa, Bogotá", phone: "+57 315 902 1516", hours: "Lun - Sáb: 8:00 AM - 6:00 PM" },
    { name: "Telas Real - Medellín", address: "Carrera 50 #45-30, El Poblado, Medellín", phone: "+57 315 902 1516", hours: "Lun - Sáb: 9:00 AM - 7:00 PM" },
    { name: "Telas Real - Cali Centro", address: "Calle 11 # 8 - 33, Centro, Cali", phone: "+57 315 902 1516", hours: "Lun - Sáb: 8:00 AM - 6:00 PM" },
    { name: "Telas Real - Barranquilla", address: "Carrera 45 #52-30, Miramar, Barranquilla", phone: "+57 315 902 1516", hours: "Lun - Sáb: 9:00 AM - 6:30 PM" },
  ]

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@graph": effectiveStores.map((s: any, idx: number) => ({
      "@type": "Store",
      "@id": `https://telasreal.com/puntos-atencion/#store-${idx + 1}`,
      "name": s.name || "Telas Real",
      "image": "https://telasreal.com/logo-loading.png",
      "url": "https://telasreal.com/puntos-atencion",
      "telephone": s.phone || "+57 315 902 1516",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": s.address || "Colombia",
        "addressCountry": "CO"
      },
      ...(s.coordinates?.lat && s.coordinates?.lng ? {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": s.coordinates.lat,
          "longitude": s.coordinates.lng
        }
      } : {}),
      ...(s.hours ? { "openingHours": s.hours } : {})
    }))
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <main>
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-light mb-4 text-balance">Nuestros Puntos de Atención</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Visítanos en cualquiera de nuestras tiendas y descubre la mejor selección de telas
            </p>
          </div>
        </section>

        {/* Store Locations */}
        <StoreLocations hideDescription hideTitle={true} stores={stores.map((s: any) => ({
          id: s._id,
          name: s.name,
          address: s.address,
          phone: s.phone,
          hours: s.hours,
          coordinates: s.coordinates
        }))} />

        {/* Map Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Encuéntranos en el Mapa</h2>
              <p className="text-muted-foreground">Ubicaciones estratégicas en las principales ciudades de Colombia</p>
            </div>
            <div className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border shadow-sm">
              <iframe
                src="https://www.google.com/maps?q=Telas%20Real%20Colombia&z=6&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de Tiendas Telas Real"
              />
            </div>
          </div>
        </section>
      </main>
    </div >
  )
}
