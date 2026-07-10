import { NextResponse } from "next/server";
import { Resend } from "resend";
import B2bEmailTemplate from "@/components/emails/b2b-template";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      nombre,
      cargo,
      empresa,
      nit,
      correo,
      telefono,
      ciudad,
      intereses,
      volumen,
      necesidad,
    } = data;

    if (!nombre || !empresa || !correo || !telefono || !necesidad) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // TODO: Reemplazar el correo de destino "ventas@telasreal.com" por los correos definitivos indicados por el usuario
    const destinatarios = ["ventas@telasreal.com", "tiendavirtual@telasreal.com"];

    const { data: emailData, error } = await resend.emails.send({
      from: "Telas Real B2B <info@telasreal.com>",
      to: destinatarios,
      subject: `Nueva Solicitud B2B - ${empresa}`,
      react: B2bEmailTemplate({
        nombre,
        cargo,
        empresa,
        nit,
        correo,
        telefono,
        ciudad,
        intereses,
        volumen,
        necesidad,
      }),
    });

    if (error) {
      console.error("Resend error (B2B):", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: emailData }, { status: 200 });
  } catch (error) {
    console.error("API error (B2B):", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
