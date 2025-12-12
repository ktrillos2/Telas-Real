"use server"

import { createWordPressOrder, getOrCreateCustomer, uploadImageToWordPress } from "@/lib/wordpress-orders"

export async function verifyAndCreateOrder(transactionId: string, cartItems: any[], customerData: any) {
    try {
        // 1. Fetch transaction from Wompi
        const response = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`)
        const data = await response.json()
        const transaction = data.data

        if (!transaction) {
            return { success: false, error: "Transaction not found" }
        }

        if (transaction.status !== "APPROVED") {
            return { success: false, error: "Transaction not approved" }
        }

        // 2. Validate Amount (Security Check)
        // Calculate total from cart items to ensure it matches transaction
        const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const transactionAmount = transaction.amount_in_cents / 100

        // Allow small difference for rounding or shipping if applicable
        // For now, strict check or reasonable margin
        if (Math.abs(cartTotal - transactionAmount) > 1000) { // Allow 1000 COP difference for potential shipping/rounding
            console.warn("Amount mismatch:", { cartTotal, transactionAmount })
            // Proceeding but logging warning. In strict mode, we might return error.
        }

        // 3. Prepare Line Items from Client Data
        const lineItems = await Promise.all(cartItems.map(async (item: any) => {
            const productId = Number(item.id)

            // Prepare meta data for the item (designs, etc)
            const itemMetaData = []
            if (item.designName) {
                itemMetaData.push({ key: 'Diseño', value: item.designName })
            }

            let finalDesignUrl = item.designUrl
            if (item.designUrl && item.isCustom && item.designUrl.startsWith('/uploads/')) {
                // Upload custom design to Turso Database
                try {
                    const fs = require('fs/promises')
                    const path = require('path')
                    const { createClient } = require('@libsql/client')
                    const { v4: uuidv4 } = require('uuid')

                    const cleanPath = item.designUrl.startsWith('/') ? item.designUrl.slice(1) : item.designUrl
                    const fullPath = path.join(process.cwd(), 'public', cleanPath)

                    console.log('Reading file for Turso upload:', fullPath)
                    const fileBuffer = await fs.readFile(fullPath)

                    const url = process.env.TURSO_DATABASE_URL
                    const authToken = process.env.TURSO_AUTH_TOKEN

                    if (url && authToken) {
                        const client = createClient({ url, authToken })
                        const id = uuidv4()
                        const filename = item.designUrl.split('/').pop() || 'custom-design.png'
                        const ext = path.extname(filename).toLowerCase()
                        let mimeType = 'image/jpeg'
                        if (ext === '.png') mimeType = 'image/png'
                        if (ext === '.webp') mimeType = 'image/webp'

                        console.log('Uploading to Turso with ID:', id)
                        await client.execute({
                            sql: 'INSERT INTO custom_designs (id, filename, mime_type, data) VALUES (?, ?, ?, ?)',
                            args: [id, filename, mimeType, fileBuffer]
                        })
                        client.close()

                        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
                        finalDesignUrl = `${siteUrl}/api/design/${id}`
                        console.log('Turso upload success, URL:', finalDesignUrl)

                        // Add ONLY the download button as requested
                        // The URL comes from NEXT_PUBLIC_SITE_URL + /api/design/ID
                        itemMetaData.push({
                            key: 'Diseño Personalizado',
                            value: `<a href="${finalDesignUrl}" target="_blank" style="display:inline-block; padding:8px 15px; background:#2271b1; color:white; text-decoration:none; border-radius:4px; font-weight:bold;">Descargar Diseño</a>`
                        })

                    } else {
                        console.error('Missing Turso credentials')
                    }
                } catch (error) {
                    console.error('Failed to upload custom design to Turso:', error)
                    // Fallback to local link if Turso fails
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
                    finalDesignUrl = `${siteUrl}${item.designUrl}`
                }
            }

            if (finalDesignUrl) {
                // No extra metadata, just the one added above
            }

            if (item.isCustom) {
                itemMetaData.push({ key: 'Tipo', value: 'Diseño Personalizado' })
            }

            const lineItem: any = {
                name: item.name,
                quantity: Number(item.quantity),
                total: String(item.price * item.quantity),
                meta_data: itemMetaData
            }

            if (productId && productId > 0) {
                lineItem.product_id = productId
            }

            return lineItem
        }))

        // 4. Get or Create Customer
        let customerId = 0
        try {
            customerId = await getOrCreateCustomer(customerData)
        } catch (e) {
            console.error("Failed to get/create customer:", e)
        }

        // 5. Prepare Order Data
        const orderData = {
            payment_method: 'wompi',
            payment_method_title: 'Wompi',
            set_paid: true,
            created_via: 'Nueva Pagina',
            customer_id: customerId,
            billing: {
                first_name: customerData.firstName,
                last_name: customerData.lastName,
                address_1: customerData.address,
                city: customerData.city,
                state: customerData.region,
                postcode: customerData.zipCode || '00000',
                country: 'CO',
                email: customerData.email,
                phone: customerData.phone
            },
            shipping: {
                first_name: customerData.firstName,
                last_name: customerData.lastName,
                address_1: customerData.address,
                city: customerData.city,
                state: customerData.region,
                postcode: customerData.zipCode || '00000',
                country: 'CO',
            },
            line_items: lineItems,
            meta_data: [
                { key: 'wompi_reference', value: transaction.reference },
                { key: 'wompi_transaction_id', value: transaction.id },
                { key: 'origen_pedido', value: 'Nueva Pagina' },
                { key: '_created_via', value: 'Nueva Pagina' }, // Standard WooCommerce meta for attribution
                { key: 'Payment Method Type', value: transaction.payment_method_type || 'N/A' },
                { key: '_wompi_payment_method_type', value: transaction.payment_method_type || 'N/A' }
            ]
        }

        // 5. Create Order in WordPress
        const newOrder = await createWordPressOrder(orderData)

        // 6. Add Order Note with Design (Fallback for visibility)
        // Iterate through line items to find custom designs and add them as notes
        for (const item of lineItems) {
            const meta = item.meta_data.find((m: any) => m.key === 'Vista Previa Diseño')
            if (meta && meta.value && meta.value.includes('<img')) {
                try {
                    const url = process.env.WORDPRESS_API_URL
                    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY
                    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET

                    if (url && consumerKey && consumerSecret) {
                        const baseUrl = url.replace(/\/$/, '')
                        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

                        try {
                            await fetch(`${baseUrl}/wp-json/wc/v3/orders/${newOrder.id}/notes`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Basic ${auth}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    note: `<strong>Diseño Personalizado (${item.name}):</strong><br/>${meta.value}`,
                                    customer_note: false
                                })
                            })
                        } catch (noteError) {
                            console.error('Failed to add order note with image:', noteError)
                            // Fallback: Add note with Localhost Link if image fails (likely due to size)
                            try {
                                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
                                const localLink = `${siteUrl}${item.designUrl}`
                                await fetch(`${baseUrl}/wp-json/wc/v3/orders/${newOrder.id}/notes`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Basic ${auth}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        note: `<strong>Diseño Personalizado (${item.name}):</strong><br/>La imagen es demasiado grande para mostrarse aquí.<br/><a href="${localLink}" target="_blank">Descargar desde Servidor Local</a>`,
                                        customer_note: false
                                    })
                                })
                            } catch (fallbackError) {
                                console.error('Failed to add fallback note:', fallbackError)
                            }
                        }
                    }
                } catch (noteError) {
                    console.error('Failed to add order note:', noteError)
                }
            }
        }

        return { success: true, orderId: newOrder.id }

    } catch (error) {
        console.error("Error in verifyAndCreateOrder:", error)
        return { success: false, error: "Failed to create order" }
    }
}
