import React, { useState, useEffect } from 'react'
import { useClient } from 'sanity'

const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

const APPS_SCRIPT_CODE = `/**
 * SCRIPT DE CONEXIÓN EN VIVO: GOOGLE DRIVE / SHEETS <-> TELAS REAL
 * Pega este código en Extensiones > Apps Script en tu Google Sheet de Drive
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var result = { status: "success", spreadsheetName: ss.getName(), sheets: [], clients: [] };
    var clientMap = {};

    sheets.forEach(function(sheet) {
      var sheetName = sheet.getName().trim();
      if (sheetName.startsWith("_") || sheet.isSheetHidden() || sheetName.toUpperCase() === "FILTRO") return;
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return;

      result.sheets.push({ name: sheetName, totalRows: data.length });
      var upper = sheetName.toUpperCase();

      if (upper.includes("XIOMARA")) {
        parseXiomara(data, clientMap);
      } else if (upper.includes("CLIENTES BRUSH") || upper.includes("POTENCIALES")) {
        parseDirectory(data, clientMap);
      } else if (data.length >= 2) {
        parseIndividual(data, sheetName, clientMap);
      }
    });

    for (var k in clientMap) result.clients.push(clientMap[k]);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function parseXiomara(data, clientMap) {
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.length < 2) continue;
    var cName = String(row[1] || row[0] || "").trim();
    var cCed = cleanCed(row[3] || row[1]);
    if (!cName && !cCed) continue;
    var key = (cCed || cName).toLowerCase().trim();
    var obj = clientMap[key] || baseClient(cName, cCed);
    obj.cliente = obj.cliente || cName;
    obj.name = obj.name || cName;
    obj.cedula = obj.cedula || cCed;
    if (row[2]) obj.encargado = String(row[2]).trim();
    if (row[4]) obj.direccion = String(row[4]).trim();
    if (row[5]) obj.telefono = cleanPhone(row[5]);
    if (row[6]) obj.facturacion = String(row[6]).trim();
    if (row[7]) obj.acuerdo_mt = fmtMoney(row[7]);
    if (row[8]) obj.acuerdo_kg = fmtMoney(row[8]);
    if (row[9]) obj.volumen_mes_kg = num(row[9]);
    if (row[10]) obj.volumen_compra_kg = num(row[10]);
    if (row[11]) obj.acuerdo_kg_mes = fmtMoney(row[11]);
    if (row[12]) obj.tiempos = String(row[12]).trim();
    clientMap[key] = obj;
  }
}

function parseDirectory(data, clientMap) {
  var hIdx = 0;
  for (var r = 0; r < Math.min(5, data.length); r++) {
    if (data[r].join(" ").toUpperCase().includes("NOMBRE")) { hIdx = r; break; }
  }
  for (var i = hIdx + 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.length < 2) continue;
    var cName = String(row[1] || "").trim();
    var cCed = cleanCed(row[2]);
    if (!cName && !cCed) continue;
    var key = (cCed || cName).toLowerCase().trim();
    var obj = clientMap[key] || baseClient(cName, cCed);
    obj.cliente = obj.cliente || cName;
    obj.cedula = obj.cedula || cCed;
    if (row[3] && !obj.telefono) obj.telefono = cleanPhone(row[3]);
    if (row[4] && !obj.email) obj.email = String(row[4]).trim().toLowerCase();
    clientMap[key] = obj;
  }
}

function parseIndividual(data, sheetName, clientMap) {
  var cRow = data[1];
  var cName = (cRow && cRow[1]) ? String(cRow[1]).trim() : sheetName;
  var cCed = (cRow && cRow[3]) ? cleanCed(cRow[3]) : "";
  var key = (cCed || cName).toLowerCase().trim();
  var obj = clientMap[key] || baseClient(cName, cCed);
  obj.cliente = obj.cliente || cName;
  obj.cedula = obj.cedula || cCed;

  if (cRow) {
    if (cRow[2]) obj.encargado = String(cRow[2]).trim();
    if (cRow[4]) obj.direccion = String(cRow[4]).trim();
    if (cRow[5]) obj.telefono = cleanPhone(cRow[5]);
    if (cRow[6]) obj.facturacion = String(cRow[6]).trim();
    if (cRow[7]) obj.acuerdo_mt = fmtMoney(cRow[7]);
    if (cRow[8]) obj.acuerdo_kg = fmtMoney(cRow[8]);
    if (cRow[9]) obj.volumen_mes_kg = num(cRow[9]);
    if (cRow[10]) obj.volumen_mes_mt = num(cRow[10]);
    if (cRow[11]) obj.volumen_compra_kg = num(cRow[11]);
    if (cRow[13]) obj.tiempos = String(cRow[13]).trim();
  }

  var months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  var hist = obj.historial_meses || [];
  for (var r = 2; r < data.length; r++) {
    var m = String(data[r][0] || "").trim().toUpperCase();
    if (months.indexOf(m) >= 0) {
      var kg = num(data[r][1]);
      var mt = num(data[r][2]);
      var din = data[r][3];
      var fKg = num(data[r][4]);
      var fMt = num(data[r][5]);
      var fDin = data[r][6];
      if (kg > 0 || mt > 0 || num(din) > 0) {
        if (!hist.some(function(x) { return x.mes === m; })) {
          hist.push({ mes: m, kg: kg, mt: mt, cuanto_va_dinero: fmtMoney(din || (kg * num(obj.acuerdo_kg))), falta_kg: fKg, falta_mt: fMt, falta_dinero: fmtMoney(fDin) });
        }
        obj.brush_kg_cumplido = kg;
        obj.brush_mt_cumplido = mt;
        obj.cuanto_falto_kg = fKg;
        obj.cuanto_falto_mt = fMt;
        obj.cuanto_falto_dinero = fmtMoney(fDin);
      }
    }
  }
  obj.historial_meses = hist;
  clientMap[key] = obj;
}

function baseClient(cName, cCed) {
  var c = cleanCed(cCed);
  return {
    cliente: cName || "", name: cName || "",
    email: c ? "mayorista_" + c + "@telasreal.com" : "",
    cedula: c, encargado: "E-COMMERCE", telefono: "", direccion: "",
    facturacion: "1", acuerdo_mt: "$12,000", acuerdo_kg: "$39,600",
    volumen_mes_kg: 0, volumen_mes_mt: 0, volumen_compra_kg: 0,
    acuerdo_kg_mes: "", tiempos: "Acumulados del mes y pagando antes del 30 de cada mes",
    brush_kg_cumplido: 0, brush_mt_cumplido: 0, cuanto_falto_kg: 0,
    cuanto_falto_mt: 0, cuanto_falto_dinero: "", mensaje_personalizado: "",
    historial_meses: []
  };
}

function cleanCed(v) {
  if (!v) return "";
  var s = String(v).trim();
  if (s.indexOf("E") >= 0) { var n = parseFloat(s); if (!isNaN(n)) return Math.round(n).toString(); }
  return s.replace(/\\.0$/, "").replace(/\\s+/g, "");
}
function cleanPhone(v) {
  if (!v) return "";
  var s = String(v).trim();
  if (s.indexOf("E") >= 0) { var n = parseFloat(s); if (!isNaN(n)) return Math.round(n).toString(); }
  return s.replace(/\\.0$/, "").trim();
}
function num(v) {
  if (!v) return 0;
  var n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}
function fmtMoney(v) {
  if (!v) return "$0";
  if (typeof v === "string" && v.startsWith("$")) return v;
  return "$" + Math.round(num(v)).toLocaleString("es-CO");
}`

