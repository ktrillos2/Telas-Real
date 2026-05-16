"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Store, Truck, Award, Gem, CheckCircle2, History, Target, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { client } from "@/sanity/lib/client"
import { groq, PortableText } from "next-sanity"

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

const CONOCENOS_QUERY = groq`*[_type == "conocenosPage"][0] {
  hero {
    title,
    subtitle,
    "image": image.asset->url
  },
  mainContent {
    title,
    description,
    "bannerImage": bannerImage.asset->url
  },
  mission {
    subtitle,
    title,
    highlightedText,
    quote,
    description,
    "image": image.asset->url
  },
  vision {
    subtitle,
    title,
    highlightedText,
    quote,
    description,
    "image": image.asset->url
  },
  timeline[] {
    year,
    title,
    description,
    "image": image.asset->url
  }
}`

export default function ConocenosPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await client.fetch(CONOCENOS_QUERY)
        setData(result)
      } catch (error) {
        console.error("Error fetching conocenos page:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-muted rounded mb-4" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return <ConocenosContent data={data} />
}

function ConocenosContent({ data }: { data: any }) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  })
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  const hero = data?.hero || { title: "Telas Real", subtitle: "Nuestra Historia", image: "/placeholder.svg" }
  const mainContent = data?.mainContent || { title: "Tu aliado textil en Colombia", description: [], bannerImage: "/images/banner-test.png" }
  const mission = data?.mission || { 
    subtitle: "01 / Compromiso", 
    title: "Calidad que", 
    highlightedText: "trasciende fibras",
    quote: "Proveer textiles de la más alta calidad...",
    description: "Nuestra misión es ser el motor...",
    image: "/images/about/mission.png"
  }
  const vision = data?.vision || {
    subtitle: "02 / Horizonte",
    title: "Liderazgo",
    highlightedText: "sin fronteras",
    quote: "Ser el aliado textil número uno...",
    description: "Proyectamos un futuro donde...",
    image: "/images/about/vision.png"
  }
  const timeline = data?.timeline || [
    { year: "2018", title: "El Comienzo", description: "Telas Real nace..." },
    { year: "2019", title: "Primera Sede", description: "Abrimos..." },
    { year: "2021", title: "Expansión Nacional", description: "Logramos..." },
    { year: "2023", title: "Transformación Digital", description: "Lanzamos..." },
    { year: "2025", title: "Liderazgo Textil", description: "Alcanzamos..." },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={hero.image || "/placeholder.svg"}
            alt={hero.title}
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
            {hero.subtitle}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-5xl md:text-7xl font-black tracking-tight"
          >
            {hero.title}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-1 w-24 bg-white mx-auto mt-8"
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 container mx-auto px-4">
        <div className="max-w-5xl mx-auto mb-32 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <Link href="/puntos-atencion" className="block group">
              <div className="relative rounded-3xl overflow-hidden transition-all duration-700 group-hover:scale-[1.01] aspect-[16/9] md:aspect-[21/7]">
                <Image
                  src={mainContent.bannerImage || "/images/banner-test.png"}
                  alt="Banner Telas Real"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl font-bold mb-12 tracking-tight"
          >
            {mainContent.title}
          </motion.h2>
          <div className="text-lg leading-relaxed text-muted-foreground text-justify mb-16">
            <PortableText
              value={mainContent.description}
              components={{
                block: {
                  normal: ({ children }) => <p className="mb-6">{children}</p>,
                },
              }}
            />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className=" relative overflow-hidden bg-muted/10">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] z-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto space-y-32 lg:space-y-48">
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
                    src={mission.image || "/images/about/mission.png"}
                    alt="Misión Telas Real"
                    fill
                    className="object-cover transition-scale duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
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
                <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-6 block">{mission.subtitle}</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-10 tracking-tight leading-tight">
                  {mission.title} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">{mission.highlightedText}</span>
                </h2>
                <div className="space-y-8">
                  <p className="text-2xl md:text-3xl leading-relaxed text-foreground font-light italic border-l-4 border-primary pl-8 py-4 bg-primary/5 rounded-r-2xl">
                    "{mission.quote}"
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                    {mission.description}
                  </p>
                </div>
              </motion.div>
            </div>

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
                    src={vision.image || "/images/about/vision.png"}
                    alt="Visión Telas Real"
                    fill
                    className="object-cover transition-scale duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                  <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-white/60 text-xs uppercase tracking-widest block">Futuro</span>
                        <span className="text-white font-bold">Nuestra Visión</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-32 h-32 border-r-2 border-t-2 border-primary/30 rounded-tr-[3rem] -z-10" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 border-l-2 border-b-2 border-primary/30 rounded-bl-[3rem] -z-10" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 text-center lg:text-right"
              >
                <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-6 block">{vision.subtitle}</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-10 tracking-tight leading-tight text-right lg:ml-auto">
                  {vision.title} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-primary/60">{vision.highlightedText}</span>
                </h2>
                <div className="space-y-8">
                  <p className="text-2xl md:text-3xl leading-relaxed text-foreground font-light italic border-r-4 border-primary pr-8 py-4 bg-primary/5 rounded-l-2xl">
                    "{vision.quote}"
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:ml-auto lg:mr-0">
                    {vision.description}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-32 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] z-0 flex items-center justify-center overflow-hidden">
           <div className="w-[1000px] h-[1000px] bg-primary rounded-full blur-[150px] opacity-30" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="relative text-center mb-32 flex justify-center items-center min-h-[150px]">
            <div className="relative z-10 flex flex-col items-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black uppercase tracking-wider"
              >
                Trayectoria
              </motion.h2>
            </div>
          </div>

          <div ref={timelineRef} className="relative max-w-6xl mx-auto pb-10">
            <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-1 bg-primary/20 rounded-full" />
            <motion.div 
              style={{ scaleY, transformOrigin: "top" }}
              className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-primary to-primary/20 z-0 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
            />

            <div className="space-y-32">
              {timeline.map((event: any, i: number) => (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-center group gap-8 md:gap-0 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-[calc(50%-4rem)] h-[2px] bg-gradient-to-r ${
                    i % 2 === 0 ? "from-transparent via-primary/30 to-primary left-1/2" : "from-primary via-primary/30 to-transparent right-1/2"
                  } hidden md:block transition-all duration-700 opacity-0 group-hover:opacity-100 z-0`} />

                  <div className={`flex-1 w-full md:w-1/2 flex ${i % 2 === 0 ? "md:justify-end md:pr-32 lg:pr-48" : "md:justify-start md:pl-32 lg:pl-48"}`}>
                    <div className="w-full max-w-lg p-8 md:p-10 rounded-[2rem] bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(var(--primary),0.08)] relative overflow-hidden transition-all duration-500 hover:-translate-y-2 group-hover:border-primary/20 z-30">
                      <div className={`absolute top-0 ${i % 2 === 0 ? "right-0" : "left-0"} w-1.5 h-full bg-gradient-to-b from-primary/40 to-primary/5 group-hover:from-primary group-hover:to-primary/40 transition-colors duration-500`} />
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-primary/10 text-primary px-5 py-2 rounded-full font-black tracking-widest text-xl">
                          {event.year}
                        </div>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-black mb-4 uppercase tracking-tight text-foreground/90 group-hover:text-primary transition-colors duration-300">
                        {event.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-lg font-light">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-background/50 backdrop-blur-md border border-primary/30 flex items-center justify-center group-hover:border-primary transition-colors duration-500 group-hover:scale-110 shadow-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors duration-500 shadow-[0_0_15px_rgba(var(--primary),0.5)] group-hover:shadow-[0_0_30px_rgba(var(--primary),0.8)]">
                        <div className="w-4 h-4 rounded-full bg-primary group-hover:bg-white transition-colors duration-500" />
                      </div>
                    </div>
                  </div>

                  <div className={`flex-1 w-full md:w-1/2 flex ${i % 2 === 0 ? "md:justify-start md:pl-32 lg:pl-48" : "md:justify-end md:pr-32 lg:pr-48"}`}>
                    <div className="w-full max-w-lg relative aspect-[4/3] rounded-[2rem] overflow-hidden group-hover:shadow-2xl transition-all duration-700 group-hover:-translate-y-2 z-30 border border-black/5 dark:border-white/5">
                      {event.image ? (
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted/30 flex flex-col items-center justify-center group-hover:bg-muted/50 transition-colors duration-500">
                           <div className="w-20 h-20 rounded-full bg-background/50 flex items-center justify-center mb-4 text-primary/40 group-hover:text-primary transition-colors duration-500 shadow-sm">
                             <History className="w-10 h-10" />
                           </div>
                           <span className="text-muted-foreground font-bold text-lg uppercase tracking-widest opacity-60">Memoria Visual</span>
                           <span className="text-primary/60 font-black text-2xl mt-1">{event.year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
