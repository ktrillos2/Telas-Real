"use client"

import useSWR from "swr"
import type { Product } from "./useProducts"

interface UseFeaturedProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Error al obtener productos destacados")
  }
  return response.json()
}

export function useFeaturedProducts(limit: number = 6): UseFeaturedProductsResult {
  const { data, error, isLoading } = useSWR(
    `https://admin.telasreal.com/wp-json/wc/store/products?per_page=${limit}&orderby=popularity`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minuto
    }
  )

  const products: Product[] = data?.map((item: any) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: Number.parseInt(item.prices.price) || 0,
    regular_price: Number.parseInt(item.prices.regular_price) || 0,
    sale_price: Number.parseInt(item.prices.sale_price) || 0,
    image: item.images?.[0]?.src || "/placeholder.svg",
    images: item.images || [],
    categories: item.categories || [],
    attributes: item.attributes || [],
    is_in_stock: item.is_in_stock,
    short_description: item.short_description || "",
    description: item.description || "",
  })) || []

  return {
    products,
    loading: isLoading,
    error: error ? error.message : null
  }
}
