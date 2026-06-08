import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/env';

export const revalidate = 60; // Cache por 60 segundos (puedes ajustarlo si deseas que sea instántaneo)

export async function GET() {
    try {
        const client = createClient({
            projectId,
            dataset,
            apiVersion,
            useCdn: true,
        });

        // Obtener solo las reseñas visibles, ordenadas por fecha más reciente
        const query = `*[_type == "review" && isVisible == true] | order(date desc)[0...20]`;
        const reviews = await client.fetch(query);

        return NextResponse.json({ data: reviews });
    } catch (error) {
        console.error("Error fetching reviews from Sanity:", error);
        return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
    }
}

