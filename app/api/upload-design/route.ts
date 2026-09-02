import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const token = process.env.SANITY_API_TOKEN
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'

    if (!token || !projectId || !dataset) {
      console.error('Missing Sanity credentials in /api/upload-design')
      return NextResponse.json(
        { error: 'Configuración de almacenamiento no disponible' },
        { status: 500 }
      )
    }

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo' }, { status: 400 })
    }

    const filename = file.name || 'diseno-personalizado.pdf'
    const isPdf = filename.toLowerCase().endsWith('.pdf') || (file.type && file.type.toLowerCase().includes('pdf'))
    if (!isPdf) {
      return NextResponse.json(
        { error: 'El archivo debe estar en formato PDF (.pdf)' },
        { status: 400 }
      )
    }

    // Limit maximum size to 50MB
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido (50 MB)' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Clean filename for safety while keeping extension
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Upload as a file asset to Sanity
    const asset = await writeClient.assets.upload('file', buffer, {
      filename: safeFilename,
      contentType: file.type && file.type.includes('pdf') ? file.type : 'application/pdf'
    })

    return NextResponse.json({
      success: true,
      url: asset.url,
      id: asset._id,
      filename: safeFilename
    })
  } catch (error: any) {
    console.error('Error uploading design:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir el archivo PDF a Sanity' },
      { status: 500 }
    )
  }
}

