import { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientProductView from "./ClientProductView"
import { notFound } from "next/navigation"
import { findUnifiedFabricConfig, getUnifiedProductData } from "@/lib/unified-fabrics"

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
