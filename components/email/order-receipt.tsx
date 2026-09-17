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

export interface OrderReceiptItem {
    name: string;
    quantity: number;
    price: string;
    image?: string;
    designName?: string;
    isCustom?: boolean;
    customDesignUrl?: string;
}

export interface OrderReceiptEmailProps {
    orderId: string | number;
    orderDate: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    items: OrderReceiptItem[];
    subtotal: string;
    shippingCost?: string;
    total: string;
    shippingAddress: string;
    shippingCity?: string;
    shippingDepartment?: string;
    status: string;
    paymentMethod: string;
    paymentMethodTitle?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    message?: string;
    logoUrl?: string;
    supportPhone?: string;
}

export const OrderReceiptEmail = ({
    orderId,
    orderDate,
    customerName = "Cliente",
    customerEmail,
    customerPhone,
    items = [],
    subtotal,
    shippingCost,
    total,
    shippingAddress,
    shippingCity,
    shippingDepartment,
    status = "processing",
    paymentMethod = "wompi",
    paymentMethodTitle,
    carrier = "Coordinadora Mercantil",
    trackingNumber,
    trackingUrl,
    message,
    logoUrl = "https://www.telasreal.com/images/design-mode/image.png",
    supportPhone = "573159021516",
}: OrderReceiptEmailProps) => {
    const formattedDate = new Date(orderDate || Date.now()).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const firstName = customerName ? customerName.trim().split(" ")[0] : "Cliente";
    const cleanOrderId = String(orderId || "N/A").replace(/^drafts\./, "");
    const cleanPhone = (customerPhone || "").replace(/\D/g, "");

    // Determinación visual según método de pago y estado
    const isCod = paymentMethod === "cod";
    const isApproved = status === "processing" || status === "paid";
    const isShipped = status === "shipped" || status === "completed";
    const isPending = status === "pending";
    const isCancelled = status === "cancelled" || status === "failed";

    let accentColor = "#059669"; // Verde esmeralda por defecto
    let badgeText = "✓ PAGO APROBADO";
    let badgeBg = "#ecfdf5";
    let badgeBorder = "#a7f3d0";
    let badgeColor = "#065f46";
    let title = `¡Gracias por tu compra, ${firstName}!`;
    let subtitle = "Hemos recibido tu pago con éxito a través de Wompi. Tu orden ha sido confirmada y ya estamos preparando tus telas para despacho.";

    if (isCod) {
        accentColor = "#d97706";
        badgeText = "✓ PEDIDO CONTRAENTREGA CONFIRMADO";
        badgeBg = "#fffbeb";
        badgeBorder = "#fde68a";
        badgeColor = "#92400e";
        title = `¡Pedido #${cleanOrderId} Recibido!`;
        subtitle = "Tu pedido contraentrega ha sido registrado exitosamente. Recuerda tener el valor exacto en efectivo al momento de la entrega.";
    } else if (isShipped) {
        accentColor = "#2563eb";
        badgeText = "🚚 PEDIDO EN CAMINO";
        badgeBg = "#eff6ff";
        badgeBorder = "#bfdbfe";
        badgeColor = "#1e40af";
        title = `¡Tu pedido #${cleanOrderId} va en camino!`;
        subtitle = `Tu paquete ha sido despachado con la transportadora ${carrier}. En breve podrás recibirlo en tu dirección registrada.`;
    } else if (isPending) {
        accentColor = "#d97706";
        badgeText = "⏳ PAGO PENDIENTE";
        badgeBg = "#fffbeb";
        badgeBorder = "#fde68a";
        badgeColor = "#92400e";
        title = `Pedido #${cleanOrderId} Reservado`;
        subtitle = "Tu pedido ha sido creado y tus telas están reservadas. Completa el pago para iniciar la preparación.";
    } else if (isCancelled) {
        accentColor = "#dc2626";
        badgeText = "✕ PEDIDO CANCELADO";
        badgeBg = "#fef2f2";
        badgeBorder = "#fecaca";
        badgeColor = "#991b1b";
        title = `Pedido #${cleanOrderId} Cancelado`;
        subtitle = "Este pedido ha sido cancelado. Si consideras que se trata de un error, contáctanos de inmediato para asistirte.";
    }

    if (message) {
        subtitle = message;
    }

    const readablePaymentMethod = paymentMethodTitle || (isCod ? "Pago Contraentrega en Efectivo" : "Wompi (Bancolombia, Tarjeta, PSE, Nequi)");

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>{`${badgeText} - Telas Real - Pedido #${cleanOrderId}`}</Preview>
                <Body style={{ backgroundColor: "#f1f5f9", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', margin: 0, padding: "32px 12px" }}>
                    <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)" }}>

                        {/* Top Accent Color Bar */}
                        <div style={{ height: "5px", width: "100%", backgroundColor: accentColor }} />

                        {/* 1. Header con Logo Oficial de la Web */}
                        <Section style={{ padding: "36px 32px 24px 32px", textAlign: "center", backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
                            <Link href="https://www.telasreal.com" target="_blank" style={{ textDecoration: "none", display: "inline-block" }}>
                                <Img
                                    src={logoUrl}
                                    alt="Telas Real"
                                    width={190}
                                    height={56}
                                    style={{ margin: "0 auto", display: "block", maxHeight: "56px", width: "auto", objectFit: "contain" }}
                                />
                            </Link>
                            <Text style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", margin: "10px 0 0 0", fontWeight: 600 }}>
                                Tienda Textil Online • Telas por Metro y Mayorista
                            </Text>
                        </Section>

                        {/* 2. Hero con Estado del Pedido */}
                        <Section style={{ padding: "32px 32px 28px 32px", textAlign: "center", backgroundColor: "#ffffff" }}>
                            <div style={{ display: "inline-block", backgroundColor: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, fontSize: "11px", fontWeight: 700, padding: "5px 14px", borderRadius: "999px", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>
                                {badgeText}
                            </div>

                            <Heading style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0", lineHeight: 1.3 }}>
                                {title}
                            </Heading>

                            <Text style={{ fontSize: "14px", color: "#475569", margin: "0 auto", maxWidth: "480px", lineHeight: 1.6 }}>
                                {subtitle}
                            </Text>
                        </Section>

                        {/* 3. Ficha Resumen de Pedido (Grid 2x2 elegante) */}
                        <Section style={{ padding: "0 32px 24px 32px" }}>
                            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
                                <Row>
                                    <Column style={{ width: "50%", padding: "6px 8px" }}>
                                        <Text style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", margin: "0 0 2px 0" }}>
                                            No. de Pedido
                                        </Text>
                                        <Text style={{ fontSize: "15px", color: "#0f172a", fontWeight: 800, margin: 0 }}>
                                            #{cleanOrderId}
                                        </Text>
                                    </Column>
                                    <Column style={{ width: "50%", padding: "6px 8px" }}>
                                        <Text style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", margin: "0 0 2px 0" }}>
                                            Fecha de Compra
                                        </Text>
                                        <Text style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, margin: 0 }}>
                                            {formattedDate}
                                        </Text>
                                    </Column>
                                </Row>
                                <Row style={{ marginTop: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                                    <Column style={{ width: "50%", padding: "6px 8px" }}>
                                        <Text style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", margin: "0 0 2px 0" }}>
                                            Método de Pago
                                        </Text>
                                        <Text style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, margin: 0 }}>
                                            {readablePaymentMethod}
                                        </Text>
                                    </Column>
                                    <Column style={{ width: "50%", padding: "6px 8px" }}>
                                        <Text style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", margin: "0 0 2px 0" }}>
                                            Estado de Orden
                                        </Text>
                                        <Text style={{ fontSize: "13px", color: accentColor, fontWeight: 700, margin: 0 }}>
                                            {isApproved ? "Aprobado / En Preparación" : (isCod ? "Confirmado (Contraentrega)" : status.toUpperCase())}
                                        </Text>
                                    </Column>
                                </Row>
                            </div>
                        </Section>

                        {/* 4. Lista Detallada de Telas y Productos */}
                        <Section style={{ padding: "0 32px 24px 32px" }}>
                            <Text style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155", margin: "0 0 14px 0", borderBottom: "2px solid #0f172a", paddingBottom: "6px", display: "inline-block" }}>
                                Detalle de Telas Seleccionadas
                            </Text>

                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            {/* Imagen de la tela */}
                                            <td style={{ padding: "14px 0", verticalAlign: "top", width: "58px" }}>
                                                {item.image ? (
                                                    <Img
                                                        src={item.image}
                                                        width={52}
                                                        height={52}
                                                        alt={item.name}
                                                        style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
                                                    />
                                                ) : (
                                                    <div style={{ width: "52px", height: "52px", borderRadius: "8px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", textAlign: "center", lineHeight: "52px" }}>
                                                        🧵
                                                    </div>
                                                )}
                                            </td>

                                            {/* Título y especificaciones */}
                                            <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
                                                <Text style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0", lineHeight: 1.4 }}>
                                                    {item.name}
                                                </Text>

                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                                    <span style={{ display: "inline-block", backgroundColor: "#f1f5f9", color: "#475569", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
                                                        Metros / Cant: {item.quantity}
                                                    </span>

                                                    {item.designName && (
                                                        <span style={{ display: "inline-block", backgroundColor: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
                                                            Diseño: {item.designName}
                                                        </span>
                                                    )}

                                                    {item.isCustom && (
                                                        <span style={{ display: "inline-block", backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
                                                            Personalizado {item.customDesignUrl ? "• " : ""}
                                                            {item.customDesignUrl && (
                                                                <Link href={item.customDesignUrl} target="_blank" style={{ color: "#0284c7", textDecoration: "underline", fontWeight: 700 }}>
                                                                    Ver diseño PDF
                                                                </Link>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Precio */}
                                            <td style={{ padding: "14px 0", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                                                <Text style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                                    {item.price}
                                                </Text>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>

                        {/* 5. Liquidación Económica / Totales */}
                        <Section style={{ padding: "0 32px 28px 32px" }}>
                            <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px 22px" }}>
                                <Row style={{ marginBottom: "8px" }}>
                                    <Column style={{ width: "60%" }}>
                                        <Text style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Subtotal de productos</Text>
                                    </Column>
                                    <Column style={{ width: "40%", textAlign: "right" }}>
                                        <Text style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, margin: 0 }}>{subtotal}</Text>
                                    </Column>
                                </Row>

                                <Row style={{ marginBottom: "8px" }}>
                                    <Column style={{ width: "60%" }}>
                                        <Text style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                            Envío ({carrier || "Coordinadora Mercantil"})
                                        </Text>
                                    </Column>
                                    <Column style={{ width: "40%", textAlign: "right" }}>
                                        <Text style={{ fontSize: "13px", color: shippingCost ? "#0f172a" : "#059669", fontWeight: 600, margin: 0 }}>
                                            {shippingCost || "Por liquidar en entrega"}
                                        </Text>
                                    </Column>
                                </Row>

                                <Hr style={{ borderColor: "#e2e8f0", margin: "12px 0" }} />

                                <Row>
                                    <Column style={{ width: "50%" }}>
                                        <Text style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                            Total {isCod ? "a Pagar" : "Pagado"}
                                        </Text>
                                        <Text style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                                            {isCod ? "Cobro contraentrega" : "Impuestos incluidos"}
                                        </Text>
                                    </Column>
                                    <Column style={{ width: "50%", textAlign: "right" }}>
                                        <Text style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                                            {total} <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>COP</span>
                                        </Text>
                                    </Column>
                                </Row>
                            </div>
                        </Section>

                        {/* 6. Dirección de Envío y Datos de Despacho (Dos Columnas) */}
                        <Section style={{ padding: "0 32px 28px 32px" }}>
                            <Row>
                                <Column style={{ width: "50%", verticalAlign: "top", paddingRight: "10px" }}>
                                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", height: "100%" }}>
                                        <Text style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
                                            📍 Dirección de Entrega
                                        </Text>
                                        <Text style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", margin: "0 0 2px 0" }}>
                                            {customerName}
                                        </Text>
                                        <Text style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5, margin: "0 0 4px 0" }}>
                                            {shippingAddress}
                                        </Text>
                                        {shippingCity && (
                                            <Text style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px 0" }}>
                                                {shippingCity}{shippingDepartment ? `, ${shippingDepartment}` : ""}
                                            </Text>
                                        )}
                                        {cleanPhone && (
                                            <Text style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                                Tel: +57 {cleanPhone}
                                            </Text>
                                        )}
                                    </div>
                                </Column>

                                <Column style={{ width: "50%", verticalAlign: "top", paddingLeft: "10px" }}>
                                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", height: "100%" }}>
                                        <Text style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
                                            🚚 Logística y Despacho
                                        </Text>
                                        <Text style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px 0" }}>
                                            <strong>Transportadora:</strong> {carrier}
                                        </Text>
                                        <Text style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px 0" }}>
                                            <strong>Tiempos:</strong> 2 a 4 días hábiles
                                        </Text>
                                        {trackingNumber && (
                                            <Text style={{ fontSize: "12px", color: "#0284c7", margin: "4px 0 0 0", fontWeight: 600 }}>
                                                Guía: {trackingNumber}
                                                {trackingUrl && (
                                                    <Link href={trackingUrl} target="_blank" style={{ marginLeft: "6px", textDecoration: "underline", color: "#0284c7" }}>
                                                        (Rastrear)
                                                    </Link>
                                                )}
                                            </Text>
                                        )}
                                    </div>
                                </Column>
                            </Row>
                        </Section>

                        {/* 7. Botón de Acción Principal */}
                        <Section style={{ padding: "0 32px 32px 32px", textAlign: "center" }}>
                            <Button
                                href={`https://www.telasreal.com/cuenta`}
                                style={{
                                    backgroundColor: "#0f172a",
                                    color: "#ffffff",
                                    padding: "14px 34px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    textDecoration: "none",
                                    display: "inline-block",
                                    letterSpacing: "0.02em",
                                    boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.15)"
                                }}
                            >
                                Ver mi Pedido en Telas Real →
                            </Button>
                        </Section>

                        {/* 8. Barra de Soporte Directo por WhatsApp */}
                        <Section style={{ padding: "18px 24px", backgroundColor: "#f0fdf4", borderTop: "1px solid #bbf7d0", borderBottom: "1px solid #bbf7d0", textAlign: "center" }}>
                            <Text style={{ fontSize: "13px", color: "#166534", margin: 0, fontWeight: 500 }}>
                                💬 ¿Tienes preguntas sobre tus telas o el envío?{" "}
                                <Link
                                    href={`https://wa.me/${(supportPhone || "573159021516").replace(/\D/g, "")}?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20pedido%20%23${cleanOrderId}`}
                                    style={{ color: "#15803d", fontWeight: 700, textDecoration: "underline" }}
                                    target="_blank"
                                >
                                    Escríbenos directamente a WhatsApp
                                </Link>
                            </Text>
                        </Section>

                        {/* 9. Beneficios de Confianza */}
                        <Section style={{ padding: "20px 24px", backgroundColor: "#ffffff" }}>
                            <Row style={{ textAlign: "center" }}>
                                <Column style={{ width: "33.33%", padding: "0 6px" }}>
                                    <Text style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>📦 Envíos Asegurados</Text>
                                    <Text style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>A toda Colombia</Text>
                                </Column>
                                <Column style={{ width: "33.33%", padding: "0 6px" }}>
                                    <Text style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>🧵 Calidad Premium</Text>
                                    <Text style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>Textiles seleccionados</Text>
                                </Column>
                                <Column style={{ width: "33.33%", padding: "0 6px" }}>
                                    <Text style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>🛡️ Compra Segura</Text>
                                    <Text style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>Garantía Telas Real</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* 10. Footer con Firma y Derechos Dinámicos (MANDATORIO) */}
                        <Section style={{ textAlign: "center", padding: "26px 20px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                            <Text style={{ fontSize: "12px", fontWeight: 600, color: "#475569", margin: "0 0 4px 0" }}>
                                Telas Real S.A.S. — Líderes en distribución textil en Colombia
                            </Text>
                            <Text style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                                © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
                            </Text>
                            <Text style={{ fontSize: "11px", color: "#475569", margin: 0 }}>
                                <Link
                                    href="https://www.kytcode.lat"
                                    target="_blank"
                                    style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}
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

export default OrderReceiptEmail;
