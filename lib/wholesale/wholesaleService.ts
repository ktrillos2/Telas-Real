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

export interface UpdateProgressInput {
  clienteId: string
  mes: string
  anio?: number
  kgCumplido: number
  usuario?: string
  origen?: 'sanity' | 'google_sheets' | 'api' | 'sistema'
  nota?: string
  skipPushToDrive?: boolean
}

/**
 * Obtiene la configuración global textil (Singleton fabricSettings).
 * Fuente única de rendimiento (ej: 3.3 mt/kg).
 */
export async function getFabricSettings(): Promise<FabricSettingsData> {
  try {
    const doc = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "fabricSettings" && _id == "fabricSettings"][0]{
        rendimientoKgMetro,
        precioKgDefault,
        precioMtDefault
      }`
    )
    return {
      rendimientoKgMetro: Number(doc?.rendimientoKgMetro) > 0 ? Number(doc.rendimientoKgMetro) : 3.3,
      precioKgDefault: Number(doc?.precioKgDefault) || 37950,
      precioMtDefault: Number(doc?.precioMtDefault) || 11500,
    }
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
 * Obtiene la URL del Google Apps Script configurada en Sanity.
 */
export async function getStoredWebhookUrl(): Promise<string | null> {
  try {
    const doc = await client.withConfig({ useCdn: false }).fetch(
      `*[_id == $id][0].webhookUrl`,
      { id: DRIVE_SETTINGS_ID }
    )
    return doc || null
  } catch {
    return null
  }
}

/**
 * Actualiza el progreso de un cliente mayorista para un mes determinado.
 * Ejecuta calculateFabricProgress() en el backend, registra auditoría en syncHistory,
 * persiste en Sanity y propaga a Google Sheets.
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
    skipPushToDrive = false
  } = input

  const normalizedMes = String(mes || getCurrentMonthName()).trim().toUpperCase()
  const mesNumero = getMonthNumber(normalizedMes)
  const safeKg = Math.max(0, Number(kgCumplido) || 0)

  // 1. Obtener cliente de Sanity
  const rawClient = await client.withConfig({ useCdn: false }).fetch(
    `*[_type == "clienteMayorista" && (_id == $id || _id == "drafts." + $id || codigoCliente == $id || nombre match $id)][0]`,
    { id: clienteId }
  )

  if (!rawClient) {
    throw new Error(`Cliente mayorista no encontrado para identificador: ${clienteId}`)
  }

  // 2. Obtener configuración de rendimiento y precio
  const settings = await getFabricSettings()
  const objetivoKg = Number(rawClient.objetivoMensual?.kg) || 0
  const precioKg = Number(rawClient.acuerdoPrecio?.precioKg) || settings.precioKgDefault

  // 3. Ejecutar cálculo centralizado y puro
  const calculations: FabricProgressResult = calculateFabricProgress({
    objetivoKg,
    kgCumplido: safeKg,
    rendimiento: settings.rendimientoKgMetro,
    precioKg
  })

  // 4. Localizar mes existente o crear uno nuevo
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

  // Ordenar meses cronológicamente (año ascendente, número de mes ascendente)
  updatedMeses.sort((a, b) => {
    if (a.anio !== b.anio) return a.anio - b.anio
    return a.mesNumero - b.mesNumero
  })

  // 5. Crear registro de auditoría en syncHistory
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

  try {
    await client.create(historyRecord)
  } catch (historyErr) {
    console.warn('[WholesaleService] Error al guardar syncHistory:', historyErr)
  }

  // 6. Actualizar cliente en Sanity
  const patchPayload = {
    meses: updatedMeses,
    ultimoMesActualizado: `${normalizedMes} ${anio}`,
    updatedAt: new Date().toISOString()
  }

  const realId = rawClient._id.replace(/^drafts\./, '')
  await client.patch(realId).set(patchPayload).commit()

  // 7. Enviar actualización a Google Sheets si no se omite
  let pushResult: any = null
  if (!skipPushToDrive) {
    try {
      pushResult = await syncGoogleSheet({
        cliente: rawClient,
        monthRecord: updatedRecord,
        calculations
      })
    } catch (driveErr: any) {
      console.error('[WholesaleService] Error al propagar a Google Sheets:', driveErr)
      pushResult = { success: false, error: driveErr.message }
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
 * Incluye metadatos internos: ID_CLIENTE, ID_SANITY, UPDATED_AT, MES_NUMERO.
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

  const payload = {
    apiKey: syncKey,
    key: syncKey,
    action: 'update_client',
    metadata: {
      ID_CLIENTE: cliente.codigoCliente || realSanityId,
      ID_SANITY: realSanityId,
      UPDATED_AT: new Date().toISOString(),
      MES_NUMERO: monthRecord.mesNumero,
    },
    client: {
      cliente: cliente.nombre,
      name: cliente.nombre,
      ID_CLIENTE: cliente.codigoCliente || realSanityId,
      ID_SANITY: realSanityId,
      cedula: cliente.nit || cliente.cedula || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      volumen_mes_kg: cliente.objetivoMensual?.kg || 0,
      volumen_mes_mt: cliente.objetivoMensual?.mt || 0,
      source_sheet: cliente.nombre,
      grupo_sheet: cliente.nombre,
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
