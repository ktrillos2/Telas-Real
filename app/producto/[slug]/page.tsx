import { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientProductView from "./ClientProductView"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

// Data Fetching Helper
async function getProduct(slug: string, colorQuery?: string) {
  const decodedSlug = decodeURIComponent(slug);

  // =========================================================================
  // UNIFICACIÓN DE BRUSH (PIEL DE DURAZNO): 52 Colores con SEO & GEO
  // Rutas: /producto/tela-brush-piel-de-durazno o /producto/tela-brush-colores-prueba
  // o cualquiera de los slugs individuales de brush
  // =========================================================================
  const isUnifiedBrushRoute = decodedSlug === 'tela-brush-piel-de-durazno' || decodedSlug === 'tela-brush-colores-prueba';
  const isIndividualBrushSlug = (decodedSlug.startsWith('tela-brush-') || decodedSlug.startsWith('brush-')) &&
    !decodedSlug.includes('standard') &&
    !decodedSlug.includes('sublimado');

  if (isUnifiedBrushRoute || isIndividualBrushSlug) {
    try {
      const brushProducts = await client.fetch(groq`
        *[_type == "product" && (title match "*Brush*" || title match "*brush*" || slug.current match "*brush*") && !(title match "*Standard*") && !(slug.current match "*standard*") && !(title match "*Sublimado*") && !(slug.current match "*sublimado*") && !(_id in ["product-brush-blanco", "product-brush-crudo", "product-brush-unicolor"]) && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc) {
          _id,
          "name": title,
          "slug": slug.current,
          price,
          pricePerKilo,
          rendimiento,
          "sale_price": coalesce(salePrice, sale_price),
          "image": images[0].asset->url + "?auto=format&w=800&q=80",
          "thumbnail": images[0].asset->url + "?auto=format&w=200&q=70",
          "images": images[]{ "src": asset->url + "?auto=format&w=1200&q=80", "id": _key, "thumbnail": asset->url + "?auto=format&w=200&q=70", "alt": alt },
          "categories": categories[]->{ "id": _id, name, "slug": slug.current, rendimiento, pricePerKilo },
          "tones": tones[]->{ title, value, "slug": slug.current },
          "usages": usages[]->{ title, "slug": slug.current },
          "attributes": attributes[]{ _key, name, value, visible, global },
          stockStatus,
          stock_status,
          badge,
          "short_description": coalesce(descriptionShort, short_description),
          shipping
        }
      `);

      if (brushProducts && brushProducts.length > 0) {
        // Filtrar estrictamente solo variaciones con inventario disponible (inStock)
        const inStockBrush = brushProducts.filter((p: any) => 
          p.stockStatus !== 'outOfStock' && 
          p.stockStatus !== 'outofstock' && 
          p.stock_status !== 'outOfStock' && 
          p.stock_status !== 'outofstock'
        );
        const activeList = inStockBrush.length > 0 ? inStockBrush : brushProducts;

        const colorVariants = activeList.map((p: any) => {
          const cleanName = p.name
            .replace(/^Brush\s*/i, "")
            .replace(/\s*X Metros.*/i, "")
            .replace(/\|\s*Piel de Durazno.*/i, "")
            .trim() || p.tones?.[0]?.title || "Color";

          return {
            id: p._id,
            name: cleanName,
            fullName: p.name,
            slug: p.slug,
            price: p.price || 11100,
            pricePerKilo: p.pricePerKilo,
            rendimiento: p.rendimiento,
            sale_price: p.sale_price,
            image: p.image,
            thumbnail: p.thumbnail,
            images: p.images || [{ src: p.image, id: p._id, thumbnail: p.thumbnail }],
            toneHex: p.tones?.[0]?.value || "#e2e8f0",
            toneTitle: p.tones?.[0]?.title || "Otros",
            stockStatus: p.stockStatus || "inStock",
            attributes: p.attributes || []
          };
        });

        // Determinar variante inicial seleccionada (por query param ?color=, o por slug individual, o default inStock)
        const targetVariant = colorVariants.find(
          (v: any) => (colorQuery && (v.slug === colorQuery || v.id === colorQuery || v.name.toLowerCase() === colorQuery.toLowerCase())) ||
                      (!isUnifiedBrushRoute && (v.slug === decodedSlug || v.id === decodedSlug))
        ) || colorVariants.find((v: any) => v.stockStatus === 'inStock') || colorVariants[0];

        const seoTitle = targetVariant
          ? `Tela Brush ${targetVariant.name} X Metros | Piel de Durazno - Telas Real Colombia`
          : `Tela Brush X Metros | Piel de Durazno (50+ Colores) | Telas Real Colombia`;

        const seoDescription = targetVariant
          ? `Compra Tela Brush ${targetVariant.name} por metro en Telas Real. Suave tacto piel de durazno, elástica para pijamas, camisetas y vestidos. Envíos rápidos a Bogotá, Medellín, Cali, Barranquilla y toda Colombia.`
          : `Catálogo completo de Tela Brush por metro tipo piel de durazno en Colombia. Más de 50 colores disponibles con envíos nacionales vía Coordinadora.`;

        return {
          _id: "tela-brush-piel-de-durazno",
          id: "tela-brush-piel-de-durazno",
          name: "Tela Brush X Metros | Piel de Durazno",
          title: "Tela Brush X Metros | Piel de Durazno",
          slug: "tela-brush-piel-de-durazno",
          price: targetVariant.price || 11100,
          regularPrice: targetVariant.price || 11100,
          regular_price: targetVariant.price || 11100,
          pricePerKilo: targetVariant.pricePerKilo || 0,
          rendimiento: targetVariant.rendimiento || "3.2",
          sale_price: targetVariant.sale_price,
          image: targetVariant.image,
          thumbnail: targetVariant.thumbnail,
          images: targetVariant.images,
          categories: targetVariant.categories || [{ name: "Telas Unicolor", slug: "unicolor" }],
          usages: [
            { title: "Pijamas", slug: "pijamas" },
            { title: "Camisetas", slug: "camisetas" },
            { title: "Vestidos", slug: "vestidos" },
            { title: "Moda Deportiva", slug: "moda-deportiva" },
            { title: "Accesorios", slug: "accesorios" }
          ],
          attributes: [
            { name: "Ancho", value: "1.67 metros", visible: true, global: true },
            { name: "Composición", value: "92% Poliéster / 8% Elastano (Spandex)", visible: true, global: true },
            { name: "Elasticidad", value: "Alta (Spandex)", visible: true, global: true },
            { name: "Tacto", value: "Suave / Piel de Durazno", visible: true, global: true }
          ],
          short_description: `Tela Brush por metro tipo piel de durazno, suave y liviana. Es un tejido de punto de alta calidad e ideal para prendas cómodas y versátiles como pijamas, camisetas y vestidos. Excelente acabado y caída con ${colorVariants.length} colores disponibles en stock.`,
          description: `<p>La <strong>Tela Brush (Piel de Durazno)</strong> es uno de los textiles más versátiles y populares en Colombia. Se caracteriza por su tacto aterciopelado sumamente suave, caída fluida y elasticidad gracias a su composición de 92% poliéster y 8% elastano.</p><p>Es ideal para la confección de pijamas, ropa casual, camisetas, vestidos, conjuntos y moda deportiva. Selecciona tu tono favorito de nuestra colección con ${colorVariants.length} colores disponibles para despacho inmediato.</p>`,
          colorVariants: colorVariants,
          selectedColorSlug: targetVariant.slug,
          selectedColorVariant: targetVariant,
          stockStatus: targetVariant.stockStatus || "inStock",
          stock_status: (targetVariant.stockStatus || "inStock").toLowerCase(),
          isDemo: false,
          isPurchasable: true,
          badge: colorVariants.length >= 50 ? "MÁS VENDIDO • 50+ COLORES" : `MÁS VENDIDO • ${colorVariants.length} COLORES`,
          seoTitle: seoTitle,
          seoDescription: seoDescription
        };
      }
    } catch (e) {
      console.error("Error fetching brush color variants:", e);
    }
  }

  // =========================================================================
  // PRUEBA LOCAL: Agrupación de todos los colores de Satín en una sola tela
  // Ruta de prueba: /producto/satin-colores-prueba
  // =========================================================================
  if (decodedSlug === 'satin-colores-prueba') {
    try {
      const satinProducts = await client.fetch(groq`
        *[_type == "product" && (title match "*satin*" || title match "*Satín*" || slug.current match "*satin*") && stockStatus != "outOfStock" && stock_status != "outofstock"] | order(title asc) {
          _id,
          "name": title,
          "slug": slug.current,
          price,
          pricePerKilo,
          rendimiento,
          "sale_price": coalesce(salePrice, sale_price),
          "image": images[0].asset->url + "?auto=format&w=800&q=80",
          "thumbnail": images[0].asset->url + "?auto=format&w=200&q=70",
          "images": images[]{ "src": asset->url + "?auto=format&w=1200&q=80", "id": _key, "thumbnail": asset->url + "?auto=format&w=200&q=70", "alt": alt },
          "categories": categories[]->{ "id": _id, name, "slug": slug.current, rendimiento, pricePerKilo },
          "tones": tones[]->{ title, value, "slug": slug.current },
          stockStatus,
          stock_status,
          badge,
          "short_description": coalesce(descriptionShort, short_description)
        }
      `)

      if (satinProducts && satinProducts.length > 0) {
        const base = satinProducts[0]
        const colorVariants = satinProducts.map((p: any) => {
          const cleanName = p.name
            .replace(/Satin\s*/i, '')
            .replace(/\s*X Metros.*/i, '')
            .replace(/\|\s*Tela.*/i, '')
            .trim() || p.tones?.[0]?.title || "Color"

          return {
            id: p._id,
            name: cleanName,
            fullName: p.name,
            slug: p.slug,
            price: p.price,
            sale_price: p.sale_price,
            image: p.image,
            thumbnail: p.thumbnail,
            images: p.images || [{ src: p.image, id: p._id, thumbnail: p.thumbnail }],
            toneHex: p.tones?.[0]?.value || "#e2e8f0",
            toneTitle: p.tones?.[0]?.title || cleanName,
            stockStatus: p.stockStatus
          }
        })

        return {
          _id: "satin-colores-prueba",
          name: "Tela Satín - Todos los Colores (Demo)",
          slug: "satin-colores-prueba",
          price: base.price || 7300,
          pricePerKilo: base.pricePerKilo,
          rendimiento: base.rendimiento,
          sale_price: base.sale_price,
          image: base.image,
          images: base.images || [{ src: base.image, id: base._id, thumbnail: base.thumbnail }],
          categories: base.categories || [{ name: "Telas Unicolor", slug: "unicolor" }],
          short_description: "Tela satín por metro con acabado brillante, suave al tacto y caída elegante. Selecciona tu color favorito entre nuestra paleta de tonos disponibles.",
          colorVariants: colorVariants,
          stockStatus: "outOfStock",
          stock_status: "outofstock",
          isDemo: true,
          isPurchasable: false,
          badge: "SOLO DEMOSTRACIÓN",
          seoTitle: "Tela Satín - Todos los Colores (Demostración) | Telas Real",
          seoDescription: "Muestra visual de colores de tela Satín. Producto exclusivo de demostración no disponible para la venta ni compra al público."
        }
      }
    } catch (e) {
      console.error("Error fetching satin color variants for demo:", e)
    }
  }

  const product = await client.fetch(groq`
        *[_type == "product" && (slug.current == $slug || _id == $slug)][0] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            rendimiento,
            "sale_price": coalesce(salePrice, sale_price), 
            
            "image": images[0].asset->url + "?auto=format&w=800&q=80",
            "images": images[]{ "src": asset->url + "?auto=format&w=1200&q=80", "id": _key, "thumbnail": asset->url + "?auto=format&w=200&q=70", "alt": alt },
            "categories": categories[]->{ "id": _id, name, "slug": slug.current, rendimiento, pricePerKilo },
            
            "attributes": attributes[]{ _key, name, value, visible, global },
            stockStatus, 
            stock_status,
            inventory,
            
            "short_description": coalesce(descriptionShort, short_description),
            
            "designSelectionEnabled": designSelectionEnabled,
            "designCategory": coalesce(customDesignCategory, designCategory),
            seoTitle,
            seoDescription,
            
            "usages": usages[]->{ title, "slug": slug.current },
            "tones": tones[]->{ title, value, "slug": slug.current },
            isVisible,
            badge
        }
    `, { slug: decodedSlug })

  return product;
}

// Generate Metadata
export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const colorQuery = typeof resolvedSearchParams?.color === 'string' ? resolvedSearchParams.color : undefined;
  const product = await getProduct(resolvedParams.slug, colorQuery);

  if (!product) {
    return {
      title: "Producto no encontrado",
    }
  }

  // Fallback to existing logic if SEO fields empty
  const previousImages = (await parent).openGraph?.images || []
  const productImage = product.image ? [product.image] : []

  const keywords = [
    product.name,
    product.selectedColorVariant?.name ? `tela brush ${product.selectedColorVariant.name.toLowerCase()}` : "",
    ...(product.categories?.map((c: any) => c.name) || []),
    ...(product.usages?.map((u: any) => u.title) || []),
    "telas colombia", "comprar telas por metro", "envios bogota medellin cali barranquilla"
  ].filter(Boolean);

  const isDemo = product._id === "satin-colores-prueba" || product.isDemo || product.isPurchasable === false;

  const canonicalUrl = `/producto/${product.slug}${product.selectedColorVariant ? `?color=${product.selectedColorVariant.slug}` : ''}`;

  return {
    title: product.seoTitle ? { absolute: product.seoTitle } : product.name,
    description: product.seoDescription || (product.short_description ? product.short_description.replace(/<[^>]*>?/gm, '') : `Compra ${product.name} en Telas Real. Tela de alta calidad para tus proyectos.`),
    keywords: isDemo ? "demostracion" : keywords.join(", "),
    robots: isDemo ? {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        'max-video-preview': -1,
        'max-image-preview': 'none',
        'max-snippet': -1,
      },
    } : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || (product.short_description ? product.short_description.replace(/<[^>]*>?/gm, '') : `Compra ${product.name} en Telas Real.`),
      url: canonicalUrl,
      images: [...productImage, ...previousImages],
      type: "website",
    },
    other: {
      "geo.region": "CO",
      "geo.placename": "Colombia",
      "geo.position": "4.570868;-74.297333",
      "ICBM": "4.570868, -74.297333",
      "product:price:amount": (product.sale_price || product.price || 0).toString(),
      "product:price:currency": "COP",
      "product:availability": !isDemo && (product.stockStatus === 'inStock' || product.stockStatus === 'instock') ? "in stock" : "out of stock",
      "product:retailer_item_id": product.selectedColorVariant?.id || product._id,
      "product:condition": "new"
    }
  }
}

