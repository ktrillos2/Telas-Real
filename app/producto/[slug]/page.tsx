import { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientProductView from "./ClientProductView"
import { notFound, permanentRedirect } from "next/navigation"
import { findUnifiedFabricConfig, getUnifiedProductData } from "@/lib/unified-fabrics"
import { absoluteUrl, breadcrumbJsonLd, cleanSlug, descriptiveAlt, safeDecode, stripHtml } from "@/lib/seo"
import { resolveStoredSlug } from "@/lib/seo-server"

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

// Data Fetching Helper
async function getProduct(slug: string, colorQuery?: string) {
  const decodedSlug = decodeURIComponent(slug);

  // =========================================================================
  // SISTEMA UNIFICADO DE TELAS CON VARIACIONES DE COLOR
  // Soporta Brush, Satín, Wafer, Seda de Mango, Rib, Crepe, Licra, etc.
  // Resuelve tanto la ruta unificada maestra como cualquier slug individual
  // =========================================================================
  const unifiedConfig = findUnifiedFabricConfig(decodedSlug);
  if (unifiedConfig) {
    const unifiedProduct = await getUnifiedProductData(unifiedConfig, decodedSlug, colorQuery);
    if (unifiedProduct) {
      return unifiedProduct;
    }
  }

  // Consulta estándar para productos individuales o telas sin variaciones
  const storedSlug = await resolveStoredSlug("product", decodedSlug);
  const product = await client.fetch(groq`
        *[_type == "product" && (slug.current == $slug || _id == $slug)][0] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            rendimiento,
            description,
            shipping,
            "sale_price": coalesce(salePrice, sale_price), 
            
            "image": images[0].asset->url + "?auto=format&w=800&q=80",
            "images": images[]{ "src": asset->url + "?auto=format&w=1200&q=80", "id": _key, "thumbnail": asset->url + "?auto=format&w=200&q=70", "alt": alt },
            "categories": categories[]->{ "id": _id, name, "slug": slug.current, rendimiento, pricePerKilo },
            
            "attributes": attributes[]{ _key, name, value, visible, global },
            "specSheetImage": specSheetImage{ alt, "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height },
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
    `, { slug: storedSlug })

  if (product?.slug) {
    // Slug público normalizado (sin espacios) para canonicals, enlaces y schema
    product.slug = cleanSlug(product.slug);
  }

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

  // En telas unificadas, la URL maestra (sin ?color) es canónica de sí misma; cada color
  // solicitado explícitamente (por ?color= o por su slug individual) tiene su propia canónica.
  const requestedSlug = cleanSlug(safeDecode(resolvedParams.slug));
  const isExplicitVariant = Boolean(product.selectedColorVariant && (colorQuery || requestedSlug !== product.slug));
  const canonicalUrl = `/producto/${product.slug}${isExplicitVariant ? `?color=${product.selectedColorVariant.slug}` : ''}`;

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

  // URL antigua de un color (/producto/tela-rib-pitillo-blanco-colombia): redirección permanente
  // a la ficha agrupada con ese color, que es su URL canónica.
  const requestedSlug = cleanSlug(safeDecode(resolvedParams.slug));
  if (
    !colorQuery &&
    product.selectedColorVariant?.slug &&
    product.slug !== requestedSlug &&
    cleanSlug(product.selectedColorVariant.slug).toLowerCase() === requestedSlug.toLowerCase()
  ) {
    permanentRedirect(`/producto/${product.slug}?color=${encodeURIComponent(product.selectedColorVariant.slug)}`)
  }

  // Fetch Featured Products (matching insumo vs tela)
  const isCurrentProductInsumo = product.categories?.some((c: any) => 
    c.slug?.current === 'hilos' || c.slug?.current === 'tijeras' || c.slug === 'hilos' || c.slug === 'tijeras'
  ) || /hilo/i.test(product.title || '') || /tijera/i.test(product.title || '') || /hilo/i.test(product.slug?.current || '') || /tijera/i.test(product.slug?.current || '');

  const relatedFilter = isCurrentProductInsumo
    ? `(references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) || title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*")`
    : `!(references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos"])]._id) || title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*")`;

  const relatedCandidates = await client.fetch(groq`
        *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && _id != $currentId && !(slug.current in $variantSlugs) && ${relatedFilter}] | order(_createdAt desc) [0...60] {
            "categoryRefs": categories[]._ref,
            _id,
            "name": title,
            "slug": slug.current,
            price,
            pricePerKilo,
            "sale_price": coalesce(salePrice, sale_price),
            "image": images[0].asset->url + "?auto=format&w=600&q=70",
            "imageAlt": images[0].alt,
            "images": images[0..5]{ "src": asset->url + "?auto=format&w=600&q=70", "id": _key },
            stockStatus,
            stock_status,
            badge,
            "categories": categories[]->{ "id": _id, name, "slug": slug.current, rendimiento, pricePerKilo }
        }
  `, {
    currentId: product._id,
    // Evita mostrar los otros colores de la misma tela como "relacionados"
    variantSlugs: (product.colorVariants || []).map((v: any) => v.slug).filter(Boolean),
  })

  // Prioriza telas de la misma categoría (enlazado interno más relevante)
  const currentCategoryIds = new Set((product.categories || []).map((c: any) => c.id).filter(Boolean))
  const sharedCategories = (p: any) => (p.categoryRefs || []).filter((ref: string) => currentCategoryIds.has(ref)).length
  const featuredProductsData = relatedCandidates
    .map((p: any, idx: number) => ({ p, idx, score: sharedCategories(p) }))
    .sort((a: any, b: any) => b.score - a.score || a.idx - b.idx)
    .slice(0, 7)
    .map(({ p }: any) => p)

  const isDemo = product._id === "satin-colores-prueba" || product.isDemo || product.isPurchasable === false;
  const productUrl = absoluteUrl(`/producto/${product.slug}`);

  // Consulta de reseñas aprobadas desde Sanity para este producto o familia
  const initialReviews = await client.fetch(groq`
    *[_type == "productReview" && isApproved != false && (
      productSlug == $slug ||
      (defined($familySlug) && (productFamilySlug == $familySlug || productSlug == $familySlug)) ||
      (defined($productId) && product._ref == $productId)
    )] | order(createdAt desc) {
      _id,
      author,
      rating,
      title,
      comment,
      colorVariantName,
      verifiedPurchase,
      createdAt,
      "images": images[]{
        _key,
        "url": asset->url,
        "alt": alt
      },
      "videos": videos[]{
        _key,
        "url": asset->url,
        "title": title,
        "filename": asset->originalFilename
      }
    }
  `, {
    slug: product.slug,
    familySlug: product.unifiedSlug || null,
    productId: product._id || null,
  });

  // Textos alternativos descriptivos (algunos alt en Sanity son nombres de archivo)
  const withAlts = (images: any[] | undefined, label: string) =>
    (images || []).map((img: any, idx: number) => ({
      ...img,
      alt: descriptiveAlt(img?.alt, `${label}${idx > 0 ? ` - vista ${idx + 1}` : ''}`),
    }))

  // Transform data for Client Component
  const formattedProduct = {
    ...product,
    images: withAlts(product.images, product.name),
    ...(product.colorVariants ? {
      colorVariants: product.colorVariants.map((v: any) => ({
        ...v,
        images: withAlts(v.images, v.fullName || `${product.name} ${v.name}`),
      })),
    } : {}),
    id: product._id,
    isDemo,
    isPurchasable: !isDemo,
    // Opt-out: agotado solo si explícitamente marcado como outOfStock o si es demo
    is_in_stock: !isDemo && product.stockStatus !== 'outOfStock' && product.stock_status !== 'outofstock',
    regular_price: product.price,
    description: product.description || product.short_description || "",
    shipping: product.shipping || null,
    rendimiento: product.rendimiento || product.categories?.find((c: any) => c.rendimiento)?.rendimiento || null,
    pricePerKilo: product.pricePerKilo || product.categories?.find((c: any) => c.pricePerKilo)?.pricePerKilo || null,
    usages: product.usages || [],
    categories: product.categories || [],
    // Se descartan entradas nulas o sin nombre (productos importados con datos incompletos)
    attributes: product.attributes?.filter((attr: any) => attr && typeof attr === 'object' && attr.name).map((attr: any) => ({
      ...attr,
      id: attr._key || attr.id,
      name: attr.name,
      value: attr.value,
      visible: attr.visible !== false,
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
    images: p.images || [],
    imageAlt: p.imageAlt,
    slug: p.slug,
    // Opt-out: agotado solo si explícitamente marcado
    is_in_stock: p.stockStatus !== 'outOfStock' && p.stock_status !== 'outofstock',
    badge: p.badge
  }));

  const isGroupedProduct = Boolean(product.colorVariants && product.colorVariants.length > 0 && !isDemo);

  const hasReviews = initialReviews && initialReviews.length > 0;
  const ratingAverage = hasReviews
    ? (initialReviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / initialReviews.length).toFixed(1)
    : "5.0";

  const reviewsJsonLd = hasReviews ? {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingAverage,
      reviewCount: initialReviews.length,
      bestRating: "5",
      worstRating: "1"
    },
    review: initialReviews.slice(0, 5).map((r: any) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author || "Cliente"
      },
      datePublished: r.createdAt ? r.createdAt.split('T')[0] : undefined,
      reviewBody: r.comment,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating || 5,
        bestRating: "5",
        worstRating: "1"
      }
    }))
  } : {};

  // Datos de envío y devoluciones (según /politica-de-envios y /terminos-y-condiciones)
  const offerExtras = {
    "seller": { "@id": absoluteUrl("/#organization") },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "CO" },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
        "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 7, "unitCode": "DAY" }
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "CO",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 5,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/ReturnShippingFees",
      "merchantReturnLink": absoluteUrl("/terminos-y-condiciones")
    }
  };

  const productDescription = product.seoDescription || stripHtml(product.short_description) || `Compra ${product.name} en Telas Real Colombia.`;
  const productMaterial = formattedProduct.attributes?.find((a: any) => /^composici[oó]n|^material/i.test(a.name || ''))?.value;

  const jsonLd = isGroupedProduct ? {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "name": product.name,
    "description": productDescription,
    "url": productUrl,
    ...(productMaterial ? { "material": productMaterial } : {}),
    "brand": {
      "@type": "Brand",
      "name": "Telas Real"
    },
    "productGroupID": product.slug,
    "variesBy": ["https://schema.org/color"],
    ...reviewsJsonLd,
    "hasVariant": product.colorVariants.slice(0, 40).map((variant: any) => ({
      "@type": "Product",
      "name": `${product.title || product.name} - ${variant.name}`,
      "color": variant.name,
      "image": variant.image || formattedProduct.image,
      "sku": variant.id,
      "mpn": variant.slug,
      "offers": {
        "@type": "Offer",
        "url": `${productUrl}?color=${variant.slug}`,
        "priceCurrency": "COP",
        "price": variant.sale_price || variant.price,
        "availability": variant.stockStatus === 'inStock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "areaServed": {
          "@type": "Country",
          "name": "Colombia"
        },
        "eligibleRegion": "CO",
        ...offerExtras
      }
    }))
  } : {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": formattedProduct.name,
    "image": formattedProduct.image ? [formattedProduct.image] : [],
    "description": productDescription,
    "url": productUrl,
    ...(productMaterial ? { "material": productMaterial } : {}),
    ...(formattedProduct.categories?.[0]?.name ? { "category": formattedProduct.categories[0].name } : {}),
    "sku": formattedProduct.sku || formattedProduct.id,
    "mpn": formattedProduct.sku || formattedProduct.id,
    "brand": {
      "@type": "Brand",
      "name": "Telas Real"
    },
    ...reviewsJsonLd,
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "COP",
      "price": formattedProduct.sale_price || formattedProduct.regular_price || 0,
      "availability": formattedProduct.is_in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "areaServed": {
        "@type": "Country",
        "name": "Colombia"
      },
      "eligibleRegion": "CO",
      ...offerExtras
    }
  };

  const primaryCategory = formattedProduct.categories?.find((c: any) => c?.slug && c?.name);
  const productBreadcrumbJsonLd = breadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Tienda", path: "/tienda" },
    ...(primaryCategory ? [{ name: primaryCategory.name, path: `/tienda/${cleanSlug(primaryCategory.slug)}` }] : []),
    { name: formattedProduct.name || product.title || "Tela", path: `/producto/${formattedProduct.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productBreadcrumbJsonLd) }}
      />
      <ClientProductView
        product={formattedProduct}
        featuredProducts={formattedFeatured}
        initialReviews={initialReviews || []}
      />
    </>
  )
}
