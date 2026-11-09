import React, { useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import { LayoutGrid } from 'lucide-react'

/**
 * Panel de la herramienta "Diseños Sublimados": agrega los diseños seleccionados como tarjetas
 * de una Colección Comercial (ej. "Telas para Navidad"), apuntando a la tela sublimada elegida.
 * No crea productos ni duplica inventario: cada tarjeta enlaza a la ficha con el diseño preseleccionado.
 */

const SUBLIMATED_FILTER =
  '_type == "product" && !(_id in path("drafts.**")) && (designSelectionEnabled == true || title match "*sublimad*" || count(categories[@->slug.current match "*sublimad*"]) > 0)'

const norm = (s?: string) => (s || '').toLowerCase().replace(/\*/g, ' ').replace(/\s+/g, ' ').trim()
const bareId = (id: string) => id.replace(/^drafts\./, '')
const randomKey = () => Math.random().toString(36).slice(2, 12)

interface Props {
  selectedIds: string[]
  designs: any[]
}

export function AddToCollectionPanel({ selectedIds, designs }: Props) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [collections, setCollections] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [collectionId, setCollectionId] = useState('')
  const [productId, setProductId] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const load = async () => {
    const [cols, prods] = await Promise.all([
      client.fetch(
        `*[_type == "commercialCollection"] | order(coalesce(homeOrder, 99) asc, _createdAt desc){ _id, title, isActive, "count": count(items) }`
      ),
      client.fetch(`*[${SUBLIMATED_FILTER}] | order(title asc){ _id, title, designCategory, customDesignCategory }`),
    ])
    // Si existe borrador y publicado del mismo documento, se muestra una sola vez (se trabaja sobre el borrador)
    const byId = new Map<string, any>()
    for (const c of cols || []) {
      const id = bareId(c._id)
      const isDraft = c._id.startsWith('drafts.')
      const existing = byId.get(id)
      const base = isDraft || !existing ? c : existing
      byId.set(id, { ...base, baseId: id, hasDraft: isDraft || !!existing?.hasDraft })
    }
    setCollections(Array.from(byId.values()))
    setProducts(prods || [])
  }

  useEffect(() => {
    load().catch((e) => console.error('AddToCollectionPanel load', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => {
    const ids = new Set(selectedIds.map(bareId))
    const seen = new Set<string>()
    return designs.filter((d) => {
      const id = bareId(d._id)
      if (!ids.has(id) || seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [selectedIds, designs])

  // Sugiere la tela cuya categoría de diseños coincide con la de los diseños seleccionados
  useEffect(() => {
    if (productId || selected.length === 0 || products.length === 0) return
    const counts = new Map<string, number>()
    for (const d of selected) counts.set(norm(d.category), (counts.get(norm(d.category)) || 0) + 1)
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const match = products.find((p) => top && [norm(p.designCategory), norm(p.customDesignCategory)].includes(top))
    if (match) setProductId(match._id)
  }, [selected, products, productId])

  const handleAdd = async () => {
    setMessage(null)
    const col = collections.find((c) => c.baseId === collectionId)
    if (!col || !productId || selected.length === 0) return
    setSaving(true)
    try {
      // Se edita el borrador si lo hay (lo que el admin está viendo); si no, el documento publicado
      const targetId = col.hasDraft ? `drafts.${col.baseId}` : col.baseId
      const current = await client.fetch(`*[_id == $id][0]{ "items": items[]{ "p": product._ref, "d": design._ref } }`, { id: targetId })
      const existing = new Set((current?.items || []).map((i: any) => `${i.p}|${i.d}`))
      const newItems = selected
        .filter((d) => !existing.has(`${productId}|${bareId(d._id)}`))
        .map((d) => ({
          _key: randomKey(),
          _type: 'collectionItem',
          kind: 'design',
          product: { _type: 'reference', _ref: productId, _weak: true },
          design: { _type: 'reference', _ref: bareId(d._id), _weak: true },
          ...(subtitle.trim() ? { subtitle: subtitle.trim() } : {}),
        }))
      const skipped = selected.length - newItems.length
      if (newItems.length > 0) {
        await client.patch(targetId).setIfMissing({ items: [] }).append('items', newItems).commit()
      }
      setMessage({
        ok: true,
        text: `Se agregaron ${newItems.length} tarjeta(s) a "${col.title}"${skipped ? ` (${skipped} ya estaban)` : ''}.${
          col.hasDraft ? ' La colección tiene cambios sin publicar: ábrela y pulsa "Publish".' : ' Ya están en la web.'
        }`,
      })
      await load()
    } catch (e: any) {
      console.error(e)
      setMessage({ ok: false, text: `No se pudo agregar: ${e?.message || e}` })
    } finally {
      setSaving(false)
    }
  }

  const disabled = saving || !collectionId || !productId || selected.length === 0
  const field: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
    color: '#111827', backgroundColor: 'white', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase',
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', backgroundColor: 'white', marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LayoutGrid size={18} /> Agregar a una Colección Comercial
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#6b7280' }}>
        Selecciona diseños en la lista y agrégalos como tarjetas (ej. "Telas para Navidad"). Cada tarjeta lleva a la tela elegida con ese
        diseño ya seleccionado. El orden, los títulos y las fotos se ajustan en "Promociones y Eventos → Colecciones Comerciales".
      </p>

      {collections.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#92400e', backgroundColor: '#fffbeb', padding: '10px 12px', borderRadius: '6px', margin: 0 }}>
          Primero crea una colección en "Promociones y Eventos → Colecciones Comerciales".
        </p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={label}>Colección</label>
              <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} style={field}>
                <option value="">Elegir colección…</option>
                {collections.map((c) => (
                  <option key={c.baseId} value={c.baseId}>
                    {c.title || 'Sin nombre'} ({c.count || 0} tarjetas){c.isActive === false ? ' · inactiva' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Tela sublimada</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} style={field}>
                <option value="">Elegir tela…</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Texto pequeño (opcional)</label>
              <input
                type="text"
                value={subtitle}
                placeholder="Vacío = nombre de la tela"
                onChange={(e) => setSubtitle(e.target.value)}
                style={field}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: selected.length ? '#1e40af' : '#6b7280' }}>
              {selected.length} diseño(s) seleccionados
            </span>
            <button
              onClick={handleAdd}
              disabled={disabled}
              style={{
                backgroundColor: '#15803d', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none',
                fontSize: '0.95rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
              }}
            >
              {saving ? 'Agregando…' : 'Agregar a la colección'}
            </button>
          </div>
        </>
      )}

      {message && (
        <p
          style={{
            margin: '14px 0 0', fontSize: '0.85rem', padding: '10px 12px', borderRadius: '6px',
            color: message.ok ? '#065f46' : '#991b1b', backgroundColor: message.ok ? '#ecfdf5' : '#fef2f2',
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
