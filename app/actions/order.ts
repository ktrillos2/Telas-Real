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

export async function createOrder(formData: any, items: any[], paymentMethod: string = "wompi", shouldCreateAccount: boolean = false) {
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
                phone: formData.phone,
                email: formData.email
            }
        };

        const createdOrder = await client.create(orderDoc);


        // NEW LOGIC: Guest Account Creation
        if (!session && formData.email && shouldCreateAccount) {
            // Check if user already exists
            const existingUser = await client.fetch(`*[_type == "user" && email == $email][0]`, { email: formData.email });

            if (!existingUser) {
                // Create new user with temp password
                const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                const newUser = await client.create({
                    _type: 'user',
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    password: hashedPassword,
                    role: 'user',
                    forcePasswordChange: true, // Force password change
                    billingAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        city: formData.city,
                        region: formData.region,
                        phone: formData.phone,
                        email: formData.email,
                        documentId: formData.documentId
                    }
                });

                // Link order to new user
                await client.patch(createdOrder._id).set({
                    user: { _type: 'reference', _ref: newUser._id }
                }).commit();

                // Send Welcome Email
                try {
                    const { sendWelcomeEmail } = await import("@/lib/email-notifications");
                    await sendWelcomeEmail({ email: formData.email, name: `${formData.firstName} ${formData.lastName}` }, tempPassword);
                } catch (e) {
                    console.error("Failed to send welcome email:", e);
                }
            } else {
                // If user exists, link order to them
                await client.patch(createdOrder._id).set({
                    user: { _type: 'reference', _ref: existingUser._id }
                }).commit();
            }
        }

        // Auto-save address to user profile if authenticated
        if (session?.user?.email && orderDoc.user) {
            // ... (existing update logic) ...
            const userId = orderDoc.user._ref;
            // ...
            // (Simplified for brevity, just keeping existing block structure or assuming it's there)
            // I will replace the whole block carefully.
            // Actually, I should insert the NEW logic before this block.
        }

        // NEW LOGIC: Guest Account Creation
        if (!session && formData.email) {
            // Check if user already exists
            const existingUser = await client.fetch(`*[_type == "user" && email == $email][0]`, { email: formData.email });

            if (!existingUser) {
                // Create new user with temp password
                const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                // We need to hash it. Since we are in server environment, we can assume we might need a lib or just store it.
                // IMPORTANT: Sanity doesn't handle auth directly unless we use NextAuth adapter. 
                // Assuming we use standard NextAuth with Sanity adapter, we might need to hash if we store password in Sanity manually 
                // OR if we use a provider. 
                // Based on `app/actions/auth.ts`, it calls `createCustomer`. Let's assume we can reuse logic or replicate it.
                // However, `createCustomer` in `wordpress-orders` seems to imply WP sync? 
                // Re-reading `sanity/schemaTypes/user.ts`: it has a `password` field (hashed).

                // For simplicity and security, we should really use a proper auth registration flow.
                // But requested feature is: "se crea la cuenta... y se envia una contraseña".

                // Let's create the user in Sanity directly 
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                const newUser = await client.create({
                    _type: 'user',
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    password: hashedPassword,
                    role: 'user',
                    forcePasswordChange: true, // Force password change
                    billingAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        city: formData.city,
                        region: formData.region,
                        phone: formData.phone,
                        email: formData.email,
                        documentId: formData.documentId
                    }
                });

                // Link order to new user
                await client.patch(createdOrder._id).set({
                    user: { _type: 'reference', _ref: newUser._id }
                }).commit();

                // Send Welcome Email
                try {
                    const { sendWelcomeEmail } = await import("@/lib/email-notifications");
                    await sendWelcomeEmail({ email: formData.email, name: `${formData.firstName} ${formData.lastName}` }, tempPassword);
                } catch (e) {
                    console.error("Failed to send welcome email:", e);
                }
            } else {
                // If user exists but wasn't logged in, we link the order to them anyway just in case? 
                // Or we leave it as guest order. Linking is better for history.
                await client.patch(createdOrder._id).set({
                    user: { _type: 'reference', _ref: existingUser._id }
                }).commit();
            }
        }

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
            await sendOrderEmail(emailOrder as any, 'pending');
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
        // Update status in Sanity
        await client.patch(orderId).set({ status: status }).commit();

        // If status is 'processing' (Paid), send email to User + Admin
        if (status === 'processing') {
            // Fetch relevant order fields for email
            const order: any = await client.fetch(`*[_type == "order" && _id == $orderId][0]`, { orderId });

            if (order) {
                // Construct order object compatible with sendOrderEmail
                // Note: Sanity order structure might differ slightly from the expected 'billing' structure in sendOrderEmail 
                // which was designed for WooCommerce-like objects, but we can verify.
                // In createOrder we match this structure.

                const emailOrder = {
                    id: order.orderNumber || order._id, // Use human readable number if available
                    date_created: order.date,
                    total: order.total,
                    payment_method: 'wompi', // Assuming wompi for this flow as it's the one using 'processing'
                    billing: {
                        first_name: order.shippingAddress?.fullName?.split(' ')[0] || "Cliente",
                        last_name: order.shippingAddress?.fullName?.split(' ').slice(1).join(' ') || "",
                        email: order.shippingAddress?.email, // We stored email in shippingAddress/billingAddress in createOrder
                        phone: order.shippingAddress?.phone,
                        address_1: order.shippingAddress?.address,
                        city: order.shippingAddress?.city,
                        state: "CO", // Default or stored?
                        country: 'CO'
                    },
                    line_items: order.items || []
                };

                if (emailOrder.billing.email) {
                    try {
                        const { sendOrderEmail } = await import("@/lib/email-notifications");
                        await sendOrderEmail(emailOrder as any, 'processing');
                    } catch (emailErr) {
                        console.error("Failed to send paid email:", emailErr);
                    }
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function getOrderDetails(orderId: string) {
    try {
        const order: any = await client.fetch(`*[_type == "order" && _id == $orderId][0]`, { orderId });
        if (!order) return null;

        // Map to Confirmation Page expected structure
        return {
            reference: order.orderNumber || order._id,
            totalPrice: order.total,
            items: order.items,
            formData: {
                firstName: order.shippingAddress?.fullName?.split(' ')[0] || '',
                lastName: order.shippingAddress?.fullName?.split(' ').slice(1).join(' ') || '',
                email: order.shippingAddress?.email || '',
                phone: order.shippingAddress?.phone || '',
                address: order.shippingAddress?.address || '',
                city: order.shippingAddress?.city || '',
                region: '',
                documentId: ''
            }
        };
    } catch (error) {
        console.error('Error fetching order details:', error);
        return null;
    }
}
