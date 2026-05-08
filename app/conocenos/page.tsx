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
      <section className="py-32 relative overflow-hidden bg-muted/10">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] z-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto space-y-32 lg:space-y-48">
            {/* Mission Block - Left Aligned */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative group w-full lg:w-1/2"
              >
                <div className="aspect-square relative rounded-[2rem] overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700">
                  <Image
                    src="/images/about/mission.png"
                    alt="Misión Telas Real"
                    fill
                    className="object-cover transition-scale duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                  
                  {/* Floating Badge */}
                  <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-white/60 text-xs uppercase tracking-widest block">Propósito</span>
                        <span className="text-white font-bold">Nuestra Misión</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative Frame */}
                <div className="absolute -top-6 -left-6 w-32 h-32 border-l-2 border-t-2 border-primary/30 rounded-tl-[3rem] -z-10" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 border-r-2 border-b-2 border-primary/30 rounded-br-[3rem] -z-10" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 text-center lg:text-left"
              >
                <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-6 block">01 / Compromiso</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-10 tracking-tight leading-tight">
                  Calidad que <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">trasciende fibras</span>
                </h2>
                <div className="space-y-8">
                  <p className="text-2xl md:text-3xl leading-relaxed text-foreground font-light italic border-l-4 border-primary pl-8 py-4 bg-primary/5 rounded-r-2xl">
                    "Proveer textiles de la más alta calidad, fomentando la creatividad y el desarrollo de la industria en Colombia."
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Nuestra misión es ser el motor que impulse el talento local, ofreciendo no solo productos, sino una experiencia de compra excepcional respaldada por nuestra asesoría experta.
                  </p>
                  <div className="pt-4 flex justify-center lg:justify-start">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                          <Image src={`/images/about/mission.png`} alt="User" width={40} height={40} className="object-cover" />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                        +5k
                      </div>
                    </div>
                    <span className="ml-4 text-sm text-muted-foreground flex items-center italic">Clientes satisfechos en todo el país</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Vision Block - Right Aligned (Reversed) */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-24">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative group w-full lg:w-1/2"
              >
                <div className="aspect-square relative rounded-[2rem] overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700">
                  <Image
                    src="/images/about/vision.png"
                    alt="Visión Telas Real"
                    fill
                    className="object-cover transition-scale duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                  
                  {/* Floating Badge */}
                  <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-white/60 text-xs uppercase tracking-widest block">Futuro</span>
                        <span className="text-white font-bold">Nuestra Visión</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative Frame */}
                <div className="absolute -top-6 -right-6 w-32 h-32 border-r-2 border-t-2 border-secondary/30 rounded-tr-[3rem] -z-10" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 border-l-2 border-b-2 border-secondary/30 rounded-bl-[3rem] -z-10" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 text-center lg:text-right"
              >
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-xs mb-6 block">02 / Horizonte</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-10 tracking-tight leading-tight text-right lg:ml-auto">
                  Liderazgo <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-secondary to-secondary/60">sin fronteras</span>
                </h2>
                <div className="space-y-8">
                  <p className="text-2xl md:text-3xl leading-relaxed text-foreground font-light italic border-r-4 border-secondary pr-8 py-4 bg-secondary/5 rounded-l-2xl">
                    "Ser el aliado textil número uno en Colombia, liderando la innovación y expandiendo nuestra esencia."
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:ml-auto lg:mr-0">
                    Proyectamos un futuro donde Telas Real sea sinónimo de excelencia internacional, manteniendo siempre el compromiso inquebrantable con la calidad que nos define.
                  </p>
                  <div className="pt-4 flex justify-center lg:justify-end items-center gap-4">
                    <span className="text-sm text-muted-foreground italic">Expansión internacional proyectada</span>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <Gem className="w-4 h-4 text-secondary" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
