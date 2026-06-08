import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST() {
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    const sanityToken = process.env.SANITY_API_TOKEN;

    if (!apiKey) {
        return NextResponse.json({ error: 'Outscraper API key no configurada' }, { status: 500 });
    }

    if (!sanityToken) {
        return NextResponse.json({ error: 'Sanity API token no configurado' }, { status: 500 });
    }

    const client = createClient({
        projectId,
        dataset,
        apiVersion,
        token: sanityToken,
        useCdn: false,
    });

    try {
        const queries = [
            'Telas Real Medellín',
            'Telas Real Bogotá',
            'Telas Real Cali',
            'Telas Real Barranquilla',
            'Telas Real Bucaramanga'
        ];

        let syncedCount = 0;
        const transaction = client.transaction();

        // Realizamos peticiones para cada ciudad
        for (const query of queries) {
            const url = `https://api.outscraper.cloud/maps/reviews-v3?query=${encodeURIComponent(query)}&limit=5&async=false`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-API-KEY': apiKey,
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                console.error(`Error fetching for ${query}: ${response.statusText}`);
                continue;
            }

            const rawData = await response.json();
            const place = rawData.data?.[0];
            const reviewsArray = place?.reviews_data;

            if (!reviewsArray || !Array.isArray(reviewsArray)) {
                continue;
            }

            // Filtramos para que solo traiga reseñas de 4.9 hacia arriba (básicamente 5 estrellas)
            const topReviews = reviewsArray.filter((r: any) => (r.review_rating || r.rating || 5) >= 4.9);

            for (const review of topReviews) {
                const author = review.author_title || review.reviewer || 'Cliente';
                const dateStr = review.review_datetime_utc || review.time || '';
                const location = place?.name || place?.query || query;
                
                // Crear un ID único basado en autor y fecha para evitar duplicados
                const uniqueString = `${author}-${dateStr}`;
                const hash = crypto.createHash('md5').update(uniqueString).digest('hex');
                const documentId = `review-${hash}`;

                // Convert date to ISO-8601 format
                let isoDate = new Date().toISOString();
                if (dateStr) {
                    const parsedDate = new Date(dateStr);
                    if (!isNaN(parsedDate.getTime())) {
                        isoDate = parsedDate.toISOString();
                    } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
                        // Intentar parsear formato MM/DD/YYYY HH:MM:SS si new Date falla
                        const parts = dateStr.split(' ');
                        if (parts.length > 0) {
                            const dateParts = parts[0].split('/');
                            if (dateParts.length === 3) {
                                // Asumimos formato MM/DD/YYYY o DD/MM/YYYY
                                // Outscraper suele devolver MM/DD/YYYY
                                const timePart = parts[1] || '00:00:00';
                                const formattedForDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}T${timePart}Z`;
                                const fallbackDate = new Date(formattedForDate);
                                if (!isNaN(fallbackDate.getTime())) {
                                    isoDate = fallbackDate.toISOString();
                                }
                            }
                        }
                    }
                }

                const reviewDoc = {
                    _id: documentId,
                    _type: 'review',
                    name: author,
                    location: location,
                    rating: review.review_rating || review.rating || 5,
                    comment: review.review_text || review.reviewText || '',
                    date: isoDate,
                    profilePhotoUrl: review.author_image || review.review_img_url || '',
                    link: review.review_link || review.review_url || place?.place_link || place?.place_url || '',
                    isVisible: true,
                };

                transaction.createIfNotExists(reviewDoc);
                syncedCount++;
            }
        }

        if (syncedCount > 0) {
            await transaction.commit();
        }

        return NextResponse.json({ success: true, syncedCount });
    } catch (error: any) {
        console.error("Error al sincronizar reseñas:", error);
        return NextResponse.json({ error: error.message || 'Error interno al sincronizar reseñas' }, { status: 500 });
    }
}
