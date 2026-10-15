import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nombre = formData.get("nombre")?.toString().trim();
    const ciudad = formData.get("ciudad")?.toString().trim();
    const telefono = formData.get("telefono")?.toString().trim();
    const correo = formData.get("correo")?.toString().trim();
    const cargo = formData.get("cargo")?.toString().trim() || "Postulación General";
    const mensaje = formData.get("mensaje")?.toString().trim();
    const autorizacion = formData.get("autorizacionDatos") === "true";
    const file = formData.get("hojaVida") as File | null;

    if (!nombre || !ciudad || !telefono || !correo || !mensaje) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser diligenciados." },
        { status: 400 }
      );
    }

    if (!autorizacion) {
      return NextResponse.json(
        { error: "Debes autorizar el tratamiento de tus datos personales conforme a nuestra Política de Privacidad." },
        { status: 400 }
      );
    }

    // Preparar archivo adjunto si fue suministrado
    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      attachments.push({
        filename: file.name || "hoja_de_vida.pdf",
        content: buffer,
      });
    }

    const recipientEmail = "recursoshumanos@telasreal.com";
    const fromAddress = "Telas Real <info@telasreal.com>";

    const emailHtmlAdmin = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; }
            .header { background: #00707B; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 24px; }
            .field { margin-bottom: 16px; }
            .label { font-weight: bold; color: #4A5568; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { font-size: 15px; color: #1A202C; margin-top: 4px; }
            .badge { display: inline-block; background: #E6FFFA; color: #234E52; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
            .footer { font-size: 12px; color: #718096; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; font-size: 20px;">Nueva Postulación de Empleo</h2>
              <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Telas Real — Haz parte de nuestro equipo</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Cargo al que aplica:</div>
                <div class="value"><span class="badge">${cargo}</span></div>
              </div>
              <div class="field">
                <div class="label">Nombre completo:</div>
                <div class="value">${nombre}</div>
              </div>
              <div class="field">
                <div class="label">Ciudad de residencia:</div>
                <div class="value">${ciudad}</div>
              </div>
              <div class="field">
                <div class="label">Teléfono / WhatsApp:</div>
                <div class="value"><a href="tel:${telefono}">${telefono}</a></div>
              </div>
              <div class="field">
                <div class="label">Correo electrónico:</div>
                <div class="value"><a href="mailto:${correo}">${correo}</a></div>
              </div>
              <div class="field">
                <div class="label">¿Por qué su perfil puede aportar a Telas Real?</div>
                <div class="value" style="background: #F7FAFC; padding: 14px; border-radius: 8px; border-left: 3px solid #00707B; white-space: pre-wrap;">${mensaje}</div>
              </div>
              <div class="field">
                <div class="label">Hoja de Vida:</div>
                <div class="value">${file && file.size > 0 ? `Adjunta en el correo (${file.name})` : "No adjuntó archivo"}</div>
              </div>
              <div class="field">
                <div class="label">Autorización de datos personales:</div>
                <div class="value" style="color: #2F855A;">✓ Autorizado conforme a la Política de Privacidad</div>
              </div>
            </div>
            <div class="footer">
              Este correo fue enviado automáticamente desde el formulario de empleo en <a href="https://www.telasreal.com/trabaja-con-nosotros">www.telasreal.com/trabaja-con-nosotros</a>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailHtmlCandidate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; }
            .header { background: #00707B; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 24px; }
            .footer { font-size: 12px; color: #718096; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px; }
            .highlight { background: #F0FDFA; border-left: 4px solid #00707B; padding: 16px; border-radius: 6px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">¡Gracias por postularte a Telas Real!</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>Hemos recibido exitosamente tu postulación para el cargo de <strong>${cargo}</strong>.</p>
              
              <div class="highlight">
                <p style="margin: 0; font-size: 14px; color: #234E52;">
                  <strong>Importante:</strong> En Telas Real creemos que el talento humano es el motor de nuestro crecimiento. Nuestro equipo de Recursos Humanos revisará tu perfil con atención. Ten en cuenta que el envío de la hoja de vida no garantiza la vinculación laboral, y contactaremos únicamente a las personas que continúen a las siguientes etapas del proceso de selección.
                </p>
              </div>

              <p>Si deseas conocer más sobre nuestra empresa, productos y sedes, te invitamos a visitar <a href="https://www.telasreal.com">www.telasreal.com</a>.</p>
              
              <p style="margin-top: 24px;">Atentamente,<br><strong>Equipo de Talento Humano — Telas Real S.A.S.</strong></p>
            </div>
            <div class="footer">
              Telas Real S.A.S. • Cl. 12 # 38-65, Bogotá, Colombia • recursoshumanos@telasreal.com
            </div>
          </div>
        </body>
      </html>
    `;

    // 1. Enviar notificación al equipo de Recursos Humanos
    await resend.emails.send({
      from: fromAddress,
      to: [recipientEmail],
      replyTo: correo,
      subject: `Nueva postulación: ${cargo} — ${nombre} (${ciudad})`,
      html: emailHtmlAdmin,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // 2. Enviar confirmación al candidato
    if (correo && correo.includes("@")) {
      try {
        await resend.emails.send({
          from: fromAddress,
          to: [correo],
          subject: `Hemos recibido tu postulación a Telas Real — ${cargo}`,
          html: emailHtmlCandidate,
        });
      } catch (clientErr) {
        console.warn("[Trabaja Con Nosotros] Aviso enviando confirmación al candidato:", clientErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tu postulación ha sido enviada exitosamente. Gracias por tu interés en hacer parte de Telas Real.",
    });
  } catch (error: any) {
    console.error("[Trabaja Con Nosotros] Error procesando postulación:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar tu postulación. Por favor intenta nuevamente o escribe a recursoshumanos@telasreal.com" },
      { status: 500 }
    );
  }
}
