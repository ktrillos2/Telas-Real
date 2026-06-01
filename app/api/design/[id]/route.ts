import { createClient } from '@libsql/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return new NextResponse('Missing ID', { status: 400 });
    }

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        return new NextResponse('Server configuration error', { status: 500 });
    }

    const client = createClient({
        url,
        authToken
    });

    try {
        const result = await client.execute({
            sql: 'SELECT mime_type, data FROM custom_designs WHERE id = ?',
            args: [id]
        });

        if (result.rows.length === 0) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const row = result.rows[0];
        const mimeType = row.mime_type as string;
        // The data comes back as an ArrayBuffer or similar depending on the driver
        // @libsql/client usually returns ArrayBuffer for BLOBs
        const data = row.data as ArrayBuffer;

        return new NextResponse(data, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });

    } catch (error) {
        console.error('Error fetching image from Turso:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    } finally {
        client.close();
    }
}
