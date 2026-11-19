import { NextResponse } from "next/server";
import { Resend } from "resend";
import B2bEmailTemplate from "@/components/emails/b2b-template";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/** Guarda la solicitud en Sanity ("Solicitudes B2B" en el admin). Si falla, igual se envía el correo. */
async function saveLead(data: Record<string, any>, source: string | null): Promise<string | null> {
  const token = process.env.SANITY_API_TOKEN;
  if (!token) return null;
  try {
    const writeClient = createClient({ projectId, dataset, apiVersion, useCdn: false, token });
    const clean = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
    const doc = await writeClient.create({
      _type: "b2bLead",
      status: "nuevo",
      nombre: clean(data.nombre, 150),
      correo: clean(data.correo, 150),
      telefono: clean(data.telefono, 40),
      ciudad: clean(data.ciudad, 100),
      intereses: Array.isArray(data.intereses) ? data.intereses.map((i: unknown) => clean(i, 80)).slice(0, 20) : [],
      volumen: clean(data.volumen, 80),
      necesidad: clean(data.necesidad, 3000),
      source: source ? clean(source, 300) : "/empresas",
    });
    return doc._id;
  } catch (err) {
    console.error("[B2B] No se pudo guardar la solicitud en Sanity:", err);
    return null;
  }
}

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      nombre,
      correo,
      telefono,
      ciudad,
      intereses,
      volumen,
      necesidad,
    } = data;

    if (!nombre || !correo || !telefono || !necesidad) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // 1. Guardar en Sanity primero: la solicitud no se pierde aunque falle el correo
    const leadId = await saveLead(data, req.headers.get("referer"));

    // TODO: Reemplazar el correo de destino "ventas@telasreal.com" por los correos definitivos indicados por el usuario
    const destinatarios = ["ventas@telasreal.com", "tiendavirtual@telasreal.com"];

    const { data: emailData, error } = await resend.emails.send({
      from: "Telas Real B2B <info@telasreal.com>",
      to: destinatarios,
      subject: `Nueva Solicitud B2B - ${nombre}`,
      react: B2bEmailTemplate({
        nombre,
        correo,
        telefono,
        ciudad,
        intereses,
        volumen,
        necesidad,
      }) as React.ReactElement,
    });

    if (error) {
      console.error("Resend error (B2B):", error);
      // Si quedó guardada en Sanity, para el cliente la solicitud fue recibida
      if (leadId) return NextResponse.json({ success: true, leadId }, { status: 200 });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: emailData }, { status: 200 });
  } catch (error) {
    console.error("API error (B2B):", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
