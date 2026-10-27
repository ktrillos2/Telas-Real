import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SanityClient } from 'sanity';
import { Image as ImageIcon, RefreshCw, Trash2, Upload, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { SPEC_ALT_PREFIX, withSpecImage } from './BulkSpecSheetPanel';

/**
 * Fichas técnicas actuales: agrupa los productos por la imagen de ficha que tienen en sus fotos
 * (foto con texto alternativo "Ficha técnica …"). Permite reemplazar la imagen en todos los
 * productos que la usan de una vez, quitarla o revisar a qué productos está asignada.
 */

type SpecRow = { _id: string; title?: string; slug?: string; ref?: string; url?: string };
type SpecGroup = { ref: string; url: string; products: SpecRow[] };

const btn = (bg: string, disabled = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', border: 'none',
  backgroundColor: bg, color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
});

export function SpecSheetGallery({ client, onDone }: { client: SanityClient; onDone: () => void }) {
  const [rows, setRows] = useState<SpecRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<SpecGroup | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: SpecRow[] = await client.fetch(
        `*[_type == "product" && !(_id in path("drafts.**")) && count(images[string::startsWith(alt, $prefix)]) > 0] | order(title asc){
          _id, title, "slug": slug.current,
          "ref": images[string::startsWith(alt, $prefix)][0].asset._ref,
          "url": images[string::startsWith(alt, $prefix)][0].asset->url
        }`,
        { prefix: SPEC_ALT_PREFIX }
      );
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const groups = useMemo(() => {
    const map = new Map<string, SpecGroup>();
    for (const r of rows) {
      if (!r.ref) continue;
      if (!map.has(r.ref)) map.set(r.ref, { ref: r.ref, url: r.url || '', products: [] });
      map.get(r.ref)!.products.push(r);
    }
    const term = search.trim().toLowerCase();
    return Array.from(map.values())
      .filter((g) => !term || g.products.some((p) => `${p.title || ''} ${p.slug || ''}`.toLowerCase().includes(term)))
      .sort((a, b) => b.products.length - a.products.length);
  }, [rows, search]);

  /** Pone assetId (o nada si es null) como ficha en esos productos, publicado y borrador. */
  const applyToProducts = async (products: SpecRow[], assetId: string | null) => {
    const ids = products.map((p) => p._id);
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const docs: Array<{ _id: string; title?: string; images?: unknown }> = await client.fetch(
        `*[_id in $ids]{ _id, title, images }`,
        { ids: chunk.flatMap((id) => [id, `drafts.${id}`]) }
      );
      const tx = client.transaction();
      for (const doc of docs) {
        const images = withSpecImage(doc.images, assetId, `${SPEC_ALT_PREFIX} ${String(doc.title ?? '')}`.trim());
        tx.patch(doc._id, (p) => p.set({ images }));
      }
      if (docs.length > 0) await tx.commit();
    }
  };

  const handleReplaceFile = async (file: File) => {
    const group = replaceTarget.current;
    if (!group) return;
    if (!window.confirm(`Se reemplazará la ficha técnica en ${group.products.length} producto(s) por "${file.name}". ¿Continuar?`)) return;
    setBusy(group.ref);
    try {
      const asset = await client.assets.upload('image', file, { filename: file.name });
      await applyToProducts(group.products, asset._id);
      await load();
      onDone();
    } catch (err) {
      alert('Error al reemplazar la ficha: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(null);
      replaceTarget.current = null;
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async (group: SpecGroup, products: SpecRow[] = group.products) => {
    if (!window.confirm(`Se quitará la ficha técnica de las fotos de ${products.length} producto(s). ¿Continuar?`)) return;
    setBusy(group.ref);
    try {
      await applyToProducts(products, null);
      await load();
      onDone();
    } catch (err) {
      alert('Error al quitar la ficha: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginBottom: '24px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <ImageIcon size={16} /> Fichas técnicas actuales (editar en bloque)
      </button>

      {open && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem', flex: '1 1 320px' }}>
              Productos agrupados por la imagen de ficha que tienen. <strong>Reemplazar</strong> cambia la imagen en todos los productos del grupo a la vez.
            </p>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: 9, color: '#9ca3af' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                style={{ padding: '6px 10px 6px 28px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>
            <button onClick={load} disabled={loading} style={btn('#6b7280', loading)}>
              <RefreshCw size={14} /> Recargar
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleReplaceFile(e.target.files[0])}
          />

          {loading ? (
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Cargando fichas...</p>
          ) : groups.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              {rows.length === 0 ? 'Ningún producto tiene ficha técnica en sus fotos todavía.' : 'Ningún producto coincide con la búsqueda.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {groups.map((g) => {
                const isBusy = busy === g.ref;
                const isOpen = expanded[g.ref];
                return (
                  <div key={g.ref} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <a href={g.url} target="_blank" rel="noopener noreferrer" title="Ver imagen completa">
                        <img src={`${g.url}?w=140&h=140&fit=crop&auto=format`} alt="Ficha técnica" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      </a>
                      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                          Usada en {g.products.length} producto(s)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.products.slice(0, 3).map((p) => p.title).join(' · ')}{g.products.length > 3 ? ' …' : ''}
                        </div>
                        <button onClick={() => setExpanded({ ...expanded, [g.ref]: !isOpen })} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer' }}>
                          {isOpen ? 'Ocultar productos' : 'Ver productos'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => { replaceTarget.current = g; fileRef.current?.click(); }}
                          disabled={Boolean(busy)}
                          style={btn('#10b981', Boolean(busy))}
                        >
                          <Upload size={14} /> {isBusy ? 'Guardando...' : 'Reemplazar imagen'}
                        </button>
                        <button onClick={() => handleRemove(g)} disabled={Boolean(busy)} style={btn('#ef4444', Boolean(busy))}>
                          <Trash2 size={14} /> Quitar de todos
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '0.8rem', color: '#374151', columns: 2 }}>
                        {g.products.map((p) => (
                          <li key={p._id} style={{ marginBottom: 4 }}>
                            {p.title || p.slug}{' '}
                            <button
                              onClick={() => handleRemove(g, [p])}
                              disabled={Boolean(busy)}
                              title="Quitar la ficha solo de este producto"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                            >
                              quitar
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
