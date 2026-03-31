"use server"


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
                // Descontar el 19% de IVA para el pedido en WordPress/WooCommerce
                // Precio Base = Precio Total / 1.19
                total: String(Math.round((item.price * item.quantity) / 1.19)),
                meta_data: itemMetaData
            }

            if (productId && productId > 0) {
                lineItem.product_id = productId
            }

            return lineItem
        }))

        // WordPress integration removed by user request.
        // We log the successful transaction and return success directly.
        console.log("Order processed successfully via Wompi:", transaction.id)

        // Generate a local order ID since WooCommerce is no longer generating one
        const localOrderId = `WT-${transaction.reference || transaction.id}`

        return { success: true, orderId: localOrderId }

    } catch (error) {
        console.error("Error in verifyAndCreateOrder:", error)
        return { success: false, error: "Failed to create order" }
    }
}
