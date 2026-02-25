import type { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientTiendaPage from "./ClientTiendaPage"

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const categoriaSlug = resolvedSearchParams.categoria as string;

    if (!categoriaSlug || categoriaSlug === "todos") {
        return {
            title: "Tienda | Telas Real",
            description: "Explora nuestro catálogo completo de telas de alta calidad. Encuentra telas para confección, sublimación, decoración y más.",
            alternates: {
                canonical: "/tienda"
            }
        }
    }

    // Fetch category data
    const category = await client.fetch(groq`
    *[_type == "category" && slug.current == $slug][0] {
      name,
      seoTitle,
      seoDescription,
      description
    }
  `, { slug: categoriaSlug })

    if (!category) {
        return {
            title: "Tienda | Telas Real",
            alternates: {
                canonical: "/tienda"
            }
        }
    }

    return {
        title: category.seoTitle || `${category.name} | Tienda Telas Real`,
        description: category.seoDescription || category.description || `Explora nuestra selección de telas en la categoría ${category.name}. Alta calidad y variedad.`,
        alternates: {
            canonical: `/tienda?categoria=${categoriaSlug}`
        },
        openGraph: {
            title: category.seoTitle || `${category.name} | Tienda Telas Real`,
            description: category.seoDescription || category.description || `Explora nuestra selección de telas en la categoría ${category.name}.`,
            url: `/tienda?categoria=${categoriaSlug}`,
        },
    }
}

export default async function TiendaServerPage({ searchParams }: Props) {
    return <ClientTiendaPage />
}
