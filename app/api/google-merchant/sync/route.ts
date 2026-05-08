import { NextResponse } from 'next/server';
import { syncProductsToGoogle } from '@/lib/google-merchant';

/**
 * API Route to manually trigger synchronization with Google Merchant Center.
 * For production, this could be called by a CRON job.
 */
export async function POST() {
  try {
    const result = await syncProductsToGoogle();
    return NextResponse.json({
      message: 'Sincronización completada',
      ...result
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        error: 'Error al sincronizar con Google Merchant Center',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Servicio de sincronización activo. Realice una petición POST para iniciar.' 
  });
}
