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
        let userId = (session?.user as any)?.id;

        // Ensure user exists or create one if guest
        if (!userId && formData.email) {
            // Check if user already exists
            const existingUser = await client.fetch(`*[_type == "user" && email == $email][0]`, { email: formData.email });

            if (existingUser) {
                userId = existingUser._id;
            } else {
                // Create new user
                const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                const newUser = await client.create({
                    _type: 'user',
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    password: hashedPassword,
                    role: 'user',
                    forcePasswordChange: true,
                    billingAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        company: formData.company,
                        address: formData.address,
                        apartment: formData.apartment,
                        city: formData.city,
                        region: formData.region,
                        zipCode: formData.zipCode,
                        phone: formData.phone,
                        email: formData.email,
                        documentId: formData.documentId
                    },
                    shippingAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        company: formData.company,
                        address: formData.address,
                        apartment: formData.apartment,
                        city: formData.city,
                        region: formData.region,
                        zipCode: formData.zipCode,
                    }
                });
                userId = newUser._id;

                // Send Welcome Email
                try {
                    const { sendWelcomeEmail } = await import("@/lib/email-notifications");
                    await sendWelcomeEmail({ email: formData.email, name: `${formData.firstName} ${formData.lastName}` }, tempPassword);
                } catch (e) {
                    console.error("Failed to send welcome email:", e);
                }
            }
        }

        // Query for the latest order to determine the next order number
        const latestOrderQuery = `*[_type == "order"] | order(_createdAt desc)[0] { orderNumber }`;
        const latestOrder = await client.fetch(latestOrderQuery);

        let nextNumber = 1;
        if (latestOrder && latestOrder.orderNumber) {
            // Extract the numeric part of the order number (e.g., from '001', '015', or 'ORD-...')
            const numericPart = latestOrder.orderNumber.match(/\d+/);
            if (numericPart) {
                nextNumber = parseInt(numericPart[0], 10) + 1;
            }
        }

        // Generate Order Number in 00001 format
        const orderNumber = String(nextNumber).padStart(5, '0');

        const orderDoc = {
            _type: 'order',
            orderNumber,
            date: new Date().toISOString(),
            status: 'pending',
            paymentMethod: paymentMethod,
            email: formData.email, // Added root email field per schema
            total: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
            user: userId ? { _type: 'reference', _ref: userId } : undefined,
            items: items.map((item: any) => ({
                _key: uuidv4(),
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
                designName: item.designName, 
                isCustom: item.isCustom 
            })),
            shippingAddress: {
                fullName: `${formData.firstName} ${formData.lastName}`,
                documentId: formData.documentId,
                company: formData.company,
                country: 'Colombia', 
                address: formData.address,
                apartment: formData.apartment,
                department: formData.region, 
                city: formData.city,
                zipCode: formData.zipCode,
                phone: formData.phone
                // Removed email from here as it's at the root in schema
            }
        };

        const createdOrder = await client.create(orderDoc);

        // Update User Address if Authenticated and missing
        if (userId && session) {
            try {
                await client.patch(userId).set({
                    billingAddress: {
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
                    }
                }).commit();
            } catch (patchError) {
                console.error("Failed to auto-save user address:", patchError);
            }
        }

        // Send Pending Order Email
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
                name: `${item.name}${item.designName ? ` (${item.designName})` : ''}`,
                quantity: item.quantity,
                price: item.price,
                total: (item.price * item.quantity).toString()
            })),
            payment_method_title: paymentMethod === 'cod' ? 'Contraentrega' : 'Wompi'
        };

        try {
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
        const existingOrder: any = await client.fetch(`*[_type == "order" && (_id == $orderId || orderNumber == $orderId)][0]`, { orderId });

        if (!existingOrder) {
            return { success: false, error: "Order not found" };
        }

        if (existingOrder.status === status) {
            console.log(`Order ${orderId} already has status ${status}. Skipping update to prevent duplicate notifications.`);
            return { success: true };
        }

        // Update status in Sanity using _id, not orderId which might be orderNumber
        await client.patch(existingOrder._id).set({ status: status }).commit();

        // If status is 'paid' or 'processing', send email
        if (status === 'processing' || status === 'paid') {
            // Use the already fetched order
            const order = existingOrder;

            if (order) {
                const emailOrder = {
                    id: order.orderNumber || order._id,
                    date_created: order.date,
                    total: order.total,
                    payment_method: 'wompi',
                    billing: {
                        first_name: order.shippingAddress?.fullName?.split(' ')[0] || "Cliente",
                        last_name: order.shippingAddress?.fullName?.split(' ').slice(1).join(' ') || "",
                        email: order.email || order.shippingAddress?.email, // Prefer root email
                        phone: order.shippingAddress?.phone,
                        address_1: order.shippingAddress?.address,
                        city: order.shippingAddress?.city,
                        state: order.shippingAddress?.department || "CO",
                        country: 'CO'
                    },
                    line_items: order.items?.map((item: any) => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        total: (item.price * item.quantity).toString()
                    })) || []
                };

                if (emailOrder.billing.email) {
                    try {
                        const { sendOrderEmail } = await import("@/lib/email-notifications");
                        await sendOrderEmail(emailOrder as any, 'processing'); // Use 'processing' template for now as 'paid' might not exist
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
        const order: any = await client.fetch(`*[_type == "order" && (_id == $orderId || orderNumber == $orderId)][0]`, { orderId });
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
