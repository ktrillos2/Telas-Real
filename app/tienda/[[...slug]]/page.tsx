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

import { urlFor } from "@/sanity/lib/image"

export default async function TiendaServerPage({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const slugParams = resolvedParams.slug || [];
    const urlCategory = slugParams[0] || resolvedSearchParams.categoria as string;
    const urlSearch = slugParams[1] || resolvedSearchParams.search as string;
    
    // Fetch Initial Categories
    const categoriesData = await client.fetch(groq`
        *[_type == "category"] {
            "id": slug.current,
            name,
            "slug": slug.current,
            "count": count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && references(^._id)])
        }
    `)
    const totalProducts = await client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock"])`)
    const allCat = { id: "todos", name: "Todos", slug: "todos", count: totalProducts }
    
    const filteredCategories = categoriesData.filter((cat: any) => cat.count > 0)
    const initialCategories = [allCat, ...filteredCategories]

    // Fetch Initial Products
    let activeCategory = urlCategory || 'todos';
    let effectiveSearch = urlSearch || '';
    let activeUso = resolvedSearchParams.uso as string || '';

    let conditions = `_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock"`
    
    if (activeCategory !== 'todos' && activeCategory !== 'telas') {
        conditions += ` && references(*[_type == "category" && slug.current == $catSlug]._id)`
    }

    if (activeUso) {
        conditions += ` && references(*[_type == "usage" && slug.current == $usoSlug]._id)`
    }

    if (effectiveSearch) {
        const stopWords = ['tela', 'telas', 'para', 'de', 'la', 'el', 'las', 'los', 'en', 'y', 'con']
        let searchWords = effectiveSearch.toLowerCase().split(/\\s+/).filter(w => !stopWords.includes(w) && w.length > 1)
        
        if (searchWords.length === 0) {
            searchWords = effectiveSearch.toLowerCase().split(/\\s+/).filter(Boolean)
        }

        searchWords.forEach((_, index) => {
            const pName = `search${index}`
            conditions += ` && (
                title match $${pName} || 
                description match $${pName} ||
                descriptionShort match $${pName} ||
                categories[]->name match $${pName} ||
                usages[]->title match $${pName} ||
                tones[]->title match $${pName} ||
                attributes[].value match $${pName} ||
                attributes[].name match $${pName}
            )`
        })
    }

    let query = `*[${conditions}] | order(_createdAt desc) [0...20] {
        _id,
        "name": title,
        "slug": slug.current,
        pricePerKilo,
        price,
        "sale_price": coalesce(salePrice, sale_price),
        "prices": {
            "price": price,
            "regular_price": price, 
            "sale_price": coalesce(salePrice, sale_price)
        },
        "image": images[0],
        "imageAlt": images[0].alt,
        "lqip": images[0].asset->metadata.lqip,
        "images": images[]{ "src": asset->url, "id": _key },
        "categories": categories[]->{ "id": _id, name, "slug": slug.current },
        "usages": usages[]->{ "id": _id, title, "slug": slug.current },
        "tones": tones[]->{ "id": _id, title, "slug": slug.current },
        "attributes": attributes[]{ name, "terms": [{ "name": value }] },
        stock_status,
        stockStatus,
        isVisible,
        short_description,
        weight,
        badge,
        tags[]->{ "id": _id, name, "slug": slug.current },
        "categorySlugs": categories[]->slug.current
    }`

    const paramsQuery: any = {}
    if (effectiveSearch) {
        const stopWords = ['tela', 'telas', 'para', 'de', 'la', 'el', 'las', 'los', 'en', 'y', 'con']
        let searchWords = effectiveSearch.toLowerCase().split(/\\s+/).filter((w: string) => !stopWords.includes(w) && w.length > 1)
        
        if (searchWords.length === 0) {
            searchWords = effectiveSearch.toLowerCase().split(/\\s+/).filter(Boolean)
        }

        searchWords.forEach((word: string, index: number) => {
            paramsQuery[`search${index}`] = `*${word}*`
        })
    }
    if (activeCategory !== 'todos' && activeCategory !== 'telas') paramsQuery.catSlug = activeCategory
    if (activeUso) paramsQuery.usoSlug = activeUso

    const productsData = await client.fetch(query, paramsQuery)

    const initialProducts = productsData.map((p: any) => {
        const isStock = p.stockStatus !== 'outOfStock' && p.stock_status !== 'outofstock';
        return {
            id: p._id,
            name: p.name,
            slug: p.slug,
            pricePerKilo: p.pricePerKilo,
            price: p.price,
            regularPrice: p.price,
            regular_price: p.price,
            salePrice: p.sale_price,
            sale_price: p.sale_price,
            image: p.image ? urlFor(p.image).width(800).url() : "/placeholder.svg",
            imageAlt: p.imageAlt,
            blurDataURL: p.lqip,
            images: p.images || [],
            categories: p.categories || [],
            usages: p.usages || [],
            tones: p.tones || [],
            attributes: p.attributes || [],
            is_in_stock: isStock,
            short_description: p.short_description || "",
            description: p.description || "",
            weight: p.weight,
            badge: p.badge,
            tags: p.tags || [],
            categorySlugs: p.categorySlugs
        }
    });
    // Fetch Initial Usages
    const usagesData = await client.fetch(groq`
        *[_type == "usage"] {
            "id": slug.current,
            title,
            "slug": slug.current,
            "count": count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && references(^._id)])
        }
    `)
    const filteredUsages = usagesData.filter((uso: any) => uso.count > 0)

    return (
        <ClientTiendaPage 
            urlCategory={urlCategory} 
            urlSearch={urlSearch} 
            initialCategories={initialCategories}
            initialProducts={initialProducts}
            initialUsages={filteredUsages}
        />
    )
}
