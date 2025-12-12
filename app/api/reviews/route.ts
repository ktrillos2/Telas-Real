import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    // NOTE: You need to set these in your .env.local
    // Also, you need to know your ACCOUNT_ID and LOCATION_ID. 
    // If dynamic, you could pass them as query params, but environment variables are safer for fixed businesses.
    const accountId = process.env.GOOGLE_ACCOUNT_ID;
    const locationId = process.env.GOOGLE_LOCATION_ID;

    if (!clientId || !clientSecret || !refreshToken || !accountId || !locationId) {
        return NextResponse.json(
            { error: 'Missing environment variables configuration' },
            { status: 500 }
        );
    }

    try {
        // 1. Get Access Token using Refresh Token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(tokenData.error_description || 'Failed to refresh token');
        }

        const accessToken = tokenData.access_token;

        // 2. Fetch Reviews
        const reviewsResponse = await fetch(
            `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!reviewsResponse.ok) {
            const errorData = await reviewsResponse.json();
            throw new Error(errorData.error?.message || 'Failed to fetch reviews');
        }

        const reviewsData = await reviewsResponse.json();

        return NextResponse.json(reviewsData);

    } catch (error: any) {
        console.error('Error in /api/reviews:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
