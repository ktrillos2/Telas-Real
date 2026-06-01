import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { event, data, signature, timestamp, environment } = body

        if (event !== 'transaction.updated') {
            return NextResponse.json({ message: 'Event ignored' }, { status: 200 })
        }

        const { transaction } = data

        // Verify Signature
        // Verify Signature
        const integritySecret = process.env.WOMPI_EVENTS_SECRET
        if (!integritySecret) {
            console.error('Missing WOMPI_EVENTS_SECRET')
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
        }

        const properties = signature.properties
        let concatenatedValues = ''

        for (const prop of properties) {
            const parts = prop.split('.')
            let value = data
            for (const part of parts) {
                value = value[part]
            }
            concatenatedValues += value
        }

        const rawString = `${concatenatedValues}${timestamp}${integritySecret}`
        const calculatedChecksum = crypto.createHash('sha256').update(rawString).digest('hex')

        if (calculatedChecksum !== signature.checksum) {
            console.error('Invalid Wompi signature', { calculated: calculatedChecksum, received: signature.checksum })
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        if (transaction.status !== 'APPROVED') {
            return NextResponse.json({ message: 'Transaction not approved' }, { status: 200 })
        }

        // WooCommerce integration removed. We just acknowledge the webhook.
        console.log("Webhook validated successfully for transaction:", transaction.id)

        return NextResponse.json({ success: true, message: 'Webhook processed. WordPress sync disabled.' })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
