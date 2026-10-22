import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Segmentos que son slugs de Sanity y nunca deben contener espacios.
// En /tienda solo el primer segmento (categoría) es un slug; el segundo es un término de búsqueda.
const SLUG_ROUTES: Record<string, number> = {
  producto: 1,
  blog: 1,
  tienda: 1,
}

function cleanSlugSegment(segment: string): string {
  return segment.trim().replace(/\s+/g, '-').replace(/-{2,}/g, '-')
}

/**
 * Redirige de forma permanente URLs con slugs mal formados (p. ej. "/tienda/%20tela-toalla-colombia")
 * a su versión limpia para consolidar la indexación en una sola URL.
 */
function getCleanSlugRedirect(request: NextRequest): URL | null {
  const { pathname } = request.nextUrl
  if (!pathname.includes('%20') && !/\s/.test(pathname)) return null

  const segments = pathname.split('/')
  const route = segments[1]
  const slugIndex = SLUG_ROUTES[route]
  if (!slugIndex || !segments[slugIndex + 1]) return null

  let decoded: string
  try {
    decoded = decodeURIComponent(segments[slugIndex + 1])
  } catch {
    return null
  }
  const cleaned = cleanSlugSegment(decoded)
  if (!cleaned || cleaned === decoded) return null

  segments[slugIndex + 1] = encodeURIComponent(cleaned)
  const url = request.nextUrl.clone()
  url.pathname = segments.join('/')
  return url
}

export function middleware(request: NextRequest) {
  const redirectUrl = getCleanSlugRedirect(request)
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl, 301)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto archivos estáticos y assets de Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico|api/sanity/).*)',
  ],
}
