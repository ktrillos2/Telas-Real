import React, { useState, useEffect } from 'react'
import { useClient } from 'sanity'

const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

const styles: Record<string, any> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '32px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    maxWidth: 1100,
    margin: '0 auto',
    background: '#1e293b',
    borderRadius: 16,
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    border: '1px solid #334155',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '28px 32px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  btnGhost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnDanger: {
    background: 'transparent',
    color: '#f87171',
    border: '1px solid #ef4444',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  body: {
    padding: '28px 32px',
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
    padding: '14px 16px',
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
    fontSize: 14,
    verticalAlign: 'middle' as const,
  },
  badge: (color: string) => ({
    display: 'inline-block',
    background: color === 'green' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
    color: color === 'green' ? '#4ade80' : '#f87171',
    border: `1px solid ${color === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 13,
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
  // Dialog
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
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
    padding: '22px 28px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  dialogBody: {
    padding: '28px',
    maxHeight: '78vh',
    overflowY: 'auto' as const,
  },
  dialogFooter: {
    padding: '16px 28px',
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
    letterSpacing: '0.04em',
  },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    color: '#f1f5f9',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  accentBox: {
    background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 12,
    padding: 20,
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
  
  // Quick Update State
  const CURRENT_MONTH = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  const [quickUpdateUser, setQuickUpdateUser] = useState<any>(null)
  const [quickUpdateData, setQuickUpdateData] = useState<any>({
    mes: CURRENT_MONTH,
    kg_agregados: 0
  })

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
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

  useEffect(() => { fetchUsers() }, [])

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
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>CRM Clientes Mayoristas</h1>
            <p style={styles.headerSub}>Gestiona todos tus clientes corporativos desde un solo lugar</p>
          </div>
          <button style={styles.btnPrimary} onClick={openCreate}>+ Crear Nuevo Mayorista</button>
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
                  {['Razón Social', 'Cédula / NIT', 'Progreso Mensual (KG)', 'KG Faltante', ''].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={styles.emptyRow}>Cargando...</td></tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ ...styles.emptyRow, background: '#0f172a', padding: 48 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                        <div style={{ color: '#475569', fontSize: 15 }}>No hay clientes mayoristas registrados aún.</div>
                        <div style={{ color: '#334155', fontSize: 13, marginTop: 6 }}>Haz clic en "Crear Nuevo Mayorista" para comenzar.</div>
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

      {/* QUICK UPDATE DIALOG */}
      {quickUpdateUser && (
        <div style={styles.overlay} onClick={() => setQuickUpdateUser(null)}>
          <div style={{...styles.dialog, maxWidth: 400}} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>Actualizar Progreso Rápidamente</h2>
            </div>
            <div style={{ padding: '24px' }}>
              
              {/* HISTORIAL PREVIO */}
              {quickUpdateUser?.wholesaleData?.historial_meses?.length > 0 && (
                <div style={{ marginBottom: 24, padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>Historial Registrado</h3>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '13px', color: '#e2e8f0', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Mes</th>
                          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Kilos</th>
                          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Faltan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quickUpdateUser.wholesaleData.historial_meses.map((h: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '6px 8px' }}>{h.mes}</td>
                            <td style={{ textAlign: 'right', padding: '6px 8px' }}>{h.kg} KG</td>
                            <td style={{ textAlign: 'right', padding: '6px 8px', color: h.falta_kg <= 0 ? '#4ade80' : '#f87171' }}>{h.falta_kg <= 0 ? 'Meta ✓' : `${h.falta_kg} KG`}</td>
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
                    style={{...styles.input, backgroundColor: '#1A202C'}}
                    value={quickUpdateData.mes}
                    onChange={e => setQuickUpdateData({...quickUpdateData, mes: e.target.value})}
                  >
                    {['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Añadir Kilos (KG)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{color: '#9CA3AF'}}>+</span>
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="Ej: 50"
                      value={quickUpdateData.kg_agregados || ""}
                      onChange={e => setQuickUpdateData({...quickUpdateData, kg_agregados: e.target.value})}
                    />
                  </div>
                  <p style={{fontSize: '12px', color: '#9CA3AF', marginTop: '6px', lineHeight: '1.4'}}>
                    Se sumarán {quickUpdateData.kg_agregados || 0} KG al mes de {quickUpdateData.mes}. Los metros y dinero se calcularán automáticamente.
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
          <div style={{...styles.dialog, maxWidth: 500}} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>⚠️ Confirmar Eliminación</h2>
            </div>
            <div style={styles.dialogBody}>
              <p style={{ color: '#e2e8f0', fontSize: 15 }}>
                ¿Estás seguro de que deseas eliminar permanentemente a <strong>{userToDelete.name}</strong>?
              </p>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>
                Esta acción no se puede deshacer y borrará todo su progreso e historial.
              </p>
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setUserToDelete(null)}>Cancelar</button>
              <button
                style={{ ...styles.btnDanger, background: 'rgba(239,68,68,0.1)' }}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar mayorista'}
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
              {/* Section 1 */}
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

              {/* Section 2 */}
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

              {/* Section 3 */}
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

              {/* Section 4 */}
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
