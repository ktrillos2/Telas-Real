import type { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientTiendaPage from "../ClientTiendaPage"

type Props = {
    params: Promise<{ slug?: string[] }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    
    // Parse slug: /tienda/[categoria]/[search]
    const slugParams = resolvedParams.slug || [];
    let categoriaSlug = slugParams[0] || resolvedSearchParams.categoria as string;
    const searchSlug = slugParams[1] || resolvedSearchParams.search as string;

    if (!categoriaSlug || categoriaSlug === "todos") {
        return {
            title: searchSlug ? `Búsqueda: ${searchSlug} | Tienda` : "Tienda",
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
            title: searchSlug ? `Búsqueda: ${searchSlug} | Tienda` : "Tienda",
            alternates: {
                canonical: "/tienda"
            }
        }
    }

    return {
        title: category.seoTitle ? { absolute: category.seoTitle } : `${category.name} | Tienda`,
        description: category.seoDescription || category.description || `Explora nuestra selección de telas en la categoría ${category.name}. Alta calidad y variedad.`,
        alternates: {
            canonical: `/tienda/${categoriaSlug}${searchSlug ? `/${searchSlug}` : ''}`
        },
        openGraph: {
            title: category.seoTitle || `${category.name} | Tienda Telas Real`,
            description: category.seoDescription || category.description || `Explora nuestra selección de telas en la categoría ${category.name}.`,
            url: `/tienda/${categoriaSlug}${searchSlug ? `/${searchSlug}` : ''}`,
        },
    }
}

export default async function TiendaServerPage({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const slugParams = resolvedParams.slug || [];
    
    return <ClientTiendaPage urlCategory={slugParams[0]} urlSearch={slugParams[1]} />
}
