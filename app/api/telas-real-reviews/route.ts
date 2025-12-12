import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    try {
        const query = 'Telas Real Medellín';
        const url = `https://api.outscraper.cloud/maps/reviews-v3?query=${encodeURIComponent(query)}&limit=10&async=false`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
    }
}
