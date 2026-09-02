import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { parseWholesaleWorkbook, ParsedWholesaleClient } from '@/lib/wholesaleExcelParser'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

// Clave del documento de configuración de Drive en Sanity
const DRIVE_SETTINGS_ID = 'wholesaleDriveSettings'

// Función auxiliar para obtener la URL configurada
async function getStoredWebhookUrl(): Promise<string | null> {
  try {
    const doc = await client.fetch(`*[_id == $id][0].webhookUrl`, { id: DRIVE_SETTINGS_ID })
    return doc || null
  } catch {
    return null
  }
}

// GET: Probar conexión y escanear pestañas del Google Sheet (o archivo local)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let webhookUrl = searchParams.get('url')
    const source = searchParams.get('source')

    // Si pide escanear el archivo local mayoristas.xlsx
    if (source === 'local') {
      const localPath = path.join(process.cwd(), 'mayoristas.xlsx')
      if (!fs.existsSync(localPath)) {
        return NextResponse.json({
          connected: false,
          error: 'No se encontró el archivo local mayoristas.xlsx en el proyecto.',
        }, { status: 404 })
      }

      const fileBuffer = fs.readFileSync(localPath)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const parsed = parseWholesaleWorkbook(workbook)

      return NextResponse.json({
        connected: true,
        source: 'local',
        spreadsheetName: 'mayoristas.xlsx (Archivo Local)',
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

    // Llamar al Google Apps Script (GET)
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        error: `Error al conectar con Google Sheets (HTTP ${response.status})`,
      }, { status: 502 })
    }

    const driveData = await response.json()

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

