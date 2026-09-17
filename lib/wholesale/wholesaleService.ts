import { client } from '@/sanity/lib/client'
import {
  calculateFabricProgress,
  getMonthNumber,
  getCurrentMonthName,
  getCurrentYear,
  FabricProgressResult,
  MonthlyProgressRecord
} from './fabricCalculator'

const DRIVE_SETTINGS_ID = 'wholesaleDriveSettings'
const DEFAULT_SYNC_KEY = process.env.DRIVE_SYNC_KEY || 'telasreal_secure_sync_2026_key'

export interface FabricSettingsData {
  rendimientoKgMetro: number
  precioKgDefault: number
  precioMtDefault: number
}

let cachedSettings: FabricSettingsData | null = null
let cachedSettingsExpiry = 0

let cachedWebhookUrl: string | null = null
let cachedWebhookUrlExpiry = 0

const KNOWN_SHEETS = [
  'NOVOA',
  'ALEXIS VARGAS',
  'MARIO TOVAR',
  'MAIRA CIFUENTES',
  'LORENA CAVIEDEZ',
  'EDUARDO PARRA',
  'LUZ ORJUELA',
  'LUZ GARCIA',
  'EDWIN CASALLAS',
  'KOCO CREACIONES',
  'DANIELA MATEUS',
  'DIANA RUBIO'
]

/**
 * Resuelve el nombre exacto de la pestaña de Google Sheets para evitar escaneos costosos
 */
export function resolveTargetSheet(clientName: string = '', explicitSheetName?: string): string {
  if (explicitSheetName && explicitSheetName.trim()) {
    return explicitSheetName.trim()
  }
  const normalized = String(clientName || '').toUpperCase().trim()
  for (const sheet of KNOWN_SHEETS) {
    if (normalized.includes(sheet) || sheet.includes(normalized)) {
      return sheet
    }
  }
  if (normalized.includes('NOVOA')) return 'NOVOA'
  if (normalized.includes('ALEXIS')) return 'ALEXIS VARGAS'
  if (normalized.includes('TOVAR')) return 'MARIO TOVAR'
  if (normalized.includes('CIFUENTES') || normalized.includes('MAIRA')) return 'MAIRA CIFUENTES'
  if (normalized.includes('CAVIEDEZ') || normalized.includes('LORENA')) return 'LORENA CAVIEDEZ'
  if (normalized.includes('PARRA') || normalized.includes('EDUARDO')) return 'EDUARDO PARRA'
  if (normalized.includes('ORJUELA')) return 'LUZ ORJUELA'
  if (normalized.includes('GARCIA') && normalized.includes('LUZ')) return 'LUZ GARCIA'
  if (normalized.includes('CASALLAS') || normalized.includes('EDWIN')) return 'EDWIN CASALLAS'
  if (normalized.includes('KOCO')) return 'KOCO CREACIONES'
  if (normalized.includes('MATEUS') || normalized.includes('DANIELA')) return 'DANIELA MATEUS'
  if (normalized.includes('RUBIO') || normalized.includes('DIANA')) return 'DIANA RUBIO'

  return clientName
}

export interface UpdateProgressInput {
  clienteId: string
  mes: string
  anio?: number
  kgCumplido: number
  usuario?: string
  origen?: 'sanity' | 'google_sheets' | 'api' | 'sistema'
  nota?: string
  skipPushToDrive?: boolean
  awaitDrivePush?: boolean // false por defecto para respuesta instantánea al usuario
}

/**
 * Obtiene la configuración global textil con caché en memoria (5 minutos).
 */
export async function getFabricSettings(): Promise<FabricSettingsData> {
  const now = Date.now()
  if (cachedSettings && now < cachedSettingsExpiry) {
    return cachedSettings
  }
  try {
    const doc = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "fabricSettings" && _id == "fabricSettings"][0]{
        rendimientoKgMetro,
        precioKgDefault,
        precioMtDefault
      }`
    )
    cachedSettings = {
      rendimientoKgMetro: Number(doc?.rendimientoKgMetro) > 0 ? Number(doc.rendimientoKgMetro) : 3.3,
      precioKgDefault: Number(doc?.precioKgDefault) || 37950,
      precioMtDefault: Number(doc?.precioMtDefault) || 11500,
    }
    cachedSettingsExpiry = now + 5 * 60 * 1000
    return cachedSettings
  } catch (err) {
    console.warn('[WholesaleService] Error al consultar fabricSettings, usando valores por defecto:', err)
    return {
      rendimientoKgMetro: 3.3,
      precioKgDefault: 37950,
      precioMtDefault: 11500,
    }
  }
}

/**
 * Obtiene la URL del Google Apps Script configurada en Sanity con caché (5 minutos).
 */
export async function getStoredWebhookUrl(): Promise<string | null> {
  const now = Date.now()
  if (cachedWebhookUrl && now < cachedWebhookUrlExpiry) {
    return cachedWebhookUrl
  }
  try {
    const doc = await client.withConfig({ useCdn: false }).fetch(
      `*[_id == $id][0].webhookUrl`,
      { id: DRIVE_SETTINGS_ID }
    )
    if (doc) {
      cachedWebhookUrl = doc
      cachedWebhookUrlExpiry = now + 5 * 60 * 1000
    }
    return doc || null
  } catch {
    return null
  }
}

async function fetchRawClient(clienteId: string) {
  let raw = await client.withConfig({ useCdn: false }).fetch(
    `*[_type == "clienteMayorista" && (_id == $id || _id == "drafts." + $id || codigoCliente == $id || nombre match $id)][0]`,
    { id: clienteId }
  )
  if (!raw) {
    const legacyUser = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "user" && (_id == $id || email == $id)][0]`
    )
    if (legacyUser) {
      const clientName = legacyUser.name || legacyUser.wholesaleData?.cliente
      if (clientName) {
        raw = await client.withConfig({ useCdn: false }).fetch(
          `*[_type == "clienteMayorista" && (nombre match $name || nit == $nit)][0]`,
          { name: clientName, nit: legacyUser.wholesaleData?.cedula || '' }
        )
      }
    }
  }
  return raw
}

