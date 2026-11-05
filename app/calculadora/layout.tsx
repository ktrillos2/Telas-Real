import type { Metadata } from "next"
import { JsonLd, ORGANIZATION_REF } from "@/components/json-ld"
import { absoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Calculadora de Telas: Convierte Kilos a Metros",
  description:
    "Calcula cuántos metros rinde un kilo de tela y el precio estimado por metro o por rollo según la referencia. Herramienta gratuita de Telas Real para planear tus confecciones.",
  alternates: { canonical: "/calculadora" },
}

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Calculadora de telas: kilos a metros",
          description: "Calcula cuántos metros rinde un kilo de tela y el precio estimado por metro o por rollo según la referencia.",
          url: absoluteUrl("/calculadora"),
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          inLanguage: "es-CO",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
          publisher: ORGANIZATION_REF,
        }}
      />
      {children}
    </>
  )
}
