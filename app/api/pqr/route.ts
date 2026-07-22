import { NextResponse } from "next/server";
import { Resend } from "resend";
import PqrEmailTemplate from "@/components/emails/pqr-template";
import { client } from "@/sanity/lib/client";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const documento = formData.get("documento") as string;
    const correo = formData.get("correo") as string;
    const celular = formData.get("celular") as string;
    const asunto = formData.get("asunto") as string;
    const mensaje = formData.get("mensaje") as string;
    const fechaEnvio = formData.get("fechaEnvio") as string;
    
    const evidencia = formData.get("evidencia") as File | null;

    if (!nombre || !apellido || !documento || !correo || !celular || !asunto || !mensaje) {
      return NextResponse.json({ error: "Todos los campos obligatorios deben llenarse" }, { status: 400 });
    }

    let sanityEvidenciaAsset = undefined;
    let resendAttachments: any[] = [];

    // Manejar el archivo adjunto si existe
    if (evidencia && evidencia.size > 0) {
      const arrayBuffer = await evidencia.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        // Subir a Sanity
        const asset = await client.assets.upload('file', buffer, {
          filename: evidencia.name,
          contentType: evidencia.type
        });
        
        sanityEvidenciaAsset = {
          _type: 'file',
          asset: {
            _type: "reference",
            _ref: asset._id
          }
        };

        // Adjuntar a Resend
        resendAttachments.push({
          filename: evidencia.name,
          content: buffer
        });
      } catch (uploadError) {
        console.error("Error subiendo archivo:", uploadError);
        // Continuamos aunque falle el archivo, o podríamos lanzar error.
      }
    }

    // Guardar en Sanity
    const sanityData: any = {
      _type: 'pqr',
      nombre,
      apellido,
      documento,
      correo,
      celular,
      asunto,
      mensaje,
      fechaEnvio: fechaEnvio || new Date().toISOString()
    };
    
    if (sanityEvidenciaAsset) {
      sanityData.evidencia = sanityEvidenciaAsset;
    }
    
    await client.create(sanityData);

    // Enviar correo
    const { data: emailData, error } = await resend.emails.send({
      from: "Telas Real <info@telasreal.com>",
      to: ["sac@telasreal.com"],
      subject: `PQR: ${asunto} - ${nombre} ${apellido}`,
      attachments: resendAttachments,
      react: PqrEmailTemplate({
        nombre,
        apellido,
        documento,
        correo,
        celular,
        asunto,
        mensaje,
        fechaEnvio,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: emailData }, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
