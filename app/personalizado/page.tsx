import { Metadata } from "next"
import { client } from "@/sanity/lib/client"
import { getWhatsAppUrl } from "@/lib/utils/whatsapp"
import { PersonalizadoClientView } from "./PersonalizadoClientView"

export const metadata: Metadata = {
  title: "Servicio de Sublimación Profesional | Diseños Personalizados",
  description: "Estampa tus diseños en telas sublimadas de alta calidad (Brush, Satín, Piel de Conejo, Scuba y más). Mínimo 10m con muestra física previa de 20x20 cm. Envíos a toda Colombia.",
  openGraph: {
    title: "Servicio de Sublimación Profesional | Telas Real",
    description: "Personaliza y sublima tus telas con colores vibrantes y máxima nitidez. Catálogo exclusivo de diseños y estampado de artes propios.",
    url: "https://telasreal.com/personalizado",
  },
}

export const revalidate = 60 // Revalidate every minute for live sanity updates

export default async function PersonalizadoPage() {
  const [
    data,
    featuresData,
    infoData,
    requirementsData,
    ctaData,
    whatsappData,
    sublimatedFabrics
  ] = await Promise.all([
    client.fetch<any>(`*[_type == "personalizadoHero"][0]`),
    client.fetch<any>(`*[_type == "personalizadoFeatures"][0]`),
    client.fetch<any>(`*[_type == "personalizadoInfo"][0]`),
    client.fetch<any>(`*[_type == "personalizadoRequirements"][0]`),
    client.fetch<any>(`*[_type == "personalizadoCTA"][0]`),
    client.fetch<any>(`{
      "whatsappNumber": coalesce(*[_type == "whatsappSettings"][0].whatsappNumber, *[_type == "globalSettings"][0].whatsappNumber, "573159021516")
    }`),
    client.fetch<any[]>(`*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
      designSelectionEnabled == true ||
      title match "*Sublimad*" || 
      "Sublimado" in categories[]->name || 
      "Sublimada" in categories[]->name ||
      "sublimados" in categories[]->slug.current ||
      "telas-sublimadas" in categories[]->slug.current
    )] | order(_createdAt desc)[0...60] {
      _id,
      "name": title,
      "slug": slug.current,
      price,
      salePrice,
      "sale_price": salePrice,
      designSelectionEnabled,
      designCategory,
      customDesignCategory,
      "image": images[0].asset->url + "?auto=format&w=600&q=80",
      "categories": categories[]->{ name, "slug": slug.current }
    }`)
  ])

  const dynamicWhatsappUrl = getWhatsAppUrl(
    whatsappData?.whatsappNumber, 
    "Hola, me gustaría cotizar el servicio de sublimación profesional."
  )

  return (
    <PersonalizadoClientView
      data={data}
      featuresData={featuresData}
      infoData={infoData}
      requirementsData={requirementsData}
      ctaData={ctaData}
      whatsappUrl={dynamicWhatsappUrl}
      sublimatedFabrics={sublimatedFabrics || []}
    />
  )
}
