/**
 * Cajas de despacho para cotizar con Coordinadora.
 *
 * En lugar de enviar las medidas de cada tela, se calcula el peso total del carrito y se elige
 * la caja más pequeña que lo soporta. Si el pedido supera la caja más grande, se reparte en
 * varias cajas grandes y el resto va en la caja más pequeña que lo soporte.
 */

export interface ShippingBox {
  id: string
  label: string
  /** Medidas en cm */
  lengthCm: number
  widthCm: number
  heightCm: number
  /** Peso máximo que soporta la caja (kg) */
  maxKg: number
}

// Medidas y capacidades definidas por Telas Real (de menor a mayor)
export const SHIPPING_BOXES: ShippingBox[] = [
  { id: "caja-1", label: "Caja 22 x 16 x 11 (3 a 4 kg)", lengthCm: 22, widthCm: 16, heightCm: 11, maxKg: 4 },
  { id: "caja-2", label: "Caja 33 x 15 x 16 (5 a 6 kg)", lengthCm: 33, widthCm: 15, heightCm: 16, maxKg: 6 },
  { id: "caja-3", label: "Caja 50 x 38 x 42 (32 kg)", lengthCm: 50, widthCm: 38, heightCm: 42, maxKg: 32 },
  { id: "caja-4", label: "Caja 164 x 100 x 20 (131 kg)", lengthCm: 164, widthCm: 100, heightCm: 20, maxKg: 131 },
]

export interface PackedBox {
  box: ShippingBox
  /** Peso del contenido de la caja (kg) */
  weightKg: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Reparte el peso total en cajas: la más pequeña que soporte el peso; si no cabe, cajas grandes llenas + resto. */
export function packIntoBoxes(totalKg: number, boxes: ShippingBox[] = SHIPPING_BOXES): PackedBox[] {
  const sorted = [...boxes].sort((a, b) => a.maxKg - b.maxKg)
  const largest = sorted[sorted.length - 1]
  let remaining = Math.max(0.1, round1(totalKg))
  const packed: PackedBox[] = []

  while (remaining > largest.maxKg) {
    packed.push({ box: largest, weightKg: largest.maxKg })
    remaining = round1(remaining - largest.maxKg)
  }
  if (remaining > 0) {
    const box = sorted.find((b) => remaining <= b.maxKg) || largest
    packed.push({ box, weightKg: remaining })
  }
  return packed
}

/** Convierte "3.2", "3,2 m/kg" o 3.2 en número; null si no es válido. */
export function parseYield(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const match = String(value).replace(",", ".").match(/(\d+(?:\.\d+)?)/)
  const n = match ? parseFloat(match[1]) : NaN
  return n > 0 ? n : null
}

/**
 * Peso estimado de un ítem del carrito:
 * - Telas vendidas por metro: metros ÷ rendimiento (m/kg) del producto o de su categoría.
 * - Unidades (hilos, tijeras) o telas sin rendimiento: peso por unidad registrado × cantidad.
 */
export function estimateItemWeightKg(params: {
  quantity: number
  isUnit: boolean
  yieldMetersPerKg: number | null
  unitWeightKg: number | null
  defaultUnitWeightKg: number
}): number {
  const qty = Math.max(0, Number(params.quantity) || 0)
  if (!params.isUnit && params.yieldMetersPerKg) return qty / params.yieldMetersPerKg
  return qty * (params.unitWeightKg && params.unitWeightKg > 0 ? params.unitWeightKg : params.defaultUnitWeightKg)
}