// POST: Sincronizar en Vivo (PULL desde Drive, IMPORT local o PUSH hacia Drive)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action = 'pull', webhookUrl: paramUrl, clientData } = body

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

    // Acción IMPORT LOCAL: Carga clientes desde el archivo mayoristas.xlsx en la raíz del proyecto
    if (action === 'import_local') {
      const localPath = path.join(process.cwd(), 'mayoristas.xlsx')
      if (!fs.existsSync(localPath)) {
        return NextResponse.json({
          error: 'No se encontró el archivo mayoristas.xlsx en la raíz del proyecto.',
        }, { status: 404 })
      }

      const fileBuffer = fs.readFileSync(localPath)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const parsed = parseWholesaleWorkbook(workbook)

      const syncResult = await syncClientsToSanity(parsed.clients, 'mayoristas.xlsx (Archivo Local)', parsed.sheets)
      return NextResponse.json(syncResult)
    }

    if (!webhookUrl) {
      return NextResponse.json({
        error: 'Debes configurar primero la URL de Google Apps Script en Sanity.',
      }, { status: 400 })
    }

    // Acción PULL: Traer datos de Drive y actualizar Sanity
    if (action === 'pull') {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Google Sheets devolvió status ${response.status}`)
      }

      const driveData = await response.json()

      if (driveData.status === 'error') {
        throw new Error(driveData.message || 'Error en el script de Google Sheets')
      }

      const driveClients = driveData.clients || []
      const syncResult = await syncClientsToSanity(driveClients, driveData.spreadsheetName, driveData.sheets)
      return NextResponse.json(syncResult)
    }

    // Acción PUSH: Enviar cambios de Sanity a Google Sheets
    if (action === 'push') {
      if (!clientData) {
        return NextResponse.json({ error: 'Datos de cliente requeridos para push' }, { status: 400 })
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_client',
          client: clientData,
        }),
      })

      const pushResult = await response.json()
      return NextResponse.json({
        success: true,
        result: pushResult,
      })
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })

  } catch (err: any) {
    console.error('Error en drive-sync POST:', err)
    return NextResponse.json({ error: err.message || 'Error en sincronización' }, { status: 500 })
  }
}

// Función unificada para actualizar o crear clientes en Sanity
async function syncClientsToSanity(clientsList: any[], spreadsheetName: string, sheets: any[]) {
  if (!clientsList || clientsList.length === 0) {
    return {
      success: true,
      message: 'No se encontraron filas con clientes en las hojas leídas.',
      created: 0,
      updated: 0,
      total: 0,
    }
  }

  // Obtener todos los usuarios mayoristas existentes en Sanity
  const existingUsers: any[] = await client.fetch(
    `*[_type == "user" && role == "mayorista"]{ _id, name, email, wholesaleData }`
  )

  let createdCount = 0
  let updatedCount = 0
  const errors: string[] = []

  for (const dc of clientsList) {
    try {
      const clientName = dc.cliente || dc.name || 'Cliente Mayorista'
      const clientCedula = String(dc.cedula || '').trim()
      const clientEmail = dc.email || (clientCedula ? `mayorista_${clientCedula}@telasreal.com` : `mayorista_${Date.now()}@telasreal.com`)

      // Buscar coincidencia por email, cédula o nombre
      const match = existingUsers.find((eu: any) => {
        if (clientEmail && eu.email?.toLowerCase() === clientEmail.toLowerCase()) return true
        if (clientCedula && eu.wholesaleData?.cedula === clientCedula) return true
        if (clientName && eu.name?.toLowerCase() === clientName.toLowerCase()) return true
        return false
      })

      const wholesalePayload = {
        cliente: clientName,
        encargado: dc.encargado || 'E-COMMERCE',
        cedula: clientCedula,
        direccion: dc.direccion || '',
        telefono: dc.telefono || '',
        facturacion: String(dc.facturacion || '1'),
        acuerdo_mt: dc.acuerdo_mt || '$12,000',
        acuerdo_kg: dc.acuerdo_kg || '$39,600',
        volumen_mes_kg: Number(dc.volumen_mes_kg) || 0,
        volumen_mes_mt: Number(dc.volumen_mes_mt) || 0,
        volumen_compra_kg: Number(dc.volumen_compra_kg) || 0,
        acuerdo_kg_mes: dc.acuerdo_kg_mes || '',
        tiempos: dc.tiempos || 'Acumulados del mes y pagando antes del 30 de cada mes',
        brush_kg_cumplido: Number(dc.brush_kg_cumplido) || 0,
        brush_mt_cumplido: Number(dc.brush_mt_cumplido) || 0,
        cuanto_falto_kg: Number(dc.cuanto_falto_kg) || 0,
        cuanto_falto_mt: Number(dc.cuanto_falto_mt) || 0,
        cuanto_falto_dinero: dc.cuanto_falto_dinero || '',
        mensaje_personalizado: dc.mensaje_personalizado || '',
        historial_meses: (dc.historial_meses || []).map((h: any) => ({
          _key: Math.random().toString(36).substring(7),
          mes: h.mes,
          kg: Number(h.kg) || 0,
          mt: Number(h.mt) || 0,
          cuanto_va_dinero: h.cuanto_va_dinero || '$0',
          falta_kg: Number(h.falta_kg) || 0,
          falta_mt: Number(h.falta_mt) || 0,
          falta_dinero: h.falta_dinero || '$0',
        })),
      }

      if (match) {
        // Actualizar usuario existente en Sanity
        await client.patch(match._id).set({
          name: clientName,
          wholesaleData: {
            ...match.wholesaleData,
            ...wholesalePayload,
            historial_meses: wholesalePayload.historial_meses.length > 0 
              ? wholesalePayload.historial_meses 
              : (match.wholesaleData?.historial_meses || [])
          }
        }).commit()
        updatedCount++
      } else {
        // Crear nuevo usuario mayorista en Sanity
        await client.create({
          _type: 'user',
          name: clientName,
          email: clientEmail,
          role: 'mayorista',
          forcePasswordChange: true,
          wholesaleData: wholesalePayload,
        })
        createdCount++
      }
    } catch (itemErr: any) {
      errors.push(`Error en cliente ${dc.cliente || dc.cedula}: ${itemErr.message}`)
    }
  }

  // Actualizar registro de última sincronización
  const statsSummary = `Sincronizados: ${clientsList.length} (${createdCount} creados, ${updatedCount} actualizados)`
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
    total: clientsList.length,
    created: createdCount,
    updated: updatedCount,
    errors,
  }
}
