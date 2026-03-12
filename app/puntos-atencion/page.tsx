import { StoreLocations } from "@/components/store-locations"
import { MapPin } from "lucide-react"

import { client } from "@/sanity/lib/client"

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

  return (
    <div className="min-h-screen">
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
