import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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
  radicado?: string;
  tipo?: string;
  tienda?: string;
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
  radicado,
  tipo,
  tienda,
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
    <Preview>{radicado ? `[Radicado ${radicado}] ` : ""}Nuevo PQR de {nombre} {apellido}: {asunto}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={heading}>Nuevo PQR Recibido</Heading>
          <Text style={subheading}>
            Se ha registrado una nueva Petición, Queja, Reclamo, Sugerencia o Felicitación en el sitio web de Telas Real.
          </Text>

          {radicado && (
            <div style={radicadoBox}>
              <Text style={radicadoSub}>NÚMERO DE RADICADO / CASO</Text>
              <Text style={radicadoVal}>{radicado}</Text>
            </div>
          )}
        </Section>
        
        <Section style={detailsContainer}>
          <Hr style={hr} />
          
          {tipo && (
            <Text style={text}>
              <strong style={strong}>Tipo de Solicitud:</strong> {tipo}
            </Text>
          )}
          {tienda && (
            <Text style={text}>
              <strong style={strong}>Tienda / Canal de Atención:</strong> {tienda}
            </Text>
          )}
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
            <Text style={{ ...text, whiteSpace: "pre-wrap", margin: 0 }}>{mensaje}</Text>
          </div>
          
          {evidencias && evidencias.length > 0 && (
            <>
              <Hr style={hr} />
              <Text style={{ ...text, fontSize: "17px", marginBottom: "14px" }}>
                <strong style={strong}>
                  📎 Evidencias Adjuntas ({evidencias.length} archivo{evidencias.length > 1 ? "s" : ""}):
                </strong>
              </Text>
              
              <div style={{ marginTop: "12px" }}>
                {evidencias.map((item, idx) => {
                  const isImage = item.type === "image";
                  const isVideo = item.type === "video";

                  return (
                    <div key={idx} style={evidenceCard}>
                      {/* Cabecera de la evidencia */}
                      <div style={evidenceHeader}>
                        <div>
                          <Text style={{ ...text, margin: 0, fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                            {isVideo ? "🎥 Video Adjunto" : isImage ? "🖼️ Foto / Imagen" : "📄 Documento PDF"}: {item.name}
                          </Text>
                          {item.size && (
                            <Text style={{ ...text, margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                              Tamaño: {item.size}
                            </Text>
                          )}
                        </div>

                        {item.url && (
                          <Link
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            style={isVideo ? videoBtn : isImage ? imageBtn : downloadBtn}
                          >
                            {isVideo ? "▶ Ver Video en HD" : isImage ? "🔍 Ver Foto Completa" : "📥 Descargar PDF"}
                          </Link>
                        )}
                      </div>

                      {/* Visualización embebida para fotos */}
                      {isImage && item.url && (
                        <div style={imageWrapper}>
                          <a href={item.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                            <Img
                              src={item.url}
                              alt={item.name}
                              width="520"
                              style={previewImageStyle}
                            />
                          </a>
                          <Text style={clickToEnlargeText}>
                            (Haz clic en la imagen para abrirla en alta resolución)
                          </Text>
                        </div>
                      )}

                      {/* Tarjeta interactiva para videos */}
                      {isVideo && item.url && (
                        <div style={videoWrapper}>
                          <div style={videoPlayerPlaceholder}>
                            <Text style={{ color: "#ffffff", fontSize: "14px", fontWeight: "600", margin: "0 0 6px" }}>
                              🎬 Archivo de Video MP4 / MOV Listo para Reproducir
                            </Text>
                            <Text style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 12px" }}>
                              Alojado de forma permanente en Sanity CDN
                            </Text>
                            <Link
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              style={videoPlayLargeBtn}
                            >
                              ▶ Reproducir Video en el Navegador
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Hr style={hr} />
          
          <Text style={{ ...text, fontSize: "12px", color: "#64748b" }}>
            <em>* Todas las fotos y videos están respaldados en los servidores de Sanity CDN y disponibles para consulta en cualquier momento.</em>
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
          </Text>
          <Text style={{ ...footerText, marginTop: "6px" }}>
            <Link href="https://www.kytcode.lat" target="_blank" rel="noreferrer" style={kytLink}>
              Desarrollado por K&T <span style={{ color: "#000000" }}>♥</span>
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: "#f1f5f9",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "24px 0 40px",
  marginBottom: "48px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
  maxWidth: "600px",
};

const header = {
  padding: "0 40px",
};

const heading = {
  fontSize: "22px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "600",
  color: "#0f172a",
  padding: "12px 0 0",
};

const subheading = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#64748b",
};

const radicadoBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "12px 16px",
  marginTop: "16px",
  textAlign: "center" as const,
};

const radicadoSub = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  color: "#64748b",
  margin: "0 0 4px 0",
};

const radicadoVal = {
  fontSize: "20px",
  fontWeight: "800",
  letterSpacing: "1px",
  color: "#0f172a",
  margin: "0",
  fontFamily: "monospace, monospace",
};

const detailsContainer = {
  padding: "0 40px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const text = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  marginBottom: "8px",
  marginTop: "0",
};

const strong = {
  fontWeight: "600",
  color: "#0f172a",
};

const messageBox = {
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
  marginTop: "6px",
};

const footer = {
  padding: "20px 40px 0",
  textAlign: "center" as const,
};

const footerText = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0",
};

const kytLink = {
  color: "#64748b",
  textDecoration: "none",
  fontWeight: "500",
};

const evidenceCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "14px",
  marginBottom: "14px",
};

const evidenceHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const imageWrapper = {
  marginTop: "12px",
  textAlign: "center" as const,
};

const previewImageStyle = {
  maxWidth: "100%",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  display: "block",
  margin: "0 auto",
  objectFit: "cover" as const,
  maxHeight: "360px",
};

const clickToEnlargeText = {
  fontSize: "11px",
  color: "#94a3b8",
  margin: "6px 0 0",
  fontStyle: "italic",
};

const videoWrapper = {
  marginTop: "12px",
};

const videoPlayerPlaceholder = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  padding: "20px",
  textAlign: "center" as const,
};

const videoPlayLargeBtn = {
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  padding: "8px 18px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
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
  whiteSpace: "nowrap" as const,
};

const imageBtn = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  padding: "6px 12px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "500",
  textDecoration: "none",
  display: "inline-block",
  whiteSpace: "nowrap" as const,
};

const videoBtn = {
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  padding: "6px 12px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "500",
  textDecoration: "none",
  display: "inline-block",
  whiteSpace: "nowrap" as const,
};

export default PqrEmailTemplate;
