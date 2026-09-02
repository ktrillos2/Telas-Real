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

export async function createOrder(
    formData: any, 
    items: any[], 
    paymentMethod: string = "wompi", 
    shouldCreateAccount: boolean = false,
    existingOrderId?: string | null
) {
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

        // Check if an existing pending draft order already exists to prevent duplicate order creation
        let existingPendingOrder: any = null;

        if (existingOrderId) {
            const cleanId = String(existingOrderId).trim();
            existingPendingOrder = await client.fetch(
                `*[_type == "order" && status == "pending" && (_id == $cleanId || orderNumber == $cleanId)][0]`,
                { cleanId }
            );
        }

        if (!existingPendingOrder && formData.email) {
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
            const cleanEmail = formData.email.trim().toLowerCase();
            existingPendingOrder = await client.fetch(
                `*[_type == "order" && status == "pending" && (lower(email) == $cleanEmail || lower(shippingAddress.email) == $cleanEmail) && _createdAt > $fourHoursAgo] | order(_createdAt desc)[0]`,
                { cleanEmail, fourHoursAgo }
            );
        }

        let orderNumber = existingPendingOrder?.orderNumber;

        if (!orderNumber) {
            // Query for the latest orders to determine the next order number, ignoring corrupted ones
            const recentOrdersQuery = `*[_type == "order"] | order(_createdAt desc)[0...50] { orderNumber }`;
            const recentOrders = await client.fetch(recentOrdersQuery);

            let nextNumber = 10001;
            if (recentOrders && recentOrders.length > 0) {
                for (const order of recentOrders) {
                    if (order.orderNumber) {
                        const numericPart = order.orderNumber.match(/\d+/);
                        if (numericPart) {
                            const parsed = parseInt(numericPart[0], 10);
                            // Asegurar que sea de longitud 5 (entre 10000 y 99999)
                            if (parsed >= 10000 && parsed <= 99999) {
                                nextNumber = Math.max(10001, parsed + 1);
                                break;
                            }
                        }
                    }
                }
            }
            orderNumber = String(nextNumber);
        }

        // Check for Beneficio Event
        let obsequio = undefined;
        try {
            const benefitConfig = await client.fetch(`*[_type == "benefitEvent"][0]`);
            if (benefitConfig && benefitConfig.isActive) {
                const now = new Date();
                const end = benefitConfig.endDate ? new Date(benefitConfig.endDate) : null;
                if (!end || now <= end) {
                    const orderTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                    let eligibleQuantity = 0;
                    if (orderTotal >= 250000) {
                        eligibleQuantity = 3;
                    } else if (orderTotal >= 100000 && orderTotal < 250000) {
                        eligibleQuantity = 1;
                    }

                    if (eligibleQuantity > 0) {
                        const pastPromoOrder = await client.fetch(`*[_type == "order" && email == $email && defined(obsequio) && status != "cancelled"][0]`, { email: formData.email });
                        if (!pastPromoOrder) {
                            let availableProducts = benefitConfig.liquidationProducts || [];
                            
                            if (benefitConfig.liquidationCategories && benefitConfig.liquidationCategories.length > 0) {
                                const categoryRefs = benefitConfig.liquidationCategories.map((c: any) => c._ref);
                                const productsFromCategories = await client.fetch(`*[_type == "product" && references($categoryRefs)]`, { categoryRefs });
                                const formattedProducts = productsFromCategories.map((p: any) => ({ _ref: p._id }));
                                availableProducts = [...availableProducts, ...formattedProducts];
                            }

                            if (availableProducts.length > 0) {
                                const randomRef = availableProducts[Math.floor(Math.random() * availableProducts.length)];
                                obsequio = {
                                    product: { _type: 'reference', _ref: randomRef._ref },
                                    quantity: eligibleQuantity
                                };
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error checking benefit config", error);
        }

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
                designName: item.designName || (item.isCustom ? 'Diseño Personalizado' : undefined), 
                isCustom: !!item.isCustom,
                customDesignUrl: item.isCustom ? (item.designUrl || item.customDesignUrl) : undefined
            })),
            obsequio,
            shippingAddress: {
                fullName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.fullName || 'Cliente',
                documentId: String(formData.documentId || formData.cedula || formData.nit || existingPendingOrder?.shippingAddress?.documentId || '').trim(),
                company: formData.company || '',
                country: formData.country || 'Colombia', 
                address: formData.address || '',
                apartment: formData.apartment || '',
                department: formData.region || formData.department || 'Cundinamarca', 
                city: formData.city || 'Bogotá',
                zipCode: formData.zipCode || '',
                phone: formData.phone || ''
            }
        };

        let createdOrder: any = null;

        // If existing pending draft order exists, reuse and patch it
        if (existingPendingOrder) {
            await client.patch(existingPendingOrder._id).set(orderDoc).commit();
            createdOrder = { _id: existingPendingOrder._id, orderNumber: existingPendingOrder.orderNumber || orderNumber };
        } else {
            createdOrder = await client.create(orderDoc);
        }

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
            id: orderNumber || createdOrder.orderNumber || createdOrder._id,
            orderNumber: orderNumber,
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
                total: (item.price * item.quantity).toString(),
                image: item.image
            })),
            payment_method: paymentMethod,
            payment_method_title: paymentMethod === 'cod' ? 'Contraentrega' : 'Wompi'
        };

        try {
            await sendOrderEmail(emailOrder as any, 'pending');
        } catch (emailErr) {
            console.error("Failed to send initial email:", emailErr);
        }

        // Track purchase internally for Dashboard Metrics
        try {
            const dateString = new Date().toISOString().split('T')[0];
            const existingMetric = await client.fetch(`*[_type == "dailyMetrics" && date == $date][0]`, { date: dateString });
            if (existingMetric) {
                await client.patch(existingMetric._id).inc({ purchases: 1 }).commit();
            } else {
                await client.create({
                    _type: 'dailyMetrics',
                    date: dateString,
                    addsToCart: 0,
                    checkoutsStarted: 0,
                    purchases: 1,
                });
            }
        } catch (metricError) {
            console.error("Failed to track purchase metric:", metricError);
        }

        return { success: true, orderId: createdOrder._id, orderNumber: createdOrder.orderNumber };

    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: "Failed to create order" };
    }
}

