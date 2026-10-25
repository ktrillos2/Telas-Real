import crypto from "crypto"
import type { NextRequest } from "next/server"

/**
 * Contraseña del panel /admin/whatsapp (variable WHATSAPP_ADMIN_PASSWORD en Vercel).
 *
 * Al ingresar la contraseña se guarda una cookie firmada (httpOnly) válida por 12 horas.
 * La firma usa la propia contraseña: si se cambia en Vercel, todas las sesiones se cierran.
 * Sin la variable configurada, el panel queda bloqueado.
 */

export const ADMIN_COOKIE = "wa_admin"
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60

function getPassword(): string {
  return (process.env.WHATSAPP_ADMIN_PASSWORD || "").trim()
}

export function isAdminPasswordConfigured(): boolean {
  return getPassword().length > 0
}

function sign(expiresAt: number, password: string): string {
  return crypto.createHmac("sha256", password).update(`wa-admin:${expiresAt}`).digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest()
  const hb = crypto.createHash("sha256").update(b).digest()
  return crypto.timingSafeEqual(ha, hb)
}

export function checkAdminPassword(candidate: unknown): boolean {
  const password = getPassword()
  return Boolean(password) && safeEqual(String(candidate ?? ""), password)
}

/** Valor de la cookie de sesión: "<expira>.<firma>". */
export function createAdminSession(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS
  return `${expiresAt}.${sign(expiresAt, getPassword())}`
}

export function isAdminRequest(req: NextRequest): boolean {
  const password = getPassword()
  const value = req.cookies.get(ADMIN_COOKIE)?.value || ""
  const [exp, signature] = value.split(".")
  const expiresAt = Number(exp)
  if (!password || !signature || !Number.isFinite(expiresAt) || expiresAt < Date.now() / 1000) return false
  return safeEqual(signature, sign(expiresAt, password))
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: ADMIN_SESSION_SECONDS,
}
