import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
    Button,
} from "@react-email/components";
import * as React from "react";

interface OrderReceiptEmailProps {
    orderId: string | number;
    orderDate: string;
    customerName: string;
    items: Array<{
        name: string;
        quantity: number;
        price: string;
        image?: string;
    }>;
    subtotal: string;
    total: string;
    shippingAddress: string;
    status: string;
    paymentMethod: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : "";

export const OrderReceiptEmail = ({
    orderId,
    orderDate,
    customerName,
    items,
    subtotal,
    total,
    shippingAddress,
    status,
    paymentMethod,
}: OrderReceiptEmailProps) => {
    const formattedDate = new Date(orderDate).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    // LOGIC FOR STATUS DISPLAY
    const getStatusConfig = (status: string, paymentMethod: string) => {
        // Special logic for COD
        if (paymentMethod === 'cod') {
            if (status === 'pending') {
                return {
                    color: "#F59E0B", // Amber
                    bgColor: "#FEF3C7", // Amber 100
                    borderColor: "#FCD34D",
                    title: "Solicitud Recibida",
                    message: "Hemos recibido tu solicitud de pedido. Estamos validando los detalles para confirmar el despacho.",
                    icon: "📝"
                };
            }
            if (status === 'processing' || status === 'on-hold') {
                return {
                    color: "#10B981", // Emerald
                    bgColor: "#D1FAE5", // Emerald 100
                    borderColor: "#34D399",
                    title: "Pedido Confirmado",
                    message: "¡Tu pedido contraentrega ha sido confirmado! Estamos preparándolo para el envío.",
                    icon: "📦"
                };
            }
        }

        switch (status) {
            case "completed":
                return {
                    color: "#10B981",
                    bgColor: "#D1FAE5",
                    borderColor: "#34D399",
                    title: "Pedido Enviado",
                    message: "¡Buenas noticias! Tu pedido ha sido enviado y está en camino.",
                    icon: "🚚"
                };
            case "processing":
                return {
                    color: "#3B82F6", // Blue
                    bgColor: "#DBEAFE", // Blue 100
                    borderColor: "#60A5FA",
                    title: "¡Pago Exitoso!",
                    message: "Hemos recibido tu pago correctamente. Estamos preparando tu pedido.",
                    icon: "✅"
                };
            case "pending":
                return {
                    color: "#F59E0B",
                    bgColor: "#FEF3C7",
                    borderColor: "#FCD34D",
                    title: "Pendiente de Pago",
                    message: "Tu pedido ha sido creado. Estamos esperando la confirmación de la transacción.",
                    icon: "⏳"
                };
            case "cancelled":
                return {
                    color: "#EF4444", // Red
                    bgColor: "#FEE2E2", // Red 100
                    borderColor: "#F87171",
                    title: "Pedido Cancelado",
                    message: "Este pedido ha sido cancelado.",
                    icon: "❌"
                };
            case "failed":
                return {
                    color: "#EF4444",
                    bgColor: "#FEE2E2",
                    borderColor: "#F87171",
                    title: "Pago Fallido",
                    message: "La transacción fue rechazada o falló. Por favor intenta realizar el pedido nuevamente.",
                    icon: "⚠️"
                };
            case "refunded":
                return {
                    color: "#6B7280", // Gray
                    bgColor: "#F3F4F6", // Gray 100
                    borderColor: "#D1D5DB",
                    title: "Pedido Reembolsado",
                    message: "Se ha procesado el reembolso de este pedido.",
                    icon: "↩️"
                };
            default:
                return {
                    color: "#6B7280",
                    bgColor: "#F3F4F6",
                    borderColor: "#D1D5DB",
                    title: "Estado Actualizado",
                    message: "El estado de tu pedido ha cambiado.",
                    icon: "ℹ️"
                };
        }
    };

    const config = getStatusConfig(status, paymentMethod);

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>{`${config.icon} ${config.title} - Pedido #${orderId}`}</Preview>
                <Body className="bg-slate-50 font-sans my-auto mx-auto px-2 py-8">
                    <Container className="max-w-[600px] mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">

                        {/* Header Brand */}
                        <Section className="bg-white p-6 border-b border-slate-100 text-center">
                            <Heading className="text-xl font-bold tracking-tight text-slate-900 m-0">
                                TELAS REAL
                            </Heading>
                        </Section>

                        {/* Hero Status Section */}
                        <Section
                            className="py-12 px-6 text-center"
                            style={{ backgroundColor: config.bgColor, borderBottom: `1px solid ${config.borderColor}` }}
                        >
                            <Text className="text-5xl m-0 mb-4 h-[48px] block">{config.icon}</Text>
                            <Heading className="text-2xl font-bold text-slate-900 m-0 mb-2">
                                {config.title}
                            </Heading>
                            <Text className="text-slate-700 text-base m-0 max-w-[400px] mx-auto leading-relaxed">
                                {config.message}
                            </Text>
                        </Section>

                        {/* Order Details Card */}
                        <Section className="p-6 md:p-8">
                            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                                Detalles del Pedido
                            </Text>

                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                <Row className="mb-4">
                                    <Column>
                                        <Text className="text-slate-500 text-sm m-0">Orden #</Text>
                                        <Text className="text-slate-900 font-medium m-0">{orderId}</Text>
                                    </Column>
                                    <Column className="text-right">
                                        <Text className="text-slate-500 text-sm m-0">Fecha</Text>
                                        <Text className="text-slate-900 font-medium m-0">{formattedDate}</Text>
                                    </Column>
                                </Row>

                                <Row>
                                    <Column>
                                        <Text className="text-slate-500 text-sm m-0">Cliente</Text>
                                        <Text className="text-slate-900 font-medium m-0">{customerName}</Text>
                                    </Column>
                                    <Column className="text-right">
                                        <Text className="text-slate-500 text-sm m-0">Total</Text>
                                        <Text className="text-slate-900 font-bold text-lg m-0 text-emerald-600">{total}</Text>
                                    </Column>
                                </Row>
                            </div>
                        </Section>

                        {/* Items Summary - Simplified */}
                        <Section className="px-6 md:px-8 pb-8">
                            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                                Resumen
                            </Text>
                            {items.map((item, index) => (
                                <Row key={index} className="mb-4 border-b border-slate-100 pb-4 last:border-0 last:mb-0 last:pb-0">
                                    <Column className="w-2/3">
                                        <Text className="text-slate-800 font-medium m-0">{item.name}</Text>
                                        <Text className="text-slate-500 text-xs m-0">Cant: {item.quantity}</Text>
                                    </Column>
                                    <Column className="w-1/3 text-right">
                                        <Text className="text-slate-800 m-0">{item.price}</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>

                        {/* Actions / Contact */}
                        <Section className="bg-slate-50 p-6 border-t border-slate-100 text-center">
                            <Button
                                href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://telasreal.com'}/cuenta`}
                                className="bg-black text-white px-6 py-3 rounded-lg font-medium text-sm no-underline inline-block hover:bg-slate-800 transition-colors"
                            >
                                Ver mi Pedido
                            </Button>

                            <Text className="text-slate-500 text-xs mt-6 mb-0">
                                ¿Necesitas ayuda? Responde a este correo o escríbenos a{' '}
                                <Link href="mailto:tiendavirtual@telasreal.com" className="text-blue-600 underline">
                                    tiendavirtual@telasreal.com
                                </Link>
                            </Text>
                        </Section>

                        <Section className="p-6 text-center">
                            <Text className="text-slate-400 text-[10px] m-0">
                                © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default OrderReceiptEmail;