// Server Component
export default async function ProductoPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const colorQuery = typeof resolvedSearchParams?.color === 'string' ? resolvedSearchParams.color : undefined;
  const product = await getProduct(resolvedParams.slug, colorQuery);

  if (!product) {
    notFound()
  }

  // Fetch Featured Products (matching insumo vs tela)
  const isCurrentProductInsumo = product.categories?.some((c: any) => 
    c.slug?.current === 'hilos' || c.slug?.current === 'tijeras' || c.slug === 'hilos' || c.slug === 'tijeras'
  ) || /hilo/i.test(product.title || '') || /tijera/i.test(product.title || '') || /hilo/i.test(product.slug?.current || '') || /tijera/i.test(product.slug?.current || '');

  const relatedFilter = isCurrentProductInsumo
    ? `(references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) || title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*")`
    : `!(references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) || title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*")`;

  const featuredProductsData = await client.fetch(groq`
        *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && _id != $currentId && ${relatedFilter}][0...7] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            "sale_price": coalesce(salePrice, sale_price),
            "image": images[0].asset->url + "?auto=format&w=600&q=70",
            "imageAlt": images[0].alt,
            stockStatus,
            stock_status,
            badge,
            "categories": categories[]->{ "id": _id, name, "slug": slug.current, rendimiento, pricePerKilo }
        }
  `, { currentId: product._id })

  const isDemo = product._id === "satin-colores-prueba" || product.isDemo || product.isPurchasable === false;

  // Transform data for Client Component
  const formattedProduct = {
    ...product,
    id: product._id,
    isDemo,
    isPurchasable: !isDemo,
    // Opt-out: agotado solo si explícitamente marcado como outOfStock o si es demo
    is_in_stock: !isDemo && product.stockStatus !== 'outOfStock' && product.stock_status !== 'outofstock',
    regular_price: product.price,
    attributes: product.attributes?.map((attr: any) => ({
      ...attr,
      id: attr._key,
      // Map value to terms structure expected by ProductDetailTabs
      terms: [{ id: 1, name: attr.value }]
    })) || [],
  };

  const formattedFeatured = featuredProductsData.map((p: any) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    pricePerKilo: p.categories?.find((c: any) => c.pricePerKilo)?.pricePerKilo || 0,
    regularPrice: p.price,
    regular_price: p.price,
    salePrice: p.sale_price,
    sale_price: p.sale_price,
    image: p.image || "/placeholder.svg",
    imageAlt: p.imageAlt,
    slug: p.slug,
    // Opt-out: agotado solo si explícitamente marcado
    is_in_stock: p.stockStatus !== 'outOfStock' && p.stock_status !== 'outofstock',
    badge: p.badge
  }));

  const isGroupedProduct = Boolean(product.colorVariants && product.colorVariants.length > 0 && !isDemo);

  const jsonLd = isGroupedProduct ? {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "name": product.name,
    "description": product.seoDescription || (product.short_description ? product.short_description.replace(/<[^>]*>?/gm, '') : `Compra ${product.name} en Telas Real Colombia.`),
    "url": `https://www.telasreal.com/producto/${product.slug}`,
    "brand": {
      "@type": "Brand",
      "name": "Telas Real"
    },
    "productGroupID": product.slug,
    "variesBy": ["https://schema.org/color"],
    "hasVariant": product.colorVariants.slice(0, 40).map((variant: any) => ({
      "@type": "Product",
      "name": `${product.title || product.name} - ${variant.name}`,
      "color": variant.name,
      "image": variant.image || formattedProduct.image,
      "sku": variant.id,
      "mpn": variant.slug,
      "offers": {
        "@type": "Offer",
        "url": `https://www.telasreal.com/producto/${product.slug}?color=${variant.slug}`,
        "priceCurrency": "COP",
        "price": variant.sale_price || variant.price,
        "availability": variant.stockStatus === 'inStock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "areaServed": {
          "@type": "Country",
          "name": "Colombia"
        },
        "eligibleRegion": "CO"
      }
    }))
  } : {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": formattedProduct.name,
    "image": formattedProduct.image ? [formattedProduct.image] : [],
    "description": formattedProduct.seoDescription || (formattedProduct.short_description ? formattedProduct.short_description.replace(/<[^>]*>?/gm, '') : `Compra ${formattedProduct.name} en Telas Real.`),
    "sku": formattedProduct.sku || formattedProduct.id,
    "mpn": formattedProduct.sku || formattedProduct.id,
    "brand": {
      "@type": "Brand",
      "name": "Telas Real"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.telasreal.com/producto/${formattedProduct.slug}`,
      "priceCurrency": "COP",
      "price": formattedProduct.sale_price || formattedProduct.regular_price || 0,
      "availability": formattedProduct.is_in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "areaServed": {
        "@type": "Country",
        "name": "Colombia"
      },
      "eligibleRegion": "CO"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientProductView
        product={formattedProduct}
        featuredProducts={formattedFeatured}
      />
    </>
  )
}
