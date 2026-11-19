import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import * as XLSX from 'xlsx'
import { matchPriceRow, type PriceListRow } from '../../lib/volume-pricing'

/**
 * Herramienta "Precios por volumen": muestra qué productos usan cada referencia de la lista, marca los
 * productos sin precio por volumen y las referencias que no están en la web, permite pasar el precio
 * Retail de la lista al precio web del producto e importar una lista nueva desde Excel.
 */

const cop = (n?: number | null) => (n ? `$${Math.round(Number(n)).toLocaleString('es-CO')}` : '—')
const box: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: 'white', marginBottom: 20 }
const h2: React.CSSProperties = { margin: '0 0 10px', fontSize: '1.05rem', color: '#111827' }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: 'white', border: 'none', borderRadius: 6, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14 })

const editLink = (id: string, type: string) => `/admin/intent/edit/id=${encodeURIComponent(id.replace(/^drafts\./, ''))};type=${type}`
const normKey = (name: string, tipo: string) => `${String(name).trim().toUpperCase()}|${tipo}`
const tipoKey = (t: string) => {
  const v = String(t || '').trim().toUpperCase()
  return v === 'SUBLIMADO' ? 'sublimado' : v === 'CRUDO' ? 'crudo' : v === 'BLANCO' ? 'blanco' : 'colores'
}

