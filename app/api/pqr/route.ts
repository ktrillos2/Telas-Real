import { NextResponse } from "next/server";
import { Resend } from "resend";
import PqrEmailTemplate from "@/components/emails/pqr-template";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { nombre, apellido, correo, pais, celular, asunto, mensaje } = data;

    if (!nombre || !apellido || !correo || !pais || !celular || !asunto || !mensaje) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Telas Real <onboarding@resend.dev>",
      to: ["Sac@telasreal.com"],
      subject: `PQR: ${asunto} - ${nombre} ${apellido}`,
      react: PqrEmailTemplate({
        nombre,
        apellido,
        correo,
        pais,
        celular,
        asunto,
        mensaje,
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