export async function updateOrderStatus(
    orderId: string, 
    status: string, 
    wompiDetails?: { 
        transactionId?: string; 
        wompiStatus?: string; 
        paymentMethodType?: string; 
        paymentDate?: string;
    }
) {
    try {
        const cleanOrderId = String(orderId || '').trim();
        const numericMatch = cleanOrderId.match(/\d+/);
        const numericRef = numericMatch ? numericMatch[0] : '';

        const existingOrder: any = await client.fetch(`*[_type == "order" && (
            _id == $cleanOrderId || 
            orderNumber == $cleanOrderId || 
            orderNumber == $numericRef ||
            wompiTransactionId == $cleanOrderId
        )][0]{
            ...,
            obsequio {
                quantity,
                product->{
                    title
                }
            }
        }`, { cleanOrderId, numericRef });

        if (!existingOrder) {
            console.error(`[updateOrderStatus] Order not found for id: ${orderId}`);
            return { success: false, error: "Order not found" };
        }

        const isStatusChange = existingOrder.status !== status;

        // Build complete patch data including Wompi fields
        const patchData: Record<string, any> = {
            status: status
        };

        if (wompiDetails?.transactionId) {
            patchData.wompiTransactionId = wompiDetails.transactionId;
        }
        if (wompiDetails?.wompiStatus) {
            patchData.wompiStatus = wompiDetails.wompiStatus;
        } else if (status === 'paid' && !existingOrder.wompiStatus) {
            patchData.wompiStatus = 'APPROVED';
        }

        if (wompiDetails?.paymentMethodType) {
            patchData.wompiPaymentMethodType = wompiDetails.paymentMethodType;
        }
        if (status === 'paid' && !existingOrder.paymentDate) {
            patchData.paymentDate = wompiDetails?.paymentDate || new Date().toISOString();
        }

        // Commit updates to Sanity
        await client.patch(existingOrder._id).set(patchData).commit();

        // If status didn't change and wasn't newly paid, skip sending email again
        if (!isStatusChange && (existingOrder.status === 'paid' || existingOrder.status === 'processing')) {
            console.log(`Order ${orderId} status already ${status}. Patched metadata and skipping duplicate email.`);
            return { success: true };
        }

        // If status is 'paid' or 'processing', send email
        if (status === 'processing' || status === 'paid') {
            // Use the already fetched order
            const order = existingOrder;

            if (order) {
                const emailOrder = {
                    id: order.orderNumber || order._id,
                    orderNumber: order.orderNumber,
                    number: order.orderNumber,
                    date_created: order.date,
                    total: order.total,
                    payment_method: order.paymentMethod || 'wompi',
                    payment_method_title: order.paymentMethod === 'cod' ? 'Contraentrega' : 'Wompi',
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
                        total: (item.price * item.quantity).toString(),
                        image: item.image
                    })) || []
                };

                if (emailOrder.billing.email) {
                    try {
                        const { sendOrderEmail } = await import("@/lib/email-notifications");
                        await sendOrderEmail(emailOrder as any, 'processing'); // Use 'processing' template for now as 'paid' might not exist
                    } catch (emailErr) {
                        console.error("Failed to send paid email:", emailErr);
                    }
                    
                    // Send Gift Email if applicable
                    if (order.obsequio && order.obsequio.product && order.obsequio.product.title) {
                        try {
                            const { sendGiftEmail } = await import("@/lib/email-notifications");
                            await sendGiftEmail(
                                { email: emailOrder.billing.email, name: emailOrder.billing.first_name },
                                { 
                                    productName: order.obsequio.product.title,
                                    quantity: order.obsequio.quantity,
                                    orderId: emailOrder.id
                                }
                            );
                        } catch (err) {
                            console.error("Failed to send gift email:", err);
                        }
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
        const cleanOrderId = String(orderId || '').trim();
        const numericMatch = cleanOrderId.match(/\d+/);
        const numericRef = numericMatch ? numericMatch[0] : '';

        const order: any = await client.fetch(`*[_type == "order" && (
            _id == $cleanOrderId || 
            orderNumber == $cleanOrderId || 
            orderNumber == $numericRef ||
            wompiTransactionId == $cleanOrderId
        )][0]`, { cleanOrderId, numericRef });

        if (!order) return null;

        // Map to Confirmation Page expected structure
        return {
            _id: order._id,
            orderNumber: order.orderNumber ? String(order.orderNumber) : String(order._id),
            reference: order.orderNumber ? String(order.orderNumber) : String(order._id),
            email: order.email || order.shippingAddress?.email || '',
            status: order.status,
            total: order.total,
            totalPrice: order.total,
            items: order.items || [],
            shippingAddress: order.shippingAddress,
            wompiTransactionId: order.wompiTransactionId,
            wompiStatus: order.wompiStatus,
            paymentMethod: order.paymentMethod,
            formData: {
                firstName: order.shippingAddress?.fullName?.split(' ')[0] || '',
                lastName: order.shippingAddress?.fullName?.split(' ').slice(1).join(' ') || '',
                email: order.email || order.shippingAddress?.email || '',
                phone: order.shippingAddress?.phone || '',
                address: order.shippingAddress?.address || '',
                city: order.shippingAddress?.city || '',
                region: order.shippingAddress?.department || '',
                documentId: order.shippingAddress?.documentId || ''
            }
        };
    } catch (error) {
        console.error('Error fetching order details:', error);
        return null;
    }
}

/**
 * Automatically captures and saves draft checkout data when customer inputs email/phone,
 * enabling automated abandoned cart notifications if they leave without paying.
 */
export async function saveDraftCheckout(formData: any, items: any[], existingOrderId?: string | null) {
    if (!formData.email || !formData.email.includes('@') || !items || items.length === 0) {
        return { success: false, error: 'Invalid email or empty items' };
    }

    try {
        const orderTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const cleanEmail = formData.email.trim().toLowerCase();

        let existing: any = null;

        // 1. Check by explicit order ID if provided
        if (existingOrderId) {
            const cleanId = String(existingOrderId).trim();
            existing = await client.fetch(
                `*[_type == "order" && status == "pending" && (_id == $cleanId || orderNumber == $cleanId)][0]{ _id, orderNumber, status }`,
                { cleanId }
            );
        }

        // 2. If not found by ID, search by customer email within the last 4 hours to avoid duplicates
        if (!existing && cleanEmail) {
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
            existing = await client.fetch(
                `*[_type == "order" && status == "pending" && (lower(email) == $cleanEmail || lower(shippingAddress.email) == $cleanEmail) && _createdAt > $fourHoursAgo] | order(_createdAt desc)[0]{ _id, orderNumber, status }`,
                { cleanEmail, fourHoursAgo }
            );
        }

        const patchData = {
            email: formData.email,
            total: orderTotal,
            items: items.map((item: any) => ({
                _key: uuidv4(),
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
                designName: item.designName || (item.isCustom ? 'Diseño Personalizado' : undefined),
                isCustom: !!item.isCustom,
                customDesignUrl: item.isCustom ? (item.designUrl || item.customDesignUrl) : undefined
            })),
            shippingAddress: {
                fullName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.fullName || 'Cliente',
                documentId: String(formData.documentId || formData.cedula || formData.nit || existing?.shippingAddress?.documentId || '').trim(),
                company: formData.company || '',
                country: formData.country || 'Colombia',
                address: formData.address || '',
                apartment: formData.apartment || '',
                department: formData.region || formData.department || 'Cundinamarca',
                city: formData.city || 'Bogotá',
                zipCode: formData.zipCode || '',
                phone: formData.phone || ''
            }
        };

        // 3. If an existing pending draft order exists, UPDATE it without creating a new order
        if (existing) {
            await client.patch(existing._id).set(patchData).commit();
            return { success: true, orderId: existing._id, orderNumber: existing.orderNumber };
        }

        // 4. Otherwise create a new pending draft order in Sanity
        const recentOrdersQuery = `*[_type == "order"] | order(_createdAt desc)[0...50] { orderNumber }`;
        const recentOrders = await client.fetch(recentOrdersQuery);

        let nextNumber = 10001;
        if (recentOrders && recentOrders.length > 0) {
            for (const order of recentOrders) {
                if (order.orderNumber) {
                    const numericPart = order.orderNumber.match(/\d+/);
                    if (numericPart) {
                        const parsed = parseInt(numericPart[0], 10);
                        if (parsed >= 10000 && parsed <= 99999) {
                            nextNumber = Math.max(10001, parsed + 1);
                            break;
                        }
                    }
                }
            }
        }

        const orderNumber = String(nextNumber);
        const orderDoc = {
            _type: 'order',
            orderNumber,
            date: new Date().toISOString(),
            status: 'pending',
            paymentMethod: 'wompi',
            abandonedSmsSent: false,
            abandonedEmailSent: false,
            ...patchData
        };

        const createdOrder = await client.create(orderDoc);
        return { success: true, orderId: createdOrder._id, orderNumber: createdOrder.orderNumber };
    } catch (e: any) {
        console.error("Error saving draft checkout:", e);
        return { success: false, error: e.message };
    }
}
