import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_PDF_SIZE = 15 * 1024 * 1024;   // 15 MB

export async function POST(req: NextRequest) {
  try {
    const token = process.env.SANITY_API_TOKEN;
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-28";

    if (!token || !projectId || !dataset) {
      return NextResponse.json(
        { error: "Configuración de Sanity no disponible en el servidor." },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // MODO 1: Streaming directo (Binario crudo - Ultra rápido sin sobrecargar la memoria de Node)
    if (!contentType.includes("multipart/form-data")) {
      const { searchParams } = new URL(req.url);
      const rawFilename =
        searchParams.get("filename") ||
        req.headers.get("x-filename") ||
        "archivo_evidencia";

      const decodedFilename = decodeURIComponent(rawFilename);
      const safeFilename = decodedFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

      const isVideo =
        contentType.startsWith("video/") ||
        /\.(mp4|webm|mov|mkv|avi)$/i.test(decodedFilename);
      const isImage =
        contentType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(decodedFilename);
      const isPdf =
        contentType.includes("pdf") ||
        /\.pdf$/i.test(decodedFilename);

      if (!isVideo && !isImage && !isPdf) {
        return NextResponse.json(
          { error: "Formato no permitido. Solo se aceptan fotos, videos o documentos PDF." },
          { status: 400 }
        );
      }

      const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
      if (isVideo && contentLength > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { error: `El video excede el límite de 50 MB permitido.` },
          { status: 400 }
        );
      }
      if ((isImage || isPdf) && contentLength > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `El archivo excede el límite de 15 MB permitido.` },
          { status: 400 }
        );
      }

      const category = isVideo ? "video" : isImage ? "image" : "document";
      const sanityAssetUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/assets/files/${dataset}?filename=${encodeURIComponent(
        safeFilename
      )}`;

      // Streaming directo hacia la API REST de Sanity
      const sanityRes = await fetch(sanityAssetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType || "application/octet-stream",
        },
        // @ts-expect-error duplex half is supported in Node 18+ fetch
        duplex: "half",
        body: req.body,
      });

      const sanityData = await sanityRes.json();
      if (!sanityRes.ok) {
        console.error("[PQR-Upload] Error Sanity REST API:", sanityData);
        return NextResponse.json(
          { error: sanityData?.message || "Error al almacenar el archivo en Sanity CDN." },
          { status: sanityRes.status || 500 }
        );
      }

      const assetDoc = sanityData.document || sanityData;
      return NextResponse.json({
        success: true,
        assetId: assetDoc._id,
        url: assetDoc.url,
        filename: safeFilename,
        size: contentLength || assetDoc.size,
        type: category,
      });
    }

    // MODO 2: Fallback para petición individual multipart
    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("archivo")) as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No se ha proporcionado ningún archivo para subir." },
        { status: 400 }
      );
    }

    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    const isPdf =
      file.type.includes("pdf") ||
      /\.pdf$/i.test(file.name);

    if (!isVideo && !isImage && !isPdf) {
      return NextResponse.json(
        { error: "Formato no permitido. Solo se aceptan fotos, videos o documentos PDF." },
        { status: 400 }
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `El video excede el límite de 50 MB permitido.` },
        { status: 400 }
      );
    }
    if ((isImage || isPdf) && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `El archivo excede el límite de 15 MB permitido.` },
        { status: 400 }
      );
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const category = isVideo ? "video" : isImage ? "image" : "document";

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await writeClient.assets.upload("file", buffer, {
      filename: safeFilename,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      assetId: asset._id,
      url: asset.url,
      filename: safeFilename,
      size: file.size,
      type: category,
    });
  } catch (error: any) {
    console.error("[PQR-Upload] Error inesperado:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno al procesar la subida del archivo." },
      { status: 500 }
    );
  }
}
