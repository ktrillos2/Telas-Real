"use server"

import { sendOrderEmail } from "@/lib/email-notifications";
import { v4 as uuidv4 } from 'uuid';

export async function createWooCommerceOrder(formData: any, items: any[], paymentMethod: string = "wompi") {
    // Since WordPress integration is removed, we only send email and return a simulated success.

    // Simulate Order Object for email
    const orderId = Math.floor(Math.random() * 100000);
    const orderNumber = `ORD-${orderId}`;

    const order = {
        id: orderId,
        number: orderNumber,
        status: 'processing',
        date_created: new Date().toISOString(),
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toString(),
        currency: 'COP',
        billing: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address_1: formData.address,
            city: formData.city,
            state: formData.region,
            postcode: formData.zipCode,
            country: 'CO'
        },
        shipping: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: formData.address,
            city: formData.city,
            state: formData.region,
            postcode: formData.zipCode,
            country: 'CO'
        },
        line_items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: (item.price * item.quantity).toString()
        })),
        payment_method_title: paymentMethod === 'cod' ? 'Contraentrega' : 'Wompi'
    };

    try {
        // Send initial email (Order Received)
        try {
            await sendOrderEmail(order as any, 'processing');
        } catch (emailErr) {
            console.error("Failed to send initial email:", emailErr);
        }

        return { success: true, orderId: order.id, orderNumber: order.number };
    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: "Failed to create order" };
    }
}

export async function updateOrderStatus(orderId: number, status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed') {
    // Mock update
    return { success: true };
}
