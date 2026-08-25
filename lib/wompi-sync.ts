import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { sendOrderEmail } from '@/lib/email-notifications'

const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
})

/**
 * Determines Wompi API Base URL (Sandbox vs Production)
 */
export function getWompiBaseUrl(envParam?: string | null): string {
    if (envParam === 'test' || envParam === 'sandbox') return 'https://sandbox.wompi.co/v1'
    if (envParam === 'prod' || envParam === 'production') return 'https://production.wompi.co/v1'

    const privateKey = process.env.WOMPI_PRIVATE_KEY || ''
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || ''

    if (privateKey.includes('test') || publicKey.includes('test') || privateKey.includes('sandbox')) {
        return 'https://sandbox.wompi.co/v1'
    }

    return 'https://production.wompi.co/v1'
}

/**
 * Fetches transaction details directly from Wompi API
 */
export async function fetchWompiTransaction(transactionId: string, envParam?: string | null) {
    if (!transactionId) return null

    const baseUrl = getWompiBaseUrl(envParam)
    const privateKey = process.env.WOMPI_PRIVATE_KEY
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (privateKey) {
        headers['Authorization'] = `Bearer ${privateKey}`
    } else if (publicKey) {
        headers['Authorization'] = `Bearer ${publicKey}`
    }

    try {
        const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
            headers,
            cache: 'no-store',
        })

        if (!res.ok) {
            console.error(`Wompi API fetch failed with status ${res.status}`)
            return null
        }

        const json = await res.json()
        return json?.data || null
    } catch (error) {
        console.error('Error fetching Wompi transaction:', error)
        return null
    }
}

/**
 * Validates the SHA-256 event signature sent by Wompi in webhooks
 */
export function validateWompiEventSignature(body: any): boolean {
    try {
        const { data, signature, timestamp } = body
        const eventsSecret = process.env.WOMPI_EVENTS_SECRET

        if (!eventsSecret) {
            console.error('WOMPI_EVENTS_SECRET is not configured')
            return false
        }

        if (!signature || !signature.properties || !signature.checksum) {
            console.error('Missing signature structure in Wompi webhook payload')
            return false
        }

        const properties: string[] = signature.properties
        let concatenatedValues = ''

        for (const prop of properties) {
            const parts = prop.split('.')
            let val: any = data
            for (const part of parts) {
                if (val !== undefined && val !== null) {
                    val = val[part]
                } else {
                    val = ''
                }
            }
            concatenatedValues += (val !== undefined && val !== null ? String(val) : '')
        }

        const rawString = `${concatenatedValues}${timestamp}${eventsSecret}`
        const calculatedChecksum = crypto.createHash('sha256').update(rawString).digest('hex')

        const isValid = calculatedChecksum.toLowerCase() === signature.checksum.toLowerCase()
        if (!isValid) {
            console.error('Wompi event signature mismatch:', {
                calculated: calculatedChecksum,
                received: signature.checksum,
            })
        }

        return isValid
    } catch (error) {
        console.error('Error validating Wompi event signature:', error)
        return false
    }
}

/**
 * Synchronizes Wompi Transaction data into the matching Sanity order
 */
