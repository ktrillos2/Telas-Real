import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useFormValue, useClient } from 'sanity'
import {
  calculateFabricProgress,
  MONTH_NAMES,
  getCurrentMonthName,
  getCurrentYear,
  MonthName,
  FabricProgressResult,
  roundTo
} from '../../lib/wholesale/fabricCalculator'

export function WholesaleProgressEditor() {
  const sanityClient = useClient({ apiVersion: '2024-01-01' })

  // Leer datos del documento clienteMayorista actual en Sanity
  const docId = useFormValue(['_id']) as string | undefined
  const clienteNombre = useFormValue(['nombre']) as string | undefined
  const objetivoKg = Number(useFormValue(['objetivoMensual', 'kg']) || 0)
  const acuerdoKgPrecio = Number(useFormValue(['acuerdoKgPrecio']) || 37950)
  const historialMeses = (useFormValue(['meses']) as any[]) || []

  // Estado del mes seleccionado
  const [selectedMonth, setSelectedMonth] = useState<MonthName>(getCurrentMonthName())
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear())
  const [rendimiento, setRendimiento] = useState<number>(3.3)
  const [kgInput, setKgInput] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // Cargar rendimiento global desde fabricSettings
  useEffect(() => {
    let isMounted = true
    sanityClient
      .fetch(`*[_type == "fabricSettings"][0].rendimientoKgMetro`)
      .then((val) => {
        if (isMounted && typeof val === 'number' && val > 0) {
          setRendimiento(val)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [sanityClient])

  // Cargar los KG del mes seleccionado desde el historial existente
  useEffect(() => {
    const existingRecord = historialMeses.find(
      (m: any) => String(m.mes).toUpperCase() === selectedMonth && Number(m.anio) === selectedYear
    )
    if (existingRecord && typeof existingRecord.kgCumplido === 'number') {
      setKgInput(String(existingRecord.kgCumplido))
    } else {
      setKgInput('0')
    }
    setStatusMessage(null)
  }, [selectedMonth, selectedYear, historialMeses])

  // Cálculo en tiempo real
  const currentCalculations: FabricProgressResult = useMemo(() => {
    const numericKg = Math.max(0, Number(kgInput) || 0)
    return calculateFabricProgress({
      objetivoKg,
      kgCumplido: numericKg,
      rendimiento,
      precioKg: acuerdoKgPrecio,
    })
  }, [objetivoKg, kgInput, rendimiento, acuerdoKgPrecio])

  // Guardar progreso e invocar sincronización bidireccional
  const handleSave = useCallback(async () => {
    if (!docId) {
      setStatusMessage({ type: 'error', text: 'Guarda primero el documento en Sanity antes de registrar meses.' })
      return
    }

    const cleanId = docId.replace(/^drafts\./, '')
    const numericKg = Math.max(0, Number(kgInput) || 0)

    setIsSaving(true)
    setStatusMessage({ type: 'info', text: 'Calculando en backend y sincronizando con Google Sheets...' })

    try {
      const res = await fetch('/api/sync/sanity-to-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cleanId,
          mes: selectedMonth,
          anio: selectedYear,
          kgCumplido: numericKg,
          usuario: 'Sanity Studio Admin',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al sincronizar con Google Sheets')
      }

      const sheetsAviso = data.sheetsUpdated
        ? '✓ Google Sheets actualizado'
        : '⚠️ Guardado en Sanity (Google Sheets pendiente de conectar)'

      setStatusMessage({
        type: 'success',
        text: `¡Progreso guardado con éxito! ${sheetsAviso}. Cumplimiento: ${data.calculations?.cumplimiento || currentCalculations.cumplimiento}.`,
      })
    } catch (err: any) {
      console.error('[WholesaleProgressEditor] Error:', err)
      setStatusMessage({
        type: 'error',
        text: `Error: ${err.message || 'No se pudo guardar el progreso'}`,
      })
    } finally {
      setIsSaving(false)
    }
  }, [docId, kgInput, selectedMonth, selectedYear, currentCalculations.cumplimiento])

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #1e293b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginTop: '12px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Cabecera ERP */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155',
          paddingBottom: '16px',
          marginBottom: '20px',
          gap: '12px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#38bdf8',
              fontWeight: 700,
            }}
          >
            ERP Seguimiento Mayorista Telas Real
          </span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
            CLIENTE: {clienteNombre || 'Sin Nombre Definido'}
          </h3>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Objetivo Mensual</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
            {objetivoKg.toLocaleString()} KG
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
              (~{roundTo(objetivoKg * rendimiento, 1).toLocaleString()} MT)
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Mes y Año */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
          backgroundColor: '#1e293b',
          padding: '16px',
          borderRadius: '12px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            MES A EDITAR
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value as MonthName)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {MONTH_NAMES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            AÑO
          </label>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value) || getCurrentYear())}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            RENDIMIENTO CENTRAL
          </label>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#0284c715',
              border: '1px solid #0284c740',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            1 KG = {rendimiento} Metros (Global)
          </div>
        </div>
      </div>

      {/* Input Único Editable: KG ENTREGADOS */}
      <div
        style={{
          backgroundColor: '#0284c710',
          border: '2px solid #0284c780',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.02em' }}>
            ✏️ KG ENTREGADOS / CUMPLIDOS ({selectedMonth} {selectedYear})
          </label>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Único campo editable por el administrador</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="number"
            step="0.1"
            min="0"
            value={kgInput}
            onChange={(e) => setKgInput(e.target.value)}
            placeholder="Escribe los KG entregados en el mes..."
            style={{
              flex: 1,
              padding: '14px 16px',
              backgroundColor: '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '1.4rem',
              fontWeight: 800,
              outline: 'none',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)',
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '14px 24px',
              backgroundColor: isSaving ? '#475569' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            }}
          >
            {isSaving ? '⏳ Guardando...' : '💾 GUARDAR PROGRESO'}
          </button>
        </div>
      </div>

      {/* Grid de Cálculos Automáticos (Readonly) */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          ⚡ Cálculos Automáticos en Tiempo Real (Solo Lectura)
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Metros cumplidos */}
          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
              Metros Cumplidos
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
              {currentCalculations.mtCumplido.toLocaleString()} MT
            </span>
          </div>

          {/* Faltante KG */}
          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
              Faltante en KG
            </span>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: currentCalculations.faltanteKg > 0 ? '#f87171' : '#10b981',
              }}
            >
              {currentCalculations.faltanteKg.toLocaleString()} KG
            </span>
          </div>

          {/* Faltante MT */}
          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
              Faltante en Metros
            </span>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: currentCalculations.faltanteMt > 0 ? '#f87171' : '#10b981',
              }}
            >
              {currentCalculations.faltanteMt.toLocaleString()} MT
            </span>
          </div>

          {/* Dinero facturado / estimado */}
          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
              Total Valor ($)
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
              ${currentCalculations.dinero.toLocaleString()}
            </span>
          </div>

          {/* Cumplimiento Badge */}
          <div
            style={{
              backgroundColor: currentCalculations.cumplimiento === 'SI' ? '#065f4630' : '#88133730',
              border: `1px solid ${currentCalculations.cumplimiento === 'SI' ? '#10b981' : '#f43f5e'}`,
              padding: '14px',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', display: 'block' }}>
              Cumplimiento ({currentCalculations.porcentaje}%)
            </span>
            <span
              style={{
                fontSize: '1.3rem',
                fontWeight: 900,
                color: currentCalculations.cumplimiento === 'SI' ? '#34d399' : '#fb7185',
              }}
            >
              {currentCalculations.cumplimiento === 'SI' ? '✅ SI' : '❌ NO'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback / Alertas */}
      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            backgroundColor:
              statusMessage.type === 'success'
                ? '#065f4640'
                : statusMessage.type === 'error'
                ? '#88133740'
                : '#0284c720',
            border: `1px solid ${
              statusMessage.type === 'success'
                ? '#10b981'
                : statusMessage.type === 'error'
                ? '#f43f5e'
                : '#38bdf8'
            }`,
            color:
              statusMessage.type === 'success'
                ? '#a7f3d0'
                : statusMessage.type === 'error'
                ? '#fecdd3'
                : '#bae6fd',
          }}
        >
          {statusMessage.text}
        </div>
      )}
    </div>
  )
}
