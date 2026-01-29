import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Palette, Sparkles, Zap, Heart, Info, DollarSign } from "lucide-react"
import Link from "next/link"
import { client } from "@/sanity/lib/client"
import { PortableText } from "next-sanity"

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Diseños Personalizados y Sublimación | Telas Real",
  description: "Cotiza servicios de sublimación profesional. Diseños personalizados en telas poliéster de alta calidad. Envíos a todo Colombia.",
  openGraph: {
    title: "Servicio de Sublimación Profesional | Telas Real",
    description: "Cotiza tu proyecto de sublimación. Diseños únicos y acabados profesionales.",
    url: "https://telasreal.com/personalizado",
  },
}

export const revalidate = 3600 // Revalidate every hour

const features = [
  {
    icon: Palette,
    title: "Diseños Ilimitados",
    description: "Crea cualquier diseño que imagines, sin restricciones de colores o patrones.",
  },
  {
    icon: Sparkles,
    title: "Alta Calidad",
    description: "Sublimación de última generación para colores vibrantes, excelente definición y durabilidad.",
  },
  {
    icon: Zap,
    title: "Entrega Rápida",
    description: "Producción eficiente, perfecto para marcas de moda o producciones a gran escala.",
  },
  {
    icon: Heart,
    title: "Acabado Profesional",
    description: "Ideal para emprendimientos textiles que buscan diferenciarse en el mercado.",
  },
]