/**
 * Actualiza el progreso de un cliente mayorista para un mes determinado.
 * Ejecuta calculateFabricProgress() en el backend, persiste en Sanity de inmediato
 * y sincroniza de forma optimizada y asíncrona hacia Google Sheets.
 */
export async function updateClientProgress(input: UpdateProgressInput) {
  const {
    clienteId,
    mes,
    anio = getCurrentYear(),
    kgCumplido,
    usuario = 'admin',
    origen = 'sanity',
    nota = '',
    skipPushToDrive = false,
    awaitDrivePush = false
  } = input

  const normalizedMes = String(mes || getCurrentMonthName()).trim().toUpperCase()
  const mesNumero = getMonthNumber(normalizedMes)
  const safeKg = Math.max(0, Number(kgCumplido) || 0)

  // 1. Obtener cliente y settings en paralelo
  const [rawClient, settings] = await Promise.all([
    fetchRawClient(clienteId),
    getFabricSettings()
  ])

  if (!rawClient) {
    throw new Error(`Cliente mayorista no encontrado para identificador: ${clienteId}`)
  }

  const objetivoKg = Number(rawClient.objetivoMensual?.kg) || 0
  const precioKg = Number(rawClient.acuerdoPrecio?.precioKg) || settings.precioKgDefault

  // 2. Ejecutar cálculo centralizado y puro (0ms)
  const calculations: FabricProgressResult = calculateFabricProgress({
    objetivoKg,
    kgCumplido: safeKg,
    rendimiento: settings.rendimientoKgMetro,
    precioKg
  })

  // 3. Localizar mes existente o crear uno nuevo
  const existingMeses: MonthlyProgressRecord[] = Array.isArray(rawClient.meses) ? rawClient.meses : []
  const existingIndex = existingMeses.findIndex(
    m => String(m.mes || '').toUpperCase() === normalizedMes && Number(m.anio || getCurrentYear()) === anio
  )

  const valorAnterior = existingIndex >= 0 ? Number(existingMeses[existingIndex].kgCumplido) || 0 : 0
  const valorNuevo = safeKg

  const updatedRecord: MonthlyProgressRecord = {
    _key: existingIndex >= 0 && existingMeses[existingIndex]._key ? existingMeses[existingIndex]._key : Math.random().toString(36).substring(7),
    mes: normalizedMes,
    mesNumero,
    anio,
    kgCumplido: calculations.kgCumplido,
    mtCumplido: calculations.mtCumplido,
    faltanteKg: calculations.faltanteKg,
    faltanteMt: calculations.faltanteMt,
    dinero: calculations.dinero,
    faltanteDinero: calculations.faltanteDinero,
    porcentaje: calculations.porcentaje,
    cumplimiento: calculations.cumplimiento,
    updatedAt: new Date().toISOString(),
    updatedBy: usuario,
    nota: nota || (existingIndex >= 0 ? existingMeses[existingIndex].nota : '') || ''
  }

  let updatedMeses: MonthlyProgressRecord[]
  if (existingIndex >= 0) {
    updatedMeses = [...existingMeses]
    updatedMeses[existingIndex] = updatedRecord
  } else {
    updatedMeses = [...existingMeses, updatedRecord]
  }

  updatedMeses.sort((a, b) => {
    if (a.anio !== b.anio) return a.anio - b.anio
    return a.mesNumero - b.mesNumero
  })

  // 4. Registro de auditoría
  const historyRecord = {
    _type: 'syncHistory',
    fecha: new Date().toISOString(),
    cliente: {
      _type: 'reference',
      _ref: rawClient._id.replace(/^drafts\./, '')
    },
    mes: normalizedMes,
    anio,
    origen,
    valorAnterior,
    valorNuevo,
    calculos: {
      mtCumplido: calculations.mtCumplido,
      faltanteKg: calculations.faltanteKg,
      faltanteMt: calculations.faltanteMt,
      faltanteDinero: calculations.faltanteDinero,
      porcentaje: calculations.porcentaje,
      cumplimiento: calculations.cumplimiento,
    },
    usuario,
    estado: 'exitoso'
  }

  // 5. Actualizar Sanity y auditoría en paralelo
  const patchPayload = {
    meses: updatedMeses,
    ultimoMesActualizado: `${normalizedMes} ${anio}`,
    updatedAt: new Date().toISOString()
  }
  const realId = rawClient._id.replace(/^drafts\./, '')

  await Promise.all([
    client.patch(realId).set(patchPayload).commit(),
    client.create(historyRecord).catch(err => {
      console.warn('[WholesaleService] Warning al guardar syncHistory:', err)
    })
  ])

  // 6. Propagar a Google Sheets de manera ultra-rápida (en segundo plano si awaitDrivePush es false)
  let pushResult: any = { queued: true }
  if (!skipPushToDrive) {
    const drivePromise = syncGoogleSheet({
      cliente: rawClient,
      monthRecord: updatedRecord,
      calculations
    }).catch(driveErr => {
      console.error('[WholesaleService] Error en propagación asíncrona a Google Sheets:', driveErr)
      return { success: false, error: driveErr.message }
    })

    if (awaitDrivePush) {
      pushResult = await drivePromise
    } else {
      // El proceso continúa en segundo plano sin retrasar la respuesta al usuario
      pushResult = { success: true, background: true }
    }
  }

  return {
    success: true,
    clienteId: realId,
    clienteNombre: rawClient.nombre,
    calculations,
    monthRecord: updatedRecord,
    pushResult
  }
}

