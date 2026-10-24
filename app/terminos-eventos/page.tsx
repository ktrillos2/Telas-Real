import { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, ScrollText } from "lucide-react"
import { listEventTerms } from "./data"

export const metadata: Metadata = {
  title: { absolute: "Términos y Condiciones de Eventos y Concursos | Telas Real" },
  description: "Términos y condiciones de los concursos, eventos y actividades promocionales de Telas Real.",
  alternates: { canonical: "/terminos-eventos" },
}

export default async function EventTermsIndexPage() {
  const events = await listEventTerms()
  return (
    <main className="bg-background min-h-screen">
      <section className="bg-gradient-to-b from-[#E8F4F8] via-[#F4F9FB] to-background py-14 md:py-20 px-4 border-b border-primary/10">
        <div className="container mx-auto max-w-3xl text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-light">Términos y condiciones de eventos</h1>
          <p className="text-muted-foreground">Condiciones de los concursos y actividades promocionales de Telas Real.</p>
        </div>
      </section>
      <section className="container mx-auto max-w-3xl px-4 py-10 space-y-3">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay eventos vigentes en este momento.</p>
        ) : (
          events.map((e) => (
            <Link
              key={e.slug}
              href={`/terminos-eventos/${e.slug}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition"
            >
              <ScrollText className="w-6 h-6 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.title}</p>
                {e.intro && <p className="text-sm text-muted-foreground line-clamp-2">{e.intro}</p>}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </Link>
          ))
        )}
      </section>
    </main>
  )
}
