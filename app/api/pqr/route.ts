import { NextResponse } from "next/server";
import { Resend } from "resend";
import PqrEmailTemplate, { PqrEvidenciaItem } from "@/components/emails/pqr-template";
import { client } from "@/sanity/lib/client";

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
    const formData = await req.formData();

    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const documento = formData.get("documento") as string;
    const correo = formData.get("correo") as string;
    const celular = formData.get("celular") as string;
    const asunto = formData.get("asunto") as string;
    const mensaje = formData.get("mensaje") as string;
    const fechaEnvio = formData.get("fechaEnvio") as string;

    if (!nombre || !apellido || !documento || !correo || !celular || !asunto || !mensaje) {
      return NextResponse.json({ error: "Todos los campos obligatorios deben llenarse" }, { status: 400 });
    }

    // Obtener todos los archivos adjuntos (imágenes, videos, documentos)
    const rawArchivos = formData.getAll("archivos");
    const rawEvidencias = formData.getAll("evidencia");
    const combinedFiles = [...rawArchivos, ...rawEvidencias];

    // Filtrar archivos válidos únicos
    const files: File[] = [];
    const seenNames = new Set<string>();
    for (const item of combinedFiles) {
      if (item instanceof File && item.size > 0) {
        const key = `${item.name}-${item.size}-${item.lastModified}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          files.push(item);
        }
      }
    }

    const sanityEvidencias: any[] = [];
    const emailEvidencias: PqrEvidenciaItem[] = [];
    const resendAttachments: any[] = [];
    let totalAttachmentSize = 0;
    const MAX_DIRECT_EMAIL_SIZE = 12 * 1024 * 1024; // 12 MB máximo total para adjuntos directos en correo

    // Subir cada archivo a Sanity CDN
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const safeFilename = (file.name || `archivo_${i + 1}`).replace(/[^a-zA-Z0-9._-]/g, "_");

        const asset = await client.assets.upload("file", buffer, {
          filename: safeFilename,
          contentType: file.type || "application/octet-stream",
        });

        const isVideo = file.type?.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
        const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
        const fileType = isVideo ? "video" : isImage ? "image" : "document";

        sanityEvidencias.push({
          _type: "file",
          _key: `evidence_${Date.now()}_${i}`,
          asset: {
            _type: "reference",
            _ref: asset._id,
          },
        });

        emailEvidencias.push({
          name: file.name,
          url: asset.url,
          size: formatBytes(file.size),
          type: fileType,
        });

        // Solo adjuntar directamente si no excede el tamaño seguro para Resend
        if (totalAttachmentSize + file.size <= MAX_DIRECT_EMAIL_SIZE) {
          resendAttachments.push({
            filename: safeFilename,
            content: buffer,
          });
          totalAttachmentSize += file.size;
        }
      } catch (uploadError) {
        console.error(`Error subiendo archivo ${file.name} a Sanity:`, uploadError);
      }
    }

    // Guardar en Sanity
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
      // Compatibilidad con registros previos de un solo archivo
      sanityData.evidencia = sanityEvidencias[0];
    }

    await client.create(sanityData);

    // Enviar correo con plantilla detallada y enlaces a evidencias
    const { data: emailData, error } = await resend.emails.send({
      from: "Telas Real <info@telasreal.com>",
      to: ["sac@telasreal.com"],
      subject: `PQR: ${asunto} - ${nombre} ${apellido}`,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
      react: PqrEmailTemplate({
        nombre,
        apellido,
        documento,
        correo,
        celular,
        asunto,
        mensaje,
        fechaEnvio,
        evidencias: emailEvidencias,
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
