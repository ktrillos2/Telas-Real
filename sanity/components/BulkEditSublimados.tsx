import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useClient } from 'sanity';
import { Edit, Search, AlertTriangle, CheckCircle, Image as ImageIcon, Trash2, Plus, Folder, RefreshCw, X, Tag } from 'lucide-react';

const Card = ({ children, style = {} }: any) => (
  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', ...style }}>
    {children}
  </div>
);

const BASE_DEFAULT_CATEGORIES = [
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

interface CategoryItem {
  _id?: string;
  name: string;
  count: number;
  isRegisteredDoc: boolean;
}

export function BulkEditSublimados() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [designs, setDesigns] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  
  // New category creation in management card
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  // Category delete confirmation modal state
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

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

  // Fetch designs and categories
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Query designs
      const designsQuery = `*[_type == "imagenSublimada"] | order(name asc) {
        _id,
        name,
        category,
        subcategory,
        isActive,
        "imageUrl": image.asset->url
      }`;
      const designsData = await client.fetch(designsQuery);
      
      const designMap = new Map();
      designsData.forEach((doc: any) => {
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

      // 2. Query registered categoriaSublimada docs
      const registeredCatDocs = await client.fetch<Array<{ _id: string; name: string }>>(
        `*[_type == "categoriaSublimada" && defined(name)] | order(order asc, name asc) { _id, name }`
      );

      // Calculate count per category
      const countMap = new Map<string, number>();
      uniqueDesigns.forEach((d: any) => {
        if (d.category) {
          const upperCat = d.category.trim().toUpperCase();
          countMap.set(upperCat, (countMap.get(upperCat) || 0) + 1);
        }
      });

      // Build registered map
      const registeredMap = new Map<string, string>(); // name -> _id
      registeredCatDocs.forEach((c) => {
        if (c.name) {
          registeredMap.set(c.name.trim().toUpperCase(), c._id);
        }
      });

      // Combine all category names
      const allCategoryNames = Array.from(
        new Set([
          ...BASE_DEFAULT_CATEGORIES,
          ...Array.from(registeredMap.keys()),
          ...Array.from(countMap.keys()),
        ])
      ).sort((a, b) => a.localeCompare(b));

      const combinedCategories: CategoryItem[] = allCategoryNames.map((name) => ({
        name,
        _id: registeredMap.get(name),
        count: countMap.get(name) || 0,
        isRegisteredDoc: registeredMap.has(name),
      }));

      setCategories(combinedCategories);

      // Ensure uploadCategory is valid
      if (combinedCategories.length > 0 && !allCategoryNames.includes(uploadCategory) && uploadCategory !== 'OTRA') {
        setUploadCategory(combinedCategories[0].name);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [client, uploadCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper to ensure category document exists in Sanity
  const ensureCategoryDocExists = async (categoryName: string) => {
    const trimmed = categoryName.trim().toUpperCase();
    if (!trimmed) return null;

    try {
      const existing = await client.fetch<Array<{ _id: string }>>(
        `*[_type == "categoriaSublimada" && upper(name) == $name]._id`,
        { name: trimmed }
      );

      if (existing.length > 0) {
        return existing[0]._id;
      }

      const slugStr = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const newDoc = await client.create({
        _type: 'categoriaSublimada',
        name: trimmed,
        slug: { _type: 'slug', current: slugStr },
        isActive: true,
      });

      return newDoc._id;
    } catch (err) {
      console.error('Error ensuring category doc:', err);
      return null;
    }
  };

  // Create new category from management section
  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryNameInput.trim().toUpperCase();
    if (!trimmed) {
      alert("Por favor ingresa un nombre para la categoría.");
      return;
    }

    setIsCreatingCategory(true);
    try {
      await ensureCategoryDocExists(trimmed);
      setNewCategoryNameInput('');
      await fetchData();
      setUploadCategory(trimmed);
      alert(`Categoría "${trimmed}" creada y registrada exitosamente.`);
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Error al crear categoría: " + String(error));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Delete category handler with confirmation
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    const catName = categoryToDelete.name;

    try {
      // 1. Delete all matching categoriaSublimada documents
      const docsToDelete = await client.fetch<string[]>(
        `*[_type == "categoriaSublimada" && upper(name) == $name]._id`,
        { name: catName }
      );

      if (docsToDelete.length > 0) {
        const tx = client.transaction();
        docsToDelete.forEach((id) => tx.delete(id));
        await tx.commit();
      }

      // 2. If there are designs assigned, optionally update their category to empty
      if (categoryToDelete.count > 0) {
        const affectedDesigns = await client.fetch<string[]>(
          `*[_type == "imagenSublimada" && upper(category) == $name]._id`,
          { name: catName }
        );

        if (affectedDesigns.length > 0) {
          const txPatch = client.transaction();
          affectedDesigns.forEach((id) => {
            txPatch.patch(id, (p) => p.unset(['category']));
          });
          await txPatch.commit();
        }
      }

      setCategoryToDelete(null);
      await fetchData();
      alert(`Categoría "${catName}" eliminada correctamente.`);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error al eliminar categoría: " + String(error));
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Handle Bulk Upload
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

    // Ensure category exists in Sanity
    await ensureCategoryDocExists(finalCat);

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
      setCustomUploadCategory('');
      setUploadProgress('');
      await fetchData();
    } catch (err: any) {
      console.error("Error in bulk upload:", err);
      alert("Error durante la carga masiva: " + (err.message || String(err)));
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Handle Bulk Update
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

    if (finalCategory) {
      await ensureCategoryDocExists(finalCategory);
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
      
      await fetchData();
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

  // Filtered designs
  const filteredDesigns = useMemo(() => {
    return designs.filter(p => {
      const matchesSearch = search === '' || 
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || 
        (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = categoryFilter === '' || 
        (p.category && p.category.toUpperCase() === categoryFilter.toUpperCase());

      return matchesSearch && matchesCategory;
    });
  }, [designs, search, categoryFilter]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ImageIcon color="#3b82f6" size={28} />
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Edición Masiva y Diseños Sublimados</h1>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem'
          }}
        >
          <RefreshCw size={16} /> Recargar Datos
        </button>
      </div>

      {/* TOP CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* CARD 1: Carga y Creación de Diseños */}
        <Card style={{ borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ImageIcon color="#10b981" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Crear / Subir Nuevos Diseños</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
            Sube una o varias imágenes para agregarlas automáticamente como diseños sublimados a la categoría deseada.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
                Categoría de Destino
              </label>
              <select 
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              >
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count} diseños)
                  </option>
                ))}
                <option value="OTRA">➕ Escribir otra categoría nueva...</option>
              </select>
            </div>

            {uploadCategory === 'OTRA' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Nombre de la Nueva Categoría
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: FRANELA SUBLIMADA" 
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Edit color="#3b82f6" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Acciones Masivas: Estado y Categorías</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
            Aplica cambios masivos de visibilidad o asigna una nueva categoría de tela sublimada a los diseños seleccionados.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
                <Edit size={14} /> Asignar / Cambiar Categoría
              </label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              >
                <option value="">No modificar categoría</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
                <option value="OTRA">➕ Escribir otra categoría personalizada...</option>
              </select>
            </div>

            {newCategory === 'OTRA' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '6px', textTransform: 'uppercase' }}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.875rem', color: selectedDesigns.length > 0 ? '#1e40af' : '#6b7280', fontWeight: 600, backgroundColor: selectedDesigns.length > 0 ? '#eff6ff' : '#f3f4f6', padding: '8px 14px', borderRadius: '6px' }}>
              {selectedDesigns.length} seleccionados
            </div>
            <button
              onClick={handleBulkUpdate}
              disabled={isUpdating || selectedDesigns.length === 0}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: (isUpdating || selectedDesigns.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isUpdating || selectedDesigns.length === 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {isUpdating ? 'Actualizando...' : 'Actualizar Seleccionados'}
            </button>
          </div>
        </Card>

        {/* CARD 3: Gestión de Categorías de Sublimación */}
        <Card style={{ borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder color="#8b5cf6" size={20} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Categorías ({categories.length})</h2>
            </div>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '14px' }}>
            Crea nuevas categorías de tela sublimada o elimina las que ya no uses con confirmación.
          </p>

          {/* Form to add category */}
          <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input 
              type="text" 
              placeholder="Nueva categoría (ej: CHIFON SUBLIMADO)" 
              value={newCategoryNameInput}
              onChange={(e) => setNewCategoryNameInput(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.875rem' }}
            />
            <button
              type="submit"
              disabled={isCreatingCategory || !newCategoryNameInput.trim()}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: (isCreatingCategory || !newCategoryNameInput.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isCreatingCategory || !newCategoryNameInput.trim()) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={16} /> Crear
            </button>
          </form>

          {/* List of categories with counts and delete button */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px', backgroundColor: '#f9fafb' }}>
            {categories.map(cat => (
              <div 
                key={cat.name} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '8px 10px', 
                  borderBottom: '1px solid #f3f4f6', 
                  backgroundColor: 'white', 
                  borderRadius: '4px', 
                  marginBottom: '4px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, marginRight: '8px' }}>
                  <Tag size={14} color="#8b5cf6" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: '0.725rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                    {cat.count} diseños
                  </span>
                </div>
                
                <button
                  type="button"
                  title={`Eliminar categoría "${cat.name}"`}
                  onClick={() => setCategoryToDelete(cat)}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* DESIGNS TABLE CARD */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Listado de Diseños Sublimados</h2>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '999px' }}>
              {filteredDesigns.length} de {designs.length}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', backgroundColor: 'white', fontSize: '0.875rem' }}
            >
              <option value="">Todas las Categorías ({designs.length})</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
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
                        {p.category ? (
                          <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                            {p.category}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin categoría</span>
                        )}
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
                      No se encontraron diseños con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CONFIRMATION MODAL FOR DELETING CATEGORY */}
      {categoryToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderTop: '5px solid #ef4444',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#fee2e2', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                ¿Eliminar Categoría?
              </h3>
            </div>

            <p style={{ color: '#374151', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '14px' }}>
              Estás a punto de eliminar la categoría <strong style={{ color: '#b91c1c' }}>"{categoryToDelete.name}"</strong>.
            </p>

            {categoryToDelete.count > 0 ? (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '6px', color: '#92400e', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.4 }}>
                ⚠️ <strong>Aviso importante:</strong> Existen <strong>{categoryToDelete.count} diseño(s)</strong> asociados a esta categoría. Al eliminarla, los archivos de imagen <strong>NO se borrarán</strong>, pero los diseños quedarán marcados como "Sin Categoría" para que puedas reasignarlos fácilmente.
              </div>
            ) : (
              <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px', color: '#4b5563', fontSize: '0.875rem', marginBottom: '20px' }}>
                Esta categoría no tiene diseños asociados actualmente.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeletingCategory}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: isDeletingCategory ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={isDeletingCategory}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: isDeletingCategory ? 'not-allowed' : 'pointer',
                  opacity: isDeletingCategory ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isDeletingCategory ? 'Eliminando...' : 'Sí, Eliminar Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
