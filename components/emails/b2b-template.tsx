import * as React from 'react';

interface B2bEmailTemplateProps {
  nombre: string;
  cargo: string;
  empresa: string;
  nit: string;
  correo: string;
  telefono: string;
  ciudad: string;
  intereses: string[];
  volumen: string;
  necesidad: string;
}

export const B2bEmailTemplate: React.FC<Readonly<B2bEmailTemplateProps>> = ({
  nombre,
  cargo,
  empresa,
  nit,
  correo,
  telefono,
  ciudad,
  intereses,
  volumen,
  necesidad,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', lineHeight: '1.6' }}>
    <h2 style={{ color: '#0F172A', borderBottom: '2px solid #0F172A', paddingBottom: '10px' }}>
      Nueva Solicitud B2B (Canal Mayorista)
    </h2>
    <p>Se ha recibido un nuevo formulario de contacto corporativo desde la página web.</p>
    
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <tbody>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', width: '30%' }}>Empresa</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{empresa}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>NIT / RUC</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{nit}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Contacto</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{nombre}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Cargo</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{cargo}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Correo</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}><a href={`mailto:${correo}`}>{correo}</a></td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Teléfono / WhatsApp</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{telefono}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Ciudad</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ciudad}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Volumen Estimado</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{volumen}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Intereses</td>
          <td style={{ padding: '8px', border: '1px solid #ddd' }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {intereses.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </td>
        </tr>
      </tbody>
    </table>

    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderLeft: '4px solid #0F172A' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0F172A' }}>Descripción de la necesidad:</h3>
      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{necesidad}</p>
    </div>

    <p style={{ marginTop: '30px', fontSize: '12px', color: '#888' }}>
      Este correo fue generado automáticamente desde el formulario B2B de Telas Real.
    </p>
  </div>
);

export default B2bEmailTemplate;
