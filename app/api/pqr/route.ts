import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "next-sanity";
import PqrEmailTemplate, { PqrEvidenciaItem } from "@/components/emails/pqr-template";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export async function POST(req: Request) {
  try {
    const token = process.env.SANITY_API_TOKEN;
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-28";

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    });

    const contentType = req.headers.get("content-type") || "";

    let nombre = "";
    let apellido = "";
    let documento = "";
    let correo = "";
    let celular = "";
    let asunto = "";
    let mensaje = "";
    let fechaEnvio = "";
    let preUploadedEvidencias: any[] = [];

    // CASO 1: JSON Payload (Archivos ya subidos eficientemente por streaming a Sanity CDN)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      nombre = body.nombre;
      apellido = body.apellido;
      documento = body.documento;
      correo = body.correo;
      celular = body.celular;
      asunto = body.asunto;
      mensaje = body.mensaje;
      fechaEnvio = body.fechaEnvio;
      preUploadedEvidencias = Array.isArray(body.evidencias) ? body.evidencias : [];
    } else {
      // CASO 2: Fallback Multipart/Form-Data
      const formData = await req.formData();
      nombre = formData.get("nombre") as string;
      apellido = formData.get("apellido") as string;
      documento = formData.get("documento") as string;
      correo = formData.get("correo") as string;
      celular = formData.get("celular") as string;
      asunto = formData.get("asunto") as string;
      mensaje = formData.get("mensaje") as string;
      fechaEnvio = formData.get("fechaEnvio") as string;

      const rawArchivos = formData.getAll("archivos");
      const rawEvidencias = formData.getAll("evidencia");
      const combinedFiles = [...rawArchivos, ...rawEvidencias];

      for (let i = 0; i < combinedFiles.length; i++) {
        const item = combinedFiles[i];
        if (item instanceof File && item.size > 0) {
          try {
            const safeFilename = (item.name || `archivo_${i + 1}`).replace(/[^a-zA-Z0-9._-]/g, "_");
            const arrayBuffer = await item.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const asset = await writeClient.assets.upload("file", buffer, {
              filename: safeFilename,
              contentType: item.type || "application/octet-stream",
            });

            const isVideo = item.type?.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(item.name);
            const isImage = item.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.name);
            const fileType = isVideo ? "video" : isImage ? "image" : "document";

            preUploadedEvidencias.push({
              assetId: asset._id,
              url: asset.url,
              filename: safeFilename,
              size: item.size,
              type: fileType,
            });
          } catch (uploadErr) {
            console.error(`[PQR] Error subiendo archivo ${item.name}:`, uploadErr);
          }
        }
      }
    }

    if (!nombre || !apellido || !documento || !correo || !celular || !asunto || !mensaje) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben llenarse" },
        { status: 400 }
      );
    }

    // Estructurar referencias para Sanity y plantilla de correo
    const sanityEvidencias: any[] = [];
    const emailEvidencias: PqrEvidenciaItem[] = [];

    preUploadedEvidencias.forEach((ev, idx) => {
      if (ev.assetId) {
        sanityEvidencias.push({
          _type: "file",
          _key: `evidence_${Date.now()}_${idx}`,
          asset: {
            _type: "reference",
            _ref: ev.assetId,
          },
        });
      }

      emailEvidencias.push({
        name: ev.filename || `Evidencia ${idx + 1}`,
        url: ev.url,
        size: typeof ev.size === "number" ? formatBytes(ev.size) : ev.size || "",
        type: ev.type || "document",
      });
    });

    // Guardar documento PQR en Sanity
    const sanityData: any = {
      _type: "pqr",
      nombre,
      apellido,
      documento,
      correo,
      celular,
      asunto,
      mensaje,
      fechaEnvio: fechaEnvio || new Date().toISOString(),
    };

    if (sanityEvidencias.length > 0) {
      sanityData.evidencias = sanityEvidencias;
      // Compatibilidad con registros previos individuales
      sanityData.evidencia = sanityEvidencias[0];
    }

    const createdDoc = await writeClient.create(sanityData);

    // Renderizar plantilla de correo a HTML estático de forma segura
    const { render } = await import("@react-email/render");
    const emailHtml = await render(
      PqrEmailTemplate({
        nombre,
        apellido,
        documento,
        correo,
        celular,
        asunto,
        mensaje,
        fechaEnvio,
        evidencias: emailEvidencias,
      })
    );

    // Enviar notificación a Servicio al Cliente
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Telas Real <info@telasreal.com>",
      to: ["sac@telasreal.com"],
      subject: `PQR: ${asunto} - ${nombre} ${apellido}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("[PQR] Error enviando correo Resend:", emailError);
      // Nota: El documento PQR ya está a salvo en Sanity
    }

    return NextResponse.json(
      {
        success: true,
        pqrId: createdDoc._id,
        emailId: emailData?.id || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PQR] Error en API route:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
