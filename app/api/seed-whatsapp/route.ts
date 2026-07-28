import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

export async function GET() {
  try {
    const globalSettings = await client.fetch(`*[_type == "globalSettings"][0]`)
    if (globalSettings) {
      await client.createOrReplace({
        _id: 'whatsappSettings',
        _type: 'whatsappSettings',
        whatsappNumber: globalSettings.whatsappNumber || '+573003371757',
        whatsappMessage: globalSettings.whatsappMessage || '¡Hola! 😍 Vengo desde su página web y me gustaría recibir asesoría para encontrar la tela ideal para mis diseños.',
      })
      console.log('Whatsapp Settings created')
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
