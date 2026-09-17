import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import {
  notifyOrderConfirmationViaWhatsApp,
  notifyOrderDispatchViaWhatsApp,
  notifyOrderDeliveredViaWhatsApp
} from '@/lib/whatsapp/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, event, trackingNumber, carrier } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'El parámetro orderId es requerido.' },
        { status: 400 }
      );
    }

    const cleanOrderId = String(orderId).trim().replace(/^drafts\./, '');
    const numericMatch = cleanOrderId.match(/\d+/);
    const numericRef = numericMatch ? numericMatch[0] : '';

    const order = await client.fetch(
      `*[_type == "order" && !(_id in path("drafts.**")) && (
        _id == $cleanOrderId ||
        orderNumber == $cleanOrderId ||
        orderNumber == $numericRef
      )][0]`,
      { cleanOrderId, numericRef }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: `No se encontró el pedido con ID o número: ${orderId}` },
        { status: 404 }
      );
    }

    // Permitir sobreescritura de guía o transportadora al momento de despachar
    if (trackingNumber || carrier) {
      const patchFields: Record<string, any> = {};
      if (trackingNumber) patchFields.trackingNumber = trackingNumber;
      if (carrier) patchFields.carrier = carrier;

      try {
        await client.patch(order._id).set(patchFields).commit();
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (carrier) order.carrier = carrier;
      } catch (patchErr: any) {
        console.warn('[notify-whatsapp API] Error patching order:', patchErr.message);
      }
    }

    let result: { success: boolean; error?: string; [key: string]: any } = { success: false };

    switch (event) {
      case 'confirmation':
      case 'purchase':
        result = await notifyOrderConfirmationViaWhatsApp(order);
        if (result.success) {
          await client.patch(order._id).set({ whatsappConfirmationSent: true }).commit().catch(() => {});
        }
        break;

      case 'dispatch':
      case 'shipped':
        result = await notifyOrderDispatchViaWhatsApp(order);
        if (result.success) {
          await client.patch(order._id).set({ whatsappDispatchSent: true }).commit().catch(() => {});
        }
        break;

      case 'survey':
      case 'delivered':
        result = await notifyOrderDeliveredViaWhatsApp(order);
        if (result.success) {
          await client.patch(order._id).set({ whatsappSurveySent: true }).commit().catch(() => {});
        }
        break;

      default:
        // Si no se especifica evento, deducir por el estado actual del pedido
        if (order.status === 'shipped') {
          result = await notifyOrderDispatchViaWhatsApp(order);
        } else if (order.status === 'delivered') {
          result = await notifyOrderDeliveredViaWhatsApp(order);
        } else if (order.status === 'paid' || order.status === 'processing') {
          result = await notifyOrderConfirmationViaWhatsApp(order);
        } else {
          return NextResponse.json(
            { success: false, error: `Estado del pedido "${order.status}" no tiene plantilla automática predeterminada.` },
            { status: 400 }
          );
        }
        break;
    }

    return NextResponse.json({
      success: result.success,
      orderNumber: order.orderNumber || order._id,
      event: event || order.status,
      details: result
    });
  } catch (error: any) {
    console.error('[notify-whatsapp API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
