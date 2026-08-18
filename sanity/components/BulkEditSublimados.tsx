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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  
  // Bulk update states
  const [newIsActive, setNewIsActive] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  
  // Bulk upload states
  const [uploadCategory, setUploadCategory] = useState<string>('SUAVETINA SUBLIMADA');
  const [customUploadCategory, setCustomUploadCategory] = useState<string>('');
  const [uploadSubcategory, setUploadSubcategory] = useState<string>('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  const [isUpdating, setIsUpdating] = useState(false);

  const SUBLIMATED_CATEGORIES = [
    'BRUSH SUBLIMADO',
    'PIEL DE CONEJO SUBLIMADO',
    'SATIN SUBLIMADO',
    'SUAVETINA SUBLIMADA',
    'SCUBA SUBLIMADA',
    'CHIFON SUBLIMADO',
    'ANTIFLUIDO SUBLIMADO',
    'SEDA SUBLIMADA',
    'TERCIOPELO SUBLIMADO',
    'LAFAYETTE SUBLIMADO',
    'LINO SUBLIMADO',
    'CREPE SUBLIMADO',
    'DAKOTA SUBLIMADA',
    'MICROFIBRA SUBLIMADA',
  ];

  const handleBulkUploadFiles = async () => {
    if (uploadFiles.length === 0) {
      alert("Por favor selecciona al menos una imagen para subir.");
      return;
    }

    const finalCat = uploadCategory === 'OTRA' ? customUploadCategory.trim().toUpperCase() : uploadCategory;
    if (!finalCat) {
      alert("Por favor indica la categoría para los nuevos diseños.");
      return;
    }

    setIsUploadingFiles(true);
    setUploadProgress(`Iniciando carga de ${uploadFiles.length} imágenes...`);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setUploadProgress(`Subiendo (${i + 1}/${uploadFiles.length}): ${file.name}...`);

        try {
          // 1. Upload image asset to Sanity
          const assetDoc = await client.assets.upload('image', file, {
            filename: file.name
          });

          // 2. Create imagenSublimada document
          await client.create({
            _type: 'imagenSublimada',
            name: file.name,
            category: finalCat,
            subcategory: uploadSubcategory.trim() || undefined,
            isActive: true,
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: assetDoc._id
              }
            }
          });

          successCount++;
        } catch (fileErr) {
          console.error(`Error uploading ${file.name}:`, fileErr);
          errorCount++;
        }
      }

      alert(`Carga completada:\n• ${successCount} diseños creados exitosamente en ${finalCat}.\n${errorCount > 0 ? `• ${errorCount} fallaron.` : ''}`);
      setUploadFiles([]);
      setUploadProgress('');
      fetchDesigns();
    } catch (err: any) {
      console.error("Error in bulk upload:", err);
      alert("Error durante la carga masiva: " + (err.message || String(err)));
    } finally {
      setIsUploadingFiles(false);
    }
  };

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
    
    const finalCategory = newCategory === 'OTRA' ? customCategoryInput.trim().toUpperCase() : newCategory;

    if (newIsActive === '' && !finalCategory) {
      alert("Por favor, selecciona al menos una acción (cambiar estado o cambiar categoría).");
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
        if (finalCategory) patchObj.category = finalCategory;

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
      setNewCategory('');
      setCustomCategoryInput('');
      
      alert(`Se actualizaron ${selectedDesigns.length} diseño(s) exitosamente.`);
      
      fetchDesigns();
    } catch (error) {
      console.error('Error updating designs:', error);
      alert('Error al actualizar diseños: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, filtered: any[]) => {
    if (e.target.checked) {
      setSelectedDesigns(filtered.map(p => p._id.replace('drafts.', '')));
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

  // Get distinct categories in current data
  const availableCategories = Array.from(new Set(designs.map(d => d.category).filter(Boolean))).sort();

  const filteredDesigns = designs.filter(p => {
    const matchesSearch = search === '' || 
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || 
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = categoryFilter === '' || 
      (p.category && p.category.toLowerCase() === categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <ImageIcon color="#3b82f6" size={28} />
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Edición Masiva de Diseños Sublimados</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* CARD 1: Carga y Creación de Diseños */}
        <Card style={{ borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ImageIcon color="#10b981" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Crear / Subir Nuevos Diseños</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
            Sube una o varias imágenes para agregarlas automáticamente como diseños sublimados a la categoría deseada.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
                Categoría de Destino
              </label>
              <select 
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              >
                {SUBLIMATED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="OTRA">Escribir otra categoría nueva...</option>
              </select>
            </div>

            {uploadCategory === 'OTRA' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Nombre de la Nueva Categoría
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: LINO SUBLIMADO" 
                  value={customUploadCategory}
                  onChange={(e) => setCustomUploadCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
                Subcategoría (Opcional)
              </label>
              <input 
                type="text" 
                placeholder="Ej: Flores, Infantil, Geométrico..." 
                value={uploadSubcategory}
                onChange={(e) => setUploadSubcategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
                Seleccionar Imágenes (Permite múltiples archivos)
              </label>
              <input 
                type="file" 
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadFiles(Array.from(e.target.files));
                  }
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px dashed #9ca3af', backgroundColor: '#f9fafb', fontSize: '0.875rem' }}
              />
              {uploadFiles.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '6px' }}>
                  ✓ {uploadFiles.length} archivo(s) seleccionado(s) listos para subir.
                </p>
              )}
            </div>
          </div>

          {isUploadingFiles && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '6px', color: '#065f46', fontSize: '0.875rem', fontWeight: 600, marginBottom: '14px' }}>
              ⏳ {uploadProgress}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button
              onClick={handleBulkUploadFiles}
              disabled={isUploadingFiles || uploadFiles.length === 0}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: (isUploadingFiles || uploadFiles.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isUploadingFiles || uploadFiles.length === 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {isUploadingFiles ? 'Subiendo archivos...' : `Subir y Crear ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''} Diseños`}
            </button>
          </div>
        </Card>

        {/* CARD 2: Acciones Masivas */}
        <Card style={{ borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Edit color="#3b82f6" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Acciones Masivas: Estado y Categorías</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>
            Aplica cambios masivos de visibilidad o asigna una nueva categoría de tela sublimada a los diseños seleccionados.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                <CheckCircle size={14} /> Cambiar Estado
              </label>
              <select 
                value={newIsActive}
                onChange={(e) => setNewIsActive(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              >
                <option value="">No modificar estado</option>
                <option value="true">Activar (Visibles en tienda)</option>
                <option value="false">Desactivar (Ocultos)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                <Edit size={14} /> Asignar / Cambiar Categoría
              </label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              >
                <option value="">No modificar categoría</option>
                {SUBLIMATED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="OTRA">Escribir otra categoría personalizada...</option>
              </select>
            </div>

            {newCategory === 'OTRA' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Nombre de Nueva Categoría
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: LINO SUBLIMADO" 
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <div style={{ fontSize: '0.875rem', color: selectedDesigns.length > 0 ? '#1e40af' : '#6b7280', fontWeight: 600, backgroundColor: selectedDesigns.length > 0 ? '#eff6ff' : '#f3f4f6', padding: '8px 16px', borderRadius: '6px' }}>
              {selectedDesigns.length} diseños seleccionados
            </div>
            <button
              onClick={handleBulkUpdate}
              disabled={isUpdating || selectedDesigns.length === 0}
              style={{
                backgroundColor: '#3b82f6',
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
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', backgroundColor: 'white', fontSize: '0.875rem' }}
            >
              <option value="">Todas las Categorías ({designs.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div style={{ position: 'relative', width: '280px' }}>
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
