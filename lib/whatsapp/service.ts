/**
 * Servicio cliente para comunicación entre Next.js y el Bot de WhatsApp Web de Telas Real.
 */

export interface WhatsAppStatusResponse {
  status: 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED' | 'DISCONNECTED' | 'UNREACHABLE';
  isTestMode: boolean;
  testPhone: string;
  connectedInfo?: {
    user: string;
    name: string;
  } | null;
  hasQr: boolean;
  recentHistory?: Array<{
    timestamp: string;
    direction: 'IN' | 'OUT';
    phone: string;
    template: string;
    snippet: string;
  }>;
}

export interface WhatsAppQrResponse {
  status: string;
  hasQr: boolean;
  qr?: string | null;
  dataUrl?: string | null;
}

export interface SendWhatsAppParams {
  phone?: string;
  template?: 'ORDER_CONFIRMATION' | 'ORDER_DISPATCH' | 'CART_REMINDER' | 'SATISFACTION_SURVEY' | 'PROMOTIONS';
  data?: Record<string, any>;
  customMessage?: string;
}

const BOT_URL = (process.env.WHATSAPP_BOT_URL || 'http://localhost:3005').replace(/\/+$/, '');

/**
 * Consulta el estado actual de conexión del bot de WhatsApp.
 */
export async function getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  try {
    const res = await fetch(`${BOT_URL}/status`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      return {
        status: 'DISCONNECTED',
        isTestMode: true,
        testPhone: process.env.WHATSAPP_TEST_PHONE || '3133087069',
        hasQr: false
      };
    }

    return await res.json();
  } catch {
    return {
      status: 'UNREACHABLE',
      isTestMode: true,
      testPhone: process.env.WHATSAPP_TEST_PHONE || '3133087069',
      hasQr: false
    };
  }
}

/**
 * Obtiene el código QR actual (formato texto y base64 DataURL).
 */
export async function getWhatsAppQr(): Promise<WhatsAppQrResponse> {
  try {
    const res = await fetch(`${BOT_URL}/qr`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      return { status: 'ERROR', hasQr: false };
    }

    return await res.json();
  } catch {
    return { status: 'UNREACHABLE', hasQr: false };
  }
}

/**
 * Envía un mensaje automatizado mediante plantilla o mensaje personalizado.
 */
export async function sendWhatsAppNotification(params: SendWhatsAppParams): Promise<{
  success: boolean;
  messageId?: string;
  to?: string;
  template?: string;
  preview?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${BOT_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000)
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `No se pudo conectar con el bot de WhatsApp en ${BOT_URL}: ${err.message}`
    };
  }
}

/**
 * Dispara una prueba inmediata de plantilla hacia el número de prueba seguro (3133087069).
 */
export async function testWhatsAppTemplate(template: string, customData: Record<string, any> = {}): Promise<{
  success: boolean;
  to?: string;
  template?: string;
  preview?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${BOT_URL}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, data: customData }),
      cache: 'no-store'
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `Error al comunicar con el servicio de WhatsApp: ${err.message}`
    };
  }
}

/**
 * Notifica la confirmación de una compra (Pago Wompi o Contraentrega).
 */
export async function notifyOrderConfirmationViaWhatsApp(order: any): Promise<{ success: boolean; error?: string }> {
  if (process.env.WHATSAPP_ENABLED === 'false') {
    return { success: false, error: 'Notificaciones de WhatsApp desactivadas por configuración' };
  }

  const phone = order.shippingAddress?.phone || order.phone || '';
  if (!phone) {
    return { success: false, error: 'No se encontró teléfono del cliente para notificar' };
  }

  const customerName = order.shippingAddress?.fullName || order.customerName || 'Cliente';
  const orderNumber = order.orderNumber || order._id || 'TR-0000';
  const total = order.total || order.totalPrice || 0;
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.telasreal.com';
  const siteUrl = rawSiteUrl.replace(/\/$/, '');
  const isCod = order.paymentMethod === 'cod' || order.status === 'processing';
  const orderStatusParam = isCod ? 'PROCESSING' : 'APPROVED';
  const codParam = isCod ? '&payment_method=cod' : '';
  const orderUrl = `${siteUrl}/confirmation?orderId=${encodeURIComponent(orderNumber)}&status=${orderStatusParam}${codParam}`;

  const items = (order.items || []).map((it: any) => ({
    title: it.name || it.title || 'Tela',
    quantity: it.quantity || 1,
    price: it.price || 0
  }));

  const shippingAddress = order.shippingAddress
    ? `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''} (${order.shippingAddress.department || ''})`
    : 'Dirección registrada';

  return await sendWhatsAppNotification({
    phone,
    template: 'ORDER_CONFIRMATION',
    data: {
      customerName,
      orderNumber,
      total,
      items,
      shippingAddress,
      orderUrl,
      paymentMethod: order.paymentMethod,
      isCod,
      siteUrl
    }
  });
}

/**
 * Notifica el despacho del pedido (Estado: Enviado) con guía de Coordinadora y link de rastreo en vivo.
 */
export async function notifyOrderDispatchViaWhatsApp(order: any): Promise<{ success: boolean; error?: string }> {
  if (process.env.WHATSAPP_ENABLED === 'false') {
    return { success: false, error: 'Notificaciones de WhatsApp desactivadas por configuración' };
  }

  const phone = order.shippingAddress?.phone || order.phone || '';
  if (!phone) {
    return { success: false, error: 'No se encontró teléfono del cliente para notificar' };
  }

  const customerName = order.shippingAddress?.fullName || order.customerName || 'Cliente';
  const orderNumber = order.orderNumber || order._id || 'TR-0000';
  const carrier = order.carrier || 'Coordinadora Mercantil';
  const trackingNumber = order.trackingNumber || 'En trámite';
  const trackingUrl = `https://www.coordinadora.com/rastreo/rastreo-de-guia/detalle-de-rastreo/?guia=${trackingNumber}`;

  return await sendWhatsAppNotification({
    phone,
    template: 'ORDER_DISPATCH',
    data: {
      customerName,
      orderNumber,
      carrier,
      trackingNumber,
      trackingUrl
    }
  });
}

/**
 * Notifica que el pedido ha sido completado / entregado (Estado: Entregado),
 * enviando agradecimiento y encuesta de satisfacción interactiva con enlaces 1-toque.
 */
export async function notifyOrderDeliveredViaWhatsApp(order: any): Promise<{ success: boolean; error?: string }> {
  if (process.env.WHATSAPP_ENABLED === 'false') {
    return { success: false, error: 'Notificaciones de WhatsApp desactivadas por configuración' };
  }

  const phone = order.shippingAddress?.phone || order.phone || '';
  if (!phone) {
    return { success: false, error: 'No se encontró teléfono del cliente para notificar' };
  }

  const customerName = order.shippingAddress?.fullName || order.customerName || 'Cliente';
  const orderNumber = order.orderNumber || order._id || 'TR-0000';
  const botPhone = process.env.WHATSAPP_BOT_PHONE || '573159021516';

  return await sendWhatsAppNotification({
    phone,
    template: 'SATISFACTION_SURVEY',
    data: {
      customerName,
      orderNumber,
      botPhone
    }
  });
}
