import { NextResponse } from 'next/server';
import { sendLabsMobileSms } from '@/lib/labsmobile';
import { sendAbandonedCartEmail } from '@/lib/email-notifications';
import { getRecoverySettings, sendRecovery, writeClient, type RecoveryStep } from '@/lib/cart-recovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Recuperación automática de carritos abandonados (cada hora, ver vercel.json).
 *
 * Un "carrito abandonado" es un pedido pendiente que se guardó al llenar el checkout y no se pagó,
 * o un pago rechazado por Wompi (el cliente intentó pagar y no pudo).
 *  - 1er mensaje ~1 h después (WhatsApp; si no, SMS) + correo, con enlace que rearma el carrito.
 *  - 2º mensaje ~24 h después con un cupón pequeño y único (ej. VUELVE-10450) ya aplicado en el enlace.
 * No escribe a quien ya compró en los últimos 7 días, solo envía entre 8 a. m. y 8 p. m. de Colombia
 * y todo se configura en Sanity: Promociones y Eventos → Recuperación de carritos abandonados.
 */

const ORDER_FIELDS = `{
    _id, _rev, orderNumber, email, "userEmail": user->email, total, _createdAt, status, paymentMethod,
    items[]{ name, quantity, price, image, designName, isCustom, productSlug },
    shippingAddress, abandonedSmsSent, abandonedEmailSent, recovery1At, recovery2At
}`;

const MAX_PER_RUN = 25;

function bogotaHour(): number {
    return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' }).format(new Date())) % 24;
}

/** ¿El cliente ya compró (pagado/confirmado) en los últimos 7 días? */
async function alreadyBought(order: any): Promise<any> {
    const email = String(order.email || order.userEmail || '').trim().toLowerCase();
    const cleanPhone = String(order.shippingAddress?.phone || '').replace(/\D/g, '').slice(-10);
    const documentId = String(order.shippingAddress?.documentId || '').trim();
    if (!email && !cleanPhone && !documentId) return null;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    return writeClient.fetch(
        `*[_type == "order" && _id != $id && status in ["paid", "processing", "approved", "completed", "shipped", "delivered"] && _createdAt > $sevenDaysAgo && (
            ($email != "" && defined(email) && lower(email) == $email) ||
            ($phone != "" && defined(shippingAddress.phone) && shippingAddress.phone match $phone) ||
            ($documentId != "" && defined(shippingAddress.documentId) && shippingAddress.documentId == $documentId)
        )][0]{ _id, orderNumber }`,
        { id: String(order._id).replace(/^drafts\./, ''), email, phone: cleanPhone, documentId, sevenDaysAgo }
    );
}

