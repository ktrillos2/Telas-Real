import { NextRequest, NextResponse } from 'next/server';
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  testWhatsAppTemplate,
  sendWhatsAppNotification,
  disconnectWhatsApp
} from '@/lib/whatsapp/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

// Número fijo para el botón "Enviar mensaje de prueba" del admin. Vive solo en el servidor:
// el navegador nunca lo recibe ni puede elegir otro destinatario.
const PING_PHONE = (process.env.WHATSAPP_PING_PHONE || '573116360057').replace(/\D/g, '');
const PING_MESSAGE = '✨ *Telas Real* | Mensaje de prueba exitoso.\n\nEl bot de WhatsApp está conectado y listo para enviar notificaciones automáticas de pedidos.';

/** Oculta números de teléfono en textos que van al navegador (errores del bot, historial). */
function maskPhones(text: unknown): string {
  return String(text ?? '').replace(/\+?\d[\d\s-]{6,}\d/g, '•••');
}

function maskPhone(phone: unknown): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits ? `•••${digits.slice(-2)}` : '';
}

export async function GET(req: NextRequest) {
  const rawStatus: any = await getWhatsAppStatus();
  // Sin números de teléfono en la respuesta: ni el de prueba ni los de los clientes del historial
  const { testPhone: _testPhone, recentHistory, ...status } = rawStatus || {};
  if (Array.isArray(recentHistory)) {
    status.recentHistory = recentHistory.map((h: any) => ({ ...h, phone: maskPhone(h?.phone), snippet: maskPhones(h?.snippet) }));
  }
  let qrData = null;

  if (status.status === 'QR_READY' || status.hasQr) {
    qrData = await getWhatsAppQr();
  }

  return NextResponse.json(
    {
      ...status,
      qrData
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    const { action, template, data } = body;

    if (action === 'logout' || action === 'disconnect') {
      const result = await disconnectWhatsApp();
      return NextResponse.json(result);
    }

    if (action === 'test') {
      const result = await testWhatsAppTemplate(template, data);
      return NextResponse.json(result);
    }

    // Mensaje de prueba al número fijo del servidor: solo se informa si salió o no
    if (action === 'ping') {
      const result: any = await sendWhatsAppNotification({ phone: PING_PHONE, customMessage: PING_MESSAGE });
      return NextResponse.json(
        result?.success
          ? { success: true }
          : { success: false, error: maskPhones(result?.message || result?.error || 'No se pudo enviar el mensaje.') }
      );
    }

    // La acción "send" (cualquier número y texto) se quitó: esta ruta es pública y permitía
    // enviar mensajes desde el WhatsApp de la tienda a cualquier persona.
    return NextResponse.json(
      { success: false, error: 'Acción no válida. Usa "disconnect", "test" o "ping".' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al procesar solicitud' },
      { status: 500 }
    );
  }
}
