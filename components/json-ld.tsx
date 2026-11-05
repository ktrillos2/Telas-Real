import { SITE_URL } from "@/lib/seo"

/** Datos estructurados (schema.org) en JSON-LD. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}

/** Referencia a la organización definida en el layout (Organization con @id). */
export const ORGANIZATION_REF = { "@id": `${SITE_URL}/#organization` }
