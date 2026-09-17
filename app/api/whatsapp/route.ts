import { NextRequest, NextResponse } from 'next/server';
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  testWhatsAppTemplate,
  sendWhatsAppNotification,
  disconnectWhatsApp
} from '@/lib/whatsapp/service';

export async function GET(req: NextRequest) {
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

  try {
    const body = await req.json();
    const { action, template, data, phone, customMessage } = body;

    if (action === 'logout' || action === 'disconnect') {
      const result = await disconnectWhatsApp();
      return NextResponse.json(result);
    }

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
      { success: false, error: 'Acción no válida. Usa "disconnect", "test" o "send".' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al procesar solicitud' },
      { status: 500 }
    );
  }
}
