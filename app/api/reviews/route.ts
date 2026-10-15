import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

export const dynamic = "force-dynamic";

function generateKey() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function getWriteClient() {
  const token = process.env.SANITY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-28";

  if (!token || !projectId || !dataset) {
    throw new Error("Configuración de Sanity no disponible en el servidor.");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  });
}

// GET: Obtener las reseñas del producto
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const productId = searchParams.get("productId");
    const familySlug = searchParams.get("familySlug");

    if (!slug && !productId && !familySlug) {
      return NextResponse.json(
        { error: "Se requiere slug o productId del producto." },
        { status: 400 }
      );
    }

    const client = getWriteClient();

    // Query adaptable a slugs unificados y variantes de color
    const query = `
      *[_type == "productReview" && isApproved != false && (
        (defined($slug) && productSlug == $slug) ||
        (defined($familySlug) && (productFamilySlug == $familySlug || productSlug == $familySlug)) ||
        (defined($productId) && product._ref == $productId)
      )] | order(createdAt desc) {
        _id,
        author,
        rating,
        title,
        comment,
        colorVariantName,
        verifiedPurchase,
        createdAt,
        "images": images[]{
          _key,
          "url": asset->url,
          "alt": alt
        },
        "videos": videos[]{
          _key,
          "url": asset->url,
          "title": title,
          "filename": asset->originalFilename
        }
      }
    `;

    const reviews = await client.fetch(query, {
      slug: slug || null,
      familySlug: familySlug || null,
      productId: productId || null,
    });

    const totalReviews = reviews.length;
    let averageRating = 5;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let mediaCount = 0;

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc: number, r: any) => {
        const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        breakdown[rating as keyof typeof breakdown] = (breakdown[rating as keyof typeof breakdown] || 0) + 1;
        if ((r.images && r.images.length > 0) || (r.videos && r.videos.length > 0)) {
          mediaCount++;
        }
        return acc + (r.rating || 5);
      }, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        totalReviews,
        averageRating,
        breakdown,
        mediaCount,
      },
    });
  } catch (error: any) {
    console.error("[Reviews GET] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al obtener reseñas." },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva reseña y guardarla automáticamente en Sanity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      productId,
      productSlug,
      productTitle,
      productFamilySlug,
      colorVariantName,
      author,
      email,
      rating,
      title,
      comment,
      images = [],
      videos = [],
    } = body;

    // Validaciones
    if (!productSlug && !productId) {
      return NextResponse.json(
        { error: "Identificador de producto faltante." },
        { status: 400 }
      );
    }

    if (!author || typeof author !== "string" || author.trim().length < 2) {
      return NextResponse.json(
        { error: "Por favor ingresa tu nombre (mínimo 2 caracteres)." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "La calificación debe ser un valor entre 1 y 5 estrellas." },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 5) {
      return NextResponse.json(
        { error: "Por favor escribe un comentario de al menos 5 caracteres sobre tu experiencia." },
        { status: 400 }
      );
    }

    const client = getWriteClient();

    // Estructurar imágenes para Sanity
    const formattedImages = (Array.isArray(images) ? images : [])
      .filter((img: any) => img?.assetId)
      .map((img: any) => ({
        _key: img._key || generateKey(),
        _type: "image",
        asset: {
          _type: "reference",
          _ref: img.assetId,
        },
        alt: img.alt || `Foto de reseña por ${author.trim()}`,
      }));

    // Estructurar videos para Sanity
    const formattedVideos = (Array.isArray(videos) ? videos : [])
      .filter((vid: any) => vid?.assetId)
      .map((vid: any) => ({
        _key: vid._key || generateKey(),
        _type: "file",
        asset: {
          _type: "reference",
          _ref: vid.assetId,
        },
        title: vid.title || `Video de reseña por ${author.trim()}`,
      }));

    // Crear el documento en Sanity
    const reviewDoc: any = {
      _type: "productReview",
      productSlug: String(productSlug || "").trim(),
      productTitle: productTitle ? String(productTitle).trim() : undefined,
      productFamilySlug: productFamilySlug ? String(productFamilySlug).trim() : undefined,
      colorVariantName: colorVariantName ? String(colorVariantName).trim() : undefined,
      author: author.trim(),
      email: email ? String(email).trim().toLowerCase() : undefined,
      rating: Math.round(numRating),
      title: title ? String(title).trim() : undefined,
      comment: comment.trim(),
      images: formattedImages.length > 0 ? formattedImages : undefined,
      videos: formattedVideos.length > 0 ? formattedVideos : undefined,
      isApproved: true, // Visible automáticamente
      verifiedPurchase: false,
      createdAt: new Date().toISOString(),
    };

    if (productId && !productId.startsWith("unified-")) {
      reviewDoc.product = {
        _type: "reference",
        _ref: productId,
      };
    }

    const createdDoc = await client.create(reviewDoc);

    return NextResponse.json({
      success: true,
      message: "¡Tu reseña ha sido guardada y publicada exitosamente!",
      review: {
        _id: createdDoc._id,
        author: createdDoc.author,
        rating: createdDoc.rating,
        title: createdDoc.title,
        comment: createdDoc.comment,
        colorVariantName: createdDoc.colorVariantName,
        verifiedPurchase: createdDoc.verifiedPurchase,
        createdAt: createdDoc.createdAt,
        images: formattedImages.map((img: any) => ({
          _key: img._key,
          url: images.find((i: any) => i.assetId === img.asset._ref)?.url,
          alt: img.alt,
        })),
        videos: formattedVideos.map((vid: any) => ({
          _key: vid._key,
          url: videos.find((v: any) => v.assetId === vid.asset._ref)?.url,
          title: vid.title,
        })),
      },
    });
  } catch (error: any) {
    console.error("[Reviews POST] Error al crear reseña en Sanity:", error);
    return NextResponse.json(
      { error: error?.message || "Error al guardar la reseña en Sanity." },
      { status: 500 }
    );
  }
}
