import resend from './resend';
import OrderReceiptEmail from '@/components/email/order-receipt';

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

export async function sendOrderEmail(order: any, status: string) {
    // Map WooCommerce order to email props
    // Note: WooCommerce API returns snake_case keys usually.
    // 'order' input might come from createOrder (partial) or getOrder (full).
    // We try to handle both or expect full object from getOrder.

    if (!order || !order.billing || !order.billing.email) {
        console.error("Cannot send email: Missing validation data", order);
        return { success: false, error: "Missing order data" };
    }

    const emailProps = {
        orderId: order.id || order.number || 'N/A',
        orderDate: order.date_created || new Date().toISOString(),
        customerName: `${order.billing.first_name} ${order.billing.last_name}`,
        items: order.line_items.map((item: any) => ({
            name: item.name || "Producto",
            quantity: item.quantity,
            price: `$${Number(item.total || 0).toLocaleString('es-CO')}`, // Display the line total
            // image: item.image?.src // If available
        })),
        subtotal: `$${Number(order.total || 0).toLocaleString('es-CO')}`, // Simplified
        total: `$${Number(order.total || 0).toLocaleString('es-CO')}`,
        shippingAddress: `${order.billing.address_1}, ${order.billing.city}, ${order.billing.state}`,
        status: status, // Passed explicitly or from order.status
        paymentMethod: order.payment_method || 'wompi'
    };

    // Determine subject based on status
    let subject = `Actualización de tu pedido #${emailProps.orderId}`;
    if (status === 'pending' || status === 'on-hold') {
        subject = `Confirmación de pedido #${emailProps.orderId}`;
    } else if (status === 'completed') {
        subject = `Tu pedido #${emailProps.orderId} ha sido enviado`;
    } else if (status === 'processing') {
        subject = `Pago recibido para el pedido #${emailProps.orderId}`;
    } else if (status === 'cancelled') {
        subject = `Pedido #${emailProps.orderId} cancelado`;
    }

    try {
        // Explicitly render the email component to HTML string
        // This helps bypass issues with passing React components directly in some environments 
        // especially with Next.js Server Actions and React 19 RC
        const { render } = await import('@react-email/render');
        const emailHtml = await render(OrderReceiptEmail(emailProps));

        const data = await resend.emails.send({
            from: 'Telas Real <tiendavirtual@telasreal.com>',
            to: [order.billing.email],
            bcc: ['tiendavirtual@telasreal.com'],
            subject: subject,
            html: emailHtml,
        });

        console.log(`Email sent for order ${emailProps.orderId} (Status: ${status}):`, data);
        return { success: true, data };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}
