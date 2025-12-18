import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createWordPressOrder, getCustomerByEmail } from '@/lib/wordpress-orders'

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

        // Map Wompi data to WordPress Order
        const customerEmail = transaction.customer_email

        // Check if customer exists
        let customerId = 0
        try {
            const existingCustomer = await getCustomerByEmail(customerEmail)
            if (existingCustomer) {
                customerId = existingCustomer.id
                console.log(`Linking order to existing customer: ${customerId}`)
            }
        } catch (e) {
            console.error('Error checking for existing customer:', e)
        }

        const customerName = transaction.customer_data?.full_name || 'Guest'
        const [firstName, ...lastNameParts] = customerName.split(' ')
        const lastName = lastNameParts.join(' ') || ''

        // Wompi amount is in cents
        const total = (transaction.amount_in_cents / 100).toString()

        let lineItems = []
        if (transaction.extra) {
            try {
                if (transaction.extra.items) {
                    lineItems = JSON.parse(transaction.extra.items)
                    console.log('Parsed items from Wompi extra:', lineItems)
                }
            } catch (e) {
                console.error('Error parsing items from extra:', e)
            }
        }

        // Fallback if no items found
        if (lineItems.length === 0) {
            lineItems.push({
                product_id: 0,
                name: "Wompi Payment - Items not specified",
                quantity: 1,
                total: total
            })
        }

        const orderData = {
            payment_method: 'wompi',
            payment_method_title: 'Wompi',
            set_paid: true,
            customer_id: customerId,
            billing: {
                first_name: firstName,
                last_name: lastName,
                address_1: transaction.shipping_address?.address_line_1 || 'N/A',
                city: transaction.shipping_address?.city || 'N/A',
                state: transaction.shipping_address?.region || 'N/A',
                postcode: '00000',
                country: transaction.shipping_address?.country || 'CO',
                email: customerEmail,
                phone: transaction.customer_data?.phone_number || ''
            },
            shipping: {
                first_name: firstName,
                last_name: lastName,
                address_1: transaction.shipping_address?.address_line_1 || 'N/A',
                city: transaction.shipping_address?.city || 'N/A',
                state: transaction.shipping_address?.region || 'N/A',
                postcode: '00000',
                country: transaction.shipping_address?.country || 'CO',
            },
            line_items: lineItems,
            meta_data: [
                { key: 'wompi_reference', value: transaction.reference },
                { key: 'wompi_transaction_id', value: transaction.id },
                { key: '_billing_cedula', value: transaction.customer_data?.legal_id || '' },
                { key: '_billing_document_id', value: transaction.customer_data?.legal_id || '' },
                { key: 'billing_cedula', value: transaction.customer_data?.legal_id || '' }
            ]
        }

        const newOrder = await createWordPressOrder(orderData)

        return NextResponse.json({ success: true, order_id: newOrder.id })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
