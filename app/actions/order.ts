"use server"

import { createOrder, updateOrder, findCustomerByEmail, OrderData } from "@/lib/wordpress";

export async function createWooCommerceOrder(formData: any, items: any[]) {
    // Try to find existing customer by email
    let customerId = 0;
    try {
        const customer = await findCustomerByEmail(formData.email);
        if (customer) {
            customerId = customer.id;
            console.log(`Linking order to Customer ID: ${customerId}`);
        } else {
            console.log(`No existing customer found for ${formData.email}`);
        }
    } catch (error) {
        console.error("Error finding customer:", error);
        // Continue as guest if lookup fails
    }

    // Map formData and items to OrderData structure
    const orderData: OrderData = {
        payment_method: "wompi",
        payment_method_title: "Wompi",
        set_paid: false,
        customer_id: customerId,
        billing: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: formData.address,
            address_2: formData.apartment || "",
            city: formData.city,
            state: formData.region,
            postcode: formData.zipCode || "",
            country: "CO",
            email: formData.email,
            phone: formData.phone
        },
        shipping: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: formData.address,
            address_2: formData.apartment || "",
            city: formData.city,
            state: formData.region,
            postcode: formData.zipCode || "",
            country: "CO"
        },
        line_items: items.map((item: any) => ({
            product_id: item.id,
            quantity: item.quantity
        }))
    };

    try {
        const order = await createOrder(orderData);
        // WooCommerce returns 'id' as number and 'number' as string (often same value)
        // We return both, but typically use ID for reference
        return { success: true, orderId: order.id, orderNumber: order.number };
    } catch (error) {
        console.error("Error creating WooCommerce order:", error);
        return { success: false, error: "Failed to create order" };
    }
}

export async function updateOrderStatus(orderId: number, status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed') {
    try {
        await updateOrder(orderId, { status });
        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Failed to update order status" };
    }
}
