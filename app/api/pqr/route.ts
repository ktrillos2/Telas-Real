import { NextResponse } from "next/server";
import { Resend } from "resend";
import PqrEmailTemplate from "@/components/emails/pqr-template";
import { client } from "@/sanity/lib/client";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { nombre, apellido, documento, correo, pais, celular, asunto, mensaje, fechaEnvio } = data;

    if (!nombre || !apellido || !documento || !correo || !pais || !celular || !asunto || !mensaje) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Guardar en Sanity
    const sanityData = {
      _type: 'pqr',
      nombre,
      apellido,
      documento,
      correo,
      pais,
      celular,
      asunto,
      mensaje,
      fechaEnvio: fechaEnvio || new Date().toISOString()
    };
    
    await client.create(sanityData);

    // Enviar correo
    const { data: emailData, error } = await resend.emails.send({
      from: "Telas Real <info@telasreal.com>",
      to: ["sac@telasreal.com"],
      subject: `PQR: ${asunto} - ${nombre} ${apellido}`,
      react: PqrEmailTemplate({
        nombre,
        apellido,
        documento,
        correo,
        pais,
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
