import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { parseWholesaleWorkbook, ParsedWholesaleClient, isValidClientName } from '@/lib/wholesaleExcelParser'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

// Clave del documento de configuración de Drive en Sanity
const DRIVE_SETTINGS_ID = 'wholesaleDriveSettings'
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

// Función auxiliar para obtener la URL configurada
async function getStoredWebhookUrl(): Promise<string | null> {
  try {
    const doc = await client.fetch(`*[_id == $id][0].webhookUrl`, { id: DRIVE_SETTINGS_ID })
    return doc || null
  } catch {
    return null
  }
}

// Función para obtener la ruta del Excel local (archivo-guia.xlsx o mayoristas.xlsx)
function getLocalWorkbookPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'archivo-guia.xlsx'),
    path.join(process.cwd(), 'mayoristas.xlsx'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

// GET: Probar conexión y escanear pestañas del Google Sheet (o archivo local)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let webhookUrl = searchParams.get('url')
    const source = searchParams.get('source')

    // Si pide escanear el archivo local
    if (source === 'local') {
      const localPath = getLocalWorkbookPath()
      if (!localPath) {
        return NextResponse.json({
          connected: false,
          error: 'No se encontró el archivo local archivo-guia.xlsx ni mayoristas.xlsx en la raíz del proyecto.',
        }, { status: 404 })
      }

      const fileName = path.basename(localPath)
      const fileBuffer = fs.readFileSync(localPath)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const parsed = parseWholesaleWorkbook(workbook)

      return NextResponse.json({
        connected: true,
        source: 'local',
        spreadsheetName: `${fileName} (Archivo Local)`,
        sheets: parsed.sheets,
        totalClientsFound: parsed.clients.length,
        sampleClients: parsed.clients.slice(0, 5),
      })
    }

    if (!webhookUrl) {
      webhookUrl = await getStoredWebhookUrl()
    }

    if (!webhookUrl) {
      return NextResponse.json({
        connected: false,
        error: 'No se ha configurado la URL del Webhook de Google Drive / Sheets.',
      }, { status: 400 })
    }

    // Llamar al Google Apps Script (GET con action=sync y key)
    const targetUrl = buildWebhookUrl(webhookUrl, 'sync')
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        error: `Error al conectar con Google Sheets (HTTP ${response.status})`,
      }, { status: 502 })
    }

    const textResponse = await response.text()
    let driveData: any
    try {
      driveData = JSON.parse(textResponse)
    } catch {
      if (textResponse.includes('<html') || textResponse.includes('<!DOCTYPE') || textResponse.includes('accounts.google.com')) {
        return NextResponse.json({
          connected: false,
          error: 'Google requiere inicio de sesión. En Apps Script, ve a "Implementar > Administrar implementaciones", edita y asegúrate de elegir "Quién tiene acceso: Cualquier persona" (Anyone).',
        }, { status: 403 })
      }
      return NextResponse.json({
        connected: false,
        error: 'Respuesta no válida de Google Sheets (no es JSON). Verifica que pegaste el script completo.',
      }, { status: 500 })
    }

    if (driveData.status === 'error') {
      return NextResponse.json({
        connected: false,
        error: driveData.message || 'Error retornado por el script de Google Sheets',
      }, { status: 500 })
    }

    // Guardar metadata en Sanity
    try {
      await client.createIfNotExists({
        _id: DRIVE_SETTINGS_ID,
        _type: 'wholesaleDriveSettings',
      })

      await client.patch(DRIVE_SETTINGS_ID).set({
        spreadsheetName: driveData.spreadsheetName || 'Google Sheets Mayoristas',
        detectedSheets: (driveData.sheets || []).map((s: any) => `${s.name} (${s.totalRows} filas)`),
      }).commit()
    } catch (sanityErr) {
      console.warn('No se pudo guardar la metadata en Sanity:', sanityErr)
    }

    return NextResponse.json({
      connected: true,
      spreadsheetName: driveData.spreadsheetName || 'Google Sheets Mayoristas',
      sheets: driveData.sheets || [],
      totalClientsFound: (driveData.clients || []).length,
      sampleClients: (driveData.clients || []).slice(0, 5),
    })

  } catch (err: any) {
    console.error('Error en drive-sync GET:', err)
    return NextResponse.json({
      connected: false,
      error: err.message || 'No se pudo contactar con la URL de Google Sheets',
    }, { status: 500 })
  }
}

