import React, { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Download, Table as TableIcon } from 'lucide-react';

export function CalculadoraReport() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        const query = `*[_type == "calculadoraSettings"][0].fabrics`;
        const data = await client.fetch(query);
        setFabrics(data || []);
      } catch (error) {
        console.error("Error fetching calculator data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFabrics();
  }, [client]);

  const downloadCSV = () => {
    try {
      setDownloadingCsv(true);
      const headers = ['Nombre de Referencia', 'Rendimiento (m/kg)', 'Precio por Kilo', 'Precio por Metro', 'Precio por Rollo'];
      
      const rows = fabrics.map((f: any) => {
        return [
          `"${(f.name || '').replace(/"/g, '""')}"`,
          f.yield || 0,
          f.pricePerKilo || 0,
          f.pricePerMeter || 0,
          f.pricePerRoll || 0
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF is BOM for Excel UTF-8
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_calculadora_telas.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Error al descargar el CSV.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111827', color: 'white' }}>
        <h2>Cargando reporte...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TableIcon /> Cruce de Información: Calculadora
          </h1>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.875rem' }}>Visualiza y exporta los datos configurados para las telas en la calculadora.</p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={downloadingCsv || fabrics.length === 0}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: (downloadingCsv || fabrics.length === 0) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'opacity 0.2s',
            opacity: (downloadingCsv || fabrics.length === 0) ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!downloadingCsv && fabrics.length > 0) e.currentTarget.style.opacity = '0.8';
          }}
          onMouseOut={(e) => {
            if (!downloadingCsv && fabrics.length > 0) e.currentTarget.style.opacity = '1';
          }}
        >
          <Download size={16} />
          {downloadingCsv ? 'Generando CSV...' : 'Generar Reporte CSV'}
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Referencia</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rendimiento (m/kg)</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Precio x Kilo</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Precio x Metro</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Precio x Rollo</th>
            </tr>
          </thead>
          <tbody>
            {fabrics.map((f: any, i: number) => (
              <tr key={i} style={{ borderBottom: i !== fabrics.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>{f.name}</td>
                <td style={{ padding: '12px 16px', color: '#4b5563' }}>{f.yield}</td>
                <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>{f.pricePerKilo ? formatter.format(f.pricePerKilo) : 'N/A'}</td>
                <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 600 }}>{f.pricePerMeter ? formatter.format(f.pricePerMeter) : 'N/A'}</td>
                <td style={{ padding: '12px 16px', color: '#8b5cf6', fontWeight: 600 }}>{f.pricePerRoll ? formatter.format(f.pricePerRoll) : 'N/A'}</td>
              </tr>
            ))}
            {fabrics.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No hay telas configuradas. Ve a la sección de "Configuraciones de Calculadora".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
