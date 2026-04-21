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
import { Analytics } from "@vercel/analytics/react"
import { SessionProvider } from "@/components/session-provider"
import { SanityLive } from "@/components/sanity-live"
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
  alternates: {
    canonical: "/",
  },
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
    title: "Telas Real | Venta de Telas por Metro y Sublimación",
    description: "Tienda de telas online en Colombia. Diseños exclusivos y sublimación personalizada.",
    url: "https://telasreal.com",
    siteName: "Telas Real",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Ensure this exists or fallback to a main image
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
  const data = await client.fetch<{
    header: any
    footer: any
    settings: any
    stores: any[]
    usages: any[]
    tones: any[]
    offers: any[]
    sublimatedProducts: any[]
  }>(`{
    "header": *[_type == "header"][0],
    "footer": *[_type == "footer"][0],
    "settings": *[_type == "globalSettings"][0],
    "stores": *[_type == "store"] | order(id asc),
    "usages": *[_type == "usage"] | order(title asc),
    "tones": *[_type == "tone"] | order(title asc),
    "offers": *[_type == "product" && (salePrice > 0 || sale_price > 0) && stockStatus != "outOfStock" && stock_status != "outofstock"] | order(_createdAt desc)[0...4] {
      _id,
      "name": title,
      "slug": slug.current,
      price,
      salePrice,
      "sale_price": salePrice,
      "image": images[0].asset->url
    },
    "sublimatedProducts": *[_type == "product" && (
      title match "*Sublimad*" || 
      "Sublimado" in categories[]->name || 
      "Sublimada" in categories[]->name
    )] | order(_createdAt desc)[0...50] {
      _id,
      "name": title,
      "slug": slug.current,
      "image": images[0].asset->url
    }
  }`, {}, { next: { revalidate: 3600 } })

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <TrackingPixels />
      </head>
      <body className={`${questrial.className} font-sans antialiased pb-16 lg:pb-0`}>
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
              <WhatsappButton />
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
