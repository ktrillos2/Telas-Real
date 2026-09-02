import * as XLSX from 'xlsx'

export interface ParsedWholesaleMonth {
  mes: string
  kg: number
  mt: number
  cuanto_va_dinero: string
  falta_kg: number
  falta_mt: number
  falta_dinero: string
}

export interface ParsedWholesaleClient {
  cliente: string
  name: string
  email: string
  cedula: string
  encargado: string
  telefono: string
  direccion: string
  facturacion: string
  acuerdo_mt: string
  acuerdo_kg: string
  volumen_mes_kg: number
  volumen_mes_mt: number
  volumen_compra_kg: number
  acuerdo_kg_mes: string
  tiempos: string
  brush_kg_cumplido: number
  brush_mt_cumplido: number
  cuanto_falto_kg: number
  cuanto_falto_mt: number
  cuanto_falto_dinero: string
  mensaje_personalizado: string
  historial_meses: ParsedWholesaleMonth[]
}

const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

export function parseWholesaleWorkbook(workbook: XLSX.WorkBook): {
  spreadsheetName?: string
  sheets: { name: string; totalRows: number }[]
  clients: ParsedWholesaleClient[]
} {
  const clientMap = new Map<string, ParsedWholesaleClient>()
  const sheetMetadata: { name: string; totalRows: number }[] = []

  for (const sheetName of workbook.SheetNames) {
    const upperName = sheetName.trim().toUpperCase()
    if (upperName.startsWith('_') || upperName === 'FILTRO') continue

    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) continue

    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    if (rows.length < 2) continue

    sheetMetadata.push({
      name: sheetName,
      totalRows: rows.length,
    })

    // CASO 1: HOJA MAESTRA XIOMARA MAYORISTAS
    if (upperName.includes('XIOMARA')) {
      parseXiomaraRows(rows, clientMap)
    }
    // CASO 2: HOJAS DE DIRECTORIO CLIENTES BRUSH / POTENCIALES
    else if (upperName.includes('CLIENTES BRUSH') || upperName.includes('POTENCIALES')) {
      parseDirectoryRows(rows, clientMap)
    }
    // CASO 3: HOJAS INDIVIDUALES DE CLIENTES (MARIO TOVAR, MAIRA, NOVOA, ETC.)
    else if (rows.length >= 2) {
      parseIndividualClientRows(rows, sheetName, clientMap)
    }
  }

  return {
    sheets: sheetMetadata,
    clients: Array.from(clientMap.values()),
  }
}

function parseXiomaraRows(rows: any[][], clientMap: Map<string, ParsedWholesaleClient>) {
  const headers = (rows[0] || []).map((h) => normalize(String(h)))

  const idxC = findIndex(headers, ['cliente', 'razon', 'empresa', 'nombre'], 1)
  const idxCed = findIndex(headers, ['cedula', 'nit', 'doc'], 3)
  const idxEnc = findIndex(headers, ['encargado', 'contacto'], 2)
  const idxDir = findIndex(headers, ['direccion', 'ubicacion'], 4)
  const idxTel = findIndex(headers, ['telefono', 'celular', 'tel'], 5)
  const idxFact = findIndex(headers, ['facturacion', 'factura'], 6)
  const idxAmt = findIndex(headers, ['acuerdo_mt', 'precio_mt'], 7)
  const idxAkg = findIndex(headers, ['acuerdo_kg', 'precio_kg'], 8)
  const idxVkg = findIndex(headers, ['volumen_mes_kg', 'meta_kg'], 9)
  const idxVcomp = findIndex(headers, ['volumen_por_compra', 'volumen_compra'], 10)
  const idxAkgMes = findIndex(headers, ['acuerdo_kg_brush_p_mes', 'acuerdo_mes'], 11)
  const idxTiempos = findIndex(headers, ['tiempos', 'plazo', 'condiciones'], 12)

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 2) continue

    let cName = ''
    let cCed = ''

    if (String(row[0]).match(/^[0-9]+(\.[0-9]+)?$/)) {
      cName = String(row[idxC] || '').trim()
      cCed = cleanCedula(row[idxCed])
    } else if (String(row[0]).trim()) {
      cName = String(row[0]).trim()
      cCed = cleanCedula(row[1])
    }

    if (!cName && !cCed) continue
    const key = (cCed || cName).toLowerCase().trim()

    const existing = clientMap.get(key) || createBaseClient(cName, cCed)
    existing.cliente = existing.cliente || cName
    existing.name = existing.name || cName
    existing.cedula = existing.cedula || cCed
    if (row[idxEnc]) existing.encargado = String(row[idxEnc]).trim()
    if (row[idxDir]) existing.direccion = String(row[idxDir]).trim()
    if (row[idxTel]) existing.telefono = cleanPhone(row[idxTel])
    if (row[idxFact]) existing.facturacion = String(row[idxFact]).trim()
    if (row[idxAmt]) existing.acuerdo_mt = formatMoney(row[idxAmt])
    if (row[idxAkg]) existing.acuerdo_kg = formatMoney(row[idxAkg])
    if (row[idxVkg]) existing.volumen_mes_kg = Math.round(parseNum(row[idxVkg]) * 10) / 10
    if (row[idxVcomp]) existing.volumen_compra_kg = Math.round(parseNum(row[idxVcomp]) * 10) / 10
    if (row[idxAkgMes]) existing.acuerdo_kg_mes = formatMoney(row[idxAkgMes])
    if (row[idxTiempos]) existing.tiempos = String(row[idxTiempos]).trim()

    clientMap.set(key, existing)
  }
}

