import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recupera tu carrito",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
