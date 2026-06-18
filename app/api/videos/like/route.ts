import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function POST(req: Request) {
    try {
        const { videoId } = await req.json();

        if (!videoId) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        // Use a client configuration without CDN to perform mutations
        const writeClient = client.withConfig({
            useCdn: false,
        });

        // Increment the likes field by 1
        const result = await writeClient
            .patch(videoId)
            .setIfMissing({ likes: 0 })
            .inc({ likes: 1 })
            .commit();

        return NextResponse.json({ success: true, likes: result.likes });
    } catch (error) {
        console.error('Error incrementing likes:', error);
        return NextResponse.json({ error: 'Failed to increment likes' }, { status: 500 });
    }
}