export default async function PersonalizadoPage() {
  const data = await client.fetch<any>(`
    *[_type == "personalizadoHero"][0]
  `)
  const featuresData = await client.fetch<any>(`
    *[_type == "personalizadoFeatures"][0]
  `)
  const infoData = await client.fetch<any>(`
    *[_type == "personalizadoInfo"][0]
  `)
  const requirementsData = await client.fetch<any>(`
    *[_type == "personalizadoRequirements"][0]
  `)
  const ctaData = await client.fetch<any>(`
    *[_type == "personalizadoCTA"][0]
  `)
  const whatsappNumber = "573014453123"
  const whatsappMessage = encodeURIComponent("Hola, me gustaría cotizar el servicio de sublimación profesional.")

  return (
    <div className="min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-6 text-balance">
              {data?.title || "Servicio de Sublimación Profesional"}
            </h1>
            <p className="text-xl font-light text-muted-foreground mb-8 text-pretty max-w-5xl mx-auto">
              {data?.description || "Dale vida a tus diseños con nuestro servicio de sublimación de alta calidad. Ideal para proyectos textiles que requieren colores vibrantes, excelente definición y durabilidad."}
            </p>
            <Link
              href={data?.buttonLink || `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target={data?.buttonLink?.startsWith("http") ? "_blank" : "_self"}
              rel={data?.buttonLink?.startsWith("http") ? "noopener noreferrer" : ""}
            >
              <Button size="lg" className="font-light h-14 px-8 text-lg">
                {data?.buttonText || "Cotizar Proyecto"}
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(featuresData?.features || features).map((feature: any, index: number) => {
                const Icon = feature.icon === 'palette' ? Palette :
                  feature.icon === 'sparkles' ? Sparkles :
                    feature.icon === 'zap' ? Zap :
                      feature.icon === 'heart' ? Heart : Palette

                return (
                  <div key={index} className="text-center p-4 rounded-2xl hover:bg-muted/30 transition-colors">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm font-light text-muted-foreground text-pretty">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Info & Pricing Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">

              {/* Condiciones */}
              <div className="bg-background p-8 rounded-2xl shadow-sm border border-border/50 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Info className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-light">{infoData?.conditionsTitle || "Condiciones del Servicio"}</h2>
                </div>

                <div className="space-y-4 text-muted-foreground font-light prose prose-sm max-w-none">
                  {infoData?.conditionsContent ? (
                    <PortableText value={infoData.conditionsContent} />
                  ) : (
                    <>
                      <p>En este servicio, <strong className="font-medium text-foreground">el cliente trae su propia tela</strong>.</p>
                      <p>Para garantizar una correcta fijación del color y la calidad del estampado, la tela debe cumplir con el siguiente requisito indispensable:</p>
                      <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>La tela debe ser <strong className="font-medium text-foreground">base poliéster</strong>.</li>
                        <li>No trabajamos con materiales naturales (algodón, lino, etc.).</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Tarifas */}
              <div className="bg-background p-8 rounded-2xl shadow-sm border border-border/50 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-light">{infoData?.pricingTitle || "Tarifas por Metro"}</h2>
                </div>

                <div className="space-y-6">
                  {infoData?.pricingItems?.map((item: any, index: number) => (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${index === 0 ? 'bg-muted/50' : 'bg-muted/50 border border-primary/20'}`}>
                      <span className="font-light">{item.label}</span>
                      <span className="text-xl font-medium text-primary">{item.price} <span className="text-sm text-muted-foreground">{item.unit}</span></span>
                    </div>
                  )) || (
                      <>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                          <span className="font-light">De 1 a 100 metros</span>
                          <span className="text-xl font-medium text-primary">$7.900 <span className="text-sm text-muted-foreground">/m</span></span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-primary/20">
                          <span className="font-light">Desde 1000 metros</span>
                          <span className="text-xl font-medium text-primary">$7.000 <span className="text-sm text-muted-foreground">/m</span></span>
                        </div>
                      </>
                    )}

                  <p className="text-sm text-center text-muted-foreground italic mt-4">
                    {infoData?.pricingNote || "* Precios sujetos a cambios sin previo aviso. Aplican condiciones."}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Design Requirements Section */}
        <section id="disenos-personalizados" className="py-16 bg-background border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">{requirementsData?.title || "Diseños Personalizados"}</h2>
                <p className="text-lg text-muted-foreground font-light text-pretty max-w-5xl mx-auto">
                  {requirementsData?.intro || "¿Quieres sublimar tu propio diseño? ¡Perfecto! Solo necesitamos que nos envíes tu arte listo para producción con estas especificaciones:"}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* File Requirements */}
                <div className="bg-muted/30 p-8 rounded-2xl">
                  <h3 className="text-xl font-medium mb-6 flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
                    {requirementsData?.card1Title || "Requisitos del Archivo"}
                  </h3>
                  <ul className="space-y-4 text-muted-foreground font-light">
                    {requirementsData?.requirements?.map((req: any, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="font-medium text-foreground">{req.label}</strong> {req.value}</span>
                      </li>
                    )) || (
                        <>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-1">•</span>
                            <span><strong className="font-medium text-foreground">Formato:</strong> PDF</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-1">•</span>
                            <span><strong className="font-medium text-foreground">Medidas:</strong> 150 cm de ancho x máximo 1 m de largo</span>
                          </li>
                        </>
                      )}
                  </ul>
                </div>

                {/* Validation Process */}
                <div className="bg-muted/30 p-8 rounded-2xl">
                  <h3 className="text-xl font-medium mb-6 flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</span>
                    {requirementsData?.card2Title || "Proceso de Validación"}
                  </h3>
                  <div className="space-y-4 text-muted-foreground font-light">
                    {requirementsData?.card2Intro ? (
                      <PortableText value={requirementsData.card2Intro} />
                    ) : (
                      <p>Revisamos tu archivo y realizamos una <strong className="font-medium text-foreground">muestra de 20 × 20 cm</strong>.</p>
                    )}

                    <div>
                      <p className="mb-3 font-medium text-foreground">Puedes elegir:</p>
                      <ul className="space-y-2 ml-2">
                        {requirementsData?.validationOptions?.map((option: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="bg-primary/20 p-1 rounded-full"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div></span>
                            {option}
                          </li>
                        )) || (
                            <>
                              <li className="flex items-center gap-2">
                                <span className="bg-primary/20 p-1 rounded-full"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div></span>
                                Foto de la muestra
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="bg-primary/20 p-1 rounded-full"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div></span>
                                Envío físico (el cliente asume el flete)
                              </li>
                            </>
                          )}
                      </ul>
                    </div>
                    <div className="mt-6 p-4 bg-primary/5 rounded-xl text-sm border border-primary/10">
                      <p>{requirementsData?.card2Note || "Tras tu aprobación, enviamos a sublimación el total del pedido y te notificamos los tiempos de producción."}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-2xl font-light text-foreground">{requirementsData?.closingText || "Tu diseño, personalizado a tu medida."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-light mb-6 text-balance">
              {ctaData?.title || "Imprime, crea y transforma tus ideas"}
            </h2>
            <p className="text-xl font-light text-muted-foreground mb-8 text-pretty max-w-5xl mx-auto">
              {ctaData?.description || "Nuestro proceso garantiza un acabado profesional para tus diseños únicos."}
            </p>
            <div className="max-w-md mx-auto">
              <Link
                href={ctaData?.buttonLink || `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                target={ctaData?.buttonLink?.startsWith("http") ? "_blank" : "_self"}
                rel={ctaData?.buttonLink?.startsWith("http") ? "noopener noreferrer" : ""}
              >
                <Button size="lg" className="w-full text-lg h-14">
                  {ctaData?.buttonText || "Conocer más y Cotizar"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
