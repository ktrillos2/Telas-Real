import type { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientTiendaPage from "../ClientTiendaPage"
import { fetchSalesMetrics, rankProducts, scoreProduct } from "@/lib/product-ranking"
import { urlFor } from "@/sanity/lib/image"

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
    const sortParam = resolvedSearchParams.sort as string;

    if (sortParam === 'best-sellers') {
        return {
            title: "Lo Más Vendido | Telas Más Populares | Telas Real",
            description: "Descubre los textiles favoritos y más comprados por nuestros clientes. Telas de alta calidad para confección, moda y sublimación.",
            alternates: { canonical: "/tienda?sort=best-sellers" }
        }
    }

    if (sortParam === 'trending') {
        return {
            title: "En Tendencia | Novedades y Moda Textil | Telas Real",
            description: "Explora las telas en tendencia y las últimas novedades textiles con alta demanda en Colombia.",
            alternates: { canonical: "/tienda?sort=trending" }
        }
    }

    if (sortParam === 'sale') {
        return {
            title: "Telas en Oferta y Promoción | Telas Real",
            description: "Aprovecha precios especiales y descuentos exclusivos en telas seleccionadas de primera calidad.",
            alternates: { canonical: "/tienda?sort=sale" }
        }
    }

    if (!categoriaSlug || categoriaSlug === "todos" || categoriaSlug === "telas") {
        return {
            title: searchSlug ? `Búsqueda: ${searchSlug} | Tienda` : "Tienda de Telas Online | Telas Real",
            description: "Explora nuestro catálogo completo de telas de alta calidad. Encuentra telas para confección, sublimación, decoración y más.",
            alternates: {
                canonical: "/tienda"
            }
        }
    }

    if (categoriaSlug === 'insumos') {
        return {
            title: "Insumos de Confección | Hilos y Tijeras | Telas Real",
            description: "Explora nuestro catálogo de insumos de confección textil: hilos de coser y tijeras de corte profesional.",
            alternates: {
                canonical: "/tienda/insumos"
            }
        }
    }

    // Fetch category data
    const category = await client.fetch(groq`
    *[_type == "category" && slug.current == $slug && coalesce(isActive, true) == true][0] {
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
    const resolvedSearchParams = await searchParams;
    const slugParams = resolvedParams.slug || [];
    const urlCategory = slugParams[0] || resolvedSearchParams.categoria as string;
    const urlSearch = slugParams[1] || resolvedSearchParams.search as string;
    const sortParam = resolvedSearchParams.sort as string;
    
    // Determine activeCategory and view mode
    const rawCategory = (urlCategory || (resolvedSearchParams.categoria as string) || 'todos').toLowerCase();
    const isInsumos = rawCategory === 'insumos' || rawCategory === 'hilos' || rawCategory === 'tijeras' || rawCategory.includes('hilo') || rawCategory.includes('tijera');
    const activeCategory = rawCategory;
    let effectiveSearch = urlSearch || '';
    let activeUso = resolvedSearchParams.uso as string || '';

    let initialCategories: any[] = [];
    let conditions = `_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock"`;

    if (isInsumos) {
        // Insumos mode
        const [totalInsumos, hilosCount, tijerasCount] = await Promise.all([
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
                references("cat-hilos") || references("cat-tijeras") ||
                references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
                title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
            )])`),
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
                references("cat-hilos") ||
                references(*[_type == "category" && (slug.current in ["hilos", "hilo-de-coser-40-02-colombia-categoria"])]._id) ||
                title match "*hilo*" || slug.current match "*hilo*"
            )])`),
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
                references("cat-tijeras") ||
                references(*[_type == "category" && (slug.current in ["tijeras", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
                title match "*tijera*" || slug.current match "*tijera*"
            )])`)
        ]);

        initialCategories = [
            { id: "insumos", name: "Todos los Insumos", slug: "insumos", count: totalInsumos },
            { id: "hilos", name: "Hilos", slug: "hilos", count: hilosCount },
            { id: "tijeras", name: "Tijeras", slug: "tijeras", count: tijerasCount },
        ];

        if (activeCategory === 'hilos' || activeCategory?.includes('hilo')) {
            conditions += ` && (references("cat-hilos") || references(*[_type == "category" && (slug.current in ["hilos", "hilo-de-coser-40-02-colombia-categoria"])]._id) || title match "*hilo*" || slug.current match "*hilo*")`;
        } else if (activeCategory === 'tijeras' || activeCategory?.includes('tijera')) {
            conditions += ` && (references("cat-tijeras") || references(*[_type == "category" && (slug.current in ["tijeras", "tijeras-corte-profesional-colombia-categoria"])]._id) || title match "*tijera*" || slug.current match "*tijera*")`;
        } else {
            // All insumos
            conditions += ` && (
                references("cat-hilos") || references("cat-tijeras") ||
                references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
                title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
            )`;
        }
    } else {
        // Telas mode - STRICT EXCLUSION OF INSUMOS
        conditions += ` && !(
            references("cat-hilos") || references("cat-tijeras") ||
            references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
            title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
        )`;

        const [categoriesData, totalTelas] = await Promise.all([
            client.fetch(groq`
                *[_type == "category" && coalesce(isActive, true) == true && !(slug.current in ["tijeras", "hilos", "insumos", "sudaderas", "sudadera", "telas-para-sudaderas-sweaters", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"]) && !(title match "*sudadera*" || slug.current match "*sudadera*")] {
                    "id": slug.current,
                    name,
                    "slug": slug.current,
                    "count": count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
                        references("cat-hilos") || references("cat-tijeras") ||
                        references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
                        title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
                    ) && references(^._id)])
                }
            `),
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
                references("cat-hilos") || references("cat-tijeras") ||
                references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
                title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
            )])`)
        ]);

        const allCat = { id: "todos", name: "Todos", slug: "todos", count: totalTelas };
        const filteredCategories = categoriesData.filter((cat: any) => cat.count > 0);
        initialCategories = [allCat, ...filteredCategories];

        if (activeCategory !== 'todos' && activeCategory !== 'telas') {
            conditions += ` && references(*[_type == "category" && (slug.current == $catSlug || slug.current match $catSlug)]._id)`;
        }

        if (activeUso) {
            conditions += ` && references(*[_type == "usage" && slug.current == $usoSlug]._id)`;
        }
    }

    if (effectiveSearch) {
        const stopWords = ['tela', 'telas', 'para', 'de', 'la', 'el', 'las', 'los', 'en', 'y', 'con']
        let searchWords = effectiveSearch.toLowerCase().split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 1)
        
        if (searchWords.length === 0) {
            searchWords = effectiveSearch.toLowerCase().split(/\s+/).filter(Boolean)
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

    let query = `*[${conditions}] {
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
        "images": images[]{ "src": asset->url + "?auto=format&w=600&q=70", "id": _key },
        "categories": categories[]->{ "id": _id, name, "slug": slug.current },
        "usages": usages[]->{ "id": _id, title, "slug": slug.current },
        "tones": tones[]->{ "id": _id, title, "slug": slug.current },
        "attributes": attributes[]{ name, "terms": [{ "name": value }] },
        stock_status,
        stockStatus,
        isVisible,
        short_description,
        description,
        weight,
        badge,
        _createdAt,
        tags[]->{ "id": _id, name, "slug": slug.current },
        "categorySlugs": categories[]->slug.current
    }`

    const paramsQuery: any = {}
    if (effectiveSearch) {
        const stopWords = ['tela', 'telas', 'para', 'de', 'la', 'el', 'las', 'los', 'en', 'y', 'con']
        let searchWords = effectiveSearch.toLowerCase().split(/\s+/).filter((w: string) => !stopWords.includes(w) && w.length > 1)
        
        if (searchWords.length === 0) {
            searchWords = effectiveSearch.toLowerCase().split(/\s+/).filter(Boolean)
        }

        searchWords.forEach((word: string, index: number) => {
            paramsQuery[`search${index}`] = `*${word}*`
        })
    }
    if (activeCategory !== 'todos' && activeCategory !== 'telas') paramsQuery.catSlug = activeCategory
    if (activeUso) paramsQuery.usoSlug = activeUso

    const [productsData, salesMetrics, usagesData, avatarsData] = await Promise.all([
        client.fetch(query, paramsQuery),
        fetchSalesMetrics(),
        client.fetch(groq`
            *[_type == "usage" && !(title match "*sudadera*" || slug.current match "*sudadera*")] {
                "id": slug.current,
                title,
                "slug": slug.current,
                "count": count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && references(^._id)])
            }
        `),
        client.fetch(groq`
            *[_type == "storeAvatar" && coalesce(isActive, true) == true] | order(order asc, _createdAt asc) {
                "_id": _id,
                "id": _id,
                title,
                "imageUrl": image.asset->url,
                image,
                filterType,
                "usageSlug": usage->slug.current,
                "usageTitle": usage->title,
                "usageId": usage->_id,
                "categorySlug": category->slug.current,
                "categoryName": category->name,
                "categoryId": category->_id,
                customFilter,
                order
            }
        `)
    ])

    const mappedProducts = productsData.map((p: any) => {
        const isStock = p.stockStatus !== 'outOfStock' && p.stock_status !== 'outofstock';
        const scores = scoreProduct(p, salesMetrics);

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
            _createdAt: p._createdAt,
            tags: p.tags || [],
            categorySlugs: p.categorySlugs,
            ...scores
        }
    });

    // Rank initial products on server according to active sort
    const initialProducts = rankProducts(mappedProducts, sortParam || 'default', salesMetrics);
    const filteredUsages = usagesData.filter((uso: any) => {
        const title = (uso.title || '').toLowerCase();
        const slug = (uso.slug || '').toLowerCase();
        return uso.count > 0 && !title.includes('sudadera') && !slug.includes('sudadera');
    });

    return (
        <ClientTiendaPage 
            urlCategory={urlCategory} 
            urlSearch={urlSearch} 
            initialCategories={initialCategories}
            initialProducts={initialProducts}
            initialUsages={filteredUsages}
            initialAvatars={avatarsData}
            initialSort={sortParam}
            initialSalesMetrics={salesMetrics}
        />
    )
}
