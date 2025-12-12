import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Questrial } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/lib/contexts/CartContext"
import { LoadingProvider } from "@/lib/contexts/LoadingContext"
import { WhatsappButton } from "@/components/whatsapp-button"
import { MobileNav } from "@/components/mobile-nav"
import { Analytics } from "@vercel/analytics/react"
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
        url: "/og-image.jpg", // Ensure this exists or fallback to a main image
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
    images: ["/og-image.jpg"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${questrial.className} font-sans antialiased pb-16 lg:pb-0`}>
        <LoadingProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
            <WhatsappButton />
            <MobileNav />
            <Analytics />
          </CartProvider>
        </LoadingProvider>
      </body>
    </html>
  )
}
