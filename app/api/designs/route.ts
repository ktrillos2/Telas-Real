import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '30');
  const offset = parseInt(searchParams.get('offset') || '0');
  const folder = searchParams.get('folder') || 'TM';

  try {
    // URL base de WordPress donde están las imágenes
    const baseUrl = `https://admin.telasreal.com/wp-content/uploads/Variaciones/${folder}`;
    
    // Hacer fetch a la página para obtener el listado de archivos
    const response = await fetch(baseUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS/14.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el listado de imágenes');
    }

    const html = await response.text();
    
    // Extraer los nombres de archivo de las imágenes
    const imageRegex = /<a href="([^"]+\.(webp|jpg|jpeg|png|gif))">/gi;
    const matches = [...html.matchAll(imageRegex)];
    
    // Filtrar y mapear las imágenes
    const allImages = matches
      .map((match) => {
        const fileName = match[1];
        // Limpiar el nombre de archivo - solo tomar el nombre sin rutas completas
        const cleanFileName = fileName.includes('/') 
          ? fileName.split('/').pop() 
          : fileName;
        
        return {
          id: `${folder}-${cleanFileName}`,
          url: `${baseUrl}/${cleanFileName}`,
          name: cleanFileName || fileName,
          folder: folder,
        };
      })
      .filter((img, index, self) => 
        // Eliminar duplicados
        index === self.findIndex((t) => t.url === img.url)
      );

    // Aplicar paginación
    const paginatedImages = allImages.slice(offset, offset + limit);

    return NextResponse.json({
      images: paginatedImages,
      total: allImages.length,
      limit,
      offset,
      hasMore: offset + limit < allImages.length,
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
