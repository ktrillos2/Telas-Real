"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Phone, Mail } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { urlFor } from "@/sanity/lib/image"

export function Footer({ config, stores = [] }: { config?: any, stores?: any[] }) {
  const [footerImage, setFooterImage] = useState("/modern-fabric-store-interior.jpg")
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) {
    return null
  }

  // Fallback links if config is missing (safety)
  const col1Links = config?.column1Links || []
  const col2Links = config?.column2Links || []
  const socialLinks = config?.socials || []

  return (
    <footer className="bg-[#E8F4F8] text-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 text-center">
          {/* Column 1: Conócenos */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-6 text-primary">Conócenos</h3>
            <ul className="space-y-3">
              <li><Link href="/conocenos" className="text-sm font-light hover:text-primary transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/blog" className="text-sm font-light hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-sm font-light hover:text-primary transition-colors">¿sabías que?</Link></li>
              <li><Link href="/tienda" className="text-sm font-light hover:text-primary transition-colors">Tienda Online</Link></li>
              <li><Link href="/puntos-atencion" className="text-sm font-light hover:text-primary transition-colors">Establecimientos</Link></li>
              <li><Link href="/trabaja-con-nosotros" className="text-sm font-light hover:text-primary transition-colors">Haz parte de nuestro equipo</Link></li>
              <li><Link href="/puntos-atencion" className="text-sm font-light hover:text-primary transition-colors">Contactanos</Link></li>
            </ul>
          </div>

          {/* Column 2: Destacados */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-6 text-primary">Destacados</h3>
            <ul className="space-y-3">
              <li><Link href="/tienda?sort=best-sellers" className="text-sm font-light hover:text-primary transition-colors">Lo más vendido</Link></li>
              <li><Link href="/tienda?sort=trending" className="text-sm font-light hover:text-primary transition-colors">En tendencia</Link></li>
              <li><Link href="/tienda?sort=price-desc" className="text-sm font-light hover:text-primary transition-colors">Más costosos</Link></li>
              <li><Link href="/tienda?sort=price-asc" className="text-sm font-light hover:text-primary transition-colors">Más económicos</Link></li>
              <li><Link href="/tienda?sort=sale" className="text-sm font-light hover:text-primary transition-colors">Promoción</Link></li>
              <li><Link href="/calculadora" className="text-sm font-light hover:text-primary transition-colors">Calcula tu pedido</Link></li>
              <li><Link href="#testimonios" className="text-sm font-light hover:text-primary transition-colors">Testimonios</Link></li>
            </ul>
          </div>

          {/* Column 3: Información */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-6 text-primary">Información</h3>
            <ul className="space-y-3">
              <li><Link href="/preguntas-frecuentes" className="text-sm font-light hover:text-primary transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link href="/privacidad" className="text-sm font-light hover:text-primary transition-colors">Politica de privacidad y manejo de datos</Link></li>
              <li><Link href="/envios" className="text-sm font-light hover:text-primary transition-colors">Politica de envios</Link></li>
              <li><Link href="/terminos" className="text-sm font-light hover:text-primary transition-colors">Terminos y Condiciones</Link></li>
              <li><Link href="/pqrs" className="text-sm font-light hover:text-primary transition-colors">PQRS y Atención al cliente</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact & Socials Center */}
        <div className="mt-16 pt-8 border-t border-primary/10 flex flex-col items-center gap-8 text-center">
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Contáctanos</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <a href={`tel:${config?.contactInfo?.phone || '+573159021516'}`} className="text-base font-light hover:text-primary transition-colors">
                  {config?.contactInfo?.phone || '+57 315 902 1516'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <a
                  href={`mailto:${config?.contactInfo?.email || 'tiendavirtual@telasreal.com'}`}
                  className="text-base font-light hover:text-primary transition-colors"
                >
                  {config?.contactInfo?.email || 'tiendavirtual@telasreal.com'}
                </a>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {socialLinks.length > 0 ? (
              socialLinks.map((social: any, idx: number) => {
                const platform = social.platform?.toLowerCase() || ''
                let IconComponent: any = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>

                if (platform.includes('instagram')) IconComponent = Instagram
                else if (platform.includes('facebook')) IconComponent = Facebook
                else if (platform.includes('whatsapp')) IconComponent = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                else if (platform.includes('tiktok')) IconComponent = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                else if (platform.includes('youtube')) IconComponent = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>

                return (
                  <Link
                    key={idx}
                    href={social.url || '#'}
                    target="_blank"
                    className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors text-primary"
                  >
                    <IconComponent className="h-7 w-7" />
                  </Link>
                )
              })
            ) : (
              <>
                <Link href="#" className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors text-primary">
                  <Instagram className="h-7 w-7" />
                </Link>
                <Link href="#" className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors text-primary">
                  <Facebook className="h-7 w-7" />
                </Link>
                <Link href="#" className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors text-primary">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Payment Methods & Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary/10 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-medium text-primary uppercase tracking-widest">Métodos de pago</span>
            <div className="flex flex-wrap justify-center items-center gap-6">
              {(config?.paymentMethods?.length ?? 0) > 0 ? (
                config.paymentMethods.map((pm: any) => (
                  <Image
                    key={pm._key}
                    src={urlFor(pm).url()}
                    alt="Método de pago"
                    width={80}
                    height={40}
                    className="h-8 w-auto object-contain grayscale hover:grayscale-0 transition-all"
                  />
                ))
              ) : (
                <>
                  <Image src="/nequi-logo.png" alt="Nequi" width={80} height={40} className="h-8 w-auto object-contain" />
                  <Image src="/daviplata-logo.png" alt="Daviplata" width={80} height={40} className="h-8 w-auto object-contain" />
                  <Image src="/bancolombia-logo.png" alt="Bancolombia" width={80} height={40} className="h-8 w-auto object-contain" />
                  <Image src="/pse-logo.png" alt="PSE" width={80} height={40} className="h-8 w-auto object-contain" />
                  <Image src="/visa-logo.png" alt="Visa" width={80} height={40} className="h-8 w-auto object-contain" />
                  <Image src="/mastercard-logo.png" alt="Mastercard" width={80} height={40} className="h-8 w-auto object-contain" />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm font-light text-muted-foreground">
              © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
            </p>
            <a 
              href="https://www.kytcode.lat" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Desarrollado por K&T <span className="text-black">🖤</span>
            </a>
          </div>
        </div>
      </div>
    </footer>

  )
}
