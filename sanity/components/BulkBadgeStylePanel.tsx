import React from 'react'
import { Palette } from 'lucide-react'
import { FONT_OPTIONS, EFFECT_OPTIONS } from '../../lib/text-styles'
import { BADGE_SHAPES, DEFAULT_BADGE_BG, DEFAULT_BADGE_TEXT, badgeInlineStyle, type BadgeStyle } from '../../lib/badge-style'

/** Qué hacer con el estilo de la etiqueta en los productos seleccionados. */
export type BadgeStyleMode = 'keep' | 'set' | 'reset'

export interface BadgeStyleDraft extends BadgeStyle {
  bgColor: string
  textColor: string
  font: string
  effect: string
  effectColor: string
  shape: 'pill' | 'rounded' | 'square'
}

export const EMPTY_BADGE_STYLE: BadgeStyleDraft = {
  bgColor: DEFAULT_BADGE_BG,
  textColor: DEFAULT_BADGE_TEXT,
  font: 'default',
  effect: 'none',
  effectColor: '#ffffff',
  shape: 'pill',
}

/** Colores rápidos (marca y temporadas) */
const SWATCHES = ['#E50914', '#111827', '#5B9BAF', '#16a34a', '#f59e0b', '#7c3aed', '#ec4899', '#ffffff']

const labelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }
const selectStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', color: '#111827', background: 'white', boxSizing: 'border-box' }

function ColorRow({ value, onChange, title }: { value: string; onChange: (v: string) => void; title: string }) {
  return (
    <div>
      <div style={labelStyle}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 38, height: 32, border: '1px solid #d1d5db', borderRadius: 6, padding: 2, background: 'white', cursor: 'pointer' }} aria-label={title} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 88, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: 12, color: '#111827' }}
        />
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: value.toLowerCase() === c.toLowerCase() ? '2px solid #2563eb' : '1px solid #d1d5db', cursor: 'pointer', padding: 0 }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Edición masiva del estilo de la etiqueta (badge): colores, tipografía, efecto y forma, con una
 * tarjeta de vista previa igual a la de la tienda.
 */
export function BulkBadgeStylePanel({
  mode,
  onModeChange,
  value,
  onChange,
  previewText,
  previewProduct,
}: {
  mode: BadgeStyleMode
  onModeChange: (m: BadgeStyleMode) => void
  value: BadgeStyleDraft
  onChange: (v: BadgeStyleDraft) => void
  previewText: string
  previewProduct?: { title?: string; imageUrl?: string; price?: number; salePrice?: number; badgeStyle?: BadgeStyle | null } | null
}) {
  const set = (k: keyof BadgeStyleDraft) => (v: string) => onChange({ ...value, [k]: v })
  const effective: BadgeStyle | null = mode === 'set' ? value : mode === 'reset' ? null : previewProduct?.badgeStyle || null
  const tags = (previewText || 'NUEVO').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3)
  const title = (previewProduct?.title || 'Tela de ejemplo X Metros | Tela Liviana').split('|')[0].trim()
  const price = previewProduct?.salePrice && previewProduct.salePrice < (previewProduct.price || 0) ? previewProduct.salePrice : previewProduct?.price

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 20, background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ ...labelStyle, marginBottom: 0, fontSize: '0.8rem' }}>
          <Palette size={15} /> Estilo de la etiqueta (colores y tarjeta)
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            ['keep', 'No cambiar'],
            ['set', 'Aplicar este estilo'],
            ['reset', 'Volver al rojo de siempre'],
          ] as const).map(([m, t]) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: mode === m ? '1px solid #2563eb' : '1px solid #d1d5db',
                background: mode === m ? '#eff6ff' : 'white', color: mode === m ? '#1d4ed8' : '#374151',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 14, opacity: mode === 'set' ? 1 : 0.45, pointerEvents: mode === 'set' ? 'auto' : 'none' }}>
          <ColorRow title="Color de fondo" value={value.bgColor} onChange={set('bgColor')} />
          <ColorRow title="Color del texto" value={value.textColor} onChange={set('textColor')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <div>
              <div style={labelStyle}>Tipografía</div>
              <select value={value.font} onChange={(e) => set('font')(e.target.value)} style={selectStyle}>
                {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.title}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Efecto</div>
              <select value={value.effect} onChange={(e) => set('effect')(e.target.value)} style={selectStyle}>
                {EFFECT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.value === 'highlight' ? 'Borde de color' : f.title}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Forma</div>
              <select value={value.shape} onChange={(e) => set('shape')(e.target.value)} style={selectStyle}>
                {BADGE_SHAPES.map((s) => <option key={s.value} value={s.value}>{s.title}</option>)}
              </select>
            </div>
          </div>
          {(value.effect === 'neon' || value.effect === 'highlight') && (
            <ColorRow title={value.effect === 'neon' ? 'Color del brillo' : 'Color del borde'} value={value.effectColor} onChange={set('effectColor')} />
          )}
        </div>

        {/* Tarjeta de vista previa (como en la tienda) */}
        <div>
          <div style={{ ...labelStyle, justifyContent: 'center' }}>Vista previa</div>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 14px rgba(15,23,42,.08)' }}>
            <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f1f5f9' }}>
              {previewProduct?.imageUrl ? (
                <img src={`${previewProduct.imageUrl}?w=440&h=440&fit=crop&auto=format`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>Selecciona un producto</div>
              )}
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {tags.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11, padding: '4px 12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)', whiteSpace: 'nowrap',
                      ...badgeInlineStyle(effective),
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 13, color: '#111827', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 4 }}>
                {price ? `$${Number(price).toLocaleString('es-CO')}` : '$12.400'}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '8px 0 0', textAlign: 'center' }}>
            {mode === 'keep' ? 'Estilo actual del primer producto seleccionado.' : 'Así se verá en la tienda.'}
          </p>
        </div>
      </div>
    </div>
  )
}
