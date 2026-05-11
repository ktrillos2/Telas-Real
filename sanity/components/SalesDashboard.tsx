import React, { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { ShoppingCart, DollarSign, TrendingUp, CheckCircle, Search } from 'lucide-react';

export function SalesDashboard() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [period, setPeriod] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const query = `*[_type == "order" && !(_id in path("drafts.**"))] | order(date desc)`;
      const data = await client.fetch(query);
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
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
    return true;
  });

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;
  
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
      
      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>Filtros</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Período</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Hoy', '7 días', 'Este mes', '3 meses', 'Este año', 'Todos'].map(p => (
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

      {/* Orders Table */}
      <Card style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', color: '#1f2937' }}>Detalle de Pedidos</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' }}>
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
                        backgroundColor: isExpanded ? '#f9fafb' : 'white', 
                        transition: 'background 0.2s' 
                      }}
                    >
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
                        <td colSpan={5} style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
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
                                    <span><strong style={{ color: '#111827' }}>{item.quantity}x</strong> {item.productName || 'Producto'}</span>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>{formatter.format((item.price || 0) * (item.quantity || 1))}</span>
                                  </li>
                                )) : <li style={{ padding: '12px', fontSize: '0.875rem', color: '#6b7280' }}>No hay productos registrados</li>}
                              </ul>
                              
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
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                    No se encontraron pedidos con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
