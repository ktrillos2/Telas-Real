import { NextResponse } from "next/server"
import { getVolumePricing } from "@/lib/volume-pricing-server"

export const revalidate = 120

/** Lista de precios por volumen y su configuración (para el carrito, el checkout y la ficha). */
export async function GET() {
  const data = await getVolumePricing()
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } })
}
