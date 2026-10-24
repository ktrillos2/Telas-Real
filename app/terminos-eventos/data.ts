import { groq } from "next-sanity"
import { cachedClient, client } from "@/sanity/lib/client"
import { DEFAULT_EVENT_TERMS, type EventTermsDoc } from "@/lib/event-terms-default"

// Id fijo del concurso inicial: así se crea una sola vez aunque varias visitas lleguen a la vez
export const DEFAULT_EVENT_TERMS_ID = "eventTerms-gran-concurso-de-disfraces"

/**
 * Crea en Sanity el documento del concurso inicial si todavía no existe, para que aparezca en
 * "Promociones y Eventos → Términos de Eventos" y se edite desde ahí. No pisa ediciones:
 * createIfNotExists no hace nada si el documento ya está. Usa el token del servidor.
 */
async function ensureDefaultEventTerms(): Promise<void> {
  try {
    await client.withConfig({ useCdn: false }).createIfNotExists({
      _id: DEFAULT_EVENT_TERMS_ID,
      _type: "eventTerms",
      title: DEFAULT_EVENT_TERMS.title,
      slug: { _type: "slug", current: DEFAULT_EVENT_TERMS.slug },
      isActive: true,
      intro: DEFAULT_EVENT_TERMS.intro,
      lastUpdated: DEFAULT_EVENT_TERMS.lastUpdated,
      sections: DEFAULT_EVENT_TERMS.sections,
    })
  } catch (error) {
    console.error("[terminos-eventos] No se pudo crear el documento inicial en Sanity:", error)
  }
}

/** Términos de un evento: el documento de Sanity o, si aún no existe, el contenido inicial (y se crea en Sanity). */
export async function getEventTerms(slug: string): Promise<EventTermsDoc | null> {
  const doc = await cachedClient.fetch<EventTermsDoc | null>(
    groq`*[_type == "eventTerms" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
      title, "slug": slug.current, isActive, intro, lastUpdated, sections
    }`,
    { slug }
  )
  if (doc) return doc.isActive === false ? null : doc
  if (slug !== DEFAULT_EVENT_TERMS.slug) return null
  await ensureDefaultEventTerms()
  return DEFAULT_EVENT_TERMS
}

export async function listEventTerms(): Promise<Array<Pick<EventTermsDoc, "title" | "slug" | "intro" | "lastUpdated">>> {
  const docs = await cachedClient.fetch<Array<Pick<EventTermsDoc, "title" | "slug" | "intro" | "lastUpdated">>>(
    groq`*[_type == "eventTerms" && isActive != false && defined(slug.current) && !(_id in path("drafts.**"))] | order(_createdAt desc){
      title, "slug": slug.current, intro, lastUpdated
    }`
  )
  // El concurso inicial aparece mientras no se haya creado en el admin (si se creó y se ocultó, no)
  const defaultCreated = await cachedClient.fetch<boolean>(
    groq`defined(*[_type == "eventTerms" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id)`,
    { slug: DEFAULT_EVENT_TERMS.slug }
  )
  if (defaultCreated) return docs || []
  await ensureDefaultEventTerms()
  return [DEFAULT_EVENT_TERMS, ...(docs || [])]
}
