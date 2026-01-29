import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
    Button,
} from "@react-email/components";
import * as React from "react";

interface AdminOrderNotificationProps {
    orderId: string | number;
    orderDate: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    items: Array<{
        name: string;
        quantity: number;
        price: string;
    }>;
    total: string;
    shippingAddress: string;
    status: string;
    paymentMethod: string;
}

export const AdminOrderNotification = ({
    orderId,
    orderDate,
    customerName,
    customerEmail,
    customerPhone,
    items,
    total,
    shippingAddress,
    status,
    paymentMethod,
}: AdminOrderNotificationProps) => {

    const statusColor = status === 'pending' ? 'text-amber-600' :
        status === 'processing' ? 'text-blue-600' :
            status === 'completed' ? 'text-green-600' : 'text-gray-600';

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>Nuevo Pedido #{orderId} - {customerName}</Preview>
                <Body className="bg-gray-100 font-sans my-auto mx-auto px-2 py-8">
                    <Container className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">

                        {/* Header */}
                        <Section className="p-6 border-b border-gray-100 bg-gray-50">
                            <Heading className="text-xl font-bold text-gray-800 m-0">
                                🔔 Nuevo Pedido Recibido
                            </Heading>
                            <Text className="text-gray-500 text-sm mt-1 mb-0">
                                Orden #{orderId.toString()} • {new Date(orderDate).toLocaleDateString()}
                            </Text>
                        </Section>

                        {/* Quick Stats */}
                        <Section className="p-6">
                            <Row>
                                <Column className="w-1/2">
                                    <Text className="text-xs uppercase font-bold text-gray-400 mb-1">Estado</Text>
                                    <Text className={`text-lg font-bold m-0 uppercase ${statusColor}`}>{status}</Text>
                                </Column>
                                <Column className="w-1/2 text-right">
                                    <Text className="text-xs uppercase font-bold text-gray-400 mb-1">Total</Text>
                                    <Text className="text-lg font-bold text-gray-800 m-0">{total}</Text>
                                </Column>
                            </Row>
                        </Section>

                        <Hr className="border-gray-100 mx-6" />

                        {/* Customer Info */}
                        <Section className="p-6">
                            <Heading className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                                Información del Cliente
                            </Heading>
                            <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700">
                                <p className="m-0 mb-2"><strong>Nombre:</strong> {customerName}</p>
                                <p className="m-0 mb-2"><strong>Email:</strong> <Link href={`mailto:${customerEmail}`}>{customerEmail}</Link></p>
                                {customerPhone && <p className="m-0 mb-2"><strong>Teléfono:</strong> {customerPhone}</p>}
                                <p className="m-0 mb-2"><strong>Método de Pago:</strong> <span className="uppercase">{paymentMethod}</span></p>
                                <p className="m-0"><strong>Dirección:</strong> {shippingAddress}</p>
                            </div>
                        </Section>

                        <Hr className="border-gray-100 mx-6" />

                        {/* Items */}
                        <Section className="p-6">
                            <Heading className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                                Items ({items.length})
                            </Heading>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="p-2 pb-2 font-medium">Producto</th>
                                        <th className="p-2 pb-2 font-medium text-right">Cant</th>
                                        <th className="p-2 pb-2 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-0">
                                            <td className="p-2 text-gray-800">{item.name}</td>
                                            <td className="p-2 text-gray-600 text-right">{item.quantity}</td>
                                            <td className="p-2 text-gray-800 font-medium text-right">{item.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>

                        {/* Actions */}
                        <Section className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                            <Button
                                href="https://sanity.io/manage" // Placeholder or actual admin link
                                className="bg-gray-900 text-white px-5 py-3 rounded text-sm font-medium hover:bg-black"
                            >
                                Ir al Panel de Administración
                            </Button>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default AdminOrderNotification;
