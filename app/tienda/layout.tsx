import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Tienda de Telas | Catálogo Completo | Telas Real",
    description: "Explora nuestra colección completa de telas por metro, sublimación personalizada, textiles deportivos, elegantes y más. Envíos a toda Colombia.",
    openGraph: {
        title: "Tienda de Telas Online | Telas Real",
        description: "Catálogo completo de telas y textiles. Compra online con envíos a todo el país.",
        url: "https://telasreal.com/tienda",
    }
}

export default function TiendaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
