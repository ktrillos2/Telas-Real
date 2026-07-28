import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload as a file asset to Sanity
    const asset = await client.assets.upload('file', buffer, {
      filename: file.name,
      contentType: file.type
    })

    return NextResponse.json({ url: asset.url, id: asset._id })
  } catch (error: any) {
    console.error('Error uploading design:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