// Función para eliminar todos los clientes mayoristas en Sanity
async function deleteAllMayoristas(): Promise<number> {
  const ids: string[] = await client.withConfig({ useCdn: false }).fetch(
    `*[_type == "user" && role == "mayorista"]._id`
  )
  if (!ids || ids.length === 0) return 0

  const BATCH_SIZE = 100
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE)
    const tx = client.transaction()
    batch.forEach(id => tx.delete(id))
    await tx.commit()
  }
  return ids.length
}

// POST: Sincronizar en Vivo (PULL desde Drive, IMPORT local o PUSH hacia Drive)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action = 'pull', webhookUrl: paramUrl, clientData, cleanSync = false } = body

    // Acción: Borrar toda la data existente de mayoristas
    if (action === 'clear_all') {
      const deletedCount = await deleteAllMayoristas()
      return NextResponse.json({
        success: true,
        message: `Se eliminaron ${deletedCount} clientes mayoristas correctamente.`,
        deleted: deletedCount,
      })
    }

    let webhookUrl = paramUrl || await getStoredWebhookUrl()

    // Acción: Guardar solo la URL
    if (action === 'save_url') {
      if (!paramUrl) {
        return NextResponse.json({ error: 'URL requerida' }, { status: 400 })
      }
      await client.createIfNotExists({
        _id: DRIVE_SETTINGS_ID,
        _type: 'wholesaleDriveSettings',
      })
      await client.patch(DRIVE_SETTINGS_ID).set({ webhookUrl: paramUrl }).commit()
      return NextResponse.json({ success: true, message: 'URL guardada exitosamente' })
    }

    // Acción IMPORT LOCAL: Carga clientes desde archivo-guia.xlsx o mayoristas.xlsx en la raíz
    if (action === 'import_local') {
      const localPath = getLocalWorkbookPath()
      if (!localPath) {
        return NextResponse.json({
          error: 'No se encontró el archivo archivo-guia.xlsx ni mayoristas.xlsx en la raíz del proyecto.',
        }, { status: 404 })
      }

      let clearedPrevious = 0
      if (cleanSync) {
        clearedPrevious = await deleteAllMayoristas()
      }

      const fileName = path.basename(localPath)
      const fileBuffer = fs.readFileSync(localPath)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const parsed = parseWholesaleWorkbook(workbook)

      const syncResult = await syncClientsToSanity(parsed.clients, `${fileName} (Archivo Local)`, parsed.sheets)
      return NextResponse.json({
        ...syncResult,
        clearedPrevious,
      })
    }

    if (!webhookUrl) {
      return NextResponse.json({
        error: 'Debes configurar primero la URL de Google Apps Script en Sanity.',
      }, { status: 400 })
    }

    // Acción PULL: Traer datos de Drive y actualizar Sanity
    if (action === 'pull') {
      const targetUrl = buildWebhookUrl(webhookUrl, 'sync')
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        redirect: 'follow',
      })

      if (!response.ok) {
        throw new Error(`Google Sheets devolvió status ${response.status}`)
      }

      const textResponse = await response.text()
      let driveData: any
      try {
        driveData = JSON.parse(textResponse)
      } catch {
        if (textResponse.includes('<html') || textResponse.includes('<!DOCTYPE') || textResponse.includes('accounts.google.com')) {
          throw new Error('Google requiere inicio de sesión. En Apps Script, configura "Quién tiene acceso: Cualquier persona" (Anyone).')
        }
        throw new Error('Respuesta no válida de Google Sheets (no es JSON válido).')
      }

      if (driveData.status === 'error') {
        throw new Error(driveData.message || 'Error en el script de Google Sheets')
      }

      let clearedPrevious = 0
      if (cleanSync) {
        clearedPrevious = await deleteAllMayoristas()
      }

      const driveClients = driveData.clients || []
      const syncResult = await syncClientsToSanity(driveClients, driveData.spreadsheetName, driveData.sheets)
      return NextResponse.json({
        ...syncResult,
        clearedPrevious,
      })
    }

    // Acción PUSH: Enviar cambios de Sanity a Google Sheets
    if (action === 'push') {
      if (!clientData) {
        return NextResponse.json({ error: 'Datos de cliente requeridos para push' }, { status: 400 })
      }

      if (!webhookUrl) {
        webhookUrl = await getStoredWebhookUrl()
      }

      if (!webhookUrl) {
        return NextResponse.json({
          success: false,
          warning: 'Cambios guardados en Sanity, pero no hay URL de Google Apps Script configurada para sincronizar a Drive.'
        })
      }

      try {
        const currentYear = new Date().getFullYear()
        const currentMonth = clientData.mes || new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase()
        const syncKey = process.env.DRIVE_SYNC_KEY || DEFAULT_SYNC_KEY

        const kgVal = Number(clientData.brush_kg_cumplido) || 0
        const mtVal = Number(clientData.brush_mt_cumplido) || (kgVal > 0 ? Math.round(kgVal * 3.3 * 10) / 10 : 0)
        const dineroVal = typeof clientData.cuanto_va_dinero_valor === 'number'
          ? clientData.cuanto_va_dinero_valor
          : (Number(String(clientData.cuanto_va_dinero || '').replace(/[^0-9]/g, '')) || 0)

        const pushPayload = {
          apiKey: syncKey,
          key: syncKey,
          action: 'update_client',
          client: {
            ...clientData,
            cliente: clientData.cliente || clientData.name,
            name: clientData.name || clientData.cliente,
            cedula: clientData.cedula,
            telefono: clientData.telefono,
            direccion: clientData.direccion,
            acuerdo_kg_valor: Number(String(clientData.acuerdo_kg || '').replace(/[^0-9]/g, '')) || undefined,
            acuerdo_mt_valor: Number(String(clientData.acuerdo_mt || '').replace(/[^0-9]/g, '')) || undefined,
            volumen_mes_kg: Number(clientData.volumen_mes_kg) || undefined,
            source_sheet: clientData.source_sheet || clientData.grupo_sheet,
            grupo_sheet: clientData.grupo_sheet
          },
          monthData: {
            mes: currentMonth,
            anio: clientData.anio || currentYear,
            kg: kgVal,
            mt: mtVal,
            dinero: dineroVal,
            cuanto_falto_kg: clientData.cuanto_falto_kg,
            cuanto_falto_mt: clientData.cuanto_falto_mt,
            cumplimiento: clientData.cumplimiento || (clientData.cuanto_falto_kg <= 0 && kgVal > 0 ? 'SI' : 'NO'),
          }
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pushPayload),
          redirect: 'follow',
        })

        const textRes = await response.text()
        let pushResult: any
        try {
          pushResult = JSON.parse(textRes)
        } catch {
          pushResult = { status: 'sent', raw: textRes.slice(0, 100) }
        }

        const updatedCount = (pushResult.profileUpdates?.length || 0) + (pushResult.monthUpdate ? 1 : 0) || pushResult.updatedRows || 1

        return NextResponse.json({
          success: true,
          result: {
            ...pushResult,
            updatedRows: updatedCount,
          },
        })
      } catch (pushErr: any) {
        console.error('Error al hacer push a Google Sheets:', pushErr)
        return NextResponse.json({
          success: false,
          error: `Error al conectar con Google Sheets: ${pushErr.message}`,
        }, { status: 502 })
      }
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })

  } catch (err: any) {
    console.error('Error en drive-sync POST:', err)
    return NextResponse.json({ error: err.message || 'Error en sincronización' }, { status: 500 })
  }
}

