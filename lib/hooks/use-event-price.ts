"use client"

import { useCallback } from "react"
import { useHomeDataContext } from "@/lib/contexts/HomeDataContext"
import { effectiveSalePrice } from "@/lib/promotions"

/**
 * Precio rebajado de una tela en el cliente: oferta manual o, si no hay, el % del evento activo.
 * Devuelve 0 si no hay rebaja. Mismo cálculo que las tarjetas, la ficha y el carrito.
 */
export function useEventSalePrice() {
  const { data } = useHomeDataContext()
  const settings = data?.eventSettings as any
  return useCallback(
    (regular: number, manualSale: number | null | undefined, product: { slug?: string; categorySlugs?: string[] }) =>
      effectiveSalePrice(Number(regular) || 0, manualSale, product, settings),
    [settings]
  )
}
