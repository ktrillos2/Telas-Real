import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PqrEmailTemplateProps {
  nombre: string;
  apellido: string;
  correo: string;
  pais: string;
  celular: string;
  asunto: string;
  mensaje: string;
}

export const PqrEmailTemplate = ({
  nombre,
  apellido,
  correo,
  pais,
  celular,
  asunto,
  mensaje,
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
            <strong style={strong}>Correo Electrónico:</strong> {correo}
          </Text>
          <Text style={text}>
            <strong style={strong}>Celular:</strong> {celular}
          </Text>
          <Text style={text}>
            <strong style={strong}>País:</strong> {pais}
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
          
          <Hr style={hr} />
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

export default PqrEmailTemplate;
