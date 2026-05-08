"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Store, Truck, Award, Gem, CheckCircle2, History, Target, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useHomeData } from "@/lib/hooks/useHomeData"
import { PortableText } from "next-sanity"

const leftCards = [
  {
    icon: Store,
    label: "11 Tiendas",
    sublabel: "Presencia en las principales ciudades de Colombia",
  },
  {
    icon: Truck,
    label: "Envíos",
    sublabel: "Logística nacional eficiente y segura",
  },
]

const rightCards = [
  {
    icon: Award,
    label: "7 Años",
    sublabel: "Liderando la innovación en el sector textil",
  },
  {
    icon: Gem,
    label: "Premium",
    sublabel: "Calidad garantizada en cada fibra",
  },
]

const timelineEvents = [
  {
    year: "2018",
    title: "El Comienzo",
    description: "Telas Real nace con la visión de democratizar el acceso a textiles de alta calidad en Colombia, empezando con una pequeña selección de telas exclusivas.",
  },
  {
    year: "2019",
    title: "Primera Sede",
    description: "Abrimos nuestra primera tienda física, estableciendo un estándar de atención personalizada y asesoría experta que nos define hasta hoy.",
  },
  {
    year: "2021",
    title: "Expansión Nacional",
    description: "A pesar de los retos globales, logramos expandir nuestra presencia a 5 ciudades clave, convirtiéndonos en referentes del sector.",
  },
  {
    year: "2023",
    title: "Transformación Digital",
    description: "Lanzamos nuestra plataforma e-commerce, llevando la experiencia de Telas Real a cada rincón del país con envíos garantizados.",
  },
  {
    year: "2025",
    title: "Liderazgo Textil",
    description: "Alcanzamos el hito de 11 tiendas físicas y consolidamos nuestra posición como la tienda de telas más innovadora de Colombia.",
  },
]

export default function ConocenosPage() {
  const { data, loading } = useHomeData()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  
  useEffect(() => {
    if (data?.acf?.conocenos?.imagen) {
      setImageUrl(data.acf.conocenos.imagen)
    }
  }, [data])

  if (loading || !data?.acf?.conocenos) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-muted rounded mb-4" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const { titulo, descripcion } = data.acf.conocenos

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={imageUrl}
            alt="Conócenos – Telas Real"
            fill
            className="object-cover brightness-[0.4]"
            priority
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/80 text-sm tracking-[0.4em] uppercase mb-4 block"
          >
            Nuestra Historia
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-5xl md:text-7xl font-black tracking-tight"
          >
            Telas Real
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-1 w-24 bg-white mx-auto mt-8"
          />
        </div>
      </section>

      {/* Main Content (Legacy About Us Style) */}
      <section className="py-24 container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-16 items-center mb-32">
          {/* Left Cards */}
          <div className="flex flex-col gap-12">
            {leftCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center lg:text-right"
              >
                <div className="mb-4 flex justify-center lg:justify-end">
                  <card.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{card.label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{card.sublabel}</p>
              </motion.div>
            ))}
          </div>

          {/* Center Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] relative rounded-2xl overflow-hidden shadow-2xl border border-border p-4 bg-background">
              <Image
                src={imageUrl}
                alt={titulo}
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-primary/20 rounded-tr-3xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b-2 border-l-2 border-primary/20 rounded-bl-3xl" />
          </motion.div>

          {/* Right Cards */}
          <div className="flex flex-col gap-12">
            {rightCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center lg:text-left"
              >
                <div className="mb-4 flex justify-center lg:justify-start">
                  <card.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{card.label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{card.sublabel}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl font-bold mb-12 tracking-tight"
          >
            {titulo}
          </motion.h2>
          <div className="text-lg leading-relaxed text-muted-foreground text-justify mb-16">
            <PortableText
              value={descripcion}
              components={{
                block: {
                  normal: ({ children }) => <p className="mb-6">{children}</p>,
                },
              }}
            />
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <History className="w-4 h-4" /> Trayectoria
            </div>
            <h2 className="text-4xl md:text-5xl font-black">Nuestra Línea de Tiempo</h2>
          </div>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />

            <div className="space-y-24">
              {timelineEvents.map((event, i) => (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-center gap-8 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 w-full md:w-1/2 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className={`p-8 rounded-3xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      <span className="text-primary font-black text-4xl mb-2 block">{event.year}</span>
                      <h3 className="text-2xl font-bold mb-4">{event.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                    </div>
                  </div>

                  {/* Circle */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Redesigned for Visual Excellence */}
      <section className="py-32 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] z-0">
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full border-[40px] border-primary" />
          <div className="absolute bottom-1/4 right-10 w-64 h-64 rounded-full border-[20px] border-secondary" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Mission Block - Left Aligned */}
            <div className="mb-24 lg:mb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative flex-shrink-0"
              >
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                  <Target className="w-32 h-32 md:w-40 md:h-40 text-primary opacity-20" />
                  <span className="absolute inset-0 flex items-center justify-center text-7xl md:text-9xl font-black text-primary/5 select-none">01</span>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-background p-6 rounded-2xl shadow-xl border border-border">
                   <Target className="w-8 h-8 text-primary" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 text-center lg:text-left"
              >
                <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Nuestro Propósito</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 tracking-tight">Nuestra Misión</h2>
                <div className="relative">
                  <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground font-light italic border-l-4 border-primary pl-8 py-2">
                    "Proveer textiles de la más alta calidad, fomentando la creatividad y el desarrollo de la industria de la moda y el diseño en Colombia."
                  </p>
                  <p className="mt-8 text-lg text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Buscamos ser el motor que impulse el talento local, ofreciendo no solo productos, sino una experiencia de compra excepcional respaldada por nuestra asesoría experta.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Vision Block - Right Aligned (Reversed) */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative flex-shrink-0"
              >
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-secondary/10 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                  <Eye className="w-32 h-32 md:w-40 md:h-40 text-secondary opacity-20" />
                  <span className="absolute inset-0 flex items-center justify-center text-7xl md:text-9xl font-black text-secondary/5 select-none">02</span>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-background p-6 rounded-2xl shadow-xl border border-border">
                   <Eye className="w-8 h-8 text-secondary" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 text-center lg:text-right"
              >
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Nuestro Horizonte</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 tracking-tight">Nuestra Visión</h2>
                <div className="relative">
                  <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground font-light italic border-r-4 border-secondary pr-8 py-2">
                    "Ser reconocidos como el aliado textil número uno en Colombia, liderando la innovación en el mercado y expandiendo nuestra esencia."
                  </p>
                  <p className="mt-8 text-lg text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto lg:ml-auto lg:mr-0">
                    Proyectamos un futuro donde Telas Real sea sinónimo de excelencia internacional, manteniendo siempre el compromiso inquebrantable con la calidad que nos define.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
