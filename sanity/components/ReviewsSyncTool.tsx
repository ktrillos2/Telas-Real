import React, { useState } from 'react'
import { Star, RefreshCcw } from 'lucide-react'

export function ReviewsSyncTool() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; count?: number } | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/telas-real-reviews/sync', {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        setResult({ success: true, message: 'Reseñas sincronizadas correctamente.', count: data.syncedCount })
      } else {
        setResult({ success: false, message: data.error || 'Ocurrió un error al sincronizar.' })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Error de red.' })
    } finally {
      setLoading(false)
    }
  }

  const Card = ({ children, style = {} }: any) => (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', ...style }}>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '32px', backgroundColor: '#f9fafb', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Star style={{ color: '#eab308' }} size={28} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0 }}>Sincronizador de Reseñas de Google</h1>
        </div>
        
        <p style={{ color: '#4b5563', fontSize: '1rem', marginBottom: '32px', maxWidth: '800px' }}>
          Al hacer clic en el botón de abajo, se obtendrán las últimas 10 reseñas de Telas Real Medellín desde Google (vía Outscraper) y se guardarán en la base de datos de Sanity.
        </p>
        
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '20px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e40af', margin: '0 0 4px 0' }}>Actualizar ahora</h2>
            <p style={{ color: '#3b82f6', fontSize: '0.875rem', margin: 0 }}>Añade nuevas reseñas sin duplicar las existentes.</p>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Sincronizando...' : 'Obtener Reseñas de Google'}
          </button>
        </div>

        {result && (
          <div style={{ 
            backgroundColor: result.success ? '#dcfce7' : '#fee2e2', 
            border: `1px solid ${result.success ? '#86efac' : '#fca5a5'}`,
            padding: '16px 20px', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: result.success ? '#166534' : '#991b1b', margin: '0 0 8px 0' }}>
              {result.success ? '¡Éxito!' : 'Error'}
            </h3>
            <p style={{ color: result.success ? '#15803d' : '#b91c1c', margin: '0 0 8px 0', fontSize: '0.875rem' }}>
              {result.message}
            </p>
            {result.success && result.count !== undefined && (
              <span style={{ display: 'inline-block', backgroundColor: '#bbf7d0', color: '#166534', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                Reseñas procesadas: {result.count}
              </span>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
