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
    logoUrl?: string;
    supportPhone?: string;
}

export const AbandonedCartEmail = ({
    customerName = "Cliente",
    items = [],
    subtotal,
    total,
    recoveryUrl = "https://www.telasreal.com/carrito",
    orderId,
    logoUrl = "https://www.telasreal.com/images/design-mode/image.png",
    supportPhone = "573159021516",
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
                <Preview>{`¡${firstName}, las telas de tu carrito siguen disponibles en Telas Real!`}</Preview>
                <Body style={{ backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', margin: '0', padding: '32px 12px' }}>
                    <Container style={{ maxWidth: '580px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                        {/* Top Accent Line */}
                        <div style={{ height: '3px', width: '100%', backgroundColor: '#0284c7' }} />

                        {/* Header with Sanity Web Logo */}
                        <Section style={{ textAlign: 'center', padding: '32px 24px 20px 24px' }}>
                            {logoUrl ? (
                                <Img
                                    src={logoUrl}
                                    alt="Telas Real"
                                    width={160}
                                    height={48}
                                    style={{ margin: '0 auto', display: 'block', maxHeight: '48px', width: 'auto', objectFit: 'contain' }}
                                />
                            ) : (
                                <Heading style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.15em', color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>
                                    TELAS REAL
                                </Heading>
                            )}
                            <Text style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '6px', margin: '6px 0 0 0', fontWeight: 500 }}>
                                Tienda Textil Online
                            </Text>
                        </Section>

                        {/* Main Message Banner */}
                        <Section style={{ padding: '24px 32px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                            <div style={{ display: 'inline-block', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '11px', fontWeight: 600, padding: '3px 12px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
                                Carrito Guardado
                            </div>

                            <Heading style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                                ¡Hola {firstName}! Las telas de tu carrito siguen reservadas
                            </Heading>

                            <Text style={{ fontSize: '13px', color: '#475569', margin: '0 auto', maxWidth: '440px', lineHeight: 1.6 }}>
                                Notamos que no completaste tu pedido. Hemos guardado los metros y telas seleccionadas para que puedas finalizar tu compra con tranquilidad.
                            </Text>
                        </Section>

                        {/* Order Reference Tag if present */}
                        {orderId && (
                            <Section style={{ padding: '8px 32px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <Text style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                    Referencia de selección: <strong style={{ color: '#0f172a', fontWeight: 600 }}>#{orderId}</strong>
                                </Text>
                            </Section>
                        )}

                        {/* Products List Table */}
                        <Section style={{ padding: '24px 32px 16px 32px' }}>
                            <Text style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 16px 0' }}>
                                Resumen de tus telas:
                            </Text>

                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <tbody>
                                    {items.map((item, index) => {
                                        const itemPrice = typeof item.price === "number"
                                            ? `$${item.price.toLocaleString("es-CO")}`
                                            : item.price;

                                        return (
                                            <tr key={index} style={{ borderBottom: index === items.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px 0', width: '56px', verticalAlign: 'middle' }}>
                                                    {item.image ? (
                                                        <Img
                                                            src={item.image}
                                                            width={48}
                                                            height={48}
                                                            alt={item.name}
                                                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', display: 'block' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                                                            TELA
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                                    <Text style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0', lineHeight: 1.3 }}>
                                                        {item.name}
                                                    </Text>
                                                    {item.designName && (
                                                        <Text style={{ fontSize: '11px', color: '#0284c7', fontWeight: 500, margin: '0 0 2px 0' }}>
                                                            Diseño: {item.designName}
                                                        </Text>
                                                    )}
                                                    <Text style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                                        Cantidad: <strong style={{ color: '#334155' }}>{item.quantity} metro(s)</strong>
                                                    </Text>
                                                </td>
                                                <td style={{ padding: '10px 0', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    <Text style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                                        {itemPrice}
                                                    </Text>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Section>

                        {/* Pricing Summary */}
                        <Section style={{ padding: '16px 32px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                            <Row style={{ marginBottom: '6px' }}>
                                <Column>
                                    <Text style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Subtotal estimado</Text>
                                </Column>
                                <Column align="right">
                                    <Text style={{ fontSize: '12px', color: '#0f172a', fontWeight: 500, margin: 0 }}>{formattedSubtotal}</Text>
                                </Column>
                            </Row>
                            <Hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                            <Row>
                                <Column>
                                    <Text style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Total de productos</Text>
                                </Column>
                                <Column align="right">
                                    <Text style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7', margin: 0 }}>{formattedTotal}</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Clean Minimalist CTA Button */}
                        <Section style={{ padding: '28px 32px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                            <Button
                                href={recoveryUrl}
                                style={{
                                    backgroundColor: '#0284c7',
                                    color: '#ffffff',
                                    padding: '12px 32px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                    letterSpacing: '0.02em',
                                    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                                }}
                            >
                                Continuar con mi compra →
                            </Button>
                            <Text style={{ fontSize: '11px', color: '#94a3b8', margin: '10px 0 0 0' }}>
                                El enlace te dirigirá directamente a tu carrito con tus telas seleccionadas.
                            </Text>
                        </Section>

                        {/* Minimalist Trust Features (No emojis) */}
                        <Section style={{ padding: '20px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <Row style={{ textAlign: 'center' }}>
                                <Column style={{ width: '33.33%', padding: '0 6px' }}>
                                    <Text style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Envíos Nacionales</Text>
                                    <Text style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Entrega rápida y segura</Text>
                                </Column>
                                <Column style={{ width: '33.33%', padding: '0 6px' }}>
                                    <Text style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Pago 100% Seguro</Text>
                                    <Text style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Wompi, PSE y Tarjetas</Text>
                                </Column>
                                <Column style={{ width: '33.33%', padding: '0 6px' }}>
                                    <Text style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Atención Experta</Text>
                                    <Text style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Asesoría personalizada</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Support WhatsApp Contact Link */}
                        <Section style={{ padding: '16px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <Text style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                ¿Tienes preguntas sobre el tejido, metros o formas de pago?{" "}
                                <Link 
                                    href={`https://wa.me/${(supportPhone || "573159021516").replace(/\D/g, '')}?text=Hola,%20tengo%20dudas%20sobre%20mi%20carrito%20de%20compras`} 
                                    style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}
                                >
                                    Escríbenos por WhatsApp →
                                </Link>
                            </Text>
                        </Section>

                        {/* Footer & Required Branding */}
                        <Section style={{ textAlign: 'center', padding: '24px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <Text style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px 0' }}>
                                Telas Real — Calidad textil para tus proyectos.
                            </Text>
                            <Text style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>
                                © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
                            </Text>
                            <Text style={{ fontSize: '11px', color: '#475569', margin: 0 }}>
                                <Link 
                                    href="https://www.kytcode.lat" 
                                    target="_blank" 
                                    style={{ color: '#334155', textDecoration: 'none', fontWeight: 500 }}
                                >
                                    Desarrollado por K&T <span style={{ color: "#000000" }}>♥</span>
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
