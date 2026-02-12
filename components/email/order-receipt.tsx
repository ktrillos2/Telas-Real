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
    message?: string;
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
    message,
}: OrderReceiptEmailProps) => {
    const formattedDate = new Date(orderDate).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // LOGIC FOR STATUS DISPLAY
    const getStatusConfig = (status: string, paymentMethod: string) => {
        if (paymentMethod === 'cod') {
            return {
                accentColor: "#f59e0b",
                title: "Pedido Contraentrega Confirmado",
                heroMessage: "Tu pedido ha sido recibido. Recuerda tener el efectivo listo al momento de la entrega.",
            };
        }

        switch (status) {
            case "processing":
                return {
                    accentColor: "#3b82f6",
                    title: "¡Gracias por tu compra!",
                    heroMessage: "Hemos recibido tu pago. Tu pedido se está preparando.",
                };
            case "completed":
            case "shipped":
                return {
                    accentColor: "#10b981",
                    title: "¡Tu pedido va en camino!",
                    heroMessage: "Tu paquete ha sido enviado y pronto estará contigo.",
                };
            case "pending":
                return {
                    accentColor: "#f59e0b",
                    title: "Pago Pendiente",
                    heroMessage: "Tu pedido está reservado. Completa el pago para finalizar.",
                };
            case "cancelled":
                return {
                    accentColor: "#ef4444",
                    title: "Pedido Cancelado",
                    heroMessage: "Este pedido ha sido cancelado.",
                };
            default:
                return {
                    accentColor: "#6b7280",
                    title: "Actualización de Pedido",
                    heroMessage: "El estado de tu pedido ha cambiado.",
                };
        }
    };

    const config = getStatusConfig(status, paymentMethod);

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>{config.title} - Pedido #{orderId}</Preview>
                <Body className="bg-white font-sans my-auto mx-auto px-2 py-10">
                    <Container className="max-w-[600px] mx-auto">

                        {/* Logo Centered */}
                        <Section className="text-center mb-8">
                            {/* Ideally use an actual Image URL here if available */}
                            <Heading className="text-2xl font-light tracking-[0.2em] text-black m-0 uppercase">
                                TELAS REAL
                            </Heading>
                        </Section>

                        {/* Main Content Card */}
                        <Section className="bg-white border-t-4 shadow-sm rounded-b-lg overflow-hidden border-gray-100" style={{ borderTopColor: config.accentColor }}>

                            {/* Hero */}
                            <Section className="px-10 py-12 text-center bg-gray-50/50">
                                <Heading className="text-2xl font-bold text-gray-900 m-0 mb-3">
                                    {config.title}
                                </Heading>
                                <Text className="text-gray-600 text-base m-0 max-w-[400px] mx-auto leading-relaxed">
                                    {message || config.heroMessage}
                                </Text>
                            </Section>

                            {/* Order Info Bar */}
                            <Section className="px-10 py-6 border-b border-gray-100 flex justify-between">
                                <Row>
                                    <Column>
                                        <Text className="text-gray-400 text-xs uppercase tracking-wider font-bold m-0 mb-1">Pedido No.</Text>
                                        <Text className="text-gray-900 font-medium m-0">{orderId.toString()}</Text>
                                    </Column>
                                    <Column align="right">
                                        <Text className="text-gray-400 text-xs uppercase tracking-wider font-bold m-0 mb-1">Fecha</Text>
                                        <Text className="text-gray-900 font-medium m-0">{formattedDate}</Text>
                                    </Column>
                                </Row>
                            </Section>

                            {/* Items List */}
                            <Section className="px-10 py-8">
                                <Text className="text-gray-900 font-bold mb-6">Resumen de tu compra</Text>
                                <table className="w-full text-left border-collapse">
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className="border-b border-gray-100 last:border-0">
                                                <td className="py-4 align-top w-16">
                                                    {/* Placeholder for Product Image - Replace with item.image if available */}
                                                    <div className="bg-gray-100 w-12 h-12 rounded-md flex items-center justify-center text-xs text-gray-400">IMG</div>
                                                </td>
                                                <td className="py-4 pl-4 align-top">
                                                    <Text className="text-gray-900 font-medium m-0 block">{item.name}</Text>
                                                    <Text className="text-gray-500 text-xs m-0 mt-1">Cantidad: {item.quantity}</Text>
                                                </td>
                                                <td className="py-4 align-top text-right whitespace-nowrap">
                                                    <Text className="text-gray-900 font-medium m-0">{item.price}</Text>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Section>

                            {/* Totals */}
                            <Section className="px-10 pb-8 bg-gray-50/30">
                                <Row className="mb-2">
                                    <Column><Text className="text-gray-500 m-0">Subtotal</Text></Column>
                                    <Column align="right"><Text className="text-gray-900 font-medium m-0">{subtotal}</Text></Column>
                                </Row> {/* Add Shipping, Tax etc if available to match subtotal logic */}
                                <Hr className="border-gray-200 my-4" />
                                <Row>
                                    <Column><Text className="text-gray-900 font-bold text-lg m-0">Total</Text></Column>
                                    <Column align="right"><Text className="text-gray-900 font-bold text-lg m-0">{total}</Text></Column>
                                </Row>
                            </Section>

                            {/* Customer & Shipping Details */}
                            <Section className="px-10 py-8 border-t border-gray-100">
                                <Row>
                                    <Column className="w-1/2 align-top pr-4">
                                        <Text className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3">Dirección de Envío</Text>
                                        <Text className="text-gray-700 text-sm m-0 leading-relaxed">
                                            {customerName}<br />
                                            {shippingAddress}
                                        </Text>
                                    </Column>
                                    <Column className="w-1/2 align-top pl-4">
                                        <Text className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3">Pago</Text>
                                        <Text className="text-gray-700 text-sm m-0 leading-relaxed uppercase">
                                            {paymentMethod === 'cod' ? 'Contraentrega' : paymentMethod}
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>

                            {/* CTA */}
                            <Section className="px-10 pb-10 text-center">
                                <Button
                                    href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://telasreal.com'}/cuenta`}
                                    className="bg-black text-white px-8 py-4 rounded-full font-medium text-sm no-underline inline-block hover:bg-gray-800 transition-colors"
                                >
                                    Ver mi Pedido
                                </Button>
                            </Section>

                        </Section>

                        {/* Footer */}
                        <Section className="text-center pt-8 pb-4">
                            <Text className="text-gray-400 text-xs m-0 mb-2">
                                ¿Tienes alguna pregunta? Contáctanos a <Link href="mailto:tiendavirtual@telasreal.com" className="text-gray-600 underline">tiendavirtual@telasreal.com</Link>
                            </Text>
                            <Text className="text-gray-300 text-[10px] m-0 uppercase tracking-widest">
                                Telas Real © {new Date().getFullYear()}
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default OrderReceiptEmail;
