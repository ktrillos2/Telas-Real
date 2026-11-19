import { createHmac } from "crypto"
import { createClient } from "next-sanity"
import { apiVersion, dataset, projectId } from "@/sanity/env"
import { sendWhatsAppNotification } from "@/lib/whatsapp/service"
import { sendLabsMobileSms } from "@/lib/labsmobile"
import { sendAbandonedCartEmail } from "@/lib/email-notifications"
import { isUnitProduct } from "@/lib/utils"

/**
 * Recuperación automática de carritos abandonados: textos, cupón de incentivo y enlace que vuelve a
 * armar el carrito (con el cupón aplicado) en un clic. La programación vive en /api/cron/abandoned-cart.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.telasreal.com").replace(/\/$/, "")

export const writeClient = createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_TOKEN })

export interface RecoverySettings {
  enabled: boolean
  channel: "whatsapp_sms" | "whatsapp" | "sms"
  sendEmail: boolean
  firstDelayHours: number
  secondDelayHours: number
  incentivePercent: number
  incentiveOn: "second" | "both"
  couponValidHours: number
  message1: string
  message2: string
}

export const DEFAULT_RECOVERY_SETTINGS: RecoverySettings = {
  enabled: true,
  channel: "whatsapp_sms",
  sendEmail: true,
  firstDelayHours: 1,
  secondDelayHours: 24,
  incentivePercent: 5,
  incentiveOn: "second",
  couponValidHours: 48,
  message1:
    "Hola {nombre} 👋 Vimos que dejaste tus telas en el carrito de Telas Real:\n{productos}\n\nTotal: {total}. Las guardamos para ti, termina tu compra aquí 👉 {link}",
  message2:
    "Hola {nombre}, tus telas siguen esperándote 🧵 Para que te animes, te regalamos {descuento} de descuento con el cupón *{cupon}* (válido por poco tiempo). Ya está aplicado en este enlace 👉 {link}",
}

export async function getRecoverySettings(): Promise<RecoverySettings> {
  const doc = await writeClient.fetch(`*[_id == "abandonedCartSettings"][0]`).catch(() => null)
  const s: any = { ...DEFAULT_RECOVERY_SETTINGS }
  for (const key of Object.keys(DEFAULT_RECOVERY_SETTINGS)) {
    const v = doc?.[key]
    if (v !== undefined && v !== null && v !== "") s[key] = v
  }
  return s as RecoverySettings
}

// ---------------------------------------------------------------------------------------------
// Enlace firmado: solo quien recibe el mensaje puede rearmar ese carrito
// ---------------------------------------------------------------------------------------------
const secret = () => process.env.CART_RECOVERY_SECRET || process.env.SANITY_API_TOKEN || "telasreal"

export function recoverySignature(orderId: string): string {
  return createHmac("sha256", secret()).update(String(orderId).replace(/^drafts\./, "")).digest("hex").slice(0, 20)
}

export function isValidRecoverySignature(orderId: string, sig: string): boolean {
  const expected = recoverySignature(orderId)
  return typeof sig === "string" && sig.length === expected.length && sig === expected
}

export function recoveryLink(orderId: string, coupon?: string, utmContent?: string): string {
  const id = String(orderId).replace(/^drafts\./, "")
  const params = new URLSearchParams({ p: id, t: recoverySignature(id) })
  if (coupon) params.set("c", coupon)
  params.set("utm_source", "recuperacion")
  params.set("utm_medium", utmContent?.startsWith("sms") ? "sms" : utmContent?.startsWith("email") ? "email" : "whatsapp")
  params.set("utm_campaign", "carrito_abandonado")
  if (utmContent) params.set("utm_content", utmContent)
  return `${SITE_URL}/recuperar-carrito?${params.toString()}`
}

// ---------------------------------------------------------------------------------------------
// Cupón único del cliente (ej. VUELVE-10450): pequeño, de toda la tienda y con vencimiento corto
// ---------------------------------------------------------------------------------------------
export async function ensureRecoveryCoupon(order: any, settings: RecoverySettings): Promise<string | undefined> {
  const pct = Number(settings.incentivePercent) || 0
  if (pct <= 0) return undefined
  const ref = String(order.orderNumber || order._id).replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase()
  const code = `VUELVE-${ref}`
  const now = new Date()
  await writeClient.createIfNotExists({
    _id: `coupon-recuperacion-${ref}`,
    _type: "coupon",
    title: `Recuperación de carrito #${order.orderNumber || ref} (${pct}%)`,
    code: { _type: "slug", current: code },
    discountPercent: pct,
    paymentMethods: "all",
    isActive: true,
    startDate: now.toISOString(),
    endDate: new Date(now.getTime() + (Number(settings.couponValidHours) || 48) * 3600_000).toISOString(),
    scope: "all",
  })
  return code
}

// ---------------------------------------------------------------------------------------------
// Mensajes
// ---------------------------------------------------------------------------------------------
const cop = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m))
}

function firstName(order: any): string {
  const n = String(order.shippingAddress?.fullName || "").trim().split(/\s+/)[0]
  return n && n.toLowerCase() !== "cliente" ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : "hola de nuevo"
}

function productList(order: any): string {
  return (order.items || [])
    .slice(0, 5)
    .map((it: any) => {
      const unit = isUnitProduct({ name: it.name, slug: it.productSlug }) ? "und" : "m"
      return `• ${String(it.name || "Tela").split(" X Metros")[0]} x ${it.quantity || 1} ${unit}`
    })
    .join("\n")
}

/** Teléfono colombiano con indicativo 57 (WhatsApp y SMS). */
export function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "")
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`
  return digits
}

export type RecoveryStep = 1 | 2

export async function sendRecovery(order: any, step: RecoveryStep, settings: RecoverySettings) {
  const withIncentive = step === 2 || settings.incentiveOn === "both"
  const coupon = withIncentive ? await ensureRecoveryCoupon(order, settings) : undefined
  const phone = normalizePhone(order.shippingAddress?.phone || "")
  const email = String(order.email || order.userEmail || "").trim().toLowerCase()

  const vars = (channel: string): Record<string, string> => ({
    nombre: firstName(order),
    productos: productList(order),
    total: cop(order.total),
    link: recoveryLink(order._id, coupon, `${channel}_${step}`),
    cupon: coupon || "",
    descuento: coupon ? `${settings.incentivePercent}%` : "",
  })

  const result = { whatsapp: false, sms: false, email: false, coupon }

  // 1. WhatsApp (bot) → si falla o el número no tiene WhatsApp, SMS
  if (phone && phone.length >= 10) {
    if (settings.channel !== "sms" && process.env.WHATSAPP_ENABLED !== "false") {
      const text = renderTemplate(step === 1 ? settings.message1 : settings.message2, vars("whatsapp"))
      const wa = await sendWhatsAppNotification({ phone, customMessage: text }).catch(() => ({ success: false }))
      result.whatsapp = !!wa?.success
    }
    if (!result.whatsapp && settings.channel !== "whatsapp") {
      // SMS corto (1 mensaje): sin emojis ni lista de productos
      const v = vars("sms")
      const sms =
        step === 1
          ? `Telas Real: ${v.nombre}, tus telas siguen en el carrito. Termina tu compra aqui: ${v.link}`
          : `Telas Real: ${v.nombre}, ${coupon ? `te regalamos ${v.descuento} con el cupon ${coupon}` : "tus telas te esperan"}. Compra aqui: ${v.link}`
      const r: any = await sendLabsMobileSms(phone, sms, "automated_abandoned_cart", order._id).catch(() => ({ success: false }))
      result.sms = !!r?.success
    }
  }

  // 2. Correo
  if (settings.sendEmail && email) {
    const r: any = await sendAbandonedCartEmail({
      customerEmail: email,
      customerName: order.shippingAddress?.fullName || "Cliente",
      items: (order.items || []).map((it: any) => ({
        name: it.name || "Tela",
        quantity: it.quantity || 1,
        price: it.price || 0,
        image: it.image || undefined,
        designName: it.designName || undefined,
      })),
      total: order.total || 0,
      subtotal: order.total || 0,
      orderId: order.orderNumber || order._id,
      recoveryUrl: recoveryLink(order._id, coupon, `email_${step}`),
    }).catch(() => ({ success: false }))
    result.email = !!r?.success
  }

  return result
}
