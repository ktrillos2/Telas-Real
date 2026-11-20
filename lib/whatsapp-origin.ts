"use client"

import { getWhatsAppUrl } from "@/lib/utils/whatsapp"
import * as gtag from "@/lib/gtag"

/**
 * WhatsApp como canal de venta medible: cada mensaje que sale de la web lleva un código de origen
 * (ej. WEB-7KQ2M), el producto o el pedido, y queda registrado en Sanity ("Contactos desde la web").
 * El equipo ve el código en el chat y sabe que esa venta vino del sitio.
 */

const CODE_KEY = "tr_wa_code"
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ" // sin 0/O/1/I para dictarlo sin confusión

export type WhatsAppSource = "floating" | "product" | "cart" | "other"

/** Código del visitante (el mismo en todas sus conversaciones desde este navegador). */
export function getVisitorCode(): string {
  try {
    const saved = localStorage.getItem(CODE_KEY)
    if (saved && /^WEB-[A-Z0-9]{5}$/.test(saved)) return saved
  } catch {}
  let code = "WEB-"
  const random = new Uint8Array(5)
  crypto.getRandomValues(random)
  for (const b of random) code += ALPHABET[b % ALPHABET.length]
  try {
    localStorage.setItem(CODE_KEY, code)
  } catch {}
  return code
}

/** Datos del cliente que se piden antes de "Comprar por WhatsApp" (quedan en el pedido del admin) */
export interface WhatsAppCustomer {
  fullName: string
  phone: string
  city: string
  email?: string
  address?: string
}

interface OpenOptions {
  phone?: string | null
  /** Texto principal del mensaje (sin el código; se agrega al final) */
  message: string
  source: WhatsAppSource
  productName?: string
  total?: number
  /** Productos del carrito: se crea un pedido "WhatsApp" en Sanity y el número va en el mensaje */
  items?: Array<{ id?: string; name: string; quantity: number; price: number; image?: string; slug?: string; designName?: string; designUrl?: string; isCustom?: boolean }>
  customer?: WhatsAppCustomer
}

const footer = (code: string, orderNumber?: string) =>
  `\n\n${orderNumber ? `Pedido web #${orderNumber} · ` : ""}Código: ${code}`

/**
 * Abre WhatsApp con el mensaje + código de origen y registra el contacto.
 * Con items, primero crea el pedido (para incluir su número) sin que el navegador bloquee la ventana.
 */
export async function openWhatsAppTracked(opts: OpenOptions): Promise<void> {
  const code = getVisitorCode()
  const page = typeof window !== "undefined" ? window.location.pathname + window.location.search : ""
  const payload = { code, source: opts.source, page, productName: opts.productName, total: opts.total, items: opts.items, customer: opts.customer }

  gtag.event("generate_lead", {
    lead_source: `whatsapp_${opts.source}`,
    currency: "COP",
    value: opts.total || 0,
    whatsapp_code: code,
  })

  if (!opts.items?.length) {
    // Sin pedido: se abre ya y el registro viaja en segundo plano
    window.open(getWhatsAppUrl(opts.phone, opts.message + footer(code)), "_blank", "noopener")
    try {
      fetch("/api/whatsapp/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {})
    } catch {}
    return
  }

  // Con pedido: se abre la pestaña de inmediato (si no, el navegador la bloquea) y luego se dirige
  const win = window.open("", "_blank")
  let orderNumber: string | undefined
  try {
    const res = await fetch("/api/whatsapp/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    orderNumber = data?.orderNumber
  } catch {}
  const url = getWhatsAppUrl(opts.phone, opts.message + footer(code, orderNumber))
  if (win) win.location.href = url
  else window.location.href = url
}
