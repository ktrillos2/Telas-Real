"use client"

import useSWR from "swr"
import type { Product } from "./useProducts"

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: string | null
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Producto no encontrado")
  }
  return response.json()
}

export function useProduct(productId: string): UseProductResult {
  const { data, error, isLoading } = useSWR(
    productId ? `https://www.telasreal.com/wp-json/wc/store/products/${productId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minuto
    }
  )

  const product: Product | null = data ? {
    id: data.id,
    name: data.name,
    slug: data.slug,
    price: Number.parseInt(data.prices.price) || 0,
    regular_price: Number.parseInt(data.prices.regular_price) || 0,
    sale_price: Number.parseInt(data.prices.sale_price) || 0,
    image: data.images?.[0]?.src || "/placeholder.svg",
    images: data.images || [],
    categories: data.categories || [],
    attributes: data.attributes || [],
    is_in_stock: data.is_in_stock,
    short_description: data.short_description || "",
    description: data.description || "",
    weight: data.weight,
    dimensions: data.dimensions,
  } : null

  return {
    product,
    loading: isLoading,
    error: error ? error.message : null
  }
}