export async function syncWompiTransactionToOrder(transaction: any) {
    if (!transaction) {
        return { success: false, error: 'No transaction data provided' }
    }

    const reference = transaction.reference ? String(transaction.reference).trim() : ''
    const transactionId = transaction.id ? String(transaction.id).trim() : ''
    const wompiStatus = (transaction.status || '').toUpperCase()
    const paymentMethodType = transaction.payment_method_type || transaction.payment_method?.type || ''
    const finalizedAt = transaction.finalized_at || new Date().toISOString()

    console.log(`[Wompi Sync] Processing transaction ${transactionId}, status: ${wompiStatus}, reference: ${reference}`)

    if (!reference && !transactionId) {
        return { success: false, error: 'Missing reference and transactionId' }
    }

    try {
        // Find order in Sanity by reference, orderNumber, or _id
        // Extracts numeric part from reference as well (e.g. "10025")
        const numericMatch = reference.match(/\d+/)
        const numericRef = numericMatch ? numericMatch[0] : ''

        const query = `*[_type == "order" && (
            _id == $reference || 
            orderNumber == $reference || 
            orderNumber == $numericRef ||
            wompiTransactionId == $transactionId ||
            orderNumber == $transactionId
        )][0]{
            ...,
            obsequio {
                quantity,
                product->{
                    title
                }
            }
        }`

        const existingOrder = await sanityClient.fetch(query, { reference, numericRef, transactionId })

        if (!existingOrder) {
            console.error(`[Wompi Sync] Order not found for reference "${reference}" or transaction "${transactionId}"`)
            return { success: false, error: `Order not found for reference ${reference}` }
        }

        console.log(`[Wompi Sync] Found order ${existingOrder._id} (No. ${existingOrder.orderNumber}), current status: ${existingOrder.status}`)

        // Map Wompi Status to Sanity Order Status
        let targetStatus = existingOrder.status
        let shouldSendEmail = false

        if (wompiStatus === 'APPROVED') {
            targetStatus = 'paid'
            if (existingOrder.status !== 'paid' && existingOrder.status !== 'processing') {
                shouldSendEmail = true
            }
        } else if (wompiStatus === 'DECLINED' || wompiStatus === 'VOIDED' || wompiStatus === 'ERROR') {
            targetStatus = 'cancelled'
        } else if (wompiStatus === 'PENDING') {
            targetStatus = 'pending'
        }

        // Build update patch
        const patchData: Record<string, any> = {
            status: targetStatus,
            wompiStatus: wompiStatus,
            wompiTransactionId: transactionId || existingOrder.wompiTransactionId,
            wompiPaymentMethodType: paymentMethodType || existingOrder.wompiPaymentMethodType,
        }

        if (wompiStatus === 'APPROVED') {
            patchData.paymentDate = finalizedAt
        }

        // Commit update to Sanity
        await sanityClient.patch(existingOrder._id).set(patchData).commit()
        console.log(`[Wompi Sync] Order ${existingOrder._id} updated to status "${targetStatus}" (Wompi: ${wompiStatus})`)

        // If newly approved, trigger confirmation email and metrics
        if (shouldSendEmail) {
            try {
                const emailOrder = {
                    id: existingOrder.orderNumber || existingOrder._id,
                    orderNumber: existingOrder.orderNumber,
                    number: existingOrder.orderNumber,
                    date_created: existingOrder.date || existingOrder._createdAt,
                    total: existingOrder.total,
                    payment_method: 'wompi',
                    payment_method_title: `Wompi (${paymentMethodType || 'Online'})`,
                    billing: {
                        first_name: existingOrder.shippingAddress?.fullName?.split(' ')[0] || 'Cliente',
                        last_name: existingOrder.shippingAddress?.fullName?.split(' ').slice(1).join(' ') || '',
                        email: existingOrder.email || existingOrder.shippingAddress?.email,
                        phone: existingOrder.shippingAddress?.phone,
                        address_1: existingOrder.shippingAddress?.address,
                        city: existingOrder.shippingAddress?.city,
                        state: existingOrder.shippingAddress?.department || 'CO',
                        country: 'CO',
                    },
                    line_items: existingOrder.items?.map((item: any) => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        total: (item.price * item.quantity).toString(),
                        image: item.image,
                    })) || [],
                }

                await sendOrderEmail(emailOrder as any, 'processing')
                console.log(`[Wompi Sync] Confirmation email sent for order ${existingOrder.orderNumber || existingOrder._id}`)
            } catch (emailErr) {
                console.error('[Wompi Sync] Error sending confirmation email:', emailErr)
            }

            // Track purchase in daily metrics
            try {
                const dateString = new Date().toISOString().split('T')[0]
                const existingMetric = await sanityClient.fetch(`*[_type == "dailyMetrics" && date == $date][0]`, { date: dateString })
                if (existingMetric) {
                    await sanityClient.patch(existingMetric._id).inc({ purchases: 1 }).commit()
                }
            } catch (metricErr) {
                console.error('[Wompi Sync] Metric tracking error:', metricErr)
            }
        }

        return {
            success: true,
            orderId: existingOrder._id,
            orderNumber: existingOrder.orderNumber,
            status: targetStatus,
            wompiStatus: wompiStatus,
        }
    } catch (error: any) {
        console.error('[Wompi Sync] Fatal error syncing order:', error)
        return { success: false, error: error.message || 'Unknown sync error' }
    }
}
