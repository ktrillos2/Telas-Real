"use server"

import { sendOrderEmail } from "@/lib/email-notifications";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

export async function createOrder(formData: any, items: any[], paymentMethod: string = "wompi") {
    try {
        const session = await getServerSession(authOptions);

        // Generate Order Number
        // Use UUID or Timestamp + Random
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const orderDoc = {
            _type: 'order',
            orderNumber,
            date: new Date().toISOString(),
            status: 'pending',
            total: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
            user: (session?.user as any)?.id ? { _type: 'reference', _ref: (session?.user as any).id } : undefined,
            items: items.map((item: any) => ({
                _key: uuidv4(),
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image
            })),
            shippingAddress: {
                fullName: `${formData.firstName} ${formData.lastName}`,
                address: formData.address,
                city: formData.city,
                phone: formData.phone
            }
        };

        const createdOrder = await client.create(orderDoc);

        // Auto-save address to user profile if authenticated
        if (session?.user?.email && orderDoc.user) {
            const userId = orderDoc.user._ref;
            // Construct address object
            const addressData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                company: formData.company,
                address: formData.address,
                apartment: formData.apartment || "",
                city: formData.city,
                region: formData.region,
                zipCode: formData.zipCode || "",
                phone: formData.phone,
                email: formData.email,
                documentId: formData.documentId
            };

            // Remove undefined/null values
            Object.keys(addressData).forEach(key => (addressData as any)[key] == null && delete (addressData as any)[key]);

            try {
                // Update billing address as primary, and we can also set shipping if we want.
                // We use set to overwrite or create if not exists.
                await client.patch(userId).set({
                    billingAddress: addressData,
                    // Optionally set shipping too if it's the same
                    shippingAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        company: formData.company,
                        address: formData.address,
                        apartment: formData.apartment || "",
                        city: formData.city,
                        region: formData.region,
                        zipCode: formData.zipCode || "",
                    },
                    // We can also update the name if it's missing or if we trust this source
                    // name: `${formData.firstName} ${formData.lastName}` 
                }).commit();
            } catch (patchError) {
                console.error("Failed to auto-save user address:", patchError);
                // Non-blocking error
            }
        }

        // Simulate Order Object for email (structure might need to match existing email template)
        const emailOrder = {
            id: createdOrder._id,
            number: orderNumber,
            status: 'pending',
            date_created: orderDoc.date,
            total: orderDoc.total.toString(),
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
            shipping: orderDoc.shippingAddress,
            line_items: orderDoc.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: (item.price * item.quantity).toString()
            })),
            payment_method_title: paymentMethod === 'cod' ? 'Contraentrega' : 'Wompi'
        };

        try {
            // Cast to any to bypass strict type checks against legacy interface if needed
            await sendOrderEmail(emailOrder as any, 'processing');
        } catch (emailErr) {
            console.error("Failed to send initial email:", emailErr);
        }

        return { success: true, orderId: createdOrder._id, orderNumber: createdOrder.orderNumber };

    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: "Failed to create order" };
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        await client.patch(orderId).set({ status: status }).commit();
        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
