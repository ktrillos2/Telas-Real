import { NextResponse } from 'next/server';

/**
 * Desactivado. El inventario se descuenta al confirmarse el pago del pedido (lib/inventory.ts),
 * una sola vez por pedido. Este webhook no pedía autenticación (cualquiera podía descontar stock
 * o dejar productos agotados) y no funcionaba: las líneas de los pedidos no guardaban el producto.
 * Si hay un webhook configurado en Sanity apuntando aquí, se puede borrar.
 */
export async function POST() {
    return NextResponse.json(
        { message: 'Webhook desactivado: el inventario se descuenta al confirmarse el pago.' },
        { status: 410 }
    );
}