export function VolumePricingTool() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [rows, setRows] = useState<(PriceListRow & { _id: string; sheetStatus?: string; notes?: string })[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [importPreview, setImportPreview] = useState<any[] | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await client.fetch(`{
      "rows": *[_type == "priceListItem" && !(_id in path("drafts.**"))] | order(name asc){
        _id, reference, name, tipo, yieldPerKg, retail, medio, alto, premium, matchTerms, isActive, sheetStatus, notes,
        "extraProductIds": extraProducts[]._ref, "excludedProductIds": excludedProducts[]._ref
      },
      "products": *[_type == "product" && !(_id in path("drafts.**")) && !(title match "*hilo*" || title match "*tijera*")] | order(title asc){
        _id, title, "slug": slug.current, price, salePrice, stockStatus, designSelectionEnabled
      }
    }`)
    setRows(data.rows || [])
    setProducts(data.products || [])
    setLoading(false)
  }, [client])

  useEffect(() => {
    load().catch((e) => {
      setMessage(`Error cargando: ${e?.message || e}`)
      setLoading(false)
    })
  }, [load])

  const analysis = useMemo(() => {
    const byRow = new Map<string, any[]>()
    const missing: any[] = []
    const diffs: Array<{ product: any; row: any }> = []
    for (const p of products) {
      const row = matchPriceRow(rows as PriceListRow[], { id: p._id, name: p.title, slug: p.slug, isSublimated: !!p.designSelectionEnabled })
      if (!row) {
        missing.push(p)
        continue
      }
      const id = (row as any)._id
      if (!byRow.has(id)) byRow.set(id, [])
      byRow.get(id)!.push(p)
      if (row.retail && Number(p.price) !== Number(row.retail)) diffs.push({ product: p, row })
    }
    const noProducts = rows.filter((r) => !byRow.has(r._id))
    const incomplete = rows.filter((r) => !r.yieldPerKg || !r.medio)
    return { byRow, missing, diffs, noProducts, incomplete }
  }, [rows, products])

  const applyRetail = async (list: Array<{ product: any; row: any }>) => {
    if (!list.length) return
    if (!window.confirm(`Se cambiará el precio web de ${list.length} producto(s) al precio Retail de la lista. ¿Continuar?`)) return
    setBusy(true)
    try {
      for (let i = 0; i < list.length; i += 50) {
        const tx = client.transaction()
        list.slice(i, i + 50).forEach(({ product, row }) => tx.patch(product._id, (p) => p.set({ price: row.retail })))
        await tx.commit()
      }
      setMessage(`✅ Se actualizó el precio web de ${list.length} producto(s).`)
      await load()
    } catch (e: any) {
      setMessage(`Error: ${e?.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (file: File) => {
    setMessage('')
    const wb = XLSX.read(await file.arrayBuffer())
    const sheetName = wb.SheetNames.find((n) => /recomendaci/i.test(n)) || wb.SheetNames[0]
    const sheet = wb.Sheets[sheetName]
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true })
    const headerIdx = data.findIndex((r) => String(r?.[0] || '').trim() === 'Referencia' && String(r?.[1] || '').trim() === 'Producto')
    if (headerIdx < 0) {
      setMessage('No se encontró la hoja con columnas "Referencia", "Producto", "Tipo"… (formato RECOMENDACIÓN WEB).')
      return
    }
    const num = (v: any) => (typeof v === 'number' && v > 0 ? Math.round(v) : undefined)
    const existing = new Map(rows.map((r) => [normKey(r.name, r.tipo), r]))
    const preview = data
      .slice(headerIdx + 1)
      .filter((r) => r && r[1])
      .map((r) => {
        const tipo = tipoKey(r[2])
        const item = {
          reference: String(r[0] || '').trim(),
          name: String(r[1]).trim(),
          tipo,
          yieldPerKg: typeof r[3] === 'number' ? r[3] : undefined,
          retail: num(r[12]),
          medio: num(r[13]),
          alto: num(r[14]),
          premium: num(r[15]),
          sheetStatus: String(r[23] || '').trim() || undefined,
        }
        const current = existing.get(normKey(item.name, tipo))
        return { ...item, currentId: current?._id, current }
      })
    setImportPreview(preview)
  }

  const applyImport = async () => {
    if (!importPreview) return
    setBusy(true)
    try {
      const tx = client.transaction()
      for (const it of importPreview) {
        const fields = { reference: it.reference, yieldPerKg: it.yieldPerKg, retail: it.retail, medio: it.medio, alto: it.alto, premium: it.premium, sheetStatus: it.sheetStatus }
        const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== ''))
        if (it.currentId) {
          tx.patch(it.currentId, (p) => p.set(clean))
        } else {
          tx.create({
            _type: 'priceListItem',
            isActive: true,
            name: it.name,
            tipo: it.tipo,
            matchTerms: it.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[̀-ͯ]/g, '')
              .split(/[^a-z0-9]+/)
              .filter((w: string) => w && !['de', 'del', 'la', 'colores', 'sublimado'].includes(w)),
            ...clean,
          })
        }
      }
      await tx.commit()
      setMessage(`✅ Lista importada: ${importPreview.filter((i) => i.currentId).length} actualizadas, ${importPreview.filter((i) => !i.currentId).length} nuevas.`)
      setImportPreview(null)
      await load()
    } catch (e: any) {
      setMessage(`Error importando: ${e?.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div style={{ padding: 32 }}>Cargando lista de precios…</div>

  const { byRow, missing, diffs, noProducts, incomplete } = analysis

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', fontFamily: 'inherit', background: '#f9fafb', minHeight: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 6px' }}>Precios por volumen</h1>
      <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14 }}>
        Cada referencia tiene precio por metro en 4 niveles según los kilos del pedido (metros ÷ rendimiento). Los rangos de kilos se cambian en
        Catálogo → Precios por volumen → Configuración. Cada referencia se edita en Catálogo → Precios por volumen → Referencias.
      </p>

      {message && <div style={{ ...box, background: message.startsWith('✅') ? '#ecfdf5' : '#fef2f2' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          ['Referencias en la lista', rows.length, '#111827'],
          ['Productos con precio por volumen', products.length - missing.length, '#047857'],
          ['Productos SIN precio por volumen', missing.length, missing.length ? '#b91c1c' : '#047857'],
          ['Referencias sin producto en la web', noProducts.length, '#b45309'],
          ['Precio web distinto al Retail', diffs.length, diffs.length ? '#b45309' : '#047857'],
        ].map(([label, value, color]) => (
          <div key={label as string} style={{ ...box, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: color as string }}>{value as number}</div>
          </div>
        ))}
      </div>

      <div style={box}>
        <h2 style={h2}>🔴 Productos sin precio por volumen ({missing.length})</h2>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6b7280' }}>
          No coinciden con ninguna referencia de la lista. Asígnalos en la referencia correcta (“Productos asignados a mano”) o agrégalos a la lista.
        </p>
        {missing.length === 0 ? (
          <p style={{ margin: 0, color: '#047857' }}>Todos los productos tienen precio por volumen.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Producto</th><th style={th}>Precio web</th><th style={th}>Estado</th></tr></thead>
            <tbody>
              {missing.map((p) => (
                <tr key={p._id}>
                  <td style={td}><a href={editLink(p._id, 'product')} style={{ color: '#1d4ed8' }}>{p.title}</a></td>
                  <td style={td}>{cop(p.price)}</td>
                  <td style={td}>{p.stockStatus === 'outOfStock' ? 'Agotado' : 'Disponible'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={box}>
        <h2 style={h2}>🟠 Precio web distinto al Retail de la lista ({diffs.length})</h2>
        {diffs.length > 0 && (
          <>
            <button style={btn('#2563eb')} disabled={busy} onClick={() => applyRetail(diffs)}>
              {busy ? 'Actualizando…' : `Pasar el precio Retail de la lista a los ${diffs.length} productos`}
            </button>
            <div style={{ maxHeight: 360, overflow: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Producto</th><th style={th}>Referencia</th><th style={th}>Precio web actual</th><th style={th}>Retail lista</th></tr></thead>
                <tbody>
                  {diffs.map(({ product, row }) => (
                    <tr key={product._id}>
                      <td style={td}><a href={editLink(product._id, 'product')} style={{ color: '#1d4ed8' }}>{product.title}</a></td>
                      <td style={td}>{row.name} · {row.tipo}</td>
                      <td style={td}>{cop(product.price)}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{cop(row.retail)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div style={box}>
        <h2 style={h2}>Referencias de la lista</h2>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Referencia</th><th style={th}>Tipo</th><th style={th}>m/kg</th><th style={th}>Retail</th><th style={th}>Medio</th>
                <th style={th}>Alto</th><th style={th}>Premium</th><th style={th}>Productos</th><th style={th}>Aviso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const n = byRow.get(r._id)?.length || 0
                const warn = !r.yieldPerKg ? 'Sin rendimiento' : !r.medio ? 'Solo precio Retail' : n === 0 ? 'No está en la web' : ''
                return (
                  <tr key={r._id} style={{ background: warn ? '#fffbeb' : undefined }}>
                    <td style={td}><a href={editLink(r._id, 'priceListItem')} style={{ color: '#1d4ed8' }}>{r.name}</a></td>
                    <td style={td}>{r.tipo}</td>
                    <td style={td}>{r.yieldPerKg || '—'}</td>
                    <td style={td}>{cop(r.retail)}</td>
                    <td style={td}>{cop(r.medio)}</td>
                    <td style={td}>{cop(r.alto)}</td>
                    <td style={td}>{cop(r.premium)}</td>
                    <td style={{ ...td, fontWeight: 600, color: n ? '#047857' : '#b45309' }}>{n}</td>
                    <td style={{ ...td, color: '#b45309' }}>{warn}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '10px 0 0' }}>
          {incomplete.length} referencias sin rendimiento o solo con precio Retail: no generan descuento por volumen hasta completarlas.
        </p>
      </div>

      <div style={box}>
        <h2 style={h2}>Importar una lista nueva (Excel)</h2>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6b7280' }}>
          Sube el Excel con la hoja “RECOMENDACIÓN WEB” (mismas columnas). Se actualizan los precios y rendimientos de las referencias existentes y se crean las nuevas.
        </p>
        <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {importPreview && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13 }}>
              {importPreview.length} referencias leídas: {importPreview.filter((i) => i.currentId).length} se actualizan,{' '}
              {importPreview.filter((i) => !i.currentId).length} son nuevas.
            </p>
            <button style={btn('#047857')} disabled={busy} onClick={applyImport}>{busy ? 'Importando…' : 'Aplicar lista'}</button>{' '}
            <button style={btn('#6b7280')} disabled={busy} onClick={() => setImportPreview(null)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}
