import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, adminCookieOptions, checkAdminPassword, createAdminSession, isAdminPasswordConfigured } from "@/lib/whatsapp/admin-auth"

export const dynamic = "force-dynamic"

/** POST { password }: abre la sesión del panel de WhatsApp. DELETE: la cierra. */
export async function POST(req: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { success: false, error: "Falta configurar WHATSAPP_ADMIN_PASSWORD en Vercel." },
      { status: 503 }
    )
  }
  const { password } = await req.json().catch(() => ({}))
  if (!checkAdminPassword(password)) {
    // Pausa breve para frenar intentos repetidos
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ success: false, error: "Contraseña incorrecta." }, { status: 401 })
  }
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, createAdminSession(), adminCookieOptions)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 })
  return res
}
