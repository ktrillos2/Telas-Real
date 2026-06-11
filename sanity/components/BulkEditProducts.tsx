import React, { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Edit, Search, AlertTriangle, CheckCircle, Tag, DollarSign, Package } from 'lucide-react';

const Card = ({ children, style = {} }: any) => (
  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', ...style }}>
    {children}
  </div>
);

export function BulkEditProducts() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Bulk update states
  const [newPrice, setNewPrice] = useState<string>('');
  const [newSalePrice, setNewSalePrice] = useState<string>('');
  const [newBadge, setNewBadge] = useState<string>('');
  const [newStockStatus, setNewStockStatus] = useState<string>('');
  
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetches all products (deduplicating drafts if any, by taking the published one or the draft if no published)
      const query = `*[_type == "product"] | order(title asc) {
        _id,
        title,
        price,
        salePrice,
        badge,
        stockStatus
      }`;
      const data = await client.fetch(query);
      
      const productMap = new Map();
      data.forEach((doc: any) => {
        const id = doc._id.replace('drafts.', '');
        if (doc._id.startsWith('drafts.')) {
          productMap.set(id, doc);
        } else {
          if (!productMap.has(id)) {
            productMap.set(id, doc);
          }
        }
      });
      
      const uniqueProducts = Array.from(productMap.values());
      setProducts(uniqueProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [client]);

  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) return;
    
    // Validate if any field is going to be updated
    if (!newPrice && !newSalePrice && newBadge === '' && !newStockStatus) {
      alert("Por favor, ingresa al menos un valor para actualizar.");
      return;
    }

    const confirmMessage = `ATENCIÓN: Estás a punto de modificar masivamente ${selectedProducts.length} producto(s).\n\nEsta acción NO es reversible. ¿Estás absolutamente seguro de que deseas continuar?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsUpdating(true);
    try {
      // Find out which documents actually exist before patching to avoid "document not found" errors
      const allIdsToCheck = selectedProducts.flatMap(id => [id, `drafts.${id}`]);
      const existingDocs = await client.fetch(`*[_id in $ids]._id`, { ids: allIdsToCheck });
      
      const tx = client.transaction();
      
      selectedProducts.forEach(id => {
        const patchObj: any = {};
        if (newPrice) patchObj.price = Number(newPrice);
        if (newSalePrice) patchObj.salePrice = Number(newSalePrice);
        if (newBadge !== undefined && newBadge !== '') {
          // If the user types 'clear', we clear the badge
          patchObj.badge = newBadge === 'CLEAR' ? null : newBadge;
        }
        if (newStockStatus) patchObj.stockStatus = newStockStatus;

        // Apply changes ONLY to the versions (draft/published) that actually exist
        if (existingDocs.includes(id)) {
          tx.patch(id, p => p.set(patchObj));
        }
        if (existingDocs.includes(`drafts.${id}`)) {
          tx.patch(`drafts.${id}`, p => p.set(patchObj));
        }
      });

      await tx.commit();
      
      // Clear selections and inputs
      setSelectedProducts([]);
      setNewPrice('');
      setNewSalePrice('');
      setNewBadge('');
      setNewStockStatus('');
      
      alert(`Se actualizaron ${selectedProducts.length} producto(s) exitosamente.`);
      
      // Refresh list
      fetchProducts();
    } catch (error) {
      console.error('Error updating products:', error);
      alert('Error al actualizar productos: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, filteredProducts: any[]) => {
    if (e.target.checked) {
      // Para evitar que seleccione los "drafts." accidentalmente si están renderizados directo,
      // usaremos el _id base
      setSelectedProducts(filteredProducts.map(p => p._id.replace('drafts.', '')));
    } else {
      setSelectedProducts([]);
    }
  };

  const toggleSelectProduct = (id: string) => {
    const cleanId = id.replace('drafts.', '');
    setSelectedProducts(prev => 
      prev.includes(cleanId) ? prev.filter(pId => pId !== cleanId) : [...prev, cleanId]
    );
  };

  const filteredProducts = products.filter(p => 
    search === '' || (p.title && p.title.toLowerCase().includes(search.toLowerCase()))
  );

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Edit color="#3b82f6" size={28} />
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Edición Masiva de Productos</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Acciones Masivas Panel */}
        <Card style={{ borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle color="#ef4444" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Nuevos Valores a Aplicar</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>
            Los valores que ingreses aquí reemplazarán los valores actuales en los productos seleccionados. Deja en blanco lo que NO quieras modificar. (Para borrar insignias escribe "CLEAR").
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                <DollarSign size={14} /> Precio Normal
              </label>
              <input 
                type="number" 
                placeholder="Ej. 15000"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                <DollarSign size={14} /> Precio Oferta
              </label>
              <input 
                type="number" 
                placeholder="Ej. 12000 (0 para quitar)"
                value={newSalePrice}
                onChange={(e) => setNewSalePrice(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                <Tag size={14} /> Etiquetas (Badges)
              </label>
              <input 
                type="text" 
                placeholder="Ej. CYBER DAY, NUEVO"
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase' }}>
                <Package size={14} /> Estado de Stock
              </label>
              <select 
                value={newStockStatus}
                onChange={(e) => setNewStockStatus(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#111827', backgroundColor: 'white', boxSizing: 'border-box' }}
              >
                <option value="">Sin Cambios</option>
                <option value="inStock">En Stock</option>
                <option value="outOfStock">Agotado</option>
                <option value="onBackorder">Bajo Pedido</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <div style={{ fontSize: '0.875rem', color: selectedProducts.length > 0 ? '#1e40af' : '#6b7280', fontWeight: 600, backgroundColor: selectedProducts.length > 0 ? '#eff6ff' : '#f3f4f6', padding: '8px 16px', borderRadius: '6px' }}>
              {selectedProducts.length} productos seleccionados
            </div>
            <button
              onClick={handleBulkUpdate}
              disabled={isUpdating || selectedProducts.length === 0}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: (isUpdating || selectedProducts.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isUpdating || selectedProducts.length === 0) ? 0.6 : 1,
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
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Listado de Productos</h2>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <input 
              type="text" 
              placeholder="Buscar producto por nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', paddingLeft: '36px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', boxSizing: 'border-box' }}
            />
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Cargando productos...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' }}>
                  <th style={{ padding: '12px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                      onChange={(e) => toggleSelectAll(e, filteredProducts)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Producto</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Precio</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Oferta</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Etiquetas</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Estado Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const cleanId = p._id.replace('drafts.', '');
                  const isSelected = selectedProducts.includes(cleanId);
                  
                  return (
                    <tr 
                      key={cleanId}
                      onClick={() => toggleSelectProduct(cleanId)}
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
                          onChange={() => toggleSelectProduct(cleanId)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '12px', fontWeight: 500, color: '#111827' }}>
                        {p.title} {p._id.startsWith('drafts.') && <span style={{fontSize: '10px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '2px 4px', borderRadius: '4px', marginLeft: '8px'}}>Borrador</span>}
                      </td>
                      <td style={{ padding: '12px', color: '#374151' }}>
                        {p.price ? formatter.format(p.price) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', color: p.salePrice ? '#ef4444' : '#9ca3af' }}>
                        {p.salePrice ? formatter.format(p.salePrice) : 'Sin oferta'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {p.badge ? (
                          <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {p.badge}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '999px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: p.stockStatus === 'inStock' ? '#dcfce7' : p.stockStatus === 'outOfStock' ? '#fee2e2' : '#fef3c7',
                          color: p.stockStatus === 'inStock' ? '#15803d' : p.stockStatus === 'outOfStock' ? '#b91c1c' : '#b45309'
                        }}>
                          {p.stockStatus === 'inStock' ? 'En Stock' : p.stockStatus === 'outOfStock' ? 'Agotado' : p.stockStatus === 'onBackorder' ? 'Bajo Pedido' : p.stockStatus || 'Desconocido'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredProducts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                      No se encontraron productos.
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
