
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/env';

// Initialize a client with the API token to perform write operations
const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN, // Critical: Needs write access
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate the payload (Sanity webhooks usually wrap the document in 'body' or similar depending on projection)
        // We assume the webhook sends the full document structure or a projection we defined
        // For this example, let's assume raw document is in body or body.result

        const order = body;

        console.log('Received inventory webhook for order:', order._id);

        if (!order.items || !Array.isArray(order.items)) {
            return NextResponse.json({ message: 'No items in order' }, { status: 200 });
        }

        // Process each item to deduct stock
        const results = await Promise.all(order.items.map(async (item: any) => {
            // Only process if there is a linked product reference
            if (!item.product || !item.product._ref) {
                return { status: 'skipped', reason: 'no_product_ref', name: item.name };
            }

            const productId = item.product._ref;
            const quantityToDeduct = item.quantity || 0;

            // Transaction to decrement stock
            try {
                await client
                    .patch(productId)
                    .dec({ inventory: quantityToDeduct })
                    .commit();

                // Check if we need to update status to outOfStock
                // We need to fetch the product again to check new inventory level
                const updatedProduct = await client.fetch(`*[_id == $id][0]`, { id: productId });

                if (updatedProduct && updatedProduct.inventory <= 0 && updatedProduct.stockStatus !== 'outOfStock') {
                    await client
                        .patch(productId)
                        .set({ stockStatus: 'outOfStock' })
                        .commit();
                }

                return { status: 'success', productId };
            } catch (err) {
                console.error(`Failed to update stock for product ${productId}:`, err);
                return { status: 'error', productId, error: err };
            }
        }));

        return NextResponse.json({
            message: 'Inventory update processed',
            results
        }, { status: 200 });

    } catch (error) {
        console.error('Error processing inventory webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
