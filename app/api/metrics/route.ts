import { NextResponse } from 'next/server';
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        // Generate today's date string in YYYY-MM-DD local time (Colombia time generally)
        const dateString = new Date().toISOString().split('T')[0];

        // Ensure we only query/create the document for today
        const query = `*[_type == "dailyMetrics" && date == $date][0]`;
        const existingDoc = await client.fetch(query, { date: dateString });

        let fieldToIncrement = '';
        if (action === 'add_to_cart') fieldToIncrement = 'addsToCart';
        else if (action === 'checkout_started') fieldToIncrement = 'checkoutsStarted';
        else if (action === 'purchase_completed') fieldToIncrement = 'purchases';
        else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (existingDoc) {
            // Update existing
            await client
                .patch(existingDoc._id)
                .inc({ [fieldToIncrement]: 1 })
                .commit();
        } else {
            // Create new for today
            const doc = {
                _type: 'dailyMetrics',
                date: dateString,
                addsToCart: action === 'add_to_cart' ? 1 : 0,
                checkoutsStarted: action === 'checkout_started' ? 1 : 0,
                purchases: action === 'purchase_completed' ? 1 : 0,
            };
            await client.create(doc);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error recording metric:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
