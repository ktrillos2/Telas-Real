import React, { useMemo, useRef, useState } from 'react';
import type { SanityClient } from 'sanity';
import { FileText, Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Carga masiva de fichas técnicas (atributos del producto).
 *
 * Los atributos se guardan en `product.attributes` como { name, value } y la ficha técnica
 * pública (components/product-spec-sheet.tsx) los reconoce por nombre: Ancho, Composición,
 * Gramaje, Elasticidad, Tacto, Presentación, Tipo de hilado y Cuidados.
 *
 * Dos formas de uso:
 *  1. Formulario: los valores escritos se aplican a todos los productos seleccionados.
 *  2. CSV: descargar la plantilla, completarla en Excel / Google Sheets y subirla.
 */

export const SPEC_FIELDS = [
  { name: 'Ancho', placeholder: 'Ej. 1.55 metros' },
  { name: 'Composición', placeholder: 'Ej. 95% poliéster, 5% spandex' },
  { name: 'Gramaje', placeholder: 'Ej. 180 g/m²' },
  { name: 'Elasticidad', placeholder: 'Ej. 4 vías / Media' },
  { name: 'Tacto', placeholder: 'Ej. Suave, fresco' },
  { name: 'Presentación', placeholder: 'Ej. Rollo de 25 kg' },
  { name: 'Tipo de hilado', placeholder: 'Ej. Filamento' },
  { name: 'Cuidados', placeholder: 'Ej. Lavar en frío; no usar blanqueador; secar a la sombra' },
] as const;

const CLEAR_VALUE = 'CLEAR';

type Attribute = { _key?: string; name: string; value: string; visible?: boolean; global?: boolean };
type ProductRow = { _id: string; title?: unknown; slug?: unknown; attributes?: unknown };

// Acepta cualquier valor: hay productos importados con nombres nulos o numéricos.
function normalize(text: unknown): string {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Atributos utilizables de un producto. Algunos productos importados tienen entradas
 * nulas o sin nombre en `attributes` (o el campo no es una lista): se ignoran al leer.
 */
export function readAttributes(list: unknown): Attribute[] {
  if (!Array.isArray(list)) return [];
  return list.filter((a): a is Attribute => Boolean(a) && typeof a === 'object' && typeof (a as any).name === 'string' && (a as any).name.trim() !== '');
}

/** Cuántos campos de la ficha técnica tiene completos el producto. */
export function countSpecFields(list: unknown): number {
  const attrs = readAttributes(list);
  return SPEC_FIELDS.filter((f) => attrs.some((a) => normalize(a.name) === normalize(f.name) && String(a.value ?? '').trim() !== '')).length;
}

function randomKey(): string {
  return Math.random().toString(36).slice(2, 12);
}

/**
 * Inserta o reemplaza atributos por nombre (sin distinguir mayúsculas ni tildes).
 * "CLEAR" elimina el atributo; un valor vacío lo deja como está.
 */
export function upsertAttributes(current: unknown, updates: Record<string, string>): Attribute[] {
  // Se conservan todas las entradas válidas existentes (incluidas las que no son de la ficha);
  // solo se descartan las nulas, que Sanity no admite en un arreglo.
  let result: Attribute[] = Array.isArray(current) ? current.filter((a) => a && typeof a === 'object') : [];
  for (const [rawName, rawValue] of Object.entries(updates)) {
    const name = rawName.trim();
    const value = String(rawValue ?? '').trim();
    if (!name || !value) continue;
    const idx = result.findIndex((a) => typeof a.name === 'string' && normalize(a.name) === normalize(name));
    if (value.toUpperCase() === CLEAR_VALUE) {
      if (idx >= 0) result = result.filter((_, i) => i !== idx);
      continue;
    }
    if (idx >= 0) {
      result[idx] = { ...result[idx], name: result[idx].name || name, value, visible: true };
    } else {
      result.push({ _key: randomKey(), name, value, visible: true, global: false });
    }
  }
  return result;
}

// --- CSV --------------------------------------------------------------------

function detectDelimiter(headerLine: string): string {
  const counts = [',', ';', '\t'].map((d) => ({ d, n: headerLine.split(d).length }));
  return counts.sort((a, b) => b.n - a.n)[0].d;
}

/** Parser CSV con soporte de comillas, separador "," ";" o tabulador (Excel en español usa ";"). */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const delimiter = detectDelimiter(clean.split(/\r?\n/)[0] || '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function toCsv(rows: string[][]): string {
  const escape = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // ";" para que Excel en español lo abra en columnas; BOM para conservar tildes
  return '﻿' + rows.map((r) => r.map((v) => escape(v ?? '')).join(';')).join('\r\n');
}

const ID_COLUMNS = ['slug', 'id', '_id', 'titulo', 'título', 'title', 'producto'];

// --- Componente ---------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
  outline: 'none', color: '#111827', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase',
};
const buttonStyle = (color: string, disabled = false): React.CSSProperties => ({
  backgroundColor: color, color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none',
  fontSize: '0.9rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
  display: 'inline-flex', alignItems: 'center', gap: '8px',
});

type CsvPlan = {
  updates: Array<{ id: string; title: string; values: Record<string, string> }>;
  unmatched: string[];
  columns: string[];
};

export function BulkSpecSheetPanel({
  client,
  products,
  selectedIds,
  onDone,
}: {
  client: SanityClient;
  products: ProductRow[];
  selectedIds: string[];
  onDone: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [csvPlan, setCsvPlan] = useState<CsvPlan | null>(null);
  const [csvError, setCsvError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const productIndex = useMemo(() => {
    const map = new Map<string, ProductRow>();
    for (const p of products) {
      const id = p._id.replace('drafts.', '');
      map.set(normalize(id), p);
      if (p.slug) map.set(normalize(p.slug), p);
      if (p.title !== null && p.title !== undefined && p.title !== '') map.set(normalize(p.title), p);
    }
    return map;
  }, [products]);

  /** Aplica a cada producto sus actualizaciones, en la versión publicada y en el borrador si existen. */
  const applyUpdates = async (updates: Array<{ id: string; values: Record<string, string> }>) => {
    const ids = updates.flatMap((u) => [u.id, `drafts.${u.id}`]);
    const docs: Array<{ _id: string; attributes?: Attribute[] }> = await client.fetch(
      `*[_id in $ids]{ _id, attributes }`,
      { ids }
    );
    const tx = client.transaction();
    let patched = 0;
    for (const doc of docs) {
      const baseId = doc._id.replace('drafts.', '');
      const update = updates.find((u) => u.id === baseId);
      if (!update) continue;
      const next = upsertAttributes(doc.attributes, update.values);
      // Asegura _key en atributos antiguos que no lo tengan (requisito de arrays en Sanity)
      tx.patch(doc._id, (p) => p.set({ attributes: next.map((a) => ({ ...a, _key: a._key || randomKey() })) }));
      patched++;
    }
    if (patched > 0) await tx.commit();
    return patched;
  };

  const formValues = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) if (v.trim()) out[k] = v;
    if (customName.trim() && customValue.trim()) out[customName.trim()] = customValue;
    return out;
  };

  const handleApplyForm = async () => {
    const vals = formValues();
    if (selectedIds.length === 0) return alert('Selecciona al menos un producto en el listado.');
    if (Object.keys(vals).length === 0) return alert('Completa al menos un campo de la ficha técnica.');
    const resumen = Object.entries(vals).map(([k, v]) => `• ${k}: ${v}`).join('\n');
    if (!window.confirm(`Se actualizará la ficha técnica de ${selectedIds.length} producto(s):\n\n${resumen}\n\n¿Continuar?`)) return;

    setIsSaving(true);
    try {
      await applyUpdates(selectedIds.map((id) => ({ id, values: vals })));
      setValues({}); setCustomName(''); setCustomValue('');
      alert(`Ficha técnica actualizada en ${selectedIds.length} producto(s).`);
      onDone();
    } catch (err) {
      alert('Error al actualizar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const source = selectedIds.length > 0
      ? products.filter((p) => selectedIds.includes(p._id.replace('drafts.', '')))
      : products;
    const extraNames = new Set<string>();
    for (const p of source) for (const a of readAttributes(p.attributes)) {
      if (!SPEC_FIELDS.some((f) => normalize(f.name) === normalize(a.name))) extraNames.add(a.name);
    }
    const columns = [...SPEC_FIELDS.map((f) => f.name), ...Array.from(extraNames)];
    const rows = [['slug', 'producto', ...columns]];
    for (const p of source) {
      const byName = new Map(readAttributes(p.attributes).map((a) => [normalize(a.name), String(a.value ?? '')]));
      rows.push([String(p.slug || p._id.replace('drafts.', '')), String(p.title ?? ''), ...columns.map((c) => byName.get(normalize(c)) || '')]);
    }
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fichas-tecnicas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = async (file: File) => {
    setCsvError(''); setCsvPlan(null);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('El archivo no tiene filas de datos.');
      const header = rows[0].map((h) => h.trim());
      const idCol = header.findIndex((h) => ID_COLUMNS.includes(normalize(h)));
      if (idCol < 0) throw new Error('La primera fila debe incluir una columna "slug" (o "id" / "producto") para identificar cada producto.');
      const skip = new Set(header.map((h, i) => (ID_COLUMNS.includes(normalize(h)) ? i : -1)).filter((i) => i >= 0));
      const columns = header.filter((_, i) => !skip.has(i) && header[i]);

      const updates: CsvPlan['updates'] = [];
      const unmatched: string[] = [];
      for (const row of rows.slice(1)) {
        // Probar todas las columnas identificadoras (slug, id, producto) hasta encontrar el producto
        let product: ProductRow | undefined;
        for (const i of skip) {
          product = productIndex.get(normalize(row[i] || ''));
          if (product) break;
        }
        const label = row[idCol] || row.find(Boolean) || '(fila vacía)';
        if (!product) { unmatched.push(label); continue; }
        const vals: Record<string, string> = {};
        header.forEach((h, i) => { if (!skip.has(i) && h && (row[i] || '').trim()) vals[h] = row[i]; });
        if (Object.keys(vals).length > 0) {
          updates.push({ id: product._id.replace('drafts.', ''), title: String(product.title || label), values: vals });
        }
      }
      setCsvPlan({ updates, unmatched, columns });
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : String(err));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleApplyCsv = async () => {
    if (!csvPlan || csvPlan.updates.length === 0) return;
    if (!window.confirm(`Se actualizará la ficha técnica de ${csvPlan.updates.length} producto(s) desde el CSV. ¿Continuar?`)) return;
    setIsSaving(true);
    try {
      // Lotes de 50 para no exceder el tamaño de una transacción
      for (let i = 0; i < csvPlan.updates.length; i += 50) {
        await applyUpdates(csvPlan.updates.slice(i, i + 50));
      }
      alert(`Fichas técnicas actualizadas: ${csvPlan.updates.length} producto(s).`);
      setCsvPlan(null);
      onDone();
    } catch (err) {
      alert('Error al importar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: '4px solid #10b981' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <FileText color="#10b981" size={20} />
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Fichas Técnicas</h2>
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>
        Completa los campos y aplícalos a los productos seleccionados, o usa la plantilla CSV para cargar una ficha distinta por producto.
        Los campos vacíos no se modifican; escribe <strong>CLEAR</strong> para borrar un dato.
      </p>

      {/* Opción 1: formulario para los seleccionados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {SPEC_FIELDS.map((field) => (
          <div key={field.name} style={field.name === 'Cuidados' ? { gridColumn: '1 / -1' } : undefined}>
            <label style={labelStyle}>{field.name}</label>
            <input
              type="text"
              placeholder={field.placeholder}
              value={values[field.name] || ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ))}
        <div>
          <label style={labelStyle}>Otro dato (nombre)</label>
          <input type="text" placeholder="Ej. Transparencia" value={customName} onChange={(e) => setCustomName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Otro dato (valor)</label>
          <input type="text" placeholder="Ej. No transparenta" value={customValue} onChange={(e) => setCustomValue(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={handleApplyForm} disabled={isSaving || selectedIds.length === 0} style={buttonStyle('#10b981', isSaving || selectedIds.length === 0)}>
          <CheckCircle size={16} />
          {isSaving ? 'Guardando...' : `Aplicar ficha a ${selectedIds.length} seleccionado(s)`}
        </button>
      </div>

      {/* Opción 2: plantilla CSV */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', margin: '0 0 6px' }}>Carga por archivo (CSV / Excel)</h3>
        <ol style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 16px', paddingLeft: '20px', lineHeight: 1.6 }}>
          <li>Descarga la plantilla ({selectedIds.length > 0 ? `${selectedIds.length} productos seleccionados` : 'todos los productos'}, con los datos actuales).</li>
          <li>Ábrela en Excel o Google Sheets y completa las columnas. No cambies la columna <strong>slug</strong>.</li>
          <li>Guárdala como CSV y súbela aquí. Verás un resumen antes de aplicar.</li>
        </ol>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadTemplate} style={buttonStyle('#3b82f6')}>
            <Download size={16} /> Descargar plantilla
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={isSaving} style={buttonStyle('#6366f1', isSaving)}>
            <Upload size={16} /> Subir CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }}
          />
        </div>

        {csvError && (
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem', display: 'flex', gap: '8px' }}>
            <AlertTriangle size={16} /> {csvError}
          </div>
        )}

        {csvPlan && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#374151' }}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>{csvPlan.updates.length}</strong> producto(s) con datos para actualizar · columnas: {csvPlan.columns.join(', ') || '—'}
            </p>
            {csvPlan.unmatched.length > 0 && (
              <p style={{ margin: '0 0 8px', color: '#b45309' }}>
                {csvPlan.unmatched.length} fila(s) sin producto encontrado: {csvPlan.unmatched.slice(0, 8).join(', ')}{csvPlan.unmatched.length > 8 ? '…' : ''}
              </p>
            )}
            {csvPlan.updates.length > 0 && (
              <ul style={{ margin: '0 0 12px', paddingLeft: '20px', maxHeight: '160px', overflowY: 'auto' }}>
                {csvPlan.updates.slice(0, 50).map((u) => (
                  <li key={u.id}>{u.title}: {Object.entries(u.values).map(([k, v]) => `${k}=${v}`).join(' · ')}</li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleApplyCsv} disabled={isSaving || csvPlan.updates.length === 0} style={buttonStyle('#10b981', isSaving || csvPlan.updates.length === 0)}>
                <CheckCircle size={16} /> {isSaving ? 'Importando...' : 'Aplicar importación'}
              </button>
              <button onClick={() => setCsvPlan(null)} disabled={isSaving} style={buttonStyle('#6b7280', isSaving)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
