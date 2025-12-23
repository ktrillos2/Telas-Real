"use client"

import useSWR from "swr"
import { getWordPressApiUrl } from "@/lib/utils/api"

export interface ProductAttribute {
  id: number
  name: string
  slug: string
}

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  regular_price: number
  sale_price: number
  image: string
  images: Array<{
    id: number
    src: string
    thumbnail: string
    alt: string
  }>
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  attributes: Array<{
    id: number
    name: string
    terms: ProductAttribute[]
  }>
  is_in_stock: boolean
  short_description: string
  description: string
  weight?: string
  dimensions?: {
    length: string
    width: string
    height: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
}

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
  totalProducts: number
  totalPages: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Error al obtener productos")
  }
  const data = await response.json()
  const total = Number.parseInt(response.headers.get("X-WP-Total") || "0")
  const pages = Number.parseInt(response.headers.get("X-WP-TotalPages") || "1")
  return { data, total, pages }
}

export function useProducts(page: number = 1, perPage: number = 100, categoryId?: string): UseProductsResult {
  // Construir URL con filtro de categoría si existe
  const baseUrl = getWordPressApiUrl()
  // Agregar stock_status=instock para traer solo productos disponibles
  let url = `${baseUrl}/wp-json/wc/store/products?per_page=${perPage}&page=${page}&stock_status=instock`

  if (categoryId) {
    url += `&category=${categoryId}`
  }

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60000, // 1 minuto
    // Persistencia en localStorage
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(url, JSON.stringify({
            data,
            timestamp: Date.now()
          }))
        } catch (e) {
          console.warn('Error saving to localStorage', e)
        }
      }
    },
    fallbackData: typeof window !== 'undefined' ? (() => {
      try {
        const item = localStorage.getItem(url)
        if (item) {
          const parsed = JSON.parse(item)
          // Validar expiración (ej. 1 hora)
          if (Date.now() - parsed.timestamp < 3600000) {
            return parsed.data
          }
        }
        return undefined
      } catch (e) {
        return undefined
      }
    })() : undefined
  })

  // Filter out any products that might have slipped through (just in case)
  const products: Product[] = (data?.data || [])
    .filter((item: any) => item.is_in_stock)
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: Number.parseInt(item.prices.price) || 0,
      regular_price: Number.parseInt(item.prices.regular_price) || 0,
      sale_price: Number.parseInt(item.prices.sale_price) || 0,
      image: item.images?.[0]?.src || "/placeholder.svg",
      images: item.images || [],
      categories: item.categories || [],
      tags: item.tags || [],
      attributes: item.attributes || [],
      is_in_stock: item.is_in_stock,
      short_description: item.short_description || "",
      description: item.description || "",
      weight: item.weight,
      dimensions: item.dimensions,
    }))

  return {
    products,
    loading: isLoading,
    error: error ? error.message : null,
    totalProducts: data?.total || 0,
    totalPages: data?.pages || 0
  }
}
