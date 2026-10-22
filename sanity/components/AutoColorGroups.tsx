import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useClient } from 'sanity';
import { Layers, RefreshCw, CheckCircle, AlertTriangle, X, Check } from 'lucide-react';
import { colorGroupKey, colorNameInGroup, suggestColorGroup } from '../../lib/color-groups';
import { findUnifiedFabricConfig } from '../../lib/unified-fabrics';

/**
 * Agrupar Colores: une en una sola ficha los colores de una misma tela (ej. "Jacquard Fit Negro",
 * "Jacquard Fit Azul") usando el nombre del producto. Guarda el campo `colorGroup`.
 *
 * No toca: telas que ya se agrupan por configuración fija (Brush, Satín, Rib...), sublimados,
 * hilos, tijeras y telas de un solo color.
 */

type Row = {
  _id: string;
  title?: string;
  slug?: string;
  colorGroup?: string;
  stockStatus?: string;
  stock_status?: string;
  tones?: string[];
  thumb?: string;
  designSelectionEnabled?: boolean;
  hasDraft?: boolean;
};

type Proposal = { key: string; group: string; members: Array<Row & { color: string }> };

const Card = ({ children, style = {} }: any) => (
  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', ...style }}>
    {children}
  </div>
);

const btn = (bg: string, color = 'white'): React.CSSProperties => ({
  background: bg, color, border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
});

const isOut = (r: Row) => [r.stockStatus, r.stock_status].some((s) => String(s || '').toLowerCase() === 'outofstock');

