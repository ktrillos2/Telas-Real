import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, token } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Habilitar CDN para ahorrar costos dramáticamente en las consultas directas
  token,
  stega: {
    studioUrl: '/admin',
    // Activa stega en producción solo si el entorno es el adecuado (Vercel Preview/Dev)
    enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development',
  },
})


/**
 * Consultas de páginas públicas con caché de Next (por defecto 2 minutos).
 * Sin esto, cada visita volvía a consultar Sanity y consumía ancho de banda de la API.
 * Los cambios del admin se ven en la web en máximo ese tiempo. No usar para validar
 * precios o stock al crear pedidos: ahí se necesita el dato fresco.
 */
export const CACHE_SECONDS = 120

export const cachedClient = {
  fetch<T = any>(query: string, params: Record<string, unknown> = {}, options: Record<string, any> = {}): Promise<T> {
    return client.fetch<T>(query, params as any, { next: { revalidate: CACHE_SECONDS }, ...options } as any)
  },
}
