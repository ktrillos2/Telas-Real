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

export interface AbandonedCartItem {
    name: string;
    quantity: number;
    price: string | number;
    image?: string;
    designName?: string;
    isCustom?: boolean;
}

export interface AbandonedCartEmailProps {
    customerName: string;
    items: AbandonedCartItem[];
    subtotal?: string | number;
    total?: string | number;
    recoveryUrl?: string;
    orderId?: string | number;
}

export const AbandonedCartEmail = ({
    customerName = "Cliente",
    items = [],
    subtotal,
    total,
    recoveryUrl = "https://www.telasreal.com/carrito",
    orderId,
}: AbandonedCartEmailProps) => {
    const formattedTotal = typeof total === "number" 
        ? `$${total.toLocaleString("es-CO")}` 
        : total || "$0";
    
    const formattedSubtotal = typeof subtotal === "number" 
        ? `$${subtotal.toLocaleString("es-CO")}` 
        : subtotal || formattedTotal;

    const firstName = customerName ? customerName.split(" ")[0] : "Cliente";

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>{`¡${firstName}, tus telas te están esperando en Telas Real! 🧵`}</Preview>
                <Body className="bg-[#f4f7f9] font-sans my-auto mx-auto px-2 py-10">
                    <Container className="max-w-[600px] mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

                        {/* Top Accent Bar */}
                        <Section className="bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] h-2 w-full" />

                        {/* Brand Header */}
                        <Section className="text-center pt-8 pb-6 px-6">
                            <Heading className="text-2xl font-light tracking-[0.25em] text-gray-900 m-0 uppercase">
                                TELAS REAL
                            </Heading>
                            <Text className="text-xs text-gray-400 tracking-widest uppercase mt-1 m-0 font-medium">
                                Tu Tienda Textil Online
                            </Text>
                        </Section>

                        {/* Hero Banner */}
                        <Section className="px-8 py-8 text-center bg-gradient-to-b from-[#f0f9ff] to-white border-y border-[#e0f2fe]">
                            <div className="inline-block bg-[#e0f2fe] text-[#0284c7] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
                                🧵 ¡No te quedes sin tus metros!
                            </div>
                            <Heading className="text-2xl font-bold text-gray-900 m-0 mb-3 leading-tight">
                                ¡Hola {firstName}! Tus telas favoritas siguen en tu carrito
                            </Heading>
                            <Text className="text-gray-600 text-sm m-0 max-w-[460px] mx-auto leading-relaxed">
                                Notamos que no alcanzaste a finalizar tu compra. Guardamos temporalmente los productos seleccionados para que puedas retomarlos fácilmente.
                            </Text>
                        </Section>

                        {/* Order / Cart Reference */}
                        {orderId && (
                            <Section className="px-8 py-3 bg-gray-50 border-b border-gray-100 text-center">
                                <Text className="text-xs text-gray-500 m-0">
                                    Referencia de pedido: <span className="font-semibold text-gray-800">#{orderId}</span>
                                </Text>
                            </Section>
                        )}

                        {/* Products List */}
                        <Section className="px-8 py-6">
                            <Text className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-4 m-0">
                                Productos en tu carrito:
                            </Text>

                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {items.map((item, index) => {
                                        const itemPrice = typeof item.price === "number"
                                            ? `$${item.price.toLocaleString("es-CO")}`
                                            : item.price;

                                        return (
                                            <tr key={index} className="border-b border-gray-100 last:border-0">
                                                <td className="py-3.5 align-middle w-16">
                                                    {item.image ? (
                                                        <Img
                                                            src={item.image}
                                                            width={56}
                                                            height={56}
                                                            alt={item.name}
                                                            className="w-14 h-14 rounded-lg object-cover bg-gray-100 border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="bg-gray-100 w-14 h-14 rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">
                                                            TELA
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3.5 pl-4 align-middle">
                                                    <Text className="text-gray-900 font-medium text-sm m-0 block">
                                                        {item.name}
                                                    </Text>
                                                    {item.designName && (
                                                        <Text className="text-xs text-[#0284c7] font-medium m-0 mt-0.5">
                                                            Diseño: {item.designName}
                                                        </Text>
                                                    )}
                                                    <Text className="text-gray-500 text-xs m-0 mt-0.5">
                                                        Cantidad: <span className="font-semibold text-gray-700">{item.quantity} metro(s)</span>
                                                    </Text>
                                                </td>
                                                <td className="py-3.5 align-middle text-right whitespace-nowrap">
                                                    <Text className="text-gray-900 font-bold text-sm m-0">
                                                        {itemPrice}
                                                    </Text>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Section>

                        {/* Order Summary Total */}
                        <Section className="px-8 py-5 bg-gray-50/80 border-t border-b border-gray-100">
                            <Row className="mb-1.5">
                                <Column>
                                    <Text className="text-gray-500 text-xs m-0">Subtotal de productos</Text>
                                </Column>
                                <Column align="right">
                                    <Text className="text-gray-800 font-medium text-xs m-0">{formattedSubtotal}</Text>
                                </Column>
                            </Row>
                            <Hr className="border-gray-200 my-2" />
                            <Row>
                                <Column>
                                    <Text className="text-gray-900 font-bold text-base m-0">Total Estimado</Text>
                                </Column>
                                <Column align="right">
                                    <Text className="text-[#0284c7] font-bold text-lg m-0">{formattedTotal}</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Main Call To Action */}
                        <Section className="px-8 py-8 text-center bg-white">
                            <Button
                                href={recoveryUrl}
                                className="bg-[#0284c7] text-white px-9 py-4 rounded-xl font-bold text-sm no-underline inline-block hover:bg-[#0369a1] shadow-md tracking-wide"
                            >
                                🛒 Completar mi Compra Ahora
                            </Button>
                            <Text className="text-gray-400 text-xs mt-3 m-0">
                                Haz clic en el botón para volver a tu carrito y completar tu pago en segundos.
                            </Text>
                        </Section>

                        {/* Trust & Guarantee Section */}
                        <Section className="px-8 py-6 bg-gray-50/60 border-t border-gray-100">
                            <Row className="text-center">
                                <Column className="w-1/3 px-2">
                                    <Text className="text-base m-0 mb-1">🚚</Text>
                                    <Text className="text-gray-800 font-semibold text-xs m-0">Envíos a todo el país</Text>
                                    <Text className="text-gray-500 text-[10px] m-0">Rápidos y seguros</Text>
                                </Column>
                                <Column className="w-1/3 px-2">
                                    <Text className="text-base m-0 mb-1">🔒</Text>
                                    <Text className="text-gray-800 font-semibold text-xs m-0">Pago Seguro</Text>
                                    <Text className="text-gray-500 text-[10px] m-0">Wompi, PSE, Tarjetas</Text>
                                </Column>
                                <Column className="w-1/3 px-2">
                                    <Text className="text-base m-0 mb-1">💬</Text>
                                    <Text className="text-gray-800 font-semibold text-xs m-0">Asesoría Directa</Text>
                                    <Text className="text-gray-500 text-[10px] m-0">Atención WhatsApp</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Support WhatsApp Contact */}
                        <Section className="px-8 py-5 bg-[#e0f2fe]/40 border-t border-[#bae6fd]/50 text-center">
                            <Text className="text-gray-700 text-xs m-0 mb-2">
                                ¿Tienes preguntas sobre el tipo de tela, metraje o formas de pago?
                            </Text>
                            <Button
                                href="https://wa.me/573159021516?text=Hola,%20tengo%20dudas%20sobre%20mi%20carrito%20de%20compras"
                                className="bg-[#25D366] text-white px-5 py-2 rounded-lg font-semibold text-xs no-underline inline-block hover:bg-[#20bd5a]"
                            >
                                💬 Hablar con un Asesor por WhatsApp
                            </Button>
                        </Section>

                        {/* Footer & Signature */}
                        <Section className="text-center px-8 pt-8 pb-6 bg-white border-t border-gray-100">
                            <Text className="text-gray-500 text-xs m-0 mb-2">
                                Telas Real — Pasión por la calidad textil en Colombia.
                            </Text>
                            <Text className="text-gray-400 text-xs m-0 mb-4">
                                ¿Dudas o comentarios? Escríbenos a{" "}
                                <Link href="mailto:tiendavirtual@telasreal.com" className="text-[#0284c7] underline">
                                    tiendavirtual@telasreal.com
                                </Link>
                            </Text>
                            <Text className="text-gray-400 text-xs m-0 mb-2">
                                © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
                            </Text>
                            <Text className="text-gray-500 text-xs m-0">
                                <Link 
                                    href="https://www.kytcode.lat" 
                                    target="_blank" 
                                    className="text-gray-700 hover:text-black font-medium no-underline"
                                >
                                    Desarrollado por K&T <span style={{ color: "#000" }}>🖤</span>
                                </Link>
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default AbandonedCartEmail;
