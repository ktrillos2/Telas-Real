"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useHomeData } from "@/lib/hooks/useHomeData"
import { PortableText } from "next-sanity"
import { motion } from "framer-motion"
import { ArrowRight, Store, Truck, Award, Gem } from "lucide-react"

const leftCards = [
  {
    icon: Store,
    label: "11 Tiendas",
    sublabel: "Presencia en las principales ciudades de Colombia",
    iconColor: "hsl(var(--foreground))",
  },
  {
    icon: Truck,
    label: "Envíos",
    sublabel: "Logística nacional eficiente y segura",
    iconColor: "hsl(var(--foreground))",
  },
]

const rightCards = [
  {
    icon: Award,
    label: "7 Años",
    sublabel: "Liderando la innovación en el sector textil",
    iconColor: "hsl(var(--foreground))",
  },
  {
    icon: Gem,
    label: "Premium",
    sublabel: "Calidad garantizada en cada fibra",
    iconColor: "hsl(var(--foreground))",
  },
]

export function AboutUs() {
  const { data, loading } = useHomeData()
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg")
  const [imgW, setImgW] = useState(800)
  const [imgH, setImgH] = useState(700)

  useEffect(() => {
    if (data?.acf?.conocenos?.imagen) {
      const src = data.acf.conocenos.imagen
      setImageUrl(src)
      const img = new window.Image()
      img.onload = () => {
        setImgW(img.naturalWidth)
        setImgH(img.naturalHeight)
      }
      img.src = src
    }
  }, [data])

  if (loading || !data?.acf?.conocenos) return null

  const { titulo, descripcion, boton } = data.acf.conocenos

  return (
    <section id="quienes-somos" style={{ padding: "120px 0", overflow: "hidden", position: "relative", backgroundColor: "hsl(var(--background))" }}>
      
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* Encabezado – Estilo Editorial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: "100px" }}
        >
          <span
            style={{
              fontSize: "12px",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
              fontWeight: 500,
              display: "block",
              marginBottom: "16px"
            }}
          >
            Descubre nuestra esencia
          </span>
          <h2
            style={{
              fontSize: "clamp(3rem, 7vw, 4.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              margin: "0 auto",
              maxWidth: "900px",
              color: "hsl(var(--foreground))",
              textTransform: "capitalize"
            }}
          >
            {titulo}
          </h2>
          <div
            style={{
              width: "60px",
              height: "2px",
              background: "hsl(var(--foreground))",
              margin: "32px auto 0",
            }}
          />
        </motion.div>

        {/* Banner de Imagen Simplificado */}
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "circOut" }}
            style={{ position: "relative" }}
          >
            <Link href="/puntos-atencion" className="block group">
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  transition: "transform 0.5s ease",
                  overflow: "hidden",
                  borderRadius: "8px"
                }}
                className="group-hover:scale-[1.01]"
              >
                <Image
                  src="/images/banner-test.png"
                  alt="Banner Telas Real"
                  width={1400}
                  height={500}
                  style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                  priority
                />
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Narrativa Final + CTA */}
        <div style={{ position: "relative", maxWidth: "1000px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: "center" }}
          >
            <div
              style={{
                fontSize: "1.35rem",
                lineHeight: 1.7,
                color: "hsl(var(--foreground))",
                marginBottom: "64px",
                fontWeight: 300,
                textAlign: "justify",
                hyphens: "auto",
                columnCount: 1,
                padding: "0 40px"
              }}
            >
              <PortableText
                value={descripcion}
                components={{
                  block: {
                    normal: ({ children }) => <p style={{ marginBottom: "32px" }}>{children}</p>,
                  },
                }}
              />
            </div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                style={{
                  height: "70px",
                  padding: "0 64px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: "0px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)"
                }}
                asChild
              >
                <Link href="/puntos-atencion" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {boton}
                  <ArrowRight style={{ width: "20px", height: "20px" }} />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 80px !important;
          }
        }
      `}</style>
    </section>
  )
}
