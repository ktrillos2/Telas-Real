
import { Metadata, ResolvingMetadata } from 'next'
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import ClientProductView from "./ClientProductView"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ slug: string }>
}

// Data Fetching Helper
async function getProduct(slug: string) {
  const decodedSlug = decodeURIComponent(slug);
  const product = await client.fetch(groq`
        *[_type == "product" && (slug.current == $slug || _id == $slug)][0] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            salePrice, // Note: Schema uses salePrice (camelCase) based on my update, need to map if legacy was sale_price? 
                       // Wait, my schema update used salePrice. Old schema used sale_price? 
                       // Let's check the schema file I wrote.
                       // I wrote: salePrice. 
                       // The old client code used sale_price.
                       // I should check if I need to support both or if new schema replaces old field name completely.
                       // If I updated schema, Sanity dataset might still have old fields if I didn't migrate data.
                       // My CSV migration script mapped to salePrice.
                       // So I should use salePrice.
                       // But the old frontend used sale_price. 
                       // I will fetch BOTH to be safe: "sale_price": coalesce(salePrice, sale_price)

            "sale_price": coalesce(salePrice, sale_price), 
            
            "image": images[0].asset->url,
            "images": images[]{ "src": asset->url, "id": _key, "thumbnail": asset->url },
            "categories": categories[]->{ "id": _id, name, "slug": slug.current },
            
            "attributes": attributes[]{ _key, name, value, visible, global },
            stockStatus, // Schema: stockStatus
            inventory,
            
            short_description, // Schema: descriptionShort. I mapped descriptionShort in script.
                               // Old frontend used short_description. 
                               // Schema I wrote: descriptionShort.
                               // I should fetch as: "short_description": coalesce(descriptionShort, short_description)
            "short_description": coalesce(descriptionShort, short_description),
            
            description, // Schema: description (text/html)
            seoTitle,
            seoDescription,
            
            "usages": usages[]->{ title, "slug": slug.current },
            "tones": tones[]->{ title, value, "slug": slug.current }
        }
    `, { slug: decodedSlug })

  return product;
}

// Generate Metadata
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    }
  }

  // Fallback to existing logic if SEO fields empty
  const previousImages = (await parent).openGraph?.images || []
  const productImage = product.image ? [product.image] : []

  return {
    title: product.seoTitle || `${product.name} | Telas Real`,
    description: product.seoDescription || product.short_description || "Tela de alta calidad.",
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.short_description,
      images: [...productImage, ...previousImages],
    },
  }
}

// Server Component
export default async function ProductoPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return <div>Producto no encontrado</div> // Or generic 404 handled by ClientView or standard notFound()
    // Better to pass null and let client view handle it or just notFound()
    // notFound() is better for SEO 404 status.
  }

  // Fetch Featured Products
  // Note: Schema mapping check. 
  const featuredProductsData = await client.fetch(groq`
        *[_type == "product"][0...7] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            "sale_price": coalesce(salePrice, sale_price),
            "image": images[0].asset->url,
            "is_in_stock": coalesce(stockStatus == 'inStock', stock_status == 'instock')
        }
  `)

  // Transform data for Client Component
  const formattedProduct = {
    ...product,
    id: product._id,
    is_in_stock: product.stockStatus === 'inStock' || product.stockStatus === 'instock',
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
    regular_price: p.price,
    sale_price: p.sale_price,
    image: p.image || "/placeholder.svg",
    is_in_stock: p.is_in_stock
  }));


  return (
    <ClientProductView
      product={formattedProduct}
      featuredProducts={formattedFeatured}
    />
  )
}
