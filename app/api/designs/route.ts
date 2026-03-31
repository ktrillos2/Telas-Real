import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '30');
  const offset = parseInt(searchParams.get('offset') || '0');
  const folder = searchParams.get('folder') || 'TM';

  try {
    // URL base de WordPress eliminada por solicitud del usuario
    // Ya no se conecta a admin.telasreal.com
    
    // Retornamos un arreglo vacío de imágenes por ahora
    // hasta que el sistema de diseños se migre a otra plataforma (Sanity/Local)
    return NextResponse.json({
      images: [],
      total: 0,
      limit,
      offset,
      hasMore: false,
    });

  } catch (error) {
    console.error('Error en API de diseños:', error);
    return NextResponse.json(
      { 
        error: 'Error al cargar las imágenes',
        images: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      },
      { status: 500 }
    );
  }
}