function parseDirectoryRows(rows: any[][], clientMap: Map<string, ParsedWholesaleClient>) {
  let headerRowIdx = -1
  for (let r = 0; r < Math.min(6, rows.length); r++) {
    const rowStr = (rows[r] || []).join(' ').toUpperCase()
    if (rowStr.includes('NOMBRE') || rowStr.includes('CLIENTE') || rowStr.includes('CÉDULA')) {
      headerRowIdx = r
      break
    }
  }

  if (headerRowIdx < 0) return
  const headers = (rows[headerRowIdx] || []).map((h) => normalize(String(h)))

  const idxC = findIndex(headers, ['nombre_del_cliente', 'cliente', 'nombre'], 1)
  const idxCed = findIndex(headers, ['cedula', 'nit', 'doc'], 2)
  const idxTel = findIndex(headers, ['celular', 'telefono'], 3)
  const idxEmail = findIndex(headers, ['correo', 'email'], 4)
  const idxCity = findIndex(headers, ['ciudad', 'municipio'], -1)
  const idxAkg = findIndex(headers, ['precio_especial_kg', 'acuerdo_kg'], -1)
  const idxAmt = findIndex(headers, ['precio_especial_mt', 'acuerdo_mt'], -1)
  const idxObs = findIndex(headers, ['observaciones', 'tela_y_observaciones'], -1)

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 2) continue

    const cName = String(row[idxC] || '').trim()
    const cCed = cleanCedula(row[idxCed])
    if (!cName && !cCed) continue

    const key = (cCed || cName).toLowerCase().trim()
    const existing = clientMap.get(key) || createBaseClient(cName, cCed)

    existing.cliente = existing.cliente || cName
    existing.name = existing.name || cName
    existing.cedula = existing.cedula || cCed
    if (idxTel >= 0 && row[idxTel] && !existing.telefono) existing.telefono = cleanPhone(row[idxTel])
    if (idxEmail >= 0 && row[idxEmail] && !existing.email) existing.email = String(row[idxEmail]).trim().toLowerCase()
    if (idxCity >= 0 && row[idxCity] && !existing.direccion) existing.direccion = String(row[idxCity]).trim()
    if (idxAkg >= 0 && row[idxAkg] && !existing.acuerdo_kg) existing.acuerdo_kg = formatMoney(row[idxAkg])
    if (idxAmt >= 0 && row[idxAmt] && !existing.acuerdo_mt) existing.acuerdo_mt = formatMoney(row[idxAmt])
    if (idxObs >= 0 && row[idxObs] && !existing.mensaje_personalizado) existing.mensaje_personalizado = String(row[idxObs]).trim()

    clientMap.set(key, existing)
  }
}

