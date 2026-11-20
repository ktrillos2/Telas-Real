import { NextRequest, NextResponse } from "next/server"
import { createClient } from "next-sanity"
import { v4 as uuidv4 } from "uuid"
import { apiVersion, dataset, projectId } from "@/sanity/env"
import { readGaIdentity, isGA4ServerPurchaseEnabled } from "@/lib/ga4"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

/**
 * Registro de contactos de WhatsApp desde la web (código de origen) y "Comprar por WhatsApp":
 * con productos del carrito se crea un pedido pendiente con método "whatsapp", para que el equipo lo
 * confirme en el admin (al pasarlo a Pagado / En proceso cuenta como venta en GA4, descuenta inventario
 * y envía la confirmación por WhatsApp como cualquier pedido).
 */

const writeClient = createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_TOKEN })

const hits = new Map<string, number[]>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 8
}

const clean = (v: unknown, max = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max)

async function nextOrderNumber(): Promise<string> {
  const recent: Array<{ orderNumber?: string }> = await writeClient.fetch(`*[_type == "order"] | order(_createdAt desc)[0...50]{ orderNumber }`)
  for (const o of recent || []) {
    const n = parseInt(String(o.orderNumber || "").match(/\d+/)?.[0] || "", 10)
    if (n >= 10000 && n <= 99999) return String(Math.max(10001, n + 1))
  }
  return "10001"
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon"
  if (rateLimited(ip)) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 })
  if (!process.env.SANITY_API_TOKEN) return NextResponse.json({ ok: false })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const code = clean(body?.code, 12)
  if (!/^WEB-[A-Z0-9]{5}$/.test(code)) return NextResponse.json({ error: "Código inválido" }, { status: 400 })
  const source = ["floating", "product", "cart", "other"].includes(body?.source) ? body.source : "other"
  const items = Array.isArray(body?.items) ? body.items.slice(0, 50) : []

  // Datos del cliente (formulario previo a "Comprar por WhatsApp")
  const c = body?.customer || {}
  const customer = {
    fullName: clean(c.fullName, 120),
    phone: clean(c.phone, 20).replace(/\D/g, "").slice(-10),
    city: clean(c.city, 80),
    email: clean(c.email, 120).toLowerCase(),
    address: clean(c.address, 200),
  }
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) customer.email = ""

  try {
    let orderRef: { _id: string; orderNumber: string } | null = null

    if (source === "cart" && items.length > 0) {
      const mapped = items
        .map((it: any) => ({
          _key: uuidv4(),
          name: clean(it?.name, 200) || "Producto",
          quantity: Math.max(0, Number(it?.quantity) || 0),
          price: Math.max(0, Number(it?.price) || 0),
          image: clean(it?.image, 500) || undefined,
          productSlug: clean(it?.slug, 200) || undefined,
          designName: clean(it?.designName, 200) || (it?.isCustom ? "Diseño Personalizado" : undefined),
          isCustom: !!it?.isCustom,
        }))
        .filter((it: any) => it.quantity > 0)
      // El total se recalcula en el servidor con los precios del carrito (referencia: el equipo confirma el valor final)
      const total = Math.round(mapped.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0))
      if (mapped.length > 0) {
        const orderNumber = await nextOrderNumber()
        // Cliente con sesión iniciada o con correo de una cuenta existente: el pedido queda en su cuenta
        const session = await getServerSession(authOptions).catch(() => null)
        let userId: string | undefined = (session?.user as any)?.id
        const email = customer.email || clean(session?.user?.email, 120).toLowerCase()
        if (!userId && email) {
          userId = (await writeClient.fetch(`*[_type == "user" && lower(email) == $email][0]._id`, { email })) || undefined
        }
        const hasCustomer = !!(customer.fullName || customer.phone || customer.email)
        const created = await writeClient.create({
          _type: "order",
          ...(await readGaIdentity()),
          ga4Server: isGA4ServerPurchaseEnabled(),
          orderNumber,
          date: new Date().toISOString(),
          status: "pending",
          paymentMethod: "whatsapp",
          whatsappCode: code,
          ...(email ? { email } : {}),
          ...(userId ? { user: { _type: "reference", _ref: userId } } : {}),
          ...(hasCustomer
            ? {
                shippingAddress: {
                  fullName: customer.fullName || undefined,
                  phone: customer.phone || undefined,
                  country: "Colombia",
                  city: customer.city || undefined,
                  address: customer.address || undefined,
                },
              }
            : {}),
          total,
          items: mapped,
          // No es un carrito abandonado de checkout: no se le envían recordatorios automáticos
          abandonedSmsSent: true,
          abandonedEmailSent: true,
          notes: `Pedido armado en la web y enviado por WhatsApp (código ${code}). ${hasCustomer ? "Confirmar dirección completa, departamento y pago con el cliente en el chat." : "El cliente no dejó sus datos: pedirlos en el chat."}`,
        })
        orderRef = { _id: created._id, orderNumber }
      }
    }

    await writeClient.create({
      _type: "whatsappLead",
      code,
      source,
      page: clean(body?.page, 300) || undefined,
      productName: clean(body?.productName, 200) || undefined,
      total: Number(body?.total) > 0 ? Math.round(Number(body.total)) : undefined,
      order: orderRef ? { _type: "reference", _ref: orderRef._id, _weak: true } : undefined,
      converted: false,
    })

    return NextResponse.json({ ok: true, orderNumber: orderRef?.orderNumber })
  } catch (error) {
    console.error("[whatsapp/lead]", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
