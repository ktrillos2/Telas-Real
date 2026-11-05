/**
 * Píxel de OpenAI Ads ("oaiq"). El script se carga en components/tracking-pixels.tsx.
 *
 * Unidad del monto: el ejemplo de OpenAI envía `amount: 12999` para USD, que corresponde a
 * unidades menores (centavos: 129,99 USD). El peso colombiano también tiene 2 decimales en
 * ISO 4217, así que $77.500 COP se envía como 7750000. Si en el Administrador de anuncios las
 * ventas aparecen 100 veces más altas, poner NEXT_PUBLIC_OPENAI_ADS_AMOUNT_IN_MINOR_UNITS=false.
 */

declare global {
  interface Window {
    oaiq?: (...args: any[]) => void
  }
}

export const OPENAI_ADS_PIXEL_ID = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID || "QosBtdJVB1s28LprXFpBLy"

const AMOUNT_IN_MINOR_UNITS = process.env.NEXT_PUBLIC_OPENAI_ADS_AMOUNT_IN_MINOR_UNITS !== "false"

/** Monto en pesos → valor que espera OpenAI (centavos por defecto). */
export function toOpenAIAmount(cop: number): number {
  const value = Math.round(Number(cop) || 0)
  return AMOUNT_IN_MINOR_UNITS ? value * 100 : value
}

/** Id del evento de compra: el mismo en navegador y servidor para que OpenAI no la cuente dos veces. */
export const orderEventId = (orderNumber: string | number) => `order_${String(orderNumber).replace(/^drafts\./, "")}`

export function measureOrderCreated(orderNumber: string | number, totalCop: number) {
  if (typeof window === "undefined" || !window.oaiq) return
  window.oaiq(
    "measure",
    "order_created",
    { type: "contents", amount: toOpenAIAmount(totalCop), currency: "COP" },
    { event_id: orderEventId(orderNumber) }
  )
}
