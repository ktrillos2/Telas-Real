import resend from './resend';

import OrderReceiptEmail from '@/components/email/order-receipt';
import NewAccountEmail from '@/components/email/new-account';

// Define a type that matches the WooCommerce order structure we expect
interface OrderDetails {
    id: number;
    status: string;
    date_created: string;
    total: string;
    payment_method: string;
    payment_method_title: string;
    billing: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        address_1: string;
        address_2: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
    };
    line_items: Array<{
        name: string;
        quantity: number;
        total: string; // WooCommerce sends total as string
        price: number; // or calculate from total/qty
        image?: { src: string }; // Custom field if added, or fetch from product
    }>;
}

import { AdminOrderNotification } from '@/components/email/admin-order-notification';

// ... (keep interfaces)

export async function sendOrderEmail(order: any, status: string, messageOverride?: string) {
    if (!order || !order.billing || !order.billing.email) {
        console.error("Cannot send email: Missing validation data", order);
        return { success: false, error: "Missing order data" };
    }

    const emailProps = {
        orderId: order.id || order.number || 'N/A',
        orderDate: order.date_created || new Date().toISOString(),
        customerName: `${order.billing.first_name} ${order.billing.last_name}`,
        customerEmail: order.billing.email,
        customerPhone: order.billing.phone,
        items: order.line_items.map((item: any) => ({
            name: item.name || "Producto",
            quantity: item.quantity,
            price: `$${Number(item.total || 0).toLocaleString('es-CO')}`,
        })),
        subtotal: `$${Number(order.total || 0).toLocaleString('es-CO')}`,
        total: `$${Number(order.total || 0).toLocaleString('es-CO')}`,
        shippingAddress: `${order.billing.address_1}, ${order.billing.city}, ${order.billing.state}`,
        status: status,
        paymentMethod: order.payment_method || 'wompi'
    };

    const adminEmail = 'tiendavirtual@telasreal.com';
    let subject = `Nuevo Pedido #${emailProps.orderId}`;
    let customMessage = messageOverride || "";

    // Logic to determine WHO gets an email and WHICH email they get
    let sendToUser = false;
    let sendToAdmin = false;

    if (status === 'pending' && emailProps.paymentMethod === 'wompi') {
        // Pending Wompi: Only Admin 
        sendToAdmin = true;
        subject = `[Admin] Nuevo Pedido Pendiente #${emailProps.orderId}`;
    } else if (status === 'pending' && emailProps.paymentMethod === 'cod') {
        // COD Pending: User + Admin (Order Received)
        sendToUser = true;
        sendToAdmin = true;
        subject = `Solicitud de Pedido #${emailProps.orderId} Recibida`;
        customMessage = "Hemos recibido tu solicitud. Pronto te contactaremos para validarla.";
    } else if (status === 'processing') {
        // Processing (Paid or Confirmed): User + Admin
        sendToUser = true;
        sendToAdmin = true;
        subject = `¡Pago Exitoso! Pedido #${emailProps.orderId} Confirmado`;
        customMessage = "Tu pago ha sido procesado correctamente.";
    } else if (status === 'completed' || status === 'shipped') {
        // Shipped: User only usually, but Admin might want copy (let's verify) -> User only for status update
        sendToUser = true;
        subject = `¡Tu pedido #${emailProps.orderId} ha sido enviado!`;
    } else if (status === 'cancelled' || status === 'failed') {
        sendToUser = true;
        sendToAdmin = true; // Admin should know about failures
        subject = `Actualización: Pedido #${emailProps.orderId} ${status === 'cancelled' ? 'Cancelado' : 'Fallido'}`;
    }

    const { render } = await import('@react-email/render');
    const results = [];

    try {
        // 1. Send to Customer (if applicable) using Premium Template
        if (sendToUser) {
            const userHtml = await render(OrderReceiptEmail({ ...emailProps, message: customMessage } as any));
            const userSend = await resend.emails.send({
                from: 'Telas Real <tiendavirtual@telasreal.com>',
                to: [emailProps.customerEmail],
                subject: subject, // Subject is contextual
                html: userHtml,
            });
            results.push({ type: 'user', data: userSend });
        }

        // 2. Send to Admin (if applicable) using Admin Template
        if (sendToAdmin) {
            const adminHtml = await render(AdminOrderNotification({ ...emailProps }));
            const adminSend = await resend.emails.send({
                from: 'Telas Real <tiendavirtual@telasreal.com>',
                to: [adminEmail],
                subject: `[Admin] ${status.toUpperCase()} - Pedido #${emailProps.orderId}`,
                html: adminHtml,
            });
            results.push({ type: 'admin', data: adminSend });
        }

        console.log(`Emails processed for order ${emailProps.orderId} (Status: ${status})`, results);
        
        // Check for errors in individual email results
        const errors = results.filter(r => (r.data as any).error);
        if (errors.length > 0) {
            console.error("Some emails failed to send:", JSON.stringify(errors, null, 2));
            return { success: false, error: "Partial failure in sending emails", results };
        }

        return { success: true, results };
    } catch (error: any) {
        console.error("Error sending emails:", error);
        return { 
            success: false, 
            error: error.message || "Unknown error",
            details: error
        };
    }
}

export async function sendWelcomeEmail(customer: { email: string; name: string }, temporaryPassword?: string) {
    try {
        const { render } = await import('@react-email/render');
        const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`;

        const emailHtml = await render(NewAccountEmail({
            customerName: customer.name,
            email: customer.email,
            temporaryPassword,
            loginUrl
        }));

        const data = await resend.emails.send({
            from: 'Telas Real <tiendavirtual@telasreal.com>',
            to: [customer.email],
            subject: 'Bienvenido a Telas Real - Tus credenciales',
            html: emailHtml,
        });

        return { success: true, data };
    } catch (error) {
        console.error("Error sending welcome email:", error);
        return { success: false, error };
    }
}
