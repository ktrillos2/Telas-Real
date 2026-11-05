import type { Metadata } from "next"
import { DEFAULT_OG_IMAGES } from "@/lib/seo"

export const metadata: Metadata = {
  title: { absolute: "Conócenos | Telas Real - Nuestra Historia y Pasión Textil" },
  description:
    "Descubre la historia de Telas Real, líder en tendencias textiles en Colombia con más de 7 años de trayectoria y 11 puntos de venta físicos a nivel nacional.",
  openGraph: {
    title: "Conócenos | Telas Real",
    description:
      "Descubre la historia de Telas Real, líder en tendencias textiles en Colombia con más de 7 años de trayectoria y 11 puntos de venta.",
    type: "website",
    locale: "es_CO",
    images: DEFAULT_OG_IMAGES,
  },
  alternates: {
    canonical: "/conocenos",
  },
}

export default function ConocenosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
