import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Calculadora de Telas: Convierte Kilos a Metros",
  description:
    "Calcula cuántos metros rinde un kilo de tela y el precio estimado por metro o por rollo según la referencia. Herramienta gratuita de Telas Real para planear tus confecciones.",
  alternates: { canonical: "/calculadora" },
}

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
  return children
}
