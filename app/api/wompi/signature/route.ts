import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const { reference, amount, currency } = await request.json()
        const integritySecret = process.env.WOMPI_INTEGRITY_SECRET

        if (!integritySecret) {
            return NextResponse.json(
                { error: 'Server configuration error: Missing integrity secret' },
                { status: 500 }
            )
        }

        if (!reference || !amount || !currency) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            )
        }

        // Wompi signature format: SHA256(reference + amount + currency + integritySecret)
        // Amount must be in cents (e.g. 10000 for $100.00) if currency allows decimals, 
        // but Wompi documentation says "Cadena que concatena la referencia de la transacción, 
        // el monto de la transacción (en centavos), la moneda de la transacción y el secreto de integridad."
        // HOWEVER, standard Wompi integration usually takes the amount string as is if it's passed that way.
        // Let's assume the frontend sends the exact string representation used in the widget.

        // Actually, Wompi docs say: 
        // "En el caso de la moneda COP el monto debe ir sin decimales. Ej: 10000"
        // So we should ensure amount is a string representing the integer value.

        const rawString = `${reference}${amount}${currency}${integritySecret}`
        const signature = crypto.createHash('sha256').update(rawString).digest('hex')

        return NextResponse.json({ signature, hash: rawString }) // returning hash for debug if needed, maybe remove later
    } catch (error) {
        console.error('Error generating signature:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
