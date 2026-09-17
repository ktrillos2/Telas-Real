import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { getFabricSettings, getStoredWebhookUrl } from '@/lib/wholesale/wholesaleService'
import {
  calculateFabricProgress,
  getMonthNumber,
  getCurrentYear,
  MonthlyProgressRecord
} from '@/lib/wholesale/fabricCalculator'

const DEFAULT_SYNC_KEY = process.env.DRIVE_SYNC_KEY || 'telasreal_secure_sync_2026_key'

function buildWebhookUrl(rawUrl: string, action: string = 'sync'): string {
  try {
    const u = new URL(rawUrl)
    u.searchParams.set('action', action)
    if (!u.searchParams.has('key') && !u.searchParams.has('apiKey')) {
      u.searchParams.set('key', DEFAULT_SYNC_KEY)
    }
    return u.toString()
  } catch {
    return rawUrl
  }
}

/**
 * Procesa la sincronización desde Google Sheets hacia Sanity.
 */
async function executeGoogleToSanitySync(providedUrl?: string) {
  const t0 = performance.now()
  const webhookUrl = providedUrl || await getStoredWebhookUrl()

  if (!webhookUrl) {
    throw new Error('No se ha configurado la URL del Webhook de Google Drive / Sheets en Sanity.')
  }

  // 1. Obtener datos desde Google Apps Script
  const targetUrl = buildWebhookUrl(webhookUrl, 'sync')
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`Google Sheets devolvió HTTP status ${response.status}`)
  }

  const textResponse = await response.text()
  let driveData: any
  try {
    driveData = JSON.parse(textResponse)
  } catch {
    if (textResponse.includes('<html') || textResponse.includes('accounts.google.com')) {
      throw new Error('Google requiere inicio de sesión. Configura la app web como "Cualquier persona" (Anyone).')
    }
    throw new Error('Respuesta no válida de Google Sheets (no es JSON válido).')
  }

  if (driveData.status === 'error') {
    throw new Error(driveData.message || 'Error en el script de Google Sheets')
  }

  const driveClients = driveData.clients || []
  if (!Array.isArray(driveClients) || driveClients.length === 0) {
    return {
      success: true,
      message: 'No se encontraron clientes para sincronizar en Google Sheets.',
      processed: 0,
      created: 0,
      updated: 0,
      conflicts: 0,
      durationMs: Math.round(performance.now() - t0),
    }
  }

  // 2. Obtener configuración de rendimiento y clientes existentes en Sanity
  const settings = await getFabricSettings()
  const existingClients: any[] = await client.withConfig({ useCdn: false }).fetch(
    `*[_type == "clienteMayorista" && !(_id in path("drafts.**"))]{
      _id,
      nombre,
      codigoCliente,
      nit,
      telefono,
      direccion,
      objetivoMensual,
      acuerdoPrecio,
      meses,
      updatedAt
    }`
  )

  let createdCount = 0
  let updatedCount = 0
  let conflictCount = 0
  const historyEntries: any[] = []
  const patchOperations: Array<{ id: string; data: any }> = []
  const createOperations: any[] = []

  const currentYear = getCurrentYear()

  for (const dc of driveClients) {
    const rawName = String(dc.cliente || dc.name || '').trim()
    if (!rawName || rawName.length < 2 || !isNaN(Number(rawName))) {
      continue // Saltar filas inválidas o sin nombre
    }

    const clientCode = String(dc.ID_CLIENTE || dc.id_cliente || '').trim()
    const sanityId = String(dc.ID_SANITY || dc.id_sanity || '').replace(/^drafts\./, '').trim()
    const clientNit = String(dc.cedula || dc.nit || '').replace(/\.0$/, '').replace(/\s+/g, '')

    // Buscar coincidencia en Sanity
    const match = existingClients.find(ec => {
      if (sanityId && ec._id === sanityId) return true
      if (clientCode && ec.codigoCliente === clientCode) return true
      if (clientNit && ec.nit === clientNit) return true
      if (ec.nombre.toLowerCase().trim() === rawName.toLowerCase().trim()) return true
      return false
    })

    const targetKg = Number(dc.volumen_mes_kg) || (match?.objetivoMensual?.kg) || 0
    const targetMt = targetKg > 0 ? Math.round(targetKg * settings.rendimientoKgMetro * 100) / 100 : 0
    const precioKg = Number(dc.acuerdo_kg_valor) || (match?.acuerdoPrecio?.precioKg) || settings.precioKgDefault
    const precioMt = Number(dc.acuerdo_mt_valor) || (match?.acuerdoPrecio?.precioMt) || settings.precioMtDefault

    // Procesar meses desde la hoja
    const sheetMonths = Array.isArray(dc.historial_meses) ? dc.historial_meses : []

    if (!match) {
      // CREAR nuevo clienteMayorista
      const newMeses: MonthlyProgressRecord[] = []

      for (const sm of sheetMonths) {
        const monthName = String(sm.mes || '').toUpperCase().trim()
        if (!monthName) continue

        const monthKg = Math.max(0, Number(sm.kg) || 0)
        const calc = calculateFabricProgress({
          objetivoKg: targetKg,
          kgCumplido: monthKg,
          rendimiento: settings.rendimientoKgMetro,
          precioKg
        })

        newMeses.push({
          _key: Math.random().toString(36).substring(7),
          mes: monthName,
          mesNumero: getMonthNumber(monthName),
          anio: Number(sm.anio) || currentYear,
          kgCumplido: calc.kgCumplido,
          mtCumplido: calc.mtCumplido,
          faltanteKg: calc.faltanteKg,
          faltanteMt: calc.faltanteMt,
          dinero: calc.dinero,
          faltanteDinero: calc.faltanteDinero,
          porcentaje: calc.porcentaje,
          cumplimiento: calc.cumplimiento,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Google Sheets (Importación)'
        })
      }

      newMeses.sort((a, b) => (a.anio !== b.anio ? a.anio - b.anio : a.mesNumero - b.mesNumero))

      createOperations.push({
        _type: 'clienteMayorista',
        nombre: rawName,
        codigoCliente: clientCode || `CLI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        nit: clientNit,
        telefono: String(dc.telefono || ''),
        direccion: String(dc.direccion || ''),
        ciudad: String(dc.ciudad || ''),
        objetivoMensual: {
          kg: targetKg,
          mt: targetMt
        },
        acuerdoPrecio: {
          precioKg,
          precioMt
        },
        meses: newMeses,
        ultimoMesActualizado: newMeses.length > 0 ? `${newMeses[newMeses.length - 1].mes} ${newMeses[newMeses.length - 1].anio}` : undefined,
        estado: 'activo',
        updatedAt: new Date().toISOString()
      })
    } else {
      // ACTUALIZAR cliente existente con detección de cambios
      const existingMeses: MonthlyProgressRecord[] = Array.isArray(match.meses) ? [...match.meses] : []
      let hasChanges = false

      for (const sm of sheetMonths) {
        const monthName = String(sm.mes || '').toUpperCase().trim()
        if (!monthName) continue
        const monthYear = Number(sm.anio) || currentYear
        const sheetKg = Math.max(0, Number(sm.kg) || 0)

        const existingIdx = existingMeses.findIndex(
          em => String(em.mes || '').toUpperCase() === monthName && Number(em.anio || currentYear) === monthYear
        )

        if (existingIdx >= 0) {
          const currentSanityKg = Number(existingMeses[existingIdx].kgCumplido) || 0

          // Detectar si el valor de Google Sheets cambió respecto a Sanity
          if (Math.abs(currentSanityKg - sheetKg) > 0.01) {
            hasChanges = true

            const calc = calculateFabricProgress({
              objetivoKg: targetKg,
              kgCumplido: sheetKg,
              rendimiento: settings.rendimientoKgMetro,
              precioKg
            })

            // Registro de auditoría
            historyEntries.push({
              _type: 'syncHistory',
              fecha: new Date().toISOString(),
              cliente: { _type: 'reference', _ref: match._id },
              mes: monthName,
              anio: monthYear,
              origen: 'google_sheets',
              valorAnterior: currentSanityKg,
              valorNuevo: sheetKg,
              calculos: {
                mtCumplido: calc.mtCumplido,
                faltanteKg: calc.faltanteKg,
                faltanteMt: calc.faltanteMt,
                faltanteDinero: calc.faltanteDinero,
                porcentaje: calc.porcentaje,
                cumplimiento: calc.cumplimiento,
              },
              usuario: 'Google Sheets Sync',
              estado: 'exitoso'
            })

            existingMeses[existingIdx] = {
              ...existingMeses[existingIdx],
              kgCumplido: calc.kgCumplido,
              mtCumplido: calc.mtCumplido,
              faltanteKg: calc.faltanteKg,
              faltanteMt: calc.faltanteMt,
              dinero: calc.dinero,
              faltanteDinero: calc.faltanteDinero,
              porcentaje: calc.porcentaje,
              cumplimiento: calc.cumplimiento,
              updatedAt: new Date().toISOString(),
              updatedBy: 'Google Sheets Sync'
            }
          }
        } else {
          // El mes está en Google Sheet pero no en Sanity
          hasChanges = true
          const calc = calculateFabricProgress({
            objetivoKg: targetKg,
            kgCumplido: sheetKg,
            rendimiento: settings.rendimientoKgMetro,
            precioKg
          })

          const newRecord: MonthlyProgressRecord = {
            _key: Math.random().toString(36).substring(7),
            mes: monthName,
            mesNumero: getMonthNumber(monthName),
            anio: monthYear,
            kgCumplido: calc.kgCumplido,
            mtCumplido: calc.mtCumplido,
            faltanteKg: calc.faltanteKg,
            faltanteMt: calc.faltanteMt,
            dinero: calc.dinero,
            faltanteDinero: calc.faltanteDinero,
            porcentaje: calc.porcentaje,
            cumplimiento: calc.cumplimiento,
            updatedAt: new Date().toISOString(),
            updatedBy: 'Google Sheets Sync'
          }
          existingMeses.push(newRecord)

          historyEntries.push({
            _type: 'syncHistory',
            fecha: new Date().toISOString(),
            cliente: { _type: 'reference', _ref: match._id },
            mes: monthName,
            anio: monthYear,
            origen: 'google_sheets',
            valorAnterior: 0,
            valorNuevo: sheetKg,
            calculos: {
              mtCumplido: calc.mtCumplido,
              faltanteKg: calc.faltanteKg,
              faltanteMt: calc.faltanteMt,
              faltanteDinero: calc.faltanteDinero,
              porcentaje: calc.porcentaje,
              cumplimiento: calc.cumplimiento,
            },
            usuario: 'Google Sheets Sync',
            estado: 'exitoso'
          })
        }
      }

      if (hasChanges) {
        existingMeses.sort((a, b) => (a.anio !== b.anio ? a.anio - b.anio : a.mesNumero - b.mesNumero))
        patchOperations.push({
          id: match._id,
          data: {
            meses: existingMeses,
            ultimoMesActualizado: existingMeses.length > 0 ? `${existingMeses[existingMeses.length - 1].mes} ${existingMeses[existingMeses.length - 1].anio}` : match.ultimoMesActualizado,
            updatedAt: new Date().toISOString()
          }
        })
      }
    }
  }

  // 3. Ejecutar transacciones en lotes
  const BATCH_SIZE = 50

  // Guardar creaciones
  for (let i = 0; i < createOperations.length; i += BATCH_SIZE) {
    const batch = createOperations.slice(i, i + BATCH_SIZE)
    const tx = client.transaction()
    batch.forEach(doc => tx.create(doc))
    await tx.commit()
    createdCount += batch.length
  }

  // Guardar parches
  for (let i = 0; i < patchOperations.length; i += BATCH_SIZE) {
    const batch = patchOperations.slice(i, i + BATCH_SIZE)
    const tx = client.transaction()
    batch.forEach(op => tx.patch(op.id, p => p.set(op.data)))
    await tx.commit()
    updatedCount += batch.length
  }

  // Guardar historial de auditoría
  for (let i = 0; i < historyEntries.length; i += BATCH_SIZE) {
    const batch = historyEntries.slice(i, i + BATCH_SIZE)
    const tx = client.transaction()
    batch.forEach(h => tx.create(h))
    await tx.commit()
  }

  const durationMs = Math.round(performance.now() - t0)

  return {
    success: true,
    spreadsheetName: driveData.spreadsheetName || 'Google Sheets Mayoristas',
    processed: driveClients.length,
    created: createdCount,
    updated: updatedCount,
    conflicts: conflictCount,
    historyEntriesLogged: historyEntries.length,
    durationMs
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url') || undefined
    const result = await executeGoogleToSanitySync(url)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Error en /api/sync/google-to-sanity GET:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Error al sincronizar Google Sheets hacia Sanity.'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const result = await executeGoogleToSanitySync(body?.url)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Error en /api/sync/google-to-sanity POST:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Error al sincronizar Google Sheets hacia Sanity.'
    }, { status: 500 })
  }
}
