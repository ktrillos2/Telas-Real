import { NextRequest, NextResponse } from 'next/server';
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  testWhatsAppTemplate,
  sendWhatsAppNotification
} from '@/lib/whatsapp/service';

function isAllowedLocalAccess(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const host = req.headers.get('host') || '';
  return host.includes('localhost') || host.includes('127.0.0.1');
}

export async function GET(req: NextRequest) {
  if (!isAllowedLocalAccess(req)) {
    return NextResponse.json(
      {
        status: 'PRODUCTION_RESTRICTED',
        isProductionRestricted: true,
        error: 'El panel de control y vinculación de WhatsApp está restringido a entorno local de desarrollo por seguridad.',
        isTestMode: true,
        testPhone: '***',
        hasQr: false
      },
      { status: 403 }
    );
  }

  const status = await getWhatsAppStatus();
  let qrData = null;

  if (status.status === 'QR_READY' || status.hasQr) {
    qrData = await getWhatsAppQr();
  }

  return NextResponse.json({
    ...status,
    qrData
  });
}

export async function POST(req: NextRequest) {
  if (!isAllowedLocalAccess(req)) {
    return NextResponse.json(
      {
        success: false,
        error: 'El envío de mensajes de prueba de WhatsApp está bloqueado en entorno de producción.'
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action, template, data, phone, customMessage } = body;

    if (action === 'test') {
      const result = await testWhatsAppTemplate(template, data);
      return NextResponse.json(result);
    }

    if (action === 'send') {
      const result = await sendWhatsAppNotification({
        phone,
        template,
        data,
        customMessage
      });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida. Usa "test" o "send".' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al procesar solicitud' },
      { status: 500 }
    );
  }
}
