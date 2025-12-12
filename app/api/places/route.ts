import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Google Places API key is not configured' },
            { status: 500 }
        );
    }

    const query = 'Telas Real in Colombia';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
    )}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API error:', data);
            return NextResponse.json(
                { error: 'Failed to fetch places from Google API' },
                { status: 500 }
            );
        }

        // Transform the data to a simpler format if needed, or return as is
        // For now, let's return the results directly
        return NextResponse.json({ places: data.results });
    } catch (error) {
        console.error('Error fetching places:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
