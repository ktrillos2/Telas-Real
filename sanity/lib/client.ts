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

