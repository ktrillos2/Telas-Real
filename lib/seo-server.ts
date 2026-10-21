import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { cleanSlug } from "@/lib/seo"

/**
 * Devuelve el slug tal como está guardado en Sanity para un slug público "limpio".
 * Permite que URLs normalizadas (sin espacios) sigan resolviendo documentos cuyo
 * slug en Sanity aún tenga espacios accidentales (p. ej. " tela-toalla-colombia").
 */
export async function resolveStoredSlug(type: "product" | "category" | "post", slug: string): Promise<string> {
  if (!slug) return slug
  const exists = await client.fetch<number>(
    groq`count(*[_type == $type && slug.current == $slug])`,
    { type, slug }
  )
  if (exists > 0) return slug

  const allSlugs = await client.fetch<string[]>(
    groq`*[_type == $type && defined(slug.current)].slug.current`,
    { type }
  )
  const target = cleanSlug(slug).toLowerCase()
  return allSlugs.find((s) => cleanSlug(s).toLowerCase() === target) || slug
}


export { productPublicPath } from "@/lib/product-url"
