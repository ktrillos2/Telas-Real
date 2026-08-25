import { NextResponse } from 'next/server'
import { validateWompiEventSignature, syncWompiTransactionToOrder } from '@/lib/wompi-sync'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { event, data } = body

        console.log(`[Wompi Webhook] Received event: ${event}`)

        if (event !== 'transaction.updated') {
            return NextResponse.json({ message: 'Event ignored (not transaction.updated)' }, { status: 200 })
        }

        if (!data || !data.transaction) {
            console.error('[Wompi Webhook] Missing transaction in data payload')
            return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
        }

        // Validate Signature
        const isSignatureValid = validateWompiEventSignature(body)
        if (!isSignatureValid) {
            console.error('[Wompi Webhook] Signature validation failed')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const { transaction } = data

        // Sync transaction to Sanity order (updates status to paid, cancelled, or pending, sends emails, etc.)
        const syncResult = await syncWompiTransactionToOrder(transaction)

        console.log(`[Wompi Webhook] Sync result:`, syncResult)

        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully',
            syncResult,
        })
    } catch (error: any) {
        console.error('[Wompi Webhook] Unexpected error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
