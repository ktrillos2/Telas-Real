"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Phone, Mail } from "lucide-react"
import { useHomeData } from "@/lib/hooks/useHomeData"
import { getWordPressImageUrls } from "@/lib/wordpress-media"
import { useState, useEffect } from "react"
import { stores } from "@/components/store-locations"

export function Footer() {
  const { data } = useHomeData()
  const [footerImage, setFooterImage] = useState("/modern-fabric-store-interior.jpg")

  useEffect(() => {
    async function fetchFooterImage() {
      if (data?.acf?.imagen_footer) {
        const urls = await getWordPressImageUrls([data.acf.imagen_footer])
        if (urls[0]) {
          setFooterImage(urls[0])
        }
      }
    }
    fetchFooterImage()
  }, [data])

  return (
    <footer className="bg-[#E8F4F8] text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo */}
          <div>
            <Image
              src={footerImage}
              alt="Tienda Telas Real"
              width={300}
              height={200}
              className="mb-4 rounded-lg w-full max-w-[280px] h-auto"
            />
            <h3 className="font-medium text-lg">Telas Real</h3>
          </div>

          {/* Establecimientos */}
          <div>
            <h3 className="font-medium text-base mb-4">Establecimientos</h3>
            <ul className="space-y-2">
              {stores.map((store) => (
                <li key={store.id}>
                  <Link
                    href="/puntos-atencion"
                    className="text-sm font-light hover:text-primary transition-colors"
                  >
                    {store.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* TelasReal.com */}
          <div>
            <h3 className="font-medium text-base mb-4">TelasReal.com</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#quienes-somos" className="text-sm font-light hover:text-primary transition-colors">
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link
                  href="/tienda?filtro=material"
                  className="text-sm font-light hover:text-primary transition-colors"
                >
                  Telas por material
                </Link>
              </li>
              <li>
                <Link href="/tienda?filtro=uso" className="text-sm font-light hover:text-primary transition-colors">
                  Telas por uso
                </Link>
              </li>
              <li>
                <Link href="/personalizado" className="text-sm font-light hover:text-primary transition-colors">
                  Personalizados
                </Link>
              </li>
              <li>
                <Link href="/puntos-atencion" className="text-sm font-light hover:text-primary transition-colors">
                  Puntos de atención
                </Link>
              </li>
              <li>
                <Link href="/#testimonios" className="text-sm font-light hover:text-primary transition-colors">
                  Testimonios
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-sm font-light hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/politicas" className="text-sm font-light hover:text-primary transition-colors">
                  Conoce nuestras políticas
                </Link>
              </li>
            </ul>
          </div>

          {/* Textiles */}
          <div>
            <h3 className="font-medium text-base mb-4">Textiles</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tienda?tipo=brush" className="text-sm font-light hover:text-primary transition-colors">
                  Tela Brush
                </Link>
              </li>
              <li>
                <Link href="/tienda?tipo=satin" className="text-sm font-light hover:text-primary transition-colors">
                  Tela Satín
                </Link>
              </li>
              <li>
                <Link href="/tienda?tipo=rib" className="text-sm font-light hover:text-primary transition-colors">
                  Tela Rib
                </Link>
              </li>
              <li>
                <Link href="/tienda?tipo=jacquard" className="text-sm font-light hover:text-primary transition-colors">
                  Tela Jacquar
                </Link>
              </li>
              <li>
                <Link href="/tienda?tipo=linos" className="text-sm font-light hover:text-primary transition-colors">
                  Linos
                </Link>
              </li>
              <li>
                <Link href="/tienda?tipo=ojalillos" className="text-sm font-light hover:text-primary transition-colors">
                  Ojalillos
                </Link>
              </li>
              <li>
                <Link
                  href="/tienda?tipo=seda-mango"
                  className="text-sm font-light hover:text-primary transition-colors"
                >
                  Tela Seda Mango
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contáctanos */}
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="font-medium text-base mb-4">Contáctanos</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href="tel:+573014453123" className="text-sm font-light hover:text-primary transition-colors">
                    +57 301 4453123
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a
                    href="mailto:tiendavirtual@telasreal.com"
                    className="text-sm font-light hover:text-primary transition-colors"
                  >
                    tiendavirtual@telasreal.com
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="https://instagram.com/telasreal"
                target="_blank"
                className="w-10 h-10 rounded-lg border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com/profile.php?id=61567301410489"
                target="_blank"
                className="w-10 h-10 rounded-lg border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://tiktok.com/@telasreal"
                target="_blank"
                className="w-10 h-10 rounded-lg border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-light text-muted-foreground">
              © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-light text-muted-foreground mr-2">Métodos de pago:</span>
                <div className="flex items-center gap-2">
                  <Image src="/nequi-logo.png" alt="Nequi" width={40} height={24} className="h-4 w-auto object-contain" />
                  <Image src="/daviplata-logo.png" alt="Daviplata" width={40} height={24} className="h-6 w-auto object-contain" />
                  <Image src="/bancolombia-logo.png" alt="Bancolombia" width={40} height={24} className="h-6 w-auto object-contain" />
                  <Image src="/pse-logo.png" alt="PSE" width={40} height={24} className="h-6 w-auto object-contain" />
                  <Image src="/visa-logo.png" alt="Visa" width={40} height={24} className="h-4 w-auto object-contain" />
                  <Image src="/mastercard-logo.png" alt="Mastercard" width={40} height={24} className="h-4 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
