import { Header } from "@/components/header"
import { TrackingPixels } from "@/components/tracking-pixels"
import { client } from "@/sanity/lib/client"
import { Footer } from "@/components/footer"
import { Questrial } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/lib/contexts/CartContext"
import { HomeDataProvider } from "@/lib/contexts/HomeDataContext"
import { WhatsappButton } from "@/components/whatsapp-button"
import { MobileNav } from "@/components/mobile-nav"
import { PopupManager } from "@/components/popup-manager"
import { Analytics } from "@vercel/analytics/react"
import { SessionProvider } from "@/components/session-provider"
import { SanityLive } from "@/components/sanity-live"
import { headers } from "next/headers"
import { SITE_URL } from "@/lib/seo"
import "./globals.css"
import type { Metadata, Viewport } from "next"

const questrial = Questrial({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Telas Real | Venta de Telas por Metro y Sublimación",
    template: "%s | Telas Real"
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://telasreal.com'),
  description: "Tienda de telas online en Colombia. Encuentra diseños exclusivos, sublimación personalizada y gran variedad de textiles. Envíos nacionales.",
  keywords: ["telas", "sublimación", "textiles", "moda", "colombia", "telas personalizadas", "estampados"],
  authors: [{ name: "Telas Real" }],
  creator: "Telas Real",
  publisher: "Telas Real",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicon-16x16.png",
      },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "es_CO",
    title: "Telas Real | Venta de Telas por Metro y Sublimación",
    description: "Tienda de telas online en Colombia. Encuentra diseños exclusivos, sublimación personalizada y gran variedad de textiles. Envíos nacionales.",
    siteName: "Telas Real",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Telas Real - Textiles y Sublimación",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Telas Real",
    description: "Venta de telas por metro y sublimación personalizada en Colombia.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Telas Real",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
  verification: {
    google: "u0_FYhJ5ojRBiSoeIVtUDHqBKrrINz6ifhp94C3jZYk",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/studio')

  if (isAdmin) {
    return (
      <html lang="es" suppressHydrationWarning>
        <body className={`${questrial.className} font-sans antialiased`}>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </body>
      </html>
    )
  }

  const data = await client.fetch<{
    header: any
    footer: any
    settings: any
    whatsapp: any
    popupConfig: any
    lowStockProducts: any[]
    stores: any[]
    usages: any[]
    tones: any[]
    offers: any[]
    sublimatedProducts: any[]
  }>(`{
    "header": *[_type == "header"][0],
    "footer": *[_type == "footer"][0],
    "settings": *[_type == "globalSettings"][0],
    "whatsapp": *[_type == "whatsappSettings"][0],
    "popupConfig": *[_type == "popupConfig"][0] {
      activePopup,
      delaySeconds,
      displayFrequency,
      position,
      urgencyMode,
      "urgencyProduct": urgencyProduct->{
        _id,
        title,
        "slug": slug.current,
        "imageUrl": images[0].asset->url,
        price,
        salePrice,
        inventory
      },
      urgencyCustomTitle,
      urgencyCustomMessage,
      urgencyBadgeText,
      urgencyStockRemaining,
      urgencyStockUnit,
      "urgencyCustomImageUrl": urgencyCustomImage.asset->url,
      urgencyButtonText,
      urgencyButtonUrl,
      urgencySocialProofCount,
      urgencyAutoStockThreshold,
      urgencyAutoBadgeText,
      urgencyAutoMessageTemplate,
      urgencyThemeColor,
      urgencyShowProgressBar,
      urgencyProgressPercent,
      promoMode,
      promoBadgeText,
      promoTitle,
      promoDescription,
      "promoImageUrl": promoImage.asset->url,
      promoButtonText,
      promoButtonUrl,
      promoDisplayType,
      "promoProduct": promoProduct->{
        _id,
        title,
        "slug": slug.current,
        "imageUrl": images[0].asset->url,
        price,
        salePrice
      }
    },
    "lowStockProducts": *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
      references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) ||
      title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
    )] | order(_createdAt desc)[0...6] {
      _id,
      "title": title,
      "slug": slug.current,
      "imageUrl": images[0].asset->url,
      price,
      salePrice,
      inventory
    },
    "stores": *[_type == "store"] | order(id asc),
    "usages": *[_type == "usage" && !(title match "*sudadera*" || slug.current match "*sudadera*")] | order(title asc),
    "tones": *[_type == "tone"] | order(title asc) {
      _id,
      title,
      "value": value,
      slug
    },
    "offers": *[_type == "product" && (salePrice > 0 || sale_price > 0) && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
      references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) ||
      title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
    )] | order(_createdAt desc)[0...4] {
      _id,
      "name": title,
      "slug": slug.current,
      price,
      salePrice,
      "sale_price": salePrice,
      "image": images[0].asset->url
    },
    "sublimatedProducts": *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
      title match "*Sublimad*" || 
      "Sublimado" in categories[]->name || 
      "Sublimada" in categories[]->name
    )] | order(_createdAt desc)[0...50] {
      _id,
      "name": title,
      "slug": slug.current,
      "image": images[0].asset->url
    }
  }`, {}, { next: { revalidate: 0 } })

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Telas Real",
        "legalName": "Telas Real S.A.S.",
        "alternateName": "Telas Real Colombia",
        "taxID": "901232650-1",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/logo-loading.png`,
          "caption": "Telas Real"
        },
        "description": "Venta de telas por metro, textiles para confección y sublimación personalizada en Colombia con envíos nacionales desde Bogotá.",
        "email": "tiendavirtual@telasreal.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Calle 12 # 38-65",
          "addressLocality": "Bogotá",
          "addressRegion": "Bogotá D.C.",
          "addressCountry": "CO"
        },
        "areaServed": { "@type": "Country", "name": "Colombia" },
        "knowsAbout": ["Telas por metro", "Telas por kilo", "Sublimación textil", "Textiles para confección", "Venta mayorista de telas"],
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+57 315 902 1516",
            "email": "tiendavirtual@telasreal.com",
            "contactType": "customer service",
            "areaServed": "CO",
            "availableLanguage": ["es"]
          }
        ],
        "sameAs": [
          "https://www.instagram.com/telasreal/",
          "https://www.facebook.com/telasrealcolombia",
          "https://www.tiktok.com/@telasreal"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": "Telas Real",
        "inLanguage": "es-CO",
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${SITE_URL}/tienda/telas/{search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    ]
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://up.pixel.ad/assets/up.js?um=1"></script>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `cntrUpTag.track('cntrData', 'd877157877f34aba');` }}></script>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "y0a6o1j54v");
        ` }}></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className={`${questrial.className} font-sans antialiased pb-16 lg:pb-0`}>
        <TrackingPixels />
        <SessionProvider>
          <HomeDataProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen">
                <Header
                  config={data?.header}
                  usages={data?.usages}
                  tones={data?.tones}
                  offers={data?.offers}
                  sublimatedProducts={data?.sublimatedProducts}
                />
                <main className="flex-1">
                  {children}
                </main>
                <Footer config={data?.footer} stores={data?.stores} />
              </div>
              <Toaster />
              <PopupManager
                config={data?.popupConfig}
                fallbackLowStockProducts={data?.lowStockProducts}
                fallbackOfferProducts={data?.offers}
              />
              <WhatsappButton 
                phoneNumber={data?.whatsapp?.whatsappNumber || data?.settings?.whatsappNumber} 
                message={data?.whatsapp?.whatsappMessage || data?.settings?.whatsappMessage} 
              />
              <MobileNav
                config={data?.header}
                usages={data?.usages}
                tones={data?.tones}
                offers={data?.offers}
                sublimatedProducts={data?.sublimatedProducts}
              />
              <Analytics />
            </CartProvider>
          </HomeDataProvider>
        </SessionProvider>
        <SanityLive />
      </body>
    </html >
  )
}
