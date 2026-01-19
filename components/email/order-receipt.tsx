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
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "#10B981"; // Emerald 500
            case "processing":
                return "#3B82F6"; // Blue 500
            case "pending":
                return "#F59E0B"; // Amber 500
            case "on-hold":
                return "#F59E0B"; // Amber 500
            case "cancelled":
                return "#EF4444"; // Red 500
            case "failed":
                return "#EF4444"; // Red 500
            case "refunded":
                return "#6B7280"; // Gray 500
            default:
                return "#6B7280";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "completed":
                return "Pedido Completado";
            case "processing":
                return "Pago Exitoso - Procesando Pedido";
            case "pending":
                return "Pedido Recibido - Pendiente de Pago";
            case "on-hold":
                return "En Espera / Contraentrega Confirmado";
            case "cancelled":
                return "Pedido Cancelado";
            case "failed":
                return "Pago Fallido";
            case "refunded":
                return "Pedido Reembolsado";
            default:
                return "Estado del Pedido Actualizado";
        }
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case "completed":
                return "Tu pedido ha sido completado y enviado. ¡Gracias por comprar con nosotros!";
            case "processing":
                return "Hemos recibido tu pago correctamente. Estamos preparando tu pedido para el envío.";
            case "pending":
                return "Hemos recibido tu pedido. Estamos esperando la confirmación del pago.";
            case "on-hold":
                return "Tu pedido está confirmado. Procederemos al despacho una vez validemos los detalles (Pago Contraentrega).";
            case "cancelled":
                return "Tu pedido ha sido cancelado.";
            case "failed":
                return "Hubo un problema con tu pago. Por favor intenta nuevamente o contáctanos.";
            case "refunded":
                return "Se ha realizado el reembolso de tu pedido.";
            default:
                return "El estado de tu pedido ha cambiado.";
        }
    };

    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const statusMessage = getStatusMessage(status);

    return (
        <Html>
            <Head />
            <Preview>{`${statusText} - Pedido #${orderId}`}</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans my-auto mx-auto px-2">
                    <Container className="border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] max-w-4xl bg-white">
                        <Section className="mt-[32px]">
                            <Row>
                                <Column align="left">
                                    {/* Placeholder for Logo - You can replace specific URL */}
                                    <Heading className="text-2xl font-bold text-gray-900 m-0">
                                        TELAS REAL
                                    </Heading>
                                </Column>
                                <Column align="right">
                                    <Text className="text-gray-500 text-sm">
                                        Confirmación de Orden
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        <Section className="mt-[32px] text-center">
                            <div style={{ backgroundColor: statusColor, padding: '12px 24px', borderRadius: '8px', display: 'inline-block' }}>
                                <Text className="text-white font-bold text-lg m-0">
                                    {statusText}
                                </Text>
                            </div>
                        </Section>

                        <Section className="mt-[32px]">
                            <Text className="text-gray-700 text-[16px] leading-[24px]">
                                Hola <strong>{customerName}</strong>,
                            </Text>
                            <Text className="text-gray-700 text-[16px] leading-[24px]">
                                {statusMessage}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                Pedido #{orderId} • {formattedDate}
                            </Text>
                        </Section>

                        <Section className="mt-[32px] mb-[32px]">
                            <Row className="border-b border-gray-200 pb-2">
                                <Column className="w-1/2">
                                    <Text className="text-gray-500 font-medium text-sm">PRODUCTO</Text>
                                </Column>
                                <Column className="w-1/6 text-center">
                                    <Text className="text-gray-500 font-medium text-sm">CANT.</Text>
                                </Column>
                                <Column className="w-1/3 text-right">
                                    <Text className="text-gray-500 font-medium text-sm">PRECIO</Text>
                                </Column>
                            </Row>
                            {items.map((item, index) => (
                                <Row key={index} className="border-b border-gray-100 py-4">
                                    <Column className="w-1/2">
                                        <Text className="text-gray-800 font-medium m-0">{item.name}</Text>
                                    </Column>
                                    <Column className="w-1/6 text-center">
                                        <Text className="text-gray-800 m-0">{item.quantity}</Text>
                                    </Column>
                                    <Column className="w-1/3 text-right">
                                        <Text className="text-gray-800 font-medium m-0">{item.price}</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>

                        <Section className="mb-[32px]">
                            <Row>
                                <Column className="w-1/2"></Column>
                                <Column className="w-1/2">
                                    <Row className="mb-2">
                                        <Column align="left"><Text className="text-gray-500 m-0">Subtotal</Text></Column>
                                        <Column align="right"><Text className="text-gray-800 font-medium m-0">{subtotal}</Text></Column>
                                    </Row>
                                    <Row className="mb-2">
                                        <Column align="left"><Text className="text-gray-500 m-0">Método de Pago</Text></Column>
                                        <Column align="right"><Text className="text-gray-800 font-medium m-0 capitalize">{paymentMethod === 'cod' ? 'Contraentrega' : paymentMethod}</Text></Column>
                                    </Row>
                                    <Hr className="border-gray-200 my-2" />
                                    <Row>
                                        <Column align="left"><Text className="text-black font-bold text-lg m-0">Total</Text></Column>
                                        <Column align="right"><Text className="text-black font-bold text-lg m-0">{total}</Text></Column>
                                    </Row>
                                </Column>
                            </Row>
                        </Section>

                        <Hr className="border-gray-200 mx-0 my-[26px]" />

                        <Section>
                            <Heading as="h3" className="text-gray-800 text-lg mb-4">Información de Envío</Heading>
                            <Text className="text-gray-600 m-0">
                                {shippingAddress}
                            </Text>
                        </Section>

                        <Hr className="border-gray-200 mx-0 my-[26px]" />

                        <Section className="text-center">
                            <Text className="text-gray-500 text-[12px] leading-[24px]">
                                Si tienes alguna pregunta, por favor contáctanos a <Link href="mailto:tiendavirtual@telasreal.com" className="text-blue-600 underline">tiendavirtual@telasreal.com</Link>
                            </Text>
                            <Text className="text-gray-500 text-[12px] leading-[24px] mt-4">
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
