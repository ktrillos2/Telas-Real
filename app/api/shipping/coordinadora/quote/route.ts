import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { quoteCartShipping } from '@/lib/coordinadora/server-quote';
import { CoordinadoraQuoteError } from '@/lib/coordinadora/quote';
import { CoordinadoraAuthError } from '@/lib/coordinadora/auth';

const quoteRequestSchema = z.object({
  destinationDane: z
    .string()
    .min(5, 'Código DANE requerido')
    .max(12, 'Código DANE inválido'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'ID de producto requerido'),
        slug: z.string().optional(),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1')
      })
    )
    .min(1, 'Debe incluir al menos un producto en el carrito')
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_JSON',
          message: 'El cuerpo de la solicitud no es un JSON válido.'
        },
        { status: 400 }
      );
    }

    const validation = quoteRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.error.errors[0]?.message || 'Datos de cotización inválidos.',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const { destinationDane, items } = validation.data;

    const quote = await quoteCartShipping({
      destinationDane,
      items
    });

    return NextResponse.json(
      {
        success: true,
        quote
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof CoordinadoraQuoteError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Coordinadora Quote API Warning] ${error.code}: ${error.message}`);
      }
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message
        },
        { status: error.statusCode || 400 }
      );
    }

    if (error instanceof CoordinadoraAuthError) {
      console.error(`[Coordinadora Auth Error]: ${error.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'AUTH_ERROR',
          message: 'No fue posible autenticar con el servicio de mensajería.'
        },
        { status: 502 }
      );
    }

    console.error('[Coordinadora Internal Server Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado al calcular el costo de envío.',
        debug: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

