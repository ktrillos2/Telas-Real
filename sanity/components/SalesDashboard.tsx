import React, { useEffect, useState, useMemo } from 'react';
import { useClient } from 'sanity';
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Search, 
  Download, 
  Users, 
  User, 
  UserCheck, 
  UserMinus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ExternalLink,
  MessageCircle,
  Package,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';

export function SalesDashboard() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingCustomerCsv, setDownloadingCustomerCsv] = useState(false);
  
  // Filters
  const [period, setPeriod] = useState('8 meses'); // Default to 8 months as requested
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Active View Tab: 'orders' | 'single_buyers' | 'repeat_buyers' | 'abandoned_carts' | 'all_customers'
  const [viewTab, setViewTab] = useState<'orders' | 'single_buyers' | 'repeat_buyers' | 'abandoned_carts' | 'all_customers'>('orders');

  // Customer search filter
  const [customerSearch, setCustomerSearch] = useState('');

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
        'item group id', 'sell on google quantity'
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
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedOrders(prev => [...prev, id]);
    } else {
      setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
    }
  };

  useEffect(() => {
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
        
        // Deduplicar borradores y publicados
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

    const subscription = client.listen(query).subscribe(() => {
      fetchOrdersAndMetrics();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  // Order filtering based on period, status, payment, search
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchString = search.toLowerCase();
      const orderEmail = order.shippingAddress?.email || order.email || '';
      const orderDoc = order.shippingAddress?.documentId || '';
      const orderName = order.shippingAddress?.fullName || '';
      const orderPhone = order.shippingAddress?.phone || '';

      if (search && 
          !order.orderNumber?.toLowerCase().includes(searchString) && 
          !orderEmail.toLowerCase().includes(searchString) &&
          !orderDoc.toLowerCase().includes(searchString) &&
          !orderName.toLowerCase().includes(searchString) &&
          !orderPhone.toLowerCase().includes(searchString)) {
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
        } else if (period === '6 meses') {
          const last6Months = new Date();
          last6Months.setMonth(now.getMonth() - 6);
          last6Months.setHours(0,0,0,0);
          if (orderDate < last6Months) return false;
        } else if (period === '8 meses') {
          const last8Months = new Date();
          last8Months.setMonth(now.getMonth() - 8);
          last8Months.setHours(0,0,0,0);
          if (orderDate < last8Months) return false;
        } else if (period === 'Este año') {
          const thisYearStart = new Date(now.getFullYear(), 0, 1);
          if (orderDate < thisYearStart) return false;
        } else if (period === 'Rango personalizado') {
          if (startDate) {
            const start = new Date(`${startDate}T00:00:00`);
            if (orderDate < start) return false;
          }
          if (endDate) {
            const end = new Date(`${endDate}T23:59:59.999`);
            if (orderDate > end) return false;
          }
        }
      } else {
        if (period !== 'Todos') return false;
      }

      return true;
    });
  }, [orders, search, statusFilter, paymentFilter, period, startDate, endDate]);

  // Aggregate Customer Data based on valid (non-cancelled or filtered) orders in this timeframe
  const customerAnalytics = useMemo(() => {
    const map = new Map<string, {
      id: string;
      fullName: string;
      documentId: string;
      email: string;
      phone: string;
      city: string;
      department: string;
      address: string;
      orders: any[];
      totalSpent: number;
      firstOrderDate: string;
      lastOrderDate: string;
      statusSummary: Record<string, number>;
    }>();

    filteredOrders.forEach(order => {
      // Ignore cancelled orders for buyer frequency counting unless user explicitly filtered by cancelled
      if (statusFilter === 'Todos los estados' && order.status === 'cancelled') {
        return;
      }

      const docId = (order.shippingAddress?.documentId || '').trim().replace(/[\s.-]/g, '');
      const email = (order.shippingAddress?.email || order.email || '').trim().toLowerCase();
      const phone = (order.shippingAddress?.phone || '').trim().replace(/[\s()\-+]/g, '');
      const name = (order.shippingAddress?.fullName || 'Cliente sin nombre').trim();

      // Customer unique key priority: Document ID -> Email -> Phone -> Name
      const uniqueKey = docId || email || phone || name.toLowerCase();
      if (!uniqueKey) return;

      if (!map.has(uniqueKey)) {
        map.set(uniqueKey, {
          id: uniqueKey,
          fullName: name,
          documentId: order.shippingAddress?.documentId || 'N/A',
          email: order.shippingAddress?.email || order.email || '',
          phone: order.shippingAddress?.phone || '',
          city: order.shippingAddress?.city || 'N/A',
          department: order.shippingAddress?.department || '',
          address: order.shippingAddress?.address || '',
          orders: [order],
          totalSpent: Number(order.total || 0),
          firstOrderDate: order.date,
          lastOrderDate: order.date,
          statusSummary: { [order.status || 'pending']: 1 }
        });
      } else {
        const existing = map.get(uniqueKey)!;
        existing.orders.push(order);
        existing.totalSpent += Number(order.total || 0);
        
        if ((!existing.email || existing.email === '') && (order.shippingAddress?.email || order.email)) {
          existing.email = order.shippingAddress?.email || order.email;
        }
        if ((!existing.phone || existing.phone === '') && order.shippingAddress?.phone) {
          existing.phone = order.shippingAddress?.phone;
        }
        if ((!existing.documentId || existing.documentId === 'N/A') && order.shippingAddress?.documentId) {
          existing.documentId = order.shippingAddress?.documentId;
        }
        if ((!existing.city || existing.city === 'N/A') && order.shippingAddress?.city) {
          existing.city = order.shippingAddress?.city;
        }
        if (!existing.department && order.shippingAddress?.department) {
          existing.department = order.shippingAddress?.department;
        }

        const currentStatus = order.status || 'pending';
        existing.statusSummary[currentStatus] = (existing.statusSummary[currentStatus] || 0) + 1;

        if (order.date && new Date(order.date) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.date;
        }
        if (order.date && new Date(order.date) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = order.date;
        }
      }
    });

    const allCustomers = Array.from(map.values()).sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
    const singlePurchaseCustomers = allCustomers.filter(c => c.orders.length === 1);
    const repeatCustomers = allCustomers.filter(c => c.orders.length > 1);
    const abandonedCartCustomers = allCustomers.filter(c => c.orders.some(o => o.status === 'pending'));

    const totalUniqueCustomers = allCustomers.length;
    const singlePurchaseCount = singlePurchaseCustomers.length;
    const repeatPurchaseCount = repeatCustomers.length;
    const abandonedCartCount = abandonedCartCustomers.length;

    const singlePurchaseRevenue = singlePurchaseCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
    const repeatPurchaseRevenue = repeatCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
    const totalCustomerRevenue = allCustomers.reduce((acc, c) => acc + c.totalSpent, 0);

    const abandonedCartRevenue = abandonedCartCustomers.reduce((acc, c) => {
      const pendingTotal = c.orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + Number(o.total || 0), 0);
      return acc + pendingTotal;
    }, 0);
    const totalAbandonedOrders = abandonedCartCustomers.reduce((acc, c) => acc + c.orders.filter(o => o.status === 'pending').length, 0);
    const avgAbandonedTicket = totalAbandonedOrders > 0 ? abandonedCartRevenue / totalAbandonedOrders : 0;

    const singlePurchasePercentage = totalUniqueCustomers > 0 
      ? Math.round((singlePurchaseCount / totalUniqueCustomers) * 100) 
      : 0;

    const repeatPurchasePercentage = totalUniqueCustomers > 0 
      ? Math.round((repeatPurchaseCount / totalUniqueCustomers) * 100) 
      : 0;

    const avgSingleTicket = singlePurchaseCount > 0 ? singlePurchaseRevenue / singlePurchaseCount : 0;
    const avgRepeatRevenuePerCustomer = repeatPurchaseCount > 0 ? repeatPurchaseRevenue / repeatPurchaseCount : 0;

    return {
      allCustomers,
      singlePurchaseCustomers,
      repeatCustomers,
      abandonedCartCustomers,
      totalUniqueCustomers,
      singlePurchaseCount,
      repeatPurchaseCount,
      abandonedCartCount,
      abandonedCartRevenue,
      avgAbandonedTicket,
      singlePurchaseRevenue,
      repeatPurchaseRevenue,
      totalCustomerRevenue,
      singlePurchasePercentage,
      repeatPurchasePercentage,
      avgSingleTicket,
      avgRepeatRevenuePerCustomer
    };
  }, [filteredOrders, statusFilter]);

  // Filtered customer list for display based on customer search input
  const displayedCustomers = useMemo(() => {
    let list = customerAnalytics.allCustomers;
    if (viewTab === 'single_buyers') {
      list = customerAnalytics.singlePurchaseCustomers;
    } else if (viewTab === 'repeat_buyers') {
      list = customerAnalytics.repeatCustomers;
    } else if (viewTab === 'abandoned_carts') {
      list = customerAnalytics.abandonedCartCustomers;
    }

    if (!customerSearch) return list;

    const q = customerSearch.toLowerCase();
    return list.filter(c => 
      c.fullName.toLowerCase().includes(q) ||
      c.documentId.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.orders.some(o => o.orderNumber?.toLowerCase().includes(q))
    );
  }, [customerAnalytics, viewTab, customerSearch]);

  const downloadCustomersCSV = (listToExport: typeof customerAnalytics.allCustomers, typeName: string) => {
    try {
      setDownloadingCustomerCsv(true);
      const headers = [
        'Nombre Completo',
        'Documento',
        'Email',
        'Telefono',
        'Ciudad',
        'Departamento',
        'Direccion',
        'Cantidad Pedidos',
        'Numeros de Pedido',
        'Total Comprado (COP)',
        'Fecha Primera Compra',
        'Fecha Ultima Compra'
      ];

      const rows = listToExport.map(c => {
        const orderNumbers = c.orders.map(o => `#${o.orderNumber}`).join(' | ');
        const data = [
          c.fullName || '',
          c.documentId || '',
          c.email || '',
          c.phone || '',
          c.city || '',
          c.department || '',
          c.address || '',
          String(c.orders.length),
          orderNumbers,
          String(c.totalSpent || 0),
          c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString('es-CO') : '',
          c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('es-CO') : '',
        ];

        return data.map(val => {
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanPeriod = period.replace(/\s+/g, '_').toLowerCase();
      link.setAttribute('download', `${typeName}_${cleanPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading customer CSV:', err);
      alert('Error al descargar el CSV: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingCustomerCsv(false);
    }
  };

  const downloadAbandonedCartsCSV = (listToExport: typeof customerAnalytics.allCustomers) => {
    try {
      setDownloadingCustomerCsv(true);
      const headers = [
        'ID / Numero Pedido',
        'Fecha Carrito / Abandono',
        'Nombre Cliente',
        'Documento',
        'Email',
        'Telefono',
        'Enlace WhatsApp Directo',
        'Ciudad',
        'Departamento',
        'Direccion',
        'Total Carrito (COP)',
        'Cantidad Telas / Items',
        'Detalle Telas en Carrito',
        'SMS Recuperacion Enviado',
        'Email Recuperacion Enviado',
        'Fecha Notificacion'
      ];

      const rows: string[] = [];

      listToExport.forEach(customer => {
        const pendingOrders = customer.orders.filter(o => o.status === 'pending');
        const ordersToProcess = pendingOrders.length > 0 ? pendingOrders : customer.orders;

        ordersToProcess.forEach((order: any) => {
          const rawPhone = (order.shippingAddress?.phone || customer.phone || '').trim();
          const cleanDigits = rawPhone.replace(/\D/g, '');
          const waNumber = cleanDigits.startsWith('57') ? cleanDigits : (cleanDigits ? `57${cleanDigits}` : '');
          const waLink = waNumber ? `https://wa.me/${waNumber}` : '';

          const itemsText = (order.items || []).map((it: any) => {
            const qty = it.quantity || 1;
            const design = it.designName ? ` [Diseño: ${it.designName}]` : '';
            return `${it.name || 'Tela'} (${qty}m)${design} - $${Number(it.price || 0).toLocaleString('es-CO')}`;
          }).join(' | ');

          const data = [
            order.orderNumber ? `#${order.orderNumber}` : (order._id || ''),
            order.date ? new Date(order.date).toLocaleString('es-CO') : (order._createdAt ? new Date(order._createdAt).toLocaleString('es-CO') : ''),
            order.shippingAddress?.fullName || customer.fullName || 'Cliente sin nombre',
            order.shippingAddress?.documentId || customer.documentId || '',
            order.shippingAddress?.email || order.email || customer.email || '',
            rawPhone,
            waLink,
            order.shippingAddress?.city || customer.city || '',
            order.shippingAddress?.department || customer.department || '',
            order.shippingAddress?.address || customer.address || '',
            String(order.total || 0),
            String((order.items || []).length),
            itemsText,
            order.abandonedSmsSent ? 'SI' : 'NO',
            order.abandonedEmailSent ? 'SI' : 'NO',
            order.abandonedNotifiedAt ? new Date(order.abandonedNotifiedAt).toLocaleString('es-CO') : 'Pendiente'
          ];

          rows.push(
            data.map(val => {
              const str = String(val || '');
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            }).join(',')
          );
        });
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanPeriod = period.replace(/\s+/g, '_').toLowerCase();
      link.setAttribute('download', `carritos_abandonados_telas_real_${cleanPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading abandoned carts CSV:', err);
      alert('Error al descargar el CSV: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingCustomerCsv(false);
    }
  };

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
    } else if (period === '6 meses') {
      const last6Months = new Date();
      last6Months.setMonth(now.getMonth() - 6);
      last6Months.setHours(0,0,0,0);
      return mDate >= last6Months;
    } else if (period === '8 meses') {
      const last8Months = new Date();
      last8Months.setMonth(now.getMonth() - 8);
      last8Months.setHours(0,0,0,0);
      return mDate >= last8Months;
    } else if (period === 'Este año') {
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      return mDate >= thisYearStart;
    } else if (period === 'Rango personalizado') {
      let valid = true;
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (mDate < start) valid = false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);
        if (mDate > end) valid = false;
      }
      return valid;
    }
    return true;
  });

  const totalAddsToCart = filteredMetrics.reduce((acc, m) => acc + (m.addsToCart || 0), 0);
  const totalCheckoutsStarted = filteredMetrics.reduce((acc, m) => acc + (m.checkoutsStarted || 0), 0);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111827', color: 'white' }}>
        <h2>Cargando resumen de ventas...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100%', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: '#f3f4f6', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0' }}>Panel de Estadísticas y Ventas</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            Análisis en tiempo real • Período actual: <strong style={{ color: '#38bdf8' }}>{period}</strong>
            {period === 'Rango personalizado' && startDate && ` (${startDate} a ${endDate || 'hoy'})`}
          </p>
        </div>
      </div>
      
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
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
              <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
                {totalCheckoutsStarted > 0 ? 'Desde el checkout' : 'Desde el carrito'}
              </p>
            </div>
            <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '50%' }}>
              <TrendingUp style={{ color: '#ef4444', width: '24px', height: '24px', transform: 'scaleY(-1)' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Financial Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #6b7280' }}>
          <ShoppingCart size={32} color="#4b5563" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: 0 }}>{totalOrders}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Total Pedidos</p>
        </Card>
        
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #10b981' }}>
          <DollarSign size={32} color="#10b981" style={{ marginBottom: '12px', background: '#d1fae5', borderRadius: '50%', padding: '4px' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: 0 }}>{formatter.format(totalRevenue)}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Ingresos Totales</p>
        </Card>
        
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #8b5cf6' }}>
          <TrendingUp size={32} color="#8b5cf6" style={{ marginBottom: '12px', background: '#ede9fe', borderRadius: '50%', padding: '4px' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', margin: 0 }}>{formatter.format(avgTicket)}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Ticket Promedio</p>
        </Card>
        
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '4px solid #3b82f6' }}>
          <CheckCircle size={32} color="#10b981" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9', margin: 0 }}>{deliveredOrders}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>Entregados</p>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 🎯 SECCIÓN PRINCIPAL: ANÁLISIS DE CLIENTES (1 SOLA COMPRA vs RECURRENTES) */}
      {/* ========================================================================= */}
      <Card style={{ marginBottom: '24px', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#0284c7', padding: '10px', borderRadius: '8px', color: 'white' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Análisis de Frecuencia de Compra de Clientes
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Estadísticas de clientes con 1 sola compra vs clientes recurrentes en el período seleccionado ({period})
              </p>
            </div>
          </div>

          {/* Quick Action Buttons to download 1-time buyers and abandoned carts */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => downloadAbandonedCartsCSV(customerAnalytics.abandonedCartCustomers)}
              disabled={downloadingCustomerCsv || customerAnalytics.abandonedCartCount === 0}
              style={{
                backgroundColor: '#e11d48',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: customerAnalytics.abandonedCartCount === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: customerAnalytics.abandonedCartCount === 0 ? 0.6 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <ShoppingCart size={16} />
              Exportar Carritos Abandonados ({customerAnalytics.abandonedCartCount})
            </button>

            <button
              onClick={() => downloadCustomersCSV(customerAnalytics.singlePurchaseCustomers, 'clientes_1_sola_compra')}
              disabled={downloadingCustomerCsv || customerAnalytics.singlePurchaseCount === 0}
              style={{
                backgroundColor: '#f59e0b',
                color: '#78350f',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: customerAnalytics.singlePurchaseCount === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: customerAnalytics.singlePurchaseCount === 0 ? 0.6 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Download size={16} />
              Exportar Clientes 1 Sola Compra ({customerAnalytics.singlePurchaseCount})
            </button>
          </div>
        </div>

        {/* Customer Breakdown 5-Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Card 1: 1 Sola Compra */}
          <div 
            onClick={() => setViewTab('single_buyers')}
            style={{ 
              backgroundColor: viewTab === 'single_buyers' ? '#451a03' : '#0f172a', 
              borderRadius: '10px', 
              padding: '16px', 
              border: `2px solid ${viewTab === 'single_buyers' ? '#f59e0b' : '#334155'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1 Sola Compra
              </span>
              <span style={{ backgroundColor: '#78350f', color: '#fef3c7', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                {customerAnalytics.singlePurchasePercentage}% del total
              </span>
            </div>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fef3c7', margin: '4px 0' }}>
              {customerAnalytics.singlePurchaseCount}
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#d97706', marginLeft: '6px' }}>clientes</span>
            </h3>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <span>Total Comprado:</span>
              <strong style={{ color: '#fbbf24' }}>{formatter.format(customerAnalytics.singlePurchaseRevenue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              <span>Ticket Promedio:</span>
              <span>{formatter.format(customerAnalytics.avgSingleTicket)}</span>
            </div>
          </div>

          {/* Card 2: Clientes Recurrentes (2+ compras) */}
          <div 
            onClick={() => setViewTab('repeat_buyers')}
            style={{ 
              backgroundColor: viewTab === 'repeat_buyers' ? '#064e3b' : '#0f172a', 
              borderRadius: '10px', 
              padding: '16px', 
              border: `2px solid ${viewTab === 'repeat_buyers' ? '#10b981' : '#334155'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Clientes Recurrentes (2+)
              </span>
              <span style={{ backgroundColor: '#065f46', color: '#d1fae5', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                {customerAnalytics.repeatPurchasePercentage}% del total
              </span>
            </div>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#d1fae5', margin: '4px 0' }}>
              {customerAnalytics.repeatPurchaseCount}
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#059669', marginLeft: '6px' }}>clientes</span>
            </h3>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <span>Total Comprado:</span>
              <strong style={{ color: '#34d399' }}>{formatter.format(customerAnalytics.repeatPurchaseRevenue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              <span>Promedio / Cliente:</span>
              <span>{formatter.format(customerAnalytics.avgRepeatRevenuePerCustomer)}</span>
            </div>
          </div>

          {/* Card 3: Carritos Abandonados (Pendientes) */}
          <div 
            onClick={() => setViewTab('abandoned_carts')}
            style={{ 
              backgroundColor: viewTab === 'abandoned_carts' ? '#4c0519' : '#0f172a', 
              borderRadius: '10px', 
              padding: '16px', 
              border: `2px solid ${viewTab === 'abandoned_carts' ? '#f43f5e' : '#334155'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Carritos Abandonados
              </span>
              <span style={{ backgroundColor: '#881337', color: '#ffe4e6', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                {customerAnalytics.abandonedCartCount} clientes
              </span>
            </div>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffe4e6', margin: '4px 0' }}>
              {customerAnalytics.abandonedCartCount}
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f43f5e', marginLeft: '6px' }}>pendientes</span>
            </h3>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <span>Total en Carrito:</span>
              <strong style={{ color: '#fb7185' }}>{formatter.format(customerAnalytics.abandonedCartRevenue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              <span>Ticket Promedio:</span>
              <span>{formatter.format(customerAnalytics.avgAbandonedTicket)}</span>
            </div>
          </div>

          {/* Card 4: Total Clientes Únicos */}
          <div 
            onClick={() => setViewTab('all_customers')}
            style={{ 
              backgroundColor: viewTab === 'all_customers' ? '#1e1b4b' : '#0f172a', 
              borderRadius: '10px', 
              padding: '16px', 
              border: `2px solid ${viewTab === 'all_customers' ? '#818cf8' : '#334155'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Clientes Únicos
              </span>
              <Users size={16} color="#a5b4fc" />
            </div>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#e0e7ff', margin: '4px 0' }}>
              {customerAnalytics.totalUniqueCustomers}
            </h3>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <span>Total Facturado:</span>
              <strong style={{ color: '#a5b4fc' }}>{formatter.format(customerAnalytics.totalCustomerRevenue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              <span>Tasa Recurrencia:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{customerAnalytics.repeatPurchasePercentage}%</span>
            </div>
          </div>

          {/* Card 4: Barra Comparativa Visual */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', padding: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
              Proporción de Clientes
            </span>
            
            {/* Visual Bar */}
            <div style={{ height: '14px', width: '100%', backgroundColor: '#334155', borderRadius: '7px', overflow: 'hidden', display: 'flex', marginBottom: '10px' }}>
              <div 
                style={{ 
                  width: `${customerAnalytics.singlePurchasePercentage}%`, 
                  backgroundColor: '#f59e0b',
                  height: '100%'
                }} 
                title={`1 Sola Compra: ${customerAnalytics.singlePurchasePercentage}%`}
              />
              <div 
                style={{ 
                  width: `${customerAnalytics.repeatPurchasePercentage}%`, 
                  backgroundColor: '#10b981',
                  height: '100%'
                }} 
                title={`Recurrentes: ${customerAnalytics.repeatPurchasePercentage}%`}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                1 Sola ({customerAnalytics.singlePurchasePercentage}%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Recurrentes ({customerAnalytics.repeatPurchasePercentage}%)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Breakdowns: Status & Payment */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px', color: '#1f2937' }}>Pedidos por Estado</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {statusStats.map(stat => {
              const percentage = totalOrders > 0 ? Math.round((stat.count / totalOrders) * 100) : 0;
              return (
                <div key={stat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: stat.color, border: `1px solid ${stat.barCol}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '50%' }}>
                    <span style={{ color: stat.textCol, fontWeight: 600, fontSize: '0.875rem', minWidth: '80px' }}>{stat.label}</span>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: stat.barCol, borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: stat.textCol, fontWeight: 700, fontSize: '0.9375rem' }}>{stat.count} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({percentage}%)</span></span>
                    <span style={{ color: stat.textCol, fontWeight: 600, fontSize: '0.875rem', minWidth: '90px', textAlign: 'right' }}>{formatter.format(stat.revenue)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px', color: '#1f2937' }}>Método de Pago</h2>
          
          <div style={{ marginBottom: '24px' }}>
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

      {/* Filters Card */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} />
          Filtros de Período y Pedidos
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
              Período de Análisis
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Hoy', '7 días', 'Este mes', '3 meses', '6 meses', '8 meses', 'Este año', 'Todos', 'Rango personalizado'].map(p => (
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
                    fontWeight: period === p ? 700 : 400,
                    transition: 'all 0.15s'
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {period === 'Rango personalizado' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Desde</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#374151', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Hasta</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#374151', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Estado de Pedido</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', minWidth: '160px', backgroundColor: 'white' }}
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
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', minWidth: '150px', backgroundColor: 'white' }}
            >
              <option value="Todos">Todos</option>
              <option value="wompi">Wompi</option>
              <option value="cod">Contraentrega</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Búsqueda Rápida</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Buscar por N° pedido, cliente, documento, email, celular..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', paddingLeft: '34px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', boxSizing: 'border-box', fontSize: '0.875rem' }}
              />
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 📑 TABS DE VISUALIZACIÓN: PEDIDOS vs LISTA DE CLIENTES (1 SOLA COMPRA)   */}
      {/* ========================================================================= */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setViewTab('orders')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: viewTab === 'orders' ? '#3b82f6' : '#1e293b',
            color: 'white',
            fontWeight: viewTab === 'orders' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <Package size={16} />
          Todos los Pedidos ({filteredOrders.length})
        </button>

        <button
          onClick={() => setViewTab('single_buyers')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: viewTab === 'single_buyers' ? '#d97706' : '#1e293b',
            color: 'white',
            fontWeight: viewTab === 'single_buyers' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <UserMinus size={16} />
          Clientes con 1 Sola Compra ({customerAnalytics.singlePurchaseCount})
        </button>

        <button
          onClick={() => setViewTab('repeat_buyers')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: viewTab === 'repeat_buyers' ? '#059669' : '#1e293b',
            color: 'white',
            fontWeight: viewTab === 'repeat_buyers' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <UserCheck size={16} />
          Clientes Recurrentes ({customerAnalytics.repeatPurchaseCount})
        </button>

        <button
          onClick={() => setViewTab('abandoned_carts')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: viewTab === 'abandoned_carts' ? '#e11d48' : '#1e293b',
            color: 'white',
            fontWeight: viewTab === 'abandoned_carts' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <ShoppingCart size={16} />
          Carritos Abandonados ({customerAnalytics.abandonedCartCount})
        </button>

        <button
          onClick={() => setViewTab('all_customers')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: viewTab === 'all_customers' ? '#6366f1' : '#1e293b',
            color: 'white',
            fontWeight: viewTab === 'all_customers' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
        >
          <Users size={16} />
          Todos los Clientes ({customerAnalytics.totalUniqueCustomers})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: TABLA DE CLIENTES (1 SOLA COMPRA / RECURRENTES / ABANDONADOS / TODOS) */}
      {/* ========================================================================= */}
      {viewTab !== 'orders' && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {viewTab === 'single_buyers' && `👤 Listado de Clientes con 1 Sola Compra (${displayedCustomers.length})`}
                {viewTab === 'repeat_buyers' && `🔄 Listado de Clientes Recurrentes (${displayedCustomers.length})`}
                {viewTab === 'abandoned_carts' && `🛒 Listado de Carritos Abandonados (${displayedCustomers.length})`}
                {viewTab === 'all_customers' && `👥 Directorio de Clientes (${displayedCustomers.length})`}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                {viewTab === 'single_buyers' 
                  ? 'Clientes que han registrado exactamente un pedido en el período actual.' 
                  : viewTab === 'repeat_buyers'
                  ? 'Clientes fidelizados con 2 o más compras en este período.'
                  : viewTab === 'abandoned_carts'
                  ? 'Clientes que iniciaron checkout o dejaron telas pendientes sin finalizar el pago.'
                  : 'Todos los clientes únicos identificados en el rango de fechas.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <input 
                  type="text" 
                  placeholder="Filtrar clientes o telas..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px', paddingLeft: '32px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', color: '#374151', boxSizing: 'border-box', fontSize: '0.875rem' }}
                />
                <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              </div>

              <button
                onClick={() => {
                  if (viewTab === 'abandoned_carts') {
                    downloadAbandonedCartsCSV(displayedCustomers);
                  } else {
                    downloadCustomersCSV(displayedCustomers, viewTab === 'single_buyers' ? 'clientes_1_sola_compra' : viewTab === 'repeat_buyers' ? 'clientes_recurrentes' : 'clientes_totales');
                  }
                }}
                disabled={downloadingCustomerCsv || displayedCustomers.length === 0}
                style={{
                  backgroundColor: viewTab === 'abandoned_carts' ? '#e11d48' : '#10b981',
                  color: 'white',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: displayedCustomers.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={15} />
                {viewTab === 'abandoned_carts' ? 'Exportar Carritos CSV' : 'Exportar CSV'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Cliente</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Contacto</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Ubicación</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>{viewTab === 'abandoned_carts' ? 'Notificación' : 'Compras'}</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>{viewTab === 'abandoned_carts' ? 'Telas en Carrito' : 'Detalle de Pedido(s)'}</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>{viewTab === 'abandoned_carts' ? 'Total Carrito' : 'Total Gastado'}</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map(customer => {
                  const isExpanded = expandedCustomer === customer.id;
                  const firstOrder = customer.orders[0] || {};
                  const cleanPhone = (customer.phone || '').replace(/\D/g, '');
                  const whatsappLink = cleanPhone ? `https://wa.me/57${cleanPhone.startsWith('57') ? cleanPhone.substring(2) : cleanPhone}` : null;

                  return (
                    <React.Fragment key={customer.id}>
                      <tr 
                        onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#f8fafc' : 'white',
                          transition: 'background 0.15s'
                        }}
                      >
                        {/* Cliente */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>
                            {customer.fullName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span>CC/NIT:</span>
                            <span style={{ fontWeight: 500, color: '#334155' }}>{customer.documentId}</span>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td style={{ padding: '14px 16px' }}>
                          {customer.phone && (
                            <div style={{ fontSize: '0.8125rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} color="#64748b" />
                              <span>{customer.phone}</span>
                              {whatsappLink && (
                                <a 
                                  href={whatsappLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  onClick={(e) => e.stopPropagation()}
                                  title="Contactar por WhatsApp"
                                  style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center' }}
                                >
                                  <MessageCircle size={14} />
                                </a>
                              )}
                            </div>
                          )}
                          {customer.email && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <Mail size={12} color="#94a3b8" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Ubicación */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>{customer.city}</div>
                          {customer.department && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{customer.department}</div>
                          )}
                        </td>

                        {/* Cantidad de Compras / Notificación Badge */}
                        <td style={{ padding: '14px 16px' }}>
                          {viewTab === 'abandoned_carts' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: firstOrder.abandonedEmailSent || firstOrder.abandonedSmsSent ? '#d1fae5' : '#fef3c7',
                                color: firstOrder.abandonedEmailSent || firstOrder.abandonedSmsSent ? '#065f46' : '#92400e',
                                border: `1px solid ${firstOrder.abandonedEmailSent || firstOrder.abandonedSmsSent ? '#a7f3d0' : '#fde68a'}`
                              }}>
                                {firstOrder.abandonedEmailSent || firstOrder.abandonedSmsSent ? '✅ Notificado' : '⏳ Pendiente'}
                              </span>
                              {firstOrder.abandonedNotifiedAt && (
                                <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                                  {new Date(firstOrder.abandonedNotifiedAt).toLocaleDateString('es-CO')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: customer.orders.length === 1 ? '#fef3c7' : '#d1fae5',
                              color: customer.orders.length === 1 ? '#92400e' : '#065f46',
                              border: `1px solid ${customer.orders.length === 1 ? '#fde68a' : '#a7f3d0'}`
                            }}>
                              {customer.orders.length === 1 ? '1 Compra' : `${customer.orders.length} Compras`}
                            </span>
                          )}
                        </td>

                        {/* Detalle del pedido */}
                        <td style={{ padding: '14px 16px' }}>
                          {viewTab === 'abandoned_carts' ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#e11d48', fontSize: '0.875rem' }}>
                                #{firstOrder.orderNumber || firstOrder._id?.slice(0, 8)}
                                <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>
                                  {firstOrder.date ? new Date(firstOrder.date).toLocaleDateString('es-CO') : ''}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(firstOrder.items || []).map((it: any) => `${it.name || 'Tela'} (${it.quantity || 1}m)`).join(', ')}
                              </div>
                            </div>
                          ) : customer.orders.length === 1 ? (
                            <div>
                              <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.875rem' }}>#{firstOrder.orderNumber}</span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>
                                {firstOrder.date ? new Date(firstOrder.date).toLocaleDateString('es-CO') : ''}
                              </span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                              Último: <strong style={{ color: '#2563eb' }}>#{customer.orders[0]?.orderNumber}</strong> ({customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('es-CO') : ''})
                            </div>
                          )}
                        </td>

                        {/* Total */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: viewTab === 'abandoned_carts' ? '#e11d48' : '#059669', fontSize: '0.9375rem' }}>
                          {formatter.format(customer.totalSpent)}
                        </td>
                      </tr>

                      {/* Fila desplegable con detalle completo del cliente */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <td colSpan={6} style={{ padding: '20px', borderBottom: '2px solid #e2e8f0' }}>
                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9375rem', color: '#1e293b', fontWeight: 700 }}>
                                Historial de Compras de {customer.fullName}
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                {customer.orders.map((ord: any) => (
                                  <div key={ord._id} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <strong style={{ color: '#2563eb' }}>Pedido #{ord.orderNumber}</strong>
                                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {ord.date ? new Date(ord.date).toLocaleDateString('es-CO') : 'Sin fecha'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: '#334155', marginBottom: '4px' }}>
                                      Estado: <strong>{ord.status || 'pending'}</strong> • Pago: {ord.paymentMethod === 'wompi' ? 'Wompi' : 'Contraentrega'}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
                                      Total: {formatter.format(ord.total || 0)}
                                    </div>
                                    <a 
                                      href={`/admin/intent/edit/id=${ord._id};type=order`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      Abrir Pedido en Sanity <ExternalLink size={12} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {displayedCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      No se encontraron clientes para este criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: TABLA DE TODOS LOS PEDIDOS (VISTA ORIGINAL MEJORADA)             */}
      {/* ========================================================================= */}
      {viewTab === 'orders' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
              Detalle de Pedidos ({filteredOrders.length})
            </h2>
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
                  opacity: downloadingCsv ? 0.7 : 1
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
                          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            {order.shippingAddress?.documentId ? `CC: ${order.shippingAddress.documentId} • ` : ''}
                            {order.shippingAddress?.email || order.email || 'Sin correo'}
                          </div>
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
      )}

      {/* Footer Branding K&T */}
      <footer style={{ marginTop: '32px', textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '0.875rem' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          &copy; {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
        </p>
        <a href="https://www.kytcode.lat" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s' }}>
          Desarrollado por K&T 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </a>
      </footer>
    </div>
  );
}