// Diccionario de referencia en memoria para evitar re-leer el archivo físico en cada sincronización
let cachedCedulaToRealName: Map<string, string> | null = null
let cachedWorkbookMtime: number = 0

function getCedulaToRealNameMap(): Map<string, string> {
  const localPath = getLocalWorkbookPath()
  if (!localPath) return new Map()
  try {
    const stat = fs.statSync(localPath)
    if (cachedCedulaToRealName && cachedWorkbookMtime === stat.mtimeMs) {
      return cachedCedulaToRealName
    }
    const buf = fs.readFileSync(localPath)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const p = parseWholesaleWorkbook(wb)
    const map = new Map<string, string>()
    p.clients.forEach(c => {
      if (c.cedula && isValidClientName(c.cliente)) {
        map.set(c.cedula.toLowerCase().trim(), c.cliente)
      }
    })
    cachedCedulaToRealName = map
    cachedWorkbookMtime = stat.mtimeMs
    return map
  } catch {
    return cachedCedulaToRealName || new Map()
  }
}

interface SyncOperation {
  type: 'patch' | 'create'
  id?: string
  data: any
  clientDesc: string
}

// Función unificada y ultrarrápida para actualizar o crear clientes en Sanity usando transacciones por lotes
async function syncClientsToSanity(clientsList: any[], spreadsheetName: string, sheets: any[]) {
  const t0 = performance.now()

  if (!clientsList || clientsList.length === 0) {
    return {
      success: true,
      message: 'No se encontraron filas con clientes en las hojas leídas.',
      created: 0,
      updated: 0,
      total: 0,
      durationMs: Math.round(performance.now() - t0),
    }
  }

  // Diccionario de referencia cédula -> nombre real obtenido desde caché
  const cedulaToRealName = getCedulaToRealNameMap()

  // Obtener todos los usuarios mayoristas existentes en Sanity (sin CDN para datos en tiempo real)
  const existingUsers: any[] = await client.withConfig({ useCdn: false }).fetch(
    `*[_type == "user" && role == "mayorista" && !(_id in path("drafts.**"))]{ _id, name, email, wholesaleData }`
  )

  let createdCount = 0
  let updatedCount = 0
  const errors: string[] = []
  const operations: SyncOperation[] = []

  for (const dc of clientsList) {
    try {
      let clientName = String(dc.cliente || dc.name || '').trim()
      const clientCedula = String(dc.cedula || '').replace(/\.0$/, '').replace(/\s+/g, '')

      // Si clientName no es un nombre real (es número de fila, N° o texto de instrucción):
      if (!isValidClientName(clientName)) {
        if (clientCedula && cedulaToRealName.has(clientCedula.toLowerCase())) {
          clientName = cedulaToRealName.get(clientCedula.toLowerCase())!
        } else if (isValidClientName(dc.name)) {
          clientName = String(dc.name).trim()
        } else if (clientCedula) {
          const known = existingUsers.find((eu: any) => eu.wholesaleData?.cedula === clientCedula && isValidClientName(eu.name))
          if (known) clientName = known.name
        }
      }

      // Si no es un nombre real válido, RECHAZARLO TOTALMENTE (nunca guardar "21", "2", instrucciones)
      if (!isValidClientName(clientName)) {
        continue
      }

      const clientEmail = dc.email || (clientCedula ? `mayorista_${clientCedula}@telasreal.com` : `mayorista_${Date.now()}_${Math.random().toString(36).substring(7)}@telasreal.com`)

      // Buscar coincidencia por cédula, email o nombre
      const match = existingUsers.find((eu: any) => {
        if (clientCedula && eu.wholesaleData?.cedula === clientCedula) return true
        if (clientEmail && eu.email?.toLowerCase() === clientEmail.toLowerCase()) return true
        if (clientName && eu.name?.toLowerCase() === clientName.toLowerCase()) return true
        return false
      })

      const wholesalePayload = {
        cliente: clientName,
        encargado: dc.encargado || 'E-COMMERCE',
        cedula: clientCedula,
        direccion: dc.direccion || '',
        ciudad: dc.ciudad || '',
        telefono: dc.telefono || '',
        facturacion: String(dc.facturacion || '1'),
        acuerdo_mt: dc.acuerdo_mt || '$12.000',
        acuerdo_kg: dc.acuerdo_kg || '$39.600',
        volumen_mes_kg: Number(dc.volumen_mes_kg) || 0,
        volumen_mes_mt: Number(dc.volumen_mes_mt) || 0,
        volumen_compra_kg: Number(dc.volumen_compra_kg) || 0,
        acuerdo_kg_mes: dc.acuerdo_kg_mes || '',
        tiempos: dc.tiempos || 'Acumulados del mes y pagando antes del 30 de cada mes',
        brush_kg_cumplido: Number(dc.brush_kg_cumplido) || 0,
        brush_mt_cumplido: Number(dc.brush_mt_cumplido) || 0,
        cuanto_falto_kg: Math.abs(Number(dc.cuanto_falto_kg) || 0) || (Number(dc.volumen_mes_kg) > Number(dc.brush_kg_cumplido) ? Math.round((Number(dc.volumen_mes_kg) - Number(dc.brush_kg_cumplido)) * 10) / 10 : 0),
        cuanto_falto_mt: Math.abs(Number(dc.cuanto_falto_mt) || 0) || (Number(dc.volumen_mes_mt) > Number(dc.brush_mt_cumplido) ? Math.round((Number(dc.volumen_mes_mt) - Number(dc.brush_mt_cumplido)) * 10) / 10 : 0),
        cuanto_falto_dinero: dc.cuanto_falto_dinero || '',
        mensaje_personalizado: dc.mensaje_personalizado || '',
        source_sheet: dc.source_sheet || dc.grupo_sheet || '',
        grupo_sheet: dc.grupo_sheet || '',
        historial_es_grupal: Boolean(dc.historial_es_grupal),
        conflictos: dc.conflictos || [],
        alias_nombres: dc.alias_nombres || [],
        contactos_relacionados: dc.contactos_relacionados || [],
        historial_meses: (dc.historial_meses || []).map((h: any) => ({
          _key: Math.random().toString(36).substring(7),
          mes: h.mes,
          mes_numero: h.mes_numero || 0,
          anio: h.anio || 0,
          periodo: h.periodo || '',
          kg: Number(h.kg) || 0,
          mt: Number(h.mt) || 0,
          cuanto_va_dinero: h.cuanto_va_dinero || '$0',
          falta_kg: Math.abs(Number(h.falta_kg) || 0),
          falta_mt: Math.abs(Number(h.falta_mt) || 0),
          falta_dinero: h.falta_dinero || '$0',
          cumplimiento: h.cumplimiento || '',
          nota: h.nota || '',
        })),
      }

      if (match) {
        operations.push({
          type: 'patch',
          id: match._id,
          data: {
            name: clientName,
            email: clientEmail,
            role: 'mayorista',
            wholesaleData: {
              ...match.wholesaleData,
              ...wholesalePayload,
              historial_meses: wholesalePayload.historial_meses.length > 0 
                ? wholesalePayload.historial_meses 
                : (match.wholesaleData?.historial_meses || [])
            }
          },
          clientDesc: clientName || clientCedula
        })
      } else {
        operations.push({
          type: 'create',
          data: {
            _type: 'user',
            name: clientName,
            email: clientEmail,
            role: 'mayorista',
            forcePasswordChange: true,
            wholesaleData: wholesalePayload,
          },
          clientDesc: clientName || clientCedula
        })
      }
    } catch (itemErr: any) {
      errors.push(`Error preparando cliente ${dc.cliente || dc.cedula}: ${itemErr.message}`)
    }
  }

  // Ejecutar operaciones en lotes de hasta 50 clientes por transacción
  const BATCH_SIZE = 50
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = operations.slice(i, i + BATCH_SIZE)
    const tx = client.transaction()

    for (const op of batch) {
      if (op.type === 'patch' && op.id) {
        tx.patch(op.id, p => p.set(op.data))
      } else if (op.type === 'create') {
        tx.create(op.data)
      }
    }

    try {
      await tx.commit()
      batch.forEach(op => {
        if (op.type === 'patch') updatedCount++
        else createdCount++
      })
    } catch (batchErr: any) {
      console.warn('Lote de Sanity falló, reintentando individualmente:', batchErr.message)
      // Fallback seguro: procesar individualmente para salvar los válidos
      for (const op of batch) {
        try {
          if (op.type === 'patch' && op.id) {
            await client.patch(op.id).set(op.data).commit()
            updatedCount++
          } else if (op.type === 'create') {
            await client.create(op.data)
            createdCount++
          }
        } catch (singleErr: any) {
          errors.push(`Error en cliente ${op.clientDesc}: ${singleErr.message}`)
        }
      }
    }
  }

  const durationMs = Math.round(performance.now() - t0)

  // Actualizar registro de última sincronización en Sanity
  const statsSummary = `Sincronizados: ${createdCount + updatedCount} (${createdCount} creados, ${updatedCount} actualizados) en ${durationMs}ms`
  try {
    await client.patch(DRIVE_SETTINGS_ID).set({
      lastSyncAt: new Date().toISOString(),
      lastSyncStats: statsSummary,
      spreadsheetName: spreadsheetName,
      detectedSheets: (sheets || []).map((s: any) => `${s.name} (${s.totalRows} filas)`),
    }).commit()
  } catch (e) {
    console.warn('No se pudo actualizar wholesaleDriveSettings:', e)
  }

  return {
    success: true,
    spreadsheetName: spreadsheetName,
    sheets: sheets,
    total: createdCount + updatedCount,
    created: createdCount,
    updated: updatedCount,
    durationMs,
    errors,
  }
}

