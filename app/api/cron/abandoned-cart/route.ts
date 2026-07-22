import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { sendLabsMobileSms } from '@/lib/labsmobile';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Find pending orders created more than 1 hour ago, but less than 24 hours ago,
        // that haven't been notified yet.
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const query = `*[_type == "order" && status == "pending" && (abandonedSmsSent != true) && _createdAt < $oneHourAgo && _createdAt > $twentyFourHoursAgo] {
            _id,
            orderNumber,
            shippingAddress
        }`;

        const abandonedOrders = await client.fetch(query, { oneHourAgo, twentyFourHoursAgo });

        if (!abandonedOrders || abandonedOrders.length === 0) {
            return NextResponse.json({ success: true, message: 'No abandoned carts found to process.' });
        }

        let processed = 0;
        let failed = 0;

        for (const order of abandonedOrders) {
            const phone = order.shippingAddress?.phone;
            const name = order.shippingAddress?.fullName?.split(' ')[0] || 'Cliente';

            if (phone) {
                const message = `Hola ${name}, notamos que dejaste productos en tu carrito de Telas Real. ¡Vuelve para finalizar tu compra! https://www.telasreal.com/carrito`;
                
                const result = await sendLabsMobileSms(phone, message, 'automated_abandoned_cart', order._id);

                if (result.success) {
                    processed++;
                } else {
                    failed++;
                }

                // Update the order so we don't spam them, even if it failed (or maybe retry if failed?)
                // Usually it's better to mark as sent to avoid repeated failures blocking the queue.
                await client.patch(order._id)
                    .set({ abandonedSmsSent: true })
                    .commit();

            } else {
                // If there's no phone, just mark it to ignore next time
                await client.patch(order._id)
                    .set({ abandonedSmsSent: true })
                    .commit();
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${processed} abandoned carts. Failed: ${failed}.` 
        });

    } catch (error: any) {
        console.error("Cron Abandoned Cart Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
