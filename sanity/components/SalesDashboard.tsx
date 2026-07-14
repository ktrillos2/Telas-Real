import React, { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { ShoppingCart, DollarSign, TrendingUp, CheckCircle, Search, Download } from 'lucide-react';

export function SalesDashboard() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  
  const [period, setPeriod] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Bulk update states
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const downloadProductsCSV = async () => {
    try {
      setDownloadingCsv(true);
      const query = `*[_type == "product" && !(_id in path("drafts.**"))] {
        _id,
        title,
        "slug": slug.current,
        descriptionShort,
        price,
        salePrice,
        stockStatus,
        "imageUrls": images[].asset->url,
        attributes
      }`;
      const products = await client.fetch(query);

      const headers = [
        'id', 'title', 'description', 'availability', 'availability date', 'expiration date',
        'link', 'mobile link', 'image link', 'price', 'sale price', 'sale price effective date',
        'identifier exists', 'gtin', 'mpn', 'brand', 'product highlight', 'product detail',
        'additional image link', 'condition', 'adult', 'color', 'size', 'size type', 'size system',
        'gender', 'material', 'pattern', 'age group', 'multipack', 'is bundle', 'unit pricing measure',
        'unit pricing base measure', 'energy efficiency class', 'min energy efficiency class',
        'min energy efficiency class', 'item group id', 'sell on google quantity'
      ];

      const SITE_URL = 'https://telasreal.com';

      const rows = products.map((p: any) => {
        const imageUrls = p.imageUrls || [];
        const mainImage = imageUrls[0] || '';
        const additionalImages = imageUrls.slice(1).join(',');

        let availability = 'out_of_stock';
        if (p.stockStatus === 'inStock') availability = 'in_stock';
        if (p.stockStatus === 'onBackorder') availability = 'backorder';

        const findAttr = (name: string) => p.attributes?.find((a: any) => a.name?.toLowerCase() === name.toLowerCase())?.value || '';

        const data: Record<string, string> = {
          id: p._id,
          title: p.title || '',
          description: (p.descriptionShort || p.title || '').substring(0, 5000),
          availability: availability,
          'availability date': '',
          'expiration date': '',
          link: `${SITE_URL}/producto/${p.slug || ''}`,
          'mobile link': '',
          'image link': mainImage,
          price: p.price ? `${p.price} COP` : '',
          'sale price': p.salePrice > 0 ? `${p.salePrice} COP` : '',
          'sale price effective date': '',
          'identifier exists': 'yes',
          gtin: '',
          mpn: p._id,
          brand: findAttr('marca') || findAttr('brand') || 'Telas Real',
          'product highlight': '',
          'product detail': '',
          'additional image link': additionalImages,
          condition: 'new',
          adult: 'no',
          color: findAttr('color') || '',
          size: findAttr('talla') || findAttr('size') || '',
          'size type': '',
          'size system': '',
          gender: findAttr('genero') || findAttr('gender') || 'unisex',
          material: findAttr('material') || '',
          pattern: findAttr('estampado') || findAttr('pattern') || '',
          'age group': 'adult',
          multipack: '',
          'is bundle': 'no',
          'unit pricing measure': '',
          'unit pricing base measure': '',
          'energy efficiency class': '',
          'min energy efficiency class': '',
          'max energy efficiency class': '',
          'item group id': '',
          'sell on google quantity': ''
        };

        return headers.map(h => {
          const val = String(data[h] || '');
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'productos_formato_google.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading product CSV:', err);
      alert('Error al descargar el CSV de productos: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedOrders.length === 0) return;
    setIsUpdating(true);
    try {
      const tx = client.transaction();
      selectedOrders.forEach(id => {
        // En Sanity si modificas drafts, debes parchear ambos si quieres que aplique al borrador
        // Pero las ordenes suelen publicarse directo, así que modificamos el ID provisto
        tx.patch(id, p => p.set({ status: bulkStatus }));
      });
      await tx.commit();
      setSelectedOrders([]);
      setBulkStatus('');
      alert(`Se actualizó el estado de ${selectedOrders.length} pedido(s) exitosamente.`);
    } catch (error) {
      console.error('Error updating orders:', error);
      alert('Error al actualizar pedidos: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, currentFilteredOrders: any[]) => {
    if (e.target.checked) {
      setSelectedOrders(currentFilteredOrders.map(o => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const toggleSelectOrder = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation(); // Evitar que se expanda el acordeón
    if (e.target.checked) {
      setSelectedOrders(prev => [...prev, id]);
    } else {
      setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
    }
  };

  useEffect(() => {
    // Obtenemos tanto borradores como documentos publicados
    const query = `*[_type == "order"] | order(date desc) {
      ...,
      items[]{
        ...,
        product->{ pricePerKilo }
      }
    }`;
    const metricsQuery = `*[_type == "dailyMetrics"] | order(date desc)`;
    
    const fetchOrdersAndMetrics = async () => {
      try {
        const [data, metricsData] = await Promise.all([
          client.fetch(query),
          client.fetch(metricsQuery)
        ]);
        
        // Deduplicar: dar prioridad a los borradores para reflejar cambios no publicados
        const orderMap = new Map();
        data.forEach((doc: any) => {
          const id = doc._id.replace('drafts.', '');
          if (doc._id.startsWith('drafts.')) {
            orderMap.set(id, doc);
          } else {
            if (!orderMap.has(id)) {
              orderMap.set(id, doc);
            }
          }
        });
        
        const uniqueOrders = Array.from(orderMap.values());
        // Reordenar por fecha ya que la deduplicación puede alterar el orden original
        uniqueOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setOrders(uniqueOrders);
        setMetrics(metricsData || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };

    fetchOrdersAndMetrics();

    // Suscribirse a los cambios en tiempo real
    const subscription = client.listen(query).subscribe(() => {
      fetchOrdersAndMetrics();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111827', color: 'white' }}>
        <h2>Cargando resumen de ventas...</h2>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    const searchString = search.toLowerCase();
    const orderEmail = order.shippingAddress?.email || order.email || '';
    if (search && !order.orderNumber?.toLowerCase().includes(searchString) && !orderEmail.toLowerCase().includes(searchString)) {
        return false;
    }
    if (statusFilter !== 'Todos los estados' && order.status !== statusFilter) {
        return false;
    }
    if (paymentFilter !== 'Todos' && order.paymentMethod !== paymentFilter) {
        return false;
    }

    // Period/Date Filtering
    if (order.date) {
      const orderDate = new Date(order.date);
      const now = new Date();

      if (period === 'Hoy') {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        if (orderDate < todayStart) return false;
      } else if (period === '7 días') {
        const last7Days = new Date();
        last7Days.setDate(now.getDate() - 7);
        last7Days.setHours(0,0,0,0);
        if (orderDate < last7Days) return false;
      } else if (period === 'Este mes') {
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (orderDate < thisMonthStart) return false;
      } else if (period === '3 meses') {
        const last3Months = new Date();
        last3Months.setMonth(now.getMonth() - 3);
        last3Months.setHours(0,0,0,0);
        if (orderDate < last3Months) return false;
      } else if (period === 'Este año') {
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        if (orderDate < thisYearStart) return false;
      } else if (period === 'Rango personalizado') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          if (orderDate > end) return false;
        }
      }
    } else {
      if (period !== 'Todos') return false;
    }

    return true;
  });

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((acc, order) => order.status !== 'cancelled' ? acc + (order.total || 0) : acc, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;

  // Filter metrics based on period
  const filteredMetrics = metrics.filter(m => {
    if (period === 'Todos') return true;
    if (!m.date) return false;
    
    const mDate = new Date(m.date);
    const now = new Date();
    
    if (period === 'Hoy') {
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      return mDate >= todayStart;
    } else if (period === '7 días') {
      const last7Days = new Date();
      last7Days.setDate(now.getDate() - 7);
      last7Days.setHours(0,0,0,0);
      return mDate >= last7Days;
    } else if (period === 'Este mes') {
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return mDate >= thisMonthStart;
    } else if (period === '3 meses') {
      const last3Months = new Date();
      last3Months.setMonth(now.getMonth() - 3);
      last3Months.setHours(0,0,0,0);
      return mDate >= last3Months;
    } else if (period === 'Este año') {
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      return mDate >= thisYearStart;
    } else if (period === 'Rango personalizado') {
      let valid = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (mDate < start) valid = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (mDate > end) valid = false;
      }
      return valid;
    }
    return true;
  });

  const totalAddsToCart = filteredMetrics.reduce((acc, m) => acc + (m.addsToCart || 0), 0);

  // Using Checkouts Started as baseline if available, otherwise Adds to Cart, to calculate abandonments
  const totalCheckoutsStarted = filteredMetrics.reduce((acc, m) => acc + (m.checkoutsStarted || 0), 0);
  
  // Para carritos abandonados usamos los checkouts iniciados menos los pedidos REALES (totalOrders) en este mismo periodo y filtros.
  // Esto es más preciso que m.purchases ya que cuenta exactamente cuántos pedidos de la tabla coinciden.
  // Si no hay checkouts registrados, usamos agregados al carrito menos pedidos.
  const baseLine = totalCheckoutsStarted > 0 ? totalCheckoutsStarted : totalAddsToCart;
  const totalAbandonments = Math.max(0, baseLine - totalOrders);
  
  const statusStats = [
    { id: 'pending', label: 'Pendiente', count: filteredOrders.filter(o => o.status === 'pending').length, revenue: filteredOrders.filter(o => o.status === 'pending').reduce((a, o) => a + (o.total||0), 0), color: '#fef08a', textCol: '#854d0e', barCol: '#eab308' },
    { id: 'paid', label: 'Pagado', count: filteredOrders.filter(o => o.status === 'paid').length, revenue: filteredOrders.filter(o => o.status === 'paid').reduce((a, o) => a + (o.total||0), 0), color: '#e0f2fe', textCol: '#0369a1', barCol: '#0ea5e9' },
    { id: 'processing', label: 'Procesando', count: filteredOrders.filter(o => o.status === 'processing').length, revenue: filteredOrders.filter(o => o.status === 'processing').reduce((a, o) => a + (o.total||0), 0), color: '#f3e8ff', textCol: '#7e22ce', barCol: '#a855f7' },
    { id: 'shipped', label: 'Enviado', count: filteredOrders.filter(o => o.status === 'shipped').length, revenue: filteredOrders.filter(o => o.status === 'shipped').reduce((a, o) => a + (o.total||0), 0), color: '#cffafe', textCol: '#0f766e', barCol: '#06b6d4' },
    { id: 'delivered', label: 'Entregado', count: deliveredOrders, revenue: filteredOrders.filter(o => o.status === 'delivered').reduce((a, o) => a + (o.total||0), 0), color: '#dcfce7', textCol: '#15803d', barCol: '#22c55e' },
    { id: 'cancelled', label: 'Cancelados', count: filteredOrders.filter(o => o.status === 'cancelled').length, revenue: filteredOrders.filter(o => o.status === 'cancelled').reduce((a, o) => a + (o.total||0), 0), color: '#fee2e2', textCol: '#b91c1c', barCol: '#ef4444' },
  ];

  const paymentCounts = {
    wompi: filteredOrders.filter(o => o.paymentMethod === 'wompi').length,
    cod: filteredOrders.filter(o => o.paymentMethod === 'cod').length,
  };

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  const Card = ({ children, style = {} }: any) => (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', ...style }}>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#9ca3af', fontSize: '1rem', fontWeight: 500, marginBottom: '20px' }}>Resumen y análisis de ventas en tiempo real</h1>
      
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <Card style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Añadidos al Carrito</p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '4px 0' }}>{totalAddsToCart}</h3>
            </div>
            <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '50%' }}>
              <ShoppingCart style={{ color: '#3b82f6', width: '24px', height: '24px' }} />
            </div>
          </div>
        </Card>
        
        <Card style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pedidos Reales</p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '4px 0' }}>{totalOrders}</h3>
            </div>
            <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '50%' }}>
              <CheckCircle style={{ color: '#10b981', width: '24px', height: '24px' }} />
            </div>
          </div>
        </Card>
        
        <Card style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Carritos Abandonados</p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '4px 0' }}>{totalAbandonments}</h3>
              <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                {totalCheckoutsStarted > 0 ? 'Desde el checkout' : 'Desde el carrito'}
              </p>
            </div>
            <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '50%' }}>
              <TrendingUp style={{ color: '#ef4444', width: '24px', height: '24px', transform: 'scaleY(-1)' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #6b7280' }}>
          <ShoppingCart size={32} color="#4b5563" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: 0 }}>{totalOrders}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Total Pedidos</p>
        </Card>
        
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #10b981' }}>
          <DollarSign size={32} color="#10b981" style={{ marginBottom: '12px', background: '#d1fae5', borderRadius: '50%', padding: '4px' }} />
          <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#10b981', margin: 0 }}>{formatter.format(totalRevenue)}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Ingresos Totales</p>
        </Card>
        
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #8b5cf6' }}>
          <TrendingUp size={32} color="#8b5cf6" style={{ marginBottom: '12px', background: '#ede9fe', borderRadius: '50%', padding: '4px' }} />
          <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#8b5cf6', margin: 0 }}>{formatter.format(avgTicket)}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Ticket Promedio</p>
        </Card>
        
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #3b82f6' }}>
          <CheckCircle size={32} color="#10b981" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9', margin: 0 }}>{deliveredOrders}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Entregados</p>
        </Card>
      </div>

      {/* Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', color: '#1f2937' }}>Pedidos por Estado</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {statusStats.map(stat => {
              const percentage = totalOrders > 0 ? Math.round((stat.count / totalOrders) * 100) : 0;
              return (
                <div key={stat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', backgroundColor: stat.color, border: `1px solid ${stat.barCol}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '50%' }}>
                    <span style={{ color: stat.textCol, fontWeight: 600, fontSize: '0.875rem', minWidth: '80px' }}>{stat.label}</span>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: stat.barCol, borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: stat.textCol, fontWeight: 700, fontSize: '1rem' }}>{stat.count} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({percentage}%)</span></span>
                    <span style={{ color: stat.textCol, fontWeight: 600, fontSize: '0.875rem', minWidth: '100px', textAlign: 'right' }}>{formatter.format(stat.revenue)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', color: '#1f2937' }}>Método de Pago</h2>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Wompi</span>
              <span style={{ fontWeight: 700, color: '#0ea5e9' }}>{paymentCounts.wompi} pedidos</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{ width: `${totalOrders > 0 ? (paymentCounts.wompi / totalOrders) * 100 : 0}%`, height: '100%', backgroundColor: '#0ea5e9' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{totalOrders > 0 ? Math.round((paymentCounts.wompi / totalOrders) * 100) : 0}% del total</span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Contraentrega</span>
              <span style={{ fontWeight: 700, color: '#8b5cf6' }}>{paymentCounts.cod} pedidos</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{ width: `${totalOrders > 0 ? (paymentCounts.cod / totalOrders) * 100 : 0}%`, height: '100%', backgroundColor: '#8b5cf6' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{totalOrders > 0 ? Math.round((paymentCounts.cod / totalOrders) * 100) : 0}% del total</span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>Filtros</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Período</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Hoy', '7 días', 'Este mes', '3 meses', 'Este año', 'Todos', 'Rango personalizado'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    border: `1px solid ${period === p ? '#3b82f6' : '#e5e7eb'}`, 
                    backgroundColor: period === p ? '#eff6ff' : 'white',
                    color: period === p ? '#2563eb' : '#4b5563',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: period === p ? 600 : 400
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {period === 'Rango personalizado' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Desde</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Hasta</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151' }}
                />
              </div>
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Estado</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', minWidth: '180px' }}
            >
              <option value="Todos los estados">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Método de Pago</label>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', minWidth: '180px' }}
            >
              <option value="Todos">Todos</option>
              <option value="wompi">Wompi</option>
              <option value="cod">Contraentrega</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Buscar</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="N° pedido, nombre, email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', paddingLeft: '32px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', boxSizing: 'border-box' }}
              />
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Detalle de Pedidos</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Bulk Action UI */}
            {selectedOrders.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#eff6ff', padding: '4px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>{selectedOrders.length} seleccionados</span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #93c5fd', outline: 'none', fontSize: '0.875rem', backgroundColor: 'white' }}
                >
                  <option value="" disabled>Cambiar a...</option>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatus || isUpdating}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: (!bulkStatus || isUpdating) ? 'not-allowed' : 'pointer',
                    opacity: (!bulkStatus || isUpdating) ? 0.7 : 1
                  }}
                >
                  {isUpdating ? 'Actualizando...' : 'Aplicar'}
                </button>
              </div>
            )}

            <button
              onClick={downloadProductsCSV}
              disabled={downloadingCsv}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: downloadingCsv ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                opacity: downloadingCsv ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!downloadingCsv) e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseOut={(e) => {
                if (!downloadingCsv) e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              <Download size={16} />
              {downloadingCsv ? 'Generando CSV...' : 'Descargar CSV Productos'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                    onChange={(e) => toggleSelectAll(e, filteredOrders)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>N° Pedido</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const isExpanded = expandedOrder === order._id;
                const statusInfo = statusStats.find(s => s.id === order.status);
                
                return (
                  <React.Fragment key={order._id}>
                    <tr 
                      onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                      style={{ 
                        borderBottom: '1px solid #e5e7eb', 
                        cursor: 'pointer', 
                        backgroundColor: isExpanded ? '#f9fafb' : (selectedOrders.includes(order._id) ? '#eff6ff' : 'white'), 
                        transition: 'background 0.2s' 
                      }}
                    >
                      <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedOrders.includes(order._id)}
                          onChange={(e) => toggleSelectOrder(e, order._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>#{order.orderNumber}</td>
                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                        {order.date ? new Date(order.date).toLocaleDateString('es-CO') : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#1f2937' }}>{order.shippingAddress?.fullName || 'N/A'}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{order.shippingAddress?.email || order.email || 'Sin correo'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '999px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: statusInfo?.color || '#f3f4f6',
                          color: statusInfo?.textCol || '#374151'
                        }}>
                          {statusInfo?.label || order.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#10b981' }}>
                        {formatter.format(order.total || 0)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td colSpan={6} style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                            {/* Información de envío */}
                            <div>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Envío y Contacto</h4>
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Email:</strong> {order.shippingAddress?.email || order.email || 'N/A'}</p>
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Nombre Completo:</strong> {order.shippingAddress?.fullName || 'N/A'}</p>
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Documento de Identidad:</strong> {order.shippingAddress?.documentId || 'N/A'}</p>
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>País / Región:</strong> {order.shippingAddress?.country || 'N/A'}</p>
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Departamento:</strong> {order.shippingAddress?.department || 'N/A'}</p>
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Población / Ciudad:</strong> {order.shippingAddress?.city || 'N/A'}</p>
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Dirección de la calle:</strong> {order.shippingAddress?.address || 'N/A'}</p>
                              {order.shippingAddress?.apartment && <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Apartamento/habitación:</strong> {order.shippingAddress?.apartment}</p>}
                              {order.shippingAddress?.zipCode && <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Código postal:</strong> {order.shippingAddress?.zipCode}</p>}
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Celular:</strong> {order.shippingAddress?.phone || 'N/A'}</p>
                              {order.shippingAddress?.company && <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Compañía:</strong> {order.shippingAddress?.company}</p>}
                              <p style={{ margin: '6px 0', fontSize: '0.875rem', color: '#4b5563' }}><strong>Método de pago:</strong> <span style={{ fontWeight: 600, color: order.paymentMethod === 'wompi' ? '#0ea5e9' : '#8b5cf6' }}>{order.paymentMethod === 'wompi' ? 'Wompi' : 'Contraentrega'}</span></p>
                            </div>
                            
                            {/* Productos */}
                            <div>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos comprados</h4>
                              <ul style={{ margin: 0, padding: 0, listStyle: 'none', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                {order.items?.length > 0 ? order.items.map((item: any, i: number) => (
                                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: i !== order.items.length - 1 ? '1px solid #e5e7eb' : 'none', fontSize: '0.875rem', color: '#4b5563' }}>
                                    <span><strong style={{ color: '#111827' }}>{item.quantity}x</strong> {item.productName || item.name || 'Producto'}</span>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>{formatter.format((item.price || 0) * (item.quantity || 1))}</span>
                                  </li>
                                )) : <li style={{ padding: '12px', fontSize: '0.875rem', color: '#6b7280' }}>No hay productos registrados</li>}
                              </ul>
                              
                              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065f46' }}>📦 Peso aproximado del paquete:</span>
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#047857' }}>
                                  {(() => {
                                      if (!order.items || order.items.length === 0) return "0.00 kg";
                                      let totalWeightKg = 0;
                                      order.items.forEach((item: any) => {
                                          const qty = item.quantity || 1;
                                          const price = item.price || 0;
                                          const pricePerKilo = item.product?.pricePerKilo;
                                          if (pricePerKilo && pricePerKilo > 0) {
                                              totalWeightKg += (price * qty) / pricePerKilo;
                                          } else {
                                              totalWeightKg += (0.25 * qty);
                                          }
                                      });
                                      return `${totalWeightKg.toFixed(2)} kg`;
                                  })()}
                                </span>
                              </div>
                              
                              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                <a 
                                  href={`/admin/intent/edit/id=${order._id};type=order`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ 
                                    backgroundColor: '#111827', 
                                    color: 'white', 
                                    padding: '8px 16px', 
                                    borderRadius: '6px', 
                                    textDecoration: 'none', 
                                    fontSize: '0.875rem', 
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                  Ver/Editar Documento ↗
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                    No se encontraron pedidos con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer Branding K&T */}
      <footer style={{ marginTop: '32px', textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '0.875rem' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          &copy; {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
        </p>
        <a href="https://www.kytcode.lat" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}>
          Desarrollado por K&T 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </a>
      </footer>
    </div>
  );
}
