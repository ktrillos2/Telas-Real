import * as React from 'react';

export interface DispatchOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  city?: string;
  address?: string;
  orderDateFormatted: string;
  orderTimeFormatted: string;
  deadlineDateFormatted: string;
  deadlineDescription: string;
  remainingHours: number;
  remainingMinutes: number;
  isOverdue: boolean;
  timeRemainingText: string;
  status: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
    unit?: string;
  }>;
}

export interface DispatchReminderEmailProps {
  notificationTimeText: string; // "10:00 AM" | "3:00 PM"
  currentDateText: string;
  totalPendingOrders: number;
  urgentOrdersCount: number;
  nextDayOrdersCount: number;
  orders: DispatchOrderItem[];
}

export const DispatchReminderEmailTemplate: React.FC<Readonly<DispatchReminderEmailProps>> = ({
  notificationTimeText,
  currentDateText,
  totalPendingOrders,
  urgentOrdersCount,
  nextDayOrdersCount,
  orders,
}) => {
  const is10am = notificationTimeText.includes('10');

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      backgroundColor: '#f1f5f9',
      padding: '24px 12px',
      color: '#1e293b',
      lineHeight: 1.5,
    }}>
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0284c7',
          padding: '24px',
          color: '#ffffff',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            NOTIFICACIÓN INTERNA DE DESPACHOS
          </div>
          <h1 style={{
            margin: '6px 0 4px',
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}>
            Telas Real — Control de Envíos
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#e0f2fe',
          }}>
            Reporte de las <strong>{notificationTimeText}</strong> • {currentDateText} (Hora Colombia)
          </p>
        </div>

        {/* Rule reminder box */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          fontSize: '13px',
          color: '#475569',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
            <span>📋 Política de Despacho al Cliente:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: 1.6 }}>
            <li><strong>Antes de la 1:00 PM:</strong> Se envía el <strong>mismo día</strong>.</li>
            <li><strong>Después de la 1:00 PM:</strong> Se envía al <strong>día hábil siguiente</strong>.</li>
          </ul>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '20px 24px',
          backgroundColor: '#ffffff',
        }}>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1d4ed8' }}>
              {totalPendingOrders}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>
              Aprobados Recientes
            </div>
          </div>

          <div style={{
            backgroundColor: urgentOrdersCount > 0 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${urgentOrdersCount > 0 ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: urgentOrdersCount > 0 ? '#b91c1c' : '#15803d',
            }}>
              {urgentOrdersCount}
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: urgentOrdersCount > 0 ? '#ef4444' : '#22c55e',
              textTransform: 'uppercase',
            }}>
              Despachar Hoy
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#475569' }}>
              {nextDayOrdersCount}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Día Siguiente
            </div>
          </div>
        </div>

        {/* Content list */}
        <div style={{ padding: '0 24px 24px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📦</span> Detalle de Pedidos y Tiempo Restante
          </h2>

          {orders.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              color: '#166534',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>¡Todo al día!</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                No hay pedidos aprobados pendientes por despachar en las últimas 24 horas.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order, idx) => {
                const isOverdue = order.isOverdue;
                const isUrgent = isOverdue || (order.remainingHours < 3 && !order.deadlineDescription.includes('Mañana'));

                return (
                  <div
                    key={order.id || idx}
                    style={{
                      border: `1px solid ${isOverdue ? '#fca5a5' : isUrgent ? '#fed7aa' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: isOverdue ? '#fff5f5' : '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Top Row: Order Number + Badge */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '10px',
                      marginBottom: '10px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}>
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          Orden #{order.orderNumber}
                        </span>
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor: order.status === 'paid' ? '#dcfce7' : '#fef9c3',
                          color: order.status === 'paid' ? '#15803d' : '#854d0e',
                        }}>
                          {order.status === 'paid' ? 'PAGADO' : order.status === 'processing' ? 'PROCESANDO' : 'PENDIENTE'}
                        </span>
                      </div>

                      {/* Time Remaining Badge */}
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: isOverdue ? '#fee2e2' : isUrgent ? '#ffedd5' : '#dbeafe',
                        color: isOverdue ? '#b91c1c' : isUrgent ? '#c2410c' : '#1d4ed8',
                        border: `1px solid ${isOverdue ? '#fecaca' : isUrgent ? '#fed7aa' : '#bfdbfe'}`,
                      }}>
                        {isOverdue ? '🚨 ' : '⏳ '}
                        {order.timeRemainingText}
                      </div>
                    </div>

                    {/* Order Details Grid */}
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ color: '#64748b', padding: '3px 0', width: '130px', fontWeight: 500 }}>
                            Cliente:
                          </td>
                          <td style={{ color: '#0f172a', padding: '3px 0', fontWeight: 600 }}>
                            {order.customerName}
                          </td>
                        </tr>
                        {order.customerPhone && (
                          <tr>
                            <td style={{ color: '#64748b', padding: '3px 0', fontWeight: 500 }}>
                              Contacto:
                            </td>
                            <td style={{ color: '#0f172a', padding: '3px 0' }}>
                              <a
                                href={`https://wa.me/57${order.customerPhone.replace(/\D/g, '')}`}
                                style={{
                                  color: '#059669',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                💬 {order.customerPhone} (WhatsApp)
                              </a>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ color: '#64748b', padding: '3px 0', fontWeight: 500 }}>
                            Destino:
                          </td>
                          <td style={{ color: '#0f172a', padding: '3px 0' }}>
                            {order.city ? `${order.city} — ` : ''}{order.address || 'Dirección registrada'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: '#64748b', padding: '3px 0', fontWeight: 500 }}>
                            Fecha de Compra:
                          </td>
                          <td style={{ color: '#0f172a', padding: '3px 0' }}>
                            {order.orderDateFormatted} a las <strong>{order.orderTimeFormatted}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: '#64748b', padding: '3px 0', fontWeight: 500 }}>
                            Límite de Envío:
                          </td>
                          <td style={{
                            color: isOverdue ? '#b91c1c' : '#0369a1',
                            padding: '3px 0',
                            fontWeight: 700,
                          }}>
                            {order.deadlineDescription} ({order.deadlineDateFormatted})
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Products list */}
                    {order.items && order.items.length > 0 && (
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px dashed #e2e8f0',
                        fontSize: '12px',
                        color: '#475569',
                      }}>
                        <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Productos ({order.items.length}):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                          {order.items.map((it, iIdx) => (
                            <li key={iIdx} style={{ marginBottom: '2px' }}>
                              <strong>{it.quantity} {it.unit || 'm'}</strong> — {it.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Total & Action */}
                    <div style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                    }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Total: </span>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                          ${order.total ? order.total.toLocaleString('es-CO') : 0} COP
                        </strong>
                      </div>
                      <a
                        href="https://telasreal.com/admin"
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          textDecoration: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Ver en Admin →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#94a3b8',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '12px',
        }}>
          <p style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}>
            Sistema de Notificaciones Automáticas de Despacho • Telas Real
          </p>
          <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#64748b' }}>
            Este correo es una notificación interna programada automáticamente para las 10:00 AM y 3:00 PM COT.
          </p>
          <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', fontSize: '11px' }}>
            <span>
              © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
            </span>
            <span style={{ margin: '0 8px', color: '#475569' }}>|</span>
            <a
              href="https://www.kytcode.lat"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}
            >
              Desarrollado por K&T <span style={{ color: '#ffffff' }}>♥</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchReminderEmailTemplate;
