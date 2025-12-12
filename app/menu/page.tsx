
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function MenuPage() {
  const menuSections = [
    {
      title: "Productos",
      items: [
        { label: "Sublimados", href: "/tienda?categoria=sublimados" },
        { label: "Unicolor", href: "/tienda?categoria=unicolor" },
      ],
    },
    {
      title: "Usos",
      items: [
        { label: "Accesorios y Mascotas", href: "/tienda?uso=accesorios" },
        { label: "Deportivos y cómodos", href: "/tienda?uso=deportivos" },
        { label: "Dotaciones", href: "/tienda?uso=dotaciones" },
        { label: "Elegantes", href: "/tienda?uso=elegantes" },
        { label: "Moda casual", href: "/tienda?uso=casual" },
      ],
    },
    {
      title: "Tonos",
      items: [
        { label: "Amarillos", href: "/tienda?tono=amarillos" },
        { label: "Azules", href: "/tienda?tono=azules" },
        { label: "Claros", href: "/tienda?tono=claros" },
        { label: "Oscuros", href: "/tienda?tono=oscuros" },
        { label: "Rojos", href: "/tienda?tono=rojos" },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 mb-20 lg:mb-0">
        <h1 className="text-3xl font-light mb-8">Menú</h1>

        <div className="space-y-6">
          <Link
            href="/#quienes-somos"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="font-light">Quienes Somos</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Link
            href="/personalizado"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="font-light">Personalizado</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          {menuSections.map((section) => (
            <div key={section.title} className="border border-border rounded-lg p-4">
              <h2 className="font-medium text-lg mb-3">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between py-2 text-sm font-light hover:text-primary transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <Link
            href="/puntos-atencion"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="font-light">Puntos de atención</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Link
            href="/blogs"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="font-light">Blogs</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </main>
    </div>
  )
}
