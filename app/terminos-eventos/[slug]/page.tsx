import { Metadata } from "next"
import { notFound } from "next/navigation"
import { PortableText, type PortableTextComponents } from "next-sanity"
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout"
import { slugifyText } from "@/lib/seo"
import { getEventTerms } from "../data"

type Props = { params: Promise<{ slug: string }> }

const components: PortableTextComponents = {
  block: { normal: ({ children }) => <p>{children}</p> },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-5 space-y-2">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-5 space-y-2">{children}</ol>,
  },
  marks: { strong: ({ children }) => <strong className="text-foreground">{children}</strong> },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const terms = await getEventTerms(slug)
  if (!terms) return { title: "Página no encontrada" }
  return {
    title: { absolute: `Términos y Condiciones: ${terms.title} | Telas Real` },
    description: terms.intro || `Términos y condiciones de ${terms.title}.`,
    alternates: { canonical: `/terminos-eventos/${terms.slug}` },
  }
}

export default async function EventTermsPage({ params }: Props) {
  const { slug } = await params
  const terms = await getEventTerms(slug)
  if (!terms) notFound()

  const sections: LegalSection[] = (terms.sections || [])
    .filter((s) => s?.title)
    .map((s, i) => ({
      id: `${i + 1}-${slugifyText(s.title)}`,
      title: s.title,
      content: (
        <div className="space-y-3">
          <PortableText value={s.content || []} components={components} />
        </div>
      ),
    }))

  return (
    <main>
      <LegalPageLayout
        badge="Términos y condiciones del evento"
        title={terms.title}
        description={terms.intro || `Conoce las condiciones para participar en ${terms.title}.`}
        lastUpdated={terms.lastUpdated || undefined}
        sections={sections}
        relatedLinks={[
          { title: "Términos y Condiciones Generales", href: "/terminos-y-condiciones" },
          { title: "Política de Privacidad", href: "/politica-de-privacidad" },
          { title: "Centro de Ayuda y PQRS", href: "/pqr" },
        ]}
      />
    </main>
  )
}
