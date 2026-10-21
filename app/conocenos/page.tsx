import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { ConocenosContent } from "./ConocenosClient"

export const revalidate = 3600

const CONOCENOS_QUERY = groq`*[_type == "conocenosPage"][0] {
  hero {
    title,
    subtitle,
    "image": image.asset->url + "?auto=format&w=1600&q=80"
  },
  mainContent {
    title,
    description,
    "bannerImage": bannerImage.asset->url + "?auto=format&w=1400&q=80"
  },
  mission {
    subtitle,
    title,
    highlightedText,
    quote,
    description,
    "image": image.asset->url + "?auto=format&w=900&q=80"
  },
  vision {
    subtitle,
    title,
    highlightedText,
    quote,
    description,
    "image": image.asset->url + "?auto=format&w=900&q=80"
  },
  timeline[] {
    year,
    title,
    description,
    "image": image.asset->url + "?auto=format&w=700&q=80"
  }
}`

// Se obtiene en el servidor para que el H1 y el contenido estén en el HTML inicial (SEO)
export default async function ConocenosPage() {
  const data = await client.fetch(CONOCENOS_QUERY).catch((error: unknown) => {
    console.error("Error fetching conocenos page:", error)
    return null
  })

  return <ConocenosContent data={data} />
}
