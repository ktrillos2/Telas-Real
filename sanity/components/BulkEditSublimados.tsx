import React, { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Edit, Search, AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react';

const Card = ({ children, style = {} }: any) => (
  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', ...style }}>
    {children}
  </div>
);

export function BulkEditSublimados() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  
  // Bulk update states
  const [newIsActive, setNewIsActive] = useState<string>('');
  
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "imagenSublimada"] | order(name asc) {
        _id,
        name,
        category,
        subcategory,
        isActive,
        "imageUrl": image.asset->url
      }`;
      const data = await client.fetch(query);
      
      const designMap = new Map();
      data.forEach((doc: any) => {
        const id = doc._id.replace('drafts.', '');
        if (doc._id.startsWith('drafts.')) {
          designMap.set(id, doc);
        } else {
          if (!designMap.has(id)) {
            designMap.set(id, doc);
          }
        }
      });
      
      const uniqueDesigns = Array.from(designMap.values());
      setDesigns(uniqueDesigns);
    } catch (error) {
      console.error("Error fetching designs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [client]);

  const handleBulkUpdate = async () => {
    if (selectedDesigns.length === 0) return;
    
    if (newIsActive === '') {
      alert("Por favor, selecciona si deseas activar o desactivar.");
      return;
    }

    const confirmMessage = `ATENCIÓN: Estás a punto de modificar masivamente ${selectedDesigns.length} diseño(s) sublimado(s).\n\n¿Estás seguro de que deseas continuar?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsUpdating(true);
    try {
      const allIdsToCheck = selectedDesigns.flatMap(id => [id, `drafts.${id}`]);
      const existingDocs = await client.fetch(`*[_id in $ids]._id`, { ids: allIdsToCheck });
      
      const tx = client.transaction();
      
      selectedDesigns.forEach(id => {
        const patchObj: any = {};
        if (newIsActive !== '') patchObj.isActive = newIsActive === 'true';

        if (existingDocs.includes(id)) {
          tx.patch(id, p => p.set(patchObj));
        }
        if (existingDocs.includes(`drafts.${id}`)) {
          tx.patch(`drafts.${id}`, p => p.set(patchObj));
        }
      });

      await tx.commit();
      
      setSelectedDesigns([]);
      setNewIsActive('');
      
      alert(`Se actualizaron ${selectedDesigns.length} diseño(s) exitosamente.`);
      
      fetchDesigns();
    } catch (error) {
      console.error('Error updating designs:', error);
      alert('Error al actualizar diseños: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, filteredDesigns: any[]) => {
    if (e.target.checked) {
      setSelectedDesigns(filteredDesigns.map(p => p._id.replace('drafts.', '')));
    } else {
      setSelectedDesigns([]);
    }
  };

  const toggleSelectDesign = (id: string) => {
    const cleanId = id.replace('drafts.', '');
    setSelectedDesigns(prev => 
      prev.includes(cleanId) ? prev.filter(pId => pId !== cleanId) : [...prev, cleanId]
    );
  };

  const filteredDesigns = designs.filter(p => 
    search === '' || (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <ImageIcon color="#3b82f6" size={28} />
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Edición Masiva de Diseños Sublimados</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        <Card style={{ borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle color="#ef4444" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Acción Masiva: Activar/Desactivar</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>
            Selecciona si deseas activar o desactivar los diseños que hayas marcado en la lista de abajo.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                <CheckCircle size={14} /> Estado
              </label>
              <select 
                value={newIsActive}
                onChange={(e) => setNewIsActive(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              >
                <option value="">Seleccione una acción</option>
                <option value="true">Activar (Visibles)</option>
                <option value="false">Desactivar (Ocultos)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <div style={{ fontSize: '0.875rem', color: selectedDesigns.length > 0 ? '#1e40af' : '#6b7280', fontWeight: 600, backgroundColor: selectedDesigns.length > 0 ? '#eff6ff' : '#f3f4f6', padding: '8px 16px', borderRadius: '6px' }}>
              {selectedDesigns.length} diseños seleccionados
            </div>
            <button
              onClick={handleBulkUpdate}
              disabled={isUpdating || selectedDesigns.length === 0}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: (isUpdating || selectedDesigns.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isUpdating || selectedDesigns.length === 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {isUpdating ? 'Aplicando cambios...' : 'Actualizar Seleccionados'}
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Listado de Diseños</h2>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre o categoría..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', paddingLeft: '36px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', boxSizing: 'border-box' }}
            />
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Cargando diseños...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' }}>
                  <th style={{ padding: '12px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={filteredDesigns.length > 0 && selectedDesigns.length === filteredDesigns.length}
                      onChange={(e) => toggleSelectAll(e, filteredDesigns)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={{ padding: '12px', width: '60px' }}>Vista Previa</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Categoría</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Subcategoría</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredDesigns.map(p => {
                  const cleanId = p._id.replace('drafts.', '');
                  const isSelected = selectedDesigns.includes(cleanId);
                  // By default active is true if undefined, since initialValue was added recently
                  const isActive = p.isActive !== false;
                  
                  return (
                    <tr 
                      key={cleanId}
                      onClick={() => toggleSelectDesign(cleanId)}
                      style={{ 
                        borderBottom: '1px solid #e5e7eb', 
                        cursor: 'pointer', 
                        backgroundColor: isSelected ? '#eff6ff' : 'white', 
                        transition: 'background 0.2s' 
                      }}
                    >
                      <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectDesign(cleanId)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        {p.imageUrl ? (
                          <div style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6' }}>
                            <img src={p.imageUrl} alt={p.name || 'Diseño'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '4px', border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={20} color="#9ca3af" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 500, color: '#111827' }}>
                        {p.name || 'Sin nombre'} {p._id.startsWith('drafts.') && <span style={{fontSize: '10px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '2px 4px', borderRadius: '4px', marginLeft: '8px'}}>Borrador</span>}
                      </td>
                      <td style={{ padding: '12px', color: '#374151' }}>
                        {p.category || '-'}
                      </td>
                      <td style={{ padding: '12px', color: '#374151' }}>
                        {p.subcategory || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '999px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                          color: isActive ? '#15803d' : '#b91c1c'
                        }}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredDesigns.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                      No se encontraron diseños.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
