import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { sendLabsMobileSms } from '@/lib/labsmobile';
import { sendAbandonedCartEmail } from '@/lib/email-notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const testEmail = searchParams.get('testEmail');
        const testPhone = searchParams.get('testPhone');

        // Fetch Sanity Header Logo for branding
        const headerDoc = await client.fetch(`*[_type == "header"][0]{ "logoUrl": logo.asset->url }`);
        const logoUrl = headerDoc?.logoUrl || 'https://www.telasreal.com/images/design-mode/image.png';

        // Allow instant test mode with ?testEmail=correo@ejemplo.com or ?testPhone=573001234567
        if (testEmail || testPhone) {
            const sampleItems = [
                {
                    name: "Lino Poliester Palo Rosa X Metros | Tela Liviana",
                    quantity: 3,
                    price: 3650,
                    image: "https://www.telasreal.com/images/design-mode/image.png"
                },
                {
                    name: "Brush Sublimado Flores X Metros | Piel de Durazno",
                    quantity: 2,
                    price: 13500,
                    designName: "Estampado Floral Primavera",
                    image: "https://www.telasreal.com/images/design-mode/image.png"
                }
            ];

            const testResults: any = { testMode: true };

            if (testEmail) {
                const emailRes = await sendAbandonedCartEmail({
                    customerEmail: testEmail,
                    customerName: "Cliente de Prueba",
                    items: sampleItems,
                    total: 37950,
                    subtotal: 37950,
                    orderId: "TEST-1001",
                    recoveryUrl: "https://www.telasreal.com/carrito",
                    logoUrl: logoUrl
                });
                testResults.emailResult = emailRes;
            }

            if (testPhone) {
                const smsMessage = `Hola Cliente, las telas seleccionadas en tu carrito siguen reservadas en Telas Real. Completa tu compra aqui: https://www.telasreal.com/carrito`;
                const smsRes = await sendLabsMobileSms(testPhone, smsMessage, 'automated_abandoned_cart');
                testResults.smsResult = smsRes;
            }

            return NextResponse.json({ success: true, ...testResults });
        }

        // Find pending orders created more than 1 hour ago, but less than 24 hours ago,
        // that haven't had their abandoned cart reminders sent yet.
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const query = `*[_type == "order" && status == "pending" && (abandonedEmailSent != true || abandonedSmsSent != true) && _createdAt < $oneHourAgo && _createdAt > $twentyFourHoursAgo] {
            _id,
            orderNumber,
            email,
            "userEmail": user->email,
            total,
            _createdAt,
            items[]{
                name,
                quantity,
                price,
                image,
                designName,
                isCustom
            },
            shippingAddress,
            abandonedSmsSent,
            abandonedEmailSent
        }`;

        const abandonedOrders = await client.fetch(query, { oneHourAgo, twentyFourHoursAgo });

        if (!abandonedOrders || abandonedOrders.length === 0) {
            return NextResponse.json({ success: true, message: 'No abandoned carts found to process.' });
        }

        let smsSentCount = 0;
        let emailSentCount = 0;
        let skippedPaidCount = 0;
        let failedCount = 0;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        for (const order of abandonedOrders) {
            const rawFullName = order.shippingAddress?.fullName || 'Cliente';
            const firstName = rawFullName.trim().split(' ')[0] || 'Cliente';
            const phone = (order.shippingAddress?.phone || '').trim();
            const cleanPhone = phone.replace(/\D/g, '');
            const email = (order.email || order.userEmail || (order.shippingAddress as any)?.email || '').trim().toLowerCase();
            const documentId = (order.shippingAddress?.documentId || '').trim();
            const orderId = order.orderNumber || order._id;
            const items = order.items || [];
            const total = order.total || 0;

            // Check if this customer already completed and paid for an order in the last 7 days
            let alreadyPaidOrder: any = null;
            if (email || cleanPhone || documentId) {
                alreadyPaidOrder = await client.fetch(
                    `*[_type == "order" && status in ["paid", "processing", "approved", "completed", "shipped", "delivered"] && _createdAt > $sevenDaysAgo && (
                        (defined(email) && lower(email) == $email) ||
                        (defined(shippingAddress.email) && lower(shippingAddress.email) == $email) ||
                        (defined(shippingAddress.phone) && shippingAddress.phone match $cleanPhone) ||
                        (defined(shippingAddress.documentId) && shippingAddress.documentId == $documentId)
                    )][0]{ _id, orderNumber, status }`,
                    { email, cleanPhone, documentId, sevenDaysAgo }
                );
            }

            // If customer has already paid for an order, DO NOT send abandoned cart notifications!
            if (alreadyPaidOrder) {
                console.log(`[AbandonedCart] Skipping order ${orderId} for ${email || phone}: customer already has paid order #${alreadyPaidOrder.orderNumber || alreadyPaidOrder._id}`);
                skippedPaidCount++;

                // Mark as processed so it won't be queried again
                try {
                    await client.patch(order._id)
                        .set({
                            abandonedEmailSent: true,
                            abandonedSmsSent: true,
                            abandonedNotifiedAt: new Date().toISOString(),
                            abandonedSkipReason: `Cliente ya tiene pedido pagado #${alreadyPaidOrder.orderNumber || alreadyPaidOrder._id}`
                        })
                        .commit();
                } catch (patchErr) {
                    console.error(`Error updating order ${order._id} skip patch:`, patchErr);
                }
                continue;
            }

            const patchData: Record<string, any> = {
                abandonedNotifiedAt: new Date().toISOString()
            };

            // 1. Process SMS reminder if not already sent
            if (!order.abandonedSmsSent) {
                if (phone) {
                    const smsMessage = `Hola ${firstName}, las telas seleccionadas en tu carrito siguen reservadas en Telas Real. Completa tu compra aqui: https://www.telasreal.com/carrito`;
                    
                    const smsResult = await sendLabsMobileSms(phone, smsMessage, 'automated_abandoned_cart', order._id);
                    if (smsResult.success) {
                        smsSentCount++;
                    } else {
                        failedCount++;
                    }
                }
                patchData.abandonedSmsSent = true;
            }

            // 2. Process Email reminder if not already sent
            if (!order.abandonedEmailSent) {
                if (email) {
                    const emailResult = await sendAbandonedCartEmail({
                        customerEmail: email,
                        customerName: rawFullName,
                        items: items.map((it: any) => ({
                            name: it.name || "Tela",
                            quantity: it.quantity || 1,
                            price: it.price || 0,
                            image: it.image || undefined,
                            designName: it.designName || undefined,
                            isCustom: it.isCustom || false
                        })),
                        total: total,
                        subtotal: total,
                        orderId: orderId,
                        recoveryUrl: "https://www.telasreal.com/carrito",
                        logoUrl: logoUrl
                    });

                    if (emailResult.success) {
                        emailSentCount++;
                    } else {
                        failedCount++;
                    }
                }
                patchData.abandonedEmailSent = true;
            }

            // Update order record in Sanity to prevent duplicate reminders
            try {
                await client.patch(order._id)
                    .set(patchData)
                    .commit();
            } catch (patchErr) {
                console.error(`Error updating order ${order._id} patch:`, patchErr);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${abandonedOrders.length} abandoned orders. Emails sent: ${emailSentCount}, SMS sent: ${smsSentCount}, Skipped (already paid): ${skippedPaidCount}, Errors: ${failedCount}.` 
        });

    } catch (error: any) {
        console.error("Cron Abandoned Cart Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
