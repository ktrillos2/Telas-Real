import { NextRequest, NextResponse } from 'next/server'
import { updateClientProgress, syncGoogleSheet, getFabricSettings } from '@/lib/wholesale/wholesaleService'
import { client } from '@/sanity/lib/client'
import { calculateFabricProgress, getCurrentMonthName, getCurrentYear } from '@/lib/wholesale/fabricCalculator'

/**
 * POST /api/sync/sanity-to-google
 * 
 * Sincronización desde Sanity hacia Google Sheets.
 * Sube cambios manuales de KG o eventos emitidos por Webhooks / Studio.
 * 
 * Formatos soportados:
 * 1. Petición directa desde Studio/Dashboard:
 *    {
 *      "clienteId": "xxx",
 *      "mes": "SEPTIEMBRE",
 *      "anio": 2026,
 *      "kgCumplido": 400,
 *      "usuario": "admin@telasreal.com"
 *    }
 * 
 * 2. Sanity Webhook Event (cuando un documento clienteMayorista es modificado):
 *    {
 *      "_id": "...",
 *      "_type": "clienteMayorista",
 *      "nombre": "NOVOA",
 *      "meses": [...]
 *    }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Caso 1: Payload directo desde Studio / API
    if (body.clienteId) {
      const {
        clienteId,
        mes = getCurrentMonthName(),
        anio = getCurrentYear(),
        kgCumplido,
        usuario = 'admin',
        nota
      } = body

      if (kgCumplido === undefined || kgCumplido === null) {
        return NextResponse.json({
          success: false,
          error: 'El campo kgCumplido es obligatorio.'
        }, { status: 400 })
      }

      const result = await updateClientProgress({
        clienteId,
        mes,
        anio: Number(anio),
        kgCumplido: Number(kgCumplido),
        usuario,
        origen: 'sanity',
        nota
      })

      return NextResponse.json({
        success: true,
        message: `Progreso de ${result.clienteNombre} actualizado y sincronizado correctamente.`,
        data: result
      })
    }

    // Caso 2: Webhook de Sanity para clienteMayorista
    if (body._type === 'clienteMayorista' && body._id) {
      const realId = String(body._id).replace(/^drafts\./, '')
      const clienteDoc = await client.withConfig({ useCdn: false }).fetch(
        `*[_type == "clienteMayorista" && _id == $id][0]`,
        { id: realId }
      )

      if (!clienteDoc) {
        return NextResponse.json({
          success: false,
          error: 'Documento clienteMayorista no encontrado en Sanity.'
        }, { status: 404 })
      }

      // Tomar el último mes registrado para propagar
      const meses = Array.isArray(clienteDoc.meses) ? clienteDoc.meses : []
      if (meses.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'El cliente no tiene meses registrados para sincronizar.'
        })
      }

      const lastMonth = meses[meses.length - 1]
      const settings = await getFabricSettings()
      const objetivoKg = Number(clienteDoc.objetivoMensual?.kg) || 0
      const precioKg = Number(clienteDoc.acuerdoPrecio?.precioKg) || settings.precioKgDefault

      const calculations = calculateFabricProgress({
        objetivoKg,
        kgCumplido: Number(lastMonth.kgCumplido) || 0,
        rendimiento: settings.rendimientoKgMetro,
        precioKg
      })

      const pushResult = await syncGoogleSheet({
        cliente: clienteDoc,
        monthRecord: lastMonth,
        calculations
      })

      return NextResponse.json({
        success: true,
        source: 'sanity-webhook',
        pushedMonth: lastMonth.mes,
        pushResult
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Formato de payload no reconocido. Envía { clienteId, kgCumplido, mes, anio } o evento webhook.'
    }, { status: 400 })

  } catch (err: any) {
    console.error('Error en /api/sync/sanity-to-google:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Error interno del servidor al sincronizar Sanity con Google Sheets.'
    }, { status: 500 })
  }
}
