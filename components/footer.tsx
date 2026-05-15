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
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo */}
          <div>
            <Image
              src={config?.footerLogo ? urlFor(config.footerLogo).url() : footerImage}
              alt="Tienda Telas Real"
              width={300}
              height={200}
              priority
              className="mb-4 rounded-lg w-full max-w-[400px] h-auto"
            />
            <h3 className="font-medium text-lg">Telas Real</h3>
          </div>

          {/* Establecimientos */}
          <div>
            <h3 className="font-medium text-base mb-4">Establecimientos</h3>
            <ul className="space-y-2">
              {stores.slice(0, 5).map((store) => (
                <li key={store._id}>
                  <Link
                    href="/puntos-atencion"
                    className="text-sm font-light hover:text-primary transition-colors"
                  >
                    {store.name}
                  </Link>
                </li>
              ))}
              {stores.length > 5 && (
                <li>
                  <Link href="/puntos-atencion" className="text-sm font-medium hover:text-primary transition-colors">
                    Ver todas...
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 1 (TelasReal.com) */}
          <div>
            <h3 className="font-medium text-base mb-4">TelasReal.com</h3>
            <ul className="space-y-2">
              {col1Links.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link 
                    href={
                      link.label?.toLowerCase() === 'conócenos' || link.label?.toLowerCase() === 'conocenos' || link.label?.toLowerCase() === 'quienes somos' || link.label?.toLowerCase() === 'quiénes somos'
                        ? '/conocenos'
                        : link.url || '#'
                    } 
                    className="text-sm font-light hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/calculadora" className="text-sm font-light hover:text-primary transition-colors">
                  Calculadora
                </Link>
              </li>
              <li>
                <Link href="/puntos-atencion" className="text-sm font-light hover:text-primary transition-colors">
                  Ubicaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 (Textiles) */}
          <div>
            <h3 className="font-medium text-base mb-4">Textiles</h3>
            <ul className="space-y-2">
              {col2Links.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link 
                    href={
                      link.label?.toLowerCase() === 'conócenos' || link.label?.toLowerCase() === 'conocenos' || link.label?.toLowerCase() === 'quienes somos' || link.label?.toLowerCase() === 'quiénes somos'
                        ? '/conocenos'
                        : link.url || '#'
                    } 
                    className="text-sm font-light hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
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
                  <a href={`tel:${config?.contactInfo?.phone}`} className="text-sm font-light hover:text-primary transition-colors">
                    {config?.contactInfo?.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a
                    href={`mailto:${config?.contactInfo?.email}`}
                    className="text-sm font-light hover:text-primary transition-colors"
                  >
                    {config?.contactInfo?.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {socialLinks.map((social: any, idx: number) => {
                const Icon = social.platform === 'Instagram' ? Instagram :
                  social.platform === 'Facebook' ? Facebook :
                    () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>

                return (
                  <Link
                    key={idx}
                    href={social.url || '#'}
                    target="_blank"
                    className="w-10 h-10 rounded-lg border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <p className="text-xs font-light text-muted-foreground">
                © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
              </p>
              <div className="flex items-center text-xs font-light text-muted-foreground">
                <span className="mx-2 hidden md:inline">|</span>
                <a href="https://www.kytcode.lat" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors font-medium ml-1 flex items-center gap-1">
                  Desarrollado por K&T <span className="text-black">🖤</span>
                </a>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 mt-4 md:mt-0">
              <span className="text-xs font-light text-muted-foreground">Métodos de pago:</span>
              <div className="flex items-center gap-2">
                {(config?.paymentMethods?.length ?? 0) > 0 ? (
                  config.paymentMethods.map((pm: any) => (
                    <Image
                      key={pm._key}
                      src={urlFor(pm).url()}
                      alt="Método de pago"
                      width={40}
                      height={24}
                      className="h-4 w-auto object-contain"
                      style={{ width: "auto" }}
                    />
                  ))
                ) : (
                  <>
                    <Image src="/nequi-logo.png" alt="Nequi" width={40} height={24} className="h-4 w-auto object-contain" style={{ width: "auto" }} />
                    <Image src="/daviplata-logo.png" alt="Daviplata" width={40} height={24} className="object-contain" />
                    <Image src="/bancolombia-logo.png" alt="Bancolombia" width={40} height={24} className="object-contain" />
                    <Image src="/pse-logo.png" alt="PSE" width={40} height={24} className="object-contain" />
                    <Image src="/visa-logo.png" alt="Visa" width={40} height={24} className="h-4 w-auto object-contain" style={{ width: "auto" }} />
                    <Image src="/mastercard-logo.png" alt="Mastercard" width={40} height={24} className="h-4 w-auto object-contain" style={{ width: "auto" }} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