const styles: Record<string, any> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '32px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    maxWidth: 1240,
    margin: '0 auto',
    background: '#1e293b',
    borderRadius: 16,
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    border: '1px solid #334155',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '24px 32px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  btnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  btnDrive: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  btnLocalExcel: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  btnGhost: {
    background: '#0f172a',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnDanger: {
    background: 'transparent',
    color: '#f87171',
    border: '1px solid #ef4444',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  driveBanner: {
    background: 'rgba(16,185,129,0.08)',
    borderBottom: '1px solid rgba(16,185,129,0.2)',
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 12,
    fontSize: 12,
    color: '#e2e8f0',
  },
  body: {
    padding: '24px 32px',
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #334155',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  thead: {
    background: '#0f172a',
  },
  th: {
    padding: '12px 16px',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    textAlign: 'left' as const,
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #1e293b',
    color: '#e2e8f0',
    fontSize: 13,
    verticalAlign: 'middle' as const,
  },
  badge: (color: string) => ({
    display: 'inline-block',
    background: color === 'green' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
    color: color === 'green' ? '#4ade80' : '#f87171',
    border: `1px solid ${color === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 700,
  }),
  progress: (pct: number) => ({
    width: '100%',
    height: 6,
    background: '#0f172a',
    borderRadius: 99,
    overflow: 'hidden' as const,
    marginBottom: 4,
  }),
  progressBar: (pct: number) => ({
    width: `${Math.min(100, pct)}%`,
    height: '100%',
    background: pct >= 100 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171',
    borderRadius: 99,
    transition: 'width 0.5s ease',
  }),
  emptyRow: {
    padding: 48,
    textAlign: 'center' as const,
    color: '#475569',
    fontSize: 15,
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(5px)',
    zIndex: 9998,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px',
    overflowY: 'auto' as const,
  },
  dialog: {
    background: '#1e293b',
    borderRadius: 16,
    border: '1px solid #334155',
    width: '100%',
    maxWidth: 840,
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    zIndex: 9999,
    marginTop: 24,
  },
  dialogHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  dialogBody: {
    padding: '24px',
    maxHeight: '75vh',
    overflowY: 'auto' as const,
  },
  dialogFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #334155',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    marginBottom: 16,
    marginTop: 24,
    paddingTop: 24,
    borderTop: '1px solid #334155',
    display: 'block',
  },
  sectionLabelFirst: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    marginBottom: 16,
    display: 'block',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
  },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#f1f5f9',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  codeBox: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '14px',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#93c5fd',
    maxHeight: 180,
    overflowY: 'auto' as const,
    whiteSpace: 'pre-wrap' as const,
  },
  accentBox: {
    background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
  },
}

const EMPTY_FORM = {
  _id: '',
  name: '',
  email: '',
  password: '',
  wholesaleData: {
    cliente: '', encargado: '', cedula: '', direccion: '', telefono: '',
    facturacion: '', acuerdo_mt: '', acuerdo_kg: '', volumen_mes_kg: 0,
    volumen_mes_mt: 0, volumen_compra_kg: 0, acuerdo_kg_mes: '', tiempos: '',
    brush_kg_cumplido: 0, brush_mt_cumplido: 0, cuanto_falto_kg: 0,
    cuanto_falto_mt: 0, cuanto_falto_dinero: '', mensaje_personalizado: ''
  }
}

export function WholesaleManager() {
  const client = useClient({ apiVersion: '2023-05-03' })
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [formData, setFormData] = useState<any>(EMPTY_FORM)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Drive Live Sync States
  const [driveSettings, setDriveSettings] = useState<any>(null)
  const [isSyncingDrive, setIsSyncingDrive] = useState(false)
  const [isImportingLocal, setIsImportingLocal] = useState(false)
  const [isDriveConfigOpen, setIsDriveConfigOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [inputWebhookUrl, setInputWebhookUrl] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  // Quick Update State
  const CURRENT_MONTH = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  const [quickUpdateUser, setQuickUpdateUser] = useState<any>(null)
  const [quickUpdateData, setQuickUpdateData] = useState<any>({
    mes: CURRENT_MONTH,
    kg_agregados: 0
  })

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4500)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await client.fetch(`*[_type == "user" && role == "mayorista"]{_id,name,email,wholesaleData}`)
      setUsers(result)
    } catch {
      showToast('Error al cargar usuarios', 'err')
    }
    setLoading(false)
  }

  const fetchDriveSettings = async () => {
    try {
      const result = await client.fetch(`*[_type == "wholesaleDriveSettings" || _id == "wholesaleDriveSettings"][0]`)
      setDriveSettings(result || null)
      if (result?.webhookUrl) {
        setInputWebhookUrl(result.webhookUrl)
      }
    } catch (e) {
      console.warn('Error fetching drive settings:', e)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchDriveSettings()
  }, [])

  // Sincronización en vivo PULL desde Google Drive
  const handleSyncDrive = async () => {
    setIsSyncingDrive(true)
    try {
      const res = await fetch('/api/mayorista/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull' })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        showToast(`✓ Sincronización exitosa: ${data.total} clientes (${data.created} creados, ${data.updated} actualizados)`, 'ok')
        fetchUsers()
        fetchDriveSettings()
      } else {
        showToast(data.error || 'Error al sincronizar con Drive', 'err')
      }
    } catch (e: any) {
      showToast('Error de red al conectar con Google Drive: ' + e.message, 'err')
    } finally {
      setIsSyncingDrive(false)
    }
  }

  // Importar directamente el archivo mayoristas.xlsx local
  const handleImportLocalExcel = async () => {
    setIsImportingLocal(true)
    try {
      const res = await fetch('/api/mayorista/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_local' })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        showToast(`✓ Archivo mayoristas.xlsx importado: ${data.total} clientes (${data.created} nuevos, ${data.updated} actualizados)`, 'ok')
        fetchUsers()
        fetchDriveSettings()
      } else {
        showToast(data.error || 'Error al importar mayoristas.xlsx', 'err')
      }
    } catch (e: any) {
      showToast('Error al importar archivo local: ' + e.message, 'err')
    } finally {
      setIsImportingLocal(false)
    }
  }

  // Escanear pestañas y hojas (Drive o Local)
  const handleScanDrive = async (source?: string) => {
    setIsScanning(true)
    setIsScanModalOpen(true)
    try {
      const query = source === 'local' 
        ? '?source=local' 
        : (inputWebhookUrl ? `?url=${encodeURIComponent(inputWebhookUrl)}` : '')
      const res = await fetch(`/api/mayorista/drive-sync${query}`)
      const data = await res.json()
      if (res.ok && data.connected) {
        setScanResult(data)
        showToast(`✓ Hoja escaneada: ${data.spreadsheetName} (${data.sheets.length} pestañas detectadas)`, 'ok')
      } else {
        setScanResult({ error: data.error || 'No se pudo conectar a Google Sheets' })
      }
    } catch (e: any) {
      setScanResult({ error: 'Error al contactar Google Drive: ' + e.message })
    } finally {
      setIsScanning(false)
    }
  }

  // Guardar URL del Webhook
  const handleSaveDriveUrl = async () => {
    if (!inputWebhookUrl.trim()) {
      showToast('Ingresa una URL válida de Google Apps Script', 'err')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/mayorista/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_url', webhookUrl: inputWebhookUrl.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('✓ Conexión de Google Drive guardada exitosamente', 'ok')
        setIsDriveConfigOpen(false)
        fetchDriveSettings()
      } else {
        showToast(data.error || 'Error al guardar configuración', 'err')
      }
    } catch (e: any) {
      showToast('Error al guardar: ' + e.message, 'err')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await client.delete(userToDelete._id)
      showToast('Mayorista eliminado correctamente', 'ok')
      setUserToDelete(null)
      fetchUsers()
    } catch (e: any) {
      showToast('Error al eliminar: ' + e.message, 'err')
    }
    setIsDeleting(false)
  }

  const openQuickUpdate = (u: any) => {
    setQuickUpdateUser(u)
    setQuickUpdateData({
      mes: CURRENT_MONTH,
      kg_agregados: 0
    })
  }

  const handleSaveQuickUpdate = async () => {
    if (!quickUpdateUser) return
    setIsSaving(true)
    try {
      const kgAgregados = Number(quickUpdateData.kg_agregados) || 0;
      const mes = quickUpdateData.mes;
      const wholesale = quickUpdateUser.wholesaleData || {};
      const historial = wholesale.historial_meses || [];
      
      let mesIndex = historial.findIndex((h: any) => h.mes === mes);
      let mesData = mesIndex >= 0 ? { ...historial[mesIndex] } : {
        _key: Math.random().toString(36).substring(7),
        mes,
        kg: 0,
        mt: 0,
        cuanto_va_dinero: "$0",
        falta_kg: wholesale.volumen_mes_kg || 0,
        falta_mt: wholesale.volumen_mes_mt || 0,
        falta_dinero: "$0"
      };

      const factorConversion = 3.3;
      const acuerdoDinero = Number((wholesale.acuerdo_kg || "0").replace(/[^0-9.-]+/g,"")) || 0;
      const metaKg = Number(wholesale.volumen_mes_kg) || 0;
      const metaMt = Number(wholesale.volumen_mes_mt) || 0;
      const metaDinero = metaKg * acuerdoDinero;

      mesData.kg += kgAgregados;
      mesData.mt = Number((mesData.kg * factorConversion).toFixed(1));
      mesData.cuanto_va_dinero = "$" + (mesData.kg * acuerdoDinero).toLocaleString("es-CO");
      
      mesData.falta_kg = Math.max(0, metaKg - mesData.kg);
      mesData.falta_mt = Math.max(0, metaMt - mesData.mt);
      const faltaDinero = Math.max(0, metaDinero - (mesData.kg * acuerdoDinero));
      mesData.falta_dinero = "$" + faltaDinero.toLocaleString("es-CO");

      const newHistorial = [...historial];
      if (mesIndex >= 0) {
        newHistorial[mesIndex] = mesData;
      } else {
        newHistorial.push(mesData);
      }

      const patchData: any = {
        'wholesaleData.historial_meses': newHistorial,
      };

      if (mes === CURRENT_MONTH) {
        patchData['wholesaleData.brush_kg_cumplido'] = mesData.kg;
        patchData['wholesaleData.cuanto_falto_kg'] = mesData.falta_kg;
        patchData['wholesaleData.brush_mt_cumplido'] = mesData.mt;
        patchData['wholesaleData.cuanto_falto_mt'] = mesData.falta_mt;
      }

      await client.patch(quickUpdateUser._id)
        .set(patchData)
        .commit()
      
      showToast('Progreso actualizado correctamente', 'ok')
      setQuickUpdateUser(null)
      fetchUsers()
    } catch (e: any) {
      showToast('Error al actualizar progreso: ' + e.message, 'err')
    }
    setIsSaving(false)
  }

  const openCreate = () => { setFormData(EMPTY_FORM); setIsDialogOpen(true) }
  const openEdit = (u: any) => {
    setFormData({
      _id: u._id,
      name: u.name || '',
      email: u.email || '',
      password: '',
      wholesaleData: {
        cliente: u.wholesaleData?.cliente || '',
        encargado: u.wholesaleData?.encargado || '',
        cedula: u.wholesaleData?.cedula || '',
        direccion: u.wholesaleData?.direccion || '',
        telefono: u.wholesaleData?.telefono || '',
        facturacion: u.wholesaleData?.facturacion || '',
        acuerdo_mt: u.wholesaleData?.acuerdo_mt || '',
        acuerdo_kg: u.wholesaleData?.acuerdo_kg || '',
        volumen_mes_kg: u.wholesaleData?.volumen_mes_kg || 0,
        volumen_mes_mt: u.wholesaleData?.volumen_mes_mt || 0,
        volumen_compra_kg: u.wholesaleData?.volumen_compra_kg || 0,
        acuerdo_kg_mes: u.wholesaleData?.acuerdo_kg_mes || '',
        tiempos: u.wholesaleData?.tiempos || '',
        brush_kg_cumplido: u.wholesaleData?.brush_kg_cumplido || 0,
        brush_mt_cumplido: u.wholesaleData?.brush_mt_cumplido || 0,
        cuanto_falto_kg: u.wholesaleData?.cuanto_falto_kg || 0,
        cuanto_falto_mt: u.wholesaleData?.cuanto_falto_mt || 0,
        cuanto_falto_dinero: u.wholesaleData?.cuanto_falto_dinero || '',
        mensaje_personalizado: u.wholesaleData?.mensaje_personalizado || ''
      }
    })
    setIsDialogOpen(true)
  }

  const set = (field: string, value: any, isWd = false) => {
    setFormData((prev: any) => isWd
      ? { ...prev, wholesaleData: { ...prev.wholesaleData, [field]: value } }
      : { ...prev, [field]: value }
    )
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) { showToast('Nombre y Email son requeridos', 'err'); return }
    setIsSaving(true)
    try {
      const wd = formData.wholesaleData
      const payload: any = {
        _type: 'user',
        name: formData.name,
        email: formData.email,
        role: 'mayorista',
        wholesaleData: {
          ...wd,
          volumen_mes_kg: Number(wd.volumen_mes_kg),
          volumen_mes_mt: Number(wd.volumen_mes_mt),
          volumen_compra_kg: Number(wd.volumen_compra_kg),
          brush_kg_cumplido: Number(wd.brush_kg_cumplido),
          brush_mt_cumplido: Number(wd.brush_mt_cumplido),
          cuanto_falto_kg: Number(wd.cuanto_falto_kg),
          cuanto_falto_mt: Number(wd.cuanto_falto_mt)
        }
      }
      if (formData.password?.trim()) payload.password = formData.password
      if (!formData._id) {
        await client.create(payload)
        showToast('Mayorista creado exitosamente ✓', 'ok')
      } else {
        await client.patch(formData._id).set(payload).commit()
        showToast('Datos actualizados correctamente ✓', 'ok')
      }
      setIsDialogOpen(false)
      fetchUsers()
    } catch (e: any) {
      showToast('Error: ' + e.message, 'err')
    }
    setIsSaving(false)
  }

  return (
    <div style={styles.container}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 99999,
          background: toast.type === 'ok' ? '#064e3b' : '#7f1d1d',
          color: toast.type === 'ok' ? '#4ade80' : '#fca5a5',
          border: `1px solid ${toast.type === 'ok' ? '#34d399' : '#f87171'}`,
          borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>{toast.msg}</div>
      )}

      <div style={styles.card}>
        {/* Header con Controles en Vivo */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>CRM Clientes Mayoristas</h1>
            <p style={styles.headerSub}>Gestión de clientes corporativos, acuerdos y sincronización en vivo con Google Drive / Sheets</p>
          </div>
          <div style={styles.btnGroup}>
            <button
              style={{ ...styles.btnDrive, opacity: isSyncingDrive ? 0.7 : 1 }}
              disabled={isSyncingDrive}
              onClick={handleSyncDrive}
              title="Sincroniza y actualiza todos los clientes con el Excel de Google Drive"
            >
              <span>{isSyncingDrive ? '⏳ Sincronizando...' : '🔄 Sincronizar Google Drive'}</span>
            </button>
            <button
              style={{ ...styles.btnLocalExcel, opacity: isImportingLocal ? 0.7 : 1 }}
              disabled={isImportingLocal}
              onClick={handleImportLocalExcel}
              title="Importa o actualiza todos los clientes desde el archivo mayoristas.xlsx"
            >
              <span>{isImportingLocal ? '⏳ Importando...' : '📥 Importar mayoristas.xlsx'}</span>
            </button>
            <button style={styles.btnGhost} onClick={() => handleScanDrive()}>
              <span>🔍 Escanear Drive</span>
            </button>
            <button style={styles.btnGhost} onClick={() => handleScanDrive('local')}>
              <span>📄 Escanear Local</span>
            </button>
            <button style={styles.btnGhost} onClick={() => setIsDriveConfigOpen(true)}>
              <span>⚙️ Configurar Drive</span>
            </button>
            <button style={styles.btnPrimary} onClick={openCreate}>
              <span>+ Nuevo Mayorista</span>
            </button>
          </div>
        </div>

        {/* Banner de Estado de Conexión Google Drive */}
        <div style={styles.driveBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: driveSettings?.webhookUrl ? '#10b981' : '#94a3b8',
              boxShadow: driveSettings?.webhookUrl ? '0 0 8px #10b981' : 'none'
            }} />
            <span>
              <strong>Fuente / Hoja:</strong> {driveSettings?.spreadsheetName ? `${driveSettings.spreadsheetName}` : (driveSettings?.webhookUrl ? 'Conectado a Google Drive' : 'Sin configurar')}
            </span>
            {driveSettings?.lastSyncAt && (
              <span style={{ color: '#94a3b8' }}>
                · Última sinc: {new Date(driveSettings.lastSyncAt).toLocaleString('es-CO')}
              </span>
            )}
            {driveSettings?.lastSyncStats && (
              <span style={{ color: '#4ade80' }}>
                · {driveSettings.lastSyncStats}
              </span>
            )}
          </div>
          {driveSettings?.detectedSheets && driveSettings.detectedSheets.length > 0 && (
            <div style={{ color: '#94a3b8' }}>
              Pestañas: {driveSettings.detectedSheets.slice(0, 3).join(', ')}{driveSettings.detectedSheets.length > 3 ? ` (+${driveSettings.detectedSheets.length - 3} más)` : ''}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Mayoristas', value: users.length, color: '#3b82f6' },
              {
                label: 'Cuota Cumplida', color: '#4ade80',
                value: users.filter(u => (u.wholesaleData?.cuanto_falto_kg || 0) <= 0).length
              },
              {
                label: 'Cuota Pendiente', color: '#f87171',
                value: users.filter(u => (u.wholesaleData?.cuanto_falto_kg || 0) > 0).length
              },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0f172a', borderRadius: 10, padding: '16px 20px', border: '1px solid #334155' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Directorio de Clientes
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  {['Razón Social / Cliente', 'Cédula / NIT', 'Progreso Mensual (KG)', 'KG Faltante', 'Acciones'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={styles.emptyRow}>Cargando mayoristas...</td></tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ ...styles.emptyRow, background: '#0f172a', padding: 48 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                        <div style={{ color: '#475569', fontSize: 15 }}>No hay clientes mayoristas registrados aún.</div>
                        <div style={{ color: '#334155', fontSize: 13, marginTop: 6 }}>
                          Haz clic en "Importar mayoristas.xlsx" o "Sincronizar Google Drive" para poblar los clientes.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : users.map((u, idx) => {
                  const wd = u.wholesaleData || {}
                  const cumplido = wd.brush_kg_cumplido || 0
                  const meta = wd.volumen_mes_kg || 0
                  const pct = meta > 0 ? Math.round((cumplido / meta) * 100) : 0
                  const faltante = wd.cuanto_falto_kg || 0
                  return (
                    <tr
                      key={u._id}
                      style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#1e293b' : '#182032' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#253349')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#1e293b' : '#182032')}
                      onClick={() => openQuickUpdate(u)}
                    >
                      <td style={styles.td}>
                        <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{wd.cliente || u.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{u.email}</div>
                      </td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', color: '#94a3b8' }}>{wd.cedula || '—'}</td>
                      <td style={{ ...styles.td, minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{cumplido}</span> / {meta} KG · {pct}%
                        </div>
                        <div style={styles.progress(pct)}>
                          <div style={styles.progressBar(pct)} />
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge(faltante <= 0 ? 'green' : 'red')}>
                          {faltante <= 0 ? '✓ Completo' : `${faltante} KG`}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={styles.btnGhost} onClick={(e) => { e.stopPropagation(); openEdit(u); }}>Editar</button>
                          <button style={styles.btnDanger} onClick={(e) => { e.stopPropagation(); setUserToDelete(u); }}>Borrar</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: ESCANEAR PESTAÑAS DRIVE / LOCAL */}
      {isScanModalOpen && (
        <div style={styles.overlay} onClick={() => setIsScanModalOpen(false)}>
          <div style={{ ...styles.dialog, maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>🔍 Escaneo de Hojas y Pestañas</h2>
              <button style={styles.btnGhost} onClick={() => setIsScanModalOpen(false)}>✕</button>
            </div>
            <div style={styles.dialogBody}>
              {isScanning ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
                  <p>Escaneando hojas de cálculo en tiempo real...</p>
                </div>
              ) : scanResult?.error ? (
                <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#f87171' }}>
                  <strong>Error al escanear:</strong> {scanResult.error}
                </div>
              ) : scanResult ? (
                <div>
                  <div style={{ padding: 14, background: '#0f172a', borderRadius: 8, marginBottom: 16, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>📊 {scanResult.spreadsheetName}</div>
                    <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>
                      ✓ {scanResult.totalClientsFound} clientes detectados en total
                    </div>
                  </div>

                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Pestañas / Hojas Encontradas ({scanResult.sheets?.length || 0})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
                    {(scanResult.sheets || []).map((s: any, idx: number) => (
                      <div key={idx} style={{ padding: '10px 14px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>📄 {s.name}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>{s.totalRows} filas</span>
                      </div>
                    ))}
                  </div>

                  {scanResult.sampleClients?.length > 0 && (
                    <>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Muestra de Clientes Reconocidos</h3>
                      <div style={{ maxHeight: 160, overflowY: 'auto', background: '#0f172a', borderRadius: 8, padding: 10, border: '1px solid #334155', fontSize: 12 }}>
                        {scanResult.sampleClients.map((c: any, i: number) => (
                          <div key={i} style={{ padding: '6px 8px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{c.cliente || c.name}</span>
                            <span style={{ color: '#94a3b8' }}>NIT: {c.cedula || '—'} · Meta: {c.volumen_mes_kg || 0} KG</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setIsScanModalOpen(false)}>Cerrar</button>
              {scanResult?.source === 'local' ? (
                <button style={styles.btnLocalExcel} onClick={handleImportLocalExcel}>
                  <span>📥 Importar mayoristas.xlsx</span>
                </button>
              ) : (
                <button style={styles.btnDrive} onClick={handleSyncDrive}>
                  <span>🔄 Sincronizar Google Drive</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR CONEXIÓN DRIVE */}
      {isDriveConfigOpen && (
        <div style={styles.overlay} onClick={() => setIsDriveConfigOpen(false)}>
          <div style={{ ...styles.dialog, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>⚙️ Conectar con Google Drive / Sheets</h2>
              <button style={styles.btnGhost} onClick={() => setIsDriveConfigOpen(false)}>✕</button>
            </div>
            <div style={styles.dialogBody}>
              <div style={{ marginBottom: 20 }}>
                <label style={styles.label}>URL de la Aplicación Web (Google Apps Script) *</label>
                <input
                  style={{ ...styles.input, marginTop: 6 }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={inputWebhookUrl}
                  onChange={e => setInputWebhookUrl(e.target.value)}
                />
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Pega aquí la URL que genera Google Apps Script al implementar como "Aplicación web".
                </p>
              </div>

              {/* Guía Rápida */}
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase' }}>
                    📋 Código Apps Script (Copiar y Pegar en Drive)
                  </span>
                  <button
                    style={{ ...styles.btnGhost, padding: '4px 10px', fontSize: 11, background: copiedCode ? '#065f46' : '#1e293b', color: copiedCode ? '#34d399' : '#94a3b8' }}
                    onClick={handleCopyScript}
                  >
                    {copiedCode ? '✓ Copiado' : '📋 Copiar Código'}
                  </button>
                </div>
                <div style={styles.codeBox}>{APPS_SCRIPT_CODE}</div>

                <div style={{ marginTop: 14, fontSize: 12, color: '#cbd5e1', lineHeight: '1.6' }}>
                  <strong>Pasos para conectar:</strong>
                  <ol style={{ paddingLeft: 18, marginTop: 6 }}>
                    <li>Abre tu Google Sheet en Google Drive.</li>
                    <li>Ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
                    <li>Borra el contenido, pega este código y guarda.</li>
                    <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                    <li>Selecciona <em>Aplicación web</em>, asigna acceso a <em>Cualquier persona</em> y copia la URL generada.</li>
                  </ol>
                </div>
              </div>
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setIsDriveConfigOpen(false)}>Cancelar</button>
              <button style={styles.btnGhost} onClick={() => handleScanDrive()}>🔍 Probar Conexión</button>
              <button
                style={{ ...styles.btnPrimary, opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
                onClick={handleSaveDriveUrl}
              >
                {isSaving ? 'Guardando...' : 'Guardar Conexión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK UPDATE DIALOG */}
      {quickUpdateUser && (
        <div style={styles.overlay} onClick={() => setQuickUpdateUser(null)}>
          <div style={{ ...styles.dialog, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>Actualizar Progreso de {quickUpdateUser?.name || 'Cliente'}</h2>
            </div>
            <div style={{ padding: '24px' }}>
              {quickUpdateUser?.wholesaleData?.historial_meses?.length > 0 && (
                <div style={{ marginBottom: 20, padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Historial Registrado</h3>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '12px', color: '#e2e8f0', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                          <th style={{ textAlign: 'left', padding: '4px 6px' }}>Mes</th>
                          <th style={{ textAlign: 'right', padding: '4px 6px' }}>Kilos</th>
                          <th style={{ textAlign: 'right', padding: '4px 6px' }}>Falta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quickUpdateUser.wholesaleData.historial_meses.map((h: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '4px 6px' }}>{h.mes}</td>
                            <td style={{ textAlign: 'right', padding: '4px 6px' }}>{h.kg} KG</td>
                            <td style={{ textAlign: 'right', padding: '4px 6px', color: h.falta_kg <= 0 ? '#4ade80' : '#f87171' }}>
                              {h.falta_kg <= 0 ? '✓ Meta' : `${h.falta_kg} KG`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: 16 }}>
                <div>
                  <label style={styles.label}>Mes a registrar</label>
                  <select
                    style={{ ...styles.input, backgroundColor: '#0f172a', marginTop: 4 }}
                    value={quickUpdateData.mes}
                    onChange={e => setQuickUpdateData({ ...quickUpdateData, mes: e.target.value })}
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Añadir Kilos (KG)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
                    <span style={{ color: '#94a3b8' }}>+</span>
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="Ej: 50"
                      value={quickUpdateData.kg_agregados || ""}
                      onChange={e => setQuickUpdateData({ ...quickUpdateData, kg_agregados: e.target.value })}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4' }}>
                    Se sumarán {quickUpdateData.kg_agregados || 0} KG al mes de {quickUpdateData.mes}.
                  </p>
                </div>
              </div>
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setQuickUpdateUser(null)}>Cancelar</button>
              <button
                style={{ ...styles.btnPrimary, opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
                onClick={handleSaveQuickUpdate}
              >
                {isSaving ? 'Guardando...' : 'Actualizar Progreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {userToDelete && (
        <div style={styles.overlay} onClick={() => setUserToDelete(null)}>
          <div style={{ ...styles.dialog, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>⚠️ Confirmar Eliminación</h2>
            </div>
            <div style={styles.dialogBody}>
              <p style={{ color: '#e2e8f0', fontSize: 14 }}>
                ¿Estás seguro de que deseas eliminar a <strong>{userToDelete.name}</strong>?
              </p>
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setUserToDelete(null)}>Cancelar</button>
              <button
                style={{ ...styles.btnDanger, background: 'rgba(239,68,68,0.1)' }}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG EDIT/CREATE */}
      {isDialogOpen && (
        <div style={styles.overlay} onClick={() => setIsDialogOpen(false)}>
          <div style={styles.dialog} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>
                {formData._id ? '✏️ Editar Cliente Mayorista' : '🆕 Nuevo Cliente Mayorista'}
              </h2>
              <button style={{ ...styles.btnGhost, padding: '6px 12px' }} onClick={() => setIsDialogOpen(false)}>✕ Cerrar</button>
            </div>

            <div style={styles.dialogBody}>
              <span style={styles.sectionLabelFirst}>1. Datos de Acceso al Portal</span>
              <div style={styles.grid2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre Completo *</label>
                  <input style={styles.input} value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Ej: E-Commerce Ltda." />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Correo Electrónico (Login) *</label>
                  <input style={styles.input} value={formData.email} onChange={e => set('email', e.target.value)} placeholder="correo@empresa.com" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contraseña {formData._id && '(dejar en blanco = sin cambiar)'}</label>
                  <input style={styles.input} type="password" value={formData.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <span style={styles.sectionLabel}>2. Datos Corporativos</span>
              <div style={styles.grid3}>
                {[
                  { label: 'Razón Social / Cliente', field: 'cliente', ph: 'E-Commerce Ltda.' },
                  { label: 'Cédula / NIT', field: 'cedula', ph: '99401344' },
                  { label: 'Encargado', field: 'encargado', ph: 'Juan Pérez' },
                  { label: 'Teléfono', field: 'telefono', ph: '310...' },
                  { label: 'Dirección', field: 'direccion', ph: 'Carrera...' },
                  { label: 'Condición de Facturación', field: 'facturacion', ph: '1' },
                ].map(f => (
                  <div key={f.field} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input style={styles.input} value={formData.wholesaleData[f.field]} onChange={e => set(f.field, e.target.value, true)} placeholder={f.ph} />
                  </div>
                ))}
              </div>

              <span style={styles.sectionLabel}>3. Acuerdos Comerciales</span>
              <div style={styles.grid3}>
                {[
                  { label: 'Acuerdo $ MT', field: 'acuerdo_mt', ph: '$12,000' },
                  { label: 'Acuerdo $ KG', field: 'acuerdo_kg', ph: '$39,600' },
                  { label: 'Acuerdo KG Mensual ($)', field: 'acuerdo_kg_mes', ph: 'Meta en dinero' },
                  { label: 'Tiempos / Condiciones de Pago', field: 'tiempos', ph: 'Antes del 30 de cada mes' },
                ].map(f => (
                  <div key={f.field} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input style={styles.input} value={formData.wholesaleData[f.field]} onChange={e => set(f.field, e.target.value, true)} placeholder={f.ph} />
                  </div>
                ))}
                {[
                  { label: 'Cuota Mínima Mensual (KG)', field: 'volumen_mes_kg' },
                  { label: 'Cuota Mínima Mensual (MT)', field: 'volumen_mes_mt' },
                  { label: 'Compra Mínima por Pedido (KG)', field: 'volumen_compra_kg' },
                ].map(f => (
                  <div key={f.field} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input style={styles.input} type="number" value={formData.wholesaleData[f.field]} onChange={e => set(f.field, e.target.value, true)} />
                  </div>
                ))}
              </div>

              <span style={styles.sectionLabel}>4. Avance del Mes Actual</span>
              <div style={styles.accentBox}>
                <div style={{ ...styles.grid3, marginBottom: 0 }}>
                  {[
                    { label: '✅ KG Cumplido', field: 'brush_kg_cumplido', color: '#4ade80' },
                    { label: '⚠️ KG Faltante', field: 'cuanto_falto_kg', color: '#f87171' },
                    { label: '✅ MT Cumplido', field: 'brush_mt_cumplido', color: '#4ade80' },
                    { label: '⚠️ MT Faltante', field: 'cuanto_falto_mt', color: '#f87171' },
                    { label: '💰 Faltante en $', field: 'cuanto_falto_dinero', color: '#f87171', text: true },
                    { label: '💬 Mensaje Destacado (Panel)', field: 'mensaje_personalizado', text: true },
                  ].map((f: any) => (
                    <div key={f.field} style={styles.formGroup}>
                      <label style={{ ...styles.label, color: f.color || '#94a3b8' }}>{f.label}</label>
                      <input
                        style={{ ...styles.input, borderColor: f.color ? `${f.color}33` : '#334155' }}
                        type={f.text ? 'text' : 'number'}
                        value={formData.wholesaleData[f.field]}
                        onChange={e => set(f.field, e.target.value, true)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setIsDialogOpen(false)}>Cancelar</button>
              <button
                style={{ ...styles.btnPrimary, opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? 'Guardando...' : (formData._id ? 'Actualizar Mayorista' : 'Crear Mayorista')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WholesaleManagerWrapper() {
  return <WholesaleManager />
}
