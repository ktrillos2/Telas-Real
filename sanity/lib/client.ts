import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, token } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Must be false for Draft Mode and Stega to work reliably
  token,
  stega: {
    studioUrl: '/admin',
    // Activa stega en producción solo si el entorno es el adecuado (Vercel Preview/Dev)
    enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development',
  },
})

