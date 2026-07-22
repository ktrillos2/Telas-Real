'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/admin/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import { SalesDashboard } from './sanity/components/SalesDashboard'
import { ReviewsSyncTool } from './sanity/components/ReviewsSyncTool'
import { BulkEditProducts } from './sanity/components/BulkEditProducts'
import { CalculadoraReport } from './sanity/components/CalculadoraReport'
import { BulkEditSublimados } from './sanity/components/BulkEditSublimados'
import { SmsSender } from './sanity/components/SmsSender'
import { ChartBar, Star, Edit, Calculator, MessageSquare } from 'lucide-react'

export default defineConfig({
  basePath: '/admin',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  tools: [
    {
      name: 'dashboard',
      title: 'Dashboard',
      icon: ChartBar,
      component: SalesDashboard,
    },
    {
      name: 'reviews-sync',
      title: 'Reseñas',
      icon: Star,
      component: ReviewsSyncTool,
    },
    {
      name: 'bulk-edit',
      title: 'Edición Masiva',
      icon: Edit,
      component: BulkEditProducts,
    },
    {
      name: 'calculadora-report',
      title: 'Reporte Calculadora',
      icon: Calculator,
      component: CalculadoraReport,
    },
    {
      name: 'bulk-edit-sublimados',
      title: 'Diseños Sublimados',
      icon: Edit,
      component: BulkEditSublimados,
    },
    {
      name: 'sms-sender',
      title: 'Enviar SMS',
      icon: MessageSquare,
      component: SmsSender,
    }
  ],
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: '/api/draft-mode/enable',
        },
      },
      resolve: {
        mainDocuments: [
          {
            route: '/blog/:slug',
            filter: `_type == "post" && slug.current == $slug`,
          },
        ],
        locations: {
          post: (doc) => {
            const href = doc?.slug?.current ? `/blog/${doc.slug.current}` : '/blogs'
            return {
              locations: [
                {
                  title: doc.title || 'Untitled',
                  href,
                },
                {
                  title: 'Blogs Index',
                  href: '/blogs',
                },
              ],
            }
          },
        },
      },
    }),
  ],
})