function parseIndividualClientRows(rows: any[][], sheetName: string, clientMap: Map<string, ParsedWholesaleClient>) {
  const h1 = (rows[0] || []).map((h) => normalize(String(h)))
  const cRow = rows[1] || []

  const idxC = findIndex(h1, ['cliente', 'razon', 'empresa', 'nombre'], 1)
  const idxCed = findIndex(h1, ['cedula', 'nit', 'doc'], 3)
  const idxEnc = findIndex(h1, ['encargado', 'contacto'], 2)
  const idxDir = findIndex(h1, ['direccion', 'ubicacion'], 4)
  const idxTel = findIndex(h1, ['telefono', 'celular', 'tel'], 5)
  const idxFact = findIndex(h1, ['facturacion', 'factura'], 6)
  const idxAmt = findIndex(h1, ['acuerdo_mt', 'precio_mt'], 7)
  const idxAkg = findIndex(h1, ['acuerdo_kg', 'precio_kg'], 8)
  const idxVkg = findIndex(h1, ['volumen_mes_kg', 'meta_kg'], 9)
  const idxVmt = findIndex(h1, ['volumen_mes_mt', 'meta_mt'], 10)
  const idxVcomp = findIndex(h1, ['volumen_por_compra', 'volumen_compra'], 11)
  const idxTiempos = findIndex(h1, ['tiempos', 'plazo'], 13)

  const cName = cRow[idxC] ? String(cRow[idxC]).trim() : sheetName
  const cCed = cleanCedula(cRow[idxCed])
  const key = (cCed || cName).toLowerCase().trim()

  const existing = clientMap.get(key) || createBaseClient(cName, cCed)
  existing.cliente = existing.cliente || cName
  existing.name = existing.name || cName
  existing.cedula = existing.cedula || cCed

  if (cRow.length > 0) {
    if (cRow[idxEnc]) existing.encargado = String(cRow[idxEnc]).trim()
    if (cRow[idxDir]) existing.direccion = String(cRow[idxDir]).trim()
    if (cRow[idxTel]) existing.telefono = cleanPhone(cRow[idxTel])
    if (cRow[idxFact]) existing.facturacion = String(cRow[idxFact]).trim()
    if (cRow[idxAmt]) existing.acuerdo_mt = formatMoney(cRow[idxAmt])
    if (cRow[idxAkg]) existing.acuerdo_kg = formatMoney(cRow[idxAkg])
    if (cRow[idxVkg]) existing.volumen_mes_kg = Math.round(parseNum(cRow[idxVkg]) * 10) / 10
    if (cRow[idxVmt]) existing.volumen_mes_mt = Math.round(parseNum(cRow[idxVmt]) * 10) / 10
    if (cRow[idxVcomp]) existing.volumen_compra_kg = Math.round(parseNum(cRow[idxVcomp]) * 10) / 10
    if (cRow[idxTiempos]) existing.tiempos = String(cRow[idxTiempos]).trim()
  }

  const monthHist: ParsedWholesaleMonth[] = existing.historial_meses || []

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r]
    if (!row || !row[0]) continue
    const mName = String(row[0]).trim().toUpperCase()

    if (MONTH_NAMES.includes(mName)) {
      const kgVal = parseNum(row[1])
      const mtVal = parseNum(row[2])
      const dineroVal = row[3]
      const faltaKg = parseNum(row[4])
      const faltaMt = parseNum(row[5])
      const faltaDinero = row[6]

      if (kgVal > 0 || mtVal > 0 || parseNum(dineroVal) > 0) {
        const exists = monthHist.some((h) => h.mes === mName)
        if (!exists) {
          monthHist.push({
            mes: mName,
            kg: kgVal,
            mt: mtVal,
            cuanto_va_dinero: formatMoney(dineroVal || kgVal * parseNum(existing.acuerdo_kg)),
            falta_kg: faltaKg,
            falta_mt: faltaMt,
            falta_dinero: formatMoney(faltaDinero),
          })
        }

        // Asignar el mes más reciente a los campos principales
        existing.brush_kg_cumplido = kgVal
        existing.brush_mt_cumplido = mtVal
        existing.cuanto_falto_kg = faltaKg
        existing.cuanto_falto_mt = faltaMt
        existing.cuanto_falto_dinero = formatMoney(faltaDinero)
      }
    }
  }

  existing.historial_meses = monthHist
  clientMap.set(key, existing)
}

function createBaseClient(cName: string, cCed: string): ParsedWholesaleClient {
  const cleanCed = cleanCedula(cCed)
  return {
    cliente: cName || '',
    name: cName || '',
    email: cleanCed ? `mayorista_${cleanCed}@telasreal.com` : '',
    cedula: cleanCed,
    encargado: 'E-COMMERCE',
    telefono: '',
    direccion: '',
    facturacion: '1',
    acuerdo_mt: '$12,000',
    acuerdo_kg: '$39,600',
    volumen_mes_kg: 0,
    volumen_mes_mt: 0,
    volumen_compra_kg: 0,
    acuerdo_kg_mes: '',
    tiempos: 'Acumulados del mes y pagando antes del 30 de cada mes',
    brush_kg_cumplido: 0,
    brush_mt_cumplido: 0,
    cuanto_falto_kg: 0,
    cuanto_falto_mt: 0,
    cuanto_falto_dinero: '',
    mensaje_personalizado: '',
    historial_meses: [],
  }
}

function normalize(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function findIndex(headers: string[], searchTerms: string[], defaultIdx: number): number {
  for (let i = 0; i < headers.length; i++) {
    for (const term of searchTerms) {
      if (headers[i].includes(term)) return i
    }
  }
  return defaultIdx
}

function cleanCedula(v: any): string {
  if (!v) return ''
  const s = String(v).trim()
  if (s.includes('E')) {
    const n = parseFloat(s)
    if (!isNaN(n)) return Math.round(n).toString()
  }
  return s.replace(/\.0$/, '').replace(/\s+/g, '')
}

function cleanPhone(v: any): string {
  if (!v) return ''
  const s = String(v).trim()
  if (s.includes('E')) {
    const n = parseFloat(s)
    if (!isNaN(n)) return Math.round(n).toString()
  }
  return s.replace(/\.0$/, '').trim()
}

function parseNum(v: any): number {
  if (typeof v === 'number') return v
  if (!v) return 0
  const clean = String(v).replace(/[^0-9.-]/g, '')
  const n = parseFloat(clean)
  return isNaN(n) ? 0 : n
}

function formatMoney(v: any): string {
  if (!v) return '$0'
  if (typeof v === 'string' && v.startsWith('$')) return v
  const n = parseNum(v)
  return '$' + Math.round(n).toLocaleString('es-CO')
}