async function processOrder(order: any, step: RecoveryStep, settings: Awaited<ReturnType<typeof getRecoverySettings>>) {
    const orderId = String(order._id).replace(/^drafts\./, '');
    const paid = await alreadyBought(order);
    if (paid) {
        await writeClient.patch(orderId).set({
            abandonedEmailSent: true,
            abandonedSmsSent: true,
            recovery1At: order.recovery1At || new Date().toISOString(),
            recovery2At: new Date().toISOString(),
            abandonedSkipReason: `Cliente ya tiene pedido pagado #${paid.orderNumber || paid._id}`,
        }).commit().catch(() => {});
        return { skipped: true };
    }
    // Se marca ANTES de enviar: si dos ejecuciones coinciden, no se repite el mensaje
    const field = step === 1 ? 'recovery1At' : 'recovery2At';
    const now = new Date().toISOString();
    const base = writeClient.patch(orderId).ifRevisionId(order._rev).set({
        [field]: now,
        abandonedNotifiedAt: now,
        ...(step === 1 ? { abandonedSmsSent: true, abandonedEmailSent: true } : {}),
    });
    try {
        await base.commit();
    } catch {
        return { skipped: true }; // otro proceso lo tomó
    }
    const result = await sendRecovery(order, step, settings);
    if (result.coupon) await writeClient.patch(orderId).set({ recoveryCoupon: result.coupon }).commit().catch(() => {});
    return { skipped: false, ...result };
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const testEmail = searchParams.get('testEmail');
        const testPhone = searchParams.get('testPhone');
        const targetOrderId = searchParams.get('orderId');

        // Modo de prueba: ?testEmail=correo@ejemplo.com o ?testPhone=573001234567
        if (testEmail || testPhone) {
            const testResults: any = { testMode: true };
            if (testEmail) {
                testResults.emailResult = await sendAbandonedCartEmail({
                    customerEmail: testEmail,
                    customerName: 'Cliente de Prueba',
                    items: [{ name: 'Lino Poliester Palo Rosa X Metros | Tela Liviana', quantity: 3, price: 3650 }],
                    total: 10950,
                    subtotal: 10950,
                    orderId: 'TEST-1001',
                    recoveryUrl: 'https://www.telasreal.com/carrito',
                });
            }
            if (testPhone) {
                testResults.smsResult = await sendLabsMobileSms(
                    testPhone,
                    'Telas Real: tus telas siguen en el carrito. Termina tu compra aqui: https://www.telasreal.com/carrito',
                    'automated_abandoned_cart'
                );
            }
            return NextResponse.json({ success: true, ...testResults });
        }

        const settings = await getRecoverySettings();

        // Envío manual desde el panel de ventas (un pedido puntual): 1er o 2º mensaje según corresponda
        if (targetOrderId) {
            const order = await writeClient.fetch(
                `*[_type == "order" && (_id == $id || orderNumber == $id)][0]${ORDER_FIELDS}`,
                { id: targetOrderId }
            );
            if (!order) return NextResponse.json({ success: false, error: `Pedido no encontrado: ${targetOrderId}` }, { status: 404 });
            const step: RecoveryStep = order.recovery1At ? 2 : 1;
            const result = await sendRecovery(order, step, settings);
            await writeClient.patch(order._id.replace(/^drafts\./, '')).set({
                [step === 1 ? 'recovery1At' : 'recovery2At']: new Date().toISOString(),
                abandonedSmsSent: true,
                abandonedEmailSent: true,
                abandonedNotifiedAt: new Date().toISOString(),
                ...(result.coupon ? { recoveryCoupon: result.coupon } : {}),
            }).commit().catch(() => {});
            return NextResponse.json({ success: true, step, result });
        }

        if (!settings.enabled) return NextResponse.json({ success: true, message: 'Recuperación de carritos pausada en Sanity.' });

        const hour = bogotaHour();
        if (hour < 8 || hour >= 20) {
            return NextResponse.json({ success: true, message: `Fuera de horario (${hour}:00 en Colombia): se envía en la siguiente ejecución.` });
        }

        const h = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
        const first = Number(settings.firstDelayHours) || 1;
        const second = Math.max(Number(settings.secondDelayHours) || 24, first + 2);

        // 1er mensaje: entre `first` horas y 20 h de antigüedad (los más viejos esperan el 2º)
        const step1: any[] = await writeClient.fetch(
            `*[_type == "order" && !(_id in path("drafts.**")) && (status == "pending" || (status == "cancelled" && wompiStatus in ["DECLINED", "VOIDED", "ERROR"] && !defined(abandonedSkipReason))) && paymentMethod != "whatsapp"
                && !defined(recovery1At) && (abandonedSmsSent != true || abandonedEmailSent != true)
                && dateTime(_createdAt) < dateTime($from) && dateTime(_createdAt) > dateTime($to)
                && count(items) > 0 && (defined(shippingAddress.phone) || defined(email))
            ] | order(_createdAt asc)[0...${MAX_PER_RUN}]${ORDER_FIELDS}`,
            { from: h(first), to: h(20) }
        );
        // 2º mensaje: ya recibió el 1º y pasaron `second` horas (hasta 72 h)
        const step2: any[] = await writeClient.fetch(
            `*[_type == "order" && !(_id in path("drafts.**")) && (status == "pending" || (status == "cancelled" && wompiStatus in ["DECLINED", "VOIDED", "ERROR"] && !defined(abandonedSkipReason))) && paymentMethod != "whatsapp"
                && defined(recovery1At) && !defined(recovery2At)
                && dateTime(_createdAt) < dateTime($from) && dateTime(_createdAt) > dateTime($to)
            ] | order(_createdAt asc)[0...${MAX_PER_RUN}]${ORDER_FIELDS}`,
            { from: h(second), to: h(72) }
        );

        const summary = { first: { sent: 0, skipped: 0 }, second: { sent: 0, skipped: 0 }, whatsapp: 0, sms: 0, email: 0 };
        for (const [orders, step] of [[step1, 1], [step2, 2]] as Array<[any[], RecoveryStep]>) {
            for (const order of orders || []) {
                const r: any = await processOrder(order, step, settings);
                const bucket = step === 1 ? summary.first : summary.second;
                if (r.skipped) bucket.skipped++;
                else {
                    bucket.sent++;
                    if (r.whatsapp) summary.whatsapp++;
                    if (r.sms) summary.sms++;
                    if (r.email) summary.email++;
                }
                await new Promise((res) => setTimeout(res, 1500));
            }
        }

        return NextResponse.json({ success: true, summary });
    } catch (error: any) {
        console.error('Cron Abandoned Cart Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
