import { NextResponse } from 'next/server';

export const revalidate = 86400; // Cachear por 24 horas (86400 segundos) para no agotar el plan gratuito

export async function GET() {
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    try {
        const query = 'Telas Real Medellín';
        // limit=10 para traer las 10 reseñas más recientes
        const url = `https://api.outscraper.cloud/maps/reviews-v3?query=${encodeURIComponent(query)}&limit=10&async=false`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
            },
            // Next.js fetch cache configuration (opcional si ya usamos export const revalidate)
            next: { revalidate: 86400 } 
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching from Outscraper:", error);
        return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
    }
}