export function AutoColorGroups() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  // Nombre editado por grupo propuesto y productos desmarcados
  const [names, setNames] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});
  const [showSingles, setShowSingles] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: Row[] = await client.fetch(`*[_type == "product" && !(_id in path("drafts.**"))] | order(title asc) {
        _id, title, "slug": slug.current, colorGroup, stockStatus, stock_status, designSelectionEnabled,
        "tones": tones[]->title,
        "thumb": images[0].asset->url + "?w=80&h=80&fit=crop&auto=format",
        "hasDraft": defined(*[_id == "drafts." + ^._id][0]._id)
      }`);
      setRows(data || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: `No se pudieron cargar los productos: ${err?.message || err}` });
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { load(); }, [load]);

  // Productos que maneja este sistema (no los de configuración fija, ni sublimados/hilos/tijeras)
  const candidates = useMemo(
    () => rows.filter((r) => r.slug && !r.designSelectionEnabled && !findUnifiedFabricConfig(r.slug)),
    [rows]
  );

  const { proposals, singles, current } = useMemo(() => {
    const byKey = new Map<string, Proposal>();
    const noColor: Row[] = [];
    for (const r of candidates) {
      const s = suggestColorGroup(r.title, r.tones || []);
      if (!s) { noColor.push(r); continue; }
      const key = colorGroupKey(s.group);
      if (!byKey.has(key)) byKey.set(key, { key, group: s.group, members: [] });
      byKey.get(key)!.members.push({ ...r, color: s.color });
    }
    const all = Array.from(byKey.values());
    const multi = all.filter((p) => p.members.length >= 2);
    const single = [...all.filter((p) => p.members.length < 2).flatMap((p) => p.members), ...noColor];
    // Pendientes: grupos donde algún producto aún no tiene ese colorGroup
    const pending = multi.filter((p) => p.members.some((m) => colorGroupKey(m.colorGroup) !== p.key));

    const currentMap = new Map<string, Row[]>();
    for (const r of rows) {
      if (!r.colorGroup?.trim()) continue;
      const k = colorGroupKey(r.colorGroup);
      if (!currentMap.has(k)) currentMap.set(k, []);
      currentMap.get(k)!.push(r);
    }
    return { proposals: pending, singles: single, current: Array.from(currentMap.entries()) };
  }, [candidates, rows]);

  const patchGroup = async (items: Row[], value: string | null) => {
    const tx = client.transaction();
    for (const r of items) {
      const ids = [r._id, ...(r.hasDraft ? [`drafts.${r._id}`] : [])];
      for (const id of ids) {
        tx.patch(id, (p) => (value ? p.set({ colorGroup: value }) : p.unset(['colorGroup'])));
      }
    }
    await tx.commit();
  };

  const applyProposals = async (list: Proposal[]) => {
    setSaving(true);
    setMessage(null);
    try {
      let count = 0;
      for (const p of list) {
        const name = (names[p.key] ?? p.group).trim();
        const members = p.members.filter((m) => !excluded[m._id]);
        if (!name || members.length < 2) continue;
        await patchGroup(members, name);
        count += members.length;
      }
      setMessage({ type: 'ok', text: `Listo: ${count} productos agrupados. La tienda se actualiza en unos minutos.` });
      await load();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error al guardar: ${err?.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  const removeFromGroup = async (items: Row[], label: string) => {
    if (!confirm(`¿Quitar ${items.length === 1 ? `"${items[0].title}"` : `los ${items.length} productos`} del grupo "${label}"?`)) return;
    setSaving(true);
    setMessage(null);
    try {
      await patchGroup(items, null);
      setMessage({ type: 'ok', text: 'Grupo actualizado.' });
      await load();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error al guardar: ${err?.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  const Thumb = ({ r }: { r: Row }) =>
    r.thumb ? (
      <img src={r.thumb} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e2e8f0', flexShrink: 0 }} />
    );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100%', color: '#0f172a', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={22} /> Agrupar Colores</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13, maxWidth: 720 }}>
              Une en una sola ficha los colores de una misma tela según el nombre (ej. "Jacquard Fit Negro" y "Jacquard Fit Azul" → "Jacquard Fit").
              No toca Brush, Satín, Rib y demás telas que ya se agrupan, ni sublimados, hilos, tijeras o telas de un solo color.
            </p>
          </div>
          <button style={btn('#e2e8f0', '#0f172a')} onClick={load} disabled={loading || saving}>
            <RefreshCw size={14} /> Recargar
          </button>
        </div>

        {message && (
          <Card style={{ padding: 12, background: message.type === 'ok' ? '#ecfdf5' : '#fef2f2', color: message.type === 'ok' ? '#065f46' : '#991b1b', display: 'flex', gap: 8, alignItems: 'center' }}>
            {message.type === 'ok' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {message.text}
          </Card>
        )}

        {loading ? (
          <Card>Cargando productos...</Card>
        ) : (
          <>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 17 }}>Grupos propuestos ({proposals.length})</h2>
                {proposals.length > 0 && (
                  <button style={btn('#059669')} disabled={saving} onClick={() => applyProposals(proposals)}>
                    <Check size={14} /> {saving ? 'Guardando...' : 'Aplicar todos'}
                  </button>
                )}
              </div>
              {proposals.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>No hay grupos nuevos para aplicar: todas las telas con varios colores ya están agrupadas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {proposals.map((p) => {
                    const selected = p.members.filter((m) => !excluded[m._id]).length;
                    return (
                      <div key={p.key} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                          <label style={{ fontSize: 12, color: '#64748b' }}>Nombre del grupo</label>
                          <input
                            value={names[p.key] ?? p.group}
                            onChange={(e) => setNames({ ...names, [p.key]: e.target.value })}
                            style={{ flex: '1 1 220px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, fontWeight: 600 }}
                          />
                          <span style={{ fontSize: 12, color: '#64748b' }}>{selected} colores</span>
                          <button style={btn('#2563eb')} disabled={saving || selected < 2} onClick={() => applyProposals([p])}>
                            Aplicar
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                          {p.members.map((m) => (
                            <label key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: 6, borderRadius: 8, background: excluded[m._id] ? '#f1f5f9' : '#f8fafc', opacity: excluded[m._id] ? 0.5 : 1, cursor: 'pointer' }}>
                              <input type="checkbox" checked={!excluded[m._id]} onChange={() => setExcluded({ ...excluded, [m._id]: !excluded[m._id] })} />
                              <Thumb r={m} />
                              <span style={{ minWidth: 0 }}>
                                <strong style={{ display: 'block' }}>{m.color}{isOut(m) ? ' · agotado' : ''}</strong>
                                <span style={{ color: '#64748b', wordBreak: 'break-word' }}>{m.title}</span>
                                {m.colorGroup && colorGroupKey(m.colorGroup) !== p.key && (
                                  <span style={{ display: 'block', color: '#b45309' }}>Hoy en el grupo "{m.colorGroup}"</span>
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>Grupos actuales ({current.length})</h2>
              {current.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Todavía no hay grupos guardados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {current.map(([key, items]) => {
                    const label = items[0].colorGroup || key;
                    return (
                      <div key={key} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <strong>{label} <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>· {items.length} {items.length === 1 ? 'producto (no se agrupa con uno solo)' : 'colores'}</span></strong>
                          <button style={btn('#fee2e2', '#991b1b')} disabled={saving} onClick={() => removeFromGroup(items, label)}>
                            Deshacer grupo
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {items.map((r) => (
                            <span key={r._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 999, padding: '3px 4px 3px 10px', fontSize: 12 }}>
                              {colorNameInGroup(r.title || '', label, r.title || '')}{isOut(r) ? ' (agotado)' : ''}
                              <button title="Quitar del grupo" onClick={() => removeFromGroup([r], label)} disabled={saving} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, display: 'inline-flex' }}>
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <button onClick={() => setShowSingles(!showSingles)} style={{ ...btn('transparent', '#0f172a'), padding: 0 }}>
                {showSingles ? '▾' : '▸'} Productos sin grupo ({singles.length}): un solo color o sin color reconocible en el nombre
              </button>
              {showSingles && (
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#475569', columns: 2 }}>
                  {singles.map((r) => <li key={r._id}>{r.title}</li>)}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
