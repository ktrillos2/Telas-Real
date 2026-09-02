import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const token = process.env.SANITY_API_TOKEN
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'

    if (!token || !projectId || !dataset) {
      console.error('[Upload-Design] Missing Sanity credentials:', {
        hasToken: !!token,
        hasProjectId: !!projectId,
        hasDataset: !!dataset,
      })
      return NextResponse.json(
        { error: 'Configuración de almacenamiento de Sanity no disponible en el servidor.' },
        { status: 500 }
      )
    }

    const contentType = req.headers.get('content-type') || ''

    // MODO 1: Streaming directo (Binario crudo - Ultra rápido)
    if (!contentType.includes('multipart/form-data')) {
      const { searchParams } = new URL(req.url)
      const rawFilename =
        searchParams.get('filename') ||
        req.headers.get('x-filename') ||
        'diseno-personalizado.pdf'

      const decodedFilename = decodeURIComponent(rawFilename)
      const isPdf =
        decodedFilename.toLowerCase().endsWith('.pdf') ||
        contentType.toLowerCase().includes('pdf')

      if (!isPdf) {
        return NextResponse.json(
          { error: 'El archivo debe estar en formato PDF (.pdf)' },
          { status: 400 }
        )
      }

      const safeFilename = decodedFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
      const sanityAssetUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/assets/files/${dataset}?filename=${encodeURIComponent(
        safeFilename
      )}`

      // Transferir el stream directamente hacia Sanity
      const sanityRes = await fetch(sanityAssetUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType.includes('pdf') ? contentType : 'application/pdf',
        },
        // @ts-expect-error duplex half is supported in Node 18+ fetch
        duplex: 'half',
        body: req.body,
      })

      const sanityData = await sanityRes.json()

      if (!sanityRes.ok) {
        console.error('[Upload-Design] Error from Sanity REST API:', sanityData)
        return NextResponse.json(
          {
            error:
              sanityData?.message ||
              sanityData?.error?.description ||
              'Error al almacenar el archivo en Sanity.',
          },
          { status: sanityRes.status || 500 }
        )
      }

      const assetDoc = sanityData.document || sanityData
      return NextResponse.json({
        success: true,
        url: assetDoc.url,
        id: assetDoc._id,
        filename: safeFilename,
      })
    }

    // MODO 2: Fallback Multipart/Form-Data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      )
    }

    const filename = file.name || 'diseno-personalizado.pdf'
    const isPdf =
      filename.toLowerCase().endsWith('.pdf') ||
      (file.type && file.type.toLowerCase().includes('pdf'))

    if (!isPdf) {
      return NextResponse.json(
        { error: 'El archivo debe estar en formato PDF (.pdf)' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido (50 MB)' },
        { status: 400 }
      )
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const asset = await writeClient.assets.upload('file', buffer, {
      filename: safeFilename,
      contentType:
        file.type && file.type.includes('pdf') ? file.type : 'application/pdf',
    })

    return NextResponse.json({
      success: true,
      url: asset.url,
      id: asset._id,
      filename: safeFilename,
    })
  } catch (error: any) {
    console.error('[Upload-Design] Error inesperado:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar el archivo PDF' },
      { status: 500 }
    )
  }
}
