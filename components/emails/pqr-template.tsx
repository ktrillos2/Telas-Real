import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface PqrEvidenciaItem {
  name: string;
  url: string;
  size?: string;
  type?: "image" | "video" | "document" | string;
}

interface PqrEmailTemplateProps {
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  celular: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
  evidencias?: PqrEvidenciaItem[];
}

export const PqrEmailTemplate = ({
  nombre,
  apellido,
  documento,
  correo,
  celular,
  asunto,
  mensaje,
  fechaEnvio,
  evidencias = [],
}: PqrEmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Nuevo PQR de {nombre} {apellido}: {asunto}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={heading}>Nuevo PQR Recibido</Heading>
          <Text style={subheading}>
            Se ha registrado una nueva Petición, Queja, Reclamo o Sugerencia en el sitio web de Telas Real.
          </Text>
        </Section>
        
        <Section style={detailsContainer}>
          <Hr style={hr} />
          
          <Text style={text}>
            <strong style={strong}>Nombre Completo:</strong> {nombre} {apellido}
          </Text>
          <Text style={text}>
            <strong style={strong}>Documento:</strong> {documento}
          </Text>
          <Text style={text}>
            <strong style={strong}>Correo Electrónico:</strong> {correo}
          </Text>
          <Text style={text}>
            <strong style={strong}>Celular:</strong> {celular}
          </Text>
          <Text style={text}>
            <strong style={strong}>Fecha de Envío:</strong> {fechaEnvio}
          </Text>
          
          <Hr style={hr} />
          
          <Text style={text}>
            <strong style={strong}>Asunto:</strong> {asunto}
          </Text>
          <Text style={text}>
            <strong style={strong}>Mensaje:</strong>
          </Text>
          <div style={messageBox}>
            <Text style={{ ...text, whiteSpace: "pre-wrap" }}>{mensaje}</Text>
          </div>
          
          {evidencias && evidencias.length > 0 && (
            <>
              <Hr style={hr} />
              <Text style={text}>
                <strong style={strong}>
                  Evidencias Adjuntas ({evidencias.length} archivo{evidencias.length > 1 ? "s" : ""}):
                </strong>
              </Text>
              <div style={{ marginTop: "12px" }}>
                {evidencias.map((item, idx) => {
                  const typeLabel =
                    item.type === "video"
                      ? "🎥 Video"
                      : item.type === "image"
                      ? "🖼️ Imagen"
                      : "📄 Documento";
                  return (
                    <div key={idx} style={evidenceCard}>
                      <div style={{ flex: 1 }}>
                        <Text style={{ ...text, margin: 0, fontWeight: "600", fontSize: "14px" }}>
                          {typeLabel}: {item.name}
                        </Text>
                        {item.size && (
                          <Text style={{ ...text, margin: "2px 0 0", fontSize: "12px", color: "#71717A" }}>
                            Tamaño: {item.size}
                          </Text>
                        )}
                      </div>
                      {item.url && (
                        <Link
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={downloadBtn}
                        >
                          Ver / Descargar
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Hr style={hr} />
          
          <Text style={{ ...text, fontSize: "13px", color: "#666" }}>
            <em>* Las evidencias (fotos, videos o PDFs) han sido alojadas de forma segura y pueden consultarse directamente mediante los enlaces superiores o en los archivos adjuntos a este correo (si aplican).</em>
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            Este mensaje fue enviado desde el formulario de PQR de Telas Real.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "5px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const header = {
  padding: "0 48px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 0 0",
};

const subheading = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#71717A",
};

const detailsContainer = {
  padding: "0 48px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "10px",
  marginTop: "0",
};

const strong = {
  fontWeight: "600",
  color: "#111",
};

const messageBox = {
  backgroundColor: "#f9f9fa",
  padding: "16px",
  borderRadius: "4px",
  border: "1px solid #e6ebf1",
  marginTop: "8px",
};

const footer = {
  padding: "0 48px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};

const evidenceCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  padding: "10px 14px",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const downloadBtn = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "6px 12px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "500",
  textDecoration: "none",
  display: "inline-block",
};

export default PqrEmailTemplate;
