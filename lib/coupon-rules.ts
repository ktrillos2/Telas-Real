/**
 * Reglas de cupones que se usan también en el navegador (carrito y checkout), sin dependencias.
 */

/** Formas de pago con las que se puede usar un cupón. */
export type CouponPaymentMethods = "all" | "online" | "cod"

/** ¿El cupón se puede usar con esta forma de pago del checkout ("wompi" o "cod")? */
export function couponAllowsPayment(paymentMethods: CouponPaymentMethods | undefined | null, checkoutMethod: string): boolean {
  if (!paymentMethods || paymentMethods === "all") return true
  return paymentMethods === (checkoutMethod === "cod" ? "cod" : "online")
}

export const PAYMENT_METHOD_LABEL: Record<Exclude<CouponPaymentMethods, "all">, string> = {
  online: "pago anticipado en línea",
  cod: "pago contraentrega",
}
