import { groq } from "next-sanity"
import { cachedClient } from "@/sanity/lib/client"
import { DEFAULT_EVENT_TERMS, type EventTermsDoc } from "@/lib/event-terms-default"

/** Términos de un evento: el documento de Sanity o, si aún no se publicó, el contenido inicial. */
export async function getEventTerms(slug: string): Promise<EventTermsDoc | null> {
  const doc = await cachedClient.fetch<EventTermsDoc | null>(
    groq`*[_type == "eventTerms" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
      title, "slug": slug.current, isActive, intro, lastUpdated, sections
    }`,
    { slug }
  )
  if (doc) return doc.isActive === false ? null : doc
  return slug === DEFAULT_EVENT_TERMS.slug ? DEFAULT_EVENT_TERMS : null
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
  return defaultCreated ? docs || [] : [DEFAULT_EVENT_TERMS, ...(docs || [])]
}
