/**
 * Servicio cliente para comunicación entre Next.js y el Bot de WhatsApp Web de Telas Real.
 */

import { orderReviewLinks, withProductSlugs } from "@/lib/review-links";
import { getWhatsAppMessages, renderWhatsAppMessage } from '@/lib/whatsapp/messages';
import { isUnitProduct } from '@/lib/utils';

const formatCop = (amount: number) => `$${Math.round(Number(amount) || 0).toLocaleString('es-CO')}`;

// Sección "Califica tus telas" con un enlace por producto
function reviewLinksText(links: Array<{ name?: string; url?: string }>): string {
  const lines = (links || []).filter((l) => l?.url).map((l) => `• ${l.name || 'Producto'}: ${l.url}`);
  return lines.length ? `⭐ *Califica tus telas* (nos ayuda muchísimo):\n${lines.join('\n')}` : '';
}

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

function getBotUrl(): string {
  const raw = process.env.WHATSAPP_BOT_URL || 'http://localhost:3005';
  return raw.trim().replace(/;+$/, '').replace(/\/+$/, '');
}
// Secreto compartido con el bot (mismo valor en Vercel y en Railway). Sin valor por defecto en el código.
const API_SECRET = (process.env.WHATSAPP_API_SECRET || '').trim();

function getAuthHeaders(): Record<string, string> {
  if (!API_SECRET) {
    console.error('[WhatsApp] WHATSAPP_API_SECRET no está configurado: el bot rechazará las peticiones.');
  }
  return {
    'Authorization': `Bearer ${API_SECRET}`,
    'x-api-key': API_SECRET,
    'Origin': 'https://www.telasreal.com'
  };
}

/**
 * Consulta el estado actual de conexión del bot de WhatsApp.
 */
export async function getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`${getBotUrl()}/status?_t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        ...getAuthHeaders()
      }
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
    const timestamp = Date.now();
    const res = await fetch(`${getBotUrl()}/qr?_t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        ...getAuthHeaders()
      }
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
 * El bot responde los fallos con un código (`error`, p. ej. NOT_ON_WHATSAPP o ACCOUNT_RESTRICTED)
 * y una explicación (`message`). Se expone la explicación en `error` para mostrarla tal cual.
 */
function normalizeBotResponse<T extends { success?: boolean; error?: string; message?: string }>(data: T): T & { errorCode?: string } {
  if (data && data.success === false && data.message) {
    return { ...data, errorCode: data.error, error: data.message };
  }
  return data;
}

/**
 * Envía un mensaje automatizado mediante plantilla o mensaje personalizado.
 * Solo devuelve success: true cuando WhatsApp confirmó la recepción del mensaje.
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
    const res = await fetch(`${getBotUrl()}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(params),
      cache: 'no-store',
      signal: AbortSignal.timeout(50000)
    });

    return normalizeBotResponse(await res.json());
  } catch (err: any) {
    return {
      success: false,
      error: `No se pudo conectar con el bot de WhatsApp en ${getBotUrl()}: ${err.message}`
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
    const res = await fetch(`${getBotUrl()}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ template, data: customData }),
      cache: 'no-store'
    });

    return normalizeBotResponse(await res.json());
  } catch (err: any) {
    return {
      success: false,
      error: `Error al comunicar con el servicio de WhatsApp: ${err.message}`
    };
  }
}

/**
 * Desconecta la sesión activa de WhatsApp Web en el bot y regenera el código QR.
 */
export async function disconnectWhatsApp(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`${getBotUrl()}/logout?_t=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      cache: 'no-store'
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: `Error al solicitar desconexión del bot: ${err.message}`
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
  // Solo contraentrega / pago en tienda: un pedido pagado con Wompi puede pasar a "processing" y no es COD
  const isCod = order.paymentMethod === 'cod';
  const orderStatusParam = isCod ? 'PROCESSING' : 'APPROVED';
  const codParam = isCod ? '&payment_method=cod' : '';
  const orderUrl = `${siteUrl}/confirmation?orderId=${encodeURIComponent(orderNumber)}&status=${orderStatusParam}${codParam}`;

  const isPickup = order.deliveryMethod === 'pickup' || order.shippingProvider === 'pickup' || (typeof order.shippingAddress?.address === 'string' && order.shippingAddress.address.includes('Calle 12 # 38-65'));
  const shippingAddress = isPickup
    ? 'Recoger en Tienda: Bogotá Calle 12 # 38-65, Telas Real'
    : (order.shippingAddress
        ? `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''} (${order.shippingAddress.department || ''})`
        : 'Dirección registrada');

  const messages = await getWhatsAppMessages();
  const productos = (order.items || [])
    .map((it: any) => {
      const unit = isUnitProduct({ name: it.name || it.title, slug: it.productSlug }) ? 'und' : 'm';
      return `• *${it.name || it.title || 'Tela'}* x ${it.quantity || 1} ${unit} - ${formatCop(it.price || 0)}`;
    })
    .join('\n') || '• Telas seleccionadas';
  const totalTexto = isCod
    ? `*Total a pagar:* ${formatCop(total)} (${isPickup ? 'pagas al recoger' : 'pagas al recibir'})`
    : `*Total pagado:* ${formatCop(total)}`;

  const customMessage = renderWhatsAppMessage(isPickup ? messages.confirmacionRecoger : messages.confirmacionEnvio, {
    nombre: customerName,
    pedido: orderNumber,
    total: totalTexto,
    productos,
    direccion: shippingAddress,
    transportadora: order.carrier || 'Coordinadora Mercantil',
    enlacePedido: orderUrl,
    enlacesResena: reviewLinksText(orderReviewLinks(await withProductSlugs(order.items || []), customerName).slice(0, 5)),
  });

  return await sendWhatsAppNotification({ phone, template: 'ORDER_CONFIRMATION', customMessage });
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
  const trackingNumber = String(order.trackingNumber || '').trim();
  // Sin guía no se manda un enlace de rastreo roto
  const trackingUrl = trackingNumber
    ? `https://www.coordinadora.com/rastreo/rastreo-de-guia/detalle-de-rastreo/?guia=${encodeURIComponent(trackingNumber)}`
    : '';
  const isPickup = order.deliveryMethod === 'pickup' || order.shippingProvider === 'pickup';

  const messages = await getWhatsAppMessages();
  const customMessage = renderWhatsAppMessage(isPickup ? messages.listoParaRecoger : messages.despacho, {
    nombre: customerName,
    pedido: orderNumber,
    transportadora: carrier,
    guia: trackingNumber ? `*${trackingNumber}*` : '',
    enlaceRastreo: trackingUrl,
  });

  return await sendWhatsAppNotification({ phone, template: 'ORDER_DISPATCH', customMessage });
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

  const messages = await getWhatsAppMessages();
  const customMessage = renderWhatsAppMessage(messages.encuesta, {
    nombre: customerName,
    pedido: orderNumber,
    enlacesResena: reviewLinksText(orderReviewLinks(await withProductSlugs(order.items || []), customerName).slice(0, 5)),
  });

  // template SATISFACTION_SURVEY: el bot registra la encuesta pendiente para reconocer la respuesta 1 a 5
  return await sendWhatsAppNotification({ phone, template: 'SATISFACTION_SURVEY', customMessage });
}
