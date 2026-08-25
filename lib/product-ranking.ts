import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"

export interface SalesMetrics {
  totalSales: Record<string, number>
  recentSales: Record<string, number>
}

// Normalizer for fuzzy product matching
export function normalizeText(str: string): string {
  if (!str) return ""
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Fetches order history from Sanity and builds maps of total sales and recent sales (last 90 days).
 */
export async function fetchSalesMetrics(): Promise<SalesMetrics> {
  try {
    const orders = await client.fetch(
      groq`*[_type == "order" && status in ["paid", "completed", "processing", "pending"]]{
        _createdAt,
        items[]{ name, title, quantity }
      }`,
      {},
      { next: { revalidate: 3600 } }
    )

    const totalSales: Record<string, number> = {}
    const recentSales: Record<string, number> = {}
    const now = Date.now()
    const ninetyDays = 90 * 24 * 60 * 60 * 1000

    orders.forEach((order: any) => {
      const isRecent = now - new Date(order._createdAt).getTime() < ninetyDays
      ;(order.items || []).forEach((item: any) => {
        const raw = item.name || item.title || ""
        const norm = normalizeText(raw)
        if (!norm) return
        const qty = Number(item.quantity) || 1
        totalSales[norm] = (totalSales[norm] || 0) + qty
        if (isRecent) {
          recentSales[norm] = (recentSales[norm] || 0) + qty
        }
      })
    })

    return { totalSales, recentSales }
  } catch (error) {
    console.error("Error fetching sales metrics:", error)
    return { totalSales: {}, recentSales: {} }
  }
}

/**
 * Calculates sales count, recent sales count, best seller score, and trending score for a product.
 */
export function scoreProduct(product: any, metrics?: SalesMetrics) {
  const totalSalesMap = metrics?.totalSales || {}
  const recentSalesMap = metrics?.recentSales || {}

  const pNorm = normalizeText(product.name || product.title || "")
  const pSlugNorm = normalizeText(product.slug || "")

  let sales = 0
  let recSales = 0

  for (const [sName, qty] of Object.entries(totalSalesMap)) {
    if (
      pNorm === sName ||
      pNorm.includes(sName) ||
      sName.includes(pNorm) ||
      (pSlugNorm && (sName.includes(pSlugNorm) || pSlugNorm.includes(sName)))
    ) {
      sales += qty
    }
  }

  for (const [sName, qty] of Object.entries(recentSalesMap)) {
    if (
      pNorm === sName ||
      pNorm.includes(sName) ||
      sName.includes(pNorm) ||
      (pSlugNorm && (sName.includes(pSlugNorm) || pSlugNorm.includes(sName)))
    ) {
      recSales += qty
    }
  }

  const badgeLower = (product.badge || "").toLowerCase()
  const hasBestBadge =
    badgeLower.includes("vendido") ||
    badgeLower.includes("seller") ||
    badgeLower.includes("top") ||
    badgeLower.includes("destacado")
  const hasTrendBadge =
    badgeLower.includes("tendencia") ||
    badgeLower.includes("trending") ||
    badgeLower.includes("nuevo") ||
    badgeLower.includes("cyber") ||
    badgeLower.includes("popular") ||
    badgeLower.includes("hot")

  const now = Date.now()
  const createdAtMs = new Date(product._createdAt || product.createdAt || 0).getTime()
  const pAgeDays = createdAtMs > 0 ? Math.max(0, (now - createdAtMs) / (1000 * 60 * 60 * 24)) : 100
  const freshnessBonus = pAgeDays < 60 ? (60 - pAgeDays) * 0.5 : 0

  // Calculate discount percentage if any
  const price = Number(product.price) || 0
  const salePrice = Number(product.sale_price ?? product.salePrice ?? 0)
  const hasDiscount = salePrice > 0 && salePrice < price
  const discountPercent = hasDiscount ? ((price - salePrice) / price) * 100 : 0
  const isOfferBadge = badgeLower.includes("oferta") || badgeLower.includes("sale") || badgeLower.includes("descuento")

  const bestSellerScore = sales * 10 + (hasBestBadge ? 1000 : 0)
  const trendingScore = recSales * 20 + sales * 2 + freshnessBonus + (hasTrendBadge ? 500 : 0)
  const saleScore = (hasDiscount ? discountPercent : 0) + (isOfferBadge ? 50 : 0)

  return {
    salesCount: sales,
    recentSalesCount: recSales,
    bestSellerScore,
    trendingScore,
    saleScore,
    hasDiscount,
    discountPercent,
  }
}

/**
 * Sorts an array of products based on the selected sortBy string.
 */
export function rankProducts(products: any[], sortBy: string, metrics?: SalesMetrics): any[] {
  // First ensure all products have scores
  const scored = products.map((p) => {
    if (p.bestSellerScore !== undefined && p.trendingScore !== undefined) {
      return p
    }
    const scores = scoreProduct(p, metrics)
    return { ...p, ...scores }
  })

  return [...scored].sort((a, b) => {
    // 1. Stock availability: in-stock always comes first
    const aInStock = a.is_in_stock ?? (a.stockStatus !== "outOfStock" && a.stock_status !== "outofstock")
    const bInStock = b.is_in_stock ?? (b.stockStatus !== "outOfStock" && b.stock_status !== "outofstock")
    if (aInStock && !bInStock) return -1
    if (!aInStock && bInStock) return 1

    // 2. Sort by criteria
    switch (sortBy) {
      case "best-sellers": {
        if (b.bestSellerScore !== a.bestSellerScore) {
          return b.bestSellerScore - a.bestSellerScore
        }
        // Tie breaker: salesCount -> newest
        if (b.salesCount !== a.salesCount) {
          return (b.salesCount || 0) - (a.salesCount || 0)
        }
        return new Date(b._createdAt || 0).getTime() - new Date(a._createdAt || 0).getTime()
      }

      case "trending": {
        if (b.trendingScore !== a.trendingScore) {
          return b.trendingScore - a.trendingScore
        }
        // Tie breaker: recentSalesCount -> newest
        if (b.recentSalesCount !== a.recentSalesCount) {
          return (b.recentSalesCount || 0) - (a.recentSalesCount || 0)
        }
        return new Date(b._createdAt || 0).getTime() - new Date(a._createdAt || 0).getTime()
      }

      case "sale": {
        // Items with discount first
        if (b.saleScore !== a.saleScore) {
          return b.saleScore - a.saleScore
        }
        const aSale = a.sale_price || a.salePrice
        const bSale = b.sale_price || b.salePrice
        if (aSale && !bSale) return -1
        if (!aSale && bSale) return 1
        return (aSale || a.price) - (bSale || b.price)
      }

      case "price-asc":
        return (a.sale_price || a.salePrice || a.price) - (b.sale_price || b.salePrice || b.price)

      case "price-desc":
        return (b.sale_price || b.salePrice || b.price) - (a.sale_price || a.salePrice || a.price)

      case "name-asc":
        return (a.name || a.title || "").localeCompare(b.name || b.title || "")

      case "name-desc":
        return (b.name || b.title || "").localeCompare(a.name || a.title || "")

      case "newest":
        return new Date(b._createdAt || 0).getTime() - new Date(a._createdAt || 0).getTime()

      case "oldest":
        return new Date(a._createdAt || 0).getTime() - new Date(b._createdAt || 0).getTime()

      default:
        // Default ranking: in stock, then newest
        return new Date(b._createdAt || 0).getTime() - new Date(a._createdAt || 0).getTime()
    }
  })
}
