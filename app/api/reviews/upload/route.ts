import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB

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

    // MODO 1: Streaming directo (Binario crudo)
    if (!contentType.includes("multipart/form-data")) {
      const { searchParams } = new URL(req.url);
      const rawFilename =
        searchParams.get("filename") ||
        req.headers.get("x-filename") ||
        "archivo_resena";

      const decodedFilename = decodeURIComponent(rawFilename);
      const safeFilename = decodedFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

      const isVideo =
        contentType.startsWith("video/") ||
        /\.(mp4|webm|mov|mkv|avi)$/i.test(decodedFilename);
      const isImage =
        contentType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(decodedFilename);

      if (!isVideo && !isImage) {
        return NextResponse.json(
          { error: "Formato no permitido. Solo se aceptan fotos (JPG, PNG, WebP) o videos (MP4, WebM, MOV)." },
          { status: 400 }
        );
      }

      const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
      if (isVideo && contentLength > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { error: "El video excede el límite máximo de 50 MB permitido." },
          { status: 400 }
        );
      }
      if (isImage && contentLength > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "La foto excede el límite máximo de 15 MB permitido." },
          { status: 400 }
        );
      }

      const category = isVideo ? "video" : "image";
      const bucket = isImage ? "images" : "files";
      const sanityAssetUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/assets/${bucket}/${dataset}?filename=${encodeURIComponent(
        safeFilename
      )}`;

      const sanityRes = await fetch(sanityAssetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType || "application/octet-stream",
        },
        // @ts-expect-error duplex is standard in Node 18+
        duplex: "half",
        body: req.body,
      });

      const sanityData = await sanityRes.json();
      if (!sanityRes.ok) {
        console.error("[Reviews-Upload] Error Sanity REST API:", sanityData);
        return NextResponse.json(
          { error: sanityData?.message || "Error al subir el archivo multimedia a Sanity." },
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

    // MODO 2: Fallback Multipart/Form-Data
    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("archivo")) as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo para subir." },
        { status: 400 }
      );
    }

    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: "Formato no permitido. Solo se aceptan fotos o videos." },
        { status: 400 }
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: "El video supera el límite de 50 MB." },
        { status: 400 }
      );
    }
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "La foto supera el límite de 15 MB." },
        { status: 400 }
      );
    }

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    });

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const assetType = isImage ? "image" : "file";
    const asset = await writeClient.assets.upload(assetType, buffer, {
      filename: safeFilename,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      assetId: asset._id,
      url: asset.url,
      filename: safeFilename,
      size: file.size,
      type: isVideo ? "video" : "image",
    });
  } catch (err: any) {
    console.error("[Reviews-Upload] Excepción:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno al procesar el archivo multimedia." },
      { status: 500 }
    );
  }
}