/**
 * Propaga un cambio de Sanity hacia Google Sheets usando Google Apps Script.
 * Usa acción optimizada "update_month" y hoja de destino directa para ejecución inmediata.
 */
export async function syncGoogleSheet({
  cliente,
  monthRecord,
  calculations
}: {
  cliente: any
  monthRecord: MonthlyProgressRecord
  calculations: FabricProgressResult
}) {
  const webhookUrl = await getStoredWebhookUrl()
  if (!webhookUrl) {
    return {
      success: false,
      skipped: true,
      message: 'No hay webhookUrl de Google Apps Script configurada en Sanity.'
    }
  }

  const syncKey = process.env.DRIVE_SYNC_KEY || DEFAULT_SYNC_KEY
  const realSanityId = String(cliente._id || '').replace(/^drafts\./, '')
  const targetSheet = resolveTargetSheet(cliente.nombre, cliente.sheetName)

  const payload = {
    apiKey: syncKey,
    key: syncKey,
    action: 'update_month', // Actualización quirúrgica del mes (evita escanear todas las 16 pestañas)
    metadata: {
      ID_CLIENTE: cliente.codigoCliente || realSanityId,
      ID_SANITY: realSanityId,
      UPDATED_AT: new Date().toISOString(),
      MES_NUMERO: monthRecord.mesNumero,
    },
    client: {
      cliente: cliente.nombre,
      name: cliente.nombre,
      source_sheet: targetSheet,
      grupo_sheet: targetSheet,
      sheet: targetSheet,
      ID_CLIENTE: cliente.codigoCliente || realSanityId,
      ID_SANITY: realSanityId,
      cedula: cliente.nit || cliente.cedula || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      volumen_mes_kg: cliente.objetivoMensual?.kg || 0,
      volumen_mes_mt: cliente.objetivoMensual?.mt || 0,
      acuerdo_kg_valor: cliente.acuerdoPrecio?.precioKg || 37950,
      acuerdo_mt_valor: cliente.acuerdoPrecio?.precioMt || 11500,
    },
    monthData: {
      mes: monthRecord.mes,
      mes_numero: monthRecord.mesNumero,
      anio: monthRecord.anio,
      kg: calculations.kgCumplido,
      mt: calculations.mtCumplido,
      dinero: calculations.dinero,
      cuanto_falto_kg: calculations.faltanteKg,
      cuanto_falto_mt: calculations.faltanteMt,
      falta_dinero: calculations.faltanteDinero,
      cumplimiento: calculations.cumplimiento,
      updated_at: monthRecord.updatedAt || new Date().toISOString(),
      id_sanity: realSanityId,
      id_cliente: cliente.codigoCliente || realSanityId,
    }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`Google Apps Script devolvió código HTTP ${response.status}`)
  }

  const textRes = await response.text()
  let parsedRes: any
  try {
    parsedRes = JSON.parse(textRes)
  } catch {
    parsedRes = { status: 'sent', raw: textRes.slice(0, 100) }
  }

  return {
    success: true,
    result: parsedRes
  }
}
