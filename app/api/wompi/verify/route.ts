import { NextResponse } from 'next/server'
import { fetchWompiTransaction, syncWompiTransactionToOrder } from '@/lib/wompi-sync'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
})

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const transactionId = searchParams.get('id')
        const orderIdParam = searchParams.get('orderId')
        const env = searchParams.get('env')

        console.log(`[Wompi Verify API] Verifying transaction: ${transactionId}, orderId: ${orderIdParam}`)

        if (transactionId) {
            // Fetch transaction securely from Wompi API
            const transaction = await fetchWompiTransaction(transactionId, env)

            if (transaction) {
                // If reference is missing in transaction, use orderIdParam
                if (!transaction.reference && orderIdParam) {
                    transaction.reference = orderIdParam
                }

                // Sync directly to order
                const syncResult = await syncWompiTransactionToOrder(transaction)

                return NextResponse.json({
                    success: true,
                    status: transaction.status,
                    transaction: {
                        id: transaction.id,
                        status: transaction.status,
                        reference: transaction.reference,
                        amount_in_cents: transaction.amount_in_cents,
                        payment_method_type: transaction.payment_method_type || transaction.payment_method?.type,
                        status_message: transaction.status_message,
                    },
                    sync: syncResult,
                })
            }
        }

        // If no transaction or fetch failed, fallback to querying Sanity order
        if (orderIdParam) {
            const numericMatch = orderIdParam.match(/\d+/)
            const numericRef = numericMatch ? numericMatch[0] : ''

            const order = await sanityClient.fetch(
                `*[_type == "order" && (_id == $orderIdParam || orderNumber == $orderIdParam || orderNumber == $numericRef)][0]{
                    _id,
                    orderNumber,
                    status,
                    wompiStatus,
                    wompiTransactionId,
                    total
                }`,
                { orderIdParam, numericRef }
            )

            if (order) {
                return NextResponse.json({
                    success: true,
                    status: order.wompiStatus || (order.status === 'paid' ? 'APPROVED' : 'PENDING'),
                    order,
                })
            }
        }

        return NextResponse.json(
            { success: false, error: 'Transaction not found in Wompi or Sanity' },
            { status: 404 }
        )
    } catch (error: any) {
        console.error('[Wompi Verify API] Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
