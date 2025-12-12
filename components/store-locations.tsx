import { MapPin, Clock, Phone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const stores = [
  {
    id: 1,
    name: "Telas Real - Bogotá Centro",
    address: "Calle 12 #8-45, Centro, Bogotá",
    phone: "+57 (1) 234-5678",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.8!2d-74.07!3d4.60!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzYnMDAuMCJOIDc0wrAwNCcxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },
  {
    id: 2,
    name: "Telas Real - Bogotá Alquería",
    address: "Calle 43 Sur #52B-25, Alquería, Bogotá",
    phone: "+57 (1) 234-5678",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.9!2d-74.13!3d4.59!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzUnMjQuMCJOIDc0wrAwNyc0OC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },
  {
    id: 3,
    name: "Telas Real - Bogotá Policarpa",
    address: "Calle 3 Sur #10-28, Policarpa, Bogotá",
    phone: "+57 (1) 234-5678",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.8!2d-74.08!3d4.58!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzQnNDguMCJOIDc0wrAwNCQ0OC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },
  {
    id: 4,
    name: "Telas Real - Medellín",
    address: "Carrera 50 #45-30, El Poblado, Medellín",
    phone: "+57 (4) 345-6789",
    hours: "Lun - Sáb: 9:00 AM - 7:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.2!2d-75.57!3d6.21!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMzYuMCJOIDc1wrAzNCcxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },

  {
    id: 6,
    name: "Telas Real - Cali Centro",
    address: "Calle 11 # 8 - 33, Centro, Cali",
    phone: "+57 (2) 456-7890",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.6!2d-76.53!3d3.44!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMjYnMjQuMCJOIDc2wrAzMSc0OC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },
  {
    id: 7,
    name: "Telas Real - Barranquilla",
    address: "Carrera 45 #52-30, Miramar, Barranquilla",
    phone: "+57 (5) 567-8901",
    hours: "Lun - Sáb: 9:00 AM - 6:30 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3974.5!2d-74.78!3d10.98!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU4JzQ4LjAiTiA3NMKwNDYnNTIuMCJX!5e0!3m2!1sen!2sco!4v1234567890",
  },
  {
    id: 8,
    name: "Telas Real - Bucaramanga",
    address: "Calle 37 # 14-39, Centro, Bucaramanga",
    phone: "+57 (7) 678-9012",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.2!2d-73.12!3d7.12!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMDcnMTIuMCJOIDczwrAwNywxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },
  {
    id: 9,
    name: "Telas Real - Pereira",
    address: "Calle 19 #10-28, Centro, Pereira",
    phone: "+57 (6) 789-0123",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3975.6!2d-75.69!3d4.81!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwNDgnMzYuMCJOIDc1wrA0MScxMi4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },
  {
    id: 10,
    name: "Telas Real - Cúcuta",
    address: "Cl. 11 N #6-43, Urbanizacion San Martin, Cúcuta",
    phone: "+57 (7) 571-2345", // Número provisional
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.9!2d-72.50!3d7.89!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwNTMnMjQuMCJOIDcywrAzMCcwMC4wIlc!5e0!3m2!1sen!2sco!4v1234567890",
  },
]

interface StoreLocationsProps {
  hideDescription?: boolean
  hideTitle?: boolean
  showViewMore?: boolean
  title?: string
  limit?: number
}

export function StoreLocations({
  hideDescription = false,
  hideTitle = false,
  showViewMore = false,
  title,
  limit
}: StoreLocationsProps) {
  const displayedStores = limit ? stores.slice(0, limit) : stores

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          {!hideTitle && (
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">{title || "Acércate a Nuestras Tiendas"}</h2>
          )}
          {!hideDescription && (
            <p className="text-lg font-light text-muted-foreground text-pretty max-w-2xl mx-auto">
              Visítanos en cualquiera de nuestros puntos de venta y descubre la calidad de nuestras telas
            </p>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${limit === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {displayedStores.map((store) => {
            const query = encodeURIComponent(`${store.name} ${store.address}`)
            const embedUrl = `https://www.google.com/maps?q=${query}&output=embed`
            const searchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`

            return (
              <div key={store.id} className="bg-background rounded-lg overflow-hidden group">
                <div className="relative h-48 bg-muted">
                  <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 block" aria-label={`Ver mapa de ${store.name}`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                      <div className="bg-white/90 text-black px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-medium text-xs flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-300">
                        <MapPin className="h-3 w-3 text-primary" />
                        Ver en Maps
                      </div>
                    </div>
                  </a>
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, pointerEvents: 'none' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Mapa de ${store.name}`}
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-light text-xl mb-4">{store.name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-light text-muted-foreground">{store.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="text-sm font-light text-muted-foreground">{store.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="text-sm font-light text-muted-foreground">{store.hours}</p>
                    </div>
                    <div className="pt-2">
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Abrir en Google Maps
                        <MapPin className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {showViewMore && (
          <div className="text-center mt-12">
            <Link href="/puntos-atencion">
              <Button variant="outline" size="lg" className="font-light min-w-[200px]">
                Ver más tiendas
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
