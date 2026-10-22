import type { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientTiendaPage from "./ClientTiendaPage"
import { fetchSalesMetrics, rankProducts, scoreProduct } from "@/lib/product-ranking"
import { urlFor } from "@/sanity/lib/image"
import { groupCatalogProducts } from "@/lib/unified-fabrics"
import { absoluteUrl, breadcrumbJsonLd, categoryLabel, cleanSlug, safeDecode, stripHtml, usageSlug } from "@/lib/seo"
import { resolveStoredSlug } from "@/lib/seo-server"
import { productPublicPath } from "@/lib/product-url"

// Las búsquedas internas y colecciones armadas por parámetros no deben indexarse,
// pero sí permitir que Google siga los enlaces a los productos.
const NOINDEX_FOLLOW = { index: false, follow: true } as const

export type Props = {
    params: Promise<{ slug?: string[] }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Landing indexable construida sobre el catálogo (p. ej. /usos/<slug>)
export type TiendaLanding = {
    heading: string
    intro?: string
    path: string
    breadcrumbName: string
    uso?: string
}


export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    
    // Parse slug: /tienda/[categoria]/[search]
    const slugParams = resolvedParams.slug || [];
    let categoriaSlug = cleanSlug(safeDecode(slugParams[0] || resolvedSearchParams.categoria as string)) || undefined;
    const rawSearch = slugParams[1] || resolvedSearchParams.search as string || resolvedSearchParams.q as string;
    const searchSlug = rawSearch ? safeDecode(rawSearch) : undefined;
    const sortParam = resolvedSearchParams.sort as string;
    const customTitle = (resolvedSearchParams.titulo as string) || (resolvedSearchParams.title as string);
    const isFilteredCollection = Boolean(
        resolvedSearchParams.productos || resolvedSearchParams.products ||
        resolvedSearchParams.categorias || resolvedSearchParams.categories
    );

    if (customTitle) {
        return {
            title: { absolute: `${customTitle} | Telas Real` },
            description: `Explora la colección "${customTitle}" en Telas Real. Gran variedad de telas de excelente calidad para tus confecciones.`,
            alternates: { canonical: "/tienda" },
            robots: NOINDEX_FOLLOW,
        }
    }

    if (searchSlug || isFilteredCollection) {
        const categoryCanonical = categoriaSlug && categoriaSlug !== "todos" && categoriaSlug !== "telas" ? `/tienda/${categoriaSlug}` : "/tienda"
        return {
            title: searchSlug ? `Búsqueda: ${searchSlug}` : "Selección de telas",
            description: searchSlug
                ? `Resultados de búsqueda para "${searchSlug}" en el catálogo de telas de Telas Real.`
                : "Selección de telas del catálogo de Telas Real.",
            alternates: { canonical: categoryCanonical },
            robots: NOINDEX_FOLLOW,
        }
    }

    // /tienda?uso=<slug> sin otros filtros: su versión indexable es la landing /usos/<slug>
    const usoParam = resolvedSearchParams.uso as string
    if (usoParam && (!categoriaSlug || categoriaSlug === "todos" || categoriaSlug === "telas") && !sortParam) {
        return {
            title: "Telas por uso",
            alternates: { canonical: `/usos/${encodeURIComponent(usageSlug(usoParam))}` },
        }
    }

    if (sortParam === 'best-sellers') {
        return {
            title: { absolute: "Lo Más Vendido | Telas Más Populares | Telas Real" },
            description: "Descubre los textiles favoritos y más comprados por nuestros clientes. Telas de alta calidad para confección, moda y sublimación.",
            alternates: { canonical: "/tienda?sort=best-sellers" }
        }
    }

    if (sortParam === 'trending') {
        return {
            title: { absolute: "En Tendencia | Novedades y Moda Textil | Telas Real" },
            description: "Explora las telas en tendencia y las últimas novedades textiles con alta demanda en Colombia.",
            alternates: { canonical: "/tienda?sort=trending" }
        }
    }

    if (sortParam === 'sale') {
        return {
            title: { absolute: "Telas en Oferta y Promoción | Telas Real" },
            description: "Aprovecha precios especiales y descuentos exclusivos en telas seleccionadas de primera calidad.",
            alternates: { canonical: "/tienda?sort=sale" }
        }
    }

    if (!categoriaSlug || categoriaSlug === "todos" || categoriaSlug === "telas") {
        return {
            title: { absolute: "Tienda de Telas Online por Metro | Telas Real" },
            description: "Explora nuestro catálogo completo de telas de alta calidad. Encuentra telas para confección, sublimación, decoración y más.",
            alternates: {
                canonical: "/tienda"
            }
        }
    }

    if (categoriaSlug === 'insumos' || categoriaSlug === 'hilos' || categoriaSlug === 'tijeras') {
        const titleSuffix = categoriaSlug === 'hilos' ? 'Hilos de Coser' : categoriaSlug === 'tijeras' ? 'Tijeras de Corte' : 'Hilos y Tijeras';
        return {
            title: { absolute: `${titleSuffix} | Insumos de Confección | Telas Real` },
            description: "Explora nuestro catálogo de insumos de confección textil: hilos de coser y tijeras de corte profesional.",
            alternates: {
                canonical: `/tienda/${categoriaSlug}`
            }
        }
    }

    // Fetch category data
    const storedCategorySlug = await resolveStoredSlug("category", categoriaSlug as string)
    const category = await client.fetch(groq`
    *[_type == "category" && slug.current == $slug && coalesce(isActive, true) == true][0] {
      name,
      seoTitle,
      seoDescription,
      description
    }
  `, { slug: storedCategorySlug })

    if (!category) {
        // Categoría inexistente o inactiva: no indexar y consolidar en /tienda
        return {
            title: "Tienda",
            alternates: {
                canonical: "/tienda"
            },
            robots: NOINDEX_FOLLOW,
        }
    }

    const categoryDescription = category.seoDescription || stripHtml(category.description) || `Compra ${category.name} por metro en Telas Real. Consulta ancho, composición, usos y precios con envíos a toda Colombia.`
    return {
        title: category.seoTitle ? { absolute: category.seoTitle } : `${categoryLabel(category.name)} por Metro en Colombia`,
        description: categoryDescription,
        alternates: {
            canonical: `/tienda/${categoriaSlug}`
        },
        openGraph: {
            title: category.seoTitle || `${categoryLabel(category.name)} por Metro | Telas Real`,
            description: categoryDescription,
            url: `/tienda/${categoriaSlug}`,
        },
    }
}

export async function TiendaServerPage({ params, searchParams, landing }: Props & { landing?: TiendaLanding }) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const slugParams = resolvedParams.slug || [];
    const publicCategorySlug = cleanSlug(safeDecode(slugParams[0] || resolvedSearchParams.categoria as string)) || undefined;
    const RESERVED_CATEGORY_SLUGS = ['todos', 'telas', 'insumos', 'hilos', 'tijeras']
    const urlCategory = publicCategorySlug && !RESERVED_CATEGORY_SLUGS.includes(publicCategorySlug.toLowerCase())
        ? await resolveStoredSlug("category", publicCategorySlug)
        : publicCategorySlug;
    // Decodificar el término (/tienda/telas/piel%20de%20durazno → "piel de durazno") para separar bien las palabras
    const rawUrlSearch = slugParams[1] || resolvedSearchParams.search as string;
    const urlSearch = rawUrlSearch ? safeDecode(rawUrlSearch) : rawUrlSearch;
    const sortParam = resolvedSearchParams.sort as string;
    const customTitle = (resolvedSearchParams.titulo as string) || (resolvedSearchParams.title as string) || '';
    const productosParam = (resolvedSearchParams.productos as string) || (resolvedSearchParams.products as string) || '';
    const categoriasParam = (resolvedSearchParams.categorias as string) || (resolvedSearchParams.categories as string) || '';

    const productFilters = productosParam ? productosParam.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean) : [];
    const categoryFilters = categoriasParam ? categoriasParam.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean) : [];
    
    // Determine activeCategory and view mode
    const rawCategory = (urlCategory || (resolvedSearchParams.categoria as string) || 'todos').toLowerCase();
    let effectiveSearch = urlSearch || (resolvedSearchParams.search as string) || (resolvedSearchParams.q as string) || '';
    let activeUso = landing?.uso || resolvedSearchParams.uso as string || '';

    const isSearchForInsumo = /hilo|tijera/i.test(effectiveSearch);
    const isInsumos = rawCategory === 'insumos' || rawCategory === 'hilos' || rawCategory === 'tijeras' || /hilo|tijera/i.test(rawCategory) || isSearchForInsumo;
    const activeCategory = isSearchForInsumo && (rawCategory === 'todos' || rawCategory === 'telas')
        ? (effectiveSearch.toLowerCase().includes('tijera') ? 'tijeras' : 'hilos')
        : rawCategory;

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
        // Telas mode - STRICT EXCLUSION OF INSUMOS only when browsing fabrics without a search query and without specific banner filters
        if (!effectiveSearch && productFilters.length === 0 && categoryFilters.length === 0) {
            conditions += ` && !(
                references("cat-hilos") || references("cat-tijeras") ||
                references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
                title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
            )`;
        }

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
                    ) && references(^._id) && (
                        (^.slug.current match "*sublimad*" || ^.name match "*sublimad*") ||
                        !(title match "*Sublimad*" || slug.current match "*sublimad*" || count(categories[@->slug.current match "*sublimad*"]) > 0 || designSelectionEnabled == true)
                    )])
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
            const isSublimadosCategory = activeCategory === 'sublimados' || activeCategory.includes('sublimad');
            if (isSublimadosCategory) {
                conditions += ` && (references(*[_type == "category" && (slug.current == $catSlug || slug.current match $catSlug)]._id) || title match "*Sublimad*" || slug.current match "*sublimad*" || designSelectionEnabled == true)`;
            } else {
                conditions += ` && references(*[_type == "category" && (slug.current == $catSlug || slug.current match $catSlug)]._id) && !(title match "*Sublimad*" || slug.current match "*sublimad*" || count(categories[@->slug.current match "*sublimad*"]) > 0 || designSelectionEnabled == true)`;
            }
        }

        if (activeUso) {
            conditions += ` && references(*[_type == "usage" && slug.current == $usoSlug]._id)`;
        }
    }

    const paramsQuery: any = {}

    if (productFilters.length > 0 || categoryFilters.length > 0) {
        const filterClauses: string[] = [];
        if (productFilters.length > 0) {
            filterClauses.push(`(slug.current in $bannerProducts || _id in $bannerProducts)`);
            paramsQuery.bannerProducts = productFilters;
        }
        if (categoryFilters.length > 0) {
            filterClauses.push(`references(*[_type == "category" && (slug.current in $bannerCategories || _id in $bannerCategories)]._id)`);
            paramsQuery.bannerCategories = categoryFilters;
        }
        conditions += ` && (${filterClauses.join(" || ")})`;
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
        rendimiento,
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
        "tones": tones[]->{ "id": _id, title, value, "slug": slug.current },
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
        "categorySlugs": categories[]->slug.current,
        colorGroup,
        "colorGroupCount": count(*[_type == "product" && defined(^.colorGroup) && lower(colorGroup) == lower(^.colorGroup) && stockStatus != "outOfStock" && stock_status != "outofstock"])
    }`

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
                "imageUrl": image.asset->url + "?auto=format&w=220&q=75",
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
            rendimiento: p.rendimiento,
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
            colorGroup: p.colorGroup,
            colorGroupCount: p.colorGroupCount,
            categorySlugs: p.categorySlugs,
            ...scores
        }
    });

    // Always display all individual products as they are in the store list (each color shown individually)
    const initialProducts = rankProducts(mappedProducts, sortParam || 'default', salesMetrics);
    const filteredUsages = usagesData.filter((uso: any) => {
        const title = (uso.title || '').toLowerCase();
        const slug = (uso.slug || '').toLowerCase();
        return uso.count > 0 && !title.includes('sudadera') && !slug.includes('sudadera');
    });

    // Datos de la categoría para H1, texto introductorio y datos estructurados
    const isRealCategory = Boolean(urlCategory && !RESERVED_CATEGORY_SLUGS.includes(rawCategory))
    const categoryInfo = isRealCategory
        ? await client.fetch(groq`*[_type == "category" && slug.current == $slug][0]{ name, description }`, { slug: urlCategory })
        : null
    const categoryHeading = landing?.heading || (categoryInfo?.name ? `${categoryLabel(categoryInfo.name)} por metro` : undefined)
    const categoryIntro = landing?.intro || stripHtml(categoryInfo?.description) || undefined

    const listPath = landing?.path || (categoryInfo && publicCategorySlug ? `/tienda/${publicCategorySlug}` : '/tienda')
    const listName = landing?.breadcrumbName || (categoryInfo?.name ? categoryLabel(categoryInfo.name) : 'Tienda de Telas')
    const hasOwnLanding = Boolean(landing || (categoryInfo && publicCategorySlug))
    const isIndexableListing = !effectiveSearch && !customTitle && productFilters.length === 0 && categoryFilters.length === 0
    const listingJsonLd = isIndexableListing ? [
        breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Tienda', path: '/tienda' },
            ...(hasOwnLanding ? [{ name: listName, path: listPath }] : []),
        ]),
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: listName,
            url: absoluteUrl(listPath),
            ...(categoryIntro ? { description: categoryIntro } : {}),
            isPartOf: { "@id": absoluteUrl('/#website') },
            mainEntity: {
                "@type": "ItemList",
                numberOfItems: initialProducts.length,
                itemListElement: initialProducts.slice(0, 30).map((p: any, idx: number) => ({
                    "@type": "ListItem",
                    position: idx + 1,
                    url: absoluteUrl(productPublicPath(p.slug)),
                    name: p.name,
                })),
            },
        },
    ] : null

    return (
        <>
        {listingJsonLd && (
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
            />
        )}
        <ClientTiendaPage 
            categoryHeading={categoryHeading}
            categoryIntro={categoryIntro}
            urlUso={landing?.uso}
            urlCategory={urlCategory} 
            urlSearch={urlSearch} 
            initialCategories={initialCategories}
            initialProducts={initialProducts}
            initialUsages={filteredUsages}
            initialAvatars={avatarsData}
            initialSort={sortParam}
            initialSalesMetrics={salesMetrics}
            urlTitle={customTitle}
            urlProducts={productosParam}
            urlCategories={categoriasParam}
        />
        </>
    )
}
